import { NextRequest } from 'next/server';
import { db } from '@/lib/database';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const userAddress = searchParams.get('address');

  if (!userAddress) {
    return new Response('Missing user address', { status: 400 });
  }

  // Set up SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  // Create a readable stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`)
      );

      // Set up interval to check for new notifications
      const interval = setInterval(async () => {
        try {          // Get unread notifications
          const result = await db.execute({
            sql: `SELECT * FROM notifications 
                  WHERE user_address = ? AND is_read = 0 
                  ORDER BY created_at DESC 
                  LIMIT 10`,
            args: [userAddress]
          });

          if (result.rows.length > 0) {
            // Mark notifications as read
            const notificationIds = result.rows.map(row => row.id);
            await db.execute({
              sql: `UPDATE notifications SET is_read = 1 
                    WHERE id IN (${notificationIds.map(() => '?').join(',')})`,
              args: notificationIds
            });

            // Send notifications
            for (const notification of result.rows) {
              const data = {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data ? JSON.parse(String(notification.data)) : null,
                createdAt: notification.created_at
              };

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
              );
            }
          }
          // Also check for pending payments that need attention
          const pendingResult = await db.execute({
            sql: `SELECT COUNT(*) as count FROM payment_requests pr
                  JOIN agents a ON pr.agent_id = a.id
                  WHERE a.owner_address = ? AND pr.status = 'pending'`,
            args: [userAddress]
          });

          const pendingCount = Number(pendingResult.rows[0].count);
          if (pendingCount > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'pending_payments', 
                count: pendingCount,
                message: `You have ${pendingCount} pending payment${pendingCount > 1 ? 's' : ''} to review`
              })}\n\n`)
            );
          }

        } catch (error) {
          console.error('SSE error:', error);
        }
      }, 5000); // Check every 5 seconds

      // Clean up on close
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}