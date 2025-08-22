
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'ticket' | 'timecard' | 'security';
  priority: number;
  createdAt: string;
  actionUrl?: string;
}

export function useRealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStats, setConnectionStats] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();

  const showNotificationToast = useCallback((notification: Notification) => {
    const isUrgent = notification.priority >= 8;
    const isHigh = notification.priority >= 5;
    
    toast({
      title: `${isUrgent ? '🚨' : isHigh ? '⚠️' : '🔔'} ${notification.title}`,
      description: notification.message,
      variant: isUrgent ? 'destructive' : 'default',
      duration: isUrgent ? 8000 : 5000,
      action: notification.actionUrl ? (
        <button
          onClick={() => window.open(notification.actionUrl, '_blank')}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Ver
        </button>
      ) : undefined
    });

    // Som para notificações urgentes
    if (isUrgent && 'Audio' in window) {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4FJHfJ8N2QQAkUXrTp66hVFApGn+DyvmAaBS2J0fLBeS4F');
        audio.play().catch(() => {
          // Ignorar erro se não conseguir tocar o som
        });
      } catch (error) {
        // Ignorar erro de áudio
      }
    }
  }, [toast]);

  useEffect(() => {
    if (!user?.tenantId) return;

    console.log('🔗 [SSE] Connecting to real-time notifications...');
    
    const eventSource = new EventSource(`/api/notifications/sse`, {
      withCredentials: true
    });

    eventSource.onopen = () => {
      setIsConnected(true);
      setConnectionStats('Conectado às notificações em tempo real');
      console.log('🔗 [SSE] Connected to real-time notifications');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            console.log('🔗 [SSE] Connection established:', data.message);
            break;
            
          case 'notification':
            console.log('🔔 [SSE] New notification received:', data.data);
            setNotifications(prev => [data.data, ...prev].slice(0, 50)); // Manter apenas 50 notificações
            showNotificationToast(data.data);
            break;
            
          case 'heartbeat':
            setConnectionStats(`Conectado - ${new Date(data.timestamp).toLocaleTimeString()}`);
            break;
            
          default:
            console.log('🔗 [SSE] Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('🔗 [SSE] Error parsing message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('🔗 [SSE] Connection error:', error);
      setIsConnected(false);
      setConnectionStats('Erro de conexão - reconectando...');
    };

    return () => {
      console.log('🔗 [SSE] Closing connection');
      eventSource.close();
      setIsConnected(false);
      setConnectionStats('Desconectado');
    };
  }, [user?.tenantId, showNotificationToast]);

  return {
    notifications,
    isConnected,
    connectionStats,
    clearNotifications: () => setNotifications([])
  };
}
