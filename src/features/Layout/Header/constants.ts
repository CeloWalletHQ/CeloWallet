import { translateRaw } from '@translations';
import { getAppRoutesObject } from '@routing';
import { IIS_ACTIVE_FEATURE } from '@config/isActiveFeature';
import { ROUTE_PATHS } from '@config';

import settingsIcon from '@assets/images/icn-settings.svg';
import dashboardIcon from '@assets/images/icn-dashboard.svg';

export const getLinks = (IS_ACTIVE_FEATURE: IIS_ACTIVE_FEATURE) => {
  const APP_ROUTES_OBJECT = getAppRoutesObject(IS_ACTIVE_FEATURE);
  return [
    {
      title: 'Dashboard',
      to: APP_ROUTES_OBJECT.DASHBOARD.path,
      enabled: APP_ROUTES_OBJECT.DASHBOARD.enabled,
      icon: { src: dashboardIcon, width: '16px', height: '12px' }
    },
    {
      title: 'Manage Assets',
      enabled: true,
      subItems: [
        {
          to: APP_ROUTES_OBJECT.SEND.path,
          enabled: APP_ROUTES_OBJECT.SEND.enabled,
          title: translateRaw('SEND')
        },
        {
          to: APP_ROUTES_OBJECT.REQUEST_ASSETS.path,
          enabled: APP_ROUTES_OBJECT.REQUEST_ASSETS.enabled,
          title: translateRaw('REQUEST')
        },
        {
          to: APP_ROUTES_OBJECT.SWAP.path,
          enabled: APP_ROUTES_OBJECT.SWAP.enabled,
          title: translateRaw('SWAP')
        },
        {
          to: ROUTE_PATHS.ADD_ACCOUNT.path,
          enabled: APP_ROUTES_OBJECT.ADD_ACCOUNT.enabled,
          title: translateRaw('ADD_ACCOUNT')
        }
      ]
    },
    {
      title: 'Tools',
      enabled: true,
      subItems: [
        {
          to: APP_ROUTES_OBJECT.SIGN_MESSAGE.path,
          enabled: APP_ROUTES_OBJECT.SIGN_MESSAGE.enabled,
          title: 'Sign Message'
        },
        {
          to: APP_ROUTES_OBJECT.VERIFY_MESSAGE.path,
          enabled: APP_ROUTES_OBJECT.VERIFY_MESSAGE.enabled,
          title: 'Verify Message'
        },
        {
          to: APP_ROUTES_OBJECT.BROADCAST_TX.path,
          enabled: APP_ROUTES_OBJECT.BROADCAST_TX.enabled,
          title: 'Broadcast Transaction'
        },
        {
          to: APP_ROUTES_OBJECT.INTERACT_WITH_CONTRACTS.path,
          enabled: APP_ROUTES_OBJECT.INTERACT_WITH_CONTRACTS.enabled,
          title: 'Interact with Contracts'
        },
        {
          to: APP_ROUTES_OBJECT.DEPLOY_CONTRACTS.path,
          enabled: APP_ROUTES_OBJECT.DEPLOY_CONTRACTS.enabled,
          title: 'Deploy Contracts'
        },
        {
          to: '/helpers',
          title: 'Helpers'
        },
        {
          to: ROUTE_PATHS.TX_STATUS.path,
          enabled: APP_ROUTES_OBJECT.TX_STATUS.enabled,
          title: 'TX Status'
        }
      ]
    },
    {
      title: 'Settings',
      to: APP_ROUTES_OBJECT.SETTINGS.path,
      enabled: APP_ROUTES_OBJECT.SETTINGS.enabled,
      icon: { src: settingsIcon, width: '16px' }
    }
  ];
};
