import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  NodeTypes,
  Panel,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

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

interface FlowEditorProps {
  botId?: string;
  onClose?: () => void;
}

// Custom Node Component
const CustomNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const categoryInfo = Object.values(NODE_CATEGORIES).find(cat => 
    cat.nodes.some(node => node.id === data.nodeType)
  );
  const nodeInfo = categoryInfo?.nodes.find(node => node.id === data.nodeType);
  const IconComponent = nodeInfo?.icon || Bot;

  return (
    <Card 
      className={`min-w-[200px] shadow-md transition-all ${
        selected ? 'ring-2 ring-blue-500 shadow-lg' : ''
      } ${data.isStart ? 'ring-2 ring-green-500' : ''}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${categoryInfo?.color || 'bg-gray-500'}`}>
            <IconComponent className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm font-semibold truncate">
              {data.label || 'Untitled Node'}
            </CardTitle>
            {nodeInfo && (
              <Badge variant="secondary" className="text-xs mt-1">
                {categoryInfo?.name}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {nodeInfo && (
          <p className="text-xs text-muted-foreground">
            {nodeInfo.description}
          </p>
        )}
        {data.isStart && (
          <Badge variant="outline" className="text-xs mt-2">
            <Zap className="w-3 h-3 mr-1" />
            Start
          </Badge>
        )}
        {data.isEnd && (
          <Badge variant="outline" className="text-xs mt-2">
            <Flag className="w-3 h-3 mr-1" />
            End
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

function FlowEditor({ botId, onClose }: FlowEditorProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [selectedBot, setSelectedBot] = useState<ChatbotBot | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<ChatbotFlow | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [variables, setVariables] = useState<any[]>([]);
  const [flows, setFlows] = useState<ChatbotFlow[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [selectedNodeConfig, setSelectedNodeConfig] = useState<Record<string, any>>({});
  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // State for the selected flow ID to trigger the query
  const [selectedFlowId, setSelectedFlowId] = useState<string | undefined>(undefined);
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotBot | null>(null);

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
      if (!selectedFlowId || !selectedChatbot?.id) return null;

      try {
        const url = `/api/omnibridge/flows/${selectedFlowId}`;
        const response = await apiRequest('GET', url);

        if (!response.ok) {
          throw new Error(`Failed to fetch flow: ${response.status}`);
        }

        const data = await response.json();
        return data.data;
      } catch (error) {
        console.error('Error fetching flow:', error);
        throw error;
      }
    },
    enabled: !!selectedFlowId && !selectedFlowId.startsWith('flow_') && !!selectedChatbot?.id,
    retry: 2,
    staleTime: 30000
  });

  // Initialize selectedBot and flows state
  useEffect(() => {
    if (botData?.data) {
      setSelectedBot(botData.data);
      setSelectedChatbot(botData.data);
    }
    if (botFlows?.data) {
      setFlows(botFlows.data);
      if (!selectedFlowId && botFlows.data.length > 0) {
        setSelectedFlowId(botFlows.data[0].id);
      }
    }
  }, [botData, botFlows]);

  // Effect to load complete flow data when selectedFlowId changes
  useEffect(() => {
    if (completeFlowData && !isLoadingCompleteFlow) {
      // Convert database nodes to ReactFlow format
      const reactFlowNodes: Node[] = (completeFlowData.nodes || []).map((node: any) => {
        const nodeConfig = node.config || {};

        setSelectedNodeConfig(prev => ({
          ...prev,
          [node.id]: nodeConfig
        }));

        return {
          id: node.id,
          type: 'custom',
          position: node.position || { x: 0, y: 0 },
          data: {
            label: node.title || node.name || 'Untitled Node',
            title: node.title || node.name || 'Untitled Node',
            nodeType: node.type,
            category: node.category,
            description: node.description,
            config: nodeConfig,
            configuration: nodeConfig,
            isStart: node.isStart || false,
            isEnd: node.isEnd !== false,
            isEnabled: node.isEnabled !== false
          }
        };
      });

      // Convert database edges to ReactFlow format
      const reactFlowEdges: Edge[] = (completeFlowData.edges || []).map((edge: any) => ({
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

      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
    } else if (!selectedFlowId || selectedFlowId.startsWith('flow_')) {
      setNodes([]);
      setEdges([]);
    }
  }, [completeFlowData, isLoadingCompleteFlow, selectedFlowId, setNodes, setEdges]);

  // Initialize with first flow if available or create a default one
  useEffect(() => {
    if (botId && selectedBot) {
      if (flows.length > 0) {
        if (selectedFlow) {
          const currentFlowStillExists = flows.find(f => f.id === selectedFlow.id);
          if (currentFlowStillExists) {
            if (JSON.stringify(selectedFlow) !== JSON.stringify(currentFlowStillExists)) {
              setSelectedFlow(currentFlowStillExists);
            }
          } else {
            setSelectedFlow(flows[0]);
            setSelectedFlowId(flows[0].id);
          }
        } else {
          setSelectedFlow(flows[0]);
          setSelectedFlowId(flows[0].id);
        }
      } else {
        // Create a default temporary flow
        const defaultFlow: ChatbotFlow = {
          id: `flow_${Date.now()}`,
          botId: selectedBot.id,
          name: 'Fluxo Principal',
          description: 'Fluxo padrão do chatbot',
          isActive: true,
          isMain: true,
          version: 1,
          metadata: {},
          nodes: [],
          edges: [],
          variables: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setSelectedFlow(defaultFlow);
        setSelectedFlowId(defaultFlow.id);
        setFlows([defaultFlow]);
      }
    }
  }, [botId, selectedBot, flows, selectedFlow, selectedFlowId]);

  // Handle connection between nodes
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setSelectedNodeForConfig(node.id);
    setShowNodeConfig(true);
  }, []);

  // Handle drag over for node palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop from node palette
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const nodeData = JSON.parse(type);
      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: nodeData.name,
          title: nodeData.name,
          nodeType: nodeData.id,
          category: nodeData.category,
          description: nodeData.description,
          config: {},
          isStart: false,
          isEnd: false,
          isEnabled: true
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  // Handle drag start from node palette
  const onDragStart = (event: React.DragEvent, nodeType: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Save flow mutation
  const saveFlowMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFlow || !selectedBot) return;

      setSaving(true);

      const flowData = {
        name: selectedFlow.name,
        description: selectedFlow.description,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.data.nodeType || 'custom',
          title: node.data.title || 'Untitled Node',
          category: node.data.category || 'custom',
          description: node.data.description || '',
          position: node.position,
          config: selectedNodeConfig[node.id] || {},
          isStart: node.data.isStart || false,
          isEnd: node.data.isEnd || false,
          isEnabled: node.data.isEnabled !== false
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          fromNodeId: edge.source,
          toNodeId: edge.target,
          label: edge.label || '',
          condition: edge.data?.condition || '',
          kind: edge.data?.kind || 'default',
          order: edge.data?.order || 0,
          isEnabled: edge.data?.isEnabled !== false
        })),
        variables: variables || []
      };

      let response;
      if (selectedFlowId && !selectedFlowId.startsWith('flow_')) {
        // Update existing flow
        response = await apiRequest('PUT', `/api/omnibridge/flows/${selectedFlowId}`, flowData);
      } else {
        // Create new flow
        response = await apiRequest('POST', `/api/omnibridge/chatbots/${selectedBot.id}/flows`, flowData);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save flow: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Fluxo salvo com sucesso!",
      });

      if (data?.data) {
        // Update flow data
        const savedFlow = data.data;
        setSelectedFlow(savedFlow);
        setSelectedFlowId(savedFlow.id);

        // Update flows list
        setFlows(prev => {
          const existingIndex = prev.findIndex(f => f.id === savedFlow.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = savedFlow;
            return updated;
          }
          return [...prev, savedFlow];
        });
      }

      queryClient.invalidateQueries({ queryKey: ['chatbot-flows', botId] });
      queryClient.invalidateQueries({ queryKey: ['chatbot-flow-complete'] });
    },
    onError: (error: any) => {
      console.error('Save flow error:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar fluxo",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setSaving(false);
    }
  });

  // Filter nodes based on search and category
  const filteredNodes = Object.entries(NODE_CATEGORIES).reduce((acc, [categoryKey, category]) => {
    if (selectedCategory !== 'all' && selectedCategory !== categoryKey) return acc;

    const filteredCategoryNodes = category.nodes.filter(node =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredCategoryNodes.length > 0) {
      acc[categoryKey] = { ...category, nodes: filteredCategoryNodes };
    }

    return acc;
  }, {} as typeof NODE_CATEGORIES);

  return (
    <div className="h-screen flex">
      {/* Left Sidebar - Node Palette */}
      <div className="w-80 border-r bg-background flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-4">Componentes do Fluxo</h2>

          <div className="space-y-2">
            <Input
              placeholder="Buscar componentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
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
            {Object.entries(filteredNodes).map(([categoryKey, category]) => (
              <div key={categoryKey}>
                <div className="flex items-center gap-2 mb-2">
                  <category.icon className="w-4 h-4" />
                  <h3 className="font-medium text-sm">{category.name}</h3>
                </div>

                <div className="grid gap-2">
                  {category.nodes.map((node) => {
                    const IconComponent = node.icon;
                    return (
                      <div
                        key={node.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, { ...node, category: categoryKey })}
                        className="flex items-center gap-2 p-2 rounded border cursor-grab hover:bg-accent transition-colors"
                      >
                        <div className={`p-1 rounded ${category.color}`}>
                          <IconComponent className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{node.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {node.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-16 border-b bg-background flex items-center px-4 gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <h1 className="text-lg font-semibold">
              {selectedBot?.name || 'Flow Editor'}
            </h1>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Select
              value={selectedFlowId || ''}
              onValueChange={(value) => {
                const flow = flows.find(f => f.id === value);
                if (flow) {
                  setSelectedFlow(flow);
                  setSelectedFlowId(value);
                }
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecionar fluxo" />
              </SelectTrigger>
              <SelectContent>
                {flows.map((flow) => (
                  <SelectItem key={flow.id} value={flow.id}>
                    {flow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => saveFlowMutation.mutate()}
              disabled={saving}
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <div className="flex-1 bg-gray-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />

            <Panel position="top-left" className="bg-white p-2 rounded shadow">
              <div className="text-sm text-muted-foreground">
                Arraste componentes da paleta para criar seu fluxo
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Node Configuration Dialog */}
      <Dialog open={showNodeConfig} onOpenChange={setShowNodeConfig}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Nó</DialogTitle>
            <DialogDescription>
              Configure as propriedades do nó selecionado
            </DialogDescription>
          </DialogHeader>

          {selectedNodeForConfig && (
            <NodeConfigForm
              nodeId={selectedNodeForConfig}
              nodeData={nodes.find(n => n.id === selectedNodeForConfig)?.data}
              config={selectedNodeConfig[selectedNodeForConfig] || {}}
              onConfigChange={(config) => {
                setSelectedNodeConfig(prev => ({
                  ...prev,
                  [selectedNodeForConfig]: config
                }));

                // Update node data
                setNodes(prevNodes => 
                  prevNodes.map(node => 
                    node.id === selectedNodeForConfig 
                      ? { ...node, data: { ...node.data, config } }
                      : node
                  )
                );
              }}
              onClose={() => setShowNodeConfig(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FlowEditorWrapper(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditor {...props} />
    </ReactFlowProvider>
  );
}