import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Clock, Settings, Mail, BarChart3, Target, MessageSquare, Users, Globe, Phone, Zap, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface OmnibridgeChannel {
  id: string;
  name: string;
  channelType: 'email' | 'whatsapp' | 'telegram' | 'sms' | 'chatbot' | 'voice';
  isActive: boolean;
  isMonitoring: boolean;
  healthStatus: 'healthy' | 'warning' | 'error';
  description: string;
  provider: string;
  connectionSettings: Record<string, any>;
  lastHealthCheck?: string;
  messageCount?: number;
  errorCount?: number;
}

interface OmnibridgeMessage {
  id: string;
  channelId: string;
  channelType: 'email' | 'whatsapp' | 'telegram' | 'sms' | 'chatbot' | 'voice';
  direction: 'inbound' | 'outbound';
  fromContact: string;
  fromName?: string;
  toContact: string;
  subject?: string;
  bodyText: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  isProcessed: boolean;
  isArchived: boolean;
  needsResponse?: boolean;
  processingRuleId?: string;
  ticketId?: string;
  receivedAt: string;
  processedAt?: string;
}

interface ProcessingRule {
  id: string;
  name: string;
  actionType: 'create_ticket' | 'route_to_team' | 'auto_response' | 'escalate' | 'archive';
  applicableChannels: string[];
  conditions: Record<string, any>;
  priority: number;
  isActive: boolean;
  executionCount: number;
  lastExecuted?: string;
}

const getChannelIcon = (channelType: string) => {
  switch (channelType) {
    case 'email': return <Mail className="w-4 h-4" />;
    case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
    case 'telegram': return <MessageSquare className="w-4 h-4" />;
    case 'sms': return <Phone className="w-4 h-4" />;
    case 'chatbot': return <Zap className="w-4 h-4" />;
    case 'voice': return <Phone className="w-4 h-4" />;
    default: return <Globe className="w-4 h-4" />;
  }
};

const getChannelColor = (channelType: string) => {
  switch (channelType) {
    case 'email': return 'border-l-blue-500';
    case 'whatsapp': return 'border-l-green-500';
    case 'telegram': return 'border-l-sky-500';
    case 'sms': return 'border-l-purple-500';
    case 'chatbot': return 'border-l-orange-500';
    case 'voice': return 'border-l-red-500';
    default: return 'border-l-gray-500';
  }
};

const getHealthStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'bg-green-500';
    case 'warning': return 'bg-yellow-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    default: return 'outline';
  }
};

