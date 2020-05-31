import React from 'react';
import { storiesOf } from '@storybook/react';

import { Network as INetwork, NetworkId } from '@types';
import { NETWORKS_CONFIG, NODES_CONFIG } from '@database/data';
import AppProviders from '../../../AppProviders';

import NetworkNodes from './NetworkNodes';

const emptyNetworks: INetwork[] = [];

const celoId: NetworkId = 'Celo';
const baklavaId: NetworkId = 'Baklava';
const someNetworks: INetwork[] = ([
  {
    ...NETWORKS_CONFIG[celoId],
    nodes: NODES_CONFIG[celoId]
  },
  {
    ...NETWORKS_CONFIG[baklavaId],
    nodes: NODES_CONFIG[baklavaId]
  }
] as unknown) as INetwork[];

const toggleFlipped = () => undefined;

const networkNodesEmpty = () => (
  <div className="sb-container" style={{ width: '100%', maxWidth: '900px' }}>
    <NetworkNodes networks={emptyNetworks} toggleFlipped={toggleFlipped} />
  </div>
);

const someNetworkNode = () => (
  <div className="sb-container" style={{ width: '100%', maxWidth: '900px' }}>
    <NetworkNodes networks={someNetworks} toggleFlipped={toggleFlipped} />
  </div>
);

storiesOf('NetworkNodes', module)
  .addDecorator((story) => <AppProviders>{story()}</AppProviders>)
  .add('Empty', (_) => networkNodesEmpty(), {
    design: {
      type: 'figma',
      url:
        'https://www.figma.com/file/BY0SWc75teEUZzws8JdgLMpy/%5BCeloWallet%5D-GAU-Master?node-id=1522%3A93762'
    }
  })
  .add('Some networks', (_) => someNetworkNode(), {
    design: {
      type: 'figma',
      url:
        'https://www.figma.com/file/BY0SWc75teEUZzws8JdgLMpy/%5BCeloWallet%5D-GAU-Master?node-id=1522%3A93762'
    }
  });
