import { Contract } from '@types';

import Baklava from './baklava.json';
import Celo from './celo.json';
import Alfajores from './alfajores.json';

// @TODO[Types]: key should really be a partial of NetworkId
interface Contracts {
  [key: string]: Contract[];
}

export const Contracts: Contracts = {
  Alfajores,
  Baklava,
  Celo
};
