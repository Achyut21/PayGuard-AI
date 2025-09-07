import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { PayGuardContract, createAccount } from '@/lib/algorand';
import { ALGORAND_CONFIG } from '@/lib/config';
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

    // Save agent to database
    await db.execute({
      sql: `INSERT INTO agents (id, name, description, wallet_address, owner_address, spending_limit) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [agentId, name, description || '', walletAddress, ownerAddress, spendingLimit]
    });
    // If contract is deployed, create agent on-chain
    if (ALGORAND_CONFIG.APP_ID) {
      try {
        const contract = new PayGuardContract(ALGORAND_CONFIG.APP_ID);
        // Note: In production, this would use the admin's signed transaction
        // For now, we'll skip the on-chain creation
        console.log('Would create agent on-chain:', agentId);
      } catch (error) {
        console.error('Error creating agent on-chain:', error);
        // Continue even if on-chain creation fails
      }
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