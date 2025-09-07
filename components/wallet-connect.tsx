'use client';

import React from 'react';
import { useWallet } from '@/providers/wallet-provider';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

export function WalletConnect() {
  const { accountAddress, isConnecting, connect, disconnect } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (accountAddress) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {formatAddress(accountAddress)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnect}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={connect}
      disabled={isConnecting}
      className="gap-2"
    >
      <Wallet className="h-4 w-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}