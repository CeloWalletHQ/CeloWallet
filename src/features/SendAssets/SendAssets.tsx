import React, { useContext, useReducer, useEffect } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import * as qs from 'query-string';
import { GeneralStepper, ConfirmTransaction, TxReceipt } from '@components';
import { isWeb3Wallet } from '@utils';
import { ITxReceipt, ISignedTx, IFormikFields, ITxConfig } from '@types';
import { translateRaw } from '@translations';
import { ROUTE_PATHS } from '@config';
import { IStepperPath } from '@components/GeneralStepper/types';
import {
  StoreContext,
  useFeatureFlags,
  AccountContext,
  ProviderHandler,
  useAssets,
  useNetworks
} from '@services';
import { isEmpty } from '@vendor';

import { sendAssetsReducer, initialState } from './SendAssets.reducer';
import { parseQueryParams } from './helpers';
import SignTransaction from './components/SignTransaction';
import SendAssetsForm from './components/SendAssetsForm';

function SendAssets({ location }: RouteComponentProps) {
  const [reducerState, dispatch] = useReducer(sendAssetsReducer, initialState);
  const { accounts } = useContext(StoreContext);
  const { assets } = useAssets();
  const { networks } = useNetworks();
  const { IS_ACTIVE_FEATURE } = useFeatureFlags();

  useEffect(() => {
    const txConfigInit = parseQueryParams(qs.parse(location.search))(networks, assets, accounts);
    if (txConfigInit && txConfigInit.type === 'resubmit') {
      if (!txConfigInit.txConfig || isEmpty(txConfigInit.txConfig)) {
        console.debug(
          '[PrefilledTxs]: Error - Missing params. Requires gasPrice, gasLimit, to, data, nonce, from, value, and chainId'
        );
      } else {
        dispatch({
          type: sendAssetsReducer.actionTypes.SET_TXCONFIG,
          payload: { txConfig: txConfigInit.txConfig, type: txConfigInit.type }
        });
      }
    }
  }, [assets]);

  // Due to MetaMask deprecating eth_sign method,
  // it has different step order, where sign and send are one panel
  const web3Steps: IStepperPath[] = [
    {
      label: 'Send Assets',
      component: SendAssetsForm,
      props: (({ txConfig }) => ({ txConfig }))(reducerState),
      actions: (form: IFormikFields, cb: any) => {
        dispatch({ type: sendAssetsReducer.actionTypes.FORM_SUBMIT, payload: { form, assets } });
        cb();
      }
    },
    {
      label: translateRaw('CONFIRM_TX_MODAL_TITLE'),
      component: ConfirmTransaction,
      props: (({ txConfig }) => ({ txConfig }))(reducerState),
      actions: (_: ITxConfig, cb: any) => cb()
    },
    {
      label: '',
      component: SignTransaction,
      props: (({ txConfig }) => ({ txConfig }))(reducerState),
      actions: (payload: ITxReceipt | ISignedTx, cb: any) => {
        dispatch({ type: sendAssetsReducer.actionTypes.WEB3_SIGN_SUCCESS, payload });
        cb();
      }
    },
    {
      label: translateRaw('TRANSACTION_BROADCASTED'),
      component: TxReceipt,
      props: (({ txConfig, txReceipt }) => ({ txConfig, txReceipt }))(reducerState)
    }
  ];

  const defaultSteps: IStepperPath[] = [
    {
      label: 'Send Assets',
      component: SendAssetsForm,
      props: (({ txConfig }) => ({ txConfig }))(reducerState),
      actions: (form: IFormikFields, cb: any) => {
        dispatch({ type: sendAssetsReducer.actionTypes.FORM_SUBMIT, payload: { form, assets } });
        cb();
      }
    },
    {
      label: '',
      component: SignTransaction,
      props: (({ txConfig }) => ({ txConfig }))(reducerState),
      actions: (payload: ITxConfig | ISignedTx, cb: any) => {
        dispatch({
          type: sendAssetsReducer.actionTypes.SIGN_SUCCESS,
          payload: { signedTx: payload, assets, networks, accounts }
        });
        cb();
      }
    },
    {
      label: translateRaw('CONFIRM_TX_MODAL_TITLE'),
      component: ConfirmTransaction,
      props: (({ txConfig, signedTx }) => ({ txConfig, signedTx }))(reducerState),
      actions: (payload: ITxConfig | ISignedTx, cb: any) => {
        dispatch({ type: sendAssetsReducer.actionTypes.REQUEST_SEND, payload });
        if (cb) {
          cb();
        }
      }
    },
    {
      label: ' ',
      component: TxReceipt,
      props: (({ txConfig, txReceipt }) => ({
        txConfig,
        txReceipt,
        pendingButton: {
          text: translateRaw('TRANSACTION_BROADCASTED_RESUBMIT'),
          action: (cb: any) => {
            dispatch({ type: sendAssetsReducer.actionTypes.REQUEST_RESUBMIT, payload: {} });
            cb();
          }
        }
      }))(reducerState)
    }
  ];

  const getPath = () => {
    const { senderAccount } = reducerState.txConfig!;
    const walletSteps =
      senderAccount && isWeb3Wallet(senderAccount.wallet) ? web3Steps : defaultSteps;
    if (reducerState.type && reducerState.type === 'resubmit') {
      return walletSteps.slice(1, walletSteps.length);
    }
    return walletSteps;
  };

  const { addNewTxToAccount } = useContext(AccountContext);

  // Adds TX to history
  useEffect(() => {
    if (reducerState.txReceipt) {
      addNewTxToAccount(reducerState.txConfig!.senderAccount, reducerState.txReceipt);
    }
  }, [reducerState.txReceipt]);

  // Sends signed TX
  useEffect(() => {
    if (
      reducerState.send &&
      reducerState.signedTx &&
      !isWeb3Wallet(reducerState.txConfig!.senderAccount.wallet)
    ) {
      const { txConfig, signedTx } = reducerState;
      const provider = new ProviderHandler(txConfig!.network);

      provider
        .sendRawTx(signedTx)
        .then((payload) => dispatch({ type: sendAssetsReducer.actionTypes.SEND_SUCCESS, payload }));
    }
  }, [reducerState.send]);

  return (
    <GeneralStepper
      steps={getPath()}
      defaultBackPath={ROUTE_PATHS.DASHBOARD.path}
      defaultBackPathLabel={translateRaw('DASHBOARD')}
      completeBtnText={translateRaw('SEND_ASSETS_SEND_ANOTHER')}
      wrapperClassName={`send-assets-stepper`}
      basic={IS_ACTIVE_FEATURE.SEND_ASSETS}
    />
  );
}

export default withRouter(SendAssets);
