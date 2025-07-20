import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Bot,
  Zap,
  Users,
  Globe,
  BarChart3,
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  MessageCircleMore,
  Clock
} from 'lucide-react';
import type { OmnibridgeChannel, OmnibridgeMessage, ProcessingRule } from '@/types/omnibridge';

const getChannelIcon = (channelType: string) => {
  switch (channelType) {
    case 'email': return <Mail className="w-4 h-4" />;
    case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
    case 'telegram': return <Send className="w-4 h-4" />;
    case 'sms': return <Phone className="w-4 h-4" />;
    case 'chatbot': return <Bot className="w-4 h-4" />;
    case 'voice': return <Phone className="w-4 h-4" />;
    case 'slack': return <MessageSquare className="w-4 h-4" />;
    case 'teams': return <Users className="w-4 h-4" />;
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

  if (loadingChannels || loadingInbox || loadingRules) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando OmniBridge...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">OmniBridge</h1>
          <p className="text-muted-foreground">
            Visualize todos os canais de comunicação configurados
          </p>
        </div>
        <Button onClick={() => setIsSignatureDialogOpen(true)}>
          <FileText className="w-4 h-4 mr-2" />
          Assinaturas de Grupos
        </Button>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Canais ({activeChannels.length})</TabsTrigger>
          <TabsTrigger value="inbox">
            Inbox Unificado
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates">Templates ({rules.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                Visualize todos os seus canais de comunicação configurados em Integrações
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeChannels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum canal ativo configurado</p>
                  <p className="text-sm">Configure canais em Workspace Admin → Integrações</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeChannels.map((channel) => (
                    <Card key={channel.id} className={`border-l-4 ${getChannelColor(channel.channelType)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getChannelIcon(channel.channelType)}
                            <div>
                              <h3 className="font-medium">{channel.name}</h3>
                              <p className="text-sm text-muted-foreground">{channel.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getHealthStatusColor(channel.healthStatus)}`}></div>
                            <Badge variant={channel.isActive ? 'default' : 'secondary'}>
                              {channel.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm text-muted-foreground">
                          <span>Mensagens: {channel.messageCount || 0}</span>
                          <span className="text-xs">
                            Status: {channel.healthStatus === 'healthy' ? 'Conectado' : 'Desconectado'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                <MessageCircleMore className="w-5 h-5" />
                Inbox Unificado
                <Badge variant="outline">{inbox.length}</Badge>
              </CardTitle>
              <CardDescription>
                Todas as mensagens de todos os canais em um só lugar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inbox.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircleMore className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma mensagem no inbox</p>
                  <p className="text-sm">Mensagens aparecerão aqui conforme chegarem pelos canais configurados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inbox.map((message) => (
                    <Card key={message.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{message.channelType}</Badge>
                              <Badge variant={getPriorityColor(message.priority)}>
                                {message.priority}
                              </Badge>
                              {message.needsResponse && (
                                <Badge variant="destructive">Precisa Resposta</Badge>
                              )}
                            </div>
                            <h4 className="font-medium mb-1">{message.subject}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              De: {message.fromName} ({message.fromContact})
                            </p>
                            <p className="text-sm">{message.bodyText?.substring(0, 200)}...</p>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {formatDateTime(message.receivedAt || '')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                <FileText className="w-5 h-5" />
                Templates e Assinaturas
              </CardTitle>
              <CardDescription>
                Configure assinaturas personalizadas para cada grupo de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Grupo Suporte</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                      {groupSignatures.support}
                    </pre>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Grupo Vendas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                      {groupSignatures.sales}
                    </pre>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Grupo Financeiro</CardTitle>
                  </CardHeader>
                  <CardContent>
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

      {/* READ-ONLY: All channel configuration removed - use Workspace Admin → Integrações */}

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