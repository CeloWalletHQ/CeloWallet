import { Overwrite } from 'utility-types';
import { TAddress, AssetBalanceObject, TTicker, IRawAccount, WalletId, TUuid } from '@types';

export interface SeedAssetBalance extends AssetBalanceObject {
  ticker: TTicker;
}

export type DevAccount = Overwrite<
  IRawAccount,
  {
    assets: SeedAssetBalance[];
  }
>;

export const devAccounts: DevAccount[] = [
  {
    address: '0xc7bfc8a6bd4e52bfe901764143abef76caf2f912' as TAddress,
    networkId: 'Celo',
    assets: [
      {
        uuid: '10e14757-78bb-4bb2-a17a-8333830f6698' as TUuid,
        ticker: 'CUSD' as TTicker,
        balance: '100000000000000',
        mtime: Date.now()
      },
      {
        uuid: 'f7e30bbe-08e2-41ce-9231-5236e6aab702' as TUuid,
        ticker: 'CGLD' as TTicker,
        balance: '100000000000000',
        mtime: Date.now()
      }
    ],
    wallet: WalletId.METAMASK,
    dPath: `m/44'/60'/0'/0/0`,
    transactions: [],
    mtime: Date.now(),
    favorite: true
  },

  {
    address: '0x82d69476357a03415e92b5780c89e5e9e972ce75' as TAddress,
    networkId: 'Baklava',
    assets: [
      {
        uuid: '01f2d4ec-c263-6ba8-de38-01d66c86f309' as TUuid,
        ticker: 'BaklavaCGLD' as TTicker,
        balance: '5000000000000000000',
        mtime: Date.now()
      },
      {
        uuid: 'ffb050ad-968c-1b7a-66d1-376e1e446e2f' as TUuid,
        ticker: 'DAI' as TTicker,
        balance: '10000000000000000000',
        mtime: Date.now()
      },
      {
        uuid: 'abd99e06-5af1-17b6-c3ea-361785b38acc' as TUuid,
        ticker: 'BAT' as TTicker,
        balance: '1000000000000000000',
        mtime: Date.now()
      },
      {
        uuid: '0bc4af47-39a0-df9f-1001-ce46c3b91998' as TUuid,
        ticker: 'OMG' as TTicker,
        balance: '10000000000000000000',
        mtime: Date.now()
      }
    ],
    wallet: WalletId.METAMASK,
    dPath: `m/44'/60'/0'/0/0`,
    transactions: [],
    mtime: Date.now(),
    favorite: true
  },
  {
    address: '0x8fe684ae26557DfFF70ceE9a4Ff5ee7251a31AD5' as TAddress,
    networkId: 'Baklava',
    assets: [
      {
        uuid: '89397517-5dcb-9cd1-76b5-224e3f0ace80' as TUuid,
        ticker: 'RinkebyETH' as TTicker,
        balance: '5000000000000000000',
        mtime: Date.now()
      },
      {
        uuid: 'ccafaddd-16bc-2d61-b40d-5ccaac7e9ad0' as TUuid,
        ticker: 'DAI' as TTicker,
        balance: '2889036600000000000',
        mtime: Date.now()
      },
      {
        uuid: '0e22bc58-3a71-c6f7-c649-cd32e5bfcccc' as TUuid,
        ticker: 'BAT' as TTicker,
        balance: '43841287560000000000',
        mtime: Date.now()
      },
      {
        uuid: 'ae8388ab-fc6a-0655-9a74-2c04f438bde2' as TUuid,
        ticker: 'OMG' as TTicker,
        balance: '16822485830000000000',
        mtime: Date.now()
      }
    ],
    wallet: WalletId.METAMASK,
    dPath: `m/44'/60'/0'/0/0`,
    transactions: [],
    mtime: Date.now(),
    favorite: true
  }
];
