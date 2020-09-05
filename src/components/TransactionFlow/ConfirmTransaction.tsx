import React, { useContext, useState } from 'react';
import Styled from 'styled-components';
import BN from 'bn.js';

import { StoreContext, SettingsContext, useContacts } from '@services/Store';
import { Amount, AssetIcon, Button } from '@components';
import { fromWei, Wei, totalTxFeeToString, totalTxFeeToWei } from '@services/EthService';
import { convertToFiat } from '@utils';
import translate, { translateRaw } from '@translations';
import { BREAK_POINTS } from '@theme';
import { useRates } from '@services';
import { IStepComponentProps, ITxType, ExtendedContact, ISettings } from '@types';
import { getFiat } from '@config/fiats';

import TransactionDetailsDisplay from './displays/TransactionDetailsDisplay';
import TxIntermediaryDisplay from './displays/TxIntermediaryDisplay';
import { FromToAccount } from './displays';
import { constructSenderFromTxConfig } from './helpers';
import { ISender } from './types';

import feeIcon from '@assets/images/icn-fee.svg';
import sendIcon from '@assets/images/icn-send.svg';
import walletIcon from '@assets/images/icn-wallet.svg';

const { SCREEN_XS } = BREAK_POINTS;

const ConfirmTransactionWrapper = Styled.div`
  text-align: left;
`;

const RowWrapper = Styled.div<{ stack?: boolean }>`
  display: flex;
  margin-bottom: 24px;
  flex-direction: ${(props) => (props.stack ? 'column' : 'row')};
  @media (min-width: ${SCREEN_XS}) {
    flex-direction: row;
    align-items: center;
  }
`;

const ColumnWrapper = Styled.div<{ bold?: boolean }>`
  font-size: 16px;
  flex: 1;
  font-weight: ${(props) => (props.bold ? 'bold' : 'normal')};
  @media (min-width: ${SCREEN_XS}) {
    margin-bottom: 0;
  }
  @media (min-width: ${SCREEN_XS}) {
    font-size: 18px;
  }
  img {
    width: auto;
    height: 25px;
    margin-right: 10px;
  }
  svg {
    width: auto;
    height: 25px;
    margin-right: 10px;
    vertical-align: middle;
  }
`;

const SendButton = Styled(Button)`
  > div {
    justify-content: center;
  }
`;

const AmountWrapper = Styled(ColumnWrapper)`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
  img {
    display: none;
    @media (min-width: ${SCREEN_XS}) {
      margin-right: 10px;
      display: block;
    }
  }
`;

const Divider = Styled.div`
  height: 1px;
  margin-bottom: 20px;
  background: #e3edff;
`;

export default function ConfirmTransaction({
  txType = ITxType.STANDARD,
  txConfig,
  onComplete,
  signedTx
}: IStepComponentProps & { protectTxButton?(): JSX.Element }) {
  const { asset, baseAsset, receiverAddress, network, from } = txConfig;

  const { getContactByAddressAndNetworkId } = useContacts();
  const { getAssetRate } = useRates();
  const { accounts } = useContext(StoreContext);
  const { settings } = useContext(SettingsContext);
  /* Get contact info */
  const recipientContact = getContactByAddressAndNetworkId(receiverAddress, network.id);
  const senderContact = getContactByAddressAndNetworkId(from, network.id);
  const sender = constructSenderFromTxConfig(txConfig, accounts);

  /* Get Rates */
  const assetRate = getAssetRate(asset);
  const baseAssetRate = getAssetRate(baseAsset);

  return (
    <ConfirmTransactionUI
      settings={settings}
      assetRate={assetRate}
      baseAssetRate={baseAssetRate}
      senderContact={senderContact}
      sender={sender}
      txType={txType}
      txConfig={txConfig}
      recipientContact={recipientContact}
      onComplete={onComplete}
      signedTx={signedTx}
    />
  );
}

interface DataProps {
  settings: ISettings;
  assetRate?: number;
  baseAssetRate?: number;
  recipientContact?: ExtendedContact;
  senderContact?: ExtendedContact;
  sender: ISender;
  protectTxButton?(): JSX.Element;
}

type UIProps = Omit<IStepComponentProps, 'resetFlow'> & DataProps;

