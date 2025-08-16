
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  MoreHorizontal,
  MousePointer2,
  Layers,
  Link,
  Unlink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Home,
  Database,
  Globe,
  Mail,
  Phone,
  Calendar,
  FileText,
  Image,
  Video,
  Mic,
  Camera,
  Map,
  ShoppingCart,
  CreditCard,
  UserCheck,
  AlertCircle,
  Info,
  HelpCircle,
  Webhook,
  Brain,
  Cpu,
  Network,
  Timer,
  Hash,
  Tag,
  Flag,
  Repeat,
  Shuffle,
  SkipForward,
  FastForward
} from 'lucide-react';

interface FlowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'response' | 'integration' | 'delay' | 'ai' | 'webhook' | 'branch' | 'loop' | 'variable' | 'validation' | 'transfer' | 'form' | 'media' | 'location' | 'payment' | 'calendar' | 'menu';
  title: string;
  description?: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  connections: string[];
  isStartNode?: boolean;
  isEndNode?: boolean;
}

interface FlowConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

interface ChatbotFlow {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  variables: Record<string, any>;
  settings: {
    timeout: number;
    fallbackToHuman: boolean;
    aiEnabled: boolean;
    language: string;
  };
}

interface Chatbot {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  flow: ChatbotFlow;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  metrics: {
    totalConversations: number;
    successRate: number;
    avgResponseTime: number;
    userSatisfaction: number;
  };
}

