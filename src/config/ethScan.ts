import { NetworkId } from '@types';

enum EthscanSupportedNetworks {
  Celo = 'Celo',
  Baklava = 'Baklava'
}

export const ETHSCAN_NETWORKS: NetworkId[] = Object.values(EthscanSupportedNetworks);
