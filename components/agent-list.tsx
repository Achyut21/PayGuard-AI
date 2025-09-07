'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, DollarSign, Activity, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    description?: string;
    walletAddress: string;
    spendingLimit: number;
    totalSpent: number;
    isActive: boolean;
  };
  onChat: () => void;
}

function AgentCard({ agent, onChat }: AgentCardProps) {
  const remainingBudget = agent.spendingLimit - agent.totalSpent;
  const usagePercentage = (agent.totalSpent / agent.spendingLimit) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{agent.name}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {agent.description || 'AI Shopping Assistant'}
              </CardDescription>
            </div>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            agent.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {agent.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </CardHeader>      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spending Limit</span>
            <span className="font-medium">{(agent.spendingLimit / 1000000).toFixed(2)} ALGO</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Spent</span>
            <span className="font-medium">{(agent.totalSpent / 1000000).toFixed(2)} ALGO</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-medium text-green-600">
              {(remainingBudget / 1000000).toFixed(2)} ALGO
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Budget Usage</span>
            <span>{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                usagePercentage > 80 ? 'bg-red-500' : 
                usagePercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button 
            onClick={onChat}
            className="w-full gap-2"
            size="sm"
          >
            <MessageSquare className="h-4 w-4" />
            Chat with Agent
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AgentList({ onSelectAgent }: { onSelectAgent: (agent: any) => void }) {
  const agents = useAppStore((state) => state.agents);

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No AI Agents Yet</h3>
          <p className="text-sm text-muted-foreground text-center">
            Create your first AI shopping agent to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onChat={() => onSelectAgent(agent)}
        />
      ))}
    </div>
  );
}