// Node types with comprehensive options
const nodeTypes = [
  // Triggers
  { 
    id: 'trigger-message', 
    type: 'trigger', 
    name: 'Mensagem', 
    icon: MessageSquare, 
    description: 'Detecta mensagens específicas',
    color: 'bg-blue-500'
  },
  { 
    id: 'trigger-keyword', 
    type: 'trigger', 
    name: 'Palavra-chave', 
    icon: Hash, 
    description: 'Ativado por palavras-chave',
    color: 'bg-blue-500'
  },
  { 
    id: 'trigger-intent', 
    type: 'trigger', 
    name: 'Intenção IA', 
    icon: Brain, 
    description: 'Detecta intenção com IA',
    color: 'bg-blue-500'
  },
  { 
    id: 'trigger-webhook', 
    type: 'trigger', 
    name: 'Webhook', 
    icon: Webhook, 
    description: 'Ativado por webhook externo',
    color: 'bg-blue-500'
  },
  { 
    id: 'trigger-time', 
    type: 'trigger', 
    name: 'Agendamento', 
    icon: Calendar, 
    description: 'Ativado por horário/data',
    color: 'bg-blue-500'
  },

  // Conditions
  { 
    id: 'condition-text', 
    type: 'condition', 
    name: 'Condição Texto', 
    icon: GitBranch, 
    description: 'Verifica conteúdo de texto',
    color: 'bg-yellow-500'
  },
  { 
    id: 'condition-variable', 
    type: 'condition', 
    name: 'Condição Variável', 
    icon: Database, 
    description: 'Compara valores de variáveis',
    color: 'bg-yellow-500'
  },
  { 
    id: 'condition-user', 
    type: 'condition', 
    name: 'Condição Usuário', 
    icon: UserCheck, 
    description: 'Verifica dados do usuário',
    color: 'bg-yellow-500'
  },
  { 
    id: 'condition-time', 
    type: 'condition', 
    name: 'Condição Horário', 
    icon: Clock, 
    description: 'Verifica horário/data',
    color: 'bg-yellow-500'
  },

  // Actions
  { 
    id: 'action-send-message', 
    type: 'action', 
    name: 'Enviar Mensagem', 
    icon: MessageCircle, 
    description: 'Envia mensagem de texto',
    color: 'bg-green-500'
  },
  { 
    id: 'action-send-image', 
    type: 'action', 
    name: 'Enviar Imagem', 
    icon: Image, 
    description: 'Envia imagem ou GIF',
    color: 'bg-green-500'
  },
  { 
    id: 'action-send-audio', 
    type: 'action', 
    name: 'Enviar Áudio', 
    icon: Mic, 
    description: 'Envia mensagem de áudio',
    color: 'bg-green-500'
  },
  { 
    id: 'action-send-video', 
    type: 'action', 
    name: 'Enviar Vídeo', 
    icon: Video, 
    description: 'Envia arquivo de vídeo',
    color: 'bg-green-500'
  },
  { 
    id: 'action-send-document', 
    type: 'action', 
    name: 'Enviar Documento', 
    icon: FileText, 
    description: 'Envia arquivo/documento',
    color: 'bg-green-500'
  },
  { 
    id: 'action-set-variable', 
    type: 'action', 
    name: 'Definir Variável', 
    icon: Database, 
    description: 'Define valor de variável',
    color: 'bg-green-500'
  },
  { 
    id: 'action-api-call', 
    type: 'action', 
    name: 'Chamada API', 
    icon: Globe, 
    description: 'Faz requisição HTTP',
    color: 'bg-green-500'
  },
  { 
    id: 'action-tag-user', 
    type: 'action', 
    name: 'Marcar Usuário', 
    icon: Tag, 
    description: 'Adiciona tag ao usuário',
    color: 'bg-green-500'
  },

  // Response Types
  { 
    id: 'response-text', 
    type: 'response', 
    name: 'Resposta Texto', 
    icon: MessageSquare, 
    description: 'Resposta em texto simples',
    color: 'bg-purple-500'
  },
  { 
    id: 'response-quick-reply', 
    type: 'response', 
    name: 'Resposta Rápida', 
    icon: Zap, 
    description: 'Botões de resposta rápida',
    color: 'bg-purple-500'
  },
  { 
    id: 'response-menu', 
    type: 'response', 
    name: 'Menu Interativo', 
    icon: Layers, 
    description: 'Menu com opções',
    color: 'bg-purple-500'
  },
  { 
    id: 'response-carousel', 
    type: 'response', 
    name: 'Carrossel', 
    icon: Shuffle, 
    description: 'Carrossel de cards',
    color: 'bg-purple-500'
  },
  { 
    id: 'response-form', 
    type: 'response', 
    name: 'Formulário', 
    icon: FileText, 
    description: 'Coleta dados do usuário',
    color: 'bg-purple-500'
  },

  // Integrations
  { 
    id: 'integration-whatsapp', 
    type: 'integration', 
    name: 'WhatsApp', 
    icon: MessageCircle, 
    description: 'Integração WhatsApp',
    color: 'bg-indigo-500'
  },
  { 
    id: 'integration-telegram', 
    type: 'integration', 
    name: 'Telegram', 
    icon: MessageCircle, 
    description: 'Integração Telegram',
    color: 'bg-indigo-500'
  },
  { 
    id: 'integration-email', 
    type: 'integration', 
    name: 'Email', 
    icon: Mail, 
    description: 'Envio de emails',
    color: 'bg-indigo-500'
  },
  { 
    id: 'integration-sms', 
    type: 'integration', 
    name: 'SMS', 
    icon: Phone, 
    description: 'Envio de SMS',
    color: 'bg-indigo-500'
  },
  { 
    id: 'integration-calendar', 
    type: 'integration', 
    name: 'Calendário', 
    icon: Calendar, 
    description: 'Agendamento de eventos',
    color: 'bg-indigo-500'
  },
  { 
    id: 'integration-payment', 
    type: 'integration', 
    name: 'Pagamento', 
    icon: CreditCard, 
    description: 'Processamento de pagamentos',
    color: 'bg-indigo-500'
  },
  { 
    id: 'integration-location', 
    type: 'integration', 
    name: 'Localização', 
    icon: Map, 
    description: 'Serviços de localização',
    color: 'bg-indigo-500'
  },
  { 
    id: 'integration-crm', 
    type: 'integration', 
    name: 'CRM', 
    icon: Users, 
    description: 'Integração com CRM',
    color: 'bg-indigo-500'
  },

  // AI & Advanced
  { 
    id: 'ai-nlp', 
    type: 'ai', 
    name: 'Processamento IA', 
    icon: Brain, 
    description: 'Análise de linguagem natural',
    color: 'bg-pink-500'
  },
  { 
    id: 'ai-sentiment', 
    type: 'ai', 
    name: 'Análise Sentimento', 
    icon: Brain, 
    description: 'Detecta emoções do usuário',
    color: 'bg-pink-500'
  },
  { 
    id: 'ai-translation', 
    type: 'ai', 
    name: 'Tradução', 
    icon: Globe, 
    description: 'Tradução automática',
    color: 'bg-pink-500'
  },
  { 
    id: 'ai-recommendation', 
    type: 'ai', 
    name: 'Recomendação IA', 
    icon: Target, 
    description: 'Sistema de recomendações',
    color: 'bg-pink-500'
  },

  // Flow Control
  { 
    id: 'flow-delay', 
    type: 'delay', 
    name: 'Aguardar', 
    icon: Timer, 
    description: 'Pausa no fluxo',
    color: 'bg-gray-500'
  },
  { 
    id: 'flow-loop', 
    type: 'loop', 
    name: 'Loop', 
    icon: Repeat, 
    description: 'Repetição de ações',
    color: 'bg-gray-500'
  },
  { 
    id: 'flow-branch', 
    type: 'branch', 
    name: 'Ramificação', 
    icon: GitBranch, 
    description: 'Divisão de fluxo',
    color: 'bg-gray-500'
  },
  { 
    id: 'flow-merge', 
    type: 'branch', 
    name: 'Fusão', 
    icon: GitBranch, 
    description: 'União de fluxos',
    color: 'bg-gray-500'
  },
  { 
    id: 'flow-jump', 
    type: 'branch', 
    name: 'Pular Para', 
    icon: SkipForward, 
    description: 'Salta para outro nó',
    color: 'bg-gray-500'
  },
  { 
    id: 'flow-end', 
    type: 'branch', 
    name: 'Finalizar', 
    icon: Flag, 
    description: 'Termina a conversa',
    color: 'bg-red-500'
  },
  { 
    id: 'flow-transfer-human', 
    type: 'transfer', 
    name: 'Transferir Humano', 
    icon: Users, 
    description: 'Transfere para atendente',
    color: 'bg-orange-500'
  },

  // Validation
  { 
    id: 'validation-email', 
    type: 'validation', 
    name: 'Validar Email', 
    icon: Mail, 
    description: 'Valida formato de email',
    color: 'bg-cyan-500'
  },
  { 
    id: 'validation-phone', 
    type: 'validation', 
    name: 'Validar Telefone', 
    icon: Phone, 
    description: 'Valida número de telefone',
    color: 'bg-cyan-500'
  },
  { 
    id: 'validation-cpf', 
    type: 'validation', 
    name: 'Validar CPF', 
    icon: FileText, 
    description: 'Valida CPF brasileiro',
    color: 'bg-cyan-500'
  },
  { 
    id: 'validation-number', 
    type: 'validation', 
    name: 'Validar Número', 
    icon: Hash, 
    description: 'Valida entrada numérica',
    color: 'bg-cyan-500'
  }
];

