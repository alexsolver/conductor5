import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Settings, 
  Plus, 
  Search, 
  Filter,
  Send,
  Archive,
  Star,
  Reply,
  Forward,
  MoreHorizontal,
  Bot,
  Zap,
  Bell,
  Users,
  Calendar,
  FileText,
  Workflow,
  Target,
  MessageCircle,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Tag,
  Hash,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Channel {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'telegram' | 'sms' | 'chat';
  enabled: boolean;
  icon: any;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'not_configured';
  messageCount: number;
  lastMessage?: string;
  lastActivity?: string;
  features?: string[];
}

interface Message {
  id: string;
  channelId: string;
  channelType: 'email' | 'whatsapp' | 'telegram' | 'sms' | 'chat';
  from: string;
  to: string;
  subject?: string;
  content: string;
  timestamp: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  attachments?: number;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: {
    type: 'new_message' | 'keyword' | 'time' | 'channel';
    conditions: string[];
  };
  actions: {
    type: 'reply' | 'forward' | 'create_ticket' | 'notify' | 'tag';
    parameters: Record<string, any>;
  }[];
  priority: number;
}

interface Template {
  id: string;
  name: string;
  category: 'email' | 'whatsapp' | 'general';
  subject?: string;
  content: string;
  variables: string[];
  usage_count: number;
  created_at: string;
}

interface Chatbot {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  channels: string[];
  workflows: {
    id: string;
    name: string;
    steps: any[];
  }[];
  ai_enabled: boolean;
  fallback_to_human: boolean;
}

// Helper functions for channel mapping
function getChannelType(integrationId: string): 'email' | 'whatsapp' | 'telegram' | 'sms' | 'chat' {
  if (integrationId.includes('email') || integrationId.includes('gmail') || integrationId.includes('outlook') || integrationId.includes('imap')) {
    return 'email';
  }
  if (integrationId.includes('whatsapp')) {
    return 'whatsapp';
  }
  if (integrationId.includes('telegram')) {
    return 'telegram';
  }
  if (integrationId.includes('sms') || integrationId.includes('twilio')) {
    return 'sms';
  }
  return 'chat';
}

function getChannelIcon(integrationId: string) {
  if (integrationId.includes('email') || integrationId.includes('gmail') || integrationId.includes('outlook') || integrationId.includes('imap')) {
    return Mail;
  }
  if (integrationId.includes('whatsapp')) {
    return MessageSquare;
  }
  if (integrationId.includes('telegram')) {
    return MessageCircle;
  }
  if (integrationId.includes('sms') || integrationId.includes('twilio')) {
    return Phone;
  }
  return MessageSquare;
}

