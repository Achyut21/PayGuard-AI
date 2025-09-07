import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Agent {
  id: string;
  name: string;
  description?: string;
  walletAddress: string;
  ownerAddress: string;
  spendingLimit: number;
  totalSpent: number;
  isActive: boolean;
  createdAt?: string;
}

interface PaymentRequest {
  id: number;
  agentId: string;
  agentName?: string;
  amount: number;
  recipient: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: string;
  processedAt?: string;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  createdAt: string;
  isRead: boolean;
}
interface AppState {
  // Wallet connection
  isConnected: boolean;
  userAddress: string | null;
  
  // Agents
  agents: Agent[];
  selectedAgent: Agent | null;
  
  // Payment requests
  pendingPayments: PaymentRequest[];
  paymentHistory: PaymentRequest[];
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // SSE connection
  sseConnected: boolean;
  
  // Actions
  setConnected: (isConnected: boolean, address?: string) => void;
  setAgents: (agents: Agent[]) => void;
  selectAgent: (agent: Agent | null) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  setPendingPayments: (payments: PaymentRequest[]) => void;
  addPaymentRequest: (payment: PaymentRequest) => void;
  updatePaymentRequest: (id: number, updates: Partial<PaymentRequest>) => void;
  setPaymentHistory: (history: PaymentRequest[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: number) => void;
  clearNotifications: () => void;
  setSseConnected: (connected: boolean) => void;
  reset: () => void;
}
const initialState = {
  isConnected: false,
  userAddress: null,
  agents: [],
  selectedAgent: null,
  pendingPayments: [],
  paymentHistory: [],
  notifications: [],
  unreadCount: 0,
  sseConnected: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setConnected: (isConnected, address) =>
        set({ isConnected, userAddress: address || null }),

      setAgents: (agents) => set({ agents }),

      selectAgent: (agent) => set({ selectedAgent: agent }),

      addAgent: (agent) =>
        set((state) => ({ agents: [...state.agents, agent] })),

      updateAgent: (agentId, updates) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId ? { ...a, ...updates } : a
          ),
        })),

      setPendingPayments: (payments) => set({ pendingPayments: payments }),

      addPaymentRequest: (payment) =>
        set((state) => ({
          pendingPayments: [...state.pendingPayments, payment],
        })),

      updatePaymentRequest: (id, updates) =>
        set((state) => ({
          pendingPayments: state.pendingPayments.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
          paymentHistory: state.paymentHistory.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      setPaymentHistory: (history) => set({ paymentHistory: history }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),

      clearNotifications: () =>
        set({ notifications: [], unreadCount: 0 }),

      setSseConnected: (connected) => set({ sseConnected: connected }),

      reset: () => set(initialState),
    }),
    {
      name: 'payguard-app-store',
      partialize: (state) => ({
        userAddress: state.userAddress,
        agents: state.agents,
      }),
    }
  )
);