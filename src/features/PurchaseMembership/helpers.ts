import { AddressZero } from 'ethers/constants';

import {
  ITxObject,
  StoreAccount,
  ITxConfig,
  ITxReceipt,
  TxParcel,
  ITxType,
  ITxHash,
  ITxStatus,
  ITxSigned,
  TUuid
} from '@types';
import {
  inputValueToHex,
  inputGasPriceToHex,
  toWei,
  hexToString,
  hexWeiToString
} from '@services/EthService';
import { DEFAULT_NETWORK_CHAINID, DEFAULT_ASSET_DECIMAL } from '@config';
import { UnlockToken, ERC20 } from '@services/EthService/contracts';
import { getAssetByUUID, getBaseAssetsByNetwork } from '@services';

import { MembershipSimpleTxFormFull } from './types';
import { isERC20Tx } from '../SendAssets';
import { IMembershipConfig } from './config';

export const createApproveTx = (payload: MembershipSimpleTxFormFull): Partial<ITxObject> => {
  const data = ERC20.approve.encodeInput({
    _spender: payload.membershipSelected.contractAddress,
    _value: toWei(payload.membershipSelected.price, DEFAULT_ASSET_DECIMAL)
  });

  return {
    // @ts-ignore Contract Address should be set if asset is ERC20
    to: payload.asset.contractAddress,
    from: payload.account.address,
    data,
    chainId: DEFAULT_NETWORK_CHAINID,
    gasPrice: inputGasPriceToHex(payload.gasPrice),
    value: inputValueToHex('0')
  };
};

export const createPurchaseTx = (payload: MembershipSimpleTxFormFull): Partial<ITxObject> => {
  const membershipSelected = payload.membershipSelected;

  const weiPrice = toWei(membershipSelected.price, DEFAULT_ASSET_DECIMAL);
  const data = UnlockToken.purchase.encodeInput({
    _value: weiPrice,
    _recipient: payload.account.address,
    _referrer: AddressZero,
    _data: []
  });

  return {
    from: payload.account.address,
    to: membershipSelected.contractAddress,
    value: isERC20Tx(payload.asset) ? inputValueToHex('0') : inputValueToHex(payload.amount),
    data,
    gasPrice: inputGasPriceToHex(payload.gasPrice),
    chainId: DEFAULT_NETWORK_CHAINID
  };
};

export const makeTxConfigFromTransaction = (
  rawTransaction: ITxObject,
  account: StoreAccount,
  membershipSelected: IMembershipConfig
): ITxConfig => {
  const { gasPrice, gasLimit, nonce, data, to, value } = rawTransaction;
  const { address, network } = account;
  const baseAsset = getBaseAssetsByNetwork({ assets: account.assets, network })[0];
  const asset = getAssetByUUID(account.assets)(membershipSelected.assetUUID as TUuid)!;

  const txConfig: ITxConfig = {
    from: address,
    amount: membershipSelected.price,
    receiverAddress: to,
    senderAccount: account,
    network,
    asset,
    baseAsset,
    gasPrice: hexToString(gasPrice),
    gasLimit: hexToString(gasLimit),
    value: hexWeiToString(value),
    nonce: hexToString(nonce),
    data,
    rawTransaction
  };

  return txConfig;
};

export const makeTxReceiptFromTransaction = (
  tx: TxParcel,
  hash: ITxHash | ITxSigned,
  account: StoreAccount,
  membershipSelected: IMembershipConfig,
  type: ITxType
): ITxReceipt => {
  return {
    ...makeTxConfigFromTransaction(tx.txRaw, account, membershipSelected),
    ...tx.txRaw,
    hash,
    txType: type,
    stage: ITxStatus.PENDING
  };
};
