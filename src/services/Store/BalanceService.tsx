import {
  getTokensBalance,
  getTokenBalances as getTokenBalancesFromEthScan,
  BalanceMap as EthScanBalanceMap
} from '@mycrypto/eth-scan';
import { default as BN } from 'bignumber.js';
import { bigNumberify, BigNumber } from 'ethers/utils/bignumber';
import { BigNumber as EthScanBN } from '@ethersproject/bignumber';

import { TAddress, StoreAccount, StoreAsset, Asset, Network, TBN } from '@types';
import { ProviderHandler } from '@services/EthService';
import { CeloProviderHandler } from '@services/EthService/network';
import { AccountBalance } from '@services/EthService/network/celoProviderHandler';
import { bigify } from '@utils';

export interface ExtendedAccountBalance extends AccountBalance {
  address: string;
}

export type BalanceMap<T = BN> = EthScanBalanceMap<T>;

export interface BaseAssetsBalanceMap {
  [key: string]: AccountBalance;
}

const getAssetAddresses = (assets: Asset[] = []): (string | undefined)[] => {
  return assets.map((a) => a.contractAddress).filter((a) => a);
};

export const convertBNToBigNumberJS = (bn: EthScanBN): BN => {
  return new BN(bn._hex);
};

export const toBigNumberJS = (balances: EthScanBalanceMap): BalanceMap => {
  return Object.fromEntries(
    Object.keys(balances).map((key) => [key, convertBNToBigNumberJS(balances[key])])
  );
};

export const nestedToBigNumberJS = (
  balances: EthScanBalanceMap<EthScanBalanceMap>
): BalanceMap<BalanceMap> => {
  return Object.fromEntries(
    Object.keys(balances).map((key) => [key, toBigNumberJS(balances[key])])
  );
};

interface BaseAssetBalanceMap {
  [address: string]: TotalAccountBalanceMap;
}

interface TotalAccountBalanceMap {
  usd: BigNumber;
  gold: BigNumber;
  total: BigNumber;
  pending: BigNumber;
  lockedGold: BigNumber;
}

const addBalancesToAccount = (account: StoreAccount) => ([baseBalance, tokenBalances]: [
  BaseAssetBalanceMap,
  BalanceMap
]) => ({
  ...account,
  assets: account.assets
    .map((asset) => {
      switch (asset.type) {
        case 'base': {
          const balances = baseBalance[account.address];
          return {
            ...asset,
            balance: balances
              ? balances[
                  asset.celoIdentifier! as 'usd' | 'gold' | 'lockedGold' | 'pending' | 'total'
                ].toString()
              : asset.balance
          };
        }
        case 'erc20': {
          const balance = tokenBalances[asset.contractAddress!];
          return {
            ...asset,
            balance: balance ? balance.toString(10) : asset.balance
          };
        }
        default:
          return asset;
      }
    })
    .map((asset) => ({ ...asset, balance: bigNumberify(asset.balance) }))
});

// @todo: figure this ethscan stuff out
// const getAccountAssetsBalancesWithEthScan = async (account: StoreAccount) => {
//   const list = getAssetAddresses(account.assets) as string[];
//   const provider = ProviderHandler.fetchProvider(account.network);
//   return Promise.all([
//     getEtherBalances(provider, [account.address]).then(toBigNumberJS),
//     getTokensBalance(provider, account.address, list).then(toBigNumberJS)
//   ])
//     .then(addBalancesToAccount(account))
//     .catch((_) => account);
// };

// export const getBaseAssetBalances = async (addresses: string[], network: Network | undefined) => {
//   if (!network) {
//     return ([] as unknown) as BalanceMap;
//   }
//   const provider = ProviderHandler.fetchProvider(network);
//   return getEtherBalances(provider, addresses)
//     .then((data) => {
//       return data;
//     })
//     .catch((_) => ([] as unknown) as BalanceMap);
// };

const getTokenBalances = (
  provider: ProviderHandler,
  address: TAddress,
  tokens: StoreAsset[]
): Promise<BalanceMap> => {
  return tokens
    .reduce<Promise<EthScanBalanceMap>>(async (balances, token) => {
      return {
        ...balances,
        [token.contractAddress as TAddress]: await provider.getRawTokenBalance(address, token)
      };
    }, Promise.resolve<EthScanBalanceMap>({}))
    .then(toBigNumberJS);
};

