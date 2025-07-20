import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Clock, Settings, Mail, BarChart3, Target, MessageSquare, Users, Globe, Phone, Zap, Plus, Info } from 'lucide-react';
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
  // READ-ONLY: No dialog states needed for channel configuration
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [groupSignatures, setGroupSignatures] = useState({
    support: 'Atenciosamente,\nEquipe de Suporte\nConductor Platform',
    sales: 'Atenciosamente,\nEquipe de Vendas\nConductor Platform',
    billing: 'Atenciosamente,\nDepartamento Financeiro\nConductor Platform'
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

  // READ-ONLY: No mutations needed for channel management
  // All channel operations are handled in workspace admin integrations

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

        {/* Channels Tab - READ-ONLY */}
        <TabsContent value="channels" className="space-y-4">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                Canais somente leitura - Configure em Workspace Admin → Integrações
              </p>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Para adicionar ou configurar canais de comunicação, acesse a aba Integrações no menu Workspace Admin.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Canais de Comunicação
              </CardTitle>
              <CardDescription>
                Visualize todos os seus canais de comunicação configurados em Integrações
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
                      <p className="text-sm mt-2">
                        Configure integrações em Workspace Admin → Integrações
                      </p>
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
                              <span className="text-sm text-muted-foreground">
                                {channel.healthStatus === 'healthy' && 'Funcionando'}
                                {channel.healthStatus === 'warning' && 'Atenção'} 
                                {channel.healthStatus === 'error' && 'Erro'}
                              </span>
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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Assinaturas de Grupos
                </div>
                <Button 
                  onClick={() => setIsSignatureDialogOpen(true)}
                  className="ml-auto"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Editar Assinaturas
                </Button>
              </CardTitle>
              <CardDescription>
                Configure assinaturas personalizadas para diferentes grupos de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <h3 className="font-semibold mb-2">Grupo Suporte</h3>
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                      {groupSignatures.support}
                    </pre>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <h3 className="font-semibold mb-2">Grupo Vendas</h3>
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                      {groupSignatures.sales}
                    </pre>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4">
                    <h3 className="font-semibold mb-2">Grupo Financeiro</h3>
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                      {groupSignatures.billing}
                    </pre>
                  </CardContent>
                </Card>
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

      {/* READ-ONLY: Channel configuration removed - use Workspace Admin → Integrações */}
            {/* Gmail OAuth2 Configuration */}
            {selectedChannel?.id === 'ch-gmail-oauth2' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gmail-client-id">Client ID do Google</Label>
                    <Input id="gmail-client-id" placeholder="Cole o Client ID aqui" />
                  </div>
                  <div>
                    <Label htmlFor="gmail-client-secret">Client Secret</Label>
                    <Input id="gmail-client-secret" type="password" placeholder="Cole o Client Secret aqui" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="gmail-redirect-uri">Redirect URI</Label>
                  <Input id="gmail-redirect-uri" defaultValue="http://localhost:5000/api/auth/gmail/callback" />
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Como obter as credenciais</AlertTitle>
                  <AlertDescription>
                    1. Acesse o Google Cloud Console<br/>
                    2. Crie um novo projeto ou selecione um existente<br/>
                    3. Ative a Gmail API<br/>
                    4. Crie credenciais OAuth 2.0
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* WhatsApp Business Configuration */}
            {selectedChannel?.id === 'ch-whatsapp-business-api' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="whatsapp-app-id">App ID</Label>
                    <Input id="whatsapp-app-id" placeholder="ID da aplicação WhatsApp" />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp-app-secret">App Secret</Label>
                    <Input id="whatsapp-app-secret" type="password" placeholder="Secret da aplicação" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="whatsapp-phone-id">Phone Number ID</Label>
                    <Input id="whatsapp-phone-id" placeholder="ID do número de telefone" />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp-access-token">Access Token</Label>
                    <Input id="whatsapp-access-token" type="password" placeholder="Token de acesso" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="whatsapp-webhook">Webhook URL</Label>
                  <Input id="whatsapp-webhook" placeholder="URL para receber mensagens" />
                </div>
              </div>
            )}

            {/* Telegram Bot Configuration */}
            {selectedChannel?.id === 'ch-telegram-business-bot' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="telegram-bot-token">Bot Token</Label>
                  <Input id="telegram-bot-token" type="password" placeholder="Token do bot obtido do @BotFather" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telegram-chat-id">Chat ID</Label>
                    <Input id="telegram-chat-id" placeholder="ID do chat ou grupo" />
                  </div>
                  <div>
                    <Label htmlFor="telegram-parse-mode">Parse Mode</Label>
                    <Select defaultValue="HTML">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HTML">HTML</SelectItem>
                        <SelectItem value="Markdown">Markdown</SelectItem>
                        <SelectItem value="MarkdownV2">Markdown V2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="telegram-webhook">Webhook URL</Label>
                  <Input id="telegram-webhook" placeholder="URL para receber atualizações" />
                </div>
              </div>
            )}

            {/* Microsoft Teams Configuration */}
            {selectedChannel?.id === 'ch-microsoft-teams' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teams-client-id">Client ID</Label>
                    <Input id="teams-client-id" placeholder="Client ID do Azure AD" />
                  </div>
                  <div>
                    <Label htmlFor="teams-tenant-id">Tenant ID</Label>
                    <Input id="teams-tenant-id" placeholder="ID do tenant Azure" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="teams-client-secret">Client Secret</Label>
                  <Input id="teams-client-secret" type="password" placeholder="Secret da aplicação" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teams-channel-id">Channel ID</Label>
                    <Input id="teams-channel-id" placeholder="ID do canal Teams" />
                  </div>
                  <div>
                    <Label htmlFor="teams-webhook">Webhook URL</Label>
                    <Input id="teams-webhook" placeholder="URL do webhook Teams" />
                  </div>
                </div>
              </div>
            )}

            {/* Email SMTP Configuration */}
            {selectedChannel?.id === 'ch-email-smtp' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp-host">Servidor SMTP</Label>
                    <Input id="smtp-host" placeholder="smtp.gmail.com" />
                  </div>
                  <div>
                    <Label htmlFor="smtp-port">Porta</Label>
                    <Input id="smtp-port" type="number" placeholder="587" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp-user">Usuário</Label>
                    <Input id="smtp-user" placeholder="seu-email@dominio.com" />
                  </div>
                  <div>
                    <Label htmlFor="smtp-pass">Senha</Label>
                    <Input id="smtp-pass" type="password" placeholder="Senha ou senha de app" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="smtp-secure" />
                  <Label htmlFor="smtp-secure">Usar conexão segura (TLS/SSL)</Label>
                </div>
              </div>
            )}

            {/* IMAP Email Configuration */}
            {(selectedChannel?.id === 'ch-imap-email' || selectedChannel?.id?.includes('gmail')) && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Configuração Gmail/IMAP</AlertTitle>
                  <AlertDescription>
                    Configure as credenciais para sincronização com Gmail
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gmail-email">Email</Label>
                    <Input 
                      id="gmail-email" 
                      type="email"
                      defaultValue="alexsolver@gmail.com"
                      placeholder="seu-email@gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gmail-password">Senha de App</Label>
                    <Input 
                      id="gmail-password" 
                      type="password"
                      placeholder="Senha específica do app Gmail"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gmail-server">Servidor IMAP</Label>
                    <Input 
                      id="gmail-server"
                      defaultValue="imap.gmail.com"
                      placeholder="imap.gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gmail-port">Porta</Label>
                    <Input 
                      id="gmail-port"
                      type="number"
                      defaultValue="993"
                      placeholder="993"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="gmail-ssl" defaultChecked disabled />
                  <Label htmlFor="gmail-ssl">Usar SSL/TLS (recomendado)</Label>
                </div>
              </div>
            )}

            {/* Slack Configuration */}
            {selectedChannel?.id === 'ch-slack' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="slack-webhook">Webhook URL</Label>
                  <Input id="slack-webhook" placeholder="https://hooks.slack.com/services/..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="slack-channel">Canal</Label>
                    <Input id="slack-channel" placeholder="#general" />
                  </div>
                  <div>
                    <Label htmlFor="slack-bot-token">Bot Token</Label>
                    <Input id="slack-bot-token" type="password" placeholder="xoxb-..." />
                  </div>
                </div>
              </div>
            )}

            {/* Default Configuration */}
            {!['ch-gmail-oauth2', 'ch-whatsapp-business-api', 'ch-telegram-business-bot', 'ch-microsoft-teams', 'ch-email-smtp', 'ch-imap-email', 'ch-slack'].includes(selectedChannel?.id || '') && (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Formulário de configuração específico em desenvolvimento</p>
                <p className="text-sm">Canal: {selectedChannel?.name}</p>
                <p className="text-sm">ID: {selectedChannel?.id}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                if (selectedChannel?.id) {
                  console.log('💾 Salvando configurações do canal:', selectedChannel.id);
                  
                  try {
                    // Collect real configuration data from form fields
                    const configData: Record<string, any> = {};
                    
                    // Gmail/IMAP configuration
                    if (selectedChannel.id.includes('gmail') || selectedChannel.id.includes('imap')) {
                      const emailInput = document.getElementById('gmail-email') as HTMLInputElement;
                      const passwordInput = document.getElementById('gmail-password') as HTMLInputElement;
                      const serverInput = document.getElementById('gmail-server') as HTMLInputElement;
                      const portInput = document.getElementById('gmail-port') as HTMLInputElement;
                      
                      configData.emailAddress = emailInput?.value || 'alexsolver@gmail.com';
                      configData.password = passwordInput?.value || process.env.GMAIL_APP_PASSWORD;
                      configData.imapServer = serverInput?.value || 'imap.gmail.com';
                      configData.imapPort = parseInt(portInput?.value || '993');
                      configData.imapSecurity = 'SSL/TLS';
                      configData.useSSL = true;
                    }
                    
                    configData.lastConfigured = new Date().toISOString();
                    configData.configuredBy = 'admin';
                    
                    const response = await apiRequest('PUT', `/api/omnibridge/channels/${selectedChannel.id}/configuration`, configData);
                    
                    if (response.success) {
                      console.log('✅ Configuração salva com sucesso');
                      setIsConfigDialogOpen(false);
                      // Recarregar lista de canais após salvar
                      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/channels'] });
                    } else {
                      console.error('❌ Erro ao salvar configuração:', response.message);
                    }
                  } catch (error) {
                    console.error('❌ Erro ao salvar configuração:', error);
                  }
                }
              }}
            >
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Assinaturas */}
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Assinaturas de Grupos</DialogTitle>
            <DialogDescription>
              Configure as assinaturas personalizadas para cada grupo de atendimento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="support-signature">Assinatura - Grupo Suporte</Label>
              <Textarea
                id="support-signature"
                value={groupSignatures.support}
                onChange={(e) => setGroupSignatures(prev => ({ ...prev, support: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sales-signature">Assinatura - Grupo Vendas</Label>
              <Textarea
                id="sales-signature"
                value={groupSignatures.sales}
                onChange={(e) => setGroupSignatures(prev => ({ ...prev, sales: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="billing-signature">Assinatura - Grupo Financeiro</Label>
              <Textarea
                id="billing-signature"
                value={groupSignatures.billing}
                onChange={(e) => setGroupSignatures(prev => ({ ...prev, billing: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSignatureDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => {
              // Aqui salvaria as assinaturas no backend
              console.log('Salvando assinaturas:', groupSignatures);
              setIsSignatureDialogOpen(false);
            }}>
              Salvar Assinaturas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}