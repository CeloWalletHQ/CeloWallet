import { StoreAccount, NetworkId, ITxConfig, ITxObject } from '@types';
import { WALLET_STEPS } from '@components';
import { hexToString, hexWeiToString, getBaseAssetsByNetwork } from '@services';

export const getAccountsInNetwork = (accounts: StoreAccount[], networkId: NetworkId) =>
  accounts.filter((acc) => acc.networkId === networkId && WALLET_STEPS[acc.wallet]);

export const makeTxConfigFromTransaction = (
  rawTransaction: ITxObject,
  account: StoreAccount,
  amount: string
): ITxConfig => {
  const { gasPrice, gasLimit, nonce, data, to, value } = rawTransaction;
  const { address, network } = account;
  const baseAsset = getBaseAssetsByNetwork({ assets: account.assets, network })[0];
  const txConfig: ITxConfig = {
    from: address,
    amount,
    receiverAddress: to || '0x',
    senderAccount: account,
    network,
    asset: baseAsset,
    baseAsset,
    gasPrice: hexToString(gasPrice),
    gasLimit,
    value: hexWeiToString(value),
    nonce,
    data,
    rawTransaction
  };

  return txConfig;
};

export const constructGasCallProps = (data: string, account: StoreAccount) => ({
  from: account.address,
  value: '0x0',
  data
});
