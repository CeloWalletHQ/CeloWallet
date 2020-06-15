import { IStory, WalletId } from '@types';
import { IS_DEV, IS_ELECTRON, hasWeb3Provider } from '@utils';
import {
  InsecureWalletWarning,
  LedgerNanoSDecrypt,
  KeystoreDecrypt,
  MnemonicDecrypt,
  PrivateKeyDecrypt,
  TrezorDecrypt,
  Web3ProviderDecrypt,
  Web3ProviderInstall,
  ViewOnlyDecrypt,
  WalletConnectDecrypt
} from '@components';
import { withWalletConnect } from '@services/WalletService';

import { NetworkSelectPanel } from './components';
import { IS_ACTIVE_FEATURE } from '@config/isActiveFeature';

// This const is used to disable non supported wallets
// only if it is not the Desktop App and not the Dev environment
export const IS_NOT_ELECTRON_AND_IS_NOT_DEV: boolean = !IS_ELECTRON && !IS_DEV;

export const getStories = (): IStory[] => [
  {
    name: WalletId.WEB3,
    steps: hasWeb3Provider() ? [Web3ProviderDecrypt] : [Web3ProviderInstall],
    isDisabled: !IS_ACTIVE_FEATURE.WEB3 // && IS_ELECTRON
  },
  {
    name: WalletId.WALLETCONNECT,
    steps: [NetworkSelectPanel, withWalletConnect(WalletConnectDecrypt)],
    hideFromWalletList: !IS_ACTIVE_FEATURE.WALLETCONNECT
  },
  {
    name: WalletId.LEDGER_NANO_S,
    steps: [NetworkSelectPanel, LedgerNanoSDecrypt],
    isDisabled: !IS_ACTIVE_FEATURE.LEDGER
  },
  {
    name: WalletId.TREZOR,
    steps: [NetworkSelectPanel, TrezorDecrypt],
    isDisabled: !IS_ACTIVE_FEATURE.TREZOR
  },
  {
    name: WalletId.KEYSTORE_FILE,
    steps: [NetworkSelectPanel, IS_DEV || IS_ELECTRON ? KeystoreDecrypt : InsecureWalletWarning],
    isDisabled: !IS_ACTIVE_FEATURE.KEYSTORE // && IS_NOT_ELECTRON_AND_IS_NOT_DEV
  },
  {
    name: WalletId.PRIVATE_KEY,
    steps: [NetworkSelectPanel, IS_DEV || IS_ELECTRON ? PrivateKeyDecrypt : InsecureWalletWarning],
    isDisabled: !IS_ACTIVE_FEATURE.PRIVATE_KEY // && IS_NOT_ELECTRON_AND_IS_NOT_DEV
  },
  {
    name: WalletId.MNEMONIC_PHRASE,
    steps: [NetworkSelectPanel, IS_DEV || IS_ELECTRON ? MnemonicDecrypt : InsecureWalletWarning],
    isDisabled: !IS_ACTIVE_FEATURE.MNEMONIC // && IS_NOT_ELECTRON_AND_IS_NOT_DEV
  },
  {
    name: WalletId.VIEW_ONLY,
    steps: [NetworkSelectPanel, ViewOnlyDecrypt],
    isDisabled: !IS_ACTIVE_FEATURE.VIEW_ONLY
  }
];
