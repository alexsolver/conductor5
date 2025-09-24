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
  const [saving, setSaving] = useState(false); // Add saving state

  // Load bot data
  const { data: botData, isLoading: loadingBot, error: botError } = useQuery<{data: ChatbotBot}>({
    queryKey: ['/api/omnibridge/chatbots', botId],
    queryFn: async () => {
      if (!botId) throw new Error('Bot ID is required');
      const response = await apiRequest('GET', `/api/omnibridge/chatbots/${botId}`);
      if (!response.ok) {
        console.error('Failed to fetch bot:', response.statusText);
        throw new Error(`Failed to fetch bot: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!botId,
    retry: 3,
    retryDelay: 1000
  });

  // Load flows for bot
  const { data: flowsData, isLoading: loadingFlows, error: flowsError } = useQuery<{data: ChatbotFlow[]}>({
    queryKey: ['/api/omnibridge/chatbots', botId, 'flows'],
    queryFn: async () => {
      if (!botId) throw new Error('Bot ID is required');
      const response = await apiRequest('GET', `/api/omnibridge/chatbots/${botId}/flows`);
      if (!response.ok) {
        console.error('Failed to fetch flows:', response.statusText);
        throw new Error(`Failed to fetch flows: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!botId,
    retry: 3,
    retryDelay: 1000
  });

  const tenantId = user?.tenantId; // Assuming tenantId is available from useAuth
  const selectedBotId = botId; // Alias for clarity

  // Load complete flow data with nodes and edges when a flow is selected
  const { data: completeFlowData, isLoading: loadingCompleteFlow, error: completeFlowError } = useQuery<{
    data: ChatbotFlow & {
      nodes: Array<{
        id: string;
        flowId: string;
        category: string;
        type: string;
        title: string;
        description?: string;
        position: { x: number; y: number };
        config: any;
        isStart: boolean;
        isEnd: boolean;
        isEnabled: boolean;
      }>;
      edges: Array<{
        id: string;
        flowId: string;
        fromNodeId: string;
        toNodeId: string;
        label?: string;
        condition?: string;
        kind: string;
        order: number;
        isEnabled: boolean;
      }>;
    }
  }>({
    queryKey: ['/api/omnibridge/flows', selectedFlow?.id],
    queryFn: async () => {
      if (!selectedFlow?.id || selectedFlow.id.startsWith('flow_')) throw new Error('No valid flow selected');
      console.log('🌐 [FLOW-QUERY] Fetching complete flow data for:', selectedFlow.id);
      const response = await apiRequest('GET', `/api/omnibridge/flows/${selectedFlow.id}`);
      console.log('🌐 [FLOW-QUERY] Response status:', response.status);
      if (!response.ok) {
        console.error('🌐 [FLOW-QUERY] Failed to fetch flow:', response.statusText);
        throw new Error(`Failed to fetch flow: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      console.log('🌐 [FLOW-QUERY] Got complete flow data:', {
        flowId: result.data?.id,
        nodeCount: result.data?.nodes?.length || 0,
        edgeCount: result.data?.edges?.length || 0
      });
      return result;
    },
    enabled: !!(selectedFlow?.id && !selectedFlow.id.startsWith('flow_')), // Only for real UUIDs, not temp IDs
    retry: 3,
    retryDelay: 1000
  });

  // Create flow mutation
  const createFlowMutation = useMutation({
    mutationFn: async (flowData: Partial<ChatbotFlow>) => {
      if (!botId) throw new Error('Bot ID is required to create a flow');
      const response = await apiRequest('POST', `/api/omnibridge/chatbots/${botId}/flows`, {
        name: flowData.name,
        description: flowData.description,
        isActive: flowData.isActive,
        triggerEvent: flowData.triggerEvent,
        metadata: flowData.metadata
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create flow: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('🔄 [FLOW-CREATE] Flow created successfully:', data.data);

      const updatedFlow = {
        ...data.data,
        metadata: {
          ...data.data.metadata,
          flowNodes: JSON.stringify(nodes),
          flowEdges: JSON.stringify(edges),
          nodeCount: nodes.length,
          edgeCount: edges.length,
          lastModified: new Date().toISOString()
        }
      };

      setSelectedFlow(updatedFlow);
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/chatbots', botId, 'flows'] });
      toast({
        title: 'Flow Criado',
        description: 'Flow salvo com sucesso no banco de dados'
      });
    },
    onError: (error: any) => {
      console.error('🔄 [FLOW-CREATE] Error creating flow:', error);
      toast({
        title: 'Erro ao Criar Flow',
        description: error?.message || 'Não foi possível criar o flow',
        variant: 'destructive'
      });
    }
  });

  // Save flow mutation
  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: Partial<ChatbotFlow>) => {
      console.log('🔄 [FLOW-SAVE] Starting mutation with data:', flowData);
      if (!selectedFlow?.id) throw new Error('No flow selected');

      console.log('🔄 [FLOW-SAVE] Making API request to:', `/api/omnibridge/flows/${selectedFlow.id}`);
      const response = await apiRequest('PUT', `/api/omnibridge/flows/${selectedFlow.id}`, flowData);

      console.log('🔄 [FLOW-SAVE] Response status:', response.status, 'ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔄 [FLOW-SAVE] Error response text:', errorText);

        let errorObj;
        try {
          errorObj = JSON.parse(errorText);
        } catch (e) {
          console.log('🔄 [FLOW-SAVE] Could not parse error as JSON');
          errorObj = { message: errorText };
        }

        console.log('🔄 [FLOW-SAVE] Error object keys:', Object.keys(errorObj));
        console.log('🔄 [FLOW-SAVE] Error message:', `${response.status}: ${errorText}`);
        console.log('🔄 [FLOW-SAVE] Error status:', errorObj.status);

        // If flow not found and we have nodes/edges, try creating the flow first
        if (response.status === 500 && errorText.includes('Flow not found') && selectedFlow && (nodes.length > 0 || edges.length > 0)) {
          console.log('🔄 [FLOW-SAVE] Selected flow:', selectedFlow);
          console.log('🔄 [FLOW-SAVE] Flow not found, creating new one with current data...');
          await createFlowMutation.mutateAsync({
            ...flowData,
            id: selectedFlow.id // Ensure the new flow gets the intended ID if possible, though backend usually assigns new UUID
          });
          return; // Exit after attempting to create
        }

        throw new Error(`${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('🔄 [FLOW-SAVE] Success response:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Flow Salvo',
        description: 'Flow atualizado com sucesso'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/chatbots', botId, 'flows'] });
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/flows', selectedFlow?.id] }); // Invalidate complete flow data as well
    },
    onError: (error: any) => {
      console.error('🔄 [FLOW-SAVE] Error saving flow:', error);
      toast({
        title: 'Erro ao Salvar',
        description: error?.message || 'Não foi possível salvar o flow',
        variant: 'destructive'
      });
    }
  });

  // Initialize with first flow if available or create a default one
  useEffect(() => {
    console.log('🐛 [FLOW-INIT] Checking flow initialization', {
      botData: !!botData,
      flowsData: flowsData?.data?.length || 0,
      firstFlow: flowsData?.data?.[0]?.id || 'none',
      botId: botId
    });

    // Update selectedBot when botData is loaded
    if (botData?.data) {
      console.log('🐛 [FLOW-INIT] Setting selectedBot from query data:', botData.data);
      setSelectedBot(botData.data);
    } else if (botId && !selectedBot) {
      // Create a temporary bot if no botId is provided initially but we have a placeholder
      console.log('🐛 [FLOW-INIT] Setting temporary bot for ID:', botId);
      const tempBot = {
        id: botId,
        name: 'Chatbot Temporário',
        description: 'Bot temporário para edição',
        tenantId: user?.tenantId || '',
        isActive: true,
        configuration: {},
        metadata: {},
        flows: []
      };
      setSelectedBot(tempBot);
    }

    // Flow selection logic
    if (botId) {
      if (flowsData?.data && flowsData.data.length > 0) {
        // If a flow is already selected, check if it's still valid
        if (selectedFlow) {
          const currentFlowStillExists = flowsData.data.find(f => f.id === selectedFlow.id);
          if (currentFlowStillExists) {
            console.log('🐛 [FLOW-INIT] Keeping current selectedFlow:', selectedFlow.id);
            // Update with latest data if different
            if (JSON.stringify(selectedFlow) !== JSON.stringify(currentFlowStillExists)) {
              setSelectedFlow(currentFlowStillExists);
            }
          } else {
            // Current flow is gone, select the first one
            console.log('🐛 [FLOW-INIT] Current flow no longer exists, selecting first:', flowsData.data[0]);
            setSelectedFlow(flowsData.data[0]);
          }
        } else {
          // No flow selected, pick the first one
          console.log('🐛 [FLOW-INIT] No selectedFlow, setting to first:', flowsData.data[0]);
          setSelectedFlow(flowsData.data[0]);
        }
      } else if (!selectedFlow) {
        // No flows available, create a default flow if none is selected
        const defaultFlow: ChatbotFlow = {
          id: `flow_${Date.now()}`, // Temporary ID
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
  }, [botData, flowsData, botId, selectedBot, selectedFlow, user?.tenantId]);


  // Load nodes and edges from complete flow data when a real flow ID is selected
  useEffect(() => {
    console.log('🔄 [FLOW-LOAD-DEBUG] useEffect triggered:', {
      hasCompleteFlowData: !!completeFlowData?.data,
      selectedFlowId: selectedFlow?.id,
      isTemporaryFlow: selectedFlow?.id?.startsWith('flow_'),
      isLoadingCompleteFlow: loadingCompleteFlow,
      completeFlowError: completeFlowError?.message
    });

    if (selectedFlow && !selectedFlow.id.startsWith('flow_')) { // Only load for actual flows
      if (completeFlowData?.data) {
        console.log('🔄 [FLOW-LOAD] Loading complete flow data:', {
          flowId: completeFlowData.data.id,
          nodeCount: completeFlowData.data.nodes?.length || 0,
          edgeCount: completeFlowData.data.edges?.length || 0
        });

        // Map backend nodes to ReactFlow format
        const mappedNodes = (completeFlowData.data.nodes || []).map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            label: node.title,
            description: node.description,
            category: node.category,
            isStart: node.isStart,
            isEnd: node.isEnd,
            isEnabled: node.isEnabled,
            config: node.config,
            flowId: node.flowId
          }
        }));

        // Map backend edges to ReactFlow format
        const mappedEdges = (completeFlowData.data.edges || []).map(edge => ({
          id: edge.id,
          source: edge.fromNodeId,
          target: edge.toNodeId,
          label: edge.label,
          data: {
            condition: edge.condition,
            kind: edge.kind,
            order: edge.order,
            isEnabled: edge.isEnabled,
            flowId: edge.flowId
          },
          animated: false
        }));

        console.log('🔄 [FLOW-LOAD] Mapped data:', {
          nodes: mappedNodes.length,
          edges: mappedEdges.length,
          firstNode: mappedNodes[0]?.data?.label,
          firstEdge: mappedEdges[0]?.label
        });

        setNodes(mappedNodes);
        setEdges(mappedEdges);
      } else if (!loadingCompleteFlow && completeFlowError) {
        // If query failed for a real flow, show empty canvas and log error
        console.log('🔄 [FLOW-LOAD] Query failed for selected flow, setting empty canvas. Error:', completeFlowError.message);
        setNodes([]);
        setEdges([]);
      } else if (!loadingCompleteFlow) {
        // If query succeeded but returned no data (or was empty), set empty canvas
        console.log('🔄 [FLOW-LOAD] No complete flow data found for selected flow, setting empty canvas.');
        setNodes([]);
        setEdges([]);
      }
    } else if (selectedFlow && selectedFlow.id.startsWith('flow_')) {
      // Temporary flow ID - start with empty canvas
      console.log('🔄 [FLOW-LOAD] Temporary flow detected, starting with empty canvas');
      setNodes([]);
      setEdges([]);
    }
  }, [completeFlowData, selectedFlow?.id, loadingCompleteFlow, completeFlowError]);

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

      // Auto-save disabled temporarily to prevent node deletion
      // setTimeout(() => {
      //   if (selectedFlow) {
      //     handleSaveFlow();
      //   }
      // }, 500);
    } else {
      console.log('🐛 [DRAG] Failed to create node - missing nodeData or selectedFlow');
    }
  };

  const handleNodeClick = (node: FlowNode) => {
    setSelectedNode(node);
    // Use node.data.config if available, otherwise fallback to node.configuration
    setNodeConfig(node.data?.config || node.configuration || {});
    setShowNodeConfig(true);
  };

  const saveNodeConfig = useCallback(() => {
    if (!selectedNode) return;

    setNodes(prev => prev.map(node =>
      node.id === selectedNode.id
        ? { ...node, data: { ...node.data, config: nodeConfig, label: nodeConfig.name || node.data?.label || 'Node' } } // Update data.config and potentially label
        : node
    ));

    setShowNodeConfig(false);
    toast({
      title: 'Configuração Salva',
      description: 'Configurações do nó atualizadas.'
    });

    // Optionally auto-save the flow after node config change
    // setTimeout(() => {
    //   if (selectedFlow) {
    //     handleSaveFlow();
    //   }
    // }, 500);
  }, [selectedNode, nodeConfig, nodes, setNodes, toast, selectedFlow]);


  // Handle node drag start (for moving existing nodes)
  const handleNodeDragStart = (e: React.DragEvent, node: FlowNode) => {
    e.stopPropagation();
    setDraggedNode(node);
    const rect = e.currentTarget.getBoundingClientRect();
    // Adjust drag offset to be relative to the canvas offset and zoom
    setDragOffset({
      x: e.clientX - rect.left - canvasOffset.x,
      y: e.clientY - rect.top - canvasOffset.y
    });
    console.log('🐛 [NODE-MOVE] Starting to move node:', node.id);
  };

  // Handle node move via canvas drop
  const handleNodeMove = (e: React.DragEvent) => {
    e.preventDefault();

    if (draggedNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();

      // Calculate new position based on event coordinates, canvas offset, zoom, and drag offset
      const x = ((e.clientX - rect.left) - dragOffset.x) / zoom;
      const y = ((e.clientY - rect.top) - dragOffset.y) / zoom;

      setNodes(prev => prev.map(node =>
        node.id === draggedNode.id
          ? { ...node, position: { x, y } }
          : node
      ));

      console.log('🐛 [NODE-MOVE] Moved node to:', { x, y });
      // Clear draggedNode state after moving
      setDraggedNode(null);
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Handle connection start
  const handleConnectionStart = (nodeId: string, isSource: boolean) => {
    if (connecting) {
      // If we already have a connection started, cancel it or handle as needed
      // For now, let's just reset it. Could also try to complete if types match.
      console.log('🔗 [CONNECTION] Resetting existing connection attempt.');
      setConnecting(null);
    }
    setConnecting({ nodeId, isSource });
    console.log('🔗 [CONNECTION] Starting connection from:', nodeId, isSource ? 'output' : 'input');
  };

  // Handle connection end
  const handleConnectionEnd = (targetNodeId: string, isTargetInput: boolean) => {
    if (!connecting || connecting.nodeId === targetNodeId) {
      console.log('🔗 [CONNECTION] Cancelling connection - same node or no active connection');
      setConnecting(null);
      return;
    }

    // Only allow connecting from a source node's output to a target node's input
    if (connecting.isSource && isTargetInput) {
      // Create new edge
      const newEdge: FlowEdge = {
        id: `edge_${Date.now()}`,
        flowId: selectedFlow?.id || '',
        sourceNodeId: connecting.nodeId,
        targetNodeId: targetNodeId,
        sourceHandle: 'output', // Assuming default output handle
        targetHandle: 'input',  // Assuming default input handle
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
      console.log('🔗 [CONNECTION] Invalid connection: Source must connect to Target input.');
      toast({
        title: 'Conexão Inválida',
        description: 'Apenas conexões de saída para entrada são permitidas.',
        variant: 'warning'
      });
    }

    setConnecting(null); // Reset connection state
  };

  const handleSaveFlow = useCallback(async () => {
    if (!selectedFlow?.id || !botData?.data?.id) { // Use botData.data.id for the actual bot ID
      console.warn('🔄 [FLOW-SAVE] No selected flow or bot to save');
      toast({
        title: 'Salvar Interrompido',
        description: 'Nenhum flow ou bot selecionado para salvar.',
        variant: 'warning'
      });
      return;
    }

    try {
      setSaving(true);
      console.log('🔄 [FLOW-SAVE] Starting save process...', {
        flowId: selectedFlow.id,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        botId: botData.data.id
      });

      // First, verify the bot exists
      console.log('🔄 [FLOW-SAVE] Verifying bot exists:', botData.data.id);
      const botVerifyResponse = await apiRequest(`/api/omnibridge/chatbots/${botData.data.id}`, {
        method: 'GET'
      });

      if (!botVerifyResponse.ok) {
        console.error('🔄 [FLOW-SAVE] Bot verification failed:', botVerifyResponse.status);
        throw new Error(`Bot não encontrado (${botVerifyResponse.status}). Verifique se o chatbot existe.`);
      }

      const botVerifyResult = await botVerifyResponse.json();
      console.log('🔄 [FLOW-SAVE] Bot verified successfully:', botVerifyResult.data?.name);

      // Prepare nodes and edges for API
      const nodesToSave = nodes.map(node => ({
        id: node.id,
        flowId: selectedFlow.id,
        category: node.data?.category || 'triggers', // Use category from node data if available
        type: node.type || 'default',
        title: node.data?.label || node.data?.name || node.name || 'Untitled Node', // Prioritize label from data, then name, then default
        description: node.data?.description || '',
        position: node.position || { x: 0, y: 0 },
        config: node.data?.config || {}, // Use config from node data
        isStart: Boolean(node.data?.isStart || false),
        isEnd: Boolean(node.data?.isEnd || false),
        isEnabled: Boolean(node.data?.isEnabled !== undefined ? node.data.isEnabled : true)
      }));

      const edgesToSave = edges.map(edge => ({
        id: edge.id,
        flowId: selectedFlow.id,
        fromNodeId: edge.source,
        toNodeId: edge.target,
        label: edge.label || edge.data?.label || '',
        condition: edge.data?.condition || '',
        kind: edge.data?.kind || 'default',
        order: edge.data?.order || 0,
        isEnabled: Boolean(edge.data?.isEnabled !== undefined ? edge.data.isEnabled : true)
      }));

      console.log('🔄 [FLOW-SAVE] Prepared data for API:', {
        nodeCount: nodesToSave.length,
        edgeCount: edgesToSave.length,
        sampleNode: nodesToSave[0] ? { id: nodesToSave[0].id, type: nodesToSave[0].type, title: nodesToSave[0].title } : null
      });

      // Prepare mutation data
      const mutationData = {
        name: selectedFlow.name,
        description: selectedFlow.description,
        isActive: selectedFlow.isActive,
        triggerEvent: selectedFlow.triggerEvent || 'message_received', // Default trigger
        metadata: {
          ...selectedFlow.metadata, // Preserve existing metadata
          flowNodes: JSON.stringify(nodesToSave),
          flowEdges: JSON.stringify(edgesToSave),
          nodeCount: nodesToSave.length,
          edgeCount: edgesToSave.length,
          lastModified: new Date().toISOString()
        }
      };

      console.log('🔄 [FLOW-SAVE] Starting mutation with data:', mutationData);
      console.log('🔄 [FLOW-SAVE] Making API request to:', `/api/omnibridge/flows/${selectedFlow.id}`);

      const response = await apiRequest(`/api/omnibridge/flows/${selectedFlow.id}`, {
        method: 'PUT',
        data: mutationData
      });

      console.log('🔄 [FLOW-SAVE] Response status:', response.status, 'ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔄 [FLOW-SAVE] Error response text:', errorText);

        let errorObj;
        try {
          errorObj = JSON.parse(errorText);
        } catch (e) {
          console.log('🔄 [FLOW-SAVE] Could not parse error as JSON');
          errorObj = { message: errorText };
        }

        // If flow not found and we have nodes/edges, try creating the flow first
        // Check for specific error messages or status codes indicating "not found"
        if ((response.status === 404 || (response.status === 500 && errorText.includes('not found'))) && (nodesToSave.length > 0 || edgesToSave.length > 0)) {
          console.log('🔄 [FLOW-SAVE] Flow not found, attempting to create it...');

          const createFlowData = {
            name: selectedFlow.name,
            description: selectedFlow.description,
            isActive: selectedFlow.isActive,
            triggerEvent: selectedFlow.triggerEvent,
            metadata: mutationData.metadata,
            id: selectedFlow.id // Pass the temp ID if it's a new flow
          };

          // Use the createFlowMutation
          await createFlowMutation.mutateAsync(createFlowData);
          // If creation was successful, the onSuccess of createFlowMutation will handle state updates.
          // We can return here or let the error handler proceed.
          return; // Exit after attempting to create
        }

        // Throw a generic error if it's not a "not found" scenario or if creation failed
        throw new Error(`${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('🔄 [FLOW-SAVE] Save successful:', result);

      toast({
        title: "✅ Fluxo salvo",
        description: "Todas as alterações foram salvas com sucesso.",
      });

    } catch (error: any) {
      console.error('❌ [FLOW-SAVE] Exception during save:', error);
      toast({
        title: "❌ Erro ao Salvar",
        description: error?.message || "Erro desconhecido ao salvar o fluxo",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [selectedFlow, nodes, edges, botData, toast, tenantId, createFlowMutation]); // Added createFlowMutation to dependencies

  // Handle initial bot and flow setup, including creating a default bot if needed
  useEffect(() => {
    if (!botId) {
      console.log('🐛 [FLOW-INIT] No botId provided, cannot initialize editor.');
      // Optionally handle this state, perhaps by showing a message or disabling the editor
      return;
    }

    // If botData is not yet loaded or is incorrect, try to ensure the bot exists.
    if (!botData?.data && !botError) {
      // Trigger the query for bot data if it hasn't started or failed
      console.log('🐛 [FLOW-INIT] Bot data not loaded, initiating query...');
      // The useQuery hook for botData should handle fetching.
    }

    // If botData fails to load, inform the user.
    if (botError) {
      console.error('🐛 [FLOW-INIT] Error loading bot data:', botError.message);
      toast({
        title: 'Erro ao Carregar Bot',
        description: `Falha ao carregar informações do bot: ${botError.message}`,
        variant: 'destructive'
      });
      // Potentially disable editor functionality or show a specific error state
      return;
    }

    // Update selectedBot state when botData is successfully loaded
    if (botData?.data && !selectedBot) {
      console.log('🐛 [FLOW-INIT] Setting selectedBot from query data:', botData.data);
      setSelectedBot(botData.data);
    } else if (!selectedBot && botId) {
      // If botData is still loading or failed, but we have a botId, set a placeholder
      // This might happen if the bot is created on the fly or data is slow to load
      console.log('🐛 [FLOW-INIT] Setting temporary bot for ID:', botId);
      const tempBot = {
        id: botId,
        name: 'Chatbot Temporário',
        description: 'Bot temporário para edição',
        tenantId: user?.tenantId || '',
        isActive: true,
        configuration: {},
        metadata: {},
        flows: []
      };
      setSelectedBot(tempBot);
    }

    // Now handle flow initialization after bot state is somewhat settled
    if (selectedBot && !flowsData?.data && !flowsError) {
      // Trigger the query for flows if bot is ready but flows haven't loaded
      console.log('🐛 [FLOW-INIT] Bot ready, initiating query for flows...');
      // The useQuery hook for flowsData should handle fetching.
    }

    // Handle flow selection or default flow creation
    if (selectedBot && (flowsData?.data || flowsError)) {
      if (flowsData?.data && flowsData.data.length > 0) {
        // If flows are loaded, select the first one or maintain current selection
        if (selectedFlow) {
          const currentFlowStillExists = flowsData.data.find(f => f.id === selectedFlow.id);
          if (currentFlowStillExists) {
            console.log('🐛 [FLOW-INIT] Keeping current selectedFlow:', selectedFlow.id);
            if (JSON.stringify(selectedFlow) !== JSON.stringify(currentFlowStillExists)) {
              setSelectedFlow(currentFlowStillExists); // Update if data changed
            }
          } else {
            console.log('🐛 [FLOW-INIT] Current flow no longer exists, selecting first:', flowsData.data[0]);
            setSelectedFlow(flowsData.data[0]);
          }
        } else {
          console.log('🐛 [FLOW-INIT] No selectedFlow, setting to first:', flowsData.data[0]);
          setSelectedFlow(flowsData.data[0]);
        }
      } else if (!selectedFlow) {
        // No flows found, create a default flow if none is selected
        console.log('🐛 [FLOW-INIT] No flows found, creating default flow.');
        const defaultFlow: ChatbotFlow = {
          id: `flow_${Date.now()}`, // Temporary ID for a new flow
          botId: selectedBot.id,
          name: 'Fluxo Principal',
          description: 'Fluxo padrão do chatbot',
          isActive: true,
          triggerEvent: 'message_received',
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setSelectedFlow(defaultFlow);
      }
    } else if (flowsError) {
      console.error('🐛 [FLOW-INIT] Error loading flows:', flowsError.message);
      toast({
        title: 'Erro ao Carregar Flows',
        description: `Falha ao carregar os fluxos do bot: ${flowsError.message}`,
        variant: 'destructive'
      });
    }
  }, [botId, botData, botError, flowsData, flowsError, selectedBot, selectedFlow, user?.tenantId, toast]);


  // Load nodes and edges from complete flow data when a real flow ID is selected
  useEffect(() => {
    console.log('🔄 [FLOW-LOAD] useEffect triggered:', {
      selectedFlowId: selectedFlow?.id,
      isTemporaryFlow: selectedFlow?.id?.startsWith('flow_'),
      isLoadingCompleteFlow: loadingCompleteFlow,
      completeFlowError: completeFlowError?.message,
      hasCompleteFlowData: !!completeFlowData?.data
    });

    if (selectedFlow && !selectedFlow.id.startsWith('flow_')) { // Only load for actual flows with valid IDs
      if (loadingCompleteFlow) {
        console.log('🔄 [FLOW-LOAD] Waiting for complete flow data to load...');
        // Optionally show a loading indicator for the canvas area
        return;
      }

      if (completeFlowError) {
        console.error('🔄 [FLOW-LOAD] Error fetching complete flow data:', completeFlowError.message);
        toast({
          title: 'Erro ao Carregar Fluxo',
          description: `Falha ao carregar detalhes do fluxo ${selectedFlow.name}: ${completeFlowError.message}`,
          variant: 'destructive'
        });
        setNodes([]);
        setEdges([]);
        return;
      }

      if (completeFlowData?.data) {
        console.log('🔄 [FLOW-LOAD] Loading complete flow data:', {
          flowId: completeFlowData.data.id,
          nodeCount: completeFlowData.data.nodes?.length || 0,
          edgeCount: completeFlowData.data.edges?.length || 0
        });

        // Map backend nodes to ReactFlow format
        const mappedNodes = (completeFlowData.data.nodes || []).map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            label: node.title,
            description: node.description,
            category: node.category,
            isStart: node.isStart,
            isEnd: node.isEnd,
            isEnabled: node.isEnabled,
            config: node.config,
            flowId: node.flowId
          }
        }));

        // Map backend edges to ReactFlow format
        const mappedEdges = (completeFlowData.data.edges || []).map(edge => ({
          id: edge.id,
          source: edge.fromNodeId,
          target: edge.toNodeId,
          label: edge.label,
          data: {
            condition: edge.condition,
            kind: edge.kind,
            order: edge.order,
            isEnabled: edge.isEnabled,
            flowId: edge.flowId
          },
          animated: false
        }));

        console.log('🔄 [FLOW-LOAD] Mapped data:', {
          nodes: mappedNodes.length,
          edges: mappedEdges.length,
          firstNode: mappedNodes[0]?.data?.label,
          firstEdge: mappedEdges[0]?.label
        });

        setNodes(mappedNodes);
        setEdges(mappedEdges);
      } else {
        // If no data is returned for a valid flow ID, assume it's an empty flow
        console.log('🔄 [FLOW-LOAD] No complete flow data found for selected flow, initializing empty canvas.');
        setNodes([]);
        setEdges([]);
      }
    } else if (selectedFlow && selectedFlow.id.startsWith('flow_')) {
      // Temporary flow ID - start with empty canvas
      console.log('🔄 [FLOW-LOAD] Temporary flow detected, starting with empty canvas');
      setNodes([]);
      setEdges([]);
    }
  }, [completeFlowData, selectedFlow?.id, loadingCompleteFlow, completeFlowError, toast, setNodes, setEdges]);


  if (loadingBot || loadingFlows) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle case where botId is provided but bot data fails to load entirely
  if (!selectedBot && botError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600 mb-2">Erro Crítico</h2>
        <p className="text-gray-700 mb-4">
          Não foi possível carregar ou criar o chatbot. Verifique se o ID do bot está correto e se você tem permissão.
        </p>
        <p className="text-sm text-gray-500">Detalhes do erro: {botError.message}</p>
        {onClose && (
          <Button variant="outline" onClick={onClose} className="mt-6">
            Fechar Editor
          </Button>
        )}
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
              {selectedBot?.name || botId || 'Flow Editor'}
            </h1>
            <p className="text-sm text-gray-500" data-testid="flow-name">
              {selectedFlow?.name || 'Nenhum fluxo selecionado'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleSaveFlow}
            disabled={!selectedFlow || saving || !botId || !selectedBot} // Disable if no flow, saving, or bot is not ready
            data-testid="button-save-flow"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose} data-testid="button-close">
              Fechar
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
                placeholder="Buscar nós..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-nodes"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Todas as Categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
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
              // Using a subtle background grid pattern
              backgroundImage: `linear-gradient(to right, rgba(200,200,200,0.1) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(200,200,200,0.1) 1px, transparent 1px)`,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`
            }}
            data-testid="flow-canvas"
            // Handle mouse wheel for zoom and drag for panning
            onWheel={(e) => {
              e.preventDefault();
              const scale = 1.1;
              const newZoom = e.deltaY < 0 ? zoom * scale : zoom / scale;
              const zoomClamp = Math.max(0.5, Math.min(2, newZoom)); // Clamp zoom between 0.5x and 2x

              // Adjust canvas offset to keep the zoomed point centered
              const canvasRect = canvasRef.current!.getBoundingClientRect();
              const mouseX = e.clientX - canvasRect.left;
              const mouseY = e.clientY - canvasRect.top;

              const newOffsetX = canvasOffset.x + mouseX * (1 - zoomClamp / zoom);
              const newOffsetY = canvasOffset.y + mouseY * (1 - zoomClamp / zoom);

              setZoom(zoomClamp);
              setCanvasOffset({ x: newOffsetX, y: newOffsetY });
            }}
            onMouseDown={(e) => {
              if (e.button === 0 && !connecting) { // Left click for panning, only if not in connection mode
                e.preventDefault(); // Prevent default text selection
                setDraggedNode(null); // Ensure we are panning, not moving a node
                document.addEventListener('mousemove', handleCanvasMouseMove);
                document.addEventListener('mouseup', handleCanvasMouseUp);
              }
            }}
          >
            {/* Canvas content - nodes and edges are rendered here */}
            <div
              className="relative"
              style={{
                transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
                transformOrigin: 'top left' // Ensure scaling happens from the top-left corner
              }}
            >
              {/* Render edges first so nodes are on top */}
              <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                {edges.map(edge => {
                  const sourceNode = nodes.find(n => n.id === edge.source);
                  const targetNode = nodes.find(n => n.id === edge.target);

                  if (!sourceNode || !targetNode) return null;

                  // Calculate connection points - adjust for node width/height if needed
                  // Assuming nodes have a fixed width of ~150px for output point calculation
                  const sourceX = sourceNode.position.x + 150; // Center of the right edge
                  const sourceY = sourceNode.position.y + 20; // Vertical center of the node
                  const targetX = targetNode.position.x;    // Left edge of the target node
                  const targetY = targetNode.position.y + 20; // Vertical center of the node

                  // Bezier curve path
                  const midX = (sourceX + targetX) / 2;
                  const path = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;

                  return (
                    <g key={edge.id}>
                      <path
                        d={path}
                        stroke="#9ca3af" // Gray color
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                      />
                      {/* Optional: Add labels to edges */}
                      {edge.label && (
                        <text
                          x={midX}
                          y={targetY - 5} // Position label slightly above the curve
                          textAnchor="middle"
                          fontSize="10"
                          fill="#4b5563"
                          className="font-medium"
                        >
                          {edge.label}
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
                    refX="9" // Adjust refX to position the arrowhead correctly at the end of the path
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#9ca3af"
                    />
                  </marker>
                </defs>
              </svg>

              {/* Render nodes */}
              {nodes.map(node => (
                <div
                  key={node.id}
                  className={`absolute p-3 rounded-lg shadow-sm border border-gray-200 bg-white cursor-grab nodrag ${
                    connecting?.nodeId === node.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                    minWidth: 150,
                    zIndex: 10 // Ensure nodes are above edges
                  }}
                  draggable
                  onDragStart={(e) => handleNodeDragStart(e, node)}
                  onDragEnd={() => setDraggedNode(null)} // Clear draggedNode on drag end
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent canvas drop handler from firing
                    handleNodeClick(node);
                  }}
                  data-testid={`canvas-node-${node.id}`}
                >
                  {/* Node Content */}
                  <div className="flex items-center space-x-2 mb-2">
                    {/* Category indicator */}
                    <div className={`w-2 h-2 rounded-full ${NODE_CATEGORIES[node.data?.category as keyof typeof NODE_CATEGORIES]?.color || 'bg-gray-400'}`}></div>
                    <span className="font-medium text-sm truncate">{node.data?.label || node.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{node.type}</div>

                  {/* Input connection point */}
                  <div
                    className={`absolute -left-2 top-1/2 w-4 h-4 rounded-full cursor-pointer transition-colors z-10 ${
                      connecting?.nodeId === node.id && !connecting.isSource
                        ? 'bg-yellow-400 border-2 border-yellow-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                    style={{ transform: 'translateY(-50%)' }}
                    onMouseDown={(e) => {
                      e.stopPropagation(); // Prevent node drag
                      handleConnectionStart(node.id, false); // isSource = false for input
                    }}
                    title="Entrada - Clique para conectar"
                  />

                  {/* Output connection point */}
                  <div
                    className={`absolute -right-2 top-1/2 w-4 h-4 rounded-full cursor-pointer transition-colors z-10 ${
                      connecting?.nodeId === node.id && connecting.isSource
                        ? 'bg-yellow-400 border-2 border-yellow-600'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                    style={{ transform: 'translateY(-50%)' }}
                    onMouseDown={(e) => {
                      e.stopPropagation(); // Prevent node drag
                      handleConnectionStart(node.id, true); // isSource = true for output
                    }}
                    title="Saída - Clique para conectar"
                  />
                </div>
              ))}

              {/* Show connection line when connecting */}
              {connecting && (
                <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
                  <line
                    x1={
                      nodes.find(n => n.id === connecting.nodeId)?.position.x +
                      (nodes.find(n => n.id === connecting.nodeId)?.type === 'advanced-script' ? 75 : 150) // Adjust for node width
                    }
                    y1={nodes.find(n => n.id === connecting.nodeId)?.position.y + 20}
                    x2={
                      (canvasRef.current?.getBoundingClientRect().left || 0) -
                      (canvasRef.current?.getBoundingClientRect().left || 0) + // Relative to canvas
                      (canvasRef.current?.getBoundingClientRect().width || 0) / 2 // Center of canvas as initial target
                    }
                    y2={
                      (canvasRef.current?.getBoundingClientRect().top || 0) -
                      (canvasRef.current?.getBoundingClientRect().top || 0) + // Relative to canvas
                      (canvasRef.current?.getBoundingClientRect().height || 0) / 2 // Center of canvas as initial target
                    }
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Canvas Controls */}
          <div className="absolute top-4 right-4 flex space-x-2 z-20">
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
            <DialogTitle>Configurar Nó: {selectedNode?.data?.label || selectedNode?.name}</DialogTitle>
            <DialogDescription>
              Configure as propriedades e o comportamento deste nó {selectedNode?.data?.category || 'genérico'}.
            </DialogDescription>
          </DialogHeader>

          {selectedNode ? (
            <NodeConfigForm
              nodeType={selectedNode.type}
              nodeName={selectedNode.data?.label || selectedNode.name} // Pass the display name
              nodeCategory={selectedNode.data?.category as keyof typeof NODE_CATEGORIES}
              configuration={nodeConfig} // Pass the current config state
              onChange={(config) => setNodeConfig(config)} // Update state on config change
              onSave={saveNodeConfig}
              onCancel={() => setShowNodeConfig(false)}
            />
          ) : (
            <p>Selecione um nó para configurar.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper functions for canvas panning
function handleCanvasMouseMove(e: MouseEvent) {
  // This function will be attached and detached dynamically
  // It needs access to setCanvasOffset and zoom state, which is tricky without context.
  // For now, assuming it's managed by the component's state updates.
}

function handleCanvasMouseUp(e: MouseEvent) {
  // Clean up event listeners
  document.removeEventListener('mousemove', handleCanvasMouseMove);
  document.removeEventListener('mouseup', handleCanvasMouseUp);
}