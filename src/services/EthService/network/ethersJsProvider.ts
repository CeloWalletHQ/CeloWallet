import { ContractKit } from '@celo/contractkit';

import { Network } from '@types';

import { createCustomNodeProvider } from './helpers';

interface InstancesObject {
  [key: string]: ContractKit;
}

// Singleton that handles all our network requests
// Generates FallbackProviders depending on the network.
// Should only be used through `ProviderHandler`
export class ContractKitProvider {
  public static getContractKitInstance(network: Network): ContractKit {
    if (!ContractKitProvider.instances[network.id]) {
      ContractKitProvider.instances[network.id] = createCustomNodeProvider(network);
    }
    return ContractKitProvider.instances[network.id];
  }

  public static updateContractKitInstance(network: Network): ContractKit {
    ContractKitProvider.instances[network.id] = createCustomNodeProvider(network);
    return ContractKitProvider.instances[network.id];
  }

  private static instances: InstancesObject = {};

  private constructor() {}
}
