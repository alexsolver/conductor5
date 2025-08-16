
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from 'react-beautiful-dnd';
import {
  Bot,
  Plus,
  Settings,
  Play,
  Pause,
  Trash2,
  MessageSquare,
  ArrowRight,
  Zap,
  Users,
  Brain,
  Phone,
  Edit,
  Copy,
  Download,
  Upload,
  TestTube,
  MoreHorizontal,
  Workflow,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ChatbotWorkflowStep {
  id: string;
  type: 'message' | 'condition' | 'action' | 'ai_agent' | 'human_handoff' | 'input' | 'api_call';
  title: string;
  config: {
    message?: string;
    condition?: {
      field: string;
      operator: string;
      value: string;
    };
    action?: string;
    aiPrompt?: string;
    inputType?: string;
    apiEndpoint?: string;
    nextStep?: string;
    branches?: { condition: string; nextStep: string }[];
  };
  position: { x: number; y: number };
  status: 'draft' | 'active' | 'testing' | 'error';
}

interface Chatbot {
  id: string;
  name: string;
  description?: string;
  channels: string[];
  workflow: ChatbotWorkflowStep[];
  isActive: boolean;
  aiConfig?: {
    model: string;
    instructions: string;
    temperature: number;
    maxTokens: number;
  };
  fallbackToHuman: boolean;
  conversationCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

const stepTypes = [
  {
    type: 'message',
    icon: MessageSquare,
    title: 'Mensagem',
    description: 'Enviar uma mensagem para o usuário',
    color: 'bg-blue-100 border-blue-300'
  },
  {
    type: 'input',
    icon: Edit,
    title: 'Entrada do Usuário',
    description: 'Aguardar entrada do usuário',
    color: 'bg-green-100 border-green-300'
  },
  {
    type: 'condition',
    icon: GitBranch,
    title: 'Condição',
    description: 'Tomada de decisão baseada em condições',
    color: 'bg-yellow-100 border-yellow-300'
  },
  {
    type: 'ai_agent',
    icon: Brain,
    title: 'IA Agent',
    description: 'Processamento com inteligência artificial',
    color: 'bg-purple-100 border-purple-300'
  },
  {
    type: 'action',
    icon: Zap,
    title: 'Ação',
    description: 'Executar uma ação específica',
    color: 'bg-orange-100 border-orange-300'
  },
  {
    type: 'human_handoff',
    icon: Users,
    title: 'Transferir para Humano',
    description: 'Transferir conversa para atendente',
    color: 'bg-red-100 border-red-300'
  },
  {
    type: 'api_call',
    icon: TestTube,
    title: 'Chamada de API',
    description: 'Integração com sistemas externos',
    color: 'bg-gray-100 border-gray-300'
  }
];

const kanbanColumns = [
  {
    id: 'design',
    title: 'Design',
    description: 'Construção do fluxo',
    color: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'testing',
    title: 'Teste',
    description: 'Validação e testes',
    color: 'bg-yellow-50 border-yellow-200'
  },
  {
    id: 'active',
    title: 'Ativo',
    description: 'Em produção',
    color: 'bg-green-50 border-green-200'
  },
  {
    id: 'archived',
    title: 'Arquivado',
    description: 'Chatbots inativos',
    color: 'bg-gray-50 border-gray-200'
  }
];

export default function ChatbotKanban() {
  const { user } = useAuth();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [newChatbotData, setNewChatbotData] = useState({
    name: '',
    description: '',
    channels: [] as string[],
    fallbackToHuman: true
  });

  // Organize chatbots by status for Kanban
  const organizedChatbots = {
    design: chatbots.filter(bot => !bot.isActive && bot.workflow.length === 0),
    testing: chatbots.filter(bot => !bot.isActive && bot.workflow.length > 0),
    active: chatbots.filter(bot => bot.isActive),
    archived: chatbots.filter(bot => !bot.isActive && bot.workflow.length > 0)
  };

  useEffect(() => {
    fetchChatbots();
  }, []);

  const fetchChatbots = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/omnibridge/chatbots', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setChatbots(result.data);
          console.log('✅ [ChatbotKanban] Chatbots loaded:', result.data.length);
        }
      }
    } catch (error) {
      console.error('❌ [ChatbotKanban] Error fetching chatbots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChatbot = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/omnibridge/chatbots', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        },
        body: JSON.stringify({
          ...newChatbotData,
          workflow: []
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setChatbots(prev => [result.data, ...prev]);
          setShowCreateModal(false);
          setNewChatbotData({
            name: '',
            description: '',
            channels: [],
            fallbackToHuman: true
          });
          console.log('✅ [ChatbotKanban] Chatbot created successfully');
        }
      }
    } catch (error) {
      console.error('❌ [ChatbotKanban] Error creating chatbot:', error);
    }
  };

  const handleToggleChatbot = async (chatbotId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/omnibridge/chatbots/${chatbotId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        setChatbots(prev => prev.map(bot =>
          bot.id === chatbotId ? { ...bot, isActive } : bot
        ));
        console.log(`✅ [ChatbotKanban] Chatbot ${isActive ? 'activated' : 'deactivated'}`);
      }
    } catch (error) {
      console.error('❌ [ChatbotKanban] Error toggling chatbot:', error);
    }
  };

  const handleDeleteChatbot = async (chatbotId: string) => {
    if (!confirm('Tem certeza que deseja deletar este chatbot?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/omnibridge/chatbots/${chatbotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        }
      });

      if (response.ok) {
        setChatbots(prev => prev.filter(bot => bot.id !== chatbotId));
        console.log('✅ [ChatbotKanban] Chatbot deleted successfully');
      }
    } catch (error) {
      console.error('❌ [ChatbotKanban] Error deleting chatbot:', error);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    // Handle status change based on column
    const chatbot = chatbots.find(bot => bot.id === draggableId);
    if (!chatbot) return;

    let newStatus = false;
    if (destination.droppableId === 'active') {
      newStatus = true;
    }

    handleToggleChatbot(draggableId, newStatus);
  };

  const getStatusBadge = (bot: Chatbot) => {
    if (bot.isActive) {
      return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
    }
    if (bot.workflow.length > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">Em Teste</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Rascunho</Badge>;
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'telegram': return <MessageCircle className="h-4 w-4" />;
      case 'email': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando chatbots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chatbots</h2>
          <p className="text-muted-foreground">
            Construa e gerencie chatbots inteligentes para automação de atendimento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Chatbot
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kanbanColumns.map((column) => (
            <div key={column.id} className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${column.color}`}>
                <h3 className="font-semibold text-lg">{column.title}</h3>
                <p className="text-sm text-muted-foreground">{column.description}</p>
                <div className="mt-2">
                  <Badge variant="outline">
                    {organizedChatbots[column.id as keyof typeof organizedChatbots].length}
                  </Badge>
                </div>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] space-y-3 p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-muted' : ''
                    }`}
                  >
                    {organizedChatbots[column.id as keyof typeof organizedChatbots].map((bot, index) => (
                      <Draggable key={bot.id} draggableId={bot.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <Card className="cursor-move hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <Bot className="h-5 w-5 text-primary" />
                                    <div>
                                      <CardTitle className="text-sm">{bot.name}</CardTitle>
                                      {bot.description && (
                                        <CardDescription className="text-xs">
                                          {bot.description}
                                        </CardDescription>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedChatbot(bot);
                                        setShowWorkflowBuilder(true);
                                      }}
                                    >
                                      <Settings className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteChatbot(bot.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="space-y-3">
                                  {/* Status */}
                                  <div className="flex items-center justify-between">
                                    {getStatusBadge(bot)}
                                    <Switch
                                      checked={bot.isActive}
                                      onCheckedChange={(checked) => handleToggleChatbot(bot.id, checked)}
                                      size="sm"
                                    />
                                  </div>

                                  {/* Channels */}
                                  <div className="flex flex-wrap gap-1">
                                    {bot.channels.map((channel) => (
                                      <Badge key={channel} variant="outline" className="text-xs">
                                        {getChannelIcon(channel)}
                                        <span className="ml-1">{channel}</span>
                                      </Badge>
                                    ))}
                                  </div>

                                  {/* Stats */}
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="text-center p-2 bg-muted rounded">
                                      <div className="font-medium">{bot.workflow.length}</div>
                                      <div className="text-muted-foreground">Etapas</div>
                                    </div>
                                    <div className="text-center p-2 bg-muted rounded">
                                      <div className="font-medium">{bot.conversationCount}</div>
                                      <div className="text-muted-foreground">Conversas</div>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-1">
                                    <Button variant="outline" size="sm" className="flex-1">
                                      <TestTube className="h-3 w-3 mr-1" />
                                      Testar
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1">
                                      <Copy className="h-3 w-3 mr-1" />
                                      Clonar
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Create Chatbot Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Chatbot</DialogTitle>
            <DialogDescription>
              Configure seu novo chatbot para automatizar atendimentos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bot-name">Nome do Chatbot</Label>
              <Input
                id="bot-name"
                placeholder="Ex: Atendimento Inicial"
                value={newChatbotData.name}
                onChange={(e) => setNewChatbotData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bot-description">Descrição</Label>
              <Textarea
                id="bot-description"
                placeholder="Descreva o propósito deste chatbot..."
                value={newChatbotData.description}
                onChange={(e) => setNewChatbotData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label>Canais de Comunicação</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['whatsapp', 'telegram', 'email', 'chat'].map((channel) => (
                  <div key={channel} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={channel}
                      checked={newChatbotData.channels.includes(channel)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewChatbotData(prev => ({
                            ...prev,
                            channels: [...prev.channels, channel]
                          }));
                        } else {
                          setNewChatbotData(prev => ({
                            ...prev,
                            channels: prev.channels.filter(c => c !== channel)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={channel} className="text-sm capitalize">
                      {channel}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newChatbotData.fallbackToHuman}
                onCheckedChange={(checked) => setNewChatbotData(prev => ({ ...prev, fallbackToHuman: checked }))}
              />
              <Label>Transferir para humano quando necessário</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateChatbot}
                disabled={!newChatbotData.name.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Chatbot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workflow Builder Modal (Placeholder) */}
      <Dialog open={showWorkflowBuilder} onOpenChange={setShowWorkflowBuilder}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Construtor de Fluxo - {selectedChatbot?.name}</DialogTitle>
            <DialogDescription>
              Arraste e solte elementos para construir o fluxo do seu chatbot
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 h-[60vh]">
            {/* Palette */}
            <div className="space-y-2">
              <h4 className="font-medium">Elementos</h4>
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {stepTypes.map((step) => {
                    const Icon = step.icon;
                    return (
                      <Card key={step.type} className={`p-3 cursor-grab hover:shadow-md ${step.color}`}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium text-sm">{step.title}</div>
                            <div className="text-xs text-muted-foreground">{step.description}</div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Canvas */}
            <div className="col-span-3 bg-gray-50 rounded-lg p-4 relative">
              <div className="text-center text-muted-foreground mt-20">
                <Workflow className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Arraste elementos da paleta para começar a construir seu fluxo</p>
                <p className="text-sm mt-2">Funcionalidade completa será implementada na próxima iteração</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
