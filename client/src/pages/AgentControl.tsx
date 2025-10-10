import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Circle, Clock, Coffee, LogOut, Check, X, 
  MessageSquare, TrendingUp, Activity
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface AgentStatus {
  id: string;
  agentId: string;
  status: 'available' | 'busy' | 'away' | 'offline';
  activeChats: number;
  maxConcurrentChats: number;
  lastActivity: Date;
}

interface PendingChat {
  id: string;
  queueId: string;
  queueName: string;
  customerName: string;
  customerChannel: string;
  waitTime: number;
  priority: number;
}

interface AgentMetrics {
  todayChats: number;
  avgResponseTime: number;
  avgChatDuration: number;
  customerSatisfaction: number;
}

export default function AgentControl() {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>('available');

  const { data: agentStatus } = useQuery<AgentStatus>({
    queryKey: ['/api/chat/agents/my-status'],
    refetchInterval: 3000,
  });

  const { data: pendingChats } = useQuery<PendingChat[]>({
    queryKey: ['/api/chat/agents/pending'],
    refetchInterval: 2000,
  });

  const { data: metrics } = useQuery<AgentMetrics>({
    queryKey: ['/api/chat/agents/my-metrics'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      apiRequest('/api/chat/agents/status', 'POST', { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/agents/my-status'] });
      toast({ title: 'Status atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    },
  });

  const acceptChatMutation = useMutation({
    mutationFn: (chatId: string) =>
      apiRequest('/api/chat/agents/accept', 'POST', { chatId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/agents/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/agents/my-status'] });
      toast({ title: 'Chat aceito! Iniciando atendimento...' });
    },
    onError: () => {
      toast({ title: 'Erro ao aceitar chat', variant: 'destructive' });
    },
  });

  const declineChatMutation = useMutation({
    mutationFn: (chatId: string) =>
      apiRequest('/api/chat/agents/decline', 'POST', { chatId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/agents/pending'] });
      toast({ title: 'Chat recusado' });
    },
    onError: () => {
      toast({ title: 'Erro ao recusar chat', variant: 'destructive' });
    },
  });

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    updateStatusMutation.mutate(status);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'text-green-600 bg-green-50',
      busy: 'text-yellow-600 bg-yellow-50',
      away: 'text-orange-600 bg-orange-50',
      offline: 'text-gray-600 bg-gray-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      available: <Circle className="h-4 w-4 fill-green-600 text-green-600" />,
      busy: <Activity className="h-4 w-4 text-yellow-600" />,
      away: <Coffee className="h-4 w-4 text-orange-600" />,
      offline: <LogOut className="h-4 w-4 text-gray-600" />,
    };
    return icons[status] || <Circle className="h-4 w-4" />;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      whatsapp: 'bg-green-500',
      telegram: 'bg-blue-500',
      email: 'bg-purple-500',
      slack: 'bg-pink-500',
    };
    return colors[channel.toLowerCase()] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Painel de Controle do Agente
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seu status e aceite novos atendimentos
        </p>
      </div>

      {/* Status Control */}
      <Card>
        <CardHeader>
          <CardTitle>Status Atual</CardTitle>
          <CardDescription>
            Altere seu status para gerenciar sua disponibilidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusColor(agentStatus?.status || 'offline')}`}>
              {getStatusIcon(agentStatus?.status || 'offline')}
              <span className="font-semibold capitalize" data-testid="current-status">
                {agentStatus?.status || 'offline'}
              </span>
            </div>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48" data-testid="select-status">
                <SelectValue placeholder="Alterar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 fill-green-600 text-green-600" />
                    Disponível
                  </div>
                </SelectItem>
                <SelectItem value="busy">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-yellow-600" />
                    Ocupado
                  </div>
                </SelectItem>
                <SelectItem value="away">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-3 w-3 text-orange-600" />
                    Ausente
                  </div>
                </SelectItem>
                <SelectItem value="offline">
                  <div className="flex items-center gap-2">
                    <LogOut className="h-3 w-3 text-gray-600" />
                    Offline
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Capacidade</span>
              <span className="text-sm text-muted-foreground" data-testid="capacity-text">
                {agentStatus?.activeChats || 0}/{agentStatus?.maxConcurrentChats || 5} chats
              </span>
            </div>
            <Progress
              value={((agentStatus?.activeChats || 0) / (agentStatus?.maxConcurrentChats || 5)) * 100}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Chats Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-today-chats">
              {metrics?.todayChats || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              TMR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-response-time">
              {formatTime(metrics?.avgResponseTime || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              Duração Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-chat-duration">
              {formatTime(metrics?.avgChatDuration || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              CSAT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-satisfaction">
              {metrics?.customerSatisfaction || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Chats */}
      <Card>
        <CardHeader>
          <CardTitle>Chats Aguardando Atendimento</CardTitle>
          <CardDescription>
            Aceite ou recuse os chats atribuídos a você
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingChats?.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                data-testid={`pending-chat-${chat.id}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`h-3 w-3 rounded-full ${getChannelColor(chat.customerChannel)}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold" data-testid={`customer-name-${chat.id}`}>
                        {chat.customerName}
                      </h4>
                      <Badge variant="outline">{chat.queueName}</Badge>
                      {chat.priority > 1 && (
                        <Badge variant="destructive">Alta Prioridade</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{chat.customerChannel}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span data-testid={`wait-time-${chat.id}`}>
                          Aguardando há {formatTime(chat.waitTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => declineChatMutation.mutate(chat.id)}
                    disabled={declineChatMutation.isPending}
                    data-testid={`button-decline-${chat.id}`}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Recusar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-blue-600"
                    onClick={() => acceptChatMutation.mutate(chat.id)}
                    disabled={acceptChatMutation.isPending}
                    data-testid={`button-accept-${chat.id}`}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Aceitar
                  </Button>
                </div>
              </div>
            ))}
            {!pendingChats?.length && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum chat aguardando atendimento</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        Atualizando automaticamente a cada 2-3 segundos
      </div>
    </div>
  );
}