export default function OmniBridgeConfiguration() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: '',
    channelType: '',
    description: '',
    provider: ''
  });

  // Fetch communication channels
  const { data: channelsData, isLoading: loadingChannels } = useQuery<{ data: OmnibridgeChannel[] }>({
    queryKey: ['/api/omnibridge/channels'],
    enabled: true
  });

  // Fetch unified inbox
  const { data: inboxData, isLoading: loadingInbox } = useQuery<{ data: OmnibridgeMessage[] }>({
    queryKey: ['/api/omnibridge/inbox'],
    enabled: true,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch processing rules
  const { data: rulesData, isLoading: loadingRules } = useQuery<{ data: ProcessingRule[] }>({
    queryKey: ['/api/omnibridge/rules'],
    enabled: true
  });

  // Fetch unread count
  const { data: unreadData } = useQuery<{ data: { unreadCount: number } }>({
    queryKey: ['/api/omnibridge/inbox/unread-count'],
    enabled: true,
    refetchInterval: 5000
  });

  const channels = channelsData?.data || [];
  const inbox = inboxData?.data || [];
  const rules = rulesData?.data || [];
  const unreadCount = unreadData?.data?.unreadCount || 0;

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const activeChannels = channels.filter(c => c.isActive);
  const monitoringChannels = channels.filter(c => c.isMonitoring);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OmniBridge</h1>
          <p className="text-muted-foreground">
            Central de comunicação unificada para Email, WhatsApp, Telegram, SMS e mais
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Canais Ativos</p>
                <p className="text-2xl font-bold">{activeChannels.length}</p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monitoramento</p>
                <p className="text-2xl font-bold">{monitoringChannels.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mensagens Não Lidas</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Regras Ativas</p>
                <p className="text-2xl font-bold">{rules.filter(r => r.isActive).length}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Canais
          </TabsTrigger>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Inbox Unificado
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Regras
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Canais de Comunicação
              </CardTitle>
              <CardDescription>
                Configure e gerencie todos os seus canais de comunicação em um só lugar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingChannels ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {channels.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum canal configurado</p>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="mt-4">
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Canal
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Adicionar Novo Canal</DialogTitle>
                            <DialogDescription>
                              Configure um novo canal de comunicação para sua plataforma.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="name" className="text-right">
                                Nome
                              </Label>
                              <Input
                                id="name"
                                value={newChannel.name}
                                onChange={(e) => setNewChannel(prev => ({ ...prev, name: e.target.value }))}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="type" className="text-right">
                                Tipo
                              </Label>
                              <Select
                                value={newChannel.channelType}
                                onValueChange={(value) => setNewChannel(prev => ({ ...prev, channelType: value }))}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                  <SelectItem value="telegram">Telegram</SelectItem>
                                  <SelectItem value="sms">SMS</SelectItem>
                                  <SelectItem value="chatbot">Chatbot</SelectItem>
                                  <SelectItem value="voice">Voz</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="description" className="text-right">
                                Descrição
                              </Label>
                              <Textarea
                                id="description"
                                value={newChannel.description}
                                onChange={(e) => setNewChannel(prev => ({ ...prev, description: e.target.value }))}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="provider" className="text-right">
                                Provedor
                              </Label>
                              <Input
                                id="provider"
                                value={newChannel.provider}
                                onChange={(e) => setNewChannel(prev => ({ ...prev, provider: e.target.value }))}
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" onClick={() => {
                              console.log('Criando canal:', newChannel);
                              setIsDialogOpen(false);
                              setNewChannel({ name: '', channelType: '', description: '', provider: '' });
                            }}>
                              Criar Canal
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : (
                    channels.map((channel) => (
                      <Card key={channel.id} className={`border-l-4 ${getChannelColor(channel.channelType)}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getChannelIcon(channel.channelType)}
                                <h3 className="font-semibold">{channel.name}</h3>
                                <Badge variant={channel.isActive ? 'default' : 'secondary'}>
                                  {channel.isActive ? 'Ativo' : 'Inativo'}
                                </Badge>
                                {channel.isMonitoring && (
                                  <Badge variant="outline">Monitorando</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{channel.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span><strong>Tipo:</strong> {channel.channelType.toUpperCase()}</span>
                                <span><strong>Provedor:</strong> {channel.provider}</span>
                                {channel.messageCount !== undefined && (
                                  <span><strong>Mensagens:</strong> {channel.messageCount}</span>
                                )}
                              </div>
                              {channel.lastHealthCheck && (
                                <p className="text-xs text-muted-foreground">
                                  Último check: {formatDateTime(channel.lastHealthCheck)}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(channel.healthStatus)}`}></div>
                              <Button variant="outline" size="sm">Configurar</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unified Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Inbox Unificado
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} não lidas</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Todas as suas mensagens de comunicação em um só lugar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInbox ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {inbox.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma mensagem encontrada</p>
                    </div>
                  ) : (
                    inbox.map((message) => (
                      <Card key={message.id} className={`border-l-4 ${getChannelColor(message.channelType)} ${!message.isRead ? 'bg-blue-50/50' : ''}`}>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {getChannelIcon(message.channelType)}
                                  <h3 className={`font-semibold ${!message.isRead ? 'font-bold' : ''}`}>
                                    {message.subject || `Mensagem ${message.channelType.toUpperCase()}`}
                                  </h3>
                                  <Badge variant={getPriorityColor(message.priority)}>
                                    {message.priority}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span><strong>De:</strong> {message.fromName || message.fromContact}</span>
                                  <span><strong>Canal:</strong> {message.channelType.toUpperCase()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!message.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                {message.isProcessed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                {message.needsResponse && <Clock className="w-4 h-4 text-orange-500" />}
                              </div>
                            </div>
                            
                            <p className="text-sm line-clamp-2">{message.bodyText}</p>
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Recebido: {formatDateTime(message.receivedAt)}</span>
                              <div className="flex gap-2">
                                {message.ticketId && (
                                  <Badge variant="outline">Ticket criado</Badge>
                                )}
                                {message.isArchived && (
                                  <Badge variant="secondary">Arquivado</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processing Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Regras de Processamento
              </CardTitle>
              <CardDescription>
                Configure regras automáticas para processamento inteligente de mensagens
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRules ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma regra configurada</p>
                      <Button className="mt-4">Criar Regra</Button>
                    </div>
                  ) : (
                    rules.map((rule) => (
                      <Card key={rule.id} className="border-l-4 border-l-purple-500">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{rule.name}</h3>
                                <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                                  {rule.isActive ? 'Ativa' : 'Inativa'}
                                </Badge>
                                <Badge variant="outline">Prioridade {rule.priority}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span><strong>Ação:</strong> {rule.actionType}</span>
                                <span><strong>Canais:</strong> {rule.applicableChannels.join(', ')}</span>
                                <span><strong>Execuções:</strong> {rule.executionCount}</span>
                              </div>
                              {rule.lastExecuted && (
                                <p className="text-xs text-muted-foreground">
                                  Última execução: {formatDateTime(rule.lastExecuted)}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">Editar</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Templates de Resposta
              </CardTitle>
              <CardDescription>
                Gerencie templates para respostas automáticas e padronizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Templates em desenvolvimento</p>
                <Button className="mt-4">Criar Template</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics e Métricas
              </CardTitle>
              <CardDescription>
                Análise de performance e estatísticas de comunicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Analytics em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}