import React, { useState, useContext, useMemo, createContext, useEffect } from 'react';
import prop from 'ramda/src/prop';
import uniqBy from 'ramda/src/uniqBy';
import sortBy from 'ramda/src/sortBy';
import isEmpty from 'lodash/isEmpty';

import {
  TAddress,
  IRawAccount,
  StoreAccount,
  StoreAsset,
  Network,
  TTicker,
  ExtendedAsset,
  IAccount,
  WalletId,
  Asset,
  NetworkId,
  Contact,
  TUuid,
  ReserveAsset,
  IPendingTxReceipt,
  IAccountAdditionData
} from '@types';
import {
  isArrayEqual,
  useInterval,
  convertToFiatFromAsset,
  getWeb3Config,
  multiplyBNFloats,
  weiToFloat,
  generateAccountUUID,
  useAnalytics,
  isSameAddress,
  sortByLabel
} from '@utils';
import { ProviderHandler, getTxStatus, getTimestampFromBlockNum } from '@services/EthService';
import { isEmpty as isVoid } from '@vendor';
import { makeFinishedTxReceipt } from '@utils/transaction';

import { getAccountsAssetsBalances } from './BalanceService';
import {
  getStoreAccounts,
  getPendingTransactionsFromAccounts,
  isNotExcludedAsset
} from './helpers';
import {
  getTotalByAsset,
  getAssetByTicker,
  getNewDefaultAssetTemplateByNetwork,
  useAssets
} from './Asset';
import { AccountContext, getDashboardAccounts } from './Account';
import { SettingsContext } from './Settings';
import { getNetworkById, useNetworks } from './Network';
import { findNextUnusedDefaultLabel, useContacts } from './Contact';
import { MyCryptoApiService, ANALYTICS_CATEGORIES } from '../ApiService';
import { findMultipleNextUnusedDefaultLabels } from './Contact/helpers';
import { translateRaw } from '@translations';

export interface CoinGeckoManifest {
  [uuid: string]: string;
}

interface IAddAccount {
  address: TAddress;
  dPath: string;
}

export interface State {
  readonly defaultAccount: StoreAccount;
  readonly accounts: StoreAccount[];
  readonly networks: Network[];
  readonly currentAccounts: StoreAccount[];
  readonly userAssets: Asset[];
  readonly coinGeckoAssetManifest: CoinGeckoManifest;
  readonly accountRestore: { [name: string]: IAccount | undefined };
  isDefault: boolean;
  tokens(selectedAssets?: StoreAsset[]): StoreAsset[];
  assets(selectedAccounts?: StoreAccount[]): StoreAsset[];
  totals(selectedAccounts?: StoreAccount[]): StoreAsset[];
  totalFiat(
    selectedAccounts?: StoreAccount[]
  ): (getAssetRate: (asset: Asset) => number | undefined) => number;
  assetTickers(targetAssets?: StoreAsset[]): TTicker[];
  assetUUIDs(targetAssets?: StoreAsset[]): any[];
  scanAccountTokens(account: StoreAccount, asset?: ExtendedAsset): Promise<void>;
  scanTokens(asset?: ExtendedAsset): Promise<void>;
  deleteAccountFromCache(account: IAccount): void;
  restoreDeletedAccount(accountId: TUuid): void;
  addMultipleAccounts(
    networkId: NetworkId,
    walletId: WalletId | undefined,
    accounts: IAccountAdditionData[]
  ): IAccount[] | undefined;
  addAccount(
    networkId: NetworkId,
    address: string,
    accountType: WalletId | undefined,
    dPath: string
  ): IRawAccount | undefined;
  getAssetByTicker(ticker: TTicker): Asset | undefined;
  getAccount(a: IRawAccount): StoreAccount | undefined;
  getDeFiAssetReserveAssets(
    asset: StoreAsset
  ): (
    getPoolAssetReserveRate: (poolTokenUUID: string, assets: Asset[]) => ReserveAsset[]
  ) => StoreAsset[];
}
export const StoreContext = createContext({} as State);

