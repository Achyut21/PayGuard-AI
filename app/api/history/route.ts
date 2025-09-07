import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const ownerAddress = searchParams.get('owner');
    const agentId = searchParams.get('agentId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT 
        pr.*,
        a.name as agent_name,
        a.wallet_address,
        a.owner_address,
        t.transaction_hash,
        t.status as transaction_status
      FROM payment_requests pr
      JOIN agents a ON pr.agent_id = a.id
      LEFT JOIN transactions t ON pr.id = t.request_id
      WHERE 1=1
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
    if (status) {
      sql += ' AND pr.status = ?';
      args.push(status);
    }

    sql += ' ORDER BY pr.requested_at DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const result = await db.execute({ sql, args });

    // Get total count for pagination
    let countSql = `
      SELECT COUNT(*) as total
      FROM payment_requests pr
      JOIN agents a ON pr.agent_id = a.id
      WHERE 1=1
    `;
    const countArgs: any[] = [];

    if (ownerAddress) {
      countSql += ' AND a.owner_address = ?';
      countArgs.push(ownerAddress);
    }

    if (agentId) {
      countSql += ' AND pr.agent_id = ?';
      countArgs.push(agentId);
    }

    if (status) {
      countSql += ' AND pr.status = ?';
      countArgs.push(status);
    }

    const countResult = await db.execute({ sql: countSql, args: countArgs });
    const total = Number(countResult.rows[0].total);
    const transactions = result.rows.map(row => ({
      id: Number(row.id),
      agentId: row.agent_id,
      agentName: row.agent_name,
      amount: Number(row.amount),
      recipient: row.recipient_address,
      reason: row.reason,
      status: row.status,
      requestedAt: row.requested_at,
      processedAt: row.processed_at,
      processedBy: row.processed_by,
      walletAddress: row.wallet_address,
      ownerAddress: row.owner_address,
      transactionHash: row.transaction_hash,
      transactionStatus: row.transaction_status
    }));

    // Calculate statistics
    const stats = {
      totalTransactions: total,
      pendingCount: 0,
      approvedCount: 0,
      deniedCount: 0,
      totalVolume: 0
    };

    if (transactions.length > 0) {
      const statsResult = await db.execute({
        sql: `
          SELECT 
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
            COUNT(CASE WHEN status = 'denied' THEN 1 END) as denied,
            SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as volume
          FROM payment_requests pr
          JOIN agents a ON pr.agent_id = a.id
          WHERE a.owner_address = ?`,
        args: [ownerAddress || '']
      });

      const statsRow = statsResult.rows[0];
      stats.pendingCount = Number(statsRow.pending);
      stats.approvedCount = Number(statsRow.approved);
      stats.deniedCount = Number(statsRow.denied);
      stats.totalVolume = Number(statsRow.volume);
    }

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction history' },
      { status: 500 }
    );
  }
}