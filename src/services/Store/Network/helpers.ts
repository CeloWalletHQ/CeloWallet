import { getAssetByUUID } from '@services/Store';
import { DPathFormat, Network, NetworkId, WalletId, ExtendedAsset } from '@types';
import { HD_WALLETS } from '@config';

export const getNetworkByChainId = (
  chainId: number,
  networks: Network[] = []
): Network | undefined => {
  return networks.find((network: Network) => network.chainId === chainId);
};

export const getNetworkById = (id: NetworkId, networks: Network[] = []): Network => {
  return networks.find((network: Network) => network.id === id) as Network;
};

export const isWalletFormatSupportedOnNetwork = (network: Network, format: WalletId): boolean => {
  const CHECK_FORMATS: DPathFormat[] = Object.keys(HD_WALLETS) as DPathFormat[];
  const isHDFormat = (f: string): f is DPathFormat => CHECK_FORMATS.includes(f as DPathFormat);

  // Ensure DPath's are found
  if (isHDFormat(format)) {
    if (!network) {
      return false;
    }
    const dPath: DPath | undefined = network.dPaths && network.dPaths[format];
    return !!dPath;
  }

  // All other wallet formats are supported
  return true;
};

export const getBaseAssetsByNetwork = ({
  network,
  assets
}: {
  network: Network;
  assets: ExtendedAsset[];
}): ExtendedAsset[] => {
  const baseAssetUUIDs = network.baseAssets;
  const baseAssets = baseAssetUUIDs.map((baseAssetUUID) => getAssetByUUID(assets)(baseAssetUUID));
  const relevantBaseAssets = baseAssets.filter((asset) => asset !== undefined);
  return relevantBaseAssets as ExtendedAsset[];
};
