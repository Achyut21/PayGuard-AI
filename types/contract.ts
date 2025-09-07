// TypeScript interfaces for PayGuard AI

export interface AgentWallet {
  agentId: string;
  owner: string;
  spendingLimit: number;
  totalSpent: number;
  isActive: boolean;
  walletAddress?: string;
}

export interface PaymentRequest {
  requestId: number;
  agentId: string;
  amount: number;
  recipient: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  timestamp: number;
}

export interface CreateAgentParams {
  agentId: string;
  spendingLimit: number;
  name?: string;
  description?: string;
}

export interface RequestPaymentParams {
  agentId: string;
  amount: number;
  recipient: string;
  reason: string;
}

export interface ApprovalResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface ContractState {
  appId: number;
  appAddress: string;
  admin: string;
  totalAgents: number;
  nextRequestId: number;
}