// App Store that combines all data values required by the components such
// as accounts, currentAccount, tokens, and fiatValues etc.
export const StoreProvider: React.FC = ({ children }) => {
  const {
    accounts: rawAccounts,
    addNewTxToAccount,
    getAccountByAddressAndNetworkName,
    updateAccountAssets,
    updateAllAccountsAssets,
    updateAccountsBalances,
    deleteAccount,
    createAccountWithID,
    createMultipleAccountsWithIDs
  } = useContext(AccountContext);
  const { assets, addAssetsFromAPI } = useAssets();
  const { settings, updateSettingsAccounts } = useContext(SettingsContext);
  const { networks } = useNetworks();
  const { createContact, contacts, getContactByAddressAndNetworkId, updateContact } = useContacts();

  const [accountRestore, setAccountRestore] = useState<{ [name: string]: IAccount | undefined }>(
    {}
  );

  const [pendingTransactions, setPendingTransactions] = useState([] as IPendingTxReceipt[]);
  // We transform rawAccounts into StoreAccount. Since the operation is exponential to the number of
  // accounts, make sure it is done only when rawAccounts change.
  const accounts = useMemo(() => getStoreAccounts(rawAccounts, assets, networks, contacts), [
    rawAccounts,
    assets,
    contacts,
    networks
  ]);
  const currentAccounts = useMemo(
    () => getDashboardAccounts(accounts, settings.dashboardAccounts),
    [rawAccounts, settings.dashboardAccounts, assets]
  );

  // Naive polling to get the Balances of baseAsset and tokens for each account.
  useInterval(
    () => {
      // Pattern to cancel setState call if ever the component is unmounted
      // before the async requests completes.
      // @todo: extract into seperate hook e.g. react-use
      // https://www.robinwieruch.de/react-hooks-fetch-data
      let isMounted = true;
      getAccountsAssetsBalances(currentAccounts).then((accountsWithBalances: StoreAccount[]) => {
        // Avoid the state change if the balances are identical.
        if (isMounted && !isArrayEqual(currentAccounts, accountsWithBalances.filter(Boolean))) {
          updateAccountsBalances(accountsWithBalances);
        }
      });

      return () => {
        isMounted = false;
      };
    },
    60000,
    true,
    [currentAccounts]
  );

  useAnalytics({
    category: ANALYTICS_CATEGORIES.ROOT,
    actionName: accounts.length === 0 ? 'New User' : 'Returning User',
    eventParams: {
      visitStartAccountNumber: accounts.length
    },
    triggerOnMount: true
  });

  useEffect(() => {
    setPendingTransactions(getPendingTransactionsFromAccounts(currentAccounts));
  }, [currentAccounts]);

  // fetch assets from api
  useEffect(() => {
    MyCryptoApiService.instance.getAssets().then(addAssetsFromAPI);
  }, [assets.length]);

  // A change to pending txs is detected
  useEffect(() => {
    if (pendingTransactions.length === 0) return;
    // A pending transaction is detected.
    let isMounted = true;
    // This interval is used to poll for status of txs.
    const txStatusLookupInterval = setInterval(() => {
      pendingTransactions.forEach((pendingTxReceipt) => {
        const network = getNetworkById(pendingTxReceipt.asset.networkId, networks);
        // If network is not found in the pendingTransactionObject, we cannot continue.
        if (!network) return;
        const provider = new ProviderHandler(network);

        provider.getTransactionByHash(pendingTxReceipt.hash).then((txResponse) => {
          // Fail out if tx receipt cant be found.
          // This initial check stops us from spamming node for data before there is data to fetch.
          if (!txResponse || !txResponse.blockNumber) return;

          // Get block tx success/fail and timestamp for block number, then overwrite existing tx in account.
          Promise.all([
            getTxStatus(provider, pendingTxReceipt.hash),
            getTimestampFromBlockNum(txResponse.blockNumber, provider)
          ]).then(([txStatus, txTimestamp]) => {
            // txStatus and txTimestamp return undefined on failed lookups.
            if (!isMounted || !txStatus || !txTimestamp) return;
            const senderAccount = getAccountByAddressAndNetworkName(
              pendingTxReceipt.from,
              pendingTxReceipt.asset.networkId
            );
            if (!senderAccount) return;

            const finishedTxReceipt = makeFinishedTxReceipt(
              pendingTxReceipt,
              txStatus,
              txTimestamp,
              txResponse.blockNumber
            );
            addNewTxToAccount(senderAccount, finishedTxReceipt);
          });
        });
      });
    }, 5 * 1000); // Period to reset interval on
    return () => {
      isMounted = false;
      clearInterval(txStatusLookupInterval);
    };
  }, [pendingTransactions]);

  const coinGeckoAssetManifest =
    assets.reduce((manifest, asset) => {
      if (asset && asset.mappings && asset.mappings.coinGeckoId) {
        return { ...manifest, [asset.uuid]: asset.mappings.coinGeckoId };
      }
      return manifest;
    }, {}) || {};

  const state: State = {
    accounts,
    networks,
    currentAccounts,
    accountRestore,
    coinGeckoAssetManifest,
    get defaultAccount() {
      return sortByLabel(state.accounts)[0];
    },
    /**
     * Check if the user has already added an account to our persistence layer.
     */
    get isDefault() {
      return (
        (!state.accounts || isVoid(state.accounts)) && (!isVoid(contacts) || contacts.length < 1)
      );
    },
    get userAssets() {
      const userAssets = state.accounts
        .filter((a: StoreAccount) => a.wallet !== WalletId.VIEW_ONLY)
        .flatMap((a: StoreAccount) => a.assets)
        .filter(isNotExcludedAsset(settings.excludedAssets));
      const uniq = uniqBy(prop('uuid'), userAssets);
      return sortBy(prop('ticker'), uniq);
    },
    assets: (selectedAccounts = state.accounts) =>
      selectedAccounts.flatMap((account: StoreAccount) => account.assets),
    tokens: (selectedAssets = state.assets()) =>
      selectedAssets.filter((asset: StoreAsset) => asset.type !== 'base'),
    totals: (selectedAccounts = state.accounts) =>
      Object.values(getTotalByAsset(state.assets(selectedAccounts))),
    totalFiat: (selectedAccounts = state.accounts) => (
      getAssetRate: (asset: Asset) => number | undefined
    ) =>
      state
        .totals(selectedAccounts)
        .reduce((sum, asset) => (sum += convertToFiatFromAsset(asset, getAssetRate(asset))), 0),

    assetTickers: (targetAssets = state.assets()) => [
      ...new Set(targetAssets.map((a) => a.ticker))
    ],
    assetUUIDs: (targetAssets = state.assets()) => {
      return [...new Set(targetAssets.map((a: StoreAsset) => a.uuid))];
    },
    scanAccountTokens: async (account: StoreAccount, asset?: ExtendedAsset) =>
      updateAccountAssets(account, asset ? [...assets, asset] : assets),
    scanTokens: async (asset?: ExtendedAsset) =>
      updateAllAccountsAssets(accounts, asset ? [...assets, asset] : assets),
    deleteAccountFromCache: (account) => {
      setAccountRestore((prevState) => ({ ...prevState, [account.uuid]: account }));
      deleteAccount(account);
      updateSettingsAccounts(
        settings.dashboardAccounts.filter((dashboardUUID) => dashboardUUID !== account.uuid)
      );
    },
    restoreDeletedAccount: (accountId) => {
      const account = accountRestore[accountId];
      if (isEmpty(account)) {
        throw new Error('Unable to restore account! No account with id specified.');
      }

      const { uuid, ...restAccount } = account!;
      createAccountWithID(restAccount, uuid);
      setAccountRestore((prevState) => ({ ...prevState, [uuid]: undefined }));
    },
    addMultipleAccounts: (
      networkId: NetworkId,
      accountType: WalletId | undefined,
      newAccounts: IAddAccount[]
    ) => {
      const network: Network | undefined = getNetworkById(networkId, networks);
      if (!network || newAccounts.length === 0) return;
      const accountsToAdd = newAccounts.filter(
        ({ address }) => !getAccountByAddressAndNetworkName(address, networkId)
      );
      const walletType =
        accountType! === WalletId.WEB3 ? WalletId[getWeb3Config().id] : accountType!;
      const newAsset: Asset = getNewDefaultAssetTemplateByNetwork(assets)(network);
      const newRawAccounts = accountsToAdd.map(({ address, dPath }) => ({
        address,
        networkId,
        wallet: walletType,
        dPath,
        assets: [{ uuid: newAsset.uuid, balance: '0', mtime: Date.now() }],
        transactions: [],
        favorite: false,
        mtime: 0,
        uuid: generateAccountUUID(networkId, address)
      }));
      if (newRawAccounts.length === 0) return;
      const newLabels = findMultipleNextUnusedDefaultLabels(
        newRawAccounts[0].wallet,
        newRawAccounts.length
      )(contacts);
      newRawAccounts.forEach((rawAccount, idx) => {
        const existingContact = getContactByAddressAndNetworkId(rawAccount.address, networkId);
        if (existingContact && existingContact.label === translateRaw('NO_LABEL')) {
          updateContact(existingContact.uuid, {
            ...existingContact,
            label: newLabels[idx]
          });
        } else if (!existingContact) {
          const newLabel: Contact = {
            label: newLabels[idx],
            address: rawAccount.address,
            notes: '',
            network: rawAccount.networkId
          };
          createContact(newLabel);
        }
      });
      createMultipleAccountsWithIDs(newRawAccounts);
      return newRawAccounts;
    },
    addAccount: (
      networkId: NetworkId,
      address: TAddress,
      accountType: WalletId | undefined,
      dPath: string
    ) => {
      const network: Network | undefined = getNetworkById(networkId, networks);
      if (!network || !address || !!getAccountByAddressAndNetworkName(address, networkId)) return;

      const walletType =
        accountType! === WalletId.WEB3 ? WalletId[getWeb3Config().id] : accountType!;
      const newAsset: Asset = getNewDefaultAssetTemplateByNetwork(assets)(network);
      const accountUUID = generateAccountUUID(networkId, address);
      const account: IRawAccount = {
        address,
        networkId,
        wallet: walletType,
        dPath,
        assets: [{ uuid: newAsset.uuid, balance: '0', mtime: Date.now() }],
        transactions: [],
        favorite: false,
        mtime: 0
      };

      const existingContact = getContactByAddressAndNetworkId(account.address, networkId);
      if (existingContact) {
        updateContact(existingContact.uuid, {
          ...existingContact,
          label: findNextUnusedDefaultLabel(account.wallet)(contacts)
        });
      } else {
        const newLabel: Contact = {
          label: findNextUnusedDefaultLabel(account.wallet)(contacts),
          address: account.address,
          notes: '',
          network: account.networkId
        };
        createContact(newLabel);
      }
      createAccountWithID(account, accountUUID);

      return account;
    },
    getAssetByTicker: getAssetByTicker(assets),
    getAccount: ({ address, networkId }) =>
      accounts.find((a) => isSameAddress(a.address, address) && a.networkId === networkId),
    getDeFiAssetReserveAssets: (poolAsset: StoreAsset) => (
      getPoolAssetReserveRate: (poolTokenUuid: string, assets: Asset[]) => ReserveAsset[]
    ) =>
      getPoolAssetReserveRate(poolAsset.uuid, assets).map((reserveAsset) => ({
        ...reserveAsset,
        balance: multiplyBNFloats(
          weiToFloat(poolAsset.balance, poolAsset.decimal).toString(),
          reserveAsset.reserveExchangeRate
        ),
        mtime: Date.now()
      }))
  };

  return <StoreContext.Provider value={state}>{children}</StoreContext.Provider>;
};
