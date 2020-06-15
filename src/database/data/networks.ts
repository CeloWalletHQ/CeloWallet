// @TODO Used for unsupportedTabs. update to unsupportedPaths
// import { TAB } from 'components/Header/components/constants';

import { WalletId, NetworkId, TSymbol, NetworkLegacy, AssetLegacy } from '@types';
import { makeExplorer } from '@services/EthService/utils/makeExplorer';
import {
  DPathsList as DPaths,
  ethPlorer,
  ETHTokenExplorer,
  GAS_PRICE_TESTNET,
  GAS_PRICE_DEFAULT,
  DEFAULT_NETWORK_SYMBOL,
  DEFAULT_NETWORK
} from '@config';

import { Contracts } from './contracts';
import { Assets } from './tokens';

// Temporay type to bridge the difference between v1 and v2 network definitions.
export type NetworkConfig = {
  [key in NetworkId]: NetworkLegacy;
};

export const NETWORKS_CONFIG: NetworkConfig = {
  Celo: {
    id: DEFAULT_NETWORK, // Celo Network Id
    name: 'Celo',
    unit: DEFAULT_NETWORK_SYMBOL as TSymbol,
    chainId: 42220,
    isCustom: false,
    color: '#007896',
    blockExplorer: makeExplorer({
      name: 'BlockScout - Mainnet',
      origin: 'https://explorer.celo.org/'
    }),
    tokenExplorer: {
      name: ethPlorer,
      address: ETHTokenExplorer
    },
    tokens: Assets.Celo as AssetLegacy[],
    contracts: Contracts.Celo,
    dPaths: {
      [WalletId.LEDGER_NANO_S]: DPaths.CELO_LEDGER,
      [WalletId.MNEMONIC_PHRASE]: DPaths.CELO_LEDGER
    },
    gasPriceSettings: GAS_PRICE_DEFAULT,
    shouldEstimateGasPrice: true,
    mappings: {
      coinGeckoId: 'celo-gold'
    }
  },
  Baklava: {
    id: 'Baklava',
    name: 'Baklava',
    unit: 'Baklava CGLD' as TSymbol,
    chainId: 40120,
    isCustom: false,
    color: '#adc101',
    blockExplorer: makeExplorer({
      name: 'BlockScout - Baklava',
      origin: 'https://baklava-blockscout.celo-testnet.org/'
    }),
    tokens: Assets.Baklava as AssetLegacy[],
    contracts: Contracts.Baklava,
    isTestnet: true,
    dPaths: {
      [WalletId.LEDGER_NANO_S]: DPaths.CELO_LEDGER,
      [WalletId.MNEMONIC_PHRASE]: DPaths.CELO_LEDGER
    },
    gasPriceSettings: GAS_PRICE_TESTNET
  },
  Alfajores: {
    id: 'Alfajores',
    name: 'Alfajores',
    unit: 'Alfajores CGLD' as TSymbol,
    chainId: 44786,
    isCustom: false,
    color: '#adc101',
    blockExplorer: makeExplorer({
      name: 'Blockscout - Alfajores',
      origin: 'https://alfajores-blockscout.celo-testnet.org/'
    }),
    tokens: Assets.Alfajores as AssetLegacy[],
    contracts: Contracts.Alfajores,
    isTestnet: true,
    dPaths: {
      [WalletId.LEDGER_NANO_S]: DPaths.CELO_LEDGER,
      [WalletId.MNEMONIC_PHRASE]: DPaths.CELO_LEDGER
    },
    gasPriceSettings: GAS_PRICE_TESTNET
  }
};
