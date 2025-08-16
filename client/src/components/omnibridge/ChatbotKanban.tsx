
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import {
  Bot,
  Plus,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  MessageSquare,
  Zap,
  GitBranch,
  CheckCircle,
  Clock,
  AlertTriangle,
  Save,
  Eye,
  Code,
  Workflow,
  Target,
  MessageCircle,
  Users,
  BarChart3,
  ArrowRight,
  Copy,
  Upload,
  Download,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'response' | 'integration' | 'delay';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

interface ChatbotWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  version: number;
  isActive: boolean;
  lastModified: string;
  variables: Record<string, any>;
  fallbackActions: WorkflowStep[];
}

interface Chatbot {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  configuration: {
    channels: string[];
    languages: string[];
    timezone: string;
    fallbackToHuman: boolean;
    aiEnabled: boolean;
    maxSessionTime: number;
    greeting: string;
    errorMessage: string;
  };
  workflow: ChatbotWorkflow;
  stage: 'planning' | 'designing' | 'testing' | 'reviewing' | 'deploying' | 'active' | 'maintenance';
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  metrics: {
    totalConversations: number;
    successRate: number;
    avgResponseTime: number;
    userSatisfaction: number;
  };
  testResults?: {
    passedTests: number;
    totalTests: number;
    lastTestRun: string;
    issues: string[];
  };
}

// Workflow construction stages - representing the actual work phases
const workflowStages = [
  {
    id: 'planning',
    title: 'Planejamento',
    description: 'Definição de objetivos e estratégia',
    color: 'bg-blue-50 border-blue-200',
    icon: Target,
    activities: ['Definir objetivos', 'Mapear jornada do usuário', 'Identificar integrações']
  },
  {
    id: 'designing',
    title: 'Construção',
    description: 'Desenvolvimento do fluxo conversacional',
    color: 'bg-purple-50 border-purple-200',
    icon: Workflow,
    activities: ['Criar fluxos', 'Configurar respostas', 'Definir condições']
  },
  {
    id: 'testing',
    title: 'Teste',
    description: 'Validação e refinamento',
    color: 'bg-orange-50 border-orange-200',
    icon: Play,
    activities: ['Executar testes', 'Validar cenários', 'Otimizar performance']
  },
  {
    id: 'reviewing',
    title: 'Revisão',
    description: 'Análise e aprovação',
    color: 'bg-yellow-50 border-yellow-200',
    icon: Eye,
    activities: ['Revisar qualidade', 'Validar compliance', 'Aprovar deploy']
  },
  {
    id: 'deploying',
    title: 'Deploy',
    description: 'Implementação em produção',
    color: 'bg-green-50 border-green-200',
    icon: CheckCircle,
    activities: ['Deploy gradual', 'Monitorar métricas', 'Ajustes finais']
  },
  {
    id: 'active',
    title: 'Ativo',
    description: 'Em operação produtiva',
    color: 'bg-emerald-50 border-emerald-200',
    icon: Bot,
    activities: ['Monitoramento', 'Análise de performance', 'Suporte contínuo']
  },
  {
    id: 'maintenance',
    title: 'Manutenção',
    description: 'Atualizações e melhorias',
    color: 'bg-gray-50 border-gray-200',
    icon: Settings,
    activities: ['Atualizações', 'Correções', 'Melhorias incrementais']
  }
];

const stepTypes = [
  { id: 'trigger', name: 'Gatilho', icon: Zap, description: 'Eventos que iniciam o fluxo' },
  { id: 'condition', name: 'Condição', icon: GitBranch, description: 'Lógica condicional' },
  { id: 'action', name: 'Ação', icon: Play, description: 'Execução de tarefas' },
  { id: 'response', name: 'Resposta', icon: MessageCircle, description: 'Mensagens ao usuário' },
  { id: 'integration', name: 'Integração', icon: Code, description: 'Conexões externas' },
  { id: 'delay', name: 'Aguardar', icon: Clock, description: 'Pausas no fluxo' }
];

