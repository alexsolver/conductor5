import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, Send, Paperclip, Smile, MoreVertical, 
  Phone, Video, UserPlus, Archive, Ticket, Clock,
  ArrowLeft, Check, CheckCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Chat {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  customerChannel: string;
  status: 'active' | 'closed';
  lastMessageAt: Date;
  unreadCount: number;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'agent';
  content: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
}

interface Participant {
  id: string;
  userId: string;
  userName: string;
  userType: 'customer' | 'agent';
  joinedAt: Date;
}

export default function ChatAgent() {
  const { toast } = useToast();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { data: chats } = useQuery<Chat[]>({
    queryKey: ['/api/chat/agents/chats'],
    refetchInterval: 3000,
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ['/api/chat/conversations', selectedChatId, 'messages'],
    enabled: !!selectedChatId,
    refetchInterval: 2000,
  });

  const { data: participants } = useQuery<Participant[]>({
    queryKey: ['/api/chat/conversations', selectedChatId, 'participants'],
    enabled: !!selectedChatId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest(`/api/chat/conversations/${selectedChatId}/messages`, 'POST', { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedChatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/agents/chats'] });
      setMessageInput('');
    },
    onError: () => {
      toast({ title: 'Erro ao enviar mensagem', variant: 'destructive' });
    },
  });

  const closeChatMutation = useMutation({
    mutationFn: () => apiRequest(`/api/chat/conversations/${selectedChatId}/close`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/agents/chats'] });
      toast({ title: 'Chat encerrado com sucesso!' });
      setSelectedChatId(null);
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: () => apiRequest(`/api/chat/conversations/${selectedChatId}/ticket`, 'POST'),
    onSuccess: () => {
      toast({ title: 'Ticket criado com sucesso!' });
    },
  });

  const transferChatMutation = useMutation({
    mutationFn: (queueId: string) =>
      apiRequest(`/api/chat/conversations/${selectedChatId}/transfer`, 'POST', { queueId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/agents/chats'] });
      toast({ title: 'Chat transferido com sucesso!' });
      setSelectedChatId(null);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChatId) return;
    sendMessageMutation.mutate(messageInput);
  };

  const handleTyping = () => {
    if (!isTyping && selectedChatId) {
      setIsTyping(true);
      apiRequest(`/api/chat/conversations/${selectedChatId}/typing`, 'POST', { isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (selectedChatId) {
        apiRequest(`/api/chat/conversations/${selectedChatId}/typing`, 'POST', { isTyping: false });
      }
    }, 1000);
  };

  const selectedChat = chats?.find(c => c.id === selectedChatId);

  const getChannelBadge = (channel: string) => {
    const colors: Record<string, string> = {
      whatsapp: 'bg-green-500',
      telegram: 'bg-blue-500',
      email: 'bg-purple-500',
      slack: 'bg-pink-500',
    };
    return colors[channel.toLowerCase()] || 'bg-gray-500';
  };

  const getMessageStatus = (status: string) => {
    if (status === 'read') return <CheckCheck className="h-3 w-3 text-blue-500" />;
    if (status === 'delivered') return <CheckCheck className="h-3 w-3 text-gray-500" />;
    return <Check className="h-3 w-3 text-gray-500" />;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Chat List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Conversas Ativas</h2>
          <p className="text-sm text-muted-foreground">{chats?.length || 0} chat(s)</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {chats?.map((chat) => (
              <Card
                key={chat.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedChatId === chat.id ? 'bg-accent border-primary' : ''
                }`}
                onClick={() => setSelectedChatId(chat.id)}
                data-testid={`chat-item-${chat.id}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{chat.customerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">{chat.customerName}</h3>
                        {chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2" data-testid={`unread-count-${chat.id}`}>
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className={`h-2 w-2 rounded-full ${getChannelBadge(chat.customerChannel)}`} />
                        <span>{chat.customerChannel}</span>
                        <span>•</span>
                        <span>{format(new Date(chat.lastMessageAt), 'HH:mm', { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!chats?.length && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma conversa ativa</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Window */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedChatId(null)}
                className="md:hidden"
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar>
                <AvatarFallback>{selectedChat.customerName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold" data-testid="chat-customer-name">{selectedChat.customerName}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className={`h-2 w-2 rounded-full ${getChannelBadge(selectedChat.customerChannel)}`} />
                  <span>{selectedChat.customerChannel}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" disabled data-testid="button-call">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" disabled data-testid="button-video">
                <Video className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-more">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => createTicketMutation.mutate()} data-testid="menu-create-ticket">
                    <Ticket className="h-4 w-4 mr-2" />
                    Criar Ticket
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-add-participant">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Participante
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-transfer">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Transferir Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => closeChatMutation.mutate()} data-testid="menu-close">
                    <Archive className="h-4 w-4 mr-2" />
                    Encerrar Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages?.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.id}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.senderType === 'agent'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-muted'
                    }`}
                  >
                    {message.senderType === 'customer' && (
                      <p className="text-xs font-semibold mb-1">{message.senderName}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs opacity-70">
                        {format(new Date(message.createdAt), 'HH:mm', { locale: ptBR })}
                      </span>
                      {message.senderType === 'agent' && getMessageStatus(message.status)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex items-end gap-2">
              <Button variant="ghost" size="icon" disabled data-testid="button-attach">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" disabled data-testid="button-emoji">
                <Smile className="h-5 w-5" />
              </Button>
              <Textarea
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Digite sua mensagem..."
                className="min-h-[60px] resize-none"
                data-testid="input-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600"
                data-testid="button-send"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
            <p className="text-muted-foreground">
              Escolha um chat da lista para começar a atender
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
