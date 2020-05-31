import { generateAssetUUID } from '@utils';
import { AssetLegacy } from '@types';
import Alfajores from './alfajores.json';
import Baklava from './baklava.json';
import Celo from './celo.json';

// @TODO[Types]: key should really be a partial of NetworkId
interface Assets {
  [key: string]: AssetLegacy[];
}

export const Assets = {
  Alfajores: Object.values(Alfajores).map((asset: AssetLegacy) => ({
    ...asset,
    uuid: generateAssetUUID(44786, asset.contractAddress)
  })),
  Baklava: Object.values(Baklava).map((asset: AssetLegacy) => ({
    ...asset,
    uuid: generateAssetUUID(40120, asset.contractAddress)
  })),
  Celo: Object.values(Celo).map((asset: AssetLegacy) => ({
    ...asset,
    uuid: generateAssetUUID(42220, asset.contractAddress)
  }))
};
