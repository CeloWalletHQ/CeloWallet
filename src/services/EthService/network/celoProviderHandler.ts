import { Network, ITxSigned, ITxHash } from '@types';
import { RPCRequests } from '@services/EthService';
import { ContractKitProvider } from './ethersJsProvider';
import { ContractKit } from '@celo/contractkit';
import { TransactionResult } from '@celo/contractkit/lib/utils/tx-result';
import { BigNumber } from 'bignumber.js';
import { TransactionReceipt } from '@utils/useTxMulti/types';

export interface AccountBalance {
  gold: BigNumber;
  usd: BigNumber;
  total: BigNumber;
  lockedGold: BigNumber;
  pending: BigNumber;
}

export class CeloProviderHandler {
  /* TODO: Needs handling for web3 providers. */
  public static fetchProvider(network: Network) {
    return ContractKitProvider.getContractKitInstance(network);
  }

  public network: Network;
  public requests: RPCRequests;
  private isFallbackProvider: boolean;

  constructor(network: Network, isFallbackProvider = true) {
    this.network = network;
    this.requests = new RPCRequests();
    this.isFallbackProvider = isFallbackProvider;
  }

  /* Tested */
  public getTotalBalance(address: string): Promise<AccountBalance> {
    return this.injectClient((client) => client.getTotalBalance(address));
  }

  public sendRawTx(signedTx: string | ITxSigned): Promise<TransactionResult> {
    return this.injectClient((client) => {
      const z = client.sendTransaction(signedTx as string);
      return z
        .then((d) => d)
        .catch((e) => {
          console.debug('[sendTransaction] err ', e);
        });
    });
  }

  public getTxReceipt(txHash: ITxHash): Promise<TransactionReceipt> {
    return this.injectClient((client) => {
      const z = client.web3.eth.getTransactionReceipt(txHash);
      return z
        .then((d) => d)
        .catch((e) => {
          console.debug('[getTxReceipt] err ', e);
        });
    });
  }

  protected injectClient(clientInjectCb: (client: ContractKit) => any) {
    if (clientInjectCb) {
      if (this.isFallbackProvider) {
        return clientInjectCb(CeloProviderHandler.fetchProvider(this.network));
      }
      return clientInjectCb(CeloProviderHandler.fetchProvider(this.network));
    }
  }
}
