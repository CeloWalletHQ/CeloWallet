import { ITxObject, TAddress } from '@types';
import { donationAddressMap } from '@config';

export const fTransaction: ITxObject = {
  to: '0x909f74Ffdc223586d0d30E78016E707B6F5a45E2',
  value: '0x38d7ea4c68000',
  data: '0x',
  gasLimit: '21000',
  gasPrice: '0xee6b2800',
  nonce: '0x9',
  chainId: 3,
  from: '0x909f74Ffdc223586d0d30E78016E707B6F5a45E2' as TAddress,
  feeCurrency: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9' as TAddress,
  gatewayFeeRecipient: donationAddressMap.CELO as TAddress,
  gatewayFee: '0x38d7ea4c68000'
};
