'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { useAppStore } from '@/stores/app-store';
import toast from 'react-hot-toast';

interface WalletContextType {
  peraWallet: PeraWalletConnect | null;
  accountAddress: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  peraWallet: null,
  accountAddress: null,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [peraWallet, setPeraWallet] = useState<PeraWalletConnect | null>(null);
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { setConnected } = useAppStore();

  useEffect(() => {
    const wallet = new PeraWalletConnect({
      shouldShowSignTxnToast: true,
    });
    setPeraWallet(wallet);

    // Check for existing connection
    wallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length) {
          setAccountAddress(accounts[0]);
          setConnected(true, accounts[0]);
          toast.success('Wallet reconnected');
        }
      })
      .catch(console.error);

    // Set up event listeners
    wallet.connector?.on('disconnect', () => {
      setAccountAddress(null);
      setConnected(false);
    });

    return () => {
      wallet.disconnect();
    };
  }, [setConnected]);

  const connect = async () => {
    if (!peraWallet) return;

    setIsConnecting(true);
    try {
      const accounts = await peraWallet.connect();
      setAccountAddress(accounts[0]);
      setConnected(true, accounts[0]);
      toast.success('Wallet connected successfully');
    } catch (error) {
      console.error('Failed to connect:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (!peraWallet) return;
    
    peraWallet.disconnect();
    setAccountAddress(null);
    setConnected(false);
    toast.success('Wallet disconnected');
  };

  return (
    <WalletContext.Provider
      value={{
        peraWallet,
        accountAddress,
        isConnecting,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);