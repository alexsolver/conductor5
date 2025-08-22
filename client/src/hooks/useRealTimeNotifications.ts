
import { useEffect, useState } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  readAt: string | null;
}

export function useRealTimeNotifications() {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Simulated connection status for now
    setIsConnected(true);
    
    // Clean up on unmount
    return () => {
      setIsConnected(false);
    };
  }, []);

  return {
    isConnected,
    notifications
  };
}
