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
  settings?: Record<string, any>;
  variables?: any[]; // Added for variables
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
  const [variables, setVariables] = useState<any[]>([]); // State for variables
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
  const [saving, setSaving] = useState(false); // Add saving state

  // Mouse position for connection preview
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [startCanvasDragPos, setStartCanvasDragPos] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [flows, setFlows] = useState<ChatbotFlow[]>([]); // State for list of flows

  // Load bot data
  const { data: botData, isLoading: isLoadingBots } = useQuery<{data: ChatbotBot}>({
    queryKey: ['/api/omnibridge/chatbots', botId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/omnibridge/chatbots/${botId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch bot: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!botId
  });

  // Load flows for bot
  const { data: botFlows, isLoading: isLoadingFlows } = useQuery<{data: ChatbotFlow[]}>({
    queryKey: ['/api/omnibridge/chatbots', botId, 'flows'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/omnibridge/chatbots/${botId}/flows`);
      if (!response.ok) {
        throw new Error(`Failed to fetch flows: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!botId
  });

  // State for the selected flow ID to trigger the query
  const [selectedFlowId, setSelectedFlowId] = useState<string | undefined>(undefined);
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotBot | null>(null); // State for the selected bot

  // Flow query with proper error handling
  const { 
    data: completeFlowData, 
    isLoading: isLoadingCompleteFlow,
    error: flowError,
    refetch: refetchFlow
  } = useQuery({
    queryKey: ['chatbot-flow-complete', selectedFlowId, selectedChatbot?.id],
    queryFn: async () => {
      console.log('🔄 [FLOW-QUERY] Fetching complete flow data:', { flowId: selectedFlowId, botId: selectedChatbot?.id });

      if (!selectedFlowId || !selectedChatbot?.id) {
        console.log('❌ [FLOW-QUERY] Missing required parameters');
        return null;
      }

      try {
        const url = `/api/omnibridge/flows/${selectedFlowId}`;
        console.log('🔍 [FLOW-QUERY] Making request to:', url);

        const response = await apiRequest('GET', url);

        if (!response.ok) {
          console.error('❌ [FLOW-QUERY] API error:', response.status, response.statusText);
          throw new Error(`Failed to fetch flow: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ [FLOW-QUERY] Flow data loaded:', {
          flowId: data?.data?.id,
          nodeCount: data?.data?.nodes?.length || 0,
          edgeCount: data?.data?.edges?.length || 0
        });

        return data.data;
      } catch (error) {
        console.error('❌ [FLOW-QUERY] Error fetching flow:', error);
        throw error;
      }
    },
    enabled: !!selectedFlowId && !selectedFlowId.startsWith('flow_') && !!selectedChatbot?.id,
    retry: 2,
    staleTime: 30000
  });

  console.log('🔄 [FLOW-QUERY-DEBUG] Query status:', {
    flowId: selectedFlowId,
    botId: selectedChatbot?.id,
    isTemporary: selectedFlowId?.startsWith('flow_'),
    enabled: !!selectedFlowId && !selectedFlowId.startsWith('flow_') && !!selectedChatbot?.id,
    isLoading: isLoadingCompleteFlow,
    hasData: !!completeFlowData,
    hasError: !!flowError
  });

  // Initialize selectedBot and flows state
  useEffect(() => {
    if (botData?.data) {
      setSelectedBot(botData.data);
      setSelectedChatbot(botData.data); // Set selectedChatbot here
    }
    if (botFlows?.data) {
      setFlows(botFlows.data);
      // Set default selected flow if none is selected
      if (!selectedFlowId && botFlows.data.length > 0) {
        setSelectedFlowId(botFlows.data[0].id);
      }
    }
  }, [botData, botFlows]);

  // Effect to load complete flow data when available
  useEffect(() => {
    console.log('🔄 [FLOW-LOAD-DEBUG] useEffect triggered:', {
      hasCompleteFlowData: !!completeFlowData,
      selectedFlowId,
      isLoadingCompleteFlow
    });

    if (!selectedFlowId) {
      console.log('🔄 [FLOW-LOAD] No flow selected, clearing data');
      setNodes([]);
      setEdges([]);
      return;
    }

    // Handle temporary flows
    if (selectedFlowId.startsWith('flow_')) {
      console.log('🔄 [FLOW-LOAD] Temporary flow detected, starting with empty canvas');
      setNodes([]);
      setEdges([]);
      return;
    }

    // Handle real flows
    if (completeFlowData && !isLoadingCompleteFlow) {
      console.log('🔄 [FLOW-LOAD] Loading complete flow data:', {
        flowId: completeFlowData.id,
        nodeCount: completeFlowData.nodes?.length || 0,
        edgeCount: completeFlowData.edges?.length || 0
      });

      // Update flow data in the flows list
      setFlows(prevFlows => 
        prevFlows.map(flow => 
          flow.id === completeFlowData.id 
            ? { ...completeFlowData, isTemporary: false }
            : flow
        )
      );

      // Set nodes and edges
      const flowNodes = (completeFlowData.nodes || []).map(node => ({
        ...node,
        id: node.id,
        flowId: completeFlowData.id,
        name: node.name || 'Untitled Node',
        type: node.type,
        category: node.category || 'trigger',
        position: node.position || { x: 100, y: 100 },
        configuration: node.configuration || {},
        metadata: node.metadata || {},
        isActive: node.isActive !== false
      }));

      const flowEdges = (completeFlowData.edges || []).map(edge => ({
        ...edge,
        id: edge.id,
        flowId: completeFlowData.id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        sourcePort: edge.sourcePort || 'output',
        targetPort: edge.targetPort || 'input',
        metadata: edge.metadata || {}
      }));

      console.log('🔄 [FLOW-LOAD] Setting nodes and edges:', {
        nodeCount: flowNodes.length,
        edgeCount: flowEdges.length
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
      setSelectedFlow(prevFlow => ({ ...prevFlow, ...completeFlowData, isTemporary: false }));
    }
  }, [completeFlowData, isLoadingCompleteFlow, selectedFlowId]);

  // Initialize with first flow if available or create a default one
  useEffect(() => {
    console.log('🐛 [FLOW-INIT] Checking flow initialization', {
      botData: !!selectedBot,
      flowsList: flows.length,
      firstFlow: flows[0]?.id || 'none',
      botId: botId
    });

    if (botId && !selectedBot) {
      // If botId is provided but bot data is not yet loaded, we might need to handle this.
      // For now, we rely on botData loading.
      console.log('🐛 [FLOW-INIT] BotId provided, but bot data not loaded yet.');
    }

    // Flow selection logic - maintain current selection or select default
    if (botId && selectedBot) {
      if (flows.length > 0) {
        // Check if current selectedFlow still exists in the flows list
        if (selectedFlow) {
          const currentFlowStillExists = flows.find(f => f.id === selectedFlow.id);
          if (currentFlowStillExists) {
            console.log('🐛 [FLOW-INIT] Keeping current selectedFlow:', selectedFlow.id);
            // Update with latest data but keep same flow
            if (JSON.stringify(selectedFlow) !== JSON.stringify(currentFlowStillExists)) {
              setSelectedFlow(currentFlowStillExists);
              // No need to update selectedFlowId here as it's already set to this flow's ID
            }
          } else {
            console.log('🐛 [FLOW-INIT] Current flow no longer exists, selecting first:', flows[0]);
            setSelectedFlow(flows[0]);
            setSelectedFlowId(flows[0].id); // Update selectedFlowId
          }
        } else {
          console.log('🐛 [FLOW-INIT] No selectedFlow, setting to first:', flows[0]);
          setSelectedFlow(flows[0]);
          setSelectedFlowId(flows[0].id); // Update selectedFlowId
        }
      } else if (!selectedFlow) {
        // Create a default flow if none exists
        const defaultFlow: ChatbotFlow = {
          id: `flow_${Date.now()}`,
          botId: botId!, // botId is guaranteed by the outer if condition
          name: 'Fluxo Principal',
          description: 'Fluxo padrão do chatbot',
          isActive: true,
          isMain: true, // Assuming this is the main flow
          version: 1,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.log('🐛 [FLOW-INIT] Creating default flow:', defaultFlow);
        setSelectedFlow(defaultFlow);
        setSelectedFlowId(defaultFlow.id); // Update selectedFlowId
        setFlows(prevFlows => [...prevFlows, defaultFlow]); // Add to the flows list
      }
    }
  }, [botId, selectedBot, flows, selectedFlow, selectedFlowId]);

  // Debug log for query status
  useEffect(() => {
    console.log('🔄 [FLOW-EDITOR-DEBUG] State:', {
      selectedFlowId: selectedFlow?.id,
      selectedBotId: selectedBot?.id,
      isLoadingCompleteFlow,
      completeFlowData: !!completeFlowData,
      flowError: !!flowError,
      nodesCount: nodes.length,
      edgesCount: edges.length
    });
  }, [selectedFlow, selectedBot, isLoadingCompleteFlow, completeFlowData, flowError, nodes, edges]);

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
    setDraggedNodeType(null); // Clear draggedNodeType after drop or end
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

    if (!draggedNodeType || !canvasRef.current || !selectedFlow) {
      console.log('🐛 [DRAG] Drop failed - missing draggedNodeType, canvasRef, or selectedFlow');
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

    if (draggedNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasOffset.x - dragOffset.x) / zoom;
      const y = (e.clientY - rect.top - canvasOffset.y - dragOffset.y) / zoom;

      setNodes(prev => prev.map(node =>
        node.id === draggedNode.id
          ? { ...node, position: { x, y } }
          : node
      ));

      console.log('🐛 [NODE-MOVE] Moved node to:', { x, y });
    }
    setDraggedNode(null); // Reset draggedNode state after move
    setDragOffset({ x: 0, y: 0 });
  };

  // Handle connection start
  const handleConnectionStart = (nodeId: string, isOutput: boolean) => {
    if (connecting) {
      // If we already have a connection started, complete it
      handleConnectionEnd(nodeId, !isOutput);
      return;
    }

    setConnecting({ nodeId, isSource: isOutput });
    setConnectionStart(nodeId); // Set connection start node
    console.log('🔗 [CONNECTION] Starting connection from:', nodeId, isOutput ? 'output' : 'input');
  };

  // Handle connection end
  const handleConnectionEnd = (nodeId: string, isInput: boolean) => {
    if (!connecting || connecting.nodeId === nodeId) {
      console.log('🔗 [CONNECTION] Cancelling connection - same node or no active connection');
      setConnecting(null);
      setConnectionStart(null);
      return;
    }

    // Only connect if we're connecting from output to input
    if (connecting.isSource && isInput) {
      // Create new edge
      const newEdge: FlowEdge = {
        id: `edge_${Date.now()}`,
        flowId: selectedFlow?.id || '',
        sourceNodeId: connecting.nodeId, // Use the nodeId from connecting state
        targetNodeId: nodeId, // Use the nodeId from the argument
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

      // Auto-save after creating connection
      setTimeout(() => {
        if (selectedFlow) {
          handleSaveFlow();
        }
      }, 500);
    } else {
      console.log('🔗 [CONNECTION] Invalid connection type');
    }

    setConnecting(null);
    setConnectionStart(null);
  };

  const handleSaveFlow = async (flowData?: any) => {
    console.log('🔄 [FLOW-SAVE] Starting save process...', {
      flowId: selectedFlow?.id,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      botId: selectedBot?.id
    });

    if (!selectedBot?.id) {
      toast({
        title: "Erro",
        description: "Nenhum bot selecionado",
        variant: "destructive"
      });
      return;
    }

    // Ensure selectedFlow is not null before proceeding
    if (!selectedFlow) {
      toast({
        title: "Erro",
        description: "Nenhum fluxo selecionado para salvar.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true); // Set saving state

    try {
      // Prepare the complete flow data including nodes and edges
      const completeFlowDataToSave = {
        name: flowData?.name || selectedFlow.name || 'Fluxo Principal',
        description: flowData?.description || selectedFlow.description || 'Fluxo padrão do chatbot',
        isActive: flowData?.isActive !== undefined ? flowData.isActive : (selectedFlow.isActive !== undefined ? selectedFlow.isActive : true),
        metadata: {
          flowNodes: JSON.stringify(nodes.map(node => ({
            id: node.id,
            flowId: selectedFlow.id,
            category: node.category, // Use category from FlowNode interface
            type: node.type,
            title: node.name, // Use name from FlowNode interface
            description: '', // Assuming description is not directly mapped here
            position: node.position,
            configuration: node.configuration, // Use configuration from FlowNode interface
            isStart: false, // Default value, needs logic if applicable
            isEnd: false, // Default value, needs logic if applicable
            isEnabled: node.isActive
          }))),
          flowEdges: JSON.stringify(edges.map(edge => ({
            id: edge.id,
            flowId: edge.flowId,
            sourceNodeId: edge.sourceNodeId,
            targetNodeId: edge.targetNodeId,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            label: edge.label,
            condition: edge.condition,
            metadata: edge.metadata
          }))),
          nodeCount: nodes.length,
          edgeCount: edges.length,
          lastModified: new Date().toISOString()
        },
        variables: variables // Include variables in the save payload
      };

      console.log('🔄 [FLOW-SAVE] Prepared data for API:', {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        sampleNode: nodes[0] ? {
          id: nodes[0].id,
          type: nodes[0].type,
          title: nodes[0].name
        } : null
      });

      let response;
      const flowId = selectedFlow.id;

      // If it's a new flow (temporary ID or no ID)
      if (!flowId || flowId.startsWith('flow_')) {
        // Verify bot exists first
        console.log('🔄 [FLOW-SAVE] Verifying bot exists:', selectedChatbot.id);
        const botResponse = await apiRequest(`/api/omnibridge/chatbots/${selectedChatbot.id}`);

        if (!botResponse.success) {
          console.error('❌ [FLOW-SAVE] Bot not found:', botResponse.error);
          throw new Error('Bot not found. Please refresh and try again.');
        }

        console.log('✅ [FLOW-SAVE] Bot verified, creating flow for:', selectedChatbot.id);

        // Prepare nodes and edges for saving
        const nodesToSave = nodes.map(node => ({
          id: node.id,
          flowId: selectedFlow.id, // Use the temporary ID for the initial save
          name: node.name,
          type: node.type,
          category: node.category,
          position: node.position,
          configuration: node.configuration,
          metadata: node.metadata,
          isActive: node.isActive
        }));

        const edgesToSave = edges.map(edge => ({
          id: edge.id,
          flowId: selectedFlow.id, // Use the temporary ID
          sourceNodeId: edge.sourceNodeId,
          targetNodeId: edge.targetNodeId,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          metadata: edge.metadata
        }));

        // Create flow for bot
        console.log('🔄 [FLOW-SAVE] Creating new flow for bot:', selectedChatbot.id);
        const createResponse = await apiRequest(`/api/omnibridge/chatbots/${selectedChatbot.id}/flows`, {
          method: 'POST',
          data: {
            id: flowId, // Send custom ID
            name: selectedFlow.name,
            description: selectedFlow.description || 'Flow criado automaticamente',
            isActive: selectedFlow.isActive || false,
            nodes: nodesToSave,
            edges: edgesToSave,
            variables: []
          }
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.log('🔄 [FLOW-SAVE] Error response text:', errorText);
          throw new Error(`Failed to create flow: ${createResponse.status} ${errorText}`);
        }
        const createdFlow = await createResponse.json();
        console.log('🔄 [FLOW-SAVE] Created flow data:', createdFlow.data);
        setSelectedFlow(createdFlow.data); // Update selectedFlow with the newly created flow
        setSelectedFlowId(createdFlow.data.id); // Update selectedFlowId
        setFlows(prevFlows => [...prevFlows.filter(f => f.id !== flowId), createdFlow.data]); // Update flows list
        queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/chatbots', botId, 'flows'] }); // Invalidate to refresh the list of flows
      } else {
        // Update existing flow
        console.log('🔄 [FLOW-SAVE] Updating existing flow:', flowId);
        response = await apiRequest('PUT', `/api/omnibridge/flows/${flowId}`, completeFlowDataToSave);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('🔄 [FLOW-SAVE] Error response text:', errorText);
          throw new Error(`${response.status}: ${errorText}`);
        }
      }

      const responseData = await response.json();
      console.log('🔄 [FLOW-SAVE] Success response:', responseData);

      toast({
        title: "Sucesso",
        description: "Fluxo salvo com sucesso!",
        variant: "default"
      });

      // Update selectedFlow with the latest data if available from the response
      if (responseData?.data) {
        setSelectedFlow(responseData.data);
        setSelectedFlowId(responseData.data.id); // Ensure selectedFlowId is updated
      } else if (selectedFlow && !selectedFlow.id.startsWith('flow_')) {
        // If response doesn't contain data but it was an update, refresh the query to ensure state consistency
        queryClient.invalidateQueries({ queryKey: ['chatbot-flow-complete', selectedFlow.id, selectedChatbot?.id] });
      }

    } catch (error: any) {
      console.error('❌ [FLOW-SAVE] Exception during save:', error);

      // Specific handling for "flow not found" might be needed here if PUT can result in 404 and we want to create
      if (error.message?.startsWith('404:')) {
        console.log('🔄 [FLOW-SAVE] Flow not found (404), attempting to create...');
        // Re-attempt save as create operation
        handleSaveFlow({
          name: selectedFlow.name,
          description: selectedFlow.description,
          isActive: selectedFlow.isActive
        });
      } else {
        toast({
          title: "Erro",
          description: error.message || "Erro ao salvar fluxo. Tente novamente.",
          variant: "destructive"
        });
      }
    } finally {
      setSaving(false); // Reset saving state
    }
  };

  // Render loading state only if we don't have basic data
  if (isLoadingBots || (isLoadingFlows && !botData)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando chatbot...</span>
      </div>
    );
  }

  // Show loading message for flow data but still show the interface
  if (isLoadingCompleteFlow && selectedFlowId && !selectedFlowId.startsWith('flow_')) {
    console.log('🔄 [FLOW-EDITOR] Loading flow data...');
  }

  // Helper to get node position for connection lines
  const getNodePosition = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;
    // Adjust position to the output/input handle
    const nodeElement = document.querySelector(`[data-testid="canvas-node-${nodeId}"]`);
    if (!nodeElement) return node.position;

    const outputHandle = nodeElement.querySelector('.absolute.-right-2');
    const inputHandle = nodeElement.querySelector('.absolute.-left-2');

    if (connecting?.nodeId === nodeId && connecting.isSource && outputHandle) {
      const rect = outputHandle.getBoundingClientRect();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return node.position;
      return {
        x: rect.left + rect.width / 2 - canvasRect.left,
        y: rect.top + rect.height / 2 - canvasRect.top
      };
    }
    if (connecting?.nodeId === nodeId && !connecting.isSource && inputHandle) {
      const rect = inputHandle.getBoundingClientRect();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return node.position;
      return {
        x: rect.left + rect.width / 2 - canvasRect.left,
        y: rect.top + rect.height / 2 - canvasRect.top
      };
    }

    return node.position; // Fallback to node center
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsCanvasDragging(true);
      setStartCanvasDragPos({ x: e.clientX, y: e.clientY });
      setSelectedNodeId(null); // Deselect node when clicking on canvas
      setConnecting(null); // Cancel connection when clicking on canvas
      setConnectionStart(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY }); // Update mouse position for preview line
    if (isCanvasDragging && canvasRef.current) {
      const deltaX = e.clientX - startCanvasDragPos.x;
      const deltaY = e.clientY - startCanvasDragPos.y;
      setCanvasOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setStartCanvasDragPos({ x: e.clientX, y: e.clientY }); // Update start position for continuous dragging
    }

    // Update connecting line if dragging a connection
    if (connecting) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        setMousePosition({
          x: e.clientX,
          y: e.clientY
        });
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsCanvasDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('text/plain');
    if (!nodeType) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const position = {
      x: (e.clientX - rect.left - canvasOffset.x) / zoom,
      y: (e.clientY - rect.top - canvasOffset.y) / zoom
    };

    const nodeData = Object.values(NODE_CATEGORIES)
      .flatMap(cat => cat.nodes)
      .find(n => n.id === nodeType);

    if (nodeData && selectedFlow) {
      const newNode: FlowNode = {
        id: `node_${Date.now()}`,
        flowId: selectedFlow.id,
        name: nodeData.name,
        type: nodeData.id,
        category: nodeType.split('-')[0],
        position,
        configuration: {},
        metadata: {},
        isActive: true
      };
      setNodes(prev => [...prev, newNode]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

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
            onClick={() => {
              // Pass current selected flow data to handleSaveFlow
              handleSaveFlow({ name: selectedFlow?.name, description: selectedFlow?.description, isActive: selectedFlow?.isActive });
            }}
            disabled={!selectedFlow || saving}
            data-testid="button-save-flow"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
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
        <div className="flex-1 relative bg-gray-50 overflow-hidden">
          {/* Loading indicator for flow data */}
          {isLoadingCompleteFlow && (
            <div className="absolute top-4 right-4 z-50 bg-white shadow-md rounded-lg p-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Carregando fluxo...</span>
            </div>
          )}

          <div
            ref={canvasRef}
            className="w-full h-full relative cursor-move"
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
              transformOrigin: 'top left'
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onDrop={handleCanvasDrop} // Use handleCanvasDrop for dropping nodes
            onDragOver={handleCanvasDrop} // Use handleCanvasDrop for drag over as well
          >
            {/* Grid Background */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`
              }}
            />

            {/* Empty State Message */}
            {nodes.length === 0 && !isLoadingCompleteFlow && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500 bg-white p-8 rounded-lg shadow-sm border-2 border-dashed border-gray-300">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Canvas Vazio</h3>
                  <p className="text-sm mb-4">Arraste um nó da paleta lateral para começar a criar seu fluxo</p>
                  <div className="flex justify-center space-x-2 text-xs">
                    <div className="flex items-center bg-blue-50 px-2 py-1 rounded">
                      <Zap className="w-3 h-3 mr-1 text-blue-600" />
                      Triggers
                    </div>
                    <div className="flex items-center bg-green-50 px-2 py-1 rounded">
                      <MessageSquare className="w-3 h-3 mr-1 text-green-600" />
                      Ações
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Render Nodes */}
            {nodes.map(node => (
              <div
                key={node.id}
                className={`absolute bg-white rounded-lg shadow-md border border-gray-200 p-3 cursor-move hover:shadow-lg transition-shadow select-none node-container
                  ${selectedNodeId === node.id ? 'border-blue-500 shadow-lg' : ''}
                `}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  minWidth: 150,
                  transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`, // Apply offset and zoom to nodes
                  transformOrigin: 'top left'
                }}
                draggable
                onDragStart={(e) => {
                  handleNodeDragStart(e, node);
                  setSelectedNodeId(node.id);
                }}
                onDragEnd={() => setDraggedNode(null)} // Reset dragged node state
                onClick={(e) => {
                  e.stopPropagation(); // Prevent canvas drag from starting
                  setSelectedNodeId(node.id);
                  setSelectedNode(node);
                  setNodeConfig(node.configuration);
                  setShowNodeConfig(true);
                }}
                data-testid={`canvas-node-${node.id}`}
              >
                {/* Connection point - input */}
                <div
                  className={`absolute -left-2 top-1/2 w-4 h-4 rounded-full cursor-pointer transition-colors z-10
                    ${connecting?.nodeId === node.id && !connecting.isSource
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
                  className={`absolute -right-2 top-1/2 w-4 h-4 rounded-full cursor-pointer transition-colors z-10
                    ${connecting?.nodeId === node.id && connecting.isSource
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
            {edges.map(edge => {
              const sourceNode = nodes.find(n => n.id === edge.sourceNodeId);
              const targetNode = nodes.find(n => n.id === edge.targetNodeId);

              if (!sourceNode || !targetNode) return null;

              const sourcePos = getNodePosition(edge.sourceNodeId);
              const targetPos = getNodePosition(edge.targetNodeId);

              if (!sourcePos || !targetPos) return null;

              // Use specific handles if available, otherwise default to center
              const sourceHandleX = edge.sourceHandle === 'output' ? sourceNode.position.x + 150 : sourceNode.position.x + 75; // Example adjustment
              const sourceHandleY = sourceNode.position.y + 20;
              const targetHandleX = edge.targetHandle === 'input' ? targetNode.position.x : targetNode.position.x + 75; // Example adjustment
              const targetHandleY = targetNode.position.y + 20;

              // Create curved path
              const midX = (sourceHandleX + targetHandleX) / 2;
              const path = `M ${sourceHandleX} ${sourceHandleY} C ${midX} ${sourceHandleY}, ${midX} ${targetHandleY}, ${targetHandleX} ${targetHandleY}`;

              return (
                <svg key={edge.id} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                  <path
                    d={path}
                    stroke="#6b7280"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                  />
                </svg>
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

            {/* Show connection line when connecting */}
            {connecting && connectionStart && (
              <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
                <line
                  x1={getNodePosition(connectionStart)?.x || 0}
                  y1={getNodePosition(connectionStart)?.y || 0}
                  x2={mousePosition.x - (canvasRef.current?.getBoundingClientRect().left || 0)} // Adjust for canvas offset
                  y2={mousePosition.y - (canvasRef.current?.getBoundingClientRect().top || 0)} // Adjust for canvas offset
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Canvas Controls */}
        <div className="absolute top-4 right-4 flex space-x-2 z-10">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
            data-testid="button-zoom-in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
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