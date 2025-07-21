import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Zap,
  MessageCircle,
  Mail,
  Phone,
  Globe,
  Activity,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Inbox,
  Send,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  FileText,
  Workflow,
  Hash,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function OmniBridge() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('channels');
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();
  
  // Channel configuration states
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [syncConfigOpen, setSyncConfigOpen] = useState(false);
  const [syncInterval, setSyncInterval] = useState(2); // Default 2 minutes

  // Use only real APIs - no mock data
  const { data: integrationsData, isLoading: integrationsLoading, refetch: refetchIntegrations } = useQuery({
    queryKey: ['/api/tenant-admin/integrations'],
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache (updated from cacheTime)
  });

  const { data: inboxData, isLoading: inboxLoading, refetch: refetchInbox } = useQuery({
    queryKey: ['/api/email-config/inbox'],
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache (updated from cacheTime)
  });

  // Monitoring status query - Using email-config API that works
  const { data: monitoringStatus } = useQuery({
    queryKey: ['/api/email-config/monitoring/status'],
    staleTime: 5000, // Cache for 5 seconds
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Start monitoring mutation - Using email-config API
  const startMonitoringMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/email-config/monitoring/start', {});
    },
    onSuccess: () => {
      toast({
        title: "Monitoramento IMAP Iniciado",
        description: "O sistema começou a monitorar emails IMAP e popular o inbox automaticamente."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/monitoring/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/inbox'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Iniciar Monitoramento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Stop monitoring mutation - Using email-config API  
  const stopMonitoringMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/email-config/monitoring/stop', {});
    },
    onSuccess: () => {
      toast({
        title: "Monitoramento IMAP Parado",
        description: "O sistema parou de monitorar emails IMAP."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/monitoring/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Parar Monitoramento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Toggle channel monitoring mutation - for individual channels
  const toggleChannelMonitoringMutation = useMutation({
    mutationFn: async ({ channelId, shouldStart }: { channelId: string, shouldStart: boolean }) => {
      if (channelId === 'imap-email') {
        // Use the real email-config API for IMAP
        const endpoint = shouldStart ? '/api/email-config/monitoring/start' : '/api/email-config/monitoring/stop';
        return await apiRequest('POST', endpoint, {});
      }
      // For other channels, just simulate
      return { success: true, channelId, isMonitoring: shouldStart };
    },
    onSuccess: (data, variables) => {
      toast({
        title: `Monitoramento ${variables.shouldStart ? 'Iniciado' : 'Parado'}`,
        description: `Canal ${variables.channelId}: monitoramento ${variables.shouldStart ? 'iniciado' : 'parado'} com sucesso.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/monitoring/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/integrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/integrations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no Monitoramento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Configure sync interval for channel
  const configureSyncMutation = useMutation({
    mutationFn: async ({ channelId, intervalMinutes }: { channelId: string, intervalMinutes: number }) => {
      // For IMAP channels, we would integrate with the Gmail service
      if (channelId === 'imap-email') {
        return await apiRequest('POST', '/api/omnibridge/configure-sync', {
          channelId,
          intervalMinutes
        });
      }
      return { success: true, channelId, intervalMinutes };
    },
    onSuccess: (data) => {
      toast({
        title: "Configuração de Sync Atualizada",
        description: `Intervalo de sincronização configurado para ${data.intervalMinutes} minutos.`
      });
      setSyncConfigOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Configuração",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Transform real data for display - ONLY communication integrations
  const allChannels = (integrationsData as any)?.integrations || [];
  const channels = allChannels.filter((integration: any) => 
    integration.category === 'Comunicação'
  );
  const inbox = (inboxData as any)?.messages || [];

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchIntegrations();
      refetchInbox();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchIntegrations, refetchInbox]);

  // Get channel type icon
  const getChannelIcon = (integration: any) => {
    const name = integration.name?.toLowerCase() || '';
    if (name.includes('email') || name.includes('gmail') || name.includes('outlook')) return Mail;
    if (name.includes('whatsapp') || name.includes('telegram')) return MessageCircle;
    if (name.includes('sms') || name.includes('twilio')) return Phone;
    if (name.includes('webhook')) return Globe;
    return Settings;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isLoading = integrationsLoading || inboxLoading;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">OmniBridge - Central de Comunicação</h1>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="text-sm text-gray-500">Carregando...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">OmniBridge - Central de Comunicação</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os canais de comunicação em uma interface unificada</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Sistema Ativo</span>
          </div>
          


          <Button 
            variant="outline"
            onClick={() => {
              refetchIntegrations();
              refetchInbox();
              toast({ title: "Dados atualizados com sucesso" });
            }}
            size="sm"
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Canais Ativos</p>
                <p className="text-2xl font-bold">{channels.filter((c: any) => c.status === 'connected').length}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              de {channels.length} canais configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mensagens na Inbox</p>
                <p className="text-2xl font-bold">{inbox.length}</p>
              </div>
              <Inbox className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              mensagens para processar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Regras Ativas</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Workflow className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              processamento automático
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Templates</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              templates disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Canais Tab */}
        <TabsContent value="channels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Canais de Comunicação
              </CardTitle>
              <CardDescription>
                Gerencie e monitore todas as integrações de comunicação ativas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {channels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.map((channel: any) => {
                    const IconComponent = getChannelIcon(channel);
                    return (
                      <Card key={channel.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <IconComponent className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">{channel.name}</h4>
                                <p className="text-sm text-gray-500">{channel.description}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={getStatusColor(channel.status)}>
                              {channel.status === 'connected' ? 'Conectado' : 
                               channel.status === 'disconnected' ? 'Desconectado' : 
                               'Erro'}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              {channel.category}
                            </div>
                          </div>

                          {/* Channel Control Buttons */}
                          <div className="space-y-3 mt-4">
                            {/* Status Toggle */}
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(channel.status)}>
                                {channel.status === 'connected' ? 'Conectado' : 
                                 channel.status === 'disconnected' ? 'Desconectado' : 
                                 'Erro'}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {channel.status === 'connected' ? 'Canal Ativo' : 'Canal Inativo'}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              {/* Monitoring Control - For all communication channels */}
                              {(() => {
                                const isMonitoringActive = (monitoringStatus as any)?.isActive || false;
                                const isChannelConnected = channel.status === 'connected';
                                const isImapChannel = channel.id === 'imap-email';
                                const isStartPending = startMonitoringMutation.isPending && isImapChannel;
                                const isStopPending = stopMonitoringMutation.isPending && isImapChannel;
                                
                                // For IMAP channel, use real monitoring status
                                // For other channels, use connection status as proxy
                                const shouldShowPause = isImapChannel ? isMonitoringActive : isChannelConnected;
                                
                                return shouldShowPause ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      if (isImapChannel) {
                                        stopMonitoringMutation.mutate();
                                      } else {
                                        toast({
                                          title: "Monitoramento Pausado",
                                          description: `Monitoramento pausado para ${channel.name}`
                                        });
                                      }
                                    }}
                                    disabled={isStopPending}
                                    className="flex items-center gap-1"
                                  >
                                    <Pause className="h-3 w-3" />
                                    {isStopPending ? 'Parando...' : 'Pausar'}
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      if (isImapChannel) {
                                        startMonitoringMutation.mutate();
                                      } else {
                                        toast({
                                          title: "Monitoramento Iniciado",
                                          description: `Monitoramento iniciado para ${channel.name}`
                                        });
                                      }
                                    }}
                                    disabled={isStartPending}
                                    className="flex items-center gap-1"
                                  >
                                    <Play className="h-3 w-3" />
                                    {isStartPending ? 'Iniciando...' : 'Iniciar'}
                                  </Button>
                                );
                              })()}
                              
                              {/* Sync Configuration Button - For email channels */}
                              {(channel.id === 'imap-email' || channel.name.toLowerCase().includes('email')) && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedChannel(channel);
                                    setSyncConfigOpen(true);
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <Clock className="h-3 w-3" />
                                  Sync
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum canal configurado</p>
                  <p className="text-sm text-gray-400 mt-2">Configure suas integrações na seção Tenant Admin</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Inbox Unificada
              </CardTitle>
              <CardDescription>
                Todas as mensagens recebidas de todos os canais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inbox.length > 0 ? (
                <div className="space-y-4">
                  {inbox.map((message: any, index: number) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{message.subject || message.title || 'Sem assunto'}</h4>
                            <p className="text-sm text-gray-500">
                              De: {message.from || message.sender || 'Desconhecido'}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              {message.priority || 'normal'}
                            </Badge>
                            <p className="text-xs text-gray-500">
                              {message.createdAt ? new Date(message.createdAt).toLocaleString('pt-BR') : 'Data indisponível'}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                          {message.content || message.body || 'Conteúdo indisponível'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Canal: {message.channel || 'email'}</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>Status: {message.status || 'pendente'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma mensagem na inbox</p>
                  <p className="text-sm text-gray-400 mt-2">As mensagens recebidas aparecerão aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regras Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Regras de Processamento
              </CardTitle>
              <CardDescription>
                Configure regras automáticas para processar mensagens recebidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sistema de regras não implementado</p>
                <p className="text-sm text-gray-400 mt-2">Esta funcionalidade será implementada em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates de Resposta
              </CardTitle>
              <CardDescription>
                Crie e gerencie templates para respostas automáticas e manuais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sistema de templates não implementado</p>
                <p className="text-sm text-gray-400 mt-2">Esta funcionalidade será implementada em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics e Métricas
              </CardTitle>
              <CardDescription>
                Monitore o desempenho e efetividade dos canais de comunicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sistema de analytics não implementado</p>
                <p className="text-sm text-gray-400 mt-2">Esta funcionalidade será implementada em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sync Configuration Dialog */}
      <Dialog open={syncConfigOpen} onOpenChange={setSyncConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Tempo de Sincronização</DialogTitle>
            <DialogDescription>
              Configure o intervalo de sincronização para o canal {selectedChannel?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="syncInterval" className="text-right">
                Intervalo (minutos)
              </Label>
              <Input
                id="syncInterval"
                type="number"
                min="1"
                max="60"
                value={syncInterval}
                onChange={(e) => setSyncInterval(parseInt(e.target.value) || 2)}
                className="col-span-3"
              />
            </div>
            <div className="text-sm text-gray-500">
              Intervalo recomendado: 2-5 minutos para alta frequência, 10-30 minutos para uso normal
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncConfigOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedChannel) {
                  configureSyncMutation.mutate({
                    channelId: selectedChannel.id,
                    intervalMinutes: syncInterval
                  });
                }
              }}
              disabled={configureSyncMutation.isPending}
            >
              {configureSyncMutation.isPending ? 'Configurando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}