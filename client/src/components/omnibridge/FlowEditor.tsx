import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import {
  Bot, MessageSquare, Plus, Save, Play, Trash2, Settings, Eye, Copy, Download, Upload,
  Zap, Clock, Users, Calendar, Mail, Phone, Globe, Database, Brain, Cpu, 
  GitBranch, CheckCircle, AlertCircle, Target, Tag, Hash, FileText, Image,
  Video, Mic, Camera, Map, ShoppingCart, CreditCard, Webhook, Network,
  Timer, Flag, Repeat, Shuffle, MousePointer2, Layers, Filter, Search,
  ArrowRight, Workflow, Plug, HelpCircle, Info, AlertTriangle, ZoomIn, 
  ZoomOut, Home, Star, BarChart, Lightbulb, MessageCircle
} from 'lucide-react';
import NodeConfigForm from './NodeConfigForm';

// Complete Node Categories with All 87 Functionalities
const NODE_CATEGORIES = {
  triggers: {
    name: 'Triggers',
    color: 'bg-blue-500',
    icon: Zap,
    nodes: [
      { id: 'trigger-keyword', name: 'Palavra-chave', icon: Hash, description: 'Acionado por palavras específicas' },
      { id: 'trigger-intent', name: 'Intenção IA', icon: Brain, description: 'Reconhece intenção com IA' },
      { id: 'trigger-time', name: 'Agendamento', icon: Clock, description: 'Acionado por data/hora' },
      { id: 'trigger-event', name: 'Evento', icon: Calendar, description: 'Acionado por eventos do sistema' },
      { id: 'trigger-webhook', name: 'Webhook', icon: Webhook, description: 'Acionado por webhook externo' },
      { id: 'trigger-button', name: 'Botão', icon: MousePointer2, description: 'Acionado por clique em botão' },
      { id: 'trigger-menu', name: 'Menu', icon: Layers, description: 'Acionado por seleção de menu' },
      { id: 'trigger-location', name: 'Localização', icon: Map, description: 'Acionado por localização GPS' },
      { id: 'trigger-file', name: 'Arquivo', icon: FileText, description: 'Acionado por upload de arquivo' },
      { id: 'trigger-regex', name: 'Regex', icon: Target, description: 'Acionado por padrão regex' }
    ]
  },
  conditions: {
    name: 'Conditions',
    color: 'bg-yellow-500', 
    icon: GitBranch,
    nodes: [
      { id: 'condition-text', name: 'Texto', icon: MessageSquare, description: 'Compara texto' },
      { id: 'condition-number', name: 'Número', icon: Hash, description: 'Compara números' },
      { id: 'condition-date', name: 'Data', icon: Calendar, description: 'Compara datas' },
      { id: 'condition-time', name: 'Horário', icon: Clock, description: 'Verifica horário' },
      { id: 'condition-variable', name: 'Variável', icon: Database, description: 'Compara variável' },
      { id: 'condition-user', name: 'Usuário', icon: Users, description: 'Dados do usuário' },
      { id: 'condition-channel', name: 'Canal', icon: MessageCircle, description: 'Tipo de canal' },
      { id: 'condition-language', name: 'Idioma', icon: Globe, description: 'Idioma detectado' },
      { id: 'condition-sentiment', name: 'Sentimento', icon: Brain, description: 'Análise de sentimento' },
      { id: 'condition-regex', name: 'Regex', icon: Target, description: 'Padrão regex' },
      { id: 'condition-contains', name: 'Contém', icon: Search, description: 'Contém texto' },
      { id: 'condition-equals', name: 'Igual a', icon: CheckCircle, description: 'Valor igual' },
      { id: 'condition-greater', name: 'Maior que', icon: ArrowRight, description: 'Maior que valor' },
      { id: 'condition-boolean', name: 'Boolean', icon: CheckCircle, description: 'Verdadeiro/Falso' }
    ]
  },
  actions: {
    name: 'Actions',
    color: 'bg-green-500',
    icon: Settings,
    nodes: [
      { id: 'action-send-text', name: 'Texto', icon: MessageSquare, description: 'Envia mensagem texto' },
      { id: 'action-send-image', name: 'Imagem', icon: Image, description: 'Envia imagem' },
      { id: 'action-send-audio', name: 'Áudio', icon: Mic, description: 'Envia áudio' },
      { id: 'action-send-video', name: 'Vídeo', icon: Video, description: 'Envia vídeo' },
      { id: 'action-send-document', name: 'Documento', icon: FileText, description: 'Envia arquivo' },
      { id: 'action-send-location', name: 'Localização', icon: Map, description: 'Envia localização' },
      { id: 'action-set-variable', name: 'Definir Variável', icon: Database, description: 'Define variável' },
      { id: 'action-api-call', name: 'API Call', icon: Globe, description: 'Chama API externa' },
      { id: 'action-webhook', name: 'Webhook', icon: Webhook, description: 'Envia webhook' },
      { id: 'action-tag-user', name: 'Tag Usuário', icon: Tag, description: 'Adiciona tag' },
      { id: 'action-create-ticket', name: 'Criar Ticket', icon: FileText, description: 'Cria ticket' },
      { id: 'action-send-email', name: 'Email', icon: Mail, description: 'Envia email' },
      { id: 'action-send-sms', name: 'SMS', icon: Phone, description: 'Envia SMS' },
      { id: 'action-log', name: 'Log', icon: FileText, description: 'Registra log' }
    ]
  },
  responses: {
    name: 'Responses',
    color: 'bg-purple-500',
    icon: MessageSquare,
    nodes: [
      { id: 'response-text', name: 'Texto Simples', icon: MessageSquare, description: 'Resposta em texto' },
      { id: 'response-quick-reply', name: 'Resposta Rápida', icon: Zap, description: 'Botões rápidos' },
      { id: 'response-menu', name: 'Menu', icon: Layers, description: 'Menu interativo' },
      { id: 'response-carousel', name: 'Carrossel', icon: Shuffle, description: 'Cards deslizantes' },
      { id: 'response-list', name: 'Lista', icon: FileText, description: 'Lista de opções' },
      { id: 'response-button', name: 'Botões', icon: MousePointer2, description: 'Botões personalizados' },
      { id: 'response-form', name: 'Formulário', icon: FileText, description: 'Coleta dados' },
      { id: 'response-rating', name: 'Avaliação', icon: Star, description: 'Coleta avaliação' },
      { id: 'response-payment', name: 'Pagamento', icon: CreditCard, description: 'Link de pagamento' },
      { id: 'response-appointment', name: 'Agendamento', icon: Calendar, description: 'Agenda compromisso' },
      { id: 'response-poll', name: 'Enquete', icon: BarChart, description: 'Cria enquete' },
      { id: 'response-media', name: 'Mídia Rich', icon: Image, description: 'Conteúdo rich media' }
    ]
  },
  integrations: {
    name: 'Integrations',
    color: 'bg-indigo-500',
    icon: Plug,
    nodes: [
      { id: 'integration-crm', name: 'CRM', icon: Users, description: 'Integração CRM' },
      { id: 'integration-database', name: 'Database', icon: Database, description: 'Consulta banco' },
      { id: 'integration-api', name: 'API REST', icon: Globe, description: 'API externa' },
      { id: 'integration-spreadsheet', name: 'Planilha', icon: FileText, description: 'Google Sheets/Excel' },
      { id: 'integration-calendar', name: 'Calendário', icon: Calendar, description: 'Google/Outlook Calendar' },
      { id: 'integration-payment', name: 'Pagamento', icon: CreditCard, description: 'Stripe/PayPal' },
      { id: 'integration-email', name: 'Email Provider', icon: Mail, description: 'SendGrid/SMTP' },
      { id: 'integration-sms', name: 'SMS Provider', icon: Phone, description: 'Twilio/SMS' },
      { id: 'integration-storage', name: 'Storage', icon: Database, description: 'AWS S3/Cloud Storage' },
      { id: 'integration-analytics', name: 'Analytics', icon: BarChart, description: 'Google Analytics' },
      { id: 'integration-social', name: 'Social Media', icon: Users, description: 'Facebook/Instagram' },
      { id: 'integration-ecommerce', name: 'E-commerce', icon: ShoppingCart, description: 'Shopify/WooCommerce' }
    ]
  },
  ai: {
    name: 'AI Processing',
    color: 'bg-pink-500',
    icon: Brain,
    nodes: [
      { id: 'ai-nlp', name: 'NLP', icon: Brain, description: 'Processamento linguagem' },
      { id: 'ai-sentiment', name: 'Sentiment', icon: Brain, description: 'Análise sentimento' },
      { id: 'ai-intent', name: 'Intent Recognition', icon: Target, description: 'Reconhece intenção' },
      { id: 'ai-entity', name: 'Entity Extraction', icon: Tag, description: 'Extrai entidades' },
      { id: 'ai-translation', name: 'Translation', icon: Globe, description: 'Tradução automática' },
      { id: 'ai-summarization', name: 'Summarization', icon: FileText, description: 'Resume texto' },
      { id: 'ai-recommendation', name: 'Recommendation', icon: Lightbulb, description: 'Sistema recomendação' },
      { id: 'ai-classification', name: 'Classification', icon: Tag, description: 'Classifica conteúdo' },
      { id: 'ai-conversation', name: 'Conversation AI', icon: MessageSquare, description: 'Chat inteligente' },
      { id: 'ai-voice', name: 'Voice Processing', icon: Mic, description: 'Processa áudio' },
      { id: 'ai-image', name: 'Image AI', icon: Image, description: 'Processa imagem' },
      { id: 'ai-custom', name: 'Custom AI', icon: Cpu, description: 'IA personalizada' }
    ]
  },
  flow_control: {
    name: 'Flow Control',
    color: 'bg-gray-500',
    icon: Workflow,
    nodes: [
      { id: 'flow-delay', name: 'Delay', icon: Clock, description: 'Aguardar tempo' },
      { id: 'flow-loop', name: 'Loop', icon: Repeat, description: 'Repetir ações' },
      { id: 'flow-branch', name: 'Branch', icon: GitBranch, description: 'Dividir fluxo' },
      { id: 'flow-merge', name: 'Merge', icon: GitBranch, description: 'Unir fluxos' },
      { id: 'flow-switch', name: 'Switch', icon: GitBranch, description: 'Múltiplas condições' },
      { id: 'flow-goto', name: 'Go To', icon: ArrowRight, description: 'Ir para node' },
      { id: 'flow-end', name: 'End', icon: Flag, description: 'Finalizar fluxo' },
      { id: 'flow-transfer', name: 'Transfer Human', icon: Users, description: 'Transferir humano' },
      { id: 'flow-escalate', name: 'Escalate', icon: ArrowRight, description: 'Escalar atendimento' },
      { id: 'flow-fallback', name: 'Fallback', icon: AlertTriangle, description: 'Ação de fallback' },
      { id: 'flow-retry', name: 'Retry', icon: Repeat, description: 'Tentar novamente' },
      { id: 'flow-timeout', name: 'Timeout', icon: Clock, description: 'Timeout handler' }
    ]
  },
  validation: {
    name: 'Validation',
    color: 'bg-cyan-500',
    icon: CheckCircle,
    nodes: [
      { id: 'validation-email', name: 'Email', icon: Mail, description: 'Valida email' },
      { id: 'validation-phone', name: 'Telefone', icon: Phone, description: 'Valida telefone' },
      { id: 'validation-cpf', name: 'CPF', icon: Hash, description: 'Valida CPF' },
      { id: 'validation-cnpj', name: 'CNPJ', icon: Hash, description: 'Valida CNPJ' },
      { id: 'validation-number', name: 'Número', icon: Hash, description: 'Valida número' },
      { id: 'validation-date', name: 'Data', icon: Calendar, description: 'Valida data' },
      { id: 'validation-url', name: 'URL', icon: Globe, description: 'Valida URL' },
      { id: 'validation-regex', name: 'Regex', icon: Target, description: 'Validação customizada' },
      { id: 'validation-length', name: 'Comprimento', icon: Hash, description: 'Valida tamanho' },
      { id: 'validation-required', name: 'Obrigatório', icon: AlertCircle, description: 'Campo obrigatório' },
      { id: 'validation-unique', name: 'Único', icon: CheckCircle, description: 'Valor único' },
      { id: 'validation-range', name: 'Intervalo', icon: ArrowRight, description: 'Valida intervalo' }
    ]
  },
  advanced: {
    name: 'Advanced',
    color: 'bg-red-500',
    icon: Cpu,
    nodes: [
      { id: 'advanced-script', name: 'JavaScript', icon: Cpu, description: 'Código personalizado' },
      { id: 'advanced-template', name: 'Template', icon: FileText, description: 'Template engine' },
      { id: 'advanced-queue', name: 'Queue', icon: Clock, description: 'Sistema de filas' },
      { id: 'advanced-cache', name: 'Cache', icon: Database, description: 'Sistema cache' },
      { id: 'advanced-rate-limit', name: 'Rate Limit', icon: Clock, description: 'Limite de taxa' },
      { id: 'advanced-batch', name: 'Batch Process', icon: Layers, description: 'Processamento lote' },
      { id: 'advanced-parallel', name: 'Parallel', icon: GitBranch, description: 'Execução paralela' },
      { id: 'advanced-scheduler', name: 'Scheduler', icon: Calendar, description: 'Agendador avançado' },
      { id: 'advanced-monitor', name: 'Monitor', icon: Eye, description: 'Monitoramento' },
      { id: 'advanced-debug', name: 'Debug', icon: Settings, description: 'Debug helper' },
      { id: 'advanced-middleware', name: 'Middleware', icon: Network, description: 'Middleware customizado' },
      { id: 'advanced-plugin', name: 'Plugin', icon: Plug, description: 'Plugin personalizado' }
    ]
  }
};

