import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';

export function useSSE(userAddress: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const { setSseConnected, addNotification, setPendingPayments } = useAppStore();

  useEffect(() => {
    if (!userAddress) {
      // Close connection if no user address
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setSseConnected(false);
      }
      return;
    }

    // Create SSE connection
    const eventSource = new EventSource(`/api/sse?address=${userAddress}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection established');
      setSseConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          console.log('SSE:', data.message);
        } else if (data.type === 'pending_payments') {
          // Fetch updated pending payments
          fetchPendingPayments(userAddress);
        } else {
          // Add as notification
          addNotification({
            id: data.id || Date.now(),
            type: data.type,
            title: data.title,
            message: data.message,
            data: data.data,
            createdAt: data.createdAt || new Date().toISOString(),
            isRead: false,
          });
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setSseConnected(false);
      
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          eventSource.close();
          eventSourceRef.current = null;
        }
      }, 5000);
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
        setSseConnected(false);
      }
    };
  }, [userAddress, setSseConnected, addNotification, setPendingPayments]);

  const fetchPendingPayments = async (address: string) => {
    try {
      const response = await fetch(`/api/pending?owner=${address}`);
      const data = await response.json();
      if (data.success) {
        setPendingPayments(data.pendingPayments);
      }
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    }
  };

  return { isConnected: useAppStore((state) => state.sseConnected) };
}