export default function ChatbotKanban() {
  const { user } = useAuth();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  
  const [newChatbotData, setNewChatbotData] = useState({
    name: '',
    description: '',
    channels: [] as string[],
    languages: ['pt-BR'],
    fallbackToHuman: true,
    aiEnabled: false,
    greeting: 'Olá! Como posso ajudá-lo hoje?',
    errorMessage: 'Desculpe, não entendi. Pode reformular sua pergunta?'
  });

  const [newWorkflowStep, setNewWorkflowStep] = useState({
    type: 'trigger' as WorkflowStep['type'],
    name: '',
    config: {}
  });

  // Organize chatbots by workflow construction stage
  const organizedChatbots = workflowStages.reduce((acc, stage) => {
    acc[stage.id] = chatbots.filter(bot => bot.stage === stage.id);
    return acc;
  }, {} as Record<string, Chatbot[]>);

  useEffect(() => {
    fetchChatbots();
  }, [user?.tenantId]);

  const fetchChatbots = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'x-tenant-id': user?.tenantId || ''
      };

      const response = await fetch('/api/omnibridge/chatbots', { headers });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setChatbots(result.data);
          console.log('✅ [ChatbotKanban] Chatbots loaded:', result.data.length);
        }
      } else {
        console.warn('⚠️ [ChatbotKanban] Failed to fetch chatbots:', response.status);
        // Mock data for development
        setChatbots([
          {
            id: '1',
            tenantId: user?.tenantId || '',
            name: 'Atendimento Geral',
            description: 'Bot para atendimento inicial e direcionamento',
            configuration: {
              channels: ['whatsapp', 'telegram'],
              languages: ['pt-BR'],
              timezone: 'America/Sao_Paulo',
              fallbackToHuman: true,
              aiEnabled: true,
              maxSessionTime: 3600,
              greeting: 'Olá! Sou o assistente virtual. Como posso ajudá-lo?',
              errorMessage: 'Desculpe, não consegui entender. Pode tentar de outra forma?'
            },
            workflow: {
              id: 'wf1',
              name: 'Fluxo Principal',
              description: 'Fluxo de atendimento principal',
              steps: [],
              version: 1,
              isActive: false,
              lastModified: '2025-01-16T01:00:00Z',
              variables: {},
              fallbackActions: []
            },
            stage: 'designing',
            isEnabled: false,
            createdAt: '2025-01-16T00:00:00Z',
            updatedAt: '2025-01-16T01:00:00Z',
            metrics: {
              totalConversations: 0,
              successRate: 0,
              avgResponseTime: 0,
              userSatisfaction: 0
            }
          },
          {
            id: '2',
            tenantId: user?.tenantId || '',
            name: 'Suporte Técnico',
            description: 'Bot especializado em questões técnicas',
            configuration: {
              channels: ['telegram'],
              languages: ['pt-BR', 'en'],
              timezone: 'America/Sao_Paulo',
              fallbackToHuman: true,
              aiEnabled: true,
              maxSessionTime: 7200,
              greeting: 'Olá! Sou especialista em suporte técnico. Em que posso ajudar?',
              errorMessage: 'Não consegui processar sua solicitação. Vou conectá-lo com um especialista.'
            },
            workflow: {
              id: 'wf2',
              name: 'Fluxo Suporte',
              description: 'Fluxo para suporte técnico',
              steps: [],
              version: 1,
              isActive: false,
              lastModified: '2025-01-16T02:00:00Z',
              variables: {},
              fallbackActions: []
            },
            stage: 'testing',
            isEnabled: false,
            createdAt: '2025-01-16T00:30:00Z',
            updatedAt: '2025-01-16T02:00:00Z',
            metrics: {
              totalConversations: 25,
              successRate: 0.8,
              avgResponseTime: 2.5,
              userSatisfaction: 4.2
            },
            testResults: {
              passedTests: 18,
              totalTests: 25,
              lastTestRun: '2025-01-16T02:00:00Z',
              issues: ['Timeout em integração externa', 'Resposta incorreta no cenário X']
            }
          }
        ]);
      }
    } catch (error) {
      console.error('❌ [ChatbotKanban] Error fetching chatbots:', error);
      setChatbots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChatbot = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'x-tenant-id': user?.tenantId || ''
      };

      const chatbotData = {
        name: newChatbotData.name,
        description: newChatbotData.description,
        configuration: {
          channels: newChatbotData.channels,
          languages: newChatbotData.languages,
          timezone: 'America/Sao_Paulo',
          fallbackToHuman: newChatbotData.fallbackToHuman,
          aiEnabled: newChatbotData.aiEnabled,
          maxSessionTime: 3600,
          greeting: newChatbotData.greeting,
          errorMessage: newChatbotData.errorMessage
        },
        stage: 'planning',
        isEnabled: false
      };

      const response = await fetch('/api/omnibridge/chatbots', {
        method: 'POST',
        headers,
        body: JSON.stringify(chatbotData)
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
            languages: ['pt-BR'],
            fallbackToHuman: true,
            aiEnabled: false,
            greeting: 'Olá! Como posso ajudá-lo hoje?',
            errorMessage: 'Desculpe, não entendi. Pode reformular sua pergunta?'
          });
          console.log('✅ [ChatbotKanban] Chatbot created successfully');
        }
      } else {
        console.error('❌ [ChatbotKanban] Failed to create chatbot:', response.statusText);
      }
    } catch (error) {
      console.error('❌ [ChatbotKanban] Error creating chatbot:', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const chatbotId = draggableId;
    const newStage = destination.droppableId as Chatbot['stage'];

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'x-tenant-id': user?.tenantId || ''
      };

      const response = await fetch(`/api/omnibridge/chatbots/${chatbotId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ stage: newStage })
      });

      if (response.ok) {
        setChatbots(prev => prev.map(bot =>
          bot.id === chatbotId ? { ...bot, stage: newStage } : bot
        ));
        console.log(`✅ [ChatbotKanban] Chatbot ${chatbotId} moved to ${newStage}`);
      }
    } catch (error) {
      console.error('❌ [ChatbotKanban] Error updating chatbot stage:', error);
    }
  };

  const handleToggleChatbot = async (chatbotId: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'x-tenant-id': user?.tenantId || ''
      };

      const response = await fetch(`/api/omnibridge/chatbots/${chatbotId}/toggle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ isEnabled: enabled })
      });

      if (response.ok) {
        setChatbots(prev => prev.map(bot =>
          bot.id === chatbotId ? { ...bot, isEnabled: enabled } : bot
        ));
        console.log(`✅ [ChatbotKanban] Chatbot ${enabled ? 'enabled' : 'disabled'}: ${chatbotId}`);
      }
    } catch (error) {
      console.error('❌ [ChatbotKanban] Error toggling chatbot:', error);
    }
  };

  const getStageStats = (stageId: string) => {
    const botsInStage = organizedChatbots[stageId] || [];
    return {
      total: botsInStage.length,
      active: botsInStage.filter(bot => bot.isEnabled).length,
      withIssues: botsInStage.filter(bot => bot.testResults?.issues?.length).length
    };
  };

  const getStageColor = (stageId: string) => {
    const stage = workflowStages.find(s => s.id === stageId);
    return stage?.color || 'bg-gray-50 border-gray-200';
  };

  const filteredChatbots = chatbots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || bot.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

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
          <h2 className="text-2xl font-bold tracking-tight">Construtor de Chatbots</h2>
          <p className="text-muted-foreground">
            Gerencie o fluxo de desenvolvimento dos seus chatbots conversacionais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Chatbot
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar chatbots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as etapas</SelectItem>
            {workflowStages.map(stage => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchChatbots}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Workflow Stages Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
        {workflowStages.map(stage => {
          const stats = getStageStats(stage.id);
          const IconComponent = stage.icon;
          
          return (
            <Card key={stage.id} className={`cursor-pointer transition-all hover:shadow-md ${getStageColor(stage.id)}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <IconComponent className="h-5 w-5 text-primary" />
                  <Badge variant="secondary">{stats.total}</Badge>
                </div>
                <CardTitle className="text-sm">{stage.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-2">{stage.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  {stats.active > 0 && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {stats.active} ativo{stats.active !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {stats.withIssues > 0 && (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      {stats.withIssues} c/ issues
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {workflowStages.map(stage => {
            const botsInStage = organizedChatbots[stage.id] || [];
            const IconComponent = stage.icon;
            
            return (
              <div key={stage.id} className="space-y-3">
                <div className={`p-3 rounded-lg border ${getStageColor(stage.id)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-primary" />
                      <h3 className="font-medium text-sm">{stage.title}</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {botsInStage.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{stage.description}</p>
                  <div className="space-y-1">
                    {stage.activities.map((activity, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="w-1 h-1 bg-current rounded-full" />
                        {activity}
                      </div>
                    ))}
                  </div>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-colors ${
                        snapshot.isDraggingOver 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 bg-gray-50/30'
                      }`}
                    >
                      {botsInStage.map((bot, index) => (
                        <Draggable key={bot.id} draggableId={bot.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-move transition-all ${
                                snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                              }`}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Bot className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-sm">{bot.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {bot.isEnabled && (
                                      <div className="w-2 h-2 bg-green-500 rounded-full" title="Ativo" />
                                    )}
                                    {bot.testResults?.issues?.length && (
                                      <AlertTriangle className="h-3 w-3 text-orange-500" title="Com issues" />
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedChatbot(bot);
                                        setShowWorkflowBuilder(true);
                                      }}
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                  {bot.description}
                                </p>
                                
                                <div className="space-y-2">
                                  {/* Channels */}
                                  <div className="flex flex-wrap gap-1">
                                    {bot.configuration.channels.map(channel => (
                                      <Badge key={channel} variant="outline" className="text-xs">
                                        {channel}
                                      </Badge>
                                    ))}
                                  </div>

                                  {/* Metrics for active bots */}
                                  {bot.stage === 'active' && bot.metrics.totalConversations > 0 && (
                                    <div className="text-xs space-y-1">
                                      <div className="flex justify-between">
                                        <span>Conversas:</span>
                                        <span className="font-medium">{bot.metrics.totalConversations}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Taxa sucesso:</span>
                                        <span className="font-medium">{(bot.metrics.successRate * 100).toFixed(0)}%</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Test results */}
                                  {bot.testResults && (
                                    <div className="text-xs space-y-1">
                                      <div className="flex justify-between">
                                        <span>Testes:</span>
                                        <span className="font-medium">
                                          {bot.testResults.passedTests}/{bot.testResults.totalTests}
                                        </span>
                                      </div>
                                      {bot.testResults.issues.length > 0 && (
                                        <div className="text-orange-600">
                                          {bot.testResults.issues.length} issue{bot.testResults.issues.length !== 1 ? 's' : ''}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 mt-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-6 text-xs flex-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedChatbot(bot);
                                        setShowWorkflowBuilder(true);
                                      }}
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Editar
                                    </Button>
                                    {bot.stage === 'active' && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-6 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleChatbot(bot.id, !bot.isEnabled);
                                        }}
                                      >
                                        {bot.isEnabled ? (
                                          <Pause className="h-3 w-3" />
                                        ) : (
                                          <Play className="h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Create Chatbot Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Chatbot</DialogTitle>
            <DialogDescription>
              Configure um novo chatbot conversacional para automatizar atendimentos
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="channels">Canais</TabsTrigger>
              <TabsTrigger value="behavior">Comportamento</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="bot-name">Nome do Chatbot</Label>
                <Input
                  id="bot-name"
                  placeholder="Ex: Atendimento Geral"
                  value={newChatbotData.name}
                  onChange={(e) => setNewChatbotData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="bot-description">Descrição</Label>
                <Textarea
                  id="bot-description"
                  placeholder="Descreva o propósito e função do chatbot..."
                  value={newChatbotData.description}
                  onChange={(e) => setNewChatbotData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="channels" className="space-y-4">
              <div>
                <Label>Canais de Atendimento</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['whatsapp', 'telegram', 'web', 'email'].map(channel => (
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
                      <Label htmlFor={channel} className="capitalize">{channel}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4">
              <div>
                <Label htmlFor="greeting">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="greeting"
                  value={newChatbotData.greeting}
                  onChange={(e) => setNewChatbotData(prev => ({ ...prev, greeting: e.target.value }))}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="error-message">Mensagem de Erro</Label>
                <Textarea
                  id="error-message"
                  value={newChatbotData.errorMessage}
                  onChange={(e) => setNewChatbotData(prev => ({ ...prev, errorMessage: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="fallback-human"
                  checked={newChatbotData.fallbackToHuman}
                  onCheckedChange={(checked) => setNewChatbotData(prev => ({ ...prev, fallbackToHuman: checked }))}
                />
                <Label htmlFor="fallback-human">Transferir para humano quando necessário</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ai-enabled"
                  checked={newChatbotData.aiEnabled}
                  onCheckedChange={(checked) => setNewChatbotData(prev => ({ ...prev, aiEnabled: checked }))}
                />
                <Label htmlFor="ai-enabled">Ativar processamento com IA</Label>
              </div>
            </TabsContent>
          </Tabs>

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
        </DialogContent>
      </Dialog>

      {/* Workflow Builder Modal */}
      <Dialog open={showWorkflowBuilder} onOpenChange={setShowWorkflowBuilder}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Construtor de Fluxo - {selectedChatbot?.name}
            </DialogTitle>
            <DialogDescription>
              Desenvolva o fluxo conversacional do seu chatbot
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="flow" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="flow">Fluxo</TabsTrigger>
              <TabsTrigger value="steps">Etapas</TabsTrigger>
              <TabsTrigger value="test">Teste</TabsTrigger>
              <TabsTrigger value="deploy">Deploy</TabsTrigger>
            </TabsList>

            <TabsContent value="flow" className="space-y-4">
              <div className="border rounded-lg p-4 min-h-[400px] bg-gray-50">
                <div className="text-center text-muted-foreground">
                  <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">Editor de Fluxo Visual</p>
                  <p className="text-sm">Arraste e conecte elementos para criar o fluxo conversacional</p>
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Elemento
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="steps" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-3">Tipos de Elementos</h4>
                  <div className="space-y-2">
                    {stepTypes.map(type => {
                      const IconComponent = type.icon;
                      return (
                        <Card key={type.id} className="p-3 cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-5 w-5 text-primary" />
                            <div>
                              <h5 className="font-medium text-sm">{type.name}</h5>
                              <p className="text-xs text-muted-foreground">{type.description}</p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Elementos Adicionados</h4>
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum elemento adicionado</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Simulador de Conversa</h4>
                  <div className="border rounded-lg p-3 min-h-[300px] bg-gray-50">
                    <div className="text-center text-muted-foreground py-12">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Teste seu chatbot aqui</p>
                      <Button className="mt-2" variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar Teste
                      </Button>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Resultados dos Testes</h4>
                  {selectedChatbot?.testResults ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Testes Aprovados:</span>
                        <Badge variant={selectedChatbot.testResults.passedTests === selectedChatbot.testResults.totalTests ? 'default' : 'secondary'}>
                          {selectedChatbot.testResults.passedTests}/{selectedChatbot.testResults.totalTests}
                        </Badge>
                      </div>
                      {selectedChatbot.testResults.issues.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Issues Encontradas:</p>
                          <div className="space-y-1">
                            {selectedChatbot.testResults.issues.map((issue, idx) => (
                              <div key={idx} className="text-xs text-orange-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {issue}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum teste executado</p>
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="deploy" className="space-y-4">
              <div className="space-y-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Status do Deploy</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Estágio Atual:</span>
                      <Badge variant="outline">{workflowStages.find(s => s.id === selectedChatbot?.stage)?.title}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status:</span>
                      <Badge variant={selectedChatbot?.isEnabled ? 'default' : 'secondary'}>
                        {selectedChatbot?.isEnabled ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    {selectedChatbot?.stage === 'active' && (
                      <div className="space-y-2">
                        <Separator />
                        <h5 className="font-medium text-sm">Métricas de Produção</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Conversas:</span>
                            <span className="font-medium ml-2">{selectedChatbot.metrics.totalConversations}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Taxa de Sucesso:</span>
                            <span className="font-medium ml-2">{(selectedChatbot.metrics.successRate * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tempo Médio:</span>
                            <span className="font-medium ml-2">{selectedChatbot.metrics.avgResponseTime.toFixed(1)}s</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Satisfação:</span>
                            <span className="font-medium ml-2">{selectedChatbot.metrics.userSatisfaction.toFixed(1)}/5</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Pré-visualizar
                  </Button>
                  <Button className="flex-1">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Avançar Etapa
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowWorkflowBuilder(false)}>
              Fechar
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