interface FlowNode {
  id: string;
  flowId: string;
  name: string;
  type: string;
  category: string;
  position: { x: number; y: number };
  configuration: Record<string, any>;
  metadata: Record<string, any>;
  isActive: boolean;
}

interface FlowEdge {
  id: string;
  flowId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
  targetHandle?: string;
  metadata: Record<string, any>;
  isActive: boolean;
}

interface ChatbotFlow {
  id: string;
  botId: string;
  name: string;
  description?: string;
  isActive: boolean;
  isMain: boolean;
  version: number;
  metadata: Record<string, any>;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
}

interface ChatbotBot {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  configuration: Record<string, any>;
  metadata: Record<string, any>;
  flows?: ChatbotFlow[];
}

interface FlowEditorProps {
  botId?: string;
  onClose?: () => void;
}

export default function FlowEditor({ botId, onClose }: FlowEditorProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);

  // State management
  const [selectedBot, setSelectedBot] = useState<ChatbotBot | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<ChatbotFlow | null>(null);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<FlowNode | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<{nodeId: string, isSource: boolean} | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [nodeConfig, setNodeConfig] = useState<Record<string, any>>({});

  // Load bot data
  const { data: bot, isLoading: loadingBot } = useQuery<{data: ChatbotBot}>({
    queryKey: ['/api/omnibridge/chatbots', botId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/omnibridge/chatbots/${botId}`);
      return response.json();
    },
    enabled: !!botId
  });

  // Load flows for bot
  const { data: flows, isLoading: loadingFlows } = useQuery<{data: ChatbotFlow[]}>({
    queryKey: ['/api/omnibridge/chatbots', botId, 'flows'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/omnibridge/chatbots/${botId}/flows`);
      return response.json();
    },
    enabled: !!botId
  });

  // Create flow mutation
  const createFlowMutation = useMutation({
    mutationFn: async (flowData: Partial<ChatbotFlow>) => {
      const response = await apiRequest('POST', `/api/omnibridge/chatbots/${botId}/flows`, {
        name: flowData.name,
        description: flowData.description,
        isActive: flowData.isActive,
        triggerEvent: flowData.triggerEvent,
        metadata: flowData.metadata
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('🔄 [FLOW-CREATE] Flow created successfully:', data.data);
      setSelectedFlow(data.data);
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/chatbots', botId, 'flows'] });
      toast({
        title: 'Flow Criado',
        description: 'Flow salvo com sucesso no banco de dados'
      });
    }
  });

  // Save flow mutation
  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: Partial<ChatbotFlow>) => {
      if (!selectedFlow?.id) throw new Error('No flow selected');
      const response = await apiRequest('PUT', `/api/omnibridge/flows/${selectedFlow.id}`, flowData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Flow Salvo',
        description: 'Flow atualizado com sucesso'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/chatbots', botId, 'flows'] });
    },
    onError: async (error: any) => {
      console.error('🔄 [FLOW-SAVE] Error saving flow:', error);
      
      // Handle 404 error (flow not found) by creating a new flow
      try {
        const response = await error;
        if (response?.status === 404 && selectedFlow) {
          console.log('🔄 [FLOW-SAVE] Flow not found (404), creating new one...');
          createFlowMutation.mutate(selectedFlow);
        } else {
          toast({
            title: 'Erro ao Salvar',
            description: 'Não foi possível salvar o flow',
            variant: 'destructive'
          });
        }
      } catch (e) {
        toast({
          title: 'Erro ao Salvar',
          description: 'Erro interno ao processar salvamento',
          variant: 'destructive'
        });
      }
    }
  });

  // Initialize with first flow if available or create a default one
  useEffect(() => {
    console.log('🐛 [FLOW-INIT] Checking flow initialization', {
      botData: !!bot?.data,
      flowsData: flows?.data?.length || 0,
      firstFlow: flows?.data?.[0]?.id || 'none',
      botId: botId
    });
    
    // If we have a botId but no bot data yet, create a temporary bot
    if (botId && !selectedBot) {
      const tempBot = {
        id: botId,
        name: 'Chatbot Temporário',
        description: 'Bot temporário para edição',
        tenantId: '',
        isActive: true,
        configuration: {},
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSelectedBot(tempBot);
    }
    
    // Create default flow if needed
    if (botId && !selectedFlow) {
      if (flows?.data?.length && flows.data.length > 0) {
        console.log('🐛 [FLOW-INIT] Setting selectedFlow to:', flows.data[0]);
        setSelectedFlow(flows.data[0]);
      } else {
        // Create a default flow if none exists
        const defaultFlow: ChatbotFlow = {
          id: `flow_${Date.now()}`,
          botId: botId,
          name: 'Fluxo Principal',
          description: 'Fluxo padrão do chatbot',
          isActive: true,
          triggerEvent: 'message_received',
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.log('🐛 [FLOW-INIT] Creating default flow:', defaultFlow);
        setSelectedFlow(defaultFlow);
      }
    }
    
    // Update with real bot data when available
    if (bot?.data && bot.data.id === botId) {
      console.log('🐛 [FLOW-INIT] Updating with real bot data:', bot.data);
      setSelectedBot(bot.data);
    }
  }, [bot, flows, botId, selectedBot, selectedFlow]);

  // Filter nodes based on search and category
  const getFilteredNodes = useCallback((category: keyof typeof NODE_CATEGORIES) => {
    const categoryNodes = NODE_CATEGORIES[category]?.nodes || [];
    return categoryNodes.filter(node => 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    console.log('🐛 [DRAG] Starting drag for node type:', nodeType);
    setDraggedNodeType(nodeType);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', nodeType);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('🐛 [DRAG] Drag ended');
    // Restore opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Check if we're moving an existing node
    if (draggedNode) {
      handleNodeMove(e);
      return;
    }
    
    console.log('🐛 [DRAG] Drop event fired', {
      draggedNodeType,
      hasCanvasRef: !!canvasRef.current,
      selectedFlow: selectedFlow?.id || 'MISSING',
      selectedFlowExists: !!selectedFlow
    });
    
    if (!draggedNodeType || !canvasRef.current) {
      console.log('🐛 [DRAG] Drop failed - missing draggedNodeType or canvasRef');
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const position = {
      x: (e.clientX - rect.left - canvasOffset.x) / zoom,
      y: (e.clientY - rect.top - canvasOffset.y) / zoom
    };

    console.log('🐛 [DRAG] Drop position:', position);

    // Find node definition
    const nodeData = Object.values(NODE_CATEGORIES)
      .flatMap(cat => cat.nodes)
      .find(n => n.id === draggedNodeType);

    console.log('🐛 [DRAG] Node data found:', nodeData);

    if (nodeData && selectedFlow) {
      const newNode: FlowNode = {
        id: `node_${Date.now()}`,
        flowId: selectedFlow.id,
        name: nodeData.name,
        type: nodeData.id,
        category: draggedNodeType.split('-')[0],
        position,
        configuration: {},
        metadata: {},
        isActive: true
      };

      console.log('🐛 [DRAG] Creating new node:', newNode);
      setNodes(prev => [...prev, newNode]);
      setDraggedNodeType(null);
      
      toast({
        title: 'Nó Adicionado',
        description: `Nó ${nodeData.name} adicionado ao fluxo`
      });
    } else {
      console.log('🐛 [DRAG] Failed to create node - missing nodeData or selectedFlow');
    }
  };

  const handleNodeClick = (node: FlowNode) => {
    setSelectedNode(node);
    setNodeConfig(node.configuration);
    setShowNodeConfig(true);
  };

  const saveNodeConfig = () => {
    if (!selectedNode) return;

    setNodes(prev => prev.map(node => 
      node.id === selectedNode.id 
        ? { ...node, configuration: nodeConfig }
        : node
    ));

    setShowNodeConfig(false);
  };

  // Handle node drag start (for moving existing nodes)
  const handleNodeDragStart = (e: React.DragEvent, node: FlowNode) => {
    e.stopPropagation();
    setDraggedNode(node);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    console.log('🐛 [NODE-MOVE] Starting to move node:', node.id);
  };

  // Handle node move via canvas drop
  const handleNodeMove = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedNode) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - canvasOffset.x - dragOffset.x) / zoom;
      const y = (e.clientY - rect.top - canvasOffset.y - dragOffset.y) / zoom;

      setNodes(prev => prev.map(node => 
        node.id === draggedNode.id 
          ? { ...node, position: { x, y } }
          : node
      ));
      
      console.log('🐛 [NODE-MOVE] Moved node to:', { x, y });
      setDraggedNode(null);
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Handle connection start
  const handleConnectionStart = (nodeId: string, isOutput: boolean) => {
    if (connecting) {
      // If we already have a connection started, complete it
      handleConnectionEnd(nodeId, !isOutput);
      return;
    }
    
    setConnecting({ nodeId, isSource: isOutput });
    console.log('🔗 [CONNECTION] Starting connection from:', nodeId, isOutput ? 'output' : 'input');
  };

  // Handle connection end
  const handleConnectionEnd = (nodeId: string, isInput: boolean) => {
    if (!connecting || connecting.nodeId === nodeId) {
      console.log('🔗 [CONNECTION] Cancelling connection - same node or no active connection');
      setConnecting(null);
      return;
    }

    // Only connect if we're connecting from output to input or input to output
    if ((connecting.isSource && isInput) || (!connecting.isSource && !isInput)) {
      // Create new edge
      const newEdge: FlowEdge = {
        id: `edge_${Date.now()}`,
        flowId: selectedFlow?.id || '',
        sourceNodeId: connecting.isSource ? connecting.nodeId : nodeId,
        targetNodeId: connecting.isSource ? nodeId : connecting.nodeId,
        sourceHandle: 'output',
        targetHandle: 'input',
        metadata: {}
      };

      console.log('🔗 [CONNECTION] Creating edge:', newEdge);
      setEdges(prev => [...prev, newEdge]);
      
      toast({
        title: 'Conexão Criada',
        description: 'Nós conectados com sucesso'
      });
    } else {
      console.log('🔗 [CONNECTION] Invalid connection type');
    }
    
    setConnecting(null);
  };

  const handleSaveFlow = () => {
    if (!selectedFlow) return;

    const flowData = {
      ...selectedFlow,
      metadata: {
        ...selectedFlow.metadata,
        nodes: nodes.length,
        edges: edges.length,
        lastModified: new Date().toISOString()
      }
    };

    saveFlowMutation.mutate(flowData);
  };

  if (loadingBot || loadingFlows) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50" data-testid="flow-editor">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Bot className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900" data-testid="bot-name">
              {selectedBot?.name || 'Flow Editor'}
            </h1>
            <p className="text-sm text-gray-500" data-testid="flow-name">
              {selectedFlow?.name || 'No flow selected'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleSaveFlow}
            disabled={!selectedFlow || saveFlowMutation.isPending || createFlowMutation.isPending}
            data-testid="button-save-flow"
          >
            <Save className="h-4 w-4 mr-2" />
            {(saveFlowMutation.isPending || createFlowMutation.isPending) ? 'Salvando...' : 'Salvar'}
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose} data-testid="button-close">
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar - Node Palette */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-3">
              <Input
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-nodes"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(NODE_CATEGORIES).map(([key, category]) => (
                    <SelectItem key={key} value={key}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {Object.entries(NODE_CATEGORIES).map(([categoryKey, category]) => {
                if (selectedCategory !== 'all' && selectedCategory !== categoryKey) return null;
                
                const filteredNodes = getFilteredNodes(categoryKey as keyof typeof NODE_CATEGORIES);
                if (filteredNodes.length === 0) return null;

                return (
                  <div key={categoryKey}>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className={`w-3 h-3 rounded ${category.color}`}></div>
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      <Badge variant="secondary">{filteredNodes.length}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {filteredNodes.map(node => (
                        <Card 
                          key={node.id}
                          className="cursor-move hover:shadow-md transition-shadow"
                          draggable
                          onDragStart={(e) => handleDragStart(e, node.id)}
                          onDragEnd={handleDragEnd}
                          data-testid={`node-${node.id}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-2">
                              <node.icon className="h-4 w-4 text-gray-600" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {node.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {node.description}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative">
          <div 
            ref={canvasRef}
            className="absolute inset-0 bg-gray-50 overflow-hidden"
            onDrop={handleCanvasDrop}
            onDragOver={(e) => e.preventDefault()}
            style={{
              backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`
            }}
            data-testid="flow-canvas"
          >
            {/* Canvas content */}
            <div 
              className="relative"
              style={{
                transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`
              }}
            >
              {/* Render nodes */}
              {nodes.map(node => (
                <div
                  key={node.id}
                  className="absolute bg-white rounded-lg shadow-md border border-gray-200 p-3 cursor-move hover:shadow-lg transition-shadow select-none"
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                    minWidth: 150
                  }}
                  draggable
                  onDragStart={(e) => handleNodeDragStart(e, node)}
                  onDragEnd={() => setDraggedNode(null)}
                  onClick={() => handleNodeClick(node)}
                  data-testid={`canvas-node-${node.id}`}
                >
                  {/* Connection point - input */}
                  <div 
                    className={`absolute -left-2 top-1/2 w-4 h-4 rounded-full cursor-pointer transition-colors z-10 ${
                      connecting?.nodeId === node.id && !connecting.isSource 
                        ? 'bg-yellow-400 border-2 border-yellow-600' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                    style={{ transform: 'translateY(-50%)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnectionStart(node.id, false);
                    }}
                    title="Entrada - Clique para conectar"
                  />
                  
                  {/* Node content */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${NODE_CATEGORIES[node.category as keyof typeof NODE_CATEGORIES]?.color || 'bg-gray-400'}`}></div>
                    <span className="font-medium text-sm">{node.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{node.type}</div>
                  
                  {/* Connection point - output */}
                  <div 
                    className={`absolute -right-2 top-1/2 w-4 h-4 rounded-full cursor-pointer transition-colors z-10 ${
                      connecting?.nodeId === node.id && connecting.isSource 
                        ? 'bg-yellow-400 border-2 border-yellow-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                    style={{ transform: 'translateY(-50%)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnectionStart(node.id, true);
                    }}
                    title="Saída - Clique para conectar"
                  />
                </div>
              ))}

              {/* Render edges */}
              <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                {edges.map(edge => {
                  const sourceNode = nodes.find(n => n.id === edge.sourceNodeId);
                  const targetNode = nodes.find(n => n.id === edge.targetNodeId);
                  
                  if (!sourceNode || !targetNode) return null;
                  
                  const x1 = sourceNode.position.x + 150; // Source output point
                  const y1 = sourceNode.position.y + 20; // Center of node
                  const x2 = targetNode.position.x; // Target input point
                  const y2 = targetNode.position.y + 20; // Center of node
                  
                  // Create curved path
                  const midX = (x1 + x2) / 2;
                  const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
                  
                  return (
                    <g key={edge.id}>
                      <path
                        d={path}
                        stroke="#6b7280"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                      />
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
              
              {/* Show connection line when connecting */}
              {connecting && (
                <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
                  <line
                    x1={nodes.find(n => n.id === connecting.nodeId)?.position.x! + (connecting.isSource ? 150 : 0)}
                    y1={nodes.find(n => n.id === connecting.nodeId)?.position.y! + 20}
                    x2={0}
                    y2={0}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Canvas Controls */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              data-testid="button-zoom-in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              data-testid="button-zoom-out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => { setZoom(1); setCanvasOffset({ x: 0, y: 0 }); }}
              data-testid="button-reset-view"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Node Configuration Modal */}
      <Dialog open={showNodeConfig} onOpenChange={setShowNodeConfig}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="node-config-modal">
          <DialogHeader>
            <DialogTitle>Configure Node: {selectedNode?.name}</DialogTitle>
            <DialogDescription>
              Configure the properties and behavior for this {selectedNode?.category} node.
            </DialogDescription>
          </DialogHeader>
          
          {selectedNode && (
            <NodeConfigForm
              nodeType={selectedNode.type}
              nodeName={selectedNode.name}
              nodeCategory={selectedNode.category}
              configuration={{ ...selectedNode.configuration, name: nodeConfig.name || selectedNode.name }}
              onChange={(config) => setNodeConfig(config)}
              onSave={saveNodeConfig}
              onCancel={() => setShowNodeConfig(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}