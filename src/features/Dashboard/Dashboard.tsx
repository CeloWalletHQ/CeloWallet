import React, { useContext } from 'react';
import { Heading } from '@mycrypto/ui';
import styled from 'styled-components';

import { AccountList, Desktop, Mobile } from '@components';
//import BannerAd from '@components/BannerAd/BannerAd';
import { AccountContext, StoreContext } from '@services/Store';
import { translateRaw } from '@translations';

import { NotificationsPanel } from '../NotificationsPanel';
import { ActionTile, TokenPanel, WalletBreakdown, RecentTransactionList } from './components';
import { actions } from './constants';
import { filterDashboardActions } from './helpers';

import './Dashboard.scss';

// Keep the same mobile width as an ActionTile
const EmptyTile = styled.div`
  width: 30%;
`;

const DashboardWrapper = styled.div`
  width: 100%;
`;

export default function Dashboard() {
  const { currentAccounts, assets } = useContext(StoreContext);
  const { accounts } = useContext(AccountContext);
  const relevantActions = filterDashboardActions(actions, assets());

  return (
    <DashboardWrapper>
      {/* Mobile only */}
      <Mobile className="Dashboard-mobile">
        <NotificationsPanel accounts={accounts} />
        <div className="Dashboard-mobile-actions">
          {relevantActions.map((action) => (
            <ActionTile key={action.title} {...action} />
          ))}
          {/*In mobile we only have 5 tiles on 2 rows. To allow 'space-between' to handle the gaps, we
          add a sixth tile with the same width.*/}
          <EmptyTile />
        </div>
        <div className="Dashboard-mobile-divider" />
        <div className="Dashboard-mobile-group">
          <div className="Dashboard-mobile-walletBreakdown">
            <WalletBreakdown />
          </div>
          <div className="Dashboard-mobile-section Dashboard-mobile-tokenList">
            <TokenPanel />
          </div>
        </div>
        <div className="Dashboard-mobile-section">
          <AccountList
            accounts={currentAccounts}
            className="Dashboard-mobile-modifiedPanel"
            copyable={true}
            dashboard={true}
          />
        </div>
        <div className="Dashboard-mobile-section">
          <RecentTransactionList accountsList={currentAccounts} />
        </div>
      </Mobile>
      {/* Desktop only */}
      <Desktop className="Dashboard-desktop">
        <NotificationsPanel accounts={accounts} />
        <div className="Dashboard-desktop-top">
          <div className="Dashboard-desktop-top-left">
            <Heading as="h2" className="Dashboard-desktop-top-left-heading">
              {translateRaw('YOUR_DASHBOARD')}
            </Heading>
            <div className="Dashboard-desktop-top-left-actions">
              {relevantActions.map((action) => (
                <ActionTile key={action.title} {...action} />
              ))}
            </div>
            <div className="Dashboard-desktop-top-left-tokens">
              <TokenPanel />
            </div>
          </div>
          <div className="Dashboard-desktop-top-right">
            <div>
              <WalletBreakdown />
            </div>
            <div>
              <AccountList
                accounts={currentAccounts}
                className="Dashboard-desktop-modifiedPanel"
                copyable={true}
                dashboard={true}
              />
            </div>
          </div>
        </div>
        <div className="Dashboard-desktop-bottom">
          <RecentTransactionList
            accountsList={currentAccounts}
            className="Dashboard-desktop-modifiedPanel"
          />
        </div>
      </Desktop>
    </DashboardWrapper>
  );
}
