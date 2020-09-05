import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction
} from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@mycrypto/ui';
import styled from 'styled-components';

import {
  ITxReceipt,
  ITxStatus,
  IStepComponentProps,
  ITxType,
  TAddress,
  ExtendedContact,
  ISettings,
  ITxReceiptStepProps,
  IPendingTxReceipt,
  ITxHistoryStatus,
  Fiat
} from '@types';
import { Amount, TimeElapsed, AssetIcon, LinkOut } from '@components';
import { AccountContext, StoreContext, SettingsContext, useContacts } from '@services/Store';
import { useRates } from '@services';
import {
  ProviderHandler,
  getTimestampFromBlockNum,
  getTransactionReceiptFromHash
} from '@services/EthService';
import { ROUTE_PATHS } from '@config';
import { BREAK_POINTS } from '@theme';
import { SwapDisplayData } from '@features/SwapAssets/types';
import translate from '@translations';
import { convertToFiat, truncate } from '@utils';
import { isWeb3Wallet } from '@utils/web3';
import { getFiat } from '@config/fiats';
import { makeFinishedTxReceipt } from '@utils/transaction';
import { path } from '@vendor';

import { ISender } from './types';
import { constructSenderFromTxConfig } from './helpers';
import { FromToAccount, SwapFromToDiagram, TransactionDetailsDisplay } from './displays';
import { PendingTransaction } from './PendingLoader';

import sentIcon from '@assets/images/icn-sent.svg';
import './TxReceipt.scss';

interface PendingBtnAction {
  text: string;
  action(cb: any): void;
}
interface Props {
  pendingButton?: PendingBtnAction;
  swapDisplay?: SwapDisplayData;
  disableDynamicTxReceiptDisplay?: boolean;
  disableAddTxToAccount?: boolean;
  protectTxButton?(): JSX.Element;
}

const SSpacer = styled.div`
  height: 60px;
  @media screen and (max-width: ${BREAK_POINTS.SCREEN_XS}) {
    height: 85px;
  }
`;

export default function TxReceipt({
  txReceipt,
  txConfig,
  resetFlow,
  completeButtonText,
  pendingButton,
  swapDisplay,
  disableDynamicTxReceiptDisplay,
  disableAddTxToAccount,
  protectTxButton
}: ITxReceiptStepProps & Props) {
  const { getAssetRate } = useRates();
  const { getContactByAddressAndNetworkId } = useContacts();
  const { addNewTxToAccount } = useContext(AccountContext);
  const { accounts } = useContext(StoreContext);
  const { settings } = useContext(SettingsContext);
  const [txStatus, setTxStatus] = useState(
    txReceipt ? txReceipt.status : (ITxStatus.PENDING as ITxHistoryStatus)
  );
  const [displayTxReceipt, setDisplayTxReceipt] = useState<ITxReceipt | undefined>(txReceipt);
  const [blockNumber, setBlockNumber] = useState(0);
  const [timestamp, setTimestamp] = useState(0);

  useEffect(() => {
    if (!disableDynamicTxReceiptDisplay) {
      setDisplayTxReceipt(txReceipt);
    }
  }, [setDisplayTxReceipt, txReceipt]);

  useEffect(() => {
    if (displayTxReceipt && blockNumber === 0 && displayTxReceipt.hash) {
      const provider = new ProviderHandler(txConfig.network);
      const blockNumInterval = setInterval(() => {
        getTransactionReceiptFromHash(displayTxReceipt.hash, provider).then(
          (transactionOutcome) => {
            if (transactionOutcome) {
              const transactionStatus: ITxHistoryStatus =
                transactionOutcome.status === 1 ? ITxStatus.SUCCESS : ITxStatus.FAILED;
              setTxStatus((prevStatusState) => transactionStatus || prevStatusState);
              setBlockNumber((prevState: number) => transactionOutcome.blockNumber || prevState);
              provider.getTransactionByHash(displayTxReceipt.hash).then((txResponse) => {
                setDisplayTxReceipt(
                  makeFinishedTxReceipt(
                    txReceipt as IPendingTxReceipt,
                    transactionStatus,
                    txResponse.timestamp,
                    txResponse.blockNumber,
                    transactionOutcome.gasUsed,
                    transactionOutcome.confirmations
                  )
                );
              });
            } else if (txStatus === ITxStatus.UNKNOWN) {
              setTxStatus(ITxStatus.PENDING);
            }
          }
        );
      }, 1000);
      return () => clearInterval(blockNumInterval);
    }
  });
  useEffect(() => {
    if (displayTxReceipt && timestamp === 0 && blockNumber !== 0) {
      const provider = new ProviderHandler(txConfig.network);
      const timestampInterval = setInterval(() => {
        getTimestampFromBlockNum(blockNumber, provider).then((transactionTimestamp) => {
          if (sender.account && !disableAddTxToAccount) {
            addNewTxToAccount(sender.account, {
              ...displayTxReceipt,
              blockNumber: blockNumber || 0,
              timestamp: transactionTimestamp || 0,
              status: txStatus
            });
          }
          setTimestamp(transactionTimestamp || 0);
        });
      }, 1000);

      return () => clearInterval(timestampInterval);
    }
  });

  const assetRate = (() => {
    if (displayTxReceipt && path(['asset'], displayTxReceipt)) {
      return getAssetRate(displayTxReceipt.asset);
    } else {
      return getAssetRate(txConfig.asset);
    }
  })();

  const baseAssetRate = (() => {
    if (displayTxReceipt && path(['baseAsset'], displayTxReceipt)) {
      return getAssetRate(displayTxReceipt.baseAsset);
    } else {
      return getAssetRate(txConfig.baseAsset);
    }
  })();

  const sender = constructSenderFromTxConfig(txConfig, accounts);

  const senderContact = getContactByAddressAndNetworkId(sender.address, txConfig.network.id);

  const recipientContact = getContactByAddressAndNetworkId(
    txConfig.receiverAddress,
    txConfig.network.id
  );

  const fiat = getFiat(settings);

  return (
    <TxReceiptUI
      settings={settings}
      txConfig={txConfig}
      txReceipt={txReceipt}
      assetRate={assetRate}
      baseAssetRate={baseAssetRate}
      swapDisplay={swapDisplay}
      txStatus={txStatus}
      timestamp={timestamp}
      senderContact={senderContact}
      sender={sender}
      recipientContact={recipientContact}
      displayTxReceipt={displayTxReceipt}
      setDisplayTxReceipt={setDisplayTxReceipt}
      resetFlow={resetFlow}
      completeButtonText={completeButtonText}
      pendingButton={pendingButton}
      protectTxButton={protectTxButton}
      fiat={fiat}
    />
  );
}

