import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
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
  Lightbulb
} from 'lucide-react';

interface SimplifiedInboxProps {
  onCreateRule?: (messageData?: any) => void;
}

export default function SimplifiedInbox({ onCreateRule }: SimplifiedInboxProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Fetch messages with auto-refresh
  const { data: messagesData, isLoading, refetch } = useQuery({
    queryKey: ['omnibridge-messages', user?.tenantId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
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
        throw new Error('Failed to fetch messages');
      }

      return response.json();
    },
    enabled: !!user?.tenantId,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    staleTime: 1000
  });

  const messages = messagesData?.messages || [];
  const unreadCount = messages.filter((m: any) => m.status === 'unread').length;

  const filteredMessages = messages.filter((message: any) => {
    const matchesSearch = message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.from?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || message.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleQuickAction = async (message: any, action: string) => {
    switch (action) {
      case 'create_rule':
        onCreateRule?.(message);
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

  const handleReplyMessage = async (message: any) => {
    try {
      const token = localStorage.getItem('token');
      
      // For now, we'll show a simple prompt for reply content
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
          // Refresh messages to show updated status
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
          // Refresh messages to update the list
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
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onCreateRule?.()}>
              <Zap className="h-4 w-4 mr-2" />
              Automatizar
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex gap-3">
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
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Carregando mensagens...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Nenhuma mensagem encontrada</h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchTerm 
                ? 'Tente uma busca diferente' 
                : messages.length === 0 
                  ? 'Não há mensagens no sistema. Configure suas integrações para receber mensagens.'
                  : 'Aguardando novas mensagens...'
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => refetch()}>
                Atualizar
              </Button>
              {messages.length === 0 && (
                <Button variant="default" onClick={() => window.location.href = '/tenant-admin/integrations'}>
                  Configurar Integrações
                </Button>
              )}
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
                      <div className="flex gap-1 ml-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAction(message, 'reply');
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Reply className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAction(message, 'create_rule');
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Zap className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAction(message, 'archive');
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Archive className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick automation suggestions */}
      {filteredMessages.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Sugestão de Automação</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCreateRule?.()}
              className="text-xs"
            >
              Criar Regra
            </Button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Automatize respostas para mensagens similares e economize tempo
          </p>
        </div>
      )}
    </div>
  );
}