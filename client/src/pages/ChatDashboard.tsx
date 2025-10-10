import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Clock, MessageSquare, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface QueueStats {
  queueId: string;
  queueName: string;
  waitingCustomers: number;
  activeChats: number;
  availableAgents: number;
  totalAgents: number;
  avgWaitTime: number;
  avgResponseTime: number;
  slaCompliance: number;
}

interface AgentStatus {
  id: string;
  agentName: string;
  status: 'available' | 'busy' | 'away' | 'offline';
  activeChats: number;
  maxConcurrentChats: number;
  avgResponseTime: number;
  lastActivity: Date;
}

interface RealtimeMetrics {
  totalChats: number;
  totalWaiting: number;
  totalAgents: number;
  availableAgents: number;
  avgWaitTime: number;
  avgResponseTime: number;
  slaCompliance: number;
}

export default function ChatDashboard() {
  const { data: metrics } = useQuery<RealtimeMetrics>({
    queryKey: ['/api/chat/metrics/realtime'],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const { data: queueStats } = useQuery<QueueStats[]>({
    queryKey: ['/api/chat/queues/stats'],
    refetchInterval: 5000,
  });

  const { data: agentStatuses } = useQuery<AgentStatus[]>({
    queryKey: ['/api/chat/agents/status'],
    refetchInterval: 5000,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-500',
      busy: 'bg-yellow-500',
      away: 'bg-orange-500',
      offline: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'Disponível',
      busy: 'Ocupado',
      away: 'Ausente',
      offline: 'Offline',
    };
    return labels[status] || status;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Dashboard de Atendimento
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitoramento em tempo real de filas, chats e agentes
        </p>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Chats Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="metric-active-chats">
              {metrics?.totalChats || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Em atendimento agora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Aguardando
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="metric-waiting">
              {metrics?.totalWaiting || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              TMA: {formatTime(metrics?.avgWaitTime || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Agentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="metric-agents">
              {metrics?.availableAgents || 0}/{metrics?.totalAgents || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Disponíveis/Total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="metric-sla">
              {metrics?.slaCompliance || 0}%
            </div>
            <Progress value={metrics?.slaCompliance || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Queue Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Estatísticas por Fila
          </CardTitle>
          <CardDescription>
            Métricas em tempo real de cada fila de atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fila</TableHead>
                <TableHead className="text-center">Aguardando</TableHead>
                <TableHead className="text-center">Ativos</TableHead>
                <TableHead className="text-center">Agentes</TableHead>
                <TableHead>TMA</TableHead>
                <TableHead>TMR</TableHead>
                <TableHead className="text-right">SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queueStats?.map((queue) => (
                <TableRow key={queue.queueId} data-testid={`queue-stats-${queue.queueId}`}>
                  <TableCell className="font-medium">{queue.queueName}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={queue.waitingCustomers > 0 ? 'destructive' : 'secondary'}
                      data-testid={`queue-waiting-${queue.queueId}`}
                    >
                      {queue.waitingCustomers}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" data-testid={`queue-active-${queue.queueId}`}>
                      {queue.activeChats}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span data-testid={`queue-agents-${queue.queueId}`}>
                      {queue.availableAgents}/{queue.totalAgents}
                    </span>
                  </TableCell>
                  <TableCell data-testid={`queue-wait-time-${queue.queueId}`}>
                    {formatTime(queue.avgWaitTime)}
                  </TableCell>
                  <TableCell data-testid={`queue-response-time-${queue.queueId}`}>
                    {formatTime(queue.avgResponseTime)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span 
                        className={queue.slaCompliance >= 90 ? 'text-green-600' : queue.slaCompliance >= 70 ? 'text-yellow-600' : 'text-red-600'}
                        data-testid={`queue-sla-${queue.queueId}`}
                      >
                        {queue.slaCompliance}%
                      </span>
                      {queue.slaCompliance >= 90 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : queue.slaCompliance >= 70 ? (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!queueStats?.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma fila configurada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Status dos Agentes
          </CardTitle>
          <CardDescription>
            Visualização em tempo real do status de cada agente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Chats Ativos</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>TMR</TableHead>
                <TableHead className="text-right">Última Atividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentStatuses?.map((agent) => (
                <TableRow key={agent.id} data-testid={`agent-status-${agent.id}`}>
                  <TableCell className="font-medium">{agent.agentName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(agent.status)}`} />
                      <span data-testid={`agent-status-label-${agent.id}`}>
                        {getStatusLabel(agent.status)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={agent.activeChats > 0 ? 'default' : 'secondary'} data-testid={`agent-chats-${agent.id}`}>
                      {agent.activeChats}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(agent.activeChats / agent.maxConcurrentChats) * 100} 
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        {agent.activeChats}/{agent.maxConcurrentChats}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`agent-response-time-${agent.id}`}>
                    {formatTime(agent.avgResponseTime)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground" data-testid={`agent-last-activity-${agent.id}`}>
                    {new Date(agent.lastActivity).toLocaleTimeString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
              {!agentStatuses?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum agente online
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        Atualizando automaticamente a cada 3-5 segundos
      </div>
    </div>
  );
}
