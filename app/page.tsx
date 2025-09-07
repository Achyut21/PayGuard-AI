'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WalletConnect } from '@/components/wallet-connect';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/providers/wallet-provider';
import { Bot, Shield, Zap, DollarSign } from 'lucide-react';
import { initDatabase } from '@/lib/api-client';

export default function Home() {
  const router = useRouter();
  const { accountAddress } = useWallet();

  useEffect(() => {
    // Initialize database on app load
    initDatabase().catch(console.error);
  }, []);

  useEffect(() => {
    if (accountAddress) {
      router.push('/dashboard');
    }
  }, [accountAddress, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-white">PayGuard AI</span>
          </div>
          <WalletConnect />
        </nav>

        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            AI Shopping Agents with
            <span className="text-blue-500"> Smart Authorization</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Create AI agents that can shop autonomously within spending limits.
            Powered by Algorand blockchain for instant, secure payments.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
              <Bot className="h-12 w-12 text-blue-500 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-2">AI Shopping Agents</h3>
              <p className="text-gray-400">
                GPT-4 powered agents that find the best products and deals for you
              </p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
              <DollarSign className="h-12 w-12 text-green-500 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-2">Smart Spending Limits</h3>
              <p className="text-gray-400">
                Auto-approve purchases under limit, manual approval for larger amounts
              </p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
              <Zap className="h-12 w-12 text-yellow-500 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-2">Instant Finality</h3>
              <p className="text-gray-400">
                Algorand blockchain ensures 2.8 second transaction finality
              </p>
            </div>
          </div>

          {!accountAddress && (
            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-8 border border-slate-700">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Get Started
              </h2>
              <p className="text-gray-300 mb-6">
                Connect your Pera Wallet to create AI shopping agents and start automating your purchases
              </p>
              <WalletConnect />
            </div>
          )}

          <div className="mt-16 text-sm text-gray-500">
            Built for EasyA x Algorand Harvard Hackathon
          </div>
        </div>
      </div>
    </main>
  );
}