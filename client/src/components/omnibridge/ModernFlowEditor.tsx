import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  ZoomOut, Home, Star, BarChart, Lightbulb, MessageCircle, Grid3X3, Move,
  RotateCcw, ChevronRight, ChevronDown, Focus, Maximize2, Minimize2
} from 'lucide-react';
import NodeConfigForm from './NodeConfigForm';

// Enhanced Node Categories with better organization
const NODE_CATEGORIES = {
  triggers: {
    name: 'Triggers',
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    icon: Zap,
    description: 'Inicializadores do fluxo',
    nodes: [
      { id: 'trigger-keyword', name: 'Palavra-chave', icon: Hash, description: 'Acionado por palavras específicas', color: 'bg-blue-100 text-blue-700' },
      { id: 'trigger-intent', name: 'Intenção IA', icon: Brain, description: 'Reconhece intenção com IA', color: 'bg-blue-100 text-blue-700' },
      { id: 'trigger-time', name: 'Agendamento', icon: Clock, description: 'Acionado por data/hora', color: 'bg-blue-100 text-blue-700' },
      { id: 'trigger-event', name: 'Evento', icon: Calendar, description: 'Acionado por eventos do sistema', color: 'bg-blue-100 text-blue-700' },
      { id: 'trigger-webhook', name: 'Webhook', icon: Webhook, description: 'Acionado por webhook externo', color: 'bg-blue-100 text-blue-700' },
      { id: 'trigger-button', name: 'Botão', icon: MousePointer2, description: 'Acionado por clique em botão', color: 'bg-blue-100 text-blue-700' },
      { id: 'trigger-menu', name: 'Menu', icon: Layers, description: 'Acionado por seleção de menu', color: 'bg-blue-100 text-blue-700' },
      { id: 'trigger-location', name: 'Localização', icon: Map, description: 'Acionado por localização GPS', color: 'bg-blue-100 text-blue-700' }
    ]
  },
  conditions: {
    name: 'Conditions',
    color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    icon: GitBranch,
    description: 'Lógica condicional',
    nodes: [
      { id: 'condition-text', name: 'Texto', icon: MessageSquare, description: 'Compara texto', color: 'bg-yellow-100 text-yellow-700' },
      { id: 'condition-number', name: 'Número', icon: Hash, description: 'Compara números', color: 'bg-yellow-100 text-yellow-700' },
      { id: 'condition-date', name: 'Data', icon: Calendar, description: 'Compara datas', color: 'bg-yellow-100 text-yellow-700' },
      { id: 'condition-variable', name: 'Variável', icon: Database, description: 'Compara variável', color: 'bg-yellow-100 text-yellow-700' },
      { id: 'condition-user', name: 'Usuário', icon: Users, description: 'Dados do usuário', color: 'bg-yellow-100 text-yellow-700' },
      { id: 'condition-regex', name: 'Regex', icon: Target, description: 'Padrão regex', color: 'bg-yellow-100 text-yellow-700' },
      { id: 'condition-contains', name: 'Contém', icon: Search, description: 'Contém texto', color: 'bg-yellow-100 text-yellow-700' },
      { id: 'condition-equals', name: 'Igual a', icon: CheckCircle, description: 'Valor igual', color: 'bg-yellow-100 text-yellow-700' }
    ]
  },
  actions: {
    name: 'Actions',
    color: 'bg-gradient-to-r from-green-500 to-emerald-600',
    icon: Settings,
    description: 'Ações a executar',
    nodes: [
      { id: 'action-send-text', name: 'Enviar Texto', icon: MessageSquare, description: 'Envia mensagem texto', color: 'bg-green-100 text-green-700' },
      { id: 'action-send-image', name: 'Enviar Imagem', icon: Image, description: 'Envia imagem', color: 'bg-green-100 text-green-700' },
      { id: 'action-send-audio', name: 'Enviar Áudio', icon: Mic, description: 'Envia áudio', color: 'bg-green-100 text-green-700' },
      { id: 'action-send-video', name: 'Enviar Vídeo', icon: Video, description: 'Envia vídeo', color: 'bg-green-100 text-green-700' },
      { id: 'action-set-variable', name: 'Definir Variável', icon: Database, description: 'Define variável', color: 'bg-green-100 text-green-700' },
      { id: 'action-api-call', name: 'Chamada API', icon: Globe, description: 'Chama API externa', color: 'bg-green-100 text-green-700' },
      { id: 'action-webhook', name: 'Webhook', icon: Webhook, description: 'Envia webhook', color: 'bg-green-100 text-green-700' },
      { id: 'action-create-ticket', name: 'Criar Ticket', icon: FileText, description: 'Cria ticket', color: 'bg-green-100 text-green-700' }
    ]
  },
  responses: {
    name: 'Responses',
    color: 'bg-gradient-to-r from-purple-500 to-violet-600',
    icon: MessageSquare,
    description: 'Respostas interativas',
    nodes: [
      { id: 'response-text', name: 'Texto Simples', icon: MessageSquare, description: 'Resposta em texto', color: 'bg-purple-100 text-purple-700' },
      { id: 'response-quick-reply', name: 'Resposta Rápida', icon: Zap, description: 'Botões rápidos', color: 'bg-purple-100 text-purple-700' },
      { id: 'response-menu', name: 'Menu', icon: Layers, description: 'Menu interativo', color: 'bg-purple-100 text-purple-700' },
      { id: 'response-carousel', name: 'Carrossel', icon: Shuffle, description: 'Cards deslizantes', color: 'bg-purple-100 text-purple-700' },
      { id: 'response-list', name: 'Lista', icon: FileText, description: 'Lista de opções', color: 'bg-purple-100 text-purple-700' },
      { id: 'response-form', name: 'Formulário', icon: FileText, description: 'Coleta dados', color: 'bg-purple-100 text-purple-700' },
      { id: 'response-rating', name: 'Avaliação', icon: Star, description: 'Coleta avaliação', color: 'bg-purple-100 text-purple-700' },
      { id: 'response-payment', name: 'Pagamento', icon: CreditCard, description: 'Link de pagamento', color: 'bg-purple-100 text-purple-700' }
    ]
  },
  ai: {
    name: 'AI Processing',
    color: 'bg-gradient-to-r from-pink-500 to-rose-600',
    icon: Brain,
    description: 'Processamento IA',
    nodes: [
      { id: 'ai-nlp', name: 'NLP', icon: Brain, description: 'Processamento linguagem', color: 'bg-pink-100 text-pink-700' },
      { id: 'ai-sentiment', name: 'Sentimento', icon: Brain, description: 'Análise sentimento', color: 'bg-pink-100 text-pink-700' },
      { id: 'ai-intent', name: 'Intenção', icon: Target, description: 'Reconhece intenção', color: 'bg-pink-100 text-pink-700' },
      { id: 'ai-entity', name: 'Entidades', icon: Tag, description: 'Extrai entidades', color: 'bg-pink-100 text-pink-700' },
      { id: 'ai-translation', name: 'Tradução', icon: Globe, description: 'Tradução automática', color: 'bg-pink-100 text-pink-700' },
      { id: 'ai-conversation', name: 'Chat IA', icon: MessageSquare, description: 'Chat inteligente', color: 'bg-pink-100 text-pink-700' }
    ]
  },
  flow_control: {
    name: 'Flow Control',
    color: 'bg-gradient-to-r from-gray-500 to-slate-600',
    icon: Workflow,
    description: 'Controle de fluxo',
    nodes: [
      { id: 'flow-delay', name: 'Aguardar', icon: Clock, description: 'Aguardar tempo', color: 'bg-gray-100 text-gray-700' },
      { id: 'flow-loop', name: 'Loop', icon: Repeat, description: 'Repetir ações', color: 'bg-gray-100 text-gray-700' },
      { id: 'flow-branch', name: 'Ramificar', icon: GitBranch, description: 'Dividir fluxo', color: 'bg-gray-100 text-gray-700' },
      { id: 'flow-merge', name: 'Unir', icon: GitBranch, description: 'Unir fluxos', color: 'bg-gray-100 text-gray-700' },
      { id: 'flow-switch', name: 'Switch', icon: GitBranch, description: 'Múltiplas condições', color: 'bg-gray-100 text-gray-700' },
      { id: 'flow-end', name: 'Fim', icon: Flag, description: 'Finalizar fluxo', color: 'bg-gray-100 text-gray-700' },
      { id: 'flow-transfer', name: 'Transferir', icon: Users, description: 'Transferir humano', color: 'bg-gray-100 text-gray-700' },
      { id: 'flow-fallback', name: 'Fallback', icon: AlertTriangle, description: 'Ação de fallback', color: 'bg-gray-100 text-gray-700' }
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
  data?: {
    label?: string;
    title?: string;
    description?: string;
    config?: Record<string, any>;
    isStart?: boolean;
    isEnd?: boolean;
    isEnabled?: boolean;
  };
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
  label?: string;
  data?: {
    label?: string;
    condition?: string;
    kind?: string;
    order?: number;
    isEnabled?: boolean;
  };
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
  variables?: any[];
  createdAt?: string;
  updatedAt?: string;
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

interface ModernFlowEditorProps {
  botId?: string;
  onClose?: () => void;
}

export default function ModernFlowEditor({ botId, onClose }: ModernFlowEditorProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Enhanced State Management
  const [selectedBot, setSelectedBot] = useState<ChatbotBot | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<ChatbotFlow | null>(null);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<FlowEdge | null>(null);
  
  // UI State
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<FlowNode | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null);
  
  // Canvas State
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  
  // Modal States
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState<string | null>(null);
  const [selectedNodeConfig, setSelectedNodeConfig] = useState<Record<string, any>>({});
  
  // Loading States
  const [saving, setSaving] = useState(false);
  const [flows, setFlows] = useState<ChatbotFlow[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<string | undefined>(undefined);

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

  // Flow data query
  const {
    data: flowData,
    isLoading: isLoadingFlow,
    error: flowError
  } = useQuery({
    queryKey: ['chatbot-flow-complete', selectedFlowId],
    queryFn: async () => {
      if (!selectedFlowId || selectedFlowId.startsWith('flow_')) return null;
      const response = await apiRequest('GET', `/api/omnibridge/flows/${selectedFlowId}`);
      if (!response.ok) throw new Error('Failed to fetch flow');
      return response.json();
    },
    enabled: !!selectedFlowId && !selectedFlowId.startsWith('flow_')
  });

  // Initialize bot and flows
  useEffect(() => {
    if (botData?.data) {
      setSelectedBot(botData.data);
    }
    if (botFlows?.data) {
      setFlows(botFlows.data);
      if (!selectedFlowId && botFlows.data.length > 0) {
        setSelectedFlowId(botFlows.data[0].id);
      }
    }
  }, [botData, botFlows]);

  // Load flow data
  useEffect(() => {
    if (flowData?.data) {
      const flow = flowData.data;
      setSelectedFlow(flow);
      
      // Convert nodes
      const convertedNodes = (flow.nodes || []).map((node: any) => ({
        id: node.id,
        flowId: flow.id,
        name: node.title || node.name || 'Untitled Node',
        type: node.type,
        category: node.category,
        position: node.position || { x: 0, y: 0 },
        configuration: node.config || {},
        metadata: node.metadata || {},
        isActive: node.isEnabled !== false,
        data: {
          label: node.title || node.name || 'Untitled Node',
          title: node.title || node.name || 'Untitled Node',
          description: node.description || '',
          config: node.config || {},
          isStart: node.isStart || false,
          isEnd: node.isEnd || false,
          isEnabled: node.isEnabled !== false
        }
      }));

      // Convert edges
      const convertedEdges = (flow.edges || []).map((edge: any) => ({
        id: edge.id,
        flowId: flow.id,
        sourceNodeId: edge.fromNodeId,
        targetNodeId: edge.toNodeId,
        metadata: edge.metadata || {},
        isActive: edge.isEnabled !== false,
        label: edge.label || '',
        data: {
          label: edge.label || '',
          condition: edge.condition || '',
          kind: edge.kind || 'default',
          order: edge.order || 0,
          isEnabled: edge.isEnabled !== false
        }
      }));

      setNodes(convertedNodes);
      setEdges(convertedEdges);
      
      // Store configurations for form editing
      const configs: Record<string, any> = {};
      convertedNodes.forEach(node => {
        configs[node.id] = node.configuration;
      });
      setSelectedNodeConfig(configs);
    }
  }, [flowData]);

  // Filter nodes helper
  const getFilteredNodes = useCallback((category: keyof typeof NODE_CATEGORIES) => {
    const categoryNodes = NODE_CATEGORIES[category]?.nodes || [];
    return categoryNodes.filter(node =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Helper to get node category
  const getNodeCategory = (typeId: string): string => {
    for (const [categoryKey, category] of Object.entries(NODE_CATEGORIES)) {
      if (category.nodes.some(node => node.id === typeId)) {
        return categoryKey;
      }
    }
    return 'unknown';
  };

  // Canvas interactions
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  }, [canvasOffset]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    
    if (isPanning) {
      setCanvasOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }

    // Update temp connection
    if (isConnecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setTempConnection({
        x: (e.clientX - rect.left - canvasOffset.x) / zoom,
        y: (e.clientY - rect.top - canvasOffset.y) / zoom
      });
    }
  }, [isPanning, panStart, isConnecting, canvasOffset, zoom]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    if (isConnecting) {
      setIsConnecting(false);
      setConnectionStart(null);
      setTempConnection(null);
    }
  }, [isConnecting]);

  // Node operations
  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    setDraggedNodeType(nodeType);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('nodeType', nodeType);
  };

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedNodeType || !canvasRef.current || !selectedFlow) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
    const y = (e.clientY - rect.top - canvasOffset.y) / zoom;

    // Find node data
    let nodeData = null;
    for (const category of Object.values(NODE_CATEGORIES)) {
      nodeData = category.nodes.find(n => n.id === draggedNodeType);
      if (nodeData) break;
    }

    if (!nodeData) return;

    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      flowId: selectedFlow.id,
      name: nodeData.name,
      type: draggedNodeType,
      category: getNodeCategory(draggedNodeType),
      position: { x, y },
      configuration: {},
      metadata: {},
      isActive: true,
      data: {
        label: nodeData.name,
        title: nodeData.name,
        description: nodeData.description,
        config: {},
        isStart: false,
        isEnd: false,
        isEnabled: true
      }
    };

    setNodes(prev => [...prev, newNode]);
    setDraggedNodeType(null);
    
    // Auto-save
    setTimeout(() => handleSaveFlow(), 500);
  }, [draggedNodeType, canvasRef, selectedFlow, canvasOffset, zoom]);

  const handleNodeClick = (node: FlowNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(node);
    setSelectedEdge(null);
  };

  const handleNodeDoubleClick = (node: FlowNode) => {
    setSelectedNodeForConfig(node.id);
    setShowNodeConfig(true);
  };

  const startConnection = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectionStart(nodeId);
    setIsConnecting(true);
  };

  const completeConnection = (targetNodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isConnecting && connectionStart && connectionStart !== targetNodeId) {
      const newEdge: FlowEdge = {
        id: `edge_${Date.now()}`,
        flowId: selectedFlow?.id || '',
        sourceNodeId: connectionStart,
        targetNodeId: targetNodeId,
        metadata: {},
        isActive: true,
        data: {
          label: '',
          condition: '',
          kind: 'default',
          order: 0,
          isEnabled: true
        }
      };
      
      setEdges(prev => [...prev, newEdge]);
      setTimeout(() => handleSaveFlow(), 500);
    }
    
    setIsConnecting(false);
    setConnectionStart(null);
    setTempConnection(null);
  };

  // Save flow
  const handleSaveFlow = useCallback(async () => {
    if (!selectedFlow || !selectedBot) {
      toast({
        title: "Erro",
        description: "Selecione um fluxo válido antes de salvar",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      const formattedNodes = nodes.map(node => ({
        id: node.id,
        type: node.type,
        title: node.data?.title || node.name,
        category: node.category,
        description: node.data?.description || '',
        position: node.position,
        config: { ...node.configuration, ...selectedNodeConfig[node.id] },
        isStart: node.data?.isStart || false,
        isEnd: node.data?.isEnd || false,
        isEnabled: node.data?.isEnabled !== false
      }));

      const formattedEdges = edges.map(edge => ({
        id: edge.id,
        fromNodeId: edge.sourceNodeId,
        toNodeId: edge.targetNodeId,
        label: edge.label || edge.data?.label || '',
        condition: edge.data?.condition || '',
        kind: edge.data?.kind || 'default',
        order: edge.data?.order || 0,
        isEnabled: edge.data?.isEnabled !== false
      }));

      let response;
      
      if (selectedFlow.id.startsWith('flow_')) {
        // Create new flow
        const newFlowData = {
          name: selectedFlow.name,
          description: selectedFlow.description || "Fluxo do chatbot",
          nodes: formattedNodes,
          edges: formattedEdges,
          variables: selectedFlow.variables || [],
          isActive: true
        };

        response = await apiRequest('POST', `/api/omnibridge/chatbots/${selectedBot.id}/flows`, newFlowData);
      } else {
        // Update existing flow
        const updateData = {
          name: selectedFlow.name,
          description: selectedFlow.description,
          nodes: formattedNodes,
          edges: formattedEdges,
          variables: selectedFlow.variables || [],
          isActive: selectedFlow.isActive
        };

        response = await apiRequest('PUT', `/api/omnibridge/flows/${selectedFlow.id}`, updateData);
      }

      if (!response.ok) {
        throw new Error(`Failed to save flow: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Update local state
      if (responseData?.data) {
        const updatedFlow = responseData.data;
        setSelectedFlow(updatedFlow);
        
        if (selectedFlow.id.startsWith('flow_')) {
          setSelectedFlowId(updatedFlow.id);
          setFlows(prev => [...prev.filter(f => !f.id.startsWith('flow_')), updatedFlow]);
        } else {
          setFlows(prev => prev.map(f => f.id === updatedFlow.id ? updatedFlow : f));
        }

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['chatbot-flows', selectedBot.id] });
        queryClient.invalidateQueries({ queryKey: ['chatbot-flow-complete', updatedFlow.id] });
      }

      toast({
        title: "Sucesso",
        description: "Fluxo salvo com sucesso!"
      });

    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido ao salvar o fluxo",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [selectedFlow, selectedBot, nodes, edges, selectedNodeConfig, toast, queryClient]);

  // Node configuration save
  const handleNodeConfigSave = (nodeId: string, newConfig: Record<string, any>) => {
    setSelectedNodeConfig(prev => ({
      ...prev,
      [nodeId]: newConfig
    }));
    
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId 
          ? { 
              ...node, 
              configuration: newConfig,
              data: { 
                ...node.data, 
                config: newConfig, 
                configuration: newConfig 
              } 
            } 
          : node
      )
    );
    
    setShowNodeConfig(false);
    setSelectedNodeForConfig(null);
    setTimeout(() => handleSaveFlow(), 500);
  };

  // Get node position for connections
  const getNodePosition = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;
    return {
      x: node.position.x + canvasOffset.x,
      y: node.position.y + canvasOffset.y
    };
  };

  // Render SVG path for edges
  const renderEdge = (edge: FlowEdge) => {
    const sourceNode = nodes.find(n => n.id === edge.sourceNodeId);
    const targetNode = nodes.find(n => n.id === edge.targetNodeId);
    
    if (!sourceNode || !targetNode) return null;

    const sourceX = sourceNode.position.x + 200; // Node width
    const sourceY = sourceNode.position.y + 50; // Half node height
    const targetX = targetNode.position.x;
    const targetY = targetNode.position.y + 50;

    const midX = (sourceX + targetX) / 2;
    const path = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;

    return (
      <g key={edge.id}>
        <path
          d={path}
          stroke={selectedEdge?.id === edge.id ? "#3b82f6" : "#6b7280"}
          strokeWidth={selectedEdge?.id === edge.id ? "3" : "2"}
          fill="none"
          markerEnd="url(#arrowhead)"
          className="cursor-pointer hover:stroke-blue-500"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEdge(edge);
            setSelectedNode(null);
          }}
        />
        {edge.label && (
          <text
            x={midX}
            y={(sourceY + targetY) / 2 - 10}
            textAnchor="middle"
            className="text-xs fill-gray-600 pointer-events-none"
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  };

  // Toggle category collapse
  const toggleCategory = (categoryKey: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  if (isLoadingBots || (isLoadingFlows && !botData)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando chatbot...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100" data-testid="modern-flow-editor">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900" data-testid="bot-name">
                    {selectedBot?.name || 'Flow Editor'}
                  </h1>
                  <p className="text-sm text-gray-500" data-testid="flow-name">
                    {selectedFlow?.name || 'No flow selected'} • {nodes.length} nós • {edges.length} conexões
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setZoom(1);
                  setCanvasOffset({ x: 0, y: 0 });
                }}
                data-testid="button-center-view"
              >
                <Focus className="h-4 w-4 mr-2" />
                Centralizar
              </Button>
              
              <Button
                onClick={handleSaveFlow}
                disabled={!selectedFlow || saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Enhanced Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar nós..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-nodes"
                />
              </div>
              
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
            <div className="p-4 space-y-4">
              {Object.entries(NODE_CATEGORIES).map(([categoryKey, category]) => {
                if (selectedCategory !== 'all' && selectedCategory !== categoryKey) return null;

                const filteredNodes = getFilteredNodes(categoryKey as keyof typeof NODE_CATEGORIES);
                if (filteredNodes.length === 0) return null;
                
                const isCollapsed = collapsedCategories.has(categoryKey);

                return (
                  <div key={categoryKey} className="space-y-2">
                    <div 
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleCategory(categoryKey)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded ${category.color}`}></div>
                        <category.icon className="h-4 w-4 text-gray-600" />
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        <Badge variant="secondary" className="text-xs">{filteredNodes.length}</Badge>
                      </div>
                      {isCollapsed ? 
                        <ChevronRight className="h-4 w-4 text-gray-400" /> : 
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      }
                    </div>
                    
                    <p className="text-xs text-gray-500 px-2">{category.description}</p>

                    {!isCollapsed && (
                      <div className="grid grid-cols-1 gap-2 pl-6">
                        {filteredNodes.map(node => (
                          <Card
                            key={node.id}
                            className="cursor-move hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-500"
                            draggable
                            onDragStart={(e) => handleDragStart(e, node.id)}
                            data-testid={`node-${node.id}`}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center space-x-2">
                                <div className={`p-1.5 rounded ${node.color}`}>
                                  <node.icon className="h-3 w-3" />
                                </div>
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
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Enhanced Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Canvas Controls */}
          <div className="absolute top-4 right-4 flex space-x-2 z-20">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 flex">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                data-testid="button-zoom-in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <div className="px-3 py-2 text-sm font-medium text-gray-600 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </div>
              <Separator orientation="vertical" className="h-8" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Loading indicator */}
          {isLoadingFlow && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white shadow-md rounded-lg p-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Carregando fluxo...</span>
            </div>
          )}

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="w-full h-full relative cursor-grab active:cursor-grabbing"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: '0 0'
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onDrop={handleCanvasDrop}
            onDragOver={e => e.preventDefault()}
          >
            {/* Grid Background */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
                transform: `translate(${canvasOffset.x % (40 * zoom)}px, ${canvasOffset.y % (40 * zoom)}px)`
              }}
            />

            {/* Canvas Content */}
            <div
              style={{
                transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`
              }}
            >
              {/* SVG for edges */}
              <svg
                ref={svgRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                  width: '100vw',
                  height: '100vh',
                  zIndex: 1
                }}
              >
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
                
                {/* Render edges */}
                {edges.map(edge => renderEdge(edge))}
                
                {/* Temporary connection line */}
                {isConnecting && connectionStart && tempConnection && (
                  <line
                    x1={getNodePosition(connectionStart)?.x || 0}
                    y1={getNodePosition(connectionStart)?.y || 0}
                    x2={tempConnection.x}
                    y2={tempConnection.y}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}
              </svg>

              {/* Empty State */}
              {nodes.length === 0 && !isLoadingFlow && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center bg-white p-8 rounded-xl shadow-lg border-2 border-dashed border-gray-300 max-w-md">
                    <div className="mb-4">
                      <Bot className="w-16 h-16 mx-auto text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Canvas Vazio</h3>
                    <p className="text-gray-600 mb-4">
                      Arraste um nó da paleta lateral para começar a criar seu fluxo de conversação
                    </p>
                    <div className="flex justify-center space-x-2 text-xs">
                      <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                        <Zap className="w-3 h-3 mr-1 text-blue-600" />
                        Triggers
                      </div>
                      <div className="flex items-center bg-green-50 px-3 py-1 rounded-full">
                        <MessageSquare className="w-3 h-3 mr-1 text-green-600" />
                        Ações
                      </div>
                      <div className="flex items-center bg-purple-50 px-3 py-1 rounded-full">
                        <Settings className="w-3 h-3 mr-1 text-purple-600" />
                        Respostas
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Render Nodes */}
              {nodes.map(node => {
                const nodeType = Object.values(NODE_CATEGORIES)
                  .flatMap(category => category.nodes)
                  .find(nt => nt.id === node.type);
                const IconComponent = nodeType?.icon || Bot;
                const isSelected = selectedNode?.id === node.id;

                return (
                  <div
                    key={node.id}
                    className={`absolute bg-white rounded-xl shadow-lg border-2 transition-all duration-200 cursor-move hover:shadow-xl group
                      ${isSelected ? 'border-blue-500 shadow-blue-100' : 'border-gray-200 hover:border-gray-300'}
                    `}
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      width: '200px',
                      minHeight: '100px',
                      zIndex: isSelected ? 1000 : 10
                    }}
                    onClick={(e) => handleNodeClick(node, e)}
                    onDoubleClick={() => handleNodeDoubleClick(node)}
                    data-testid={`canvas-node-${node.id}`}
                  >
                    {/* Node Header */}
                    <div className={`p-3 rounded-t-xl ${nodeType?.color || 'bg-gray-100'} border-b border-gray-200`}>
                      <div className="flex items-center space-x-2">
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm font-semibold truncate">
                          {node.data?.title || node.name}
                        </span>
                      </div>
                    </div>

                    {/* Node Body */}
                    <div className="p-3">
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {node.data?.description || nodeType?.description || 'No description'}
                      </div>
                      
                      {/* Configuration indicator */}
                      {Object.keys(selectedNodeConfig[node.id] || {}).length > 0 && (
                        <div className="mt-2 flex items-center space-x-1">
                          <Settings className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">Configurado</span>
                        </div>
                      )}
                    </div>

                    {/* Connection Points */}
                    <div
                      className={`absolute -left-2 top-1/2 w-4 h-4 rounded-full cursor-pointer transition-all duration-200 z-20
                        ${isConnecting && connectionStart === node.id
                          ? 'bg-yellow-400 border-2 border-yellow-600 scale-125'
                          : 'bg-blue-500 hover:bg-blue-600 hover:scale-110'
                        }`}
                      style={{ transform: 'translateY(-50%)' }}
                      onClick={(e) => startConnection(node.id, e)}
                      title="Entrada - Clique para conectar"
                    />
                    
                    <div
                      className={`absolute -right-2 top-1/2 w-4 h-4 rounded-full cursor-pointer transition-all duration-200 z-20
                        ${isConnecting && connectionStart !== node.id
                          ? 'bg-yellow-400 border-2 border-yellow-600 scale-125'
                          : 'bg-green-500 hover:bg-green-600 hover:scale-110'
                        }`}
                      style={{ transform: 'translateY(-50%)' }}
                      onClick={(e) => completeConnection(node.id, e)}
                      title="Saída - Clique para conectar"
                    />

                    {/* Delete button on hover */}
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-6 h-6 p-0 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNodes(prev => prev.filter(n => n.id !== node.id));
                          setEdges(prev => prev.filter(e => e.sourceNodeId !== node.id && e.targetNodeId !== node.id));
                          setTimeout(() => handleSaveFlow(), 500);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Node Configuration Modal */}
      <Dialog open={showNodeConfig} onOpenChange={(open) => {
        setShowNodeConfig(open);
        if (!open) {
          setSelectedNodeForConfig(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="node-config-modal">
          <DialogHeader>
            <DialogTitle>
              Configurar Nó: {selectedNode?.name}
            </DialogTitle>
            <DialogDescription>
              Configure as propriedades e comportamento para este nó {selectedNode?.category}.
            </DialogDescription>
          </DialogHeader>

          {selectedNodeForConfig && (
            <NodeConfigForm
              nodeId={selectedNodeForConfig}
              nodeType={nodes.find(n => n.id === selectedNodeForConfig)?.type || ''}
              currentConfig={
                selectedNodeConfig[selectedNodeForConfig] ||
                nodes.find(n => n.id === selectedNodeForConfig)?.configuration ||
                {}
              }
              onSave={handleNodeConfigSave}
              onCancel={() => {
                setShowNodeConfig(false);
                setSelectedNodeForConfig(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}