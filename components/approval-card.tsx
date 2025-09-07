'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { paymentApi } from '@/lib/api-client';
import { useAppStore } from '@/stores/app-store';
import toast from 'react-hot-toast';

interface ApprovalCardProps {
  payment: {
    id: number;
    agentId: string;
    agentName?: string;
    amount: number;
    recipient: string;
    reason: string;
    status: string;
    requestedAt: string;
  };
  userAddress: string;
  onProcessed: () => void;
}

export function ApprovalCard({ payment, userAddress, onProcessed }: ApprovalCardProps) {
  const [processing, setProcessing] = useState(false);
  const { updatePaymentRequest } = useAppStore();

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const response = await paymentApi.approve(payment.id, userAddress);
      if (response.success) {
        updatePaymentRequest(payment.id, { status: 'approved' });
        toast.success('Payment approved successfully');
        onProcessed();
      } else {
        toast.error(response.error || 'Failed to approve payment');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
    } finally {
      setProcessing(false);
    }
  };
  const handleDeny = async () => {
    setProcessing(true);
    try {
      const response = await paymentApi.deny(payment.id, userAddress);
      if (response.success) {
        updatePaymentRequest(payment.id, { status: 'denied' });
        toast.success('Payment denied');
        onProcessed();
      } else {
        toast.error(response.error || 'Failed to deny payment');
      }
    } catch (error) {
      console.error('Error denying payment:', error);
      toast.error('Failed to deny payment');
    } finally {
      setProcessing(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Payment Approval Required
            </CardTitle>
            <CardDescription className="mt-1">
              {payment.agentName || 'AI Agent'} • {formatDate(payment.requestedAt)}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {(payment.amount / 1000000).toFixed(2)} ALGO
            </div>
            <div className="text-xs text-muted-foreground">
              ≈ ${((payment.amount / 1000000) * 0.15).toFixed(2)} USD
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Recipient</span>
            <span className="font-mono">{formatAddress(payment.recipient)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Reason</span>
            <span className="text-right max-w-xs">{payment.reason}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleApprove}
            disabled={processing}
            className="flex-1 gap-2"
            variant="default"
          >
            <CheckCircle className="h-4 w-4" />
            Approve
          </Button>
          <Button
            onClick={handleDeny}
            disabled={processing}
            className="flex-1 gap-2"
            variant="destructive"
          >
            <XCircle className="h-4 w-4" />
            Deny
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}