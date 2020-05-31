import { bigNumberify } from 'ethers/utils';

import { ExtendedAsset, StoreAsset } from '@types';

export const fAssets = [
  {
    uuid: '356a192b-7913-504c-9457-4d18c28d46e6',
    name: 'Celo Gold',
    networkId: 'Celo',
    type: 'base',
    ticker: 'CGLD',
    decimal: 18
  },
  {
    uuid: '77de68da-ecd8-53ba-bbb5-8edb1c8e14d7',
    name: 'Baklava Celo Gold',
    networkId: 'Celo',
    type: 'base',
    ticker: 'CGLD',
    decimal: 18
  }
] as ExtendedAsset[];

export const fAsset: StoreAsset = Object.assign({}, fAssets[2], {
  balance: bigNumberify('0x1b9ced41465be000'),
  mtime: 1581530607024
});
