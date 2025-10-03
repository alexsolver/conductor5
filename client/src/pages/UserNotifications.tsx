import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  CheckCircle, 
  Eye,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Types
interface Notification {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'expired';
  title: string;
  message: string;
  channels: string[];
  scheduledAt: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
  isExpired: boolean;
}

// Severity color mapping
const severityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

export default function UserNotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('unread');

  // Query para notificações
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/schedule-notifications/list', selectedTab],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/schedule-notifications/list');
      const result = await response.json();
      return result;
    },
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  // Query para contagem de não lidas
  const { data: unreadCountResponse } = useQuery({
    queryKey: ['/api/schedule-notifications/count'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/schedule-notifications/count');
      const result = await response.json();
      return result;
    },
    refetchInterval: 10000,
  });

  const unreadCount = unreadCountResponse?.data?.unreadCount || 0;

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await apiRequest('PATCH', '/api/schedule-notifications/bulk-read', {
        notificationIds: ids
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Sucesso',
        description: `${variables.length} notificação${variables.length > 1 ? 'ões' : ''} marcada${variables.length > 1 ? 's' : ''} como lida${variables.length > 1 ? 's' : ''}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-notifications/list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-notifications/count'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao marcar como lida',
        variant: 'destructive'
      });
    }
  });

  // Mutation para deletar notificações
  const deleteNotificationMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await apiRequest('DELETE', '/api/schedule-notifications/bulk-delete', {
        notificationIds: ids
      });

      if (!response.ok) {
        throw new Error('Failed to delete notifications');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Sucesso',
        description: `${variables.length} notificação${variables.length > 1 ? 'ões' : ''} excluída${variables.length > 1 ? 's' : ''}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-notifications/list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-notifications/count'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao excluir notificações',
        variant: 'destructive'
      });
    }
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate([id]);
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = notifications?.data?.notifications
      ?.filter((n: Notification) => !n.readAt)
      ?.map((n: Notification) => n.id) || [];

    if (unreadIds.length > 0) {
      markAsReadMutation.mutate(unreadIds);
    }
  };

  const handleDelete = (id: string) => {
    deleteNotificationMutation.mutate([id]);
  };

  const notificationsList = notifications?.data?.notifications || [];
  const unreadNotifications = notificationsList.filter((n: Notification) => !n.readAt);
  const readNotifications = notificationsList.filter((n: Notification) => n.readAt);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Minhas Notificações</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie suas notificações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg">
            <Bell className="h-4 w-4 mr-2" />
            {unreadCount || 0} não lidas
          </Badge>
          {unreadNotifications.length > 0 && (
            <Button 
              onClick={handleMarkAllAsRead}
              disabled={markAsReadMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="unread">
            Não Lidas ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            Lidas ({readNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todas ({notificationsList.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="space-y-4">
          {notificationsLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Carregando...</p>
              </CardContent>
            </Card>
          ) : unreadNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Nenhuma notificação não lida</p>
              </CardContent>
            </Card>
          ) : (
            unreadNotifications.map((notification: Notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      <CardDescription>
                        {new Date(notification.createdAt).toLocaleString('pt-BR')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={severityColors[notification.severity]}>
                        {notification.severity}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(notification.id)}
                        disabled={deleteNotificationMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{notification.message}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          {readNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Nenhuma notificação lida</p>
              </CardContent>
            </Card>
          ) : (
            readNotifications.map((notification: Notification) => (
              <Card key={notification.id} className="opacity-75">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      <CardDescription>
                        {new Date(notification.createdAt).toLocaleString('pt-BR')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={severityColors[notification.severity]}>
                        {notification.severity}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(notification.id)}
                        disabled={deleteNotificationMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{notification.message}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {notificationsLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Carregando...</p>
              </CardContent>
            </Card>
          ) : notificationsList.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Nenhuma notificação</p>
              </CardContent>
            </Card>
          ) : (
            notificationsList.map((notification: Notification) => (
              <Card key={notification.id} className={notification.readAt ? "opacity-75" : "hover:shadow-md transition-shadow"}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      <CardDescription>
                        {new Date(notification.createdAt).toLocaleString('pt-BR')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={severityColors[notification.severity]}>
                        {notification.severity}
                      </Badge>
                      {!notification.readAt && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(notification.id)}
                        disabled={deleteNotificationMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{notification.message}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}