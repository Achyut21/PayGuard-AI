import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, action, approverAddress } = body;

    // Validate input
    if (!requestId || !action || !approverAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "deny"' },
        { status: 400 }
      );
    }

    // Get payment request details
    const requestResult = await db.execute({
      sql: `SELECT pr.*, a.owner_address, a.name as agent_name 
            FROM payment_requests pr 
            JOIN agents a ON pr.agent_id = a.id 
            WHERE pr.id = ? AND pr.status = 'pending'`,
      args: [requestId]
    });
    if (!requestResult.rows.length) {
      return NextResponse.json(
        { error: 'Payment request not found or already processed' },
        { status: 404 }
      );
    }

    const request = requestResult.rows[0];

    // Verify the approver is the owner
    if (request.owner_address !== approverAddress) {
      return NextResponse.json(
        { error: 'Unauthorized. Only the owner can approve/deny payments' },
        { status: 403 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'denied';

    // Update payment request status
    await db.execute({
      sql: `UPDATE payment_requests 
            SET status = ?, processed_at = ?, processed_by = ? 
            WHERE id = ?`,
      args: [newStatus, new Date().toISOString(), approverAddress, requestId]
    });

    // If approved, update agent's total spent and create transaction
    if (action === 'approve') {
      await db.execute({
        sql: 'UPDATE agents SET total_spent = total_spent + ? WHERE id = ?',
        args: [request.amount, request.agent_id]
      });
      await db.execute({
        sql: `INSERT INTO transactions (agent_id, request_id, amount, recipient_address, status) 
              VALUES (?, ?, ?, ?, ?)`,
        args: [request.agent_id, requestId, request.amount, request.recipient_address, 'completed']
      });
    }

    // Create notification
    const notificationType = action === 'approve' ? 'payment_approved' : 'payment_denied';
    const notificationTitle = action === 'approve' ? 'Payment Approved' : 'Payment Denied';
    const notificationMessage = action === 'approve'
      ? `Payment of ${Number(request.amount) / 1000000} ALGO to ${request.recipient_address} has been approved`
      : `Payment of ${Number(request.amount) / 1000000} ALGO to ${request.recipient_address} has been denied`;

    await db.execute({
      sql: `INSERT INTO notifications (user_address, type, title, message, data) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        request.owner_address,
        notificationType,
        notificationTitle,
        notificationMessage,
        JSON.stringify({ 
          requestId, 
          agentId: request.agent_id, 
          agentName: request.agent_name,
          amount: request.amount, 
          recipient: request.recipient_address, 
          reason: request.reason 
        })
      ]
    });

    return NextResponse.json({
      success: true,
      action,
      requestId,
      message: `Payment request ${action}d successfully`
    });

  } catch (error) {
    console.error('Error processing payment approval:', error);
    return NextResponse.json(
      { error: 'Failed to process payment approval' },
      { status: 500 }
    );
  }
}