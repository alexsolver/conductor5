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
  const [selectedNodeConfig, setSelectedNodeConfig] = useState<Record<string, any>>({}); // State to hold configurations for each node
  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState<string | null>(null);

  // Mouse position for connection preview
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [startCanvasDragPos, setStartCanvasDragPos] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [flows, setFlows] = useState<ChatbotFlow[]>([]); // State for list of flows

  // State for the selected flow ID to trigger the query
  const [selectedFlowId, setSelectedFlowId] = useState<string | undefined>(undefined);
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotBot | null>(null); // State for the selected bot

  // Bot data query
  const {
    data: botData,
    isLoading: isLoadingBots,
    error: botError
  } = useQuery({
    queryKey: ['chatbot-bot', botId],
    queryFn: async () => {
      if (!botId) return null;
      const response = await apiRequest('GET', `/api/omnibridge/chatbots/${botId}`);
      if (!response.ok) throw new Error('Failed to fetch bot');
      return response.json();
    },
    enabled: !!botId
  });

  // Bot flows query
  const {
    data: botFlows,
    isLoading: isLoadingFlows,
    error: flowsError
  } = useQuery({
    queryKey: ['chatbot-flows', botId],
    queryFn: async () => {
      if (!botId) return null;
      const response = await apiRequest('GET', `/api/omnibridge/chatbots/${botId}/flows`);
      if (!response.ok) throw new Error('Failed to fetch flows');
      return response.json();
    },
    enabled: !!botId
  });

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

  // Effect to load complete flow data when selectedFlowId changes
  useEffect(() => {
    console.log('🔄 [FLOW-LOAD-DEBUG] useEffect triggered:', {
      hasCompleteFlowData: !!completeFlowData,
      selectedFlowId,
      isLoadingCompleteFlow
    });

    if (completeFlowData && !isLoadingCompleteFlow) {
      console.log('🔄 [FLOW-LOAD] Loading complete flow data:', {
        flowId: completeFlowData.id,
        nodeCount: completeFlowData.nodes?.length || 0,
        edgeCount: completeFlowData.edges?.length || 0
      });

      // Convert database nodes to ReactFlow format with preserved configuration
      const flowNodes = (completeFlowData.nodes || []).map((node: any) => {
        const nodeId = node.id;
        const nodeConfig = node.config || {};

        // Store configuration in selectedNodeConfig for form editing
        setSelectedNodeConfig(prev => ({
          ...prev,
          [nodeId]: nodeConfig
        }));

        return {
          id: nodeId,
          type: 'custom',
          position: node.position || { x: 0, y: 0 },
          data: {
            label: node.title || node.name || 'Untitled Node',
            title: node.title || node.name || 'Untitled Node',
            type: node.type,
            category: node.category,
            description: node.description,
            config: nodeConfig,
            configuration: nodeConfig, // Duplicate for compatibility
            isStart: node.isStart || false,
            isEnd: node.isEnd || false,
            isEnabled: node.isEnabled !== false
          }
        };
      });

      // Convert database edges to ReactFlow format
      const flowEdges = (completeFlowData.edges || []).map((edge: any) => ({
        id: edge.id,
        source: edge.fromNodeId,
        target: edge.toNodeId,
        label: edge.label,
        type: 'smoothstep',
        data: {
          label: edge.label,
          condition: edge.condition,
          kind: edge.kind || 'default',
          order: edge.order || 0,
          isEnabled: edge.isEnabled !== false
        }
      }));

      console.log('✅ [FLOW-LOAD] Setting nodes and edges with preserved configs:', {
        nodeCount: flowNodes.length,
        edgeCount: flowEdges.length,
        sampleNodeConfig: flowNodes[0]?.data?.config
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } else if (!selectedFlowId || selectedFlowId.startsWith('flow_')) {
      console.log('🔄 [FLOW-LOAD] Temporary flow detected, starting with empty canvas');
      setNodes([]);
      setEdges([]);
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
    e.dataTransfer.setData('nodeType', nodeType); // Use 'nodeType' as the key

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

  // Helper to get the category key from a node type ID
  const getCategoryForNodeType = (typeId: string): string => {
    for (const [categoryKey, category] of Object.entries(NODE_CATEGORIES)) {
      if (category.nodes.some(node => node.id === typeId)) {
        return categoryKey;
      }
    }
    return 'unknown'; // Fallback category
  };


  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    if (!canvasRef.current || !selectedFlow) {
      console.log('🐛 [DRAG] Cannot drop - missing canvas or selected flow');
      return;
    }

    const draggedNodeType = e.dataTransfer.getData('nodeType');
    if (!draggedNodeType) {
      console.log('🐛 [DRAG] No node type in drag data');
      return;
    }

    console.log('🐛 [DRAG] Drop event fired', {
      draggedNodeType,
      hasCanvasRef: !!canvasRef.current,
      selectedFlow: selectedFlow.id,
      selectedFlowExists: !!selectedFlow
    });

    const rect = canvasRef.current.getBoundingClientRect();
    const position = {
      x: Math.max(0, e.clientX - rect.left - 50), // Center the node
      y: Math.max(0, e.clientY - rect.top - 25)
    };

    console.log('🐛 [DRAG] Drop position:', position);

    // Find node data from categories
    let nodeData = null;
    let nodeCategory = '';
    for (const [categoryKey, category] of Object.entries(NODE_CATEGORIES)) {
      nodeData = category.nodes.find(n => n.id === draggedNodeType);
      if (nodeData) {
        nodeCategory = categoryKey;
        break;
      }
    }

    if (!nodeData) {
      console.log('🐛 [DRAG] Node data not found for type:', draggedNodeType);
      return;
    }

    console.log('🐛 [DRAG] Node data found:', nodeData);

    // Create node with proper structure for backend
    const newNode = {
      id: `node_${Date.now()}`,
      type: draggedNodeType,
      title: nodeData.name,
      category: nodeCategory,
      description: nodeData.description || '',
      position,
      config: {},
      isStart: false,
      isEnd: false,
      isEnabled: true,
      // Legacy fields for compatibility
      flowId: selectedFlow.id,
      name: nodeData.name,
      configuration: {},
      metadata: {},
      isActive: true
    };

    console.log('🐛 [DRAG] Creating new node:', newNode);

    setSelectedFlow(prev => prev ? {
      ...prev,
      nodes: [...(prev.nodes || []), newNode]
    } : null);

    // Auto-save after adding node
    if (selectedFlow && !selectedFlow.id.startsWith('flow_')) {
      setTimeout(() => {
        handleSaveFlow();
      }, 500);
    }

    setDraggedNode(null); // Reset dragged node state

  }, [selectedFlow, handleSaveFlow]);

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

  const getCategoryFromType = (type: string | undefined): string => {
    if (!type) return 'unknown';
    return type.split('-')[0];
  };

  // Define handleSaveFlow once
  const handleSaveFlow = useCallback(async () => {
    if (!selectedFlow || !selectedChatbot) {
      toast({
        title: "Erro",
        description: "Selecione um fluxo válido antes de salvar",
        variant: "destructive"
      });
      return;
    }

    console.log('🔄 [FLOW-SAVE] Starting save process...', {
      flowId: selectedFlow.id,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      botId: selectedChatbot.id
    });

    try {
      setSaving(true);

      // Verify bot exists
      const botResponse = await apiRequest('GET', `/api/omnibridge/chatbots/${selectedChatbot.id}`);
      if (!botResponse.ok) {
        throw new Error('Bot not found or access denied');
      }

      // Convert nodes with complete configuration preservation
      const formattedNodes = nodes.map(node => {
        // Preserve all configuration data including from forms
        const nodeConfig = {
          ...node.data?.config,
          ...node.data?.configuration,
          // Include any form data that might exist
          ...(selectedNodeConfig[node.id] || {})
        };

        return {
          id: node.id || `node_${Date.now()}_${Math.random()}`,
          type: node.type || 'unknown',
          title: node.data?.title || node.data?.label || 'Untitled Node',
          category: getCategoryFromType(node.type),
          description: node.data?.description || '',
          position: node.position || { x: 0, y: 0 },
          config: nodeConfig, // Use the complete configuration
          isStart: node.data?.isStart || false,
          isEnd: node.data?.isEnd || false,
          isEnabled: node.data?.isEnabled !== false
        };
      });

      const formattedEdges = edges.map(edge => ({
        id: edge.id || `edge_${Date.now()}_${Math.random()}`,
        fromNodeId: edge.source,
        toNodeId: edge.target,
        label: edge.label || edge.data?.label || '',
        condition: edge.data?.condition || '',
        kind: edge.data?.kind || 'default',
        order: edge.data?.order || 0,
        isEnabled: edge.data?.isEnabled !== false
      }));

      console.log('🔄 [FLOW-SAVE] Prepared data for API:', {
        nodeCount: formattedNodes.length,
        edgeCount: formattedEdges.length,
        sampleNode: formattedNodes[0],
        sampleNodeConfig: formattedNodes[0]?.config
      });

      let responseData;

      if (selectedFlow.id.startsWith('flow_')) {
        // Create new flow for bot
        console.log('🔄 [FLOW-SAVE] Creating new flow for bot:', selectedChatbot.id);

        const newFlowData = {
          name: selectedFlow.name,
          description: selectedFlow.description || "Fluxo do chatbot",
          nodes: formattedNodes,
          edges: formattedEdges,
          variables: selectedFlow.variables || [],
          isActive: true
        };

        const response = await apiRequest('POST', `/api/omnibridge/chatbots/${selectedChatbot.id}/flows`, newFlowData);

        console.log('🔄 [FLOW-SAVE] Response status:', response.status, 'ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('🔄 [FLOW-SAVE] Error response text:', errorText);
          throw new Error(`Failed to create flow: ${response.status}`);
        }

        responseData = await response.json();
      } else {
        // Update existing flow with complete data
        console.log('🔄 [FLOW-SAVE] Updating existing flow:', selectedFlow.id);

        const updateData = {
          name: selectedFlow.name,
          description: selectedFlow.description,
          nodes: formattedNodes,
          edges: formattedEdges,
          variables: selectedFlow.variables || []
        };

        const response = await apiRequest('PUT', `/api/omnibridge/flows/${selectedFlow.id}`, updateData);

        if (!response.ok) {
          throw new Error(`Failed to update flow: ${response.status}`);
        }

        responseData = await response.json();
      }

      console.log('✅ [FLOW-SAVE] Flow saved successfully:', responseData);

      toast({
        title: "Sucesso",
        description: "Fluxo salvo com sucesso!",
        variant: "default"
      });

      // Update the selected flow with the returned data
      if (responseData?.success && responseData?.data) {
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
        handleSaveFlow();
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
  }, [selectedFlow, selectedChatbot, nodes, edges, toast, queryClient, selectedNodeConfig, setSaving, setSelectedFlowId]);


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
    const nodeType = e.dataTransfer.getData('nodeType'); // Correct key for node type
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
        type: nodeType,
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

  // Save node configuration from the form
  const handleNodeConfigSave = (nodeId: string, config: any) => {
    // Store in selectedNodeConfig for persistence
    setSelectedNodeConfig(prev => ({
      ...prev,
      [nodeId]: config
    }));

    // Update the node in the flow
    setNodes(prev => prev.map(node =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              config,
              configuration: config, // Duplicate for compatibility
              label: config.title || node.data.label,
              title: config.title || node.data.title
            }
          }
        : node
    ));

    setSelectedNodeForConfig(null);

    toast({
      title: "Configuração salva",
      description: "As configurações do nó foram salvas com sucesso.",
      variant: "default"
    });
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
                className={`absolute bg-white rounded-lg shadow-md border border-gray-200 p-3 cursor-move hover:shadow-lg transition-shadow node-container
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
                  setSelectedNodeForConfig(node.id);
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

          {selectedNodeForConfig && (
            <NodeConfigForm
              nodeId={selectedNodeForConfig}
              nodeType={nodes.find(n => n.id === selectedNodeForConfig)?.data?.type || ''}
              currentConfig={
                selectedNodeConfig[selectedNodeForConfig] ||
                nodes.find(n => n.id === selectedNodeForConfig)?.data?.config ||
                {}
              }
              onSave={handleNodeConfigSave}
              onCancel={() => setSelectedNodeForConfig(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}