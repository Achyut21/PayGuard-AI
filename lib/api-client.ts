// API client utilities for PayGuard AI

const API_BASE = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Agent APIs
export const agentApi = {
  getAgents: async (ownerAddress: string) => {
    const response = await fetch(`${API_BASE}/agent?owner=${ownerAddress}`);
    return response.json();
  },

  create: async (params: {
    agentId: string;
    name: string;
    description?: string;
    spendingLimit: number;
    ownerAddress: string;
  }) => {
    const response = await fetch(`${API_BASE}/agent/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  },

  requestPayment: async (params: {
    agentId: string;
    amount: number;
    recipient: string;
    reason: string;
  }) => {
    const response = await fetch(`${API_BASE}/agent/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  },
};
// Payment APIs
export const paymentApi = {
  getPending: async (ownerAddress?: string, agentId?: string) => {
    const params = new URLSearchParams();
    if (ownerAddress) params.append('owner', ownerAddress);
    if (agentId) params.append('agentId', agentId);
    
    const response = await fetch(`${API_BASE}/pending?${params}`);
    return response.json();
  },

  approve: async (requestId: number, approverAddress: string) => {
    const response = await fetch(`${API_BASE}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        action: 'approve',
        approverAddress,
      }),
    });
    return response.json();
  },

  deny: async (requestId: number, approverAddress: string) => {
    const response = await fetch(`${API_BASE}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        action: 'deny',
        approverAddress,
      }),
    });
    return response.json();
  },

  getHistory: async (params?: {
    owner?: string;
    agentId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.owner) searchParams.append('owner', params.owner);
    if (params?.agentId) searchParams.append('agentId', params.agentId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    
    const response = await fetch(`${API_BASE}/history?${searchParams}`);
    return response.json();
  },
};

// Database initialization
export const initDatabase = async () => {
  const response = await fetch(`${API_BASE}/init`);
  return response.json();
};