export interface TxReceiptDataProps {
  settings: ISettings;
  txStatus: ITxStatus;
  timestamp: number;
  displayTxReceipt?: ITxReceipt;
  setDisplayTxReceipt?: Dispatch<SetStateAction<ITxReceipt | undefined>>;
  senderContact: ExtendedContact | undefined;
  sender: ISender;
  recipientContact: ExtendedContact | undefined;
  fiat: Fiat;
  pendingButton?: PendingBtnAction;
  swapDisplay?: SwapDisplayData;
  protectTxEnabled?: boolean;
  web3Wallet?: boolean;
  assetRate: number | undefined;
  baseAssetRate: number | undefined;
  resetFlow(): void;
  protectTxButton?(): JSX.Element;
}

type UIProps = Omit<IStepComponentProps, 'resetFlow' | 'onComplete'> & TxReceiptDataProps;

export const TxReceiptUI = ({
  settings,
  txType,
  swapDisplay,
  txConfig,
  txStatus,
  timestamp,
  assetRate,
  displayTxReceipt,
  senderContact,
  sender,
  baseAssetRate,
  fiat,
  recipientContact,
  pendingButton,
  resetFlow,
  completeButtonText,
  protectTxEnabled = false,
  web3Wallet = false,
  protectTxButton
}: UIProps) => {
  /* Determining User's Contact */
  const { asset, gasPrice, gasLimit, data, nonce, baseAsset, receiverAddress } = txConfig;

  const localTimestamp = new Date(Math.floor(timestamp * 1000)).toLocaleString();
  const assetAmount = useCallback(() => {
    if (displayTxReceipt && path(['amount'], displayTxReceipt)) {
      return displayTxReceipt.amount;
    } else {
      return txConfig.amount;
    }
  }, [displayTxReceipt, txConfig.amount]);

  const assetTicker = useCallback(() => {
    if (displayTxReceipt && path(['asset'], displayTxReceipt)) {
      return displayTxReceipt.asset.ticker;
    } else {
      return txConfig.asset.ticker;
    }
  }, [displayTxReceipt, txConfig.asset]);

  const shouldRenderPendingBtn =
    pendingButton &&
    txStatus === ITxStatus.PENDING &&
    sender.account &&
    !isWeb3Wallet(sender.account.wallet);

  return (
    <div className="TransactionReceipt">
      {txStatus === ITxStatus.PENDING && (
        <div className="TransactionReceipt-row">
          <div className="TransactionReceipt-row-desc">
            {protectTxEnabled && !web3Wallet && <SSpacer />}
            {translate('TRANSACTION_BROADCASTED_DESC')}
          </div>
        </div>
      )}
      {txType === ITxType.SWAP && swapDisplay && (
        <div className="TransactionReceipt-row">
          <SwapFromToDiagram
            fromSymbol={swapDisplay.fromAsset.ticker}
            toSymbol={swapDisplay.toAsset.ticker}
            fromAmount={swapDisplay.fromAmount.toString()}
            toAmount={swapDisplay.toAmount.toString()}
            fromUUID={swapDisplay.fromAsset.uuid}
            toUUID={swapDisplay.toAsset.uuid}
          />
        </div>
      )}
      <FromToAccount
        networkId={sender.network.id}
        fromAccount={{
          address: (sender.address || (displayTxReceipt && displayTxReceipt.from)) as TAddress,
          addressBookEntry: senderContact
        }}
        toAccount={{
          address: (receiverAddress || (displayTxReceipt && displayTxReceipt.to)) as TAddress,
          addressBookEntry: recipientContact
        }}
      />

      {txType !== ITxType.SWAP && (
        <div className="TransactionReceipt-row">
          <div className="TransactionReceipt-row-column">
            <img src={sentIcon} alt="Sent" />
            {translate('CONFIRM_TX_SENT')}
          </div>
          <div className="TransactionReceipt-row-column rightAligned">
            <AssetIcon uuid={asset.uuid} size={'24px'} />
            <Amount
              assetValue={`${parseFloat(assetAmount()).toFixed(6)} ${assetTicker()}`}
              fiat={{
                symbol: getFiat(settings).symbol,
                ticker: getFiat(settings).ticker,
                amount: convertToFiat(parseFloat(assetAmount()), assetRate).toFixed(2)
              }}
            />
          </div>
        </div>
      )}
      <div className="TransactionReceipt-divider" />
      <div className="TransactionReceipt-details">
        <div className="TransactionReceipt-details-row">
          <div className="TransactionReceipt-details-row-column">
            {translate('TRANSACTION_ID')}:
          </div>
          <div className="TransactionReceipt-details-row-column">
            {displayTxReceipt && txConfig.network && txConfig.network.blockExplorer && (
              <LinkOut
                text={displayTxReceipt.hash}
                truncate={truncate}
                link={txConfig.network.blockExplorer.txUrl(displayTxReceipt.hash)}
              />
            )}
            {!displayTxReceipt && <PendingTransaction />}
          </div>
        </div>

        <div className="TransactionReceipt-details-row">
          <div className="TransactionReceipt-details-row-column">
            {translate('TRANSACTION_STATUS')}:
          </div>
          <div className="TransactionReceipt-details-row-column">
            {displayTxReceipt && translate(txStatus)}
            {!displayTxReceipt && <PendingTransaction />}
          </div>
        </div>

        <div className="TransactionReceipt-details-row">
          <div className="TransactionReceipt-details-row-column">{translate('TIMESTAMP')}:</div>
          <div className="TransactionReceipt-details-row-column">
            {displayTxReceipt &&
              (timestamp !== 0 ? (
                <div>
                  {<TimeElapsed value={timestamp * 1000} />}
                  <br /> {localTimestamp}
                </div>
              ) : (
                translate('UNKNOWN')
              ))}
            {!displayTxReceipt && <PendingTransaction />}
          </div>
        </div>

        {protectTxButton && protectTxButton()}

        <TransactionDetailsDisplay
          baseAsset={baseAsset}
          asset={asset}
          confirmations={displayTxReceipt && displayTxReceipt.confirmations}
          gasUsed={displayTxReceipt && displayTxReceipt.gasUsed}
          data={data}
          sender={sender}
          gasLimit={gasLimit}
          gasPrice={gasPrice}
          nonce={nonce}
          rawTransaction={txConfig.rawTransaction}
          fiat={fiat}
          baseAssetRate={baseAssetRate}
        />
      </div>
      {shouldRenderPendingBtn && (
        <Button
          secondary={true}
          className="TransactionReceipt-another"
          onClick={() => pendingButton!.action(resetFlow)}
        >
          {pendingButton!.text}
        </Button>
      )}
      {completeButtonText && !shouldRenderPendingBtn && (
        <Button secondary={true} className="TransactionReceipt-another" onClick={resetFlow}>
          {completeButtonText}
        </Button>
      )}
      <Link to={ROUTE_PATHS.DASHBOARD.path}>
        <Button className="TransactionReceipt-back">
          {translate('TRANSACTION_BROADCASTED_BACK_TO_DASHBOARD')}
        </Button>
      </Link>
    </div>
  );
};
