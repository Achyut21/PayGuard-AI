'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, ShoppingCart, X } from 'lucide-react';
import { createAIAgent, type ProductRecommendation } from '@/lib/ai-agent';
import { useWallet } from '@/providers/wallet-provider';
import { useAppStore } from '@/stores/app-store';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  products?: ProductRecommendation[];
  timestamp: Date;
}

interface AIChatProps {
  agent: {
    id: string;
    name: string;
    spendingLimit: number;
    totalSpent: number;
  };
  onClose: () => void;
}

export function AIChat({ agent, onClose }: AIChatProps) {
  const { accountAddress } = useWallet();
  const { getChatMessages, addChatMessage, setPendingPayments, updateAgent } = useAppStore();
  
  // Get persisted messages from store
  const [messages, setMessages] = useState<Message[]>(() => 
    getChatMessages(agent.id) as Message[]
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiAgent, setAiAgent] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ai = createAIAgent(agent.id, agent.spendingLimit - agent.totalSpent);
    setAiAgent(ai);
    
    // Only add welcome message if no messages exist
    const existingMessages = getChatMessages(agent.id);
    if (existingMessages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `Hi! I'm ${agent.name}, your AI shopping assistant. I have a budget of ${((agent.spendingLimit - agent.totalSpent) / 1000000).toFixed(2)} ALGO available. What would you like to shop for today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      addChatMessage(agent.id, welcomeMessage as any);
    }
  }, [agent, getChatMessages, addChatMessage]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !aiAgent || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    addChatMessage(agent.id, userMessage as any); // Persist to store
    setInput('');
    setIsLoading(true);

    try {
      // Check if user wants to search for products
      if (input.toLowerCase().includes('find') || input.toLowerCase().includes('search') || input.toLowerCase().includes('buy')) {
        const response = await aiAgent.searchProducts({
          query: input,
          budget: agent.spendingLimit - agent.totalSpent,
        });

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.reasoning || 'Here are my recommendations:',
          products: response.recommendations,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        addChatMessage(agent.id, assistantMessage as any); // Persist to store
      } else {
        // Regular chat
        const response = await aiAgent.chat(input);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        addChatMessage(agent.id, assistantMessage as any); // Persist to store
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response from AI');
    } finally {
      setIsLoading(false);
    }
  };
  const handlePurchase = async (product: ProductRecommendation) => {
    if (!aiAgent || !accountAddress) return;

    const result = await aiAgent.requestPurchase(product, accountAddress);
    
    if (result.success) {
      toast.success(result.message);
      const systemMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: `✅ ${result.message} - Request ID: ${result.requestId}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMessage]);
      addChatMessage(agent.id, systemMessage as any); // Persist to store
      
      // Update agent's total spent if auto-approved
      if (result.autoApproved) {
        updateAgent(agent.id, {
          totalSpent: agent.totalSpent + product.price
        });
      } else {
        // Refresh pending payments if not auto-approved
        const response = await fetch(`/api/pending?owner=${accountAddress}`);
        const data = await response.json();
        if (data.success) {
          setPendingPayments(data.pendingPayments);
        }
      }
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <CardTitle>{agent.name}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-lg p-3' 
                  : message.role === 'system'
                  ? 'bg-muted text-muted-foreground rounded-lg p-3 italic'
                  : 'bg-muted rounded-lg p-3'
              }`}>
                <p className="text-sm">{message.content}</p>
                
                {message.products && message.products.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.products.map((product, idx) => (
                      <div key={idx} className="bg-background rounded p-3 space-y-2">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.description}</div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold">
                              {(product.price / 1000000).toFixed(2)} ALGO
                            </div>
                            <div className="text-xs text-muted-foreground">
                              from {product.vendor}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handlePurchase(product)}
                            className="gap-1"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            Buy
                          </Button>
                        </div>
                        <div className="text-xs italic">{product.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me to find products..."
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}