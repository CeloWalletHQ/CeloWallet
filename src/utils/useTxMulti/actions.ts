import { Dispatch } from 'react';

import { ITxSigned, ITxObject, TStateGetter, StoreAccount, Network, ITxHash } from '@types';
import { isWeb3Wallet, isTxSigned, isTxHash } from '@utils';
import { ProviderHandler } from '@services';
import { appendGasLimit, appendNonce } from '@services/EthService';
import { CeloProviderHandler } from '@services/EthService/network';
import { TransactionResult } from '@celo/contractkit/lib/utils/tx-result';

import { TxMultiState, TxMultiAction, ActionTypes, TransactionReceipt } from './types';

export const init = (dispatch: Dispatch<TxMultiAction>) => async (
  txs: ITxObject[],
  account: StoreAccount,
  network: Network
) => {
  dispatch({
    type: ActionTypes.INIT_SUCCESS,
    payload: { txs, account, network }
  });
};

export const initWith = (dispatch: Dispatch<TxMultiAction>) => async (
  getTxs: () => any,
  account: StoreAccount,
  network: Network
) => {
  dispatch({ type: ActionTypes.INIT_REQUEST });
  try {
    const txs = await getTxs();
    dispatch({
      type: ActionTypes.INIT_SUCCESS,
      payload: {
        txs,
        account,
        network
      }
    });
  } catch (err) {
    dispatch({ type: ActionTypes.INIT_FAILURE, payload: err, error: true });
  }
};

export const stopYield = (dispatch: Dispatch<TxMultiAction>) => async () =>
  dispatch({ type: ActionTypes.HALT_FLOW });

export const prepareTx = (
  dispatch: Dispatch<TxMultiAction>,
  getState: TStateGetter<TxMultiState>
) => async (tx: ITxObject) => {
  const { network, account } = getState();
  dispatch({ type: ActionTypes.PREPARE_TX_REQUEST });

  try {
    const txRaw = await Promise.resolve(tx)
      .then(appendGasLimit(network!))
      .then(appendNonce(network!, account!.address));
    dispatch({ type: ActionTypes.PREPARE_TX_SUCCESS, payload: { txRaw } });
  } catch (err) {
    dispatch({ type: ActionTypes.PREPARE_TX_FAILURE, error: true, payload: err });
  }
};

export const sendTx = (
  dispatch: Dispatch<TxMultiAction>,
  getState: TStateGetter<TxMultiState>
) => async (walletResponse: ITxHash | ITxSigned) => {
  const { account } = getState();
  dispatch({ type: ActionTypes.SEND_TX_REQUEST });
  const celoProvider = new CeloProviderHandler(account!.network);
  if (isTxHash(walletResponse) && isWeb3Wallet(account!.wallet)) {
    dispatch({
      type: ActionTypes.SEND_TX_SUCCESS,
      payload: { txHash: walletResponse }
    });
    celoProvider
      .getTxReceipt(walletResponse)
      .then((txReceipt: TransactionReceipt) => waitForConfirmation(dispatch, getState)(txReceipt));
  } else if (isTxHash(walletResponse) || isTxSigned(walletResponse)) {
    celoProvider
      .sendRawTx(walletResponse)
      .then((txResult: TransactionResult) => {
        txResult.getHash().then((txHash) => {
          dispatch({
            type: ActionTypes.SEND_TX_SUCCESS,
            payload: { txHash: txHash as ITxHash }
          });
        });
        return txResult;
      })
      .then((txRes: TransactionResult) => {
        txRes.waitReceipt().then((txReceipt) => {
          waitForConfirmation(dispatch, getState)(txReceipt);
        });
      })
      .catch((err: Error) => {
        dispatch({ type: ActionTypes.SEND_TX_FAILURE, error: true, payload: err });
      });
  } else {
    throw new Error(`SendTx: unknown walletResponse ${walletResponse}`);
  }
};

const waitForConfirmation = (
  dispatch: Dispatch<TxMultiAction>,
  getState: TStateGetter<TxMultiState>
) => async (txReceipt: TransactionReceipt) => {
  const { account } = getState();
  dispatch({ type: ActionTypes.CONFIRM_TX_REQUEST });
  const provider = new ProviderHandler(account!.network);
  try {
    const minedAt = await provider
      .getBlockByNumber(txReceipt.blockNumber)
      .then((block) => block.timestamp);
    dispatch({ type: ActionTypes.CONFIRM_TX_SUCCESS, payload: { txReceipt, minedAt } });
  } catch (err) {
    dispatch({
      type: ActionTypes.CONFIRM_TX_FAILURE,
      error: true,
      payload: err
    });
  }
};

export const reset = (dispatch: Dispatch<TxMultiAction>) => async () => {
  dispatch({ type: ActionTypes.RESET });
};
