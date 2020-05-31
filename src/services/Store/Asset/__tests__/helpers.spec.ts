import { bigNumberify } from 'ethers/utils/bignumber';
import { StoreAsset, TUuid } from '@types';
import { getTotalByAsset } from '../helpers';

const DEFAULT_ASSET_DECIMAL = 18;
const assets: StoreAsset[] = [
  {
    uuid: 'f7e30bbe-08e2-41ce-9231-5236e6aab702' as TUuid,
    name: 'Celo Gold',
    networkId: 'Celo',
    type: 'base',
    ticker: 'CGLD',
    decimal: DEFAULT_ASSET_DECIMAL,
    balance: bigNumberify(1),
    mtime: Date.now()
  }
];

describe('getTotalByAsset()', () => {
  it('returns a list of unique assets', () => {
    const totals = getTotalByAsset([...assets, ...assets]);
    expect(Object.keys(totals).length).toEqual(assets.length);
  });
  it('sums the balances of each asset', () => {
    const totals = getTotalByAsset([...assets, ...assets]);
    const targetId = 'f7e30bbe-08e2-41ce-9231-5236e6aab702';
    const targetAsset = assets.find((a) => a.uuid === targetId);
    expect(totals[targetId].balance.toString()).toEqual(targetAsset!.balance.mul('2').toString());
  });
});
