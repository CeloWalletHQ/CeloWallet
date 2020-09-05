import React from 'react';

import { fTxConfig, fTxReceipt, fAccount, fSettings } from '@fixtures';
import { ITxStatus, ExtendedContact } from '@types';
import { noOp } from '@utils';
import { devContacts } from '@database/seed';
import { Fiats } from '@config';

import { TxReceiptUI } from './TxReceipt';
import { constructSenderFromTxConfig } from './helpers';

// Define props
const assetRate = 1.34;
const timestamp = 1583266291;
const txStatus = ITxStatus.SUCCESS;
const senderContact = Object.values(devContacts)[0] as ExtendedContact;
const recipientContact = Object.values(devContacts)[1] as ExtendedContact;
const resetFlow = noOp;

export default { title: 'TxReceipt' };

export const transactionReceiptPending = () => (
  <div className="sb-container" style={{ maxWidth: '620px' }}>
    <TxReceiptUI
      settings={fSettings}
      txStatus={ITxStatus.PENDING}
      timestamp={timestamp}
      resetFlow={resetFlow}
      assetRate={assetRate}
      senderContact={senderContact}
      recipientContact={recipientContact}
      txConfig={fTxConfig}
      sender={constructSenderFromTxConfig(fTxConfig, [fAccount])}
      baseAssetRate={assetRate}
      fiat={Fiats.USD}
    />
  </div>
);

export const transactionReceipt = () => (
  <div className="sb-container" style={{ maxWidth: '620px' }}>
    <TxReceiptUI
      settings={fSettings}
      txStatus={txStatus}
      displayTxReceipt={fTxReceipt}
      timestamp={timestamp}
      resetFlow={resetFlow}
      assetRate={assetRate}
      senderContact={senderContact}
      recipientContact={recipientContact}
      txConfig={fTxConfig}
      sender={constructSenderFromTxConfig(fTxConfig, [fAccount])}
      baseAssetRate={assetRate}
      fiat={Fiats.USD}
    />
  </div>
);

// Uncomment this for Figma support:

(transactionReceipt as any).story = {
  name: 'TransactionReceipt-Standard',
  parameters: {
    design: {
      type: 'figma',
      url:
        'https://www.figma.com/file/BY0SWc75teEUZzws8JdgLMpy/%5BMyCrypto%5D-GAU-Master?node-id=8544%3A116927'
    }
  }
};