export default function ChatbotVisualEditor() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [newChatbotData, setNewChatbotData] = useState({
    name: '',
    description: '',
    language: 'pt-BR',
    timeout: 300,
    fallbackToHuman: true,
    aiEnabled: false
  });

  useEffect(() => {
    fetchChatbots();
  }, [user?.tenantId]);

  const fetchChatbots = async () => {
    try {
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
        }
      } else {
        // Mock data for development
        setChatbots([
          {
            id: '1',
            tenantId: user?.tenantId || '',
            name: 'Atendimento Geral',
            description: 'Bot para atendimento inicial e direcionamento',
            flow: {
              id: 'flow1',
              name: 'Fluxo Principal',
              description: 'Fluxo de atendimento principal',
              nodes: [
                {
                  id: 'start',
                  type: 'trigger',
                  title: 'Início',
                  position: { x: 100, y: 100 },
                  config: { message: 'Olá! Como posso ajudar?' },
                  connections: ['welcome'],
                  isStartNode: true
                },
                {
                  id: 'welcome',
                  type: 'response',
                  title: 'Mensagem de Boas-vindas',
                  position: { x: 300, y: 100 },
                  config: { text: 'Bem-vindo ao nosso atendimento!' },
                  connections: []
                }
              ],
              connections: [
                { id: 'conn1', from: 'start', to: 'welcome', label: 'Início' }
              ],
              variables: {},
              settings: {
                timeout: 300,
                fallbackToHuman: true,
                aiEnabled: true,
                language: 'pt-BR'
              }
            },
            isEnabled: false,
            createdAt: '2025-01-16T00:00:00Z',
            updatedAt: '2025-01-16T01:00:00Z',
            metrics: {
              totalConversations: 0,
              successRate: 0,
              avgResponseTime: 0,
              userSatisfaction: 0
            }
          }
        ]);
      }
    } catch (error) {
      console.error('❌ [ChatbotEditor] Error fetching chatbots:', error);
      setChatbots([]);
    }
  };

  const handleCreateChatbot = async () => {
    try {
      const newChatbot: Chatbot = {
        id: Date.now().toString(),
        tenantId: user?.tenantId || '',
        name: newChatbotData.name,
        description: newChatbotData.description,
        flow: {
          id: `flow_${Date.now()}`,
          name: 'Novo Fluxo',
          description: 'Fluxo inicial do chatbot',
          nodes: [
            {
              id: 'start_node',
              type: 'trigger',
              title: 'Início',
              position: { x: 200, y: 150 },
              config: { trigger: 'any_message' },
              connections: [],
              isStartNode: true
            }
          ],
          connections: [],
          variables: {},
          settings: {
            timeout: newChatbotData.timeout,
            fallbackToHuman: newChatbotData.fallbackToHuman,
            aiEnabled: newChatbotData.aiEnabled,
            language: newChatbotData.language
          }
        },
        isEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: {
          totalConversations: 0,
          successRate: 0,
          avgResponseTime: 0,
          userSatisfaction: 0
        }
      };

      setChatbots(prev => [newChatbot, ...prev]);
      setSelectedChatbot(newChatbot);
      setShowCreateModal(false);
      setNewChatbotData({
        name: '',
        description: '',
        language: 'pt-BR',
        timeout: 300,
        fallbackToHuman: true,
        aiEnabled: false
      });
    } catch (error) {
      console.error('❌ [ChatbotEditor] Error creating chatbot:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, nodeTypeId: string) => {
    setDraggedNodeType(nodeTypeId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType || !selectedChatbot) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
    const y = (e.clientY - rect.top - canvasOffset.y) / zoom;

    const nodeType = nodeTypes.find(nt => nt.id === draggedNodeType);
    if (!nodeType) return;

    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      type: nodeType.type,
      title: nodeType.name,
      description: nodeType.description,
      position: { x, y },
      config: {},
      connections: []
    };

    const updatedChatbot = {
      ...selectedChatbot,
      flow: {
        ...selectedChatbot.flow,
        nodes: [...selectedChatbot.flow.nodes, newNode]
      }
    };

    setSelectedChatbot(updatedChatbot);
    setChatbots(prev => prev.map(bot => 
      bot.id === selectedChatbot.id ? updatedChatbot : bot
    ));

    setDraggedNodeType(null);
  };

  const handleNodeClick = (node: FlowNode) => {
    if (connecting && connectionStart && connectionStart !== node.id) {
      // Create connection
      const newConnection = {
        id: `conn_${Date.now()}`,
        from: connectionStart,
        to: node.id,
        label: 'Conectar'
      };

      if (selectedChatbot) {
        const updatedChatbot = {
          ...selectedChatbot,
          flow: {
            ...selectedChatbot.flow,
            connections: [...selectedChatbot.flow.connections, newConnection],
            nodes: selectedChatbot.flow.nodes.map(n =>
              n.id === connectionStart 
                ? { ...n, connections: [...n.connections, node.id] }
                : n
            )
          }
        };

        setSelectedChatbot(updatedChatbot);
        setChatbots(prev => prev.map(bot => 
          bot.id === selectedChatbot.id ? updatedChatbot : bot
        ));
      }

      setConnecting(false);
      setConnectionStart(null);
    } else if (connecting) {
      setConnectionStart(node.id);
    } else {
      setSelectedNode(node);
      setShowNodeConfig(true);
    }
  };

  const filteredNodeTypes = nodeTypes.filter(nodeType => {
    const matchesSearch = nodeType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nodeType.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || nodeType.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const nodeCategories = [
    { id: 'all', name: 'Todos' },
    { id: 'trigger', name: 'Gatilhos' },
    { id: 'condition', name: 'Condições' },
    { id: 'action', name: 'Ações' },
    { id: 'response', name: 'Respostas' },
    { id: 'integration', name: 'Integrações' },
    { id: 'ai', name: 'Inteligência Artificial' },
    { id: 'validation', name: 'Validação' },
    { id: 'delay', name: 'Controle de Fluxo' }
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Editor Visual de Chatbots</h2>
          <p className="text-muted-foreground">
            Construa fluxos conversacionais com interface visual intuitiva
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Node Palette */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          {/* Chatbot Selector */}
          <div className="p-4 border-b bg-white">
            <Label className="text-sm font-medium mb-2 block">Chatbot Ativo</Label>
            <Select value={selectedChatbot?.id || ''} onValueChange={(value) => {
              const chatbot = chatbots.find(c => c.id === value);
              setSelectedChatbot(chatbot || null);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um chatbot" />
              </SelectTrigger>
              <SelectContent>
                {chatbots.map(chatbot => (
                  <SelectItem key={chatbot.id} value={chatbot.id}>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      {chatbot.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search and Filter */}
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar nós..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {nodeCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Node Palette */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {filteredNodeTypes.map(nodeType => {
                const IconComponent = nodeType.icon;
                return (
                  <Card
                    key={nodeType.id}
                    className="p-3 cursor-move hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={(e) => handleDragStart(e, nodeType.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${nodeType.color} text-white`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900">{nodeType.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{nodeType.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-3 border-b bg-white">
            <div className="flex items-center gap-2">
              <Button 
                variant={connecting ? "default" : "outline"} 
                size="sm"
                onClick={() => {
                  setConnecting(!connecting);
                  setConnectionStart(null);
                }}
              >
                <Link className="h-4 w-4 mr-2" />
                {connecting ? 'Conectando...' : 'Conectar'}
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Testar
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.25))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setZoom(1);
                setCanvasOffset({ x: 0, y: 0 });
              }}>
                <Home className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Desfazer
              </Button>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden bg-gray-100">
            {selectedChatbot ? (
              <div
                ref={canvasRef}
                className="w-full h-full relative"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                  transform: `scale(${zoom}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
                  transformOrigin: '0 0'
                }}
              >
                {/* Grid Pattern */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {selectedChatbot.flow.connections.map(connection => {
                    const fromNode = selectedChatbot.flow.nodes.find(n => n.id === connection.from);
                    const toNode = selectedChatbot.flow.nodes.find(n => n.id === connection.to);
                    
                    if (!fromNode || !toNode) return null;

                    const x1 = fromNode.position.x + 100; // Center of node
                    const y1 = fromNode.position.y + 25;
                    const x2 = toNode.position.x + 100;
                    const y2 = toNode.position.y + 25;

                    return (
                      <g key={connection.id}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#6b7280"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                        {connection.label && (
                          <text
                            x={(x1 + x2) / 2}
                            y={(y1 + y2) / 2 - 5}
                            textAnchor="middle"
                            className="text-xs fill-gray-600"
                          >
                            {connection.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  
                  {/* Arrow marker definition */}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#6b7280"
                      />
                    </marker>
                  </defs>
                </svg>

                {/* Flow Nodes */}
                {selectedChatbot.flow.nodes.map(node => {
                  const nodeType = nodeTypes.find(nt => nt.type === node.type);
                  const IconComponent = nodeType?.icon || Bot;
                  
                  return (
                    <div
                      key={node.id}
                      className={`absolute cursor-pointer transition-all hover:shadow-lg ${
                        node.isStartNode ? 'ring-2 ring-green-500' : ''
                      } ${
                        connecting && connectionStart === node.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{
                        left: node.position.x,
                        top: node.position.y,
                        width: '200px'
                      }}
                      onClick={() => handleNodeClick(node)}
                    >
                      <Card className="shadow-md">
                        <CardHeader className="p-3 pb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${nodeType?.color || 'bg-gray-500'} text-white`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{node.title}</h4>
                              <p className="text-xs text-muted-foreground truncate">
                                {nodeType?.name || node.type}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardHeader>
                        {node.description && (
                          <CardContent className="p-3 pt-0">
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {node.description}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Nenhum chatbot selecionado</h3>
                  <p className="text-muted-foreground mb-4">
                    Selecione um chatbot ou crie um novo para começar a editar
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Chatbot
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Chatbot Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Chatbot</DialogTitle>
            <DialogDescription>
              Configure um novo chatbot conversacional
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language">Idioma</Label>
                <Select value={newChatbotData.language} onValueChange={(value) => 
                  setNewChatbotData(prev => ({ ...prev, language: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timeout">Timeout (segundos)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={newChatbotData.timeout}
                  onChange={(e) => setNewChatbotData(prev => ({ ...prev, timeout: parseInt(e.target.value) || 300 }))}
                />
              </div>
            </div>
            <div className="space-y-3">
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
            </div>
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
        </DialogContent>
      </Dialog>

      {/* Node Configuration Modal */}
      <Dialog open={showNodeConfig} onOpenChange={setShowNodeConfig}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Configurar Nó - {selectedNode?.title}</DialogTitle>
            <DialogDescription>
              Configure as propriedades e comportamento deste nó
            </DialogDescription>
          </DialogHeader>
          
          {selectedNode && (
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="config">Configuração</TabsTrigger>
                <TabsTrigger value="connections">Conexões</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label>Título do Nó</Label>
                  <Input value={selectedNode.title} onChange={() => {}} />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={selectedNode.description || ''} onChange={() => {}} rows={3} />
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Configurações específicas do tipo de nó</p>
                  <p className="text-sm">Implementação em desenvolvimento</p>
                </div>
              </TabsContent>

              <TabsContent value="connections" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Conexões de Saída</Label>
                  <div className="space-y-2">
                    {selectedNode.connections.map((connId, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{connId}</span>
                        <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {selectedNode.connections.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhuma conexão de saída</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNodeConfig(false)}>
              Cancelar
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
