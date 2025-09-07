import { createClient } from '@libsql/client';
import { DB_CONFIG } from './config';

// Create Turso database client
export const db = createClient({
  url: DB_CONFIG.DATABASE_URL || 'file:local.db',
  authToken: DB_CONFIG.DATABASE_AUTH_TOKEN,
});

// Database initialization
export async function initDatabase() {
  try {
    // Create agents table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        wallet_address TEXT NOT NULL,
        owner_address TEXT NOT NULL,
        spending_limit INTEGER NOT NULL,
        total_spent INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create payment_requests table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payment_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        recipient_address TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT CHECK(status IN ('pending', 'approved', 'denied')) DEFAULT 'pending',
        transaction_id TEXT,
        requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME,
        processed_by TEXT,
        FOREIGN KEY (agent_id) REFERENCES agents(id)
      )
    `);

    // Create transactions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        request_id INTEGER,
        amount INTEGER NOT NULL,
        recipient_address TEXT NOT NULL,
        transaction_hash TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES agents(id),
        FOREIGN KEY (request_id) REFERENCES payment_requests(id)
      )
    `);

    // Create notifications table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_address TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_address)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_requests_agent ON payment_requests(agent_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_requests_status ON payment_requests(status)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_address)`);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Helper function to get database instance
export function getDb() {
  return db;
}