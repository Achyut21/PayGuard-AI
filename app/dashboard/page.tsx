'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WalletConnect } from '@/components/wallet-connect';
import { AgentCreator } from '@/components/agent-creator';
import { AgentList } from '@/components/agent-list';
import { ApprovalCard } from '@/components/approval-card';
import { AIChat } from '@/components/ai-chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Bot, Bell, History, BarChart } from 'lucide-react';
import { useWallet } from '@/providers/wallet-provider';
import { useAppStore } from '@/stores/app-store';
import { useSSE } from '@/hooks/use-sse';
import { paymentApi } from '@/lib/api-client';

export default function Dashboard() {
  const router = useRouter();
  const { accountAddress } = useWallet();
  const { 
    agents, 
    pendingPayments, 
    setPendingPayments,
    paymentHistory,
    setPaymentHistory 
  } = useAppStore();
  
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Set up SSE for real-time notifications
  useSSE(accountAddress);

  useEffect(() => {
    if (!accountAddress) {
      router.push('/');
    } else {
      fetchPendingPayments();
      fetchPaymentHistory();
    }
  }, [accountAddress, router]);
  const fetchPendingPayments = async () => {
    if (!accountAddress) return;
    
    setLoadingPending(true);
    try {
      const response = await paymentApi.getPending(accountAddress);
      if (response.success) {
        setPendingPayments(response.pendingPayments);
      }
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchPaymentHistory = async () => {
    if (!accountAddress) return;
    
    setLoadingHistory(true);
    try {
      const response = await paymentApi.getHistory({ owner: accountAddress, limit: 50 });
      if (response.success) {
        setPaymentHistory(response.transactions);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const calculateStats = () => {
    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.isActive).length;
    const totalSpent = agents.reduce((sum, a) => sum + a.totalSpent, 0);
    const totalLimit = agents.reduce((sum, a) => sum + a.spendingLimit, 0);
    
    return {
      totalAgents,
      activeAgents,
      totalSpent,
      totalLimit,
      utilizationRate: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
    };
  };

  const stats = calculateStats();
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">PayGuard AI</span>
            </div>
            <WalletConnect />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAgents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeAgents} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.totalSpent / 1000000).toFixed(2)} ALGO
              </div>
              <p className="text-xs text-muted-foreground">
                of {(stats.totalLimit / 1000000).toFixed(2)} ALGO limit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.utilizationRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Budget utilization
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayments.length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>
        {/* Main Content with Tabs */}
        <Tabs defaultValue="agents" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="agents">AI Agents</TabsTrigger>
              <TabsTrigger value="approvals">
                Approvals {pendingPayments.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                    {pendingPayments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <AgentCreator />
          </div>

          <TabsContent value="agents" className="space-y-4">
            {selectedAgent ? (
              <AIChat 
                agent={selectedAgent} 
                onClose={() => setSelectedAgent(null)} 
              />
            ) : (
              <AgentList onSelectAgent={setSelectedAgent} />
            )}
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4">
            {loadingPending ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading pending payments...</p>
                </CardContent>
              </Card>
            ) : pendingPayments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Pending Approvals</h3>
                  <p className="text-sm text-muted-foreground">
                    All payment requests have been processed
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingPayments.map((payment) => (
                  <ApprovalCard
                    key={payment.id}
                    payment={payment}
                    userAddress={accountAddress!}
                    onProcessed={fetchPendingPayments}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {loadingHistory ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading transaction history...</p>
                </CardContent>
              </Card>
            ) : paymentHistory.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Transaction History</h3>
                  <p className="text-sm text-muted-foreground">
                    Your payment history will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paymentHistory.map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between border-b pb-4">
                        <div>
                          <div className="font-medium">{transaction.reason}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.agentName} • {new Date(transaction.requestedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {(transaction.amount / 1000000).toFixed(2)} ALGO
                          </div>
                          <div className={`text-xs ${
                            transaction.status === 'approved' ? 'text-green-600' :
                            transaction.status === 'denied' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {transaction.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}