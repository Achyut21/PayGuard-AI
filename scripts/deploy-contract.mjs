#!/usr/bin/env node

/**
 * PayGuard AI - Smart Contract Deployment Script
 * Deploys the PayGuard AI smart contract to Algorand TestNet
 */

import algosdk from 'algosdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Algorand node configuration
const algodClient = new algosdk.Algodv2(
  '',
  'https://testnet-api.algonode.cloud',
  443
);

// Simple approval program for PayGuard AI
// This is a basic smart contract that allows payment management
const approvalProgramSource = `#pragma version 10
// PayGuard AI Smart Contract

// Handle application creation
txn ApplicationID
int 0
==
bnz handle_creation

// Handle NoOp transactions (method calls)
txn OnCompletion
int NoOp
==
bnz handle_noop

// Handle other transaction types
txn OnCompletion
int DeleteApplication
==
bnz handle_delete

txn OnCompletion
int UpdateApplication
==
bnz handle_update

// Reject by default
int 0
return

handle_creation:
    // Initialize global state
    byte "admin"
    txn Sender
    app_global_put
    
    byte "totalAgents"
    int 0
    app_global_put
    
    byte "nextRequestId"
    int 1
    app_global_put
    
    int 1
    return

handle_noop:
    // Check the first argument for method name
    txna ApplicationArgs 0
    byte "createAgent"
    ==
    bnz create_agent
    
    txna ApplicationArgs 0
    byte "requestPayment"
    ==
    bnz request_payment
    
    txna ApplicationArgs 0
    byte "approvePayment"
    ==
    bnz approve_payment
    
    // Default: approve
    int 1
    return

create_agent:
    // Increment total agents counter
    byte "totalAgents"
    byte "totalAgents"
    app_global_get
    int 1
    +
    app_global_put
    
    // Log the agent creation
    byte "agent_created"
    log
    
    int 1
    return

request_payment:
    // Get and increment request ID
    byte "nextRequestId"
    byte "nextRequestId"
    app_global_get
    dup
    int 1
    +
    app_global_put
    
    // Log the payment request
    byte "payment_requested"
    log
    
    int 1
    return

approve_payment:
    // Only admin can approve
    txn Sender
    byte "admin"
    app_global_get
    ==
    assert
    
    // Log the approval
    byte "payment_approved"
    log
    
    int 1
    return

handle_delete:
    // Only creator can delete
    txn Sender
    global CreatorAddress
    ==
    return

handle_update:
    // Only creator can update
    txn Sender
    global CreatorAddress
    ==
    return`;

// Clear state program (simple approve)
const clearProgramSource = `#pragma version 10
int 1`;

async function compileProgram(client, programSource) {
  const encoder = new TextEncoder();
  const programBytes = encoder.encode(programSource);
  const compileResponse = await client.compile(programBytes).do();
  return new Uint8Array(Buffer.from(compileResponse.result, 'base64'));
}

