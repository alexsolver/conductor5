import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Bot, User, Send, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}

interface ConversationLog {
  level: string;
  category: string;
  message: string;
  timestamp: Date;
}

interface ProcessMessageResult {
  conversationId: string;
  agentResponse: string;
  status: string;
  nextStep: string;
  actionExecuted?: {
    actionType: string;
    result: any;
  };
}

interface ConversationDetails {
  conversation: any;
  messages: any[];
  logs: ConversationLog[];
  executions: any[];
}

interface Agent {
  id: string;
  name: string;
}

export default function AIChat() {
  const { toast } = useToast();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ConversationLog[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch AI agents
  const { data: agents = [], isLoading: loadingAgents } = useQuery<Agent[]>({
    queryKey: ['/api/ai-agents'],
  });

  // Send message mutation
  const sendMessageMutation = useMutation<ProcessMessageResult, Error, { agentId: string; message: string }>({
    mutationFn: async (data: { agentId: string; message: string }) => {
      const response = await apiRequest('POST', '/api/ai/chat', data);
      return await response.json();
    },
    onSuccess: (data) => {
      // Add agent response to messages
      setMessages(prev => [...prev, {
        role: 'agent',
        content: data.agentResponse,
        timestamp: new Date()
      }]);

      // Update conversation ID
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        loadConversationDetails(data.conversationId);
      }
    },
    onError: () => {
      toast({ title: 'Erro ao enviar mensagem', variant: 'destructive' });
    }
  });

  // Load conversation details (messages and logs)
  const loadConversationDetails = async (convId: string) => {
    try {
      const response = await apiRequest('GET', `/api/ai/conversations/${convId}`);
      const data: ConversationDetails = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error loading conversation details:', error);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !selectedAgentId) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to API
    sendMessageMutation.mutate({
      agentId: selectedAgentId,
      message: input
    });

    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getStatusIcon = (level: string) => {
    switch (level) {
      case 'error':
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loadingAgents) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Chat Area */}
        <div className="col-span-8 flex flex-col h-full">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-6 w-6" />
                  Chat com Agente IA
                </CardTitle>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger className="w-[250px]" data-testid="select-chat-agent">
                    <SelectValue placeholder="Selecione um agente" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent: any) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">
                    <Bot className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Selecione um agente e comece a conversar</p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    data-testid={`message-${index}`}
                  >
                    <div className={`flex-shrink-0 ${message.role === 'user' ? 'bg-primary' : 'bg-secondary'} rounded-full p-2`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                      <div
                        className={`inline-block px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {sendMessageMutation.isPending && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 bg-secondary rounded-full p-2">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Processando...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  disabled={!selectedAgentId || sendMessageMutation.isPending}
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={handleSend}
                  disabled={!selectedAgentId || !input.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Logs Sidebar */}
        <div className="col-span-4 flex flex-col h-full">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="text-sm">Logs de Conversação</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  Nenhum log disponível
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className="text-xs p-2 rounded border"
                      data-testid={`log-${index}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(log.level)}
                          <Badge variant="outline" className="text-xs">
                            {log.category}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
