
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Send, 
  Inbox, 
  Settings, 
  Activity, 
  Search,
  Filter,
  Archive,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  MessageCircle,
  FileText,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCheck,
  Play,
  Pause
} from 'lucide-react';

interface Channel {
  id: string;
  type: 'email' | 'whatsapp' | 'telegram' | 'sms';
  name: string;
  isActive: boolean;
  isConnected: boolean;
  messageCount: number;
  errorCount: number;
  lastError: string | null;
  lastSync: string | null;
}

interface UnifiedMessage {
  id: string;
  channelType: string;
  fromAddress: string;
  fromName: string | null;
  subject: string | null;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived' | 'processed';
  hasAttachments: boolean;
  receivedAt: string;
  ticketId: string | null;
}

interface MonitoringStatus {
  totalChannels: number;
  activeChannels: number;
  connectedChannels: number;
  healthyChannels: number;
  unreadMessages: number;
  messagesByChannel: Record<string, number>;
  systemStatus: 'healthy' | 'degraded';
  lastSync: string;
}

export default function OmniBridge() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoringStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<UnifiedMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    // Setup auto-refresh
    const interval = setInterval(loadData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadChannels(),
      loadInbox(),
      loadMonitoring()
    ]);
  };

  const loadChannels = async () => {
    try {
      const response = await fetch('/api/omni-bridge/channels', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📋 Channels API Response:', data);
      
      if (data.success) {
        setChannels(data.channels || []);
      } else {
        console.error('Channels API returned error:', data.message);
        setChannels([]);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      setChannels([]);
    }
  };

  const loadInbox = async () => {
    try {
      const params = new URLSearchParams({
        limit: '100',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(channelFilter !== 'all' && { channelType: channelFilter })
      });

      console.log('📧 TENTANDO BUSCAR INBOX MESSAGES...');
      const response = await fetch(`/api/omni-bridge/inbox?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('📧 Response Status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📧 Inbox API Response RAW:', data);
      
      if (data.success) {
        // A API pode retornar os dados diretamente ou em data.data
        const messagesData = data.messages || data.data || [];
        console.log('📧 Data length:', messagesData.length);
        
        if (messagesData.length > 0) {
          console.log('📧 First message:', messagesData[0]);
        }
        
        setMessages(messagesData);
      } else {
        console.error('Inbox API returned error:', data.message);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading inbox:', error);
      setMessages([]);
    }
  };

  const loadMonitoring = async () => {
    try {
      console.log('📊 VERIFICANDO STATUS DO MONITORAMENTO...');
      const response = await fetch('/api/omni-bridge/monitoring', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('📊 Monitoring Response Status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Monitoring Status Response RAW:', data);
      
      if (data.success) {
        // A API retorna diferentes estruturas dependendo do endpoint
        const monitoringData = data.monitoring || data.data || {
          totalChannels: 0,
          activeChannels: 0,
          connectedChannels: 0,
          healthyChannels: 0,
          unreadMessages: 0,
          messagesByChannel: {},
          systemStatus: 'unknown',
          lastSync: new Date().toISOString()
        };
        
        // Se for estrutura de monitoramento diferente, adaptar
        if (data.data && data.data.isMonitoring !== undefined) {
          const adaptedData = {
            totalChannels: data.data.activeIntegrations?.length || 0,
            activeChannels: data.data.connectionCount || 0,
            connectedChannels: data.data.connectionCount || 0,
            healthyChannels: data.data.isMonitoring ? data.data.connectionCount || 0 : 0,
            unreadMessages: 0, // Will be updated by inbox
            messagesByChannel: {},
            systemStatus: data.data.isMonitoring ? 'healthy' : 'degraded',
            lastSync: new Date().toISOString()
          };
          setMonitoring(adaptedData);
        } else {
          setMonitoring(monitoringData);
        }
        
        console.log('📊 Is Monitoring:', data.data?.isMonitoring);
        console.log('📊 Connection Count:', data.data?.connectionCount);
        console.log('📊 Active Integrations:', data.data?.activeIntegrations);
      } else {
        console.error('Monitoring API returned error:', data.message);
        setMonitoring(null);
      }
    } catch (error) {
      console.error('Error loading monitoring:', error);
      setMonitoring(null);
    }
  };

  const syncChannels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/omni-bridge/channels/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Sucesso', description: data.message });
        await loadChannels();
      } else {
        toast({ title: 'Erro', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao sincronizar canais', variant: 'destructive' });
    }
    setLoading(false);
  };

  const processMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/omni-bridge/process', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        toast({ 
          title: 'Processamento Concluído', 
          description: `${data.result.processedCount} mensagens processadas, ${data.result.ticketsCreated} tickets criados`
        });
        await loadInbox();
      } else {
        toast({ title: 'Erro', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao processar mensagens', variant: 'destructive' });
    }
    setLoading(false);
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/omni-bridge/inbox/${messageId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        await loadInbox();
        toast({ title: 'Sucesso', description: 'Mensagem marcada como lida' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao marcar como lida', variant: 'destructive' });
    }
  };

  const archiveMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/omni-bridge/inbox/${messageId}/archive`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        await loadInbox();
        toast({ title: 'Sucesso', description: 'Mensagem arquivada' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao arquivar mensagem', variant: 'destructive' });
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'telegram': return <Send className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      case 'error': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = !searchQuery || 
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.fromAddress.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || message.channelType === channelFilter;
    
    return matchesSearch && matchesStatus && matchesChannel;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OmniBridge</h1>
          <p className="text-muted-foreground">Central unificada de comunicação multicanal</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={syncChannels} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar Canais
          </Button>
          <Button onClick={processMessages} disabled={loading}>
            <Zap className="h-4 w-4 mr-2" />
            Processar Mensagens
          </Button>
        </div>
      </div>

      {monitoring && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Status do Sistema</p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${monitoring.systemStatus === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <p className="font-semibold">{monitoring.systemStatus === 'healthy' ? 'Saudável' : 'Degradado'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Canais Conectados</p>
                  <p className="font-semibold">{monitoring.connectedChannels}/{monitoring.totalChannels}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Inbox className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Mensagens Não Lidas</p>
                  <p className="font-semibold">{monitoring.unreadMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Última Sincronização</p>
                  <p className="font-semibold text-xs">
                    {new Date(monitoring.lastSync).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">📧 Canais</TabsTrigger>
          <TabsTrigger value="inbox">📥 Inbox Unificado</TabsTrigger>
          <TabsTrigger value="rules">🔄 Regras de Processamento</TabsTrigger>
          <TabsTrigger value="templates">📄 Templates</TabsTrigger>
          <TabsTrigger value="monitoring">📊 Monitoramento</TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Canais de Comunicação</CardTitle>
              <CardDescription>
                Gerencie e monitore todos os canais de comunicação configurados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channels.map(channel => (
                  <Card key={channel.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getChannelIcon(channel.type)}
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(channel.isConnected ? 'connected' : 'disconnected')}`} />
                          <Badge variant={channel.isActive ? 'default' : 'secondary'} className="text-xs">
                            {channel.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className={`font-medium ${channel.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                            {channel.isConnected ? 'Conectado' : 'Desconectado'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mensagens:</span>
                          <span className="font-medium">{channel.messageCount}</span>
                        </div>
                        {channel.errorCount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Erros:</span>
                            <span className="font-medium text-red-600">{channel.errorCount}</span>
                          </div>
                        )}
                        {channel.lastSync && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Última Sync:</span>
                            <span className="font-medium text-xs">
                              {new Date(channel.lastSync).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {channel.lastError && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                          {channel.lastError}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inbox">
          <Card>
            <CardHeader>
              <CardTitle>Inbox Unificado</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as mensagens de todos os canais em um local centralizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar mensagens..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="unread">Não lidas</SelectItem>
                    <SelectItem value="read">Lidas</SelectItem>
                    <SelectItem value="archived">Arquivadas</SelectItem>
                    <SelectItem value="processed">Processadas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os canais</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {filteredMessages.map(message => (
                  <Card 
                    key={message.id} 
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${message.status === 'unread' ? 'border-l-4 border-l-blue-500' : ''}`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            {getChannelIcon(message.channelType)}
                            <span className="font-medium text-sm">{message.fromName || message.fromAddress}</span>
                            <Badge className={`text-xs ${getPriorityColor(message.priority)}`}>
                              {message.priority}
                            </Badge>
                            {message.hasAttachments && (
                              <Badge variant="outline" className="text-xs">
                                📎 Anexos
                              </Badge>
                            )}
                            {message.ticketId && (
                              <Badge variant="secondary" className="text-xs">
                                Ticket #{message.ticketId.slice(-6)}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium mb-1 truncate">
                            {message.subject || 'Sem assunto'}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {message.content}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.receivedAt).toLocaleString()}
                          </span>
                          <div className="flex space-x-1">
                            {message.status === 'unread' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(message.id);
                                }}
                              >
                                <CheckCheck className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveMessage(message.id);
                              }}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredMessages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma mensagem encontrada com os filtros aplicados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Processamento Automático</CardTitle>
              <CardDescription>
                Configure regras para processamento automático de mensagens recebidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sistema de regras de processamento em desenvolvimento</p>
                <p className="text-sm mt-2">
                  Em breve: criação de regras baseadas em palavras-chave, ações automáticas, 
                  detecção de urgência e prevenção de duplicatas
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates e Respostas</CardTitle>
              <CardDescription>
                Gerencie templates de resposta para diferentes canais e situações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sistema de templates em desenvolvimento</p>
                <p className="text-sm mt-2">
                  Em breve: templates com variáveis dinâmicas, respostas automáticas 
                  configuráveis e suporte multilíngue
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Monitoramento em Tempo Real</CardTitle>
              <CardDescription>
                Monitore a performance e saúde do sistema de comunicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monitoring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Status dos Canais</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total de Canais:</span>
                          <span className="font-semibold">{monitoring.totalChannels}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Canais Ativos:</span>
                          <span className="font-semibold text-green-600">{monitoring.activeChannels}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Canais Conectados:</span>
                          <span className="font-semibold text-blue-600">{monitoring.connectedChannels}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Canais Saudáveis:</span>
                          <span className="font-semibold text-green-600">{monitoring.healthyChannels}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Mensagens por Canal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(monitoring.messagesByChannel).map(([channel, count]) => (
                          <div key={channel} className="flex justify-between">
                            <div className="flex items-center space-x-2">
                              {getChannelIcon(channel)}
                              <span className="capitalize">{channel}</span>
                            </div>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  {getChannelIcon(selectedMessage.channelType)}
                  <span>{selectedMessage.subject || 'Sem assunto'}</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>De: {selectedMessage.fromName || selectedMessage.fromAddress}</span>
                <Badge className={getPriorityColor(selectedMessage.priority)}>
                  {selectedMessage.priority}
                </Badge>
                {selectedMessage.ticketId && (
                  <Badge variant="secondary">
                    Ticket #{selectedMessage.ticketId.slice(-6)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Recebido em: {new Date(selectedMessage.receivedAt).toLocaleString()}
                </div>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap">{selectedMessage.content}</div>
                </div>
                {selectedMessage.hasAttachments && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">📎 Esta mensagem contém anexos</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
