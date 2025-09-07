/**
 * PayGuard AI - Blockchain Integration Utilities
 * Handles all blockchain transactions and smart contract interactions
 */

import algosdk from 'algosdk';

// Initialize Algorand client
const algodClient = new algosdk.Algodv2(
  '',
  process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
  443
);

const indexerClient = new algosdk.Indexer(
  '',
  process.env.NEXT_PUBLIC_INDEXER_SERVER || 'https://testnet-idx.algonode.cloud',
  443
);

// Get app ID from environment
const APP_ID = process.env.NEXT_PUBLIC_APP_ID ? parseInt(process.env.NEXT_PUBLIC_APP_ID) : 0;

/**
 * Check if blockchain mode is enabled
 */
export function isBlockchainEnabled(): boolean {
  return APP_ID > 0;
}

/**
 * Get Algorand clients
 */
export function getAlgorandClients() {
  return { algodClient, indexerClient };
}

/**
 * Create a new Algorand account
 */
export function createAccount(): algosdk.Account {
  return algosdk.generateAccount();
}

/**
 * Get account information
 */
export async function getAccountInfo(address: string) {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return {
      address,
      amount: Number(accountInfo.amount),
      minBalance: Number(accountInfo['min-balance']),
      availableBalance: Number(accountInfo.amount) - Number(accountInfo['min-balance']),
    };
  } catch (error) {
    console.error('Error getting account info:', error);
    return null;
  }
}

/**
 * Fund an account (for agent wallets)
 */
export async function fundAccount(
  senderMnemonic: string,
  recipientAddress: string,
  amount: number // in microAlgos
): Promise<string | null> {
  try {
    const sender = algosdk.mnemonicToSecretKey(senderMnemonic);
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: sender.addr,
      to: recipientAddress,
      amount,
      suggestedParams,
      note: new TextEncoder().encode('PayGuard AI: Agent wallet funding'),
    });
    
    const signedTxn = txn.signTxn(sender.sk);
    const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txid, 4);
    
    return txid;
  } catch (error) {
    console.error('Error funding account:', error);
    return null;
  }
}

/**
 * Create an AI agent on the blockchain
 */
export async function createAgentOnChain(
  creatorMnemonic: string,
  agentId: string,
  spendingLimit: number
): Promise<string | null> {
  if (!isBlockchainEnabled()) {
    console.log('Blockchain not enabled, skipping on-chain creation');
    return null;
  }
  
  try {
    const creator = algosdk.mnemonicToSecretKey(creatorMnemonic);
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    const appArgs = [
      new TextEncoder().encode('createAgent'),
      new TextEncoder().encode(agentId),
      algosdk.encodeUint64(spendingLimit),
    ];
    
    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      sender: creator.addr,
      appIndex: APP_ID,
      appArgs,
      suggestedParams,
    });
    
    const signedTxn = txn.signTxn(creator.sk);
    const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
    
    await algosdk.waitForConfirmation(algodClient, txid, 4);
    
    return txid;
  } catch (error) {
    console.error('Error creating agent on-chain:', error);
    return null;
  }
}

/**
 * Execute a payment from an agent wallet
 */
export async function executePayment(
  agentMnemonic: string,
  recipientAddress: string,
  amount: number, // in microAlgos
  note: string
): Promise<{ success: boolean; txid?: string; error?: string }> {
  try {
    const agent = algosdk.mnemonicToSecretKey(agentMnemonic);
    
    // Check agent balance
    const accountInfo = await getAccountInfo(agent.addr);
    if (!accountInfo || accountInfo.availableBalance < amount + 1000) {
      return { 
        success: false, 
        error: 'Insufficient balance in agent wallet' 
      };
    }
    
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create payment transaction
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: agent.addr,
      to: recipientAddress,
      amount,
      suggestedParams,
      note: new TextEncoder().encode(note),
    });
    
    // If smart contract is deployed, also call it to record the payment
    if (isBlockchainEnabled()) {
      const appArgs = [
        new TextEncoder().encode('requestPayment'),
        new TextEncoder().encode(agent.addr),
        algosdk.encodeUint64(amount),
      ];
      
      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: agent.addr,
        appIndex: APP_ID,
        appArgs,
        suggestedParams,
      });
      
      // Group transactions
      const txnGroup = [paymentTxn, appCallTxn];
      algosdk.assignGroupID(txnGroup);
      
      // Sign both transactions
      const signedPayment = paymentTxn.signTxn(agent.sk);
      const signedAppCall = appCallTxn.signTxn(agent.sk);
      
      // Submit grouped transaction
      const signed = [signedPayment, signedAppCall];
      const { txid } = await algodClient.sendRawTransaction(signed).do();
      
      await algosdk.waitForConfirmation(algodClient, txid, 4);
      
      return { success: true, txid };
    } else {
      // Just execute payment without smart contract
      const signedTxn = paymentTxn.signTxn(agent.sk);
      const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
      
      await algosdk.waitForConfirmation(algodClient, txid, 4);
      
      return { success: true, txid };
    }
  } catch (error) {
    console.error('Error executing payment:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to execute payment' 
    };
  }
}

/**
 * Approve a payment on the blockchain
 */
export async function approvePaymentOnChain(
  approverMnemonic: string,
  requestId: number
): Promise<string | null> {
  if (!isBlockchainEnabled()) {
    return null;
  }
  
  try {
    const approver = algosdk.mnemonicToSecretKey(approverMnemonic);
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    const appArgs = [
      new TextEncoder().encode('approvePayment'),
      algosdk.encodeUint64(requestId),
    ];
    
    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      sender: approver.addr,
      appIndex: APP_ID,
      appArgs,
      suggestedParams,
    });
    
    const signedTxn = txn.signTxn(approver.sk);
    const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
    
    await algosdk.waitForConfirmation(algodClient, txid, 4);
    
    return txid;
  } catch (error) {
    console.error('Error approving payment on-chain:', error);
    return null;
  }
}

/**
 * Get transaction details
 */
export async function getTransaction(txid: string) {
  try {
    const txn = await algodClient.pendingTransactionInformation(txid).do();
    return txn;
  } catch (error) {
    console.error('Error getting transaction:', error);
    return null;
  }
}

/**
 * Get transaction history for an address
 */
export async function getTransactionHistory(
  address: string,
  limit: number = 10
) {
  try {
    const transactions = await indexerClient
      .searchForTransactions()
      .address(address)
      .limit(limit)
      .do();
    
    return transactions.transactions;
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return [];
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForConfirmation(txid: string): Promise<any> {
  return await algosdk.waitForConfirmation(algodClient, txid, 4);
}

/**
 * Format microAlgos to ALGO
 */
export function formatAlgo(microAlgos: number): string {
  return (microAlgos / 1000000).toFixed(6);
}

/**
 * Convert ALGO to microAlgos
 */
export function toMicroAlgos(algo: number): number {
  return Math.floor(algo * 1000000);
}
