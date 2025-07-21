/**
 * OmniBridge - Central Unificada de Comunicação Multicanal
 * Sistema empresarial para gerenciamento de comunicações omnichannel
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Send, 
  Inbox, 
  Settings, 
  Activity, 
  Archive,
  CheckCircle,
  RefreshCw,
  Workflow,
  FileText,
  PieChart,
  TrendingUp,
  Eye,
  Plus,
  Instagram,
  Loader2,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Globe2
} from 'lucide-react';

// Enterprise Types
interface Channel {
  id: string;
  type: 'email' | 'whatsapp' | 'telegram' | 'sms' | 'instagram' | 'facebook';
  name: string;
  isActive: boolean;
  isConnected: boolean;
  messageCount: number;
  errorCount?: number;
  lastSync?: string;
  health: 'healthy' | 'warning' | 'error';
  status: 'connected' | 'disconnected' | 'error';
  performance?: {
    latency: number;
    uptime: number;
  };
  rateLimiting?: {
    currentUsage: number;
    maxRequests: number;
  };
}

interface Message {
  id: string;
  channelType: string;
  fromName: string;
  fromAddress: string;
  subject?: string;
  content: string;
  receivedAt: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'unread' | 'read' | 'processed' | 'archived';
  hasAttachments?: boolean;
  ticketId?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  autoProcessed?: boolean;
}

interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  actions: Array<{
    type: string;
  }>;
  stats: {
    triggered: number;
    successRate: number;
  };
}

interface Template {
  id: string;
  name: string;
  category: string;
  channel: string[];
  subject?: string;
  content: string;
  usage: number;
  effectiveness: number;
  approved: boolean;
  multilingual?: boolean;
  languages?: string[];
}

interface Monitoring {
  totalChannels: number;
  activeChannels: number;
  connectedChannels: number;
  healthyChannels: number;
  messagesByChannel: Record<string, number>;
  performance?: {
    totalThroughput: number;
    avgResponseTime: number;
    uptimePercentage: number;
    errorRate: number;
  };
}

export default function OmniBridge() {
  const { toast } = useToast();
  
  // State Management
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [monitoring, setMonitoring] = useState<Monitoring | null>(null);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // UI States
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [showChannelConfig, setShowChannelConfig] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  // Initialize with mock data
  useEffect(() => {
    loadChannels();
    loadMessages();
    loadRules();
    loadTemplates();
    loadMonitoring();
  }, []);

  const loadChannels = () => {
    setChannels([
      {
        id: '1',
        type: 'email',
        name: 'Email IMAP',
        isActive: true,
        isConnected: true,
        messageCount: 127,
        errorCount: 2,
        health: 'healthy',
        status: 'connected',
        performance: { latency: 120, uptime: 99.2 },
        rateLimiting: { currentUsage: 45, maxRequests: 100 }
      },
      {
        id: '2',
        type: 'whatsapp',
        name: 'WhatsApp Business',
        isActive: true,
        isConnected: false,
        messageCount: 89,
        health: 'warning',
        status: 'disconnected'
      },
      {
        id: '3',
        type: 'telegram',
        name: 'Telegram Bot',
        isActive: false,
        isConnected: false,
        messageCount: 23,
        health: 'error',
        status: 'error'
      }
    ]);
  };

  const loadMessages = () => {
    setMessages([
      {
        id: '1',
        channelType: 'email',
        fromName: 'João Silva',
        fromAddress: 'joao@empresa.com',
        subject: 'Problema urgente no sistema',
        content: 'Preciso de ajuda com um problema crítico no sistema de vendas...',
        receivedAt: new Date().toISOString(),
        priority: 'urgent',
        status: 'unread',
        hasAttachments: true,
        sentiment: 'negative'
      },
      {
        id: '2',
        channelType: 'whatsapp',
        fromName: 'Maria Santos',
        fromAddress: '+55 11 99999-9999',
        content: 'Olá, gostaria de saber sobre os novos produtos',
        receivedAt: new Date(Date.now() - 3600000).toISOString(),
        priority: 'medium',
        status: 'read',
        sentiment: 'positive'
      }
    ]);
  };

  const loadRules = () => {
    setRules([
      {
        id: '1',
        name: 'Urgência Alta - Email',
        enabled: true,
        priority: 1,
        conditions: [
          { field: 'subject', operator: 'contains', value: 'urgente' }
        ],
        actions: [
          { type: 'create_ticket' },
          { type: 'notify_admin' }
        ],
        stats: { triggered: 45, successRate: 98 }
      }
    ]);
  };

  const loadTemplates = () => {
    setTemplates([
      {
        id: '1',
        name: 'Confirmação Recebimento',
        category: 'Automática',
        channel: ['email', 'whatsapp'],
        subject: 'Recebemos sua mensagem',
        content: 'Olá! Recebemos sua mensagem e entraremos em contato em breve.',
        usage: 234,
        effectiveness: 85,
        approved: true,
        multilingual: true,
        languages: ['pt-BR', 'en-US']
      }
    ]);
  };

  const loadMonitoring = () => {
    setMonitoring({
      totalChannels: 6,
      activeChannels: 4,
      connectedChannels: 3,
      healthyChannels: 2,
      messagesByChannel: {
        email: 127,
        whatsapp: 89,
        telegram: 23,
        sms: 15
      },
      performance: {
        totalThroughput: 450,
        avgResponseTime: 150,
        uptimePercentage: 99.9,
        errorRate: 0.1
      }
    });
  };

  // Helper Functions
  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'telegram': return <Send className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Actions
  const testChannelConnection = async (channelId: string) => {
    setTestingChannel(channelId);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Teste de conexão",
        description: "Canal testado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Falha ao testar conexão do canal",
        variant: "destructive",
      });
    } finally {
      setTestingChannel(null);
    }
  };

  const toggleChannelStatus = (channelId: string, newStatus: boolean) => {
    setChannels(prev => prev.map(channel => 
      channel.id === channelId 
        ? { ...channel, isActive: newStatus }
        : channel
    ));
    toast({
      title: newStatus ? "Canal ativado" : "Canal pausado",
      description: `O canal foi ${newStatus ? 'ativado' : 'pausado'} com sucesso`,
    });
  };

  const markAsRead = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: 'read' } : msg
    ));
  };

  const archiveMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: 'archived' } : msg
    ));
    toast({
      title: "Mensagem arquivada",
      description: "A mensagem foi arquivada com sucesso",
    });
  };

  // Filter messages
  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         message.fromName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || message.channelType === channelFilter;
    const matchesPriority = priorityFilter === 'all' || message.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesChannel && matchesPriority;
  });

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">OmniBridge</h1>
          <p className="text-muted-foreground">Central Unificada de Comunicação Multicanal</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Canal
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{monitoring?.totalChannels || 0}</p>
                <p className="text-xs text-muted-foreground">Canais Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{monitoring?.connectedChannels || 0}</p>
                <p className="text-xs text-muted-foreground">Conectados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Inbox className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{messages.length}</p>
                <p className="text-xs text-muted-foreground">Mensagens</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {monitoring?.performance?.uptimePercentage || 0}%
                </p>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Channels Tab */}
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gerenciamento de Canais
              </CardTitle>
              <CardDescription>
                Configure e monitore todos os canais de comunicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channels.map((channel) => (
                  <Card key={channel.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(channel.type)}
                          <div>
                            <h3 className="font-medium">{channel.name}</h3>
                            <p className="text-xs text-muted-foreground capitalize">
                              {channel.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant={channel.isActive ? "default" : "secondary"}>
                            {channel.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                          <Badge variant="outline" className={getHealthColor(channel.health)}>
                            {channel.health}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={channel.isConnected ? 'text-green-600' : 'text-red-600'}>
                            {channel.isConnected ? 'Conectado' : 'Desconectado'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mensagens:</span>
                          <span className="font-medium">{channel.messageCount}</span>
                        </div>
                        {channel.performance && (
                          <div className="space-y-1 pt-2 border-t">
                            <div className="flex justify-between text-xs">
                              <span>Latência:</span>
                              <span>{channel.performance.latency}ms</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Uptime:</span>
                              <span>{channel.performance.uptime}%</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testChannelConnection(channel.id)}
                          disabled={testingChannel === channel.id}
                          className="flex-1"
                        >
                          {testingChannel === channel.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Activity className="h-3 w-3 mr-1" />
                          )}
                          Testar
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={channel.isActive ? "secondary" : "default"}
                          onClick={() => toggleChannelStatus(channel.id, !channel.isActive)}
                          className="flex-1"
                        >
                          {channel.isActive ? (
                            <>
                              <PauseCircle className="h-3 w-3 mr-1" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-3 w-3 mr-1" />
                              Ativar
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inbox Tab */}
        <TabsContent value="inbox">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Inbox Unificado
              </CardTitle>
              <CardDescription>
                Todas as mensagens de todos os canais em uma visão centralizada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted rounded-lg">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Buscar mensagens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="unread">Não Lidas</SelectItem>
                    <SelectItem value="read">Lidas</SelectItem>
                    <SelectItem value="processed">Processadas</SelectItem>
                    <SelectItem value="archived">Arquivadas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Canais</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Prioridades</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Messages List */}
              <div className="space-y-3">
                {filteredMessages.map((message) => (
                  <Card key={message.id} className={`border transition-all hover:shadow-md ${
                    message.status === 'unread' ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex flex-col items-center gap-1">
                            {getChannelIcon(message.channelType)}
                            <Badge variant="outline" className="text-xs">
                              {message.channelType.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {message.fromName || message.fromAddress}
                              </p>
                              {message.ticketId && (
                                <Badge variant="secondary" className="text-xs">
                                  Ticket #{message.ticketId.slice(0, 8)}
                                </Badge>
                              )}
                            </div>
                            
                            {message.subject && (
                              <p className="font-medium text-sm text-gray-900">
                                {message.subject}
                              </p>
                            )}
                            
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {message.content.substring(0, 150)}
                              {message.content.length > 150 && '...'}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{new Date(message.receivedAt).toLocaleString('pt-BR')}</span>
                              {message.sentiment && (
                                <Badge variant="outline" className="text-xs">
                                  {message.sentiment === 'positive' ? '😊 Positivo' : 
                                   message.sentiment === 'negative' ? '😟 Negativo' : '😐 Neutro'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getPriorityColor(message.priority)}>
                            {message.priority.toUpperCase()}
                          </Badge>
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedMessage(message);
                                setShowMessageDialog(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            
                            {message.status === 'unread' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(message.id)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => archiveMessage(message.id)}
                            >
                              <Archive className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredMessages.length === 0 && (
                  <div className="text-center py-12">
                    <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma mensagem encontrada</h3>
                    <p className="text-gray-500">
                      {messages.length === 0 
                        ? 'Aguardando novas mensagens dos canais configurados...' 
                        : 'Tente ajustar os filtros para encontrar as mensagens desejadas.'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs with placeholder content */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Regras de Processamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sistema de regras em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates de Resposta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sistema de templates em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Dashboard de analytics em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}