async function deployContract() {
  console.log('\n🚀 PayGuard AI Smart Contract Deployment\n');
  
  try {
    // Check if deployer mnemonic is set
    const deployerMnemonic = process.env.DEPLOYER_MNEMONIC;
    if (!deployerMnemonic) {
      console.log('❌ DEPLOYER_MNEMONIC not set in .env.local');
      console.log('\nTo deploy the contract:');
      console.log('1. Create a TestNet account at: https://bank.testnet.algorand.network/');
      console.log('2. Save the mnemonic as DEPLOYER_MNEMONIC in .env.local');
      console.log('3. Fund the account with TestNet ALGO');
      console.log('4. Run this script again\n');
      
      // Generate a new account for demonstration
      const account = algosdk.generateAccount();
      const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
      console.log('📝 Generated new account for you:');
      console.log(`Address: ${account.addr}`);
      console.log(`Mnemonic: ${mnemonic}`);
      console.log('\n⚠️  Save this mnemonic and fund the account before deploying!\n');
      return;
    }
    
    // Recover deployer account
    const deployer = algosdk.mnemonicToSecretKey(deployerMnemonic);
    console.log(`📍 Deployer Address: ${deployer.addr}`);
    
    // Check deployer balance
    const accountInfo = await algodClient.accountInformation(deployer.addr).do();
    const balance = Number(accountInfo.amount) / 1000000;
    console.log(`💰 Deployer Balance: ${balance} ALGO`);
    
    if (balance < 1) {
      console.log('\n❌ Insufficient balance for deployment');
      console.log(`Fund your account at: https://bank.testnet.algorand.network/`);
      return;
    }
    
    // Compile programs
    console.log('\n📄 Compiling smart contract...');
    const approvalProgram = await compileProgram(algodClient, approvalProgramSource);
    const clearProgram = await compileProgram(algodClient, clearProgramSource);
    
    console.log('✅ Programs compiled successfully');
    console.log(`   Approval size: ${approvalProgram.length} bytes`);
    console.log(`   Clear size: ${clearProgram.length} bytes`);
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create application
    const numGlobalByteSlices = 4; // For storing addresses and strings
    const numGlobalInts = 3; // For counters
    const numLocalByteSlices = 0; // No local state
    const numLocalInts = 0; // No local state
    
    const createAppTxn = algosdk.makeApplicationCreateTxnFromObject({
      sender: deployer.addr,
      suggestedParams,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      approvalProgram,
      clearProgram,
      numGlobalByteSlices,
      numGlobalInts,
      numLocalByteSlices,
      numLocalInts,
    });
    
    // Sign transaction
    const signedTxn = createAppTxn.signTxn(deployer.sk);
    
    // Submit transaction
    console.log('\n📤 Submitting transaction to blockchain...');
    const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log(`   Transaction ID: ${txid}`);
    
    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    let confirmedTxn;
    try {
      confirmedTxn = await algosdk.waitForConfirmation(algodClient, txid, 4);
    } catch (waitError) {
      console.log('⚠️  Standard confirmation failed, checking transaction directly...');
      // Try to get transaction info directly
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      const txInfo = await algodClient.pendingTransactionInformation(txid).do();
      confirmedTxn = txInfo;
    }
    
    // Get app ID from confirmed transaction
    const appId = confirmedTxn['application-index'] || 
                  confirmedTxn['created-application-index'] || 
                  confirmedTxn['txn']?.['apid'];
    
    if (!appId || appId === 0) {
      console.error('❌ Failed to get application ID from transaction');
      console.log('⚠️  Please check the transaction on AlgoExplorer:');
      console.log(`https://testnet.algoexplorer.io/tx/${txid}`);
      console.log('\nThe contract may have deployed successfully.');
      console.log('Look for "Created Application ID" on the explorer.');
      return;
    }
    
    // Convert appId to number for display and storage
    const appIdNumber = typeof appId === 'bigint' ? Number(appId) : appId;
    const appAddress = algosdk.getApplicationAddress(appIdNumber);
    
    console.log('\n✅ Smart Contract Deployed Successfully!');
    console.log(`   App ID: ${appIdNumber}`);
    console.log(`   App Address: ${appAddress}`);
    console.log(`   Transaction: https://testnet.algoexplorer.io/tx/${txid}`);
    console.log(`   Application: https://testnet.algoexplorer.io/application/${appIdNumber}`);
    
    // Save to environment file
    const envPath = path.join(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    // Update or add APP_ID
    let updatedEnv = envContent;
    if (envContent.includes('NEXT_PUBLIC_APP_ID=')) {
      updatedEnv = envContent.replace(/NEXT_PUBLIC_APP_ID=.*/, `NEXT_PUBLIC_APP_ID=${appIdNumber}`);
    } else {
      updatedEnv = envContent + `\n# Smart Contract Application ID\nNEXT_PUBLIC_APP_ID=${appIdNumber}\n`;
    }
    
    // Update or add CREATOR_ADDRESS
    if (envContent.includes('NEXT_PUBLIC_CREATOR_ADDRESS=')) {
      updatedEnv = updatedEnv.replace(/NEXT_PUBLIC_CREATOR_ADDRESS=.*/, `NEXT_PUBLIC_CREATOR_ADDRESS=${deployer.addr}`);
    } else {
      updatedEnv = updatedEnv + `NEXT_PUBLIC_CREATOR_ADDRESS=${deployer.addr}\n`;
    }
    
    fs.writeFileSync(envPath, updatedEnv);
    console.log('\n✅ Updated .env.local with contract details');
    
    // Instructions for next steps
    console.log('\n📋 Next Steps:');
    console.log('1. Restart your Next.js development server');
    console.log('2. The app will now use blockchain transactions');
    console.log('3. Fund agent wallets when creating them');
    console.log('4. Test with small amounts first!\n');
    
    return { appId: appIdNumber, appAddress };
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

// Run deployment
deployContract().catch(console.error);
