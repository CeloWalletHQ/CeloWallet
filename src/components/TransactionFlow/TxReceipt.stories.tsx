import React from 'react';

import { fTxConfig, fTxReceipt, fAccount, fSettings } from '@fixtures';
import { ITxStatus, ExtendedAddressBook, ITxType } from '@types';
import { noOp } from '@utils';
import { devContacts } from '@database/seed';
import { MEMBERSHIP_CONFIG, IMembershipId } from '@features/PurchaseMembership/config';

import { TxReceiptUI } from './TxReceipt';
import { constructSenderFromTxConfig } from './helpers';

// Define props
const assetRate = () => 1.34;
const timestamp = 1583266291;
const txStatus = ITxStatus.SUCCESS;
const senderContact = devContacts[0] as ExtendedAddressBook;
const recipientContact = devContacts[1] as ExtendedAddressBook;
const resetFlow = noOp;

export default { title: 'TxReceipt' };

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
    />
  </div>
);

export const transactionReceiptMembership = () => (
  <div className="sb-container" style={{ maxWidth: '620px' }}>
    <TxReceiptUI
      settings={fSettings}
      txReceipt={fTxReceipt}
      txConfig={fTxConfig}
      txType={ITxType.PURCHASE_MEMBERSHIP}
      membershipSelected={MEMBERSHIP_CONFIG[IMembershipId.threemonths]}
      timestamp={timestamp}
      txStatus={txStatus}
      assetRate={assetRate}
      displayTxReceipt={fTxReceipt}
      senderContact={senderContact}
      recipientContact={recipientContact}
      sender={constructSenderFromTxConfig(fTxConfig, [fAccount])}
      resetFlow={resetFlow}
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
        'https://www.figma.com/file/BY0SWc75teEUZzws8JdgLMpy/%5BCeloWallet%5D-GAU-Master?node-id=8544%3A116927'
    }
  }
};
