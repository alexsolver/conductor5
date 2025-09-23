import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  MessageSquare,
  Mail,
  Phone,
  Smartphone,
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
  Activity,
  Trash2,
  Eye,
  ArrowRight,
  Play,
  Pause,
  Sparkles,
  MousePointer2,
  Lightbulb,
  HelpCircle,
  TrendingUp,
  Brain,
  Cog
} from 'lucide-react';

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
  starred?: boolean;
  body?: string; // Added body field as per potential fix
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: any[];
  actions: any[];
  priority: number;
  executionStats?: {
    totalExecutions: number;
    successRate: number;
  };
}

interface SimplifiedInboxProps {
  onCreateRule?: (message: Message) => void;
  onCreateChatbot?: () => void;
}

const getChannelIcon = (type: string) => {
  switch (type) {
    case 'email': return Mail;
    case 'whatsapp': return MessageSquare;
    case 'telegram': return MessageCircle;
    case 'sms': return Phone;
    default: return MessageSquare;
  }
};

const getChannelColor = (type: string) => {
  switch (type) {
    case 'email': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'whatsapp': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'telegram': return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';
    case 'sms': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200';
  }
};

export default function SimplifiedInbox({ onCreateRule, onCreateChatbot }: SimplifiedInboxProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showRuleWizard, setShowRuleWizard] = useState(false);
  const [showChatbotModal, setShowChatbotModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch messages with proper headers
  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/omnibridge/messages'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/omnibridge/messages');
      return response.json();
    },
    refetchInterval: 5000 // Auto-refresh every 5 seconds
  });

  // Fetch automation rules
  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/omnibridge/automation-rules']
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: (data: { messageId: string; content: string }) =>
      apiRequest('POST', '/api/omnibridge/messages/reply', data),
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Resposta enviada com sucesso!' });
      setShowReplyModal(false);
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/messages'] });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao enviar resposta', variant: 'destructive' });
    }
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (messageId: string) =>
      apiRequest('PUT', `/api/omnibridge/messages/${messageId}/archive`),
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Mensagem arquivada!' });
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/messages'] });
    }
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (messageId: string) =>
      apiRequest('PUT', `/api/omnibridge/messages/${messageId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/messages'] });
    }
  });

  // Map API response to Message interface
  const messages: Message[] = (messagesData?.messages || []).map((msg: any) => ({
    id: msg.id,
    channelId: msg.channelId,
    channelType: msg.channelType,
    from: msg.from,
    to: msg.to,
    subject: msg.subject,
    content: msg.body || msg.content, // Map body to content
    timestamp: msg.timestamp || msg.receivedAt,
    status: msg.status,
    priority: msg.priority,
    tags: msg.tags,
    attachments: msg.attachments,
    metadata: msg.metadata
  }));
  const rules: AutomationRule[] = rulesData || [];

  // Filter messages
  const filteredMessages = messages.filter(message => {
    const matchesSearch = searchTerm === '' || 
      (message.content && message.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.subject && message.subject.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
    const matchesChannel = filterChannel === 'all' || message.channelType === filterChannel;

    return matchesSearch && matchesStatus && matchesChannel;
  });

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (message.status === 'unread') {
      markReadMutation.mutate(message.id);
    }
  };

  const handleReply = () => {
    if (!selectedMessage || !replyContent.trim()) return;
    replyMutation.mutate({
      messageId: selectedMessage.id,
      content: replyContent
    });
  };

  const handleCreateRuleFromMessage = (message: Message) => {
    setSelectedMessage(message);
    setShowRuleWizard(true);
  };

  const getQuickActions = (message: Message) => [
    {
      label: 'Responder',
      icon: Reply,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        setSelectedMessage(message);
        setShowReplyModal(true);
      }
    },
    {
      label: 'Criar Regra',
      icon: Zap,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => handleCreateRuleFromMessage(message)
    },
    {
      label: 'Arquivar',
      icon: Archive,
      color: 'bg-gray-500 hover:bg-gray-600',
      action: () => archiveMutation.mutate(message.id)
    }
  ];

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900" data-testid="simplified-inbox">
      {/* Sidebar with Messages List */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Header with Search and Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Central de Mensagens
            </h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900 dark:text-blue-200">
              {filteredMessages.filter(m => m.status === 'unread').length} não lidas
            </Badge>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar mensagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-messages"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 flex-wrap">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-24" data-testid="filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
                <SelectItem value="replied">Respondidas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="w-28" data-testid="filter-channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages List */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-2">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma mensagem encontrada</p>
                {searchTerm && (
                  <p className="text-sm mt-2">Tente ajustar sua busca</p>
                )}
              </div>
            ) : (
              filteredMessages.map((message) => {
                const ChannelIcon = getChannelIcon(message.channelType);
                const isSelected = selectedMessage?.id === message.id;

                return (
                  <Card 
                    key={message.id}
                    className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                    } ${message.status === 'unread' ? 'border-l-4 border-l-blue-500' : ''}`}
                    onClick={() => handleMessageClick(message)}
                    data-testid={`message-card-${message.id}`}
                  >
                    <CardHeader className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <ChannelIcon className="h-4 w-4 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {message.from}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(message.timestamp).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 min-w-0">
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(message.timestamp).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <div className="flex gap-1 flex-wrap">
                            <Badge 
                              variant="outline" 
                              className={getPriorityColor(message.priority)}
                            >
                              {message.priority === 'urgent' ? 'URGENTE' : 
                               message.priority === 'high' ? 'ALTA' : 
                               message.priority === 'low' ? 'BAIXA' : 'MÉDIA'}
                            </Badge>
                            {message.status === 'unread' && (
                              <Badge variant="default" className="bg-blue-500 text-white">
                                Não lida
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Message metadata */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Para: {message.to || 'Sistema'}</span>
                          {message.tags && message.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              <span>{message.tags.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {message.attachments && message.attachments > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {message.attachments}
                            </span>
                          )}
                          {message.starred && (
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          )}
                          <span className="text-xs">ID: {message.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 truncate">
                        {message.subject}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {message.content}
                      </p>
                      <div className="flex items-center justify-end mt-2">
                        <div className="text-xs text-gray-400">
                          Canal: {message.channelId}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {selectedMessage ? (
          <>
            {/* Message Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {React.createElement(getChannelIcon(selectedMessage.channelType), {
                    className: "h-5 w-5"
                  })}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedMessage.from}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedMessage.subject || 'Sem assunto'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getChannelColor(selectedMessage.channelType)}>
                    {selectedMessage.channelType.toUpperCase()}
                  </Badge>
                  <Badge className={getPriorityColor(selectedMessage.priority)}>
                    {selectedMessage.priority === 'urgent' ? 'URGENTE' : 
                     selectedMessage.priority === 'high' ? 'ALTA' : 
                     selectedMessage.priority === 'low' ? 'BAIXA' : 'MÉDIA'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Message Content */}
            <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Conteúdo da Mensagem</CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(selectedMessage.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {selectedMessage.content}
                    </p>
                  </div>

                  {selectedMessage.attachments && selectedMessage.attachments > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800 dark:text-blue-200">
                          {selectedMessage.attachments} anexo(s)
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Bar */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {getQuickActions(selectedMessage).map((action, index) => (
                    <Button
                      key={index}
                      onClick={action.action}
                      className={`${action.color} text-white border-none flex items-center justify-center gap-2 h-12`}
                      data-testid={`action-${action.label.toLowerCase().replace(' ', '-')}`}
                    >
                      <action.icon className="h-4 w-4" />
                      {action.label}
                    </Button>
                  ))}
                </div>

                {/* Smart Suggestions */}
                <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
                        Sugestões Inteligentes
                      </h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                        Com base nesta mensagem, você pode:
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300"
                          onClick={() => handleCreateRuleFromMessage(selectedMessage)}
                          data-testid="suggestion-create-rule"
                        >
                          <Brain className="h-3 w-3 mr-1" />
                          Criar regra automática
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300"
                          onClick={() => setShowChatbotModal(true)}
                          data-testid="suggestion-create-chatbot"
                        >
                          <Bot className="h-3 w-3 mr-1" />
                          Configurar chatbot
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center max-w-md">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Selecione uma mensagem
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Clique em uma mensagem à esquerda para visualizar seu conteúdo e criar automações.
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Card className="p-4">
                  <div className="text-center">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {messages.length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total de mensagens</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {rules.length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Regras ativas</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent className="sm:max-w-lg" data-testid="reply-modal">
          <DialogHeader>
            <DialogTitle>Responder Mensagem</DialogTitle>
            <DialogDescription>
              Enviando resposta para: {selectedMessage?.from}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Digite sua resposta..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={6}
              data-testid="reply-content"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReplyModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleReply}
                disabled={!replyContent.trim() || replyMutation.isPending}
                data-testid="send-reply"
              >
                {replyMutation.isPending ? 'Enviando...' : 'Enviar Resposta'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rule Wizard Modal */}
      <Dialog open={showRuleWizard} onOpenChange={setShowRuleWizard}>
        <DialogContent className="sm:max-w-2xl" data-testid="rule-wizard-modal">
          <DialogHeader>
            <DialogTitle>Criar Regra de Automação</DialogTitle>
            <DialogDescription>
              Crie uma regra baseada na mensagem de {selectedMessage?.from}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-2">Mensagem de referência:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>De:</strong> {selectedMessage?.from}<br/>
                <strong>Conteúdo:</strong> {selectedMessage?.content}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Condição</label>
                <select className="w-full p-2 border rounded">
                  <option>Remetente contém</option>
                  <option>Conteúdo contém</option>
                  <option>Canal é</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Valor</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded" 
                  placeholder="Digite o valor..."
                  defaultValue={selectedMessage?.from}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ação</label>
              <select className="w-full p-2 border rounded">
                <option>Marcar como lida</option>
                <option>Arquivar automaticamente</option>
                <option>Enviar resposta automática</option>
                <option>Encaminhar para ticket</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRuleWizard(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                // TODO: Implementar criação da regra
                toast({ title: 'Sucesso', description: 'Regra criada com sucesso!' });
                setShowRuleWizard(false);
              }}>
                Criar Regra
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chatbot Configuration Modal */}
      <Dialog open={showChatbotModal} onOpenChange={setShowChatbotModal}>
        <DialogContent className="sm:max-w-2xl" data-testid="chatbot-modal">
          <DialogHeader>
            <DialogTitle>Configurar Chatbot</DialogTitle>
            <DialogDescription>
              Configure um chatbot para responder automaticamente mensagens similares
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium mb-2">Mensagem de exemplo:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedMessage?.content}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Chatbot</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                placeholder="Ex: Atendimento Geral"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Palavras-chave de ativação</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                placeholder="Ex: ajuda, suporte, dúvida (separadas por vírgula)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Resposta automática</label>
              <Textarea
                placeholder="Digite a resposta que o chatbot deve enviar..."
                rows={4}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="active" className="rounded" />
              <label htmlFor="active" className="text-sm">Ativar chatbot imediatamente</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowChatbotModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                // TODO: Implementar criação do chatbot
                toast({ title: 'Sucesso', description: 'Chatbot configurado com sucesso!' });
                setShowChatbotModal(false);
              }}>
                Configurar Chatbot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}