const getAccountAssetsBalancesWithJsonRPC = async (
  account: StoreAccount
): Promise<StoreAccount> => {
  const { address, assets, network } = account;
  const provider = new ProviderHandler(network);
  const celoProvider = new CeloProviderHandler(network);
  const tokens = assets.filter((a: StoreAsset) => a.type === 'erc20');
  return Promise.all([
    celoProvider
      .getTotalBalance(account.address)
      // @ts-ignore The types mismatch due to versioning of ContractKitProvider
      .then((accountBalance) => ({
        gold: new BigNumber(accountBalance.gold.toString()),
        usd: new BigNumber(accountBalance.usd.toString()),
        lockedGold: new BigNumber(accountBalance.lockedGold.toString()),
        pending: new BigNumber(accountBalance.pending.toString()),
        total: new BigNumber(accountBalance.total.toString())
      }))
      // @ts-ignore The types mismatch due to versioning of ContractKitProvider
      .then((balance) => ({ [address]: balance })),
    getTokenBalances(provider, address, tokens)
  ])
    .then(addBalancesToAccount(account))
    .catch((_) => account);
};

export const getAccountsAssetsBalances = async (accounts: StoreAccount[]) => {
  // for the moment EthScan is only deployed on Celo, so we use JSON_RPC to get the
  // balance for the accounts on the other networks.
  /* @todo: figure this ethscan stuff out */
  // const [ethScanCompatibleAccounts, jsonRPCAccounts] = partition(accounts, (account) =>
  //   ETHSCAN_NETWORKS.some((supportedNetwork) => account && account.networkId === supportedNetwork)
  // );
  // ...ethScanCompatibleAccounts.map(getAccountAssetsBalancesWithEthScan),
  const updatedAccounts = await Promise.all(
    [...accounts.map(getAccountAssetsBalancesWithJsonRPC)].map((p) =>
      p.catch((e) => console.debug(e))
    ) // convert Promise.all ie. into allSettled https://dev.to/vitalets/what-s-wrong-with-promise-allsettled-and-promise-any-5e6o
  );

  const filterZeroBN = (n: TBN) => n.isZero();

  const filteredUpdatedAccounts = updatedAccounts.map((updatedAccount) => ({
    ...updatedAccount,
    assets:
      (updatedAccount &&
        updatedAccount.assets &&
        updatedAccount.assets.filter(
          ({ balance, type }) => !filterZeroBN(balance) || type === 'base'
        )) ||
      []
  }));

  return filteredUpdatedAccounts;
};

export const getAllTokensBalancesOfAccountFromEthScan = async (
  account: StoreAccount,
  assets: Asset[]
) => {
  const provider = account.network.nodes[0];
  const assetsInNetwork = assets.filter((x) => x.networkId === account.network.id);
  const assetAddresses = getAssetAddresses(assetsInNetwork) as string[];
  return getTokensBalance(provider, account.address, assetAddresses).then(toBigNumberJS);
};

export const getBaseAssetBalances = async (
  addresses: string[],
  network: Network | undefined
): Promise<BaseAssetsBalanceMap> => {
  if (!network) {
    return ([] as never) as Promise<BaseAssetsBalanceMap>;
  }
  const celoProvider = new CeloProviderHandler(network);
  try {
    return Promise.all(
      addresses.map((address) => {
        const z = celoProvider.getTotalBalance(address);
        console.debug('z');
        return { ...z, address };
      })
    ).then((accountBalances: ExtendedAccountBalance[]) => {
      const z = accountBalances.reduce((acc, item) => ({ ...acc, [item.address]: item }), {});
      return z;
    });
  } catch (err) {
    throw new Error(err);
  }
};

export const getAccountsTokenBalanceFromEthScan = async (
  accounts: StoreAccount[],
  tokenContract: string
) => {
  const provider = accounts[0].network.nodes[0];
  try {
    return getTokenBalancesFromEthScan(
      provider,
      accounts.map((account) => account.address),
      tokenContract
    ).then(toBigNumberJS);
  } catch (err) {
    throw new Error(err);
  }
};

export const getAccountsTokenBalances = (account: StoreAccount, tokenAssets: Asset[]) => {
  const provider = new ProviderHandler(account.network);
  return Promise.all(
    tokenAssets.map((token) => {
      return provider.getTokenBalance(account.address, token).then((balance) => ({
        ...token,
        balance: bigify(balance)
      }));
    })
  );
  // return getTokensBalances(
  //   provider,
  //   accounts.map((account) => account.address),
  //   tokenContracts
  // ).then(nestedToBigNumberJS);
};