export default function OmniBridge() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inbox');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch channels from OmniBridge API which integrates with Workspace Admin
        const token = localStorage.getItem('token');

        if (!token) {
          console.error('❌ [OmniBridge] No authentication token found');
          throw new Error('Authentication token not found');
        }

        console.log('🔍 [OmniBridge] Fetching channels with token:', token?.substring(0, 20) + '...');

        // First try the OmniBridge channels endpoint
        const channelsResponse = await fetch('/api/omnibridge/channels', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Fallback to integrations endpoint if channels endpoint fails
        const integrationsResponse = await fetch('/api/tenant-admin-integration/integrations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const inboxResponse = await fetch('/api/omnibridge/messages', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        let channelsResult = null;
        if (channelsResponse.ok) {
          channelsResult = await channelsResponse.json();
          console.log('🔍 [OmniBridge] Channels API Response:', channelsResult);
        } else {
          console.log('⚠️ [OmniBridge] Channels endpoint failed, trying integrations fallback');
        }

        let integrationsResult = null;
        if (!channelsResult && integrationsResponse.ok) {
          integrationsResult = await integrationsResponse.json();
          console.log('🔍 [OmniBridge] API Response for integrations:', integrationsResult);
        } else if (!channelsResult) {
          console.log('⚠️ [OmniBridge] Failed to fetch integrations, status:', integrationsResponse.status);
          const errorText = await integrationsResponse.text();
          console.log('⚠️ [OmniBridge] Error details:', errorText);
        }

        let messagesResult = null;
        if (inboxResponse.ok) {
          messagesResult = await inboxResponse.json();
          console.log('🔍 [OmniBridge] Messages response:', messagesResult);
        }

        let channelsData: Channel[] = [];
        let messagesData: Message[] = [];

        // Process channels data - prioritize OmniBridge API response
        let communicationChannels: any[] = [];

        if (channelsResult?.success && channelsResult?.data) {
          // Use OmniBridge channels API response
          communicationChannels = channelsResult.data;
          console.log('📡 [OmniBridge] Using channels API - Found', communicationChannels.length, 'channels');
        } else if (integrationsResult?.success && integrationsResult?.data) {
          // Fallback: Process integrations data for communication channels
          const integrations = integrationsResult.data;
          communicationChannels = integrations.filter((integration: any) => {
            const category = integration.category?.toLowerCase() || '';
            return category === 'comunicação' || category === 'communication' || category === 'comunicacao';
          }).map((integration: any) => ({
            id: integration.id,
            name: integration.name,
            type: getChannelType(integration.id),
            enabled: integration.enabled === true || integration.status === 'connected',
            icon: getChannelIcon(integration.id),
            description: integration.description || 'Canal de comunicação',
            status: integration.status || (integration.enabled ? 'connected' : 'disconnected'),
            messageCount: 0,
            lastMessage: integration.status === 'connected' ? 'Ativo' : 'Aguardando configuração',
            lastActivity: integration.status === 'connected' ? 'Recente' : 'Nunca',
            features: integration.features || []
          }));
          console.log('📡 [OmniBridge] Using integrations fallback - Found', communicationChannels.length, 'communication channels');
        } else if (integrationsResult && Array.isArray(integrationsResult)) {
          // Legacy direct array response - filter for communication channels
          communicationChannels = integrationsResult.filter((integration: any) => {
            const category = integration.category?.toLowerCase() || '';
            return category === 'comunicação' || category === 'communication' || category === 'comunicacao';
          }).map((integration: any) => ({
            id: integration.id,
            name: integration.name,
            type: getChannelType(integration.id),
            enabled: integration.enabled === true || integration.status === 'connected',
            icon: getChannelIcon(integration.id),
            description: integration.description || 'Canal de comunicação',
            status: integration.status || (integration.enabled ? 'connected' : 'disconnected'),
            messageCount: 0,
            lastMessage: integration.status === 'connected' ? 'Ativo' : 'Aguardando configuração',
            lastActivity: integration.status === 'connected' : 'Recente' : 'Nunca',
            features: integration.features || []
          }));
          console.log('📡 [OmniBridge] Using direct array format - Found', communicationChannels.length, 'communication channels from', integrationsResult.length, 'total integrations');
        }

        if (communicationChannels.length > 0) {
          channelsData = communicationChannels.map((integration: any) => ({
            id: integration.id,
            name: integration.name,
            type: getChannelType(integration.id),
            enabled: integration.status === 'connected' || integration.enabled === true,
            icon: getChannelIcon(integration.id),
            description: integration.description || 'Canal de comunicação',
            status: integration.status || 'disconnected',
            messageCount: 0,
            lastMessage: integration.status === 'connected' ? 'Configurado' : 'Aguardando configuração',
            lastActivity: integration.status === 'connected' ? 'Ativo' : 'Nunca',
            features: integration.features || []
          }));

          console.log('✅ [OmniBridge] Successfully processed', channelsData.length, 'communication channels');
        } else {
          console.log('⚠️ [OmniBridge] No communication channels found, showing guidance message');
          // Show message to guide user to configure channels in Workspace Admin
          channelsData = [];
        }

        if (messagesResult && Array.isArray(messagesResult)) {
          messagesData = messagesResult;
        } else if (messagesResult?.success && messagesResult?.data) {
          messagesData = messagesResult.data;
        }

        setChannels(channelsData);
        setMessages(messagesData);

        if (messagesData.length === 0) {
          console.log('📪 No inbox messages available');
        }

      } catch (error) {
        console.error('❌ [OmniBridge] Error fetching data:', error);

        // Fallback data
        setChannels([
          {
            id: 'email-imap-default',
            name: 'Email IMAP',
            type: 'email',
            enabled: false,
            icon: Mail,
            description: 'Configure sua conexão de email IMAP no Workspace Admin → Integrações → Comunicação',
            status: 'not_configured',
            messageCount: 0,
            lastMessage: 'Não configurado',
            lastActivity: 'Nunca',
            features: ['Auto-criação de tickets', 'Sincronização de emails']
          },
          {
            id: 'whatsapp-default',
            name: 'WhatsApp Business',
            type: 'whatsapp',
            enabled: false,
            icon: MessageSquare,
            description: 'Configure sua integração WhatsApp no Workspace Admin → Integrações → Comunicação',
            status: 'not_configured',
            messageCount: 0,
            lastMessage: 'Não configurado',
            lastActivity: 'Nunca',
            features: ['Mensagens automáticas', 'Templates WhatsApp']
          },
          {
            id: 'telegram-default',
            name: 'Telegram Bot',
            type: 'telegram',
            enabled: false,
            icon: MessageCircle,
            description: 'Configure seu bot Telegram no Workspace Admin → Integrações → Comunicação',
            status: 'not_configured',
            messageCount: 0,
            lastMessage: 'Não configurado',
            lastActivity: 'Nunca',
            features: ['Bot automatizado', 'Notificações']
          }
        ]);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChannelToggle = async (channelId: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenant-admin-integration/integrations/${channelId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        setChannels(prev => prev.map(channel => 
          channel.id === channelId 
            ? { 
                ...channel, 
                enabled, 
                status: enabled ? 'connected' : 'disconnected',
                lastMessage: enabled ? 'Ativo' : 'Desativado',
                lastActivity: enabled ? 'Agora' : 'Desabilitado'
              }
            : channel
        ));
        console.log(`✅ Canal ${channelId} ${enabled ? 'ativado' : 'desativado'} com sucesso`);
      } else {
        console.error('Erro ao alterar status do canal:', response.status);
      }
    } catch (error) {
      console.error('Error toggling channel:', error);
    }
  };

  const handleSendMessage = async (content: string, channelId: string, recipient: string) => {
    try {
      const response = await fetch('/api/omnibridge/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelId,
          recipient,
          content
        })
      });

      if (response.ok) {
        // Refresh messages
        const messagesResponse = await fetch('/api/omnibridge/messages', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (messagesResponse.ok) {
          const result = await messagesResponse.json();
          let messagesData = [];
          if (result && Array.isArray(result)) {
            messagesData = result;
          } else if (result?.success && result?.data) {
            messagesData = result.data;
          }
          setMessages(messagesData);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (message.subject && message.subject.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
    const matchesChannel = filterChannel === 'all' || message.channelType === filterChannel;

    return matchesSearch && matchesStatus && matchesChannel;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800 border-green-200';
      case 'disconnected': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'not_configured': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando OmniBridge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OmniBridge</h1>
          <p className="text-muted-foreground">
            Central de comunicação unificada - Email, WhatsApp, Telegram e mais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Canais
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automação
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="chatbots" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Chatbots
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar mensagens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
                <SelectItem value="replied">Respondidas</SelectItem>
                <SelectItem value="archived">Arquivadas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="w-40">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Mensagens ({filteredMessages.length})</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {filteredMessages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma mensagem encontrada</p>
                        <p className="text-sm">Configure seus canais para começar a receber mensagens</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                              selectedMessage?.id === message.id ? 'border-primary bg-primary/5' : ''
                            } ${message.status === 'unread' ? 'border-l-4 border-l-primary' : ''}`}
                            onClick={() => setSelectedMessage(message)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  {message.channelType === 'email' && <Mail className="h-4 w-4" />}
                                  {message.channelType === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
                                  {message.channelType === 'telegram' && <MessageCircle className="h-4 w-4" />}
                                  {message.channelType === 'sms' && <Phone className="h-4 w-4" />}
                                  <span className="font-medium">{message.from}</span>
                                </div>
                                <Badge variant="secondary" className={getPriorityColor(message.priority)}>
                                  {message.priority}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{message.timestamp}</span>
                                {message.attachments && message.attachments > 0 && (
                                  <Badge variant="outline">{message.attachments} anexos</Badge>
                                )}
                              </div>
                            </div>
                            {message.subject && (
                              <h4 className="font-medium mb-1">{message.subject}</h4>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {message.content}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1">
                                {message.tags?.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <Badge 
                                variant="outline"
                                className={
                                  message.status === 'unread' ? 'border-primary text-primary' :
                                  message.status === 'replied' ? 'border-green-500 text-green-700' :
                                  'border-gray-300 text-gray-600'
                                }
                              >
                                {message.status === 'unread' && <AlertCircle className="h-3 w-3 mr-1" />}
                                {message.status === 'read' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {message.status === 'replied' && <Reply className="h-3 w-3 mr-1" />}
                                {message.status === 'archived' && <Archive className="h-3 w-3 mr-1" />}
                                {message.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes da Mensagem</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedMessage ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {selectedMessage.channelType === 'email' && <Mail className="h-4 w-4" />}
                          {selectedMessage.channelType === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
                          {selectedMessage.channelType === 'telegram' && <MessageCircle className="h-4 w-4" />}
                          <span className="font-medium">{selectedMessage.from}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      {selectedMessage.subject && (
                        <div>
                          <Label className="text-sm font-medium">Assunto</Label>
                          <p className="text-sm mt-1">{selectedMessage.subject}</p>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium">Conteúdo</Label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{selectedMessage.content}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getPriorityColor(selectedMessage.priority)}>
                          {selectedMessage.priority}
                        </Badge>
                        <Badge variant="outline">
                          {selectedMessage.status}
                        </Badge>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Button className="w-full" size="sm">
                          <Reply className="h-4 w-4 mr-2" />
                          Responder
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Forward className="h-4 w-4 mr-2" />
                            Encaminhar
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Archive className="h-4 w-4 mr-2" />
                            Arquivar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecione uma mensagem para ver os detalhes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Canais de Comunicação</CardTitle>
              <CardDescription>
                Configure e gerencie seus canais de comunicação. 
                <strong>Configuração:</strong> Workspace Admin → Integrações → Comunicação.
                <br />
                <em>Aqui você apenas ativa/desativa canais já configurados.</em>
              </CardDescription>
            </CardHeader>
            <CardContent>
                  {channels.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {channels.map((channel) => (
                        <Card key={channel.id} className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${
                                channel.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                              }`}>
                                <channel.icon className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{channel.name}</h3>
                                <p className="text-sm text-gray-500">{channel.type}</p>
                              </div>
                            </div>
                            <Switch
                              checked={channel.enabled}
                              onCheckedChange={(checked) => handleChannelToggle(channel.id, checked)}
                            />
                          </div>
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">{channel.description}</p>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Status:</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                channel.status === 'connected' 
                                  ? 'bg-green-100 text-green-800'
                                  : channel.status === 'error'
                                    ? 'bg-red-100 text-red-800'
                                    : channel.status === 'not_configured'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                              }`}>
                                {channel.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-1">
                              <span className="text-gray-500">Mensagens:</span>
                              <span className="font-medium">{channel.messageCount}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Nenhum Canal de Comunicação Configurado
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Para começar a usar o OmniBridge, você precisa configurar canais de comunicação no Workspace Admin.
                        </p>
                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                          <p className="text-sm text-blue-800">
                            <strong>Como configurar:</strong><br />
                            1. Vá para <strong>Workspace Admin</strong><br />
                            2. Acesse <strong>Integrações</strong><br />
                            3. Clique na aba <strong>Comunicação</strong><br />
                            4. Configure seus canais (Email, WhatsApp, Telegram, etc.)
                          </p>
                        </div>
                        <Button 
                          onClick={() => window.location.href = '/tenant-admin/integrations'}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar Integrações
                        </Button>
                      </div>
                    </Card>
                  )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Regras de Automação</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </CardTitle>
              <CardDescription>
                Configure regras automáticas para processar mensagens, criar tickets, enviar notificações e mais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma regra de automação configurada</p>
                <p className="text-sm">Crie sua primeira regra para automatizar o atendimento</p>
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Regra
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Templates de Resposta</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </CardTitle>
              <CardDescription>
                Crie e gerencie templates para respostas rápidas em diferentes canais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum template configurado</p>
                <p className="text-sm">Crie templates para agilizar suas respostas</p>
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chatbots Tab */}
        <TabsContent value="chatbots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Chatbots e Agentes de IA</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Chatbot
                </Button>
              </CardTitle>
              <CardDescription>
                Configure chatbots com workflows customizáveis e recursos de IA para atendimento automatizado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum chatbot configurado</p>
                <p className="text-sm">Configure chatbots para automatizar o primeiro atendimento</p>
                <div className="mt-4 space-y-2">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Chatbot Simples
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    Recursos de IA serão adicionados em atualizações futuras
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}