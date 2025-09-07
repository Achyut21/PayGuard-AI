#!/usr/bin/env node

/**
 * PayGuard AI - Blockchain Testing Script
 * This script helps you test and verify blockchain integration
 */

import algosdk from 'algosdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Algorand node configuration - Using AlgoNode free public endpoints
const algodClient = new algosdk.Algodv2(
  '', // No token needed for public endpoints
  'https://testnet-api.algonode.cloud',
  443
);

// AlgoNode indexer
const indexerClient = new algosdk.Indexer(
  '',
  'https://testnet-idx.algonode.cloud',
  443
);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function checkBlockchainConnection() {
  console.log(`\n${colors.cyan}=== Testing Algorand Blockchain Connection ===${colors.reset}\n`);
  
  try {
    // Test connection to Algorand node
    const status = await algodClient.status().do();
    console.log(`${colors.green}✅ Connected to Algorand TestNet${colors.reset}`);
    console.log(`   Network: TestNet`);
    console.log(`   Last Round: ${status['last-round']}`);
    console.log(`   Catchup Time: ${status['catchup-time']}s`);
    
    // Test indexer connection
    const health = await indexerClient.makeHealthCheck().do();
    console.log(`${colors.green}✅ Indexer is healthy${colors.reset}`);
    
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Failed to connect to Algorand${colors.reset}`);
    console.error(error);
    return false;
  }
}

async function checkWalletBalance(address) {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    console.log(`\n${colors.cyan}=== Wallet Balance ===${colors.reset}`);
    console.log(`   Address: ${address}`);
    console.log(`   Balance: ${(Number(accountInfo.amount) / 1000000).toFixed(6)} ALGO`);
    console.log(`   Min Balance: ${(Number(accountInfo['min-balance']) / 1000000).toFixed(6)} ALGO`);
    console.log(`   Available: ${((Number(accountInfo.amount) - Number(accountInfo['min-balance'])) / 1000000).toFixed(6)} ALGO`);
    
    if (Number(accountInfo.amount) < 1000000) {
      console.log(`${colors.yellow}⚠️  Low balance! Fund your account at: https://bank.testnet.algorand.network/${colors.reset}`);
    }
    
    return accountInfo;
  } catch (error) {
    console.log(`${colors.red}❌ Failed to get wallet balance${colors.reset}`);
    console.error(error.message);
    return null;
  }
}

async function getTransactionHistory(address, limit = 5) {
  try {
    console.log(`\n${colors.cyan}=== Recent Transactions ===${colors.reset}`);
    
    const transactions = await indexerClient
      .searchForTransactions()
      .address(address)
      .addressRole('sender')
      .limit(limit)
      .do();
    
    if (transactions.transactions.length === 0) {
      console.log('   No transactions found');
      return [];
    }
    
    transactions.transactions.forEach((tx, index) => {
      console.log(`\n   Transaction ${index + 1}:`);
      console.log(`   - ID: ${tx.id}`);
      console.log(`   - Type: ${tx['tx-type']}`);
      console.log(`   - Amount: ${(tx['payment-transaction']?.amount || 0) / 1000000} ALGO`);
      console.log(`   - Fee: ${tx.fee / 1000000} ALGO`);
      console.log(`   - Round: ${tx['confirmed-round']}`);
    });
    
    return transactions.transactions;
  } catch (error) {
    console.log(`${colors.red}❌ Failed to get transaction history${colors.reset}`);
    console.error(error.message);
    return [];
  }
}

async function checkSmartContract(appId) {
  console.log(`\n${colors.cyan}=== Smart Contract Status ===${colors.reset}`);
  
  if (!appId) {
    console.log(`${colors.yellow}⚠️  No smart contract deployed (APP_ID not set)${colors.reset}`);
    console.log(`   The app is currently running in database-only mode`);
    console.log(`   To enable blockchain transactions:`);
    console.log(`   1. Deploy the smart contract: npm run contract:deploy`);
    console.log(`   2. Set NEXT_PUBLIC_APP_ID in .env.local`);
    return false;
  }
  
  try {
    const app = await algodClient.getApplicationByID(appId).do();
    console.log(`${colors.green}✅ Smart contract found${colors.reset}`);
    console.log(`   App ID: ${appId}`);
    console.log(`   Creator: ${app.params.creator}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Smart contract not found${colors.reset}`);
    console.error(error.message);
    return false;
  }
}

async function main() {
  console.log(`${colors.blue}${'='.repeat(60)}`);
  console.log('       PayGuard AI - Blockchain Testing Tool');
  console.log(`${'='.repeat(60)}${colors.reset}`);
  
  // Check blockchain connection
  const isConnected = await checkBlockchainConnection();
  if (!isConnected) {
    process.exit(1);
  }
  
  // Check if user wallet is configured
  const userAddress = process.env.TEST_WALLET_ADDRESS;
  if (userAddress) {
    await checkWalletBalance(userAddress);
    await getTransactionHistory(userAddress);
  } else {
    console.log(`\n${colors.yellow}⚠️  No test wallet configured${colors.reset}`);
    console.log('   Set TEST_WALLET_ADDRESS in .env.local to test transactions');
  }
  
  // Check smart contract
  const appId = process.env.NEXT_PUBLIC_APP_ID;
  await checkSmartContract(appId ? parseInt(appId) : null);
  
  // Summary
  console.log(`\n${colors.cyan}=== Current Status ===${colors.reset}`);
  console.log(`   Blockchain Connection: ${colors.green}✅ Active${colors.reset}`);
  console.log(`   Smart Contract: ${appId ? colors.green + '✅ Deployed' : colors.yellow + '⚠️  Not deployed'}${colors.reset}`);
  console.log(`   Transaction Mode: ${appId ? colors.green + 'Blockchain' : colors.yellow + 'Database-only'}${colors.reset}`);
  
  if (!appId) {
    console.log(`\n${colors.yellow}📝 Note: The app is currently simulating blockchain behavior using the database.${colors.reset}`);
    console.log(`   Real ALGO transactions are NOT being executed.`);
    console.log(`   To enable real blockchain transactions:`);
    console.log(`   1. Deploy the smart contract`);
    console.log(`   2. Update the API endpoints to execute real transactions`);
    console.log(`   3. Test with small amounts on TestNet first`);
  }
  
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

// Run the test
main().catch(console.error);
