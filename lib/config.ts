// PayGuard AI Configuration

export const ALGORAND_CONFIG = {
  // Network configuration
  NETWORK: process.env.NEXT_PUBLIC_ALGORAND_NETWORK || 'testnet',
  ALGOD_SERVER: process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.4160.nodely.io',
  INDEXER_SERVER: process.env.NEXT_PUBLIC_INDEXER_SERVER || 'https://testnet-idx.4160.nodely.io',
  ALGOD_TOKEN: process.env.NEXT_PUBLIC_ALGOD_TOKEN || '',
  
  // Contract configuration
  APP_ID: process.env.NEXT_PUBLIC_APP_ID ? parseInt(process.env.NEXT_PUBLIC_APP_ID) : 0,
  
  // Default values
  DEFAULT_SPENDING_LIMIT: 1000000, // 1 ALGO in microAlgos
  MIN_BALANCE: 100000, // 0.1 ALGO minimum balance
  
  // Transaction fees
  MIN_FEE: 1000, // 0.001 ALGO
};

export const AI_CONFIG = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  MODEL: 'gpt-4o-mini',
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
};

export const DB_CONFIG = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN || '',
};