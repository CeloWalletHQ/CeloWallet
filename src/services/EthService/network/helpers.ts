import equals from 'ramda/src/equals';
import { newKit } from '@celo/contractkit/lib/kit';

import { Network, DPathFormat } from '@types';

// Network names accepted by ethers.EtherscanProvider
//type TValidEtherscanNetwork = 'homestead' | 'ropsten' | 'rinkeby' | 'kovan' | 'goerli';

// const getValidEthscanNetworkId = (id: NetworkId): TValidEtherscanNetwork =>
//   id === 'Celo' ? 'homestead' : (id.toLowerCase() as TValidEtherscanNetwork);

// const getProvider = (
//   networkId: NetworkId,
//   { type, url, auth }: CustomNodeConfig & StaticNodeConfig
// ) => {
//   switch (type) {
//     case NodeType.ETHERSCAN: {
//       const networkName = getValidEthscanNetworkId(networkId);
//       return new EtherscanProvider(networkName);
//     }
//     case NodeType.WEB3: {
//       const ethereumProvider = window.ethereum;
//       const networkName = getValidEthscanNetworkId(networkId);
//       return new Web3Provider(ethereumProvider, networkName);
//     }
//     // Option to use the ContractKitProvider InfuraProvider, but need figure out the apiAcessKey
//     // https://docs.ethers.io/ethers.js/html/api-providers.html#jsonrpcprovider-inherits-from-provider
//     // case NodeType.INFURA:
//     //   return new ethers.providers.InfuraProvider(name);

//     // default case covers the remaining NodeTypes.
//     default: {
//       console.debug('[got to this step]: url = ', url)
//       if (auth) {
//         return new JsonRpcProvider({
//           url,
//           user: auth.username,
//           password: auth.password,
//           allowInsecure: true
//         });
//       }
//       return new JsonRpcProvider(url);
//     }
//   }
// };

const getCeloProvider = (url: string) => {
  const kit = newKit(url);
  return kit;
};

export const createCustomNodeProvider = (network: Network) => {
  const { nodes } = network;
  if (nodes.length < 1) {
    throw new Error('At least one node required!');
  }

  return getCeloProvider(nodes[0].url);
};

export const getDPath = (network: Network | undefined, type: DPathFormat): DPath | undefined => {
  return network ? network.dPaths[type] : undefined;
};

export const getDPaths = (networks: Network[], type: DPathFormat): DPath[] =>
  networks.reduce((acc, n) => {
    const dPath = getDPath(n, type);
    if (dPath && !acc.find((x) => equals(x, dPath))) {
      acc.push(dPath);
    }
    return acc;
  }, [] as DPath[]);
