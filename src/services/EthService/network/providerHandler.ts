import ethers from 'ethers';
import { TransactionReceipt, TransactionResponse, Block } from 'ethers/providers/abstract-provider';
import { BaseProvider } from 'ethers/providers/base-provider';

import { formatEther } from 'ethers/utils/units';
import { BigNumber } from 'ethers/utils/bignumber';

import { Asset, Network, IHexStrTransaction, TxObj, ITxSigned } from '@types';
import { RPCRequests, baseToConvertedUnit, ERC20 } from '@services/EthService';
import { DEFAULT_ASSET_DECIMAL } from '@config';
import { createCustomNodeProvider } from './helpers';
import { ContractKitProvider } from './ethersJsProvider';

export class ProviderHandler {
  /* TODO: Needs handling for web3 providers. */
  public static fetchProvider(network: Network): BaseProvider {
    const contractKitProvider = ContractKitProvider.getContractKitInstance(network);
    const web3Provider = contractKitProvider.web3.currentProvider;
    const ethersJsProvider = new ethers.providers.Web3Provider(web3Provider as any);
    console.debug(ethersJsProvider);
    return ethersJsProvider;
  }

  public static fetchSingleProvider(network: Network): BaseProvider {
    const contractKitProvider = createCustomNodeProvider(network);
    const web3Provider = contractKitProvider.web3.currentProvider;
    const ethersJsProvider = new ethers.providers.Web3Provider(web3Provider as any);
    console.debug(ethersJsProvider);
    return ethersJsProvider;
  }

  public network: Network;
  public requests: RPCRequests;
  private isFallbackProvider: boolean;

  constructor(network: Network, isFallbackProvider = true) {
    this.network = network;
    this.requests = new RPCRequests();
    this.isFallbackProvider = isFallbackProvider;
  }

  public call(txObj: TxObj): Promise<string> {
    return this.injectClient((client) => {
      return client.call(txObj);
    });
  }

  /* Tested */
  public getBalance(address: string): Promise<string> {
    return this.getRawBalance(address).then((data) => formatEther(data));
  }

  public getRawBalance(address: string): Promise<BigNumber> {
    return this.injectClient((client) => {
      const z = client.getBalance(address);
      console.debug('[address to fetch rawbalance]: ', address);
      console.debug(client);
      return z;
    });
  }

  /* Tested*/
  public estimateGas(transaction: Partial<IHexStrTransaction>): Promise<string> {
    return this.injectClient((client) =>
      client.estimateGas(transaction).then((data) => data.toString())
    );
  }

  public getRawTokenBalance(address: string, token: Asset): Promise<string> {
    return this.injectClient((client) =>
      client
        .call({
          to: this.requests.getTokenBalance(address, token).params[0].to,
          data: this.requests.getTokenBalance(address, token).params[0].data
        })
        .then((data) => ERC20.balanceOf.decodeOutput(data))
        .then(({ balance }) => balance)
    );
  }

  /* Tested */
  public getTokenBalance(address: string, token: Asset): Promise<string> {
    return this.getRawTokenBalance(address, token).then((balance) =>
      baseToConvertedUnit(balance, token.decimal || DEFAULT_ASSET_DECIMAL)
    );
  }

  /* Tested */
  public getTransactionCount(address: string): Promise<number> {
    return this.injectClient((client) => client.getTransactionCount(address));
  }

  /* Tested */
  public getTransactionByHash(txhash: string): Promise<TransactionResponse> {
    return this.injectClient((client) => client.getTransaction(txhash));
  }

  /* Tested */
  public getTransactionReceipt(txhash: string): Promise<TransactionReceipt> {
    return this.injectClient((client) => client.getTransactionReceipt(txhash));
  }

  public getBlockByHash(blockHash: string): Promise<Block> {
    return this.injectClient((client) => client.getBlock(blockHash, false));
  }

  public getBlockByNumber(blockNumber: number): Promise<Block> {
    return this.injectClient((client) => client.getBlock(blockNumber, false));
  }

  /* Tested */
  public getCurrentBlock(): Promise<string> {
    return this.injectClient((client) => client.getBlockNumber().then((data) => data.toString()));
  }

  public sendRawTx(signedTx: string | ITxSigned): Promise<TransactionResponse> {
    return this.injectClient((client) => client.sendTransaction(signedTx as string));
  }

  public waitForTransaction(txHash: string, confirmations = 1): Promise<TransactionReceipt> {
    return this.injectClient((client) => client.waitForTransaction(txHash, confirmations));
  }

  protected injectClient(clientInjectCb: (client: BaseProvider) => any) {
    if (clientInjectCb) {
      if (this.isFallbackProvider) {
        return clientInjectCb(ProviderHandler.fetchProvider(this.network));
      }
      return clientInjectCb(ProviderHandler.fetchSingleProvider(this.network));
    }
  }
}
