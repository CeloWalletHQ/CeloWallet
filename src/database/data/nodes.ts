import { NodeType, NetworkId, StaticNodeConfig } from '@types';
import { NetworkUtils } from '@services/Store/Network';

export const NODES_CONFIG: { [key in NetworkId]: StaticNodeConfig[] } = {
  Celo: [
    {
      name: NetworkUtils.makeNodeName('Celo', 'Forno'),
      type: NodeType.HTTP,
      service: 'Celo Org (forno)',
      url: 'https://rc1-forno.celo-testnet.org/'
    },
    {
      name: NetworkUtils.makeNodeName('Celo', 'Forno-infura'),
      type: NodeType.HTTP,
      service: 'Celo Org (forno)',
      url: 'https://rc1-forno.celo-testnet.org/'
    }
    // { /* @todo: Add nodes */
    //   name: NetworkUtils.makeNodeName('ETH', 'ethscan'),
    //   type: NodeType.ETHERSCAN,
    //   service: 'Etherscan',
    //   url: 'https://api.etherscan.io/api'
    // },
    // {
    //   name: NetworkUtils.makeNodeName('ETH', 'infura'),
    //   type: NodeType.INFURA,
    //   service: 'Infura',
    //   url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`
    // }
  ],

  Baklava: [
    {
      name: NetworkUtils.makeNodeName('Baklava', 'Forno'),
      type: NodeType.HTTP,
      service: 'Celo Org (forno)',
      url: 'https://baklava-forno.celo-testnet.org'
    }
  ],

  Alfajores: [
    {
      name: NetworkUtils.makeNodeName('Baklava', 'Forno'),
      type: NodeType.HTTP,
      service: 'Celo Org (forno)',
      url: 'https://alfajores-forno.celo-testnet.org'
    }
  ]
};
