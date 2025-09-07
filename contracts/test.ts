#!/usr/bin/env node

import algosdk from 'algosdk';
import { deployPayGuardContract } from './deploy';
import { PayGuardContract, createAccount } from '../lib/algorand';


async function testContract() {
  console.log('🚀 Testing PayGuard AI Smart Contract');
  console.log('=====================================\n');

  try {
    // Create test accounts
    console.log('Creating test accounts...');
    const admin = createAccount();
    const user = createAccount();
    
    console.log('Admin address:', admin.addr);
    console.log('User address:', user.addr);
    
    // Fund accounts (in TestNet, you'd use the dispenser)
    console.log('\n⚠️  Please fund these accounts using the TestNet dispenser:');
    console.log('https://bank.testnet.algorand.network/');
    console.log('Admin needs at least 10 ALGO');
    console.log('User needs at least 1 ALGO\n');
    
    // Wait for user to fund accounts
    console.log('Press Enter after funding the accounts...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    // Deploy contract
    console.log('Deploying contract...');
    const { appId, appAddress } = await deployPayGuardContract(admin);
    
    console.log(`\n✅ Contract deployed!`);
    console.log(`App ID: ${appId}`);
    console.log(`App Address: ${appAddress}\n`);
    
    // Initialize contract interface
    const contract = new PayGuardContract(appId);
    
    // Test 1: Create agent wallet
    console.log('Test 1: Creating AI agent wallet...');
    const agentId = 'agent-001';
    const spendingLimit = 5000000; // 5 ALGO
    
    const walletAddress = await contract.createAgentWallet(
      { agentId, spendingLimit },
      admin
    );
    
    console.log(`✅ Agent wallet created: ${walletAddress}\n`);
    
    // Test 2: Request payment (under limit - should auto-approve)
    console.log('Test 2: Requesting payment under limit...');
    const requestId1 = await contract.requestPayment(
      {
        agentId,
        amount: 1000000, // 1 ALGO
        recipient: user.addr,
        reason: 'Purchase: AI Training Dataset'
      },
      admin
    );
    console.log(`✅ Payment request created: ${requestId1}\n`);
    
    // Test 3: Request payment (over limit - needs approval)
    console.log('Test 3: Requesting payment over limit...');
    const requestId2 = await contract.requestPayment(
      {
        agentId,
        amount: 6000000, // 6 ALGO (over 5 ALGO limit)
        recipient: user.addr,
        reason: 'Purchase: Premium API Access'
      },
      admin
    );
    
    console.log(`✅ Payment request created (pending): ${requestId2}\n`);
    
    // Test 4: Approve payment
    console.log('Test 4: Approving pending payment...');
    const approval = await contract.approvePayment(requestId2, admin);
    
    if (approval.success) {
      console.log(`✅ Payment approved! Tx: ${approval.transactionId}\n`);
    } else {
      console.log(`❌ Approval failed: ${approval.error}\n`);
    }
    
    // Test 5: Update spending limit
    console.log('Test 5: Updating spending limit...');
    const updated = await contract.setSpendingLimit(agentId, 10000000, admin);
    
    if (updated) {
      console.log('✅ Spending limit updated to 10 ALGO\n');
    } else {
      console.log('❌ Failed to update spending limit\n');
    }
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this is the main module
if (require.main === module) {
  testContract()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { testContract };