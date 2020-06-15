import BN from 'bn.js';
import { bufferToHex } from 'ethereumjs-util';

import { IFormikFields, ITxObject, Asset, IHexStrWeb3Transaction, TAddress } from '@types';

import {
  Address,
  toWei,
  TokenValue,
  inputGasPriceToHex,
  inputValueToHex,
  inputNonceToHex,
  inputGasLimitToHex,
  encodeTransfer
} from '@services/EthService';
import { donationAddressMap } from '@config';

const createBaseTxObject = (formData: IFormikFields): ITxObject => {
  const { network } = formData;
  return {
    to: formData.address.value,
    value: formData.amount ? inputValueToHex(formData.amount) : '0x0',
    data: formData.txDataField ? formData.txDataField : '0x0',
    gasLimit: inputGasLimitToHex(formData.gasLimitField),
    gasPrice: formData.advancedTransaction
      ? inputGasPriceToHex(formData.gasPriceField)
      : inputGasPriceToHex(formData.gasPriceSlider),
    nonce: inputNonceToHex(formData.nonceField),
    chainId: network.chainId ? network.chainId : 1,
    from: formData.account.address,
    feeCurrency: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9' as TAddress,
    gatewayFeeRecipient: donationAddressMap.CELO as TAddress,
    gatewayFee: '0x38d7ea4c68000'
  };
};

const createERC20TxObject = (formData: IFormikFields): ITxObject => {
  const { asset, network } = formData;
  return {
    to: asset.contractAddress!,
    value: '0x0',
    data: bufferToHex(
      encodeTransfer(
        Address(formData.address.value),
        formData.amount !== '' ? toWei(formData.amount, asset.decimal!) : TokenValue(new BN(0))
      )
    ),
    gasLimit: inputGasLimitToHex(formData.gasLimitField),
    gasPrice: formData.advancedTransaction
      ? inputGasPriceToHex(formData.gasPriceField)
      : inputGasPriceToHex(formData.gasPriceSlider),
    nonce: inputNonceToHex(formData.nonceField),
    chainId: network.chainId ? network.chainId : 1,
    from: formData.account.address,
    feeCurrency: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9' as TAddress,
    gatewayFeeRecipient: donationAddressMap.CELO as TAddress,
    gatewayFee: '0x38d7ea4c68000'
  };
};

export const isERC20Tx = (asset: Asset): boolean => {
  return !!(asset.type === 'erc20' && asset.contractAddress && asset.decimal);
};

export const processFormDataToTx = (formData: IFormikFields): ITxObject => {
  const transform = isERC20Tx(formData.asset) ? createERC20TxObject : createBaseTxObject;
  return transform(formData);
};

export const processFormForEstimateGas = (formData: IFormikFields): IHexStrWeb3Transaction => {
  const transform = isERC20Tx(formData.asset) ? createERC20TxObject : createBaseTxObject;
  // First we use destructuring to remove the `gasLimit` field from the object that is not used by IHexStrWeb3Transaction
  // then we add the extra properties required.
  const { gasLimit, ...tx } = transform(formData);
  return {
    ...tx,
    from: formData.account.address,
    gas: inputGasLimitToHex(formData.gasLimitField)
  };
};
