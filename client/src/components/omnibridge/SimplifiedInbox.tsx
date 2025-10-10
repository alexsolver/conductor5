import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import AutomationRuleBuilder from './AutomationRuleBuilder';
import {
  MessageSquare,
  Mail,
  Phone,
  Bot,
  Zap,
  Settings,
  Search,
  Filter,
  Plus,
  Reply,
  Forward,
  Archive,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Calendar,
  Bell,
  Target,
  Lightbulb,
  Brain,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Download,
  Play,
  BarChart3,
  Activity,
  Globe,
  X
} from 'lucide-react';

interface SimplifiedInboxProps {
  onCreateRule?: (messageData?: any) => void;
}

// Componente para exibir detalhes da mensagem em um modal
const MessageDetailsModal = ({ message, isOpen, onClose, onReply, onArchive }: any) => {
  if (!message) return null;

  const ChannelIcon = ({ channelType }: { channelType: string }) => {
    switch (channelType) {
      case 'email':
      case 'imap-email':
        return <Mail className="h-5 w-5" />;
      case 'whatsapp':
      case 'telegram':
        return <MessageSquare className="h-5 w-5" />;
      case 'sms':
        return <Phone className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-blue-500';
      case 'read': return 'bg-gray-400';
      case 'replied': return 'bg-green-500';
      case 'archived': return 'bg-gray-300';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
              <ChannelIcon channelType={message.channelType} />
            </div>
            <div className={`w-3 h-3 rounded-full ${getStatusColor(message.status)}`}></div>
            <DialogTitle className="flex-1">{message.subject || 'Sem Assunto'}</DialogTitle>
            <Badge variant="outline" className="ml-auto">
              {message.channelType}
            </Badge>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[calc(85vh_-_180px)] pr-4">
          {/* Informações do remetente/destinatário */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">De:</span>
                <p className="text-gray-600 dark:text-gray-400">{message.from}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Para:</span>
                <p className="text-gray-600 dark:text-gray-400">{message.to}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Status:</span>
                <p className="text-gray-600 dark:text-gray-400 capitalize">{message.status}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Prioridade:</span>
                <p className="text-gray-600 dark:text-gray-400 capitalize">{message.priority || 'normal'}</p>
              </div>
            </div>
          </div>

          {/* Conteúdo da mensagem */}
          <div className={`p-4 border-l-4 ${getPriorityColor(message.priority)} rounded-md mb-4 bg-white dark:bg-gray-800`}>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{message.content}</p>
          </div>

          {/* Informações adicionais */}
          <div className="space-y-3">
            <div className="text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Recebido em:</span>
              <p className="text-gray-600 dark:text-gray-400">{new Date(message.receivedAt).toLocaleString('pt-BR')}</p>
            </div>

            {message.sentAt && (
              <div className="text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Enviado em:</span>
                <p className="text-gray-600 dark:text-gray-400">{new Date(message.sentAt).toLocaleString('pt-BR')}</p>
              </div>
            )}

            {message.tags && message.tags.length > 0 && (
              <div className="text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Tags:</span>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {message.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {message.messageType && (
              <div className="text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Tipo de Mensagem:</span>
                <p className="text-gray-600 dark:text-gray-400 capitalize">{message.messageType}</p>
              </div>
            )}

            {message.metadata && Object.keys(message.metadata).length > 0 && (
              <div className="text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Metadados:</span>
                <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                  {JSON.stringify(message.metadata, null, 2)}
                </pre>
              </div>
            )}

            {message.id && (
              <div className="text-xs text-gray-500">
                <span className="font-semibold">ID:</span> {message.id}
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={onArchive}>
            <Archive className="h-3 w-3 mr-1" /> Arquivar
          </Button>
          <Button size="sm" onClick={() => onReply(message)}>
            <Reply className="h-3 w-3 mr-1" /> Responder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


export default function SimplifiedInbox({ onCreateRule }: SimplifiedInboxProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all'); // State for channel filtering
  const [showMessageDetails, setShowMessageDetails] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [automationMessageData, setAutomationMessageData] = useState(null);

  // Fetch messages with auto-refresh
  const { data: messagesData, isLoading, refetch, error } = useQuery({
    queryKey: ['omnibridge-messages', user?.tenantId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      console.log(`🔄 [SIMPLIFIED-INBOX] Fetching messages for tenant: ${user?.tenantId}`);

      const response = await fetch('/api/omnibridge/messages', {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.error(`❌ [SIMPLIFIED-INBOX] Failed to fetch messages: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const result = await response.json();
      console.log(`📧 [SIMPLIFIED-INBOX] Received ${result?.messages?.length || 0} messages`);

      if (result?.messages?.length > 0) {
        console.log(`📧 [SIMPLIFIED-INBOX] Sample message:`, {
          id: result.messages[0].id,
          from: result.messages[0].from,
          subject: result.messages[0].subject,
          channelType: result.messages[0].channelType
        });
      }

      return result;
    },
    enabled: !!user?.tenantId,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    staleTime: 1000
  });

  const messages = messagesData?.messages || [];
  const unreadCount = messages.filter((m: any) => m.status === 'unread').length;

  // Group messages by channel
  const messagesByChannel = messages.reduce((acc, message) => {
    const channel = message.channelType || 'other';
    if (!acc[channel]) {
      acc[channel] = [];
    }
    acc[channel].push(message);
    return acc;
  }, {});

  const filteredMessages = messages.filter((message: any) => {
    const matchesSearch = searchTerm ? (message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.subject?.toLowerCase().includes(searchTerm.toLowerCase())) : true;
    const matchesFilter = selectedFilter === 'all' || message.status === selectedFilter;
    const matchesChannel = selectedChannel === 'all' || message.channelType === selectedChannel;
    return matchesSearch && matchesFilter && matchesChannel;
  });

  const handleProcessMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/omnibridge/messages/${messageId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'analyze_and_automate' })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '✅ Mensagem Processada',
          description: data.message || 'Automação executada com sucesso!',
        });
        refetch();
      } else {
        toast({
          title: 'Erro ao processar',
          description: data.message || 'Não foi possível processar a mensagem',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a mensagem',
        variant: 'destructive'
      });
    }
  };

  const handleQuickAction = async (message: any, action: string) => {
    switch (action) {
      case 'create_rule':
        handleCreateAutomation(message);
        break;
      case 'reply':
        await handleReplyMessage(message);
        break;
      case 'archive':
        await handleArchiveMessage(message.id);
        break;
      default:
        break;
    }
  };

  const handleCreateAutomation = (messageData?: any) => {
    setAutomationMessageData(messageData);
    setShowAutomationModal(true);
  };

  const handleReplyMessage = async (message: any) => {
    try {
      const token = localStorage.getItem('token');

      const replyContent = prompt('Digite sua resposta:');
      if (!replyContent?.trim()) {
        return;
      }

      const response = await fetch('/api/omnibridge/messages/reply', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          messageId: message.id,
          content: replyContent
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: 'Resposta enviada',
            description: `Mensagem respondida com sucesso para ${message.from}`
          });
          refetch();
        } else {
          throw new Error(result.message || 'Falha ao enviar resposta');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ [SIMPLIFIED-INBOX] Error replying to message:', error);
      toast({
        title: 'Erro',
        description: `Falha ao enviar resposta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive'
      });
    }
  };

  const handleArchiveMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/omnibridge/messages/${messageId}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: 'Arquivado',
            description: 'Mensagem arquivada com sucesso'
          });
          refetch();
        } else {
          throw new Error(result.message || 'Falha ao arquivar mensagem');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ [SIMPLIFIED-INBOX] Error archiving message:', error);
      toast({
        title: 'Erro',
        description: `Falha ao arquivar mensagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive'
      });
    }
  };

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'email': return Mail;
      case 'imap-email': return Mail; // IMAP emails use Mail icon
      case 'whatsapp': return MessageSquare;
      case 'telegram': return MessageSquare;
      case 'sms': return Phone;
      default: return MessageSquare;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-blue-500';
      case 'read': return 'bg-gray-400';
      case 'replied': return 'bg-green-500';
      case 'archived': return 'bg-gray-300';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with stats and search */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Inbox Unificado</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} não lidas
              </Badge>
            )}
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar mensagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">Não lidas</TabsTrigger>
              <TabsTrigger value="replied" className="text-xs">Respondidas</TabsTrigger>
              <TabsTrigger value="archived" className="text-xs">Arquivadas</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={selectedChannel} onValueChange={setSelectedChannel}>
            <TabsList className="grid grid-cols-1">
              <TabsTrigger value="all" className="text-xs">Todos os Canais</TabsTrigger>
              {Object.keys(messagesByChannel).map(channel => (
                <TabsTrigger key={channel} value={channel} className="text-xs capitalize">
                  {channel === 'imap-email' ? 'Email (IMAP)' : channel}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Carregando mensagens...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-medium mb-2 text-red-600">Erro ao carregar mensagens</h3>
            <p className="text-sm text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'Erro desconhecido ao buscar mensagens'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => refetch()}>
                Tentar Novamente
              </Button>
              <Button variant="default" onClick={() => window.location.href = '/tenant-admin/integrations'}>
                Verificar Integrações
              </Button>
            </div>
          </div>
        ) : (
          Object.keys(messagesByChannel).length === 0 && searchTerm === '' && selectedFilter === 'all' && selectedChannel === 'all' ? (
            <div className="p-6 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Nenhuma mensagem encontrada</h3>
              <p className="text-sm text-gray-600 mb-4">
                Não há mensagens no sistema. Configure suas integrações para receber mensagens.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => refetch()}>
                  Atualizar
                </Button>
                <Button variant="default" onClick={() => window.location.href = '/tenant-admin/integrations'}>
                  Configurar Integrações
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {filteredMessages.map((message: any) => {
                const ChannelIcon = getChannelIcon(message.channelType);

                return (
                  <Card
                    key={message.id}
                    className={`transition-all hover:shadow-md cursor-pointer border-l-4 ${getPriorityColor(message.priority)}`}
                    onClick={() => {
                      setSelectedMessage(message);
                      setShowMessageDetails(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Channel icon and status */}
                          <div className="flex flex-col items-center gap-1">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                              <ChannelIcon className="h-4 w-4" />
                            </div>
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(message.status)}`}></div>
                          </div>

                          {/* Message content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{message.from}</h4>
                              <Badge variant="outline" className="text-xs">
                                {message.channelType === 'imap-email' ? 'Email (IMAP)' : message.channelType}
                              </Badge>
                              {message.priority === 'urgent' && (
                                <Badge variant="destructive" className="text-xs">
                                  Urgente
                                </Badge>
                              )}
                            </div>

                            {message.subject && (
                              <p className="text-sm font-medium mb-1 truncate">{message.subject}</p>
                            )}

                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {message.content}
                            </p>

                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(message.receivedAt).toLocaleString('pt-BR')}
                              </span>
                              {message.tags && message.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {message.tags.slice(0, 2).map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProcessMessage(message.id);
                            }}
                            title="Processar Mensagem (disparar automações)"
                            data-testid={`button-process-${message.id}`}
                          >
                            <Bot className="h-3 w-3 text-purple-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction(message, 'reply');
                            }}
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveMessage(message.id);
                            }}
                          >
                            <Archive className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateAutomation(message);
                            }}
                          >
                            <Zap className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Modal de Detalhes da Mensagem */}
      <MessageDetailsModal
        message={selectedMessage}
        isOpen={showMessageDetails}
        onClose={() => {
          setShowMessageDetails(false);
          setSelectedMessage(null);
        }}
        onReply={handleReplyMessage}
        onArchive={handleArchiveMessage}
      />

      {/* Modal de Criação de Regra de Automação */}
      <AutomationRuleBuilder
        isOpen={showAutomationModal}
        onClose={() => {
          setShowAutomationModal(false);
          setAutomationMessageData(null);
        }}
        initialMessage={automationMessageData}
        onSave={(rule) => {
          console.log('Nova regra criada:', rule);
          setShowAutomationModal(false);
          setAutomationMessageData(null);
        }}
      />
    </div>
  );
}