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
  RotateCcw, ChevronRight, ChevronDown, Focus, Maximize2, Minimize2,
  Hand
} from 'lucide-react';
import NodeConfigForm from './NodeConfigForm';

// ReactFlow-inspired interfaces
interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    title?: string;
    description?: string;
    config?: Record<string, any>;
    nodeType?: string;
    category?: string;
    isStart?: boolean;
    isEnd?: boolean;
    isEnabled?: boolean;
  };
  selected?: boolean;
  dragging?: boolean;
}

interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  label?: string;
  animated?: boolean;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  labelBgStyle?: React.CSSProperties;
  data?: {
    condition?: string;
    kind?: string;
    order?: number;
    isEnabled?: boolean;
  };
}

interface Connection {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// Enhanced Node Categories following ReactFlow patterns
const NODE_CATEGORIES = {
  triggers: {
    name: 'Triggers',
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    icon: Zap,
    description: 'Inicializadores do fluxo',
    nodes: [
      { id: 'trigger-keyword', name: 'Palavra-chave', icon: Hash, description: 'Acionado por palavras específicas', color: 'bg-blue-50 border-blue-200 text-blue-700' },
      { id: 'trigger-intent', name: 'Intenção IA', icon: Brain, description: 'Reconhece intenção com IA', color: 'bg-blue-50 border-blue-200 text-blue-700' },
      { id: 'trigger-time', name: 'Agendamento', icon: Clock, description: 'Acionado por data/hora', color: 'bg-blue-50 border-blue-200 text-blue-700' },
      { id: 'trigger-event', name: 'Evento', icon: Calendar, description: 'Acionado por eventos do sistema', color: 'bg-blue-50 border-blue-200 text-blue-700' },
      { id: 'trigger-webhook', name: 'Webhook', icon: Webhook, description: 'Acionado por webhook externo', color: 'bg-blue-50 border-blue-200 text-blue-700' },
      { id: 'trigger-button', name: 'Botão', icon: MousePointer2, description: 'Acionado por clique em botão', color: 'bg-blue-50 border-blue-200 text-blue-700' }
    ]
  },
  conditions: {
    name: 'Conditions',
    color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    icon: GitBranch,
    description: 'Lógica condicional',
    nodes: [
      { id: 'condition-text', name: 'Texto', icon: MessageSquare, description: 'Compara texto', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
      { id: 'condition-number', name: 'Número', icon: Hash, description: 'Compara números', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
      { id: 'condition-variable', name: 'Variável', icon: Database, description: 'Compara variável', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
      { id: 'condition-user', name: 'Usuário', icon: Users, description: 'Dados do usuário', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' }
    ]
  },
  actions: {
    name: 'Actions',
    color: 'bg-gradient-to-r from-green-500 to-emerald-600',
    icon: Settings,
    description: 'Ações a executar',
    nodes: [
      { id: 'action-send-text', name: 'Enviar Texto', icon: MessageSquare, description: 'Envia mensagem texto', color: 'bg-green-50 border-green-200 text-green-700' },
      { id: 'action-send-image', name: 'Enviar Imagem', icon: Image, description: 'Envia imagem', color: 'bg-green-50 border-green-200 text-green-700' },
      { id: 'action-api-call', name: 'Chamada API', icon: Globe, description: 'Chama API externa', color: 'bg-green-50 border-green-200 text-green-700' },
      { id: 'action-set-variable', name: 'Definir Variável', icon: Database, description: 'Define variável', color: 'bg-green-50 border-green-200 text-green-700' }
    ]
  },
  responses: {
    name: 'Responses',
    color: 'bg-gradient-to-r from-purple-500 to-violet-600',
    icon: MessageSquare,
    description: 'Respostas interativas',
    nodes: [
      { id: 'response-text', name: 'Texto Simples', icon: MessageSquare, description: 'Resposta em texto', color: 'bg-purple-50 border-purple-200 text-purple-700' },
      { id: 'response-quick-reply', name: 'Resposta Rápida', icon: Zap, description: 'Botões rápidos', color: 'bg-purple-50 border-purple-200 text-purple-700' },
      { id: 'response-menu', name: 'Menu', icon: Layers, description: 'Menu interativo', color: 'bg-purple-50 border-purple-200 text-purple-700' },
      { id: 'response-form', name: 'Formulário', icon: FileText, description: 'Coleta dados', color: 'bg-purple-50 border-purple-200 text-purple-700' }
    ]
  },
  ai: {
    name: 'AI Processing',
    color: 'bg-gradient-to-r from-pink-500 to-rose-600',
    icon: Brain,
    description: 'Processamento IA',
    nodes: [
      { id: 'ai-nlp', name: 'NLP', icon: Brain, description: 'Processamento linguagem', color: 'bg-pink-50 border-pink-200 text-pink-700' },
      { id: 'ai-sentiment', name: 'Sentimento', icon: Brain, description: 'Análise sentimento', color: 'bg-pink-50 border-pink-200 text-pink-700' },
      { id: 'ai-intent', name: 'Intenção', icon: Target, description: 'Reconhece intenção', color: 'bg-pink-50 border-pink-200 text-pink-700' },
      { id: 'ai-conversation', name: 'Chat IA', icon: MessageSquare, description: 'Chat inteligente', color: 'bg-pink-50 border-pink-200 text-pink-700' }
    ]
  },
  flow_control: {
    name: 'Flow Control',
    color: 'bg-gradient-to-r from-gray-500 to-slate-600',
    icon: Workflow,
    description: 'Controle de fluxo',
    nodes: [
      { id: 'flow-delay', name: 'Aguardar', icon: Clock, description: 'Aguardar tempo', color: 'bg-gray-50 border-gray-200 text-gray-700' },
      { id: 'flow-branch', name: 'Ramificar', icon: GitBranch, description: 'Dividir fluxo', color: 'bg-gray-50 border-gray-200 text-gray-700' },
      { id: 'flow-end', name: 'Fim', icon: Flag, description: 'Finalizar fluxo', color: 'bg-gray-50 border-gray-200 text-gray-700' },
      { id: 'flow-transfer', name: 'Transferir', icon: Users, description: 'Transferir humano', color: 'bg-gray-50 border-gray-200 text-gray-700' }
    ]
  }
};

interface ChatbotFlow {
  id: string;
  botId: string;
  name: string;
  description?: string;
  isActive: boolean;
  isMain: boolean;
  version: number;
  metadata: Record<string, any>;
  nodes?: any[];
  edges?: any[];
  settings?: Record<string, any>;
  variables?: any[];
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

interface ReactFlowEditorProps {
  botId?: string;
  onClose?: () => void;
}

export default function ReactFlowEditor({ botId, onClose }: ReactFlowEditorProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);

  // ReactFlow State
  const [nodes, setNodes] = useState<ReactFlowNode[]>([]);
  const [edges, setEdges] = useState<ReactFlowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ReactFlowEdge | null>(null);

  // Bot and Flow State
  const [selectedBot, setSelectedBot] = useState<ChatbotBot | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<ChatbotFlow | null>(null);
  const [flows, setFlows] = useState<ChatbotFlow[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<string | undefined>(undefined);

  // Interaction State
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionNodeId, setConnectionNodeId] = useState<string | null>(null);
  const [reactFlowInstance_, setReactFlowInstance] = useState<any>(null);

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState<string | null>(null);
  const [selectedNodeConfig, setSelectedNodeConfig] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Canvas interaction state
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Queries
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

  // Load flow data and convert to ReactFlow format
  useEffect(() => {
    if (flowData?.data) {
      const flow = flowData.data;
      setSelectedFlow(flow);
      
      // Convert nodes to ReactFlow format
      const reactFlowNodes: ReactFlowNode[] = (flow.nodes || []).map((node: any) => {
        // Find the node type data from NODE_CATEGORIES
        let nodeTypeData = null;
        for (const category of Object.values(NODE_CATEGORIES)) {
          nodeTypeData = category.nodes.find(n => n.id === node.type);
          if (nodeTypeData) break;
        }
        
        return {
          id: node.id,
          type: 'custom',
          position: node.position || { x: 0, y: 0 },
          data: {
            label: nodeTypeData?.name || node.title || node.name || 'Untitled Node',
            title: nodeTypeData?.name || node.title || node.name || 'Untitled Node',
            description: nodeTypeData?.description || node.description || 'No description',
            config: node.config || {},
            nodeType: node.type,
            category: node.category || getNodeCategory(node.type),
            isStart: node.isStart || false,
            isEnd: node.isEnd || false,
            isEnabled: node.isEnabled !== false
          },
          selected: false,
          dragging: false
        };
      });

      // Convert edges to ReactFlow format
      const reactFlowEdges: ReactFlowEdge[] = (flow.edges || []).map((edge: any) => ({
        id: edge.id,
        source: edge.fromNodeId,
        target: edge.toNodeId,
        type: 'smoothstep',
        label: edge.label || '',
        animated: false,
        style: { stroke: '#6b7280', strokeWidth: 2 },
        labelStyle: { fontSize: 12, fontWeight: 600 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
        data: {
          condition: edge.condition || '',
          kind: edge.kind || 'default',
          order: edge.order || 0,
          isEnabled: edge.isEnabled !== false
        }
      }));

      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
      
      // Store configurations for form editing
      const configs: Record<string, any> = {};
      reactFlowNodes.forEach(node => {
        configs[node.id] = node.data.config || {};
      });
      setSelectedNodeConfig(configs);
    }
  }, [flowData]);

  // ReactFlow event handlers
  const onNodesChange = useCallback((changes: any[]) => {
    setNodes((nds) => {
      return nds.map(node => {
        const change = changes.find(c => c.id === node.id);
        if (change) {
          if (change.type === 'position' && change.position) {
            return { ...node, position: change.position, dragging: change.dragging };
          }
          if (change.type === 'select') {
            return { ...node, selected: change.selected };
          }
        }
        return node;
      });
    });
  }, []);

  const onEdgesChange = useCallback((changes: any[]) => {
    setEdges((eds) => {
      return eds.filter(edge => {
        const change = changes.find(c => c.id === edge.id);
        return !(change && change.type === 'remove');
      });
    });
  }, []);

  // Save flow function - defined early before any usage  
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
        type: node.data.nodeType || 'unknown',
        title: node.data.title || node.data.label,
        category: node.data.category || 'unknown',
        description: node.data.description || '',
        position: node.position,
        config: { ...node.data.config, ...selectedNodeConfig[node.id] },
        isStart: node.data.isStart || false,
        isEnd: node.data.isEnd || false,
        isEnabled: node.data.isEnabled !== false
      }));

      const formattedEdges = edges.map(edge => ({
        id: edge.id,
        fromNodeId: edge.source,
        toNodeId: edge.target,
        label: edge.label || '',
        condition: edge.data?.condition || '',
        kind: edge.data?.kind || 'default',
        order: edge.data?.order || 0,
        isEnabled: edge.data?.isEnabled !== false
      }));

      let response;
      
      if (selectedFlow.id.startsWith('flow_')) {
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
      
      if (responseData?.data) {
        const updatedFlow = responseData.data;
        setSelectedFlow(updatedFlow);
        
        if (selectedFlow.id.startsWith('flow_')) {
          setSelectedFlowId(updatedFlow.id);
          setFlows(prev => [...prev.filter(f => !f.id.startsWith('flow_')), updatedFlow]);
        } else {
          setFlows(prev => prev.map(f => f.id === updatedFlow.id ? updatedFlow : f));
        }

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

  const onConnect = useCallback((connection: Connection) => {
    const newEdge: ReactFlowEdge = {
      id: `edge_${Date.now()}_${Math.random()}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      data: {
        condition: '',
        kind: 'default',
        order: 0,
        isEnabled: true
      }
    };
    
    setEdges((eds) => [...eds, newEdge]);
    
    // Auto-save after connection
    setTimeout(() => handleSaveFlow(), 500);
  }, [handleSaveFlow]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: ReactFlowNode) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setNodes(nds => nds.map(n => ({ ...n, selected: n.id === node.id })));
  }, []);

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: ReactFlowNode) => {
    setSelectedNodeForConfig(node.id);
    setShowNodeConfig(true);
  }, []);

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: ReactFlowEdge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  // Add node to canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    
    // Visual feedback for valid drop area
    const target = event.currentTarget as HTMLElement;
    target.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    const target = event.currentTarget as HTMLElement;
    target.style.backgroundColor = '';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    console.log('🔥 [DROP] Evento de drop triggered');

    // Remove visual feedback
    const target = event.currentTarget as HTMLElement;
    target.style.backgroundColor = '';

    const nodeType = event.dataTransfer.getData('application/reactflow');
    console.log('🔥 [DROP] Tipo de nó obtido:', nodeType);
    
    if (!nodeType || !reactFlowWrapper.current || !selectedFlow) {
      console.warn('⚠️ [DROP] Condições não atendidas:', { nodeType, hasWrapper: !!reactFlowWrapper.current, hasFlow: !!selectedFlow });
      return;
    }

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = {
      x: (event.clientX - reactFlowBounds.left - viewport.x) / viewport.zoom,
      y: (event.clientY - reactFlowBounds.top - viewport.y) / viewport.zoom,
    };

    console.log('🔥 [DROP] Posição calculada:', position);

    // Find node data
    let nodeData = null;
    for (const category of Object.values(NODE_CATEGORIES)) {
      nodeData = category.nodes.find(n => n.id === nodeType);
      if (nodeData) break;
    }

    if (!nodeData) {
      console.warn('⚠️ [DROP] Dados do nó não encontrados para tipo:', nodeType);
      return;
    }

    console.log('🔥 [DROP] Dados do nó encontrados:', nodeData);

    const newNode: ReactFlowNode = {
      id: `node_${Date.now()}_${Math.random()}`,
      type: 'custom',
      position,
      data: {
        label: nodeData.name,
        title: nodeData.name,
        description: nodeData.description,
        config: {},
        nodeType: nodeType,
        category: getNodeCategory(nodeType),
        isStart: nodeType.includes('trigger'),
        isEnd: nodeType.includes('end'),
        isEnabled: true
      },
      selected: false,
      dragging: false
    };

    console.log('🔥 [DROP] Novo nó criado:', newNode);
    setNodes((nds) => {
      const updatedNodes = [...nds, newNode];
      console.log('🔥 [DROP] Nodes atualizados, total:', updatedNodes.length);
      return updatedNodes;
    });
    
    // Save flow after a short delay
    setTimeout(() => handleSaveFlow(), 500);
  }, [reactFlowWrapper, viewport, selectedFlow, handleSaveFlow]);

  // Helper functions
  const getNodeCategory = (typeId: string): string => {
    for (const [categoryKey, category] of Object.entries(NODE_CATEGORIES)) {
      if (category.nodes.some(node => node.id === typeId)) {
        return categoryKey;
      }
    }
    return 'unknown';
  };

  const getFilteredNodes = useCallback((category: keyof typeof NODE_CATEGORIES) => {
    const categoryNodes = NODE_CATEGORIES[category]?.nodes || [];
    return categoryNodes.filter(node =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);


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
              data: { 
                ...node.data, 
                config: newConfig
              } 
            } 
          : node
      )
    );
    
    setShowNodeConfig(false);
    setSelectedNodeForConfig(null);
    setTimeout(() => handleSaveFlow(), 500);
  };


  // Custom Node Component
  const CustomNode = ({ data, selected, id }: { data: any; selected: boolean; id: string }) => {
    const nodeType = Object.values(NODE_CATEGORIES)
      .flatMap(category => category.nodes)
      .find(nt => nt.id === data.nodeType);
    const IconComponent = nodeType?.icon || Bot;
    
    // Get category for styling
    const categoryKey = Object.keys(NODE_CATEGORIES).find(key => 
      NODE_CATEGORIES[key as keyof typeof NODE_CATEGORIES].nodes.some(n => n.id === data.nodeType)
    );
    const category = categoryKey ? NODE_CATEGORIES[categoryKey as keyof typeof NODE_CATEGORIES] : null;

    return (
      <div
        className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-200 min-w-[200px] ${
          selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200 hover:border-gray-300'
        }`}
        data-testid={`react-flow-node-${id}`}
      >
        {/* Node Header */}
        <div className={`p-3 rounded-t-xl ${nodeType?.color || 'bg-gray-50'} border-b border-gray-200`}>
          <div className="flex items-center space-x-2">
            <IconComponent className="h-4 w-4" />
            <span className="text-sm font-semibold truncate">
              {data.title || data.label || nodeType?.name || 'Untitled Node'}
            </span>
          </div>
          {/* Category badge */}
          {category && (
            <div className="mt-1">
              <Badge variant="secondary" className="text-xs">
                {category.name}
              </Badge>
            </div>
          )}
        </div>

        {/* Node Body */}
        <div className="p-3">
          <div className="text-xs text-gray-600 line-clamp-2">
            {data.description || nodeType?.description || 'No description'}
          </div>
          
          {/* Configuration indicator */}
          {Object.keys(selectedNodeConfig[id] || data.config || {}).length > 0 && (
            <div className="mt-2 flex items-center space-x-1">
              <Settings className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">Configurado</span>
            </div>
          )}
          
          {/* Special indicators */}
          <div className="mt-2 flex items-center space-x-2">
            {data.isStart && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                Início
              </Badge>
            )}
            {data.isEnd && (
              <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                Fim
              </Badge>
            )}
          </div>
        </div>

        {/* Handles */}
        <div className="absolute -left-2 top-1/2 w-4 h-4 bg-blue-500 rounded-full transform -translate-y-1/2" />
        <div className="absolute -right-2 top-1/2 w-4 h-4 bg-green-500 rounded-full transform -translate-y-1/2" />
      </div>
    );
  };

  // Drag start for node palette
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    console.log('🔥 [DRAG-START] Iniciando drag do nó:', nodeType);
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'copy';
    
    // Visual feedback
    const target = event.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
    
    // Create drag image
    const rect = target.getBoundingClientRect();
    const dragImage = target.cloneNode(true) as HTMLElement;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    dragImage.style.pointerEvents = 'none';
    document.body.appendChild(dragImage);
    
    event.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2);
    
    setTimeout(() => {
      if (dragImage.parentNode) {
        dragImage.parentNode.removeChild(dragImage);
      }
    }, 0);
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100" data-testid="react-flow-editor">
      {/* Header */}
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
                    {selectedBot?.name || 'ReactFlow Editor'}
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
                onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}
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
        {/* Left Sidebar - Node Palette */}
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

                return (
                  <div key={categoryKey} className="space-y-2">
                    <div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
                      <div className={`w-3 h-3 rounded ${category.color}`}></div>
                      <category.icon className="h-4 w-4 text-gray-600" />
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      <Badge variant="secondary" className="text-xs">{filteredNodes.length}</Badge>
                    </div>
                    
                    <p className="text-xs text-gray-500 px-2">{category.description}</p>

                    <div className="grid grid-cols-1 gap-2">
                      {filteredNodes.map(node => (
                        <div
                          key={node.id}
                          className="cursor-grab hover:cursor-grabbing hover:shadow-md transition-all duration-200 rounded-lg select-none"
                          draggable={true}
                          onDragStart={(e) => onDragStart(e, node.id)}
                          onDragEnd={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                          data-testid={`node-palette-${node.id}`}
                        >
                          <Card className={`border-l-4 border-l-transparent hover:border-l-blue-500 ${node.color} transition-colors duration-200`}>
                            <CardContent className="p-3">
                              <div className="flex items-center space-x-2">
                                <node.icon className="h-4 w-4" />
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium truncate">
                                    {node.name}
                                  </div>
                                  <div className="text-xs opacity-70 truncate">
                                    {node.description}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* ReactFlow Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          {/* Canvas Controls */}
          <div className="absolute top-4 right-4 flex space-x-2 z-20">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 flex">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewport(prev => ({ ...prev, zoom: Math.min(2, prev.zoom * 1.1) }))}
                data-testid="button-zoom-in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <div className="px-3 py-2 text-sm font-medium text-gray-600 min-w-[60px] text-center">
                {Math.round(viewport.zoom * 100)}%
              </div>
              <Separator orientation="vertical" className="h-8" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewport(prev => ({ ...prev, zoom: Math.max(0.5, prev.zoom * 0.9) }))}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ReactFlow Viewport */}
          <div
            className="w-full h-full relative bg-gray-50 overflow-hidden border-2 border-dashed border-transparent transition-colors duration-200"
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            data-testid="reactflow-canvas"
          >
            {/* Grid Background */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: `${40 * viewport.zoom}px ${40 * viewport.zoom}px`,
                transform: `translate(${viewport.x % (40 * viewport.zoom)}px, ${viewport.y % (40 * viewport.zoom)}px)`
              }}
            />

            {/* Canvas Content */}
            <div
              style={{
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                transformOrigin: '0 0'
              }}
            >
              {/* Empty State */}
              {nodes.length === 0 && !isLoadingFlow && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center bg-white p-8 rounded-xl shadow-lg border-2 border-dashed border-gray-300 max-w-md">
                    <div className="mb-4">
                      <Workflow className="w-16 h-16 mx-auto text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Editor ReactFlow</h3>
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
                    </div>
                  </div>
                </div>
              )}

              {/* SVG for edges */}
              <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                  </marker>
                </defs>
                
                {edges.map(edge => {
                  const sourceNode = nodes.find(n => n.id === edge.source);
                  const targetNode = nodes.find(n => n.id === edge.target);
                  
                  if (!sourceNode || !targetNode) return null;

                  const sourceX = sourceNode.position.x + 200;
                  const sourceY = sourceNode.position.y + 50;
                  const targetX = targetNode.position.x;
                  const targetY = targetNode.position.y + 50;

                  const midX = (sourceX + targetX) / 2;
                  const path = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;

                  return (
                    <path
                      key={edge.id}
                      d={path}
                      stroke={edge.style?.stroke || "#6b7280"}
                      strokeWidth={edge.style?.strokeWidth || 2}
                      fill="none"
                      markerEnd="url(#arrowhead)"
                      className="cursor-pointer hover:stroke-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdgeClick(e as any, edge);
                      }}
                    />
                  );
                })}
              </svg>

              {/* Render Nodes */}
              {nodes.map(node => (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: node.position.x,
                    top: node.position.y,
                    cursor: node.dragging ? 'grabbing' : 'grab'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNodeClick(e as any, node);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onNodeDoubleClick(e as any, node);
                  }}
                >
                  <CustomNode data={node.data} selected={node.selected || false} id={node.id} />
                </div>
              ))}
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
              Configurar Nó: {selectedNode?.data?.title}
            </DialogTitle>
            <DialogDescription>
              Configure as propriedades e comportamento para este nó {selectedNode?.data?.category}.
            </DialogDescription>
          </DialogHeader>

          {selectedNodeForConfig && (
            <NodeConfigForm
              nodeId={selectedNodeForConfig}
              nodeType={nodes.find(n => n.id === selectedNodeForConfig)?.data?.nodeType || ''}
              currentConfig={
                selectedNodeConfig[selectedNodeForConfig] ||
                nodes.find(n => n.id === selectedNodeForConfig)?.data?.config ||
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