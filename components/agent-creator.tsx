'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bot, Plus } from 'lucide-react';
import { useWallet } from '@/providers/wallet-provider';
import { agentApi } from '@/lib/api-client';
import { useAppStore } from '@/stores/app-store';
import toast from 'react-hot-toast';

export function AgentCreator() {
  const { accountAddress } = useWallet();
  const { addAgent } = useAppStore();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    spendingLimit: '5',
  });

  const handleCreate = async () => {
    if (!accountAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setCreating(true);
    try {      const agentId = `agent-${Date.now()}`;
      const response = await agentApi.create({
        agentId,
        name: formData.name,
        description: formData.description,
        spendingLimit: parseFloat(formData.spendingLimit) * 1000000, // Convert to microAlgos
        ownerAddress: accountAddress,
      });

      if (response.success) {
        addAgent({
          id: agentId,
          name: formData.name,
          description: formData.description,
          walletAddress: response.walletAddress,
          ownerAddress: accountAddress,
          spendingLimit: parseFloat(formData.spendingLimit) * 1000000,
          totalSpent: 0,
          isActive: true,
        });
        
        toast.success('AI Agent created successfully!');
        setOpen(false);
        setFormData({ name: '', description: '', spendingLimit: '5' });
      } else {
        toast.error(response.error || 'Failed to create agent');
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Failed to create agent');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create AI Agent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create AI Shopping Agent</DialogTitle>
          <DialogDescription>
            Create an AI agent with a spending limit for autonomous shopping
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              placeholder="Shopping Assistant"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="AI agent for finding the best deals"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit">Spending Limit (ALGO)</Label>
            <Input
              id="limit"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="5"
              value={formData.spendingLimit}
              onChange={(e) => setFormData({ ...formData, spendingLimit: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Payments under this limit will be auto-approved
            </p>
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating || !formData.name || !formData.spendingLimit}
            className="w-full"
          >
            {creating ? 'Creating...' : 'Create Agent'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}