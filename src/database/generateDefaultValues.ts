import mapObjIndexed from 'ramda/src/mapObjIndexed';
import pipe from 'ramda/src/pipe';
import map from 'ramda/src/map';
import filter from 'ramda/src/filter';
import chain from 'ramda/src/chain';
import reduce from 'ramda/src/reduce';
import mergeRight from 'ramda/src/mergeRight';
import flatten from 'ramda/src/flatten';

import { generateAssetUUID, generateContractUUID } from '@utils';
import { DEFAULT_ASSET_DECIMAL } from '@config';
import {
  Asset,
  ExtendedAsset,
  ExtendedContract,
  LocalStorage,
  NetworkId,
  NetworkLegacy,
  WalletId,
  Network,
  ContractLegacy,
  AssetLegacy,
  LSKeys,
  NodeOptions
} from '@types';

import { NODES_CONFIG, NETWORKS_CONFIG, NetworkConfig } from './data';
import { SeedData, StoreAction } from './types';
import { toArray, toObject, add } from './helpers';
import uniq from 'ramda/src/uniq';

/* Transducers */
const addNetworks = add(LSKeys.NETWORKS)((networks: SeedData) => {
  const formatNetwork = (n: NetworkLegacy): Network => {
    const baseAssetUuid = generateAssetUUID(n.chainId);
    // add custom nodes from local storage
    const nodes: NodeOptions[] = [...(NODES_CONFIG[n.id] || []), ...(n.nodes || [])];
    const [firstNode] = nodes;

    return Object.assign(
      {
        // Also available are: blockExplorer, tokenExplorer, tokens aka assets, contracts
        id: n.id,
        name: n.name,
        chainId: n.chainId,
        isCustom: n.isCustom,
        isTestnet: n.isTestnet,
        color: n.color,
        gasPriceSettings: n.gasPriceSettings,
        shouldEstimateGasPrice: n.shouldEstimateGasPrice,
        dPaths: {
          ...n.dPaths,
          default: n.dPaths[WalletId.MNEMONIC_PHRASE] // Set default dPath
        },
        blockExplorer: n.blockExplorer,
        tokenExplorer: n.tokenExplorer,
        contracts: [],
        assets: [],
        baseAssets: [baseAssetUuid], // Set baseAssetUuid
        baseUnit: n.unit,
        nodes
      },
      firstNode
        ? {
            // Extend network if nodes are defined
            autoNode: firstNode.name, // Select first node as auto
            selectedNode: n.selectedNode || firstNode.name // Select first node as default
          }
        : {}
    );
  };

  return mapObjIndexed(formatNetwork, networks);
});

const addContracts = add(LSKeys.CONTRACTS)(
  (networks: Record<NetworkId, NetworkLegacy>, store: LocalStorage) => {
    const formatContract = (id: NetworkId) => (c: ContractLegacy): ExtendedContract => ({
      uuid: c.uuid || generateContractUUID(id, c.address),
      name: c.name,
      address: c.address,
      abi: c.abi,
      networkId: id,
      isCustom: c.isCustom
    });

    // Transform { ETH: { contracts: [ {<contract>} ] }}
    // to   { <contract_uuid>: {<contract>} }
    return pipe(
      map(({ id, contracts }) => ({ id, contracts })),
      filter(({ contracts }) => contracts),
      chain(({ id, contracts }): ExtendedAsset[] => contracts.map(formatContract(id))),
      reduce(toObject('uuid'), {} as any),
      mergeRight(store.contracts)
    )(toArray(networks));
  }
);

const addContractsToNetworks = add(LSKeys.NETWORKS)((_, store: LocalStorage) => {
  const getNetworkContracts = (n: Network) => {
    const nContracts = filter((c: ExtendedContract) => c.networkId === n.id, store.contracts);
    return {
      ...n,
      contracts: toArray(nContracts).map((c) => c.uuid)
    };
  };
  return mapObjIndexed(getNetworkContracts, store.networks);
});

const addBaseAssetsToAssets = add(LSKeys.ASSETS)((_, store: LocalStorage) => {
  const formatAsset = (n: Network): ExtendedAsset[] =>
    n.baseAssets.map((baseAsset) => ({
      uuid: baseAsset,
      ticker: n.baseUnit,
      name: n.name,
      networkId: n.id,
      type: 'base',
      contractAddress: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
      celoIdentifier: 'gold',
      decimal: DEFAULT_ASSET_DECIMAL,
      mappings: n.mappings
    }));

  // From { <networkId>: { baseAsset: <asset_uui> } }
  // To   { <asset_uuid>: <asset> }
  const z = pipe(
    toArray,
    map(formatAsset),
    flatten,
    reduce((acc, curr) => ({ ...acc, [curr.uuid]: curr }), {}),
    mergeRight(store.assets) // Ensure we return an object with existing assets as well
  )(store.networks);
  return z;
});

const addTokensToAssets = add(LSKeys.ASSETS)(
  (networks: typeof NETWORKS_CONFIG, store: LocalStorage) => {
    const formatToken = (id: NetworkId) => (a: AssetLegacy): ExtendedAsset => ({
      uuid: a.uuid || generateAssetUUID(id), // In case a token doesn't have a pregenerated uuid. eg. RSK
      name: a.name,
      decimal: a.decimal,
      ticker: a.symbol || a.ticker,
      networkId: id,
      contractAddress: a.contractAddress,
      celoIdentifier: a.celoIdentifier,
      type: a.type,
      isCustom: a.isCustom
    });
    // From { ETH: { tokens: [ {<tokens>} ] }}
    // to   { <asset_uuid>: {<asset>} }
    return pipe(
      map(({ id, tokens }) => ({ id, tokens })),
      filter(({ tokens }) => tokens),
      chain(({ id, tokens }): ExtendedAsset[] => tokens.map(formatToken(id))),
      reduce(toObject('uuid'), {} as any),
      mergeRight(store.assets)
    )(toArray(networks));
  }
);

const updateNetworkAssets = add(LSKeys.NETWORKS)((_, store: LocalStorage) => {
  // Since we added baseAsset and tokens to Assets this will return both.
  const findNetworkAssets = (nId: NetworkId): Asset[] =>
    toArray(store.assets).filter((a) => a.networkId === nId);

  const getAssetUuid = (n: Network) =>
    findNetworkAssets(n.id)
      .filter(Boolean)
      .map((a) => a.uuid);

  const getBaseAssetUuids = (n: Network) =>
    findNetworkAssets(n.id)
      .filter(({ type }) => type === 'base')
      .map((a) => a.uuid);

  return mapObjIndexed((n: Network) => {
    const baseAssetUUIDs = getBaseAssetUuids(n);
    const baseAssetsToUse = uniq([...n.baseAssets, ...baseAssetUUIDs]);
    const outputNetwork = {
      ...n,
      baseAssets: baseAssetsToUse,
      assets: [...n.assets, ...getAssetUuid(n)]
    };
    return outputNetwork;
  }, store.networks);
});

/* Define flow order */
const getDefaultTransducers = (networkConfig: NetworkConfig): StoreAction[] => [
  addNetworks(networkConfig),
  addContracts(networkConfig),
  addContractsToNetworks(),
  addBaseAssetsToAssets(),
  addTokensToAssets(networkConfig),
  updateNetworkAssets()
];

/* Handler to trigger the flow according the environment */
type Transduce = (z: LocalStorage, networkConfig: NetworkConfig) => LocalStorage;
export const createDefaultValues: Transduce = (initialSchema: LocalStorage, networkConfig) => {
  // @ts-ignore
  return pipe(...getDefaultTransducers(networkConfig))(initialSchema);
};
