import algosdk from 'algosdk';
import type { 
  CreateAgentParams, 
  RequestPaymentParams,
  ApprovalResponse 
} from '@/types/contract';

// Initialize Algorand clients
export const algodClient = new algosdk.Algodv2(
  process.env.NEXT_PUBLIC_ALGOD_TOKEN || '',
  process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.4160.nodely.io',
  443
);

export const indexerClient = new algosdk.Indexer(
  process.env.NEXT_PUBLIC_ALGOD_TOKEN || '',
  process.env.NEXT_PUBLIC_INDEXER_SERVER || 'https://testnet-idx.4160.nodely.io',
  443
);

// Contract interaction class
export class PayGuardContract {
  private appId: number;
  private appAddress: string;

  constructor(appId: number) {
    this.appId = appId;
    this.appAddress = String(algosdk.getApplicationAddress(appId));
  }

  // Create a new agent wallet
  async createAgentWallet(
    params: CreateAgentParams, 
    sender: algosdk.Account
  ): Promise<string> {    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Prepare application arguments
      const appArgs = [
        new Uint8Array(Buffer.from('createAgentWallet')),
        new Uint8Array(Buffer.from(params.agentId)),
        algosdk.encodeUint64(params.spendingLimit)
      ];

      // Create application call transaction
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: sender.addr,
        suggestedParams,
        appIndex: this.appId,
        appArgs
      });

      // Sign and send transaction
      const signedTxn = txn.signTxn(sender.sk);
      const response = await algodClient.sendRawTransaction(signedTxn).do();
      
      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, response.txid, 4);
      
      // Generate deterministic wallet address for the agent
      const walletAddress = this.generateAgentAddress(params.agentId);
      
      return walletAddress;
    } catch (error) {
      console.error('Error creating agent wallet:', error);
      throw error;
    }
  }
  // Request payment from an agent
  async requestPayment(
    params: RequestPaymentParams,
    sender: algosdk.Account
  ): Promise<number> {
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      const appArgs = [
        new Uint8Array(Buffer.from('requestPayment')),
        new Uint8Array(Buffer.from(params.agentId)),
        algosdk.encodeUint64(params.amount),
        algosdk.decodeAddress(params.recipient).publicKey,
        new Uint8Array(Buffer.from(params.reason))
      ];

      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: sender.addr,
        suggestedParams,
        appIndex: this.appId,
        appArgs
      });

      const signedTxn = txn.signTxn(sender.sk);
      const response = await algodClient.sendRawTransaction(signedTxn).do();
      
      const confirmedTxn = await algosdk.waitForConfirmation(algodClient, response.txid, 4);
      
      // Extract request ID from transaction logs
      const requestId = this.extractRequestIdFromLogs(confirmedTxn);
      
      return requestId;
    } catch (error) {
      console.error('Error requesting payment:', error);
      throw error;
    }
  }
  // Approve a payment request
  async approvePayment(
    requestId: number,
    sender: algosdk.Account
  ): Promise<ApprovalResponse> {
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      const appArgs = [
        new Uint8Array(Buffer.from('approvePayment')),
        algosdk.encodeUint64(requestId)
      ];

      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: sender.addr,
        suggestedParams,
        appIndex: this.appId,
        appArgs
      });

      const signedTxn = txn.signTxn(sender.sk);
      const response = await algodClient.sendRawTransaction(signedTxn).do();
      
      await algosdk.waitForConfirmation(algodClient, response.txid, 4);
      
      return {
        success: true,
        transactionId: response.txid
      };
    } catch (error) {
      console.error('Error approving payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  // Deny a payment request
  async denyPayment(
    requestId: number,
    sender: algosdk.Account
  ): Promise<ApprovalResponse> {
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      const appArgs = [
        new Uint8Array(Buffer.from('denyPayment')),
        algosdk.encodeUint64(requestId)
      ];

      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: sender.addr,
        suggestedParams,
        appIndex: this.appId,
        appArgs
      });

      const signedTxn = txn.signTxn(sender.sk);
      const response = await algodClient.sendRawTransaction(signedTxn).do();
      
      await algosdk.waitForConfirmation(algodClient, response.txid, 4);
      
      return {
        success: true,
        transactionId: response.txid
      };
    } catch (error) {
      console.error('Error denying payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  // Update spending limit
  async setSpendingLimit(
    agentId: string,
    newLimit: number,
    sender: algosdk.Account
  ): Promise<boolean> {
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      const appArgs = [
        new Uint8Array(Buffer.from('setSpendingLimit')),
        new Uint8Array(Buffer.from(agentId)),
        algosdk.encodeUint64(newLimit)
      ];

      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: sender.addr,
        suggestedParams,
        appIndex: this.appId,
        appArgs
      });

      const signedTxn = txn.signTxn(sender.sk);
      const response = await algodClient.sendRawTransaction(signedTxn).do();
      
      await algosdk.waitForConfirmation(algodClient, response.txid, 4);
      
      return true;
    } catch (error) {
      console.error('Error setting spending limit:', error);
      return false;
    }
  }

  // Get agent balance
  async getAgentBalance(_agentId: string): Promise<number> {
    try {
      // Read from global state
      await algodClient.getApplicationByID(this.appId).do();
      
      // Parse global state to find agent info
      // This is simplified - in reality you'd parse the state properly
      return 0; // Placeholder
    } catch (error) {
      console.error('Error getting agent balance:', error);
      return 0;
    }
  }

  // Helper: Generate deterministic address for agent
  private generateAgentAddress(agentId: string): string {
    // Create a deterministic address based on agent ID and app address
    // In a real implementation, this would be more sophisticated
    // For now, return a placeholder using the app address
    return `${this.appAddress}-${agentId}`;
  }

  // Helper: Extract request ID from transaction logs
  private extractRequestIdFromLogs(_confirmedTxn: algosdk.modelsv2.PendingTransactionResponse): number {
    // Parse transaction logs to get request ID
    // This is simplified - you'd parse actual logs
    return Date.now(); // Placeholder
  }
}

// Create a new Algorand account
export function createAccount(): algosdk.Account {
  return algosdk.generateAccount();
}

// Restore account from mnemonic
export function restoreAccount(mnemonic: string): algosdk.Account {
  return algosdk.mnemonicToSecretKey(mnemonic);
}