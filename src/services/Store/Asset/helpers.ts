import { Asset, ExtendedAsset, Network, StoreAsset, TUuid } from '@types';
import { getBaseAssetsByNetwork } from '../Network';

export const getAssetByTicker = (assets: Asset[]) => (symbol: string): Asset | undefined => {
  return assets.find((asset) => asset.ticker.toLowerCase() === symbol.toLowerCase());
};

export const getNewDefaultAssetTemplatesByNetwork = (assets: ExtendedAsset[]) => (
  network: Network
): ExtendedAsset[] => {
  const baseAssetsOfNetwork: Asset[] = getBaseAssetsByNetwork({ assets, network });
  return baseAssetsOfNetwork.map((baseAsset) => ({
    uuid: baseAsset.uuid,
    name: baseAsset.name,
    networkId: baseAsset.networkId,
    type: 'base',
    ticker: baseAsset.ticker,
    decimal: baseAsset.decimal
  }));
};

export const getAssetByUUID = (assets: ExtendedAsset[]) => (
  uuid: TUuid
): ExtendedAsset | undefined => {
  return assets.find((asset) => asset.uuid === uuid);
};

export const getAssetByContractAndNetwork = (
  contractAddress: string | undefined,
  network: Network | undefined
) => (assets: ExtendedAsset[]): Asset | undefined => {
  if (!network || !contractAddress) {
    return undefined;
  }
  return assets
    .filter((asset) => asset.networkId && asset.contractAddress)
    .filter((asset) => asset.networkId === network.id)
    .find((asset) => asset.contractAddress === contractAddress);
};

export const getTotalByAsset = (assets: StoreAsset[]) =>
  assets.reduce((dict, asset) => {
    const prev = dict[asset.uuid];
    if (prev) {
      dict[asset.uuid] = {
        ...prev,
        balance: prev.balance.add(asset.balance)
      };
    } else {
      dict[asset.uuid] = asset;
    }
    return dict;
  }, {} as { [key: string]: StoreAsset });
