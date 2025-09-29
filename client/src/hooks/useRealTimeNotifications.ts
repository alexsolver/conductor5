
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './useAuth';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  status: string;
  readAt: string | null;
  createdAt: string;
  scheduledAt: string;
}

export function useRealTimeNotifications() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Query para buscar notificações não lidas
  const { data: notificationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/schedule-notifications/list', user?.id],
    queryFn: async () => {
      try {
        console.log('🔔 [useRealTimeNotifications] Fetching notifications...');
        const response = await apiRequest('GET', '/api/schedule-notifications/list');
        const result = await response.json();
        console.log('🔔 [useRealTimeNotifications] Response:', result);
        return result;
      } catch (error) {
        console.error('🔔 [useRealTimeNotifications] Error:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Query para buscar contador de não lidas
  const { data: countData } = useQuery({
    queryKey: ['/api/schedule-notifications/count', user?.id],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/schedule-notifications/count');
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('🔔 [useRealTimeNotifications] Count error:', error);
        return { data: { count: 0 } };
      }
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (user?.id) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (countData?.success && countData?.data?.count !== undefined) {
      setUnreadCount(countData.data.count);
    }
  }, [countData]);

  const notifications = notificationsData?.success ? (notificationsData.data?.notifications || []) : [];

  return {
    isConnected,
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch
  };
}
