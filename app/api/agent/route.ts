import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const ownerAddress = searchParams.get('owner');

    if (!ownerAddress) {
      return NextResponse.json(
        { error: 'Owner address is required' },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: 'SELECT * FROM agents WHERE owner_address = ? ORDER BY created_at DESC',
      args: [ownerAddress]
    });

    const agents = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      walletAddress: row.wallet_address,
      ownerAddress: row.owner_address,
      spendingLimit: Number(row.spending_limit),
      totalSpent: Number(row.total_spent),
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return NextResponse.json({
      success: true,
      agents,
      count: agents.length
    });

  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
