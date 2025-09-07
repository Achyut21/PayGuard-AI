import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { PayGuardContract, createAccount } from '@/lib/algorand';
import { ALGORAND_CONFIG } from '@/lib/config';
import { 
  isBlockchainEnabled, 
  createAgentOnChain,
  fundAccount,
  formatAlgo 
} from '@/lib/blockchain';
import type { CreateAgentParams } from '@/types/contract';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, name, description, spendingLimit, ownerAddress } = body;

    // Validate input
    if (!agentId || !name || !spendingLimit || !ownerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate wallet for the agent
    const agentAccount = createAccount();
    const walletAddress = agentAccount.addr;

    // Save agent to database with mnemonic (encrypted in production)
    await db.execute({
      sql: `INSERT INTO agents (id, name, description, wallet_address, owner_address, spending_limit) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [agentId, name, description || '', walletAddress, ownerAddress, spendingLimit]
    });
    
    // Store agent mnemonic securely (in production, use encryption)
    await db.execute({
      sql: `INSERT INTO agent_keys (agent_id, mnemonic) VALUES (?, ?)`,
      args: [agentId, agentAccount.mnemonic]
    });
    
    // If blockchain is enabled, create agent on-chain and fund wallet
    let blockchainTxId = null;
    let fundingTxId = null;
    
    if (isBlockchainEnabled()) {
      try {
        console.log('🔗 Blockchain mode enabled, creating agent on-chain...');
        
        // Create agent on smart contract
        const deployerMnemonic = process.env.DEPLOYER_MNEMONIC;
        if (deployerMnemonic) {
          blockchainTxId = await createAgentOnChain(
            deployerMnemonic,
            agentId,
            spendingLimit
          );
          
          if (blockchainTxId) {
            console.log(`✅ Agent created on-chain: ${blockchainTxId}`);
            
            // Fund the agent wallet with minimum balance (0.1 ALGO)
            fundingTxId = await fundAccount(
              deployerMnemonic,
              walletAddress,
              100000 // 0.1 ALGO for minimum balance
            );
            
            if (fundingTxId) {
              console.log(`✅ Agent wallet funded: ${fundingTxId}`);
            }
          }
        } else {
          console.log('⚠️  DEPLOYER_MNEMONIC not set, skipping blockchain operations');
        }
      } catch (error) {
        console.error('Error with blockchain operations:', error);
        // Continue even if blockchain operations fail
      }
    } else {
      console.log('📝 Database-only mode, skipping blockchain operations');
    }

    // Create initial notification
    await db.execute({
      sql: `INSERT INTO notifications (user_address, type, title, message, data) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        ownerAddress,
        'agent_created',
        'AI Agent Created',
        `Your AI agent "${name}" has been created with a spending limit of ${spendingLimit / 1000000} ALGO`,
        JSON.stringify({ agentId, walletAddress })
      ]
    });

    return NextResponse.json({
      success: true,
      agentId,
      walletAddress,
      mnemonic: agentAccount.mnemonic, // In production, store this securely
      message: 'Agent created successfully'
    });

  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}