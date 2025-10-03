import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Bot, AlertCircle, CheckCircle, Clock, Search, Filter, Download, Activity, RefreshCw } from 'lucide-react';

interface ConversationLog {
  id: number;
  tenantId: string;
  agentId: number;
  agentName: string;
  channel: string;
  userId?: number;
  userName?: string;
  startedAt: string;
  endedAt?: string;
  totalMessages: number;
  totalActions: number;
  escalatedToHuman: boolean;
  escalationReason?: string;
  metadata?: any;
}

export default function ConversationLogsPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const limit = 20;
  const [searchTerm, setSearchTerm] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'pt-BR': return ptBR;
      case 'es': return es;
      default: return enUS;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPp', { locale: getDateLocale() });
  };

  // ✅ 1QA.MD: Fetch conversation logs with auto-refresh and proper authentication
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      '/api/omnibridge/conversation-logs', 
      user?.tenantId, 
      page, 
      limit, 
      agentFilter, 
      statusFilter, 
      searchTerm,
      startDate, 
      endDate
    ],
    queryFn: async () => {
      // ✅ 1QA.MD: Validate authentication using useAuth hook as primary source
      if (!user?.tenantId) {
        console.error('❌ [CONVERSATION-LOGS] No tenantId available');
        throw new Error('User not authenticated');
      }

      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (agentFilter !== 'all') {
        params.append('agentId', agentFilter);
      }
      if (statusFilter === 'escalated') {
        params.append('escalated', 'true');
      } else if (statusFilter === 'completed') {
        params.append('completed', 'true');
      }
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      console.log(`🔍 [CONVERSATION-LOGS] Fetching conversations for tenant: ${user.tenantId}`, {
        page,
        limit,
        agentFilter,
        statusFilter,
        timestamp: new Date().toISOString()
      });

      const response = await apiRequest('GET', `/api/omnibridge/conversation-logs?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ [CONVERSATION-LOGS] API Error response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      console.log(`✅ [CONVERSATION-LOGS] Received ${result?.data?.length || 0} conversations at ${new Date().toISOString()}`);

      return result;
    },
    enabled: !!user?.tenantId,
    refetchInterval: 5000, // ✅ Auto-refresh every 5 seconds
    staleTime: 0, // ✅ Always consider data stale
    gcTime: 0, // ✅ React Query v5: gcTime replaces cacheTime
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchIntervalInBackground: true,
  });

  const filteredConversations = data?.data?.filter((conv: ConversationLog) => {
    const matchesSearch = !searchTerm || 
      conv.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.channel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'escalated' && conv.escalatedToHuman) ||
      (statusFilter === 'completed' && !conv.escalatedToHuman && conv.endedAt);

    return matchesSearch && matchesStatus;
  }) || [];

  const exportData = () => {
    const dataStr = JSON.stringify(filteredConversations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversations-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // ✅ 1QA.MD: Validate user authentication before rendering
  if (!user?.tenantId) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          {t('omnibridge.conversationLogs.title', 'Histórico de Conversas IA')}
        </h1>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            {t('common.pleaseLogin', 'Por favor, faça login para continuar')}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </CardContent>
        </Card>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    console.error('❌ [CONVERSATION-LOGS] Error loading conversations:', error);
    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          {t('omnibridge.conversationLogs.title', 'Histórico de Conversas IA')}
        </h1>
        <div className="flex items-center justify-center h-64 text-destructive">
          <p>{t('omnibridge.conversationLogs.errorLoading', 'Erro ao carregar conversas')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {t('omnibridge.conversationLogs.title', 'Histórico de Conversas IA')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('omnibridge.conversationLogs.description', 'Visualize e analise todas as conversas dos agentes IA')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData} data-testid="button-export-conversations">
            <Download className="h-4 w-4 mr-2" />
            {t('common.export', 'Exportar')}
          </Button>
          <Link href="/omnibridge/conversation-analytics">
            <Button variant="default" data-testid="link-analytics">
              <Bot className="h-4 w-4 mr-2" />
              {t('omnibridge.conversationLogs.analytics', 'Analytics')}
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => refetch()} 
            disabled={isLoading}
            data-testid="button-refresh-conversations"
          >
            <Activity className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Atualizar')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('common.filters', 'Filtros')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('common.search', 'Pesquisar')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('omnibridge.conversationLogs.searchPlaceholder', 'Agente, usuário, canal...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-conversations"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('omnibridge.conversationLogs.status', 'Status')}
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all', 'Todos')}</SelectItem>
                  <SelectItem value="completed">{t('omnibridge.conversationLogs.completed', 'Concluídas')}</SelectItem>
                  <SelectItem value="escalated">{t('omnibridge.conversationLogs.escalated', 'Escaladas')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('omnibridge.conversationLogs.agent', 'Agente')}
              </label>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger data-testid="select-agent-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all', 'Todos')}</SelectItem>
                  {/* Placeholder for agents - ideally fetched from an API */}
                  <SelectItem value="agent1">Agente 1</SelectItem>
                  <SelectItem value="agent2">Agente 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {t('omnibridge.conversationLogs.noConversations', 'Nenhuma conversa encontrada')}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredConversations.map((conv: ConversationLog) => (
            <Link key={conv.id} href={`/omnibridge/conversations/${conv.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-conversation-${conv.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Bot className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold text-lg">{conv.agentName}</h3>
                        {conv.escalatedToHuman && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {t('omnibridge.conversationLogs.escalated', 'Escalada')}
                          </Badge>
                        )}
                        {conv.endedAt && !conv.escalatedToHuman && (
                          <Badge variant="default" className="gap-1 bg-green-600">
                            <CheckCircle className="h-3 w-3" />
                            {t('omnibridge.conversationLogs.completed', 'Concluída')}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t('omnibridge.conversationLogs.channel', 'Canal')}
                          </p>
                          <p className="font-medium capitalize">{conv.channel}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t('omnibridge.conversationLogs.messages', 'Mensagens')}
                          </p>
                          <p className="font-medium">{conv.totalMessages}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t('omnibridge.conversationLogs.actions', 'Ações')}
                          </p>
                          <p className="font-medium">{conv.totalActions}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t('omnibridge.conversationLogs.startTime', 'Início')}
                          </p>
                          <p className="font-medium flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {formatDate(conv.startedAt)}
                          </p>
                        </div>
                      </div>

                      {conv.escalationReason && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-sm text-red-800 dark:text-red-200">
                            <strong>{t('omnibridge.conversationLogs.escalationReason', 'Motivo da escalação')}:</strong> {conv.escalationReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {data?.total > limit && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            data-testid="button-previous-page"
          >
            {t('common.previous', 'Anterior')}
          </Button>
          <span className="flex items-center px-4">
            {t('common.page', 'Página')} {page + 1} {t('common.of', 'de')} {Math.ceil(data.total / limit)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * limit >= data.total}
            data-testid="button-next-page"
          >
            {t('common.next', 'Próximo')}
          </Button>
        </div>
      )}
    </div>
  );
}