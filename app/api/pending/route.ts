import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const ownerAddress = searchParams.get('owner');
    const agentId = searchParams.get('agentId');

    let sql = `
      SELECT 
        pr.*,
        a.name as agent_name,
        a.wallet_address,
        a.spending_limit,
        a.total_spent
      FROM payment_requests pr
      JOIN agents a ON pr.agent_id = a.id
      WHERE pr.status = 'pending'
    `;
    const args: any[] = [];

    if (ownerAddress) {
      sql += ' AND a.owner_address = ?';
      args.push(ownerAddress);
    }

    if (agentId) {
      sql += ' AND pr.agent_id = ?';
      args.push(agentId);
    }

    sql += ' ORDER BY pr.requested_at DESC';

    const result = await db.execute({ sql, args });
    const pendingPayments = result.rows.map(row => ({
      id: Number(row.id),
      agentId: row.agent_id,
      agentName: row.agent_name,
      amount: Number(row.amount),
      recipient: row.recipient_address,
      reason: row.reason,
      status: row.status,
      requestedAt: row.requested_at,
      walletAddress: row.wallet_address,
      spendingLimit: Number(row.spending_limit),
      totalSpent: Number(row.total_spent),
      remainingBudget: Number(row.spending_limit) - Number(row.total_spent)
    }));

    return NextResponse.json({
      success: true,
      pendingPayments,
      count: pendingPayments.length
    });

  } catch (error) {
    console.error('Error fetching pending payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending payments' },
      { status: 500 }
    );
  }
}