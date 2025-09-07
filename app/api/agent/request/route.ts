import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import type { RequestPaymentParams } from '@/types/contract';

export async function POST(req: NextRequest) {
  try {
    const body: RequestPaymentParams = await req.json();
    const { agentId, amount, recipient, reason } = body;

    // Validate input
    if (!agentId || !amount || !recipient || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get agent details
    const agentResult = await db.execute({
      sql: 'SELECT * FROM agents WHERE id = ? AND is_active = 1',
      args: [agentId]
    });

    if (!agentResult.rows.length) {
      return NextResponse.json(
        { error: 'Agent not found or inactive' },
        { status: 404 }
      );
    }

    const agent = agentResult.rows[0];
    const totalSpent = Number(agent.total_spent) || 0;
    const spendingLimit = Number(agent.spending_limit);
    // Check if auto-approval is possible
    const autoApprove = (totalSpent + amount) <= spendingLimit;
    const status = autoApprove ? 'approved' : 'pending';

    // Create payment request
    const result = await db.execute({
      sql: `INSERT INTO payment_requests 
            (agent_id, amount, recipient_address, reason, status, processed_at, processed_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        agentId,
        amount,
        recipient,
        reason,
        status,
        autoApprove ? new Date().toISOString() : null,
        autoApprove ? 'auto' : null
      ]
    });

    const requestId = Number(result.lastInsertRowid);

    // If auto-approved, update agent's total spent
    if (autoApprove) {
      await db.execute({
        sql: 'UPDATE agents SET total_spent = total_spent + ? WHERE id = ?',
        args: [amount, agentId]
      });

      // Create transaction record
      await db.execute({
        sql: `INSERT INTO transactions (agent_id, request_id, amount, recipient_address, status) 
              VALUES (?, ?, ?, ?, ?)`,
        args: [agentId, requestId, amount, recipient, 'completed']
      });
    }
    // Create notification
    const notificationType = autoApprove ? 'payment_auto_approved' : 'payment_pending';
    const notificationTitle = autoApprove ? 'Payment Auto-Approved' : 'Payment Approval Required';
    const notificationMessage = autoApprove 
      ? `Payment of ${amount / 1000000} ALGO to ${recipient} was automatically approved`
      : `Payment of ${amount / 1000000} ALGO to ${recipient} requires your approval`;

    await db.execute({
      sql: `INSERT INTO notifications (user_address, type, title, message, data) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        agent.owner_address,
        notificationType,
        notificationTitle,
        notificationMessage,
        JSON.stringify({ requestId, agentId, amount, recipient, reason })
      ]
    });

    return NextResponse.json({
      success: true,
      requestId: Number(requestId),
      status,
      autoApproved: autoApprove,
      message: autoApprove 
        ? 'Payment automatically approved and executed'
        : 'Payment request created and pending approval'
    });

  } catch (error) {
    console.error('Error creating payment request:', error);
    return NextResponse.json(
      { error: 'Failed to create payment request' },
      { status: 500 }
    );
  }
}