export const ConfirmTransactionUI = ({
  settings,
  assetRate,
  baseAssetRate,
  senderContact,
  sender,
  recipientContact,
  txConfig,
  onComplete,
  signedTx
}: UIProps) => {
  const {
    asset,
    gasPrice,
    gasLimit,
    value,
    amount,
    receiverAddress,
    nonce,
    data,
    baseAsset
  } = txConfig;
  const [isBroadcastingTx, setIsBroadcastingTx] = useState(false);
  const handleApprove = () => {
    setIsBroadcastingTx(true);
    onComplete(null);
  };

  const assetType = asset.type;

  /* Calculate Transaction Fee */
  const transactionFeeWei: BN = totalTxFeeToWei(gasPrice, gasLimit);
  const maxTransactionFeeBase: string = totalTxFeeToString(gasPrice, gasLimit);

  /* Calculate total base asset amount */
  const valueWei = Wei(value);
  // @todo: BN math, add amount + maxCost !In same symbol
  const totalEtherEgress = parseFloat(fromWei(valueWei.add(transactionFeeWei), 'ether')).toFixed(6);

  const fiat = getFiat(settings);

  return (
    <ConfirmTransactionWrapper>
      <FromToAccount
        networkId={sender.network.id}
        fromAccount={{
          address: sender.address,
          addressBookEntry: senderContact
        }}
        toAccount={{
          address: receiverAddress,
          addressBookEntry: recipientContact
        }}
        displayToAddress={true}
      />
      {assetType === 'erc20' && asset && asset.contractAddress && (
        <RowWrapper>
          <TxIntermediaryDisplay address={asset.contractAddress} contractName={asset.ticker} />
        </RowWrapper>
      )}
      <RowWrapper>
        <ColumnWrapper>
          <img src={sendIcon} alt="Send" />
          {translate('CONFIRM_TX_SENDING')}
        </ColumnWrapper>
        <AmountWrapper>
          <AssetIcon uuid={asset.uuid} size={'25px'} />
          <Amount
            assetValue={`${parseFloat(amount).toFixed(6)} ${asset.ticker}`}
            fiat={{
              symbol: getFiat(settings).symbol,
              ticker: getFiat(settings).ticker,
              amount: convertToFiat(parseFloat(amount), assetRate).toFixed(2)
            }}
          />
        </AmountWrapper>
      </RowWrapper>
      <RowWrapper>
        <ColumnWrapper>
          <img src={feeIcon} alt="Fee" /> {translate('CONFIRM_TX_FEE')}
        </ColumnWrapper>
        <AmountWrapper>
          <AssetIcon uuid={baseAsset.uuid} size={'25px'} />
          <Amount
            assetValue={`${maxTransactionFeeBase} ${baseAsset.ticker}`}
            fiat={{
              symbol: getFiat(settings).symbol,
              ticker: getFiat(settings).ticker,
              amount: convertToFiat(parseFloat(maxTransactionFeeBase), baseAssetRate).toFixed(2)
            }}
          />
        </AmountWrapper>
      </RowWrapper>
      <Divider />
      <RowWrapper>
        <ColumnWrapper bold={true}>
          <img src={walletIcon} alt="Total" />
          {translate('TOTAL')}
        </ColumnWrapper>
        <AmountWrapper>
          {assetType === 'base' ? (
            <>
              <AssetIcon uuid={asset.uuid} size={'25px'} />
              <Amount
                assetValue={`${totalEtherEgress} ${asset.ticker}`}
                fiat={{
                  symbol: getFiat(settings).symbol,
                  ticker: getFiat(settings).ticker,
                  amount: convertToFiat(parseFloat(totalEtherEgress), assetRate).toFixed(2)
                }}
              />
            </>
          ) : (
            <>
              <AssetIcon uuid={asset.uuid} size={'25px'} />
              <Amount
                assetValue={`${amount} ${asset.ticker}`}
                bold={true}
                baseAssetValue={`+ ${totalEtherEgress} ${baseAsset.ticker}`}
                fiat={{
                  symbol: getFiat(settings).symbol,
                  ticker: getFiat(settings).ticker,
                  amount: (
                    convertToFiat(parseFloat(amount), assetRate) +
                    convertToFiat(parseFloat(totalEtherEgress), baseAssetRate)
                  ).toFixed(2)
                }}
              />
            </>
          )}
        </AmountWrapper>
      </RowWrapper>
      <TransactionDetailsDisplay
        baseAsset={baseAsset}
        asset={asset}
        data={data}
        sender={sender}
        gasLimit={gasLimit}
        gasPrice={gasPrice}
        nonce={nonce}
        signedTransaction={signedTx}
        fiat={fiat}
        baseAssetRate={baseAssetRate}
      />
      <SendButton
        onClick={handleApprove}
        disabled={isBroadcastingTx}
        className="ConfirmTransaction-button"
        loading={isBroadcastingTx}
        fullwidth={true}
      >
        {isBroadcastingTx ? translateRaw('SUBMITTING') : translateRaw('CONFIRM_AND_SEND')}
      </SendButton>
    </ConfirmTransactionWrapper>
  );
};
