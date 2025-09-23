
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
  const [draggedNode, setDraggedNode] = useState<FlowNode | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isNodeDragging, setIsNodeDragging] = useState(false);
  const [nodeConfig, setNodeConfig] = useState<Record<string, any>>({});
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedConfigurations, setSavedConfigurations] = useState<Record<string, any>>({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [configurationName, setConfigurationName] = useState('');

  // Function to check if a node has validation errors
  const hasValidationError = (node: any): boolean => {
    if (!node) return false;
    
    // Check based on node type
    switch (node.type) {
      case 'trigger':
        // Trigger nodes need messages or conditions
        const triggerMessages = nodeConfig.triggerMessages || node.config?.triggerMessages || '';
        return triggerMessages.trim().length === 0;
        
      case 'response':
        // Response nodes need a message
        const responseMessage = nodeConfig.responseMessage || node.config?.responseMessage || '';
        return responseMessage.trim().length === 0;
        
      case 'condition':
        // Condition nodes need field, operator, and value
        const field = nodeConfig.conditionField || node.config?.conditionField || '';
        const operator = nodeConfig.conditionOperator || node.config?.conditionOperator || '';
        const value = nodeConfig.conditionValue || node.config?.conditionValue || '';
        return !field || !operator || !value;
        
      case 'integration':
        // Integration nodes need an API URL
        const apiUrl = nodeConfig.apiUrl || node.config?.apiUrl || '';
        return apiUrl.trim().length === 0;
        
      case 'ai':
        // AI nodes need a prompt
        const aiPrompt = nodeConfig.aiPrompt || node.config?.aiPrompt || '';
        return aiPrompt.trim().length === 0;
        
      case 'action':
        // Action nodes need an action type
        const actionType = nodeConfig.actionType || node.config?.actionType || '';
        return !actionType;
        
      default:
        return false;
    }
  };

  // Validation functions
  const validateNodeConfig = useCallback((nodeType: string, config: Record<string, any>) => {
    const errors: Record<string, string> = {};
    
    switch (nodeType) {
      case 'trigger':
        if (selectedNode?.title === 'Detecção de Mensagem') {
          if (!config.keywords?.trim()) {
            errors.keywords = 'Palavras-chave são obrigatórias';
          }
          if (config.keywords && config.keywords.length > 200) {
            errors.keywords = 'Máximo de 200 caracteres';
          }
        }
        if (selectedNode?.title === 'Análise de IA') {
          if (!config.aiPrompt?.trim()) {
            errors.aiPrompt = 'Prompt de IA é obrigatório';
          }
          if (config.confidence && (config.confidence < 0 || config.confidence > 1)) {
            errors.confidence = 'Confiança deve estar entre 0 e 1';
          }
        }
        break;
        
      case 'action':
        if (selectedNode?.title === 'Enviar Mensagem') {
          if (!config.messageText?.trim()) {
            errors.messageText = 'Texto da mensagem é obrigatório';
          }
          if (config.messageText && config.messageText.length > 4000) {
            errors.messageText = 'Máximo de 4000 caracteres';
          }
        }
        if (selectedNode?.title === 'Definir Variável') {
          if (!config.variableName?.trim()) {
            errors.variableName = 'Nome da variável é obrigatório';
          }
          if (config.variableName && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(config.variableName)) {
            errors.variableName = 'Nome deve conter apenas letras, números e underscore';
          }
        }
        break;
        
      case 'response':
        if (selectedNode?.title === 'Formulário') {
          if (!config.formTitle?.trim()) {
            errors.formTitle = 'Título do formulário é obrigatório';
          }
          if (config.formFields) {
            try {
              const fields = JSON.parse(config.formFields);
              if (!Array.isArray(fields) || fields.length === 0) {
                errors.formFields = 'Deve conter pelo menos um campo';
              }
            } catch (e) {
              errors.formFields = 'JSON inválido nos campos do formulário';
            }
          } else {
            errors.formFields = 'Campos do formulário são obrigatórios';
          }
        }
        if (selectedNode?.title === 'Resposta Rápida') {
          if (!config.quickReplyText?.trim()) {
            errors.quickReplyText = 'Texto da resposta rápida é obrigatório';
          }
          if (!config.quickReplyButtons?.trim()) {
            errors.quickReplyButtons = 'Pelo menos um botão é obrigatório';
          }
        }
        break;
        
      case 'condition':
        if (selectedNode?.title === 'Condição Variável') {
          if (!config.variableName?.trim()) {
            errors.variableName = 'Nome da variável é obrigatório';
          }
          if (!config.comparisonValue?.trim()) {
            errors.comparisonValue = 'Valor de comparação é obrigatório';
          }
        }
        break;
    }
    
    return errors;
  }, [selectedNode]);

  // Update validation when config changes
  useEffect(() => {
    if (selectedNode) {
      const errors = validateNodeConfig(selectedNode.type, nodeConfig);
      setConfigErrors(errors);
    }
  }, [nodeConfig, selectedNode, validateNodeConfig]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(Object.keys(nodeConfig).length > 0);
  }, [nodeConfig]);

  // Load saved configurations from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('chatbot-configurations');
    if (saved) {
      try {
        setSavedConfigurations(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved configurations:', error);
      }
    }
  }, []);

  // Save/Load configuration functions
  const saveConfiguration = useCallback((name: string, chatbot: Chatbot) => {
    const configToSave = {
      name,
      chatbot,
      savedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const updatedConfigurations = {
      ...savedConfigurations,
      [name]: configToSave
    };
    
    setSavedConfigurations(updatedConfigurations);
    localStorage.setItem('chatbot-configurations', JSON.stringify(updatedConfigurations));
    
    console.log('✅ [ChatbotKanban] Configuration saved:', name);
  }, [savedConfigurations]);

  const loadConfiguration = useCallback((name: string) => {
    const config = savedConfigurations[name];
    if (config && config.chatbot) {
      setSelectedChatbot(config.chatbot);
      setChatbots(prev => {
        const existingIndex = prev.findIndex(bot => bot.id === config.chatbot.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = config.chatbot;
          return updated;
        } else {
          return [...prev, config.chatbot];
        }
      });
      console.log('✅ [ChatbotKanban] Configuration loaded:', name);
    }
  }, [savedConfigurations]);

  const exportConfiguration = useCallback((chatbot: Chatbot) => {
    const configToExport = {
      name: chatbot.name,
      description: chatbot.description,
      flow: chatbot.flow,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(configToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `chatbot-${chatbot.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ [ChatbotKanban] Configuration exported:', chatbot.name);
  }, []);

  const importConfiguration = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        
        if (imported.flow && imported.name) {
          const newChatbot: Chatbot = {
            id: Date.now().toString(),
            tenantId: user?.tenantId || '',
            name: `${imported.name} (Importado)`,
            description: imported.description || 'Configuração importada',
            flow: imported.flow,
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
          
          setChatbots(prev => [...prev, newChatbot]);
          setSelectedChatbot(newChatbot);
          console.log('✅ [ChatbotKanban] Configuration imported:', newChatbot.name);
        } else {
          console.error('❌ [ChatbotKanban] Invalid configuration file format');
        }
      } catch (error) {
        console.error('❌ [ChatbotKanban] Error importing configuration:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  }, [user?.tenantId]);

  const handleSaveCurrentConfiguration = () => {
    if (!selectedChatbot || !configurationName.trim()) return;
    
    saveConfiguration(configurationName, selectedChatbot);
    setShowSaveDialog(false);
    setConfigurationName('');
    setHasUnsavedChanges(false);
  };

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

  // Error display component
  const ErrorMessage = ({ fieldName }: { fieldName: string }) => {
    const error = configErrors[fieldName];
    if (!error) return null;
    
    return (
      <div className="flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3 text-red-500" />
        <span className="text-xs text-red-500">{error}</span>
      </div>
    );
  };

  const handleSaveNodeConfig = async () => {
    if (!selectedNode || !selectedChatbot) return;

    // Validate configuration before saving
    const errors = validateNodeConfig(selectedNode.type, nodeConfig);
    setConfigErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      console.log('❌ [ChatbotKanban] Validation errors:', errors);
      return;
    }

    try {
      const updatedNode = {
        ...selectedNode,
        config: nodeConfig
      };

      const updatedChatbot = {
        ...selectedChatbot,
        flow: {
          ...selectedChatbot.flow,
          nodes: selectedChatbot.flow.nodes.map(n =>
            n.id === selectedNode.id ? updatedNode : n
          )
        }
      };

      setSelectedChatbot(updatedChatbot);
      setChatbots(prev => prev.map(bot => 
        bot.id === selectedChatbot.id ? updatedChatbot : bot
      ));

      setShowNodeConfig(false);
      setSelectedNode(null);
      setNodeConfig({});
      setConfigErrors({});
      setHasUnsavedChanges(false);
      
      console.log('✅ [ChatbotKanban] Node configuration saved successfully:', updatedNode);
    } catch (error) {
      console.error('❌ [ChatbotKanban] Error saving node config:', error);
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
      type: nodeType.type as FlowNode['type'],
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
      setNodeConfig(node.config || {});
      setShowNodeConfig(true);
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: FlowNode) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (connecting) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.left - node.position.x * zoom - canvasOffset.x;
    const offsetY = e.clientY - rect.top - node.position.y * zoom - canvasOffset.y;
    
    setDraggedNode(node);
    setDragOffset({ x: offsetX, y: offsetY });
    setIsNodeDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isNodeDragging || !draggedNode || !canvasRef.current) return;

    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasOffset.x - dragOffset.x) / zoom;
    const y = (e.clientY - rect.top - canvasOffset.y - dragOffset.y) / zoom;

    if (selectedChatbot) {
      const updatedChatbot = {
        ...selectedChatbot,
        flow: {
          ...selectedChatbot.flow,
          nodes: selectedChatbot.flow.nodes.map(n =>
            n.id === draggedNode.id ? { ...n, position: { x, y } } : n
          )
        }
      };

      setSelectedChatbot(updatedChatbot);
    }
  }, [isNodeDragging, draggedNode, canvasOffset, dragOffset, zoom, selectedChatbot]);

  const handleMouseUp = useCallback(() => {
    if (isNodeDragging && selectedChatbot && draggedNode) {
      setChatbots(prev => prev.map(bot => 
        bot.id === selectedChatbot.id ? selectedChatbot : bot
      ));
    }
    setIsNodeDragging(false);
    setDraggedNode(null);
  }, [isNodeDragging, selectedChatbot, draggedNode]);

  useEffect(() => {
    if (isNodeDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isNodeDragging, handleMouseMove, handleMouseUp]);

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
          {selectedChatbot && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Config
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowLoadDialog(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Carregar Config
              </Button>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}
          <label htmlFor="import-config" className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </span>
            </Button>
          </label>
          <input
            id="import-config"
            type="file"
            accept=".json"
            onChange={importConfiguration}
            className="hidden"
          />
          {selectedChatbot && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportConfiguration(selectedChatbot)}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
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

                    // Determine connection type and styling
                    const getConnectionStyle = () => {
                      const fromNodeHasErrors = hasValidationError(fromNode);
                      const toNodeHasErrors = hasValidationError(toNode);
                      
                      if (fromNodeHasErrors || toNodeHasErrors) {
                        return {
                          stroke: '#ef4444', // red-500
                          strokeWidth: '2',
                          strokeDasharray: '4,4',
                          markerEnd: 'url(#arrowhead-error)',
                          glow: false
                        };
                      }
                      
                      if (connection.type === 'conditional') {
                        return {
                          stroke: '#8b5cf6', // violet-500  
                          strokeWidth: '2.5',
                          strokeDasharray: '8,4',
                          markerEnd: 'url(#arrowhead-conditional)',
                          glow: true
                        };
                      }
                      
                      if (fromNode.type === 'trigger') {
                        return {
                          stroke: '#10b981', // emerald-500
                          strokeWidth: '3',
                          strokeDasharray: 'none',
                          markerEnd: 'url(#arrowhead-success)',
                          glow: true
                        };
                      }
                      
                      if (fromNode.type === 'ai') {
                        return {
                          stroke: '#6366f1', // indigo-500
                          strokeWidth: '2.5',
                          strokeDasharray: 'none',
                          markerEnd: 'url(#arrowhead-ai)',
                          glow: true
                        };
                      }
                      
                      return {
                        stroke: '#6b7280', // gray-500
                        strokeWidth: '2',
                        strokeDasharray: 'none',
                        markerEnd: 'url(#arrowhead-default)',
                        glow: false
                      };
                    };

                    const style = getConnectionStyle();
                    const connectionId = `connection-${connection.id}`;

                    return (
                      <g key={connection.id} className="group">
                        {/* Glow effect background line for special connections */}
                        {style.glow && (
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={style.stroke}
                            strokeWidth="6"
                            strokeDasharray={style.strokeDasharray}
                            opacity="0.3"
                            filter="url(#glow)"
                          />
                        )}
                        
                        {/* Main connection line */}
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={style.stroke}
                          strokeWidth={style.strokeWidth}
                          strokeDasharray={style.strokeDasharray}
                          markerEnd={style.markerEnd}
                          className="transition-all duration-200 group-hover:opacity-80"
                        >
                          {/* Animated flow for active connections */}
                          {!style.strokeDasharray.includes('4,4') && (
                            <animate
                              attributeName="stroke-dasharray"
                              values="0,20;20,0;0,20"
                              dur="3s"
                              repeatCount="indefinite"
                              className="opacity-50"
                            />
                          )}
                        </line>

                        {/* Connection status indicator */}
                        <circle
                          cx={(x1 + x2) / 2}
                          cy={(y1 + y2) / 2}
                          r="4"
                          fill={style.stroke}
                          stroke="white"
                          strokeWidth="2"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        />

                        {/* Enhanced connection label */}
                        {connection.label && (
                          <g>
                            {/* Label background */}
                            <rect
                              x={(x1 + x2) / 2 - (connection.label.length * 3.5)}
                              y={(y1 + y2) / 2 - 15}
                              width={connection.label.length * 7}
                              height="16"
                              rx="8"
                              fill="white"
                              stroke={style.stroke}
                              strokeWidth="1"
                              className="opacity-0 group-hover:opacity-90 transition-opacity duration-200"
                            />
                            {/* Label text */}
                            <text
                              x={(x1 + x2) / 2}
                              y={(y1 + y2) / 2 - 5}
                              textAnchor="middle"
                              className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              fill={style.stroke}
                            >
                              {connection.label}
                            </text>
                          </g>
                        )}

                        {/* Connection type indicator */}
                        {connection.type && (
                          <text
                            x={x1 + 10}
                            y={y1 - 10}
                            className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            fill={style.stroke}
                          >
                            {connection.type === 'conditional' ? '⚡' : connection.type === 'success' ? '✅' : '➡️'}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  
                  {/* Enhanced marker definitions */}
                  <defs>
                    {/* Glow filter */}
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>

                    {/* Default arrow */}
                    <marker
                      id="arrowhead-default"
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

                    {/* Success/trigger arrow (green) */}
                    <marker
                      id="arrowhead-success"
                      markerWidth="12"
                      markerHeight="8"
                      refX="11"
                      refY="4"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 12 4, 0 8"
                        fill="#10b981"
                      />
                    </marker>

                    {/* Conditional arrow (purple) */}
                    <marker
                      id="arrowhead-conditional"
                      markerWidth="12"
                      markerHeight="8"
                      refX="11"
                      refY="4"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 12 4, 0 8"
                        fill="#8b5cf6"
                      />
                    </marker>

                    {/* AI arrow (indigo) */}
                    <marker
                      id="arrowhead-ai"
                      markerWidth="12"
                      markerHeight="8"
                      refX="11"
                      refY="4"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 12 4, 0 8"
                        fill="#6366f1"
                      />
                    </marker>

                    {/* Error arrow (red) */}
                    <marker
                      id="arrowhead-error"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#ef4444"
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
                      className={`absolute transition-all hover:shadow-lg ${
                        node.isStartNode ? 'ring-2 ring-green-500' : ''
                      } ${
                        connecting && connectionStart === node.id ? 'ring-2 ring-blue-500' : ''
                      } ${
                        isNodeDragging && draggedNode?.id === node.id ? 'cursor-grabbing shadow-2xl scale-105' : 'cursor-grab'
                      } ${
                        connecting ? 'cursor-crosshair' : ''
                      }`}
                      style={{
                        left: node.position.x,
                        top: node.position.y,
                        width: '200px',
                        zIndex: isNodeDragging && draggedNode?.id === node.id ? 1000 : 1
                      }}
                      onMouseDown={(e) => handleNodeMouseDown(e, node)}
                      onClick={() => !isNodeDragging && handleNodeClick(node)}
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="config">Configuração</TabsTrigger>
                <TabsTrigger value="connections">Conexões</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label>Título do Nó</Label>
                  <Input 
                    value={selectedNode.title} 
                    onChange={(e) => setSelectedNode({...selectedNode, title: e.target.value})}
                    data-testid="node-title"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea 
                    value={selectedNode.description || ''} 
                    onChange={(e) => setSelectedNode({...selectedNode, description: e.target.value})}
                    rows={3}
                    data-testid="node-description"
                  />
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                {selectedNode && (
                  <div className="space-y-4">
                    {/* Trigger Node Configurations */}
                    {selectedNode.type === 'trigger' && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Configurações de Gatilho</h4>
                        
                        {nodeTypes.find(nt => nt.id.includes('trigger-message'))?.id === selectedNode.id && (
                          <div className="space-y-4">
                            <div>
                              <Label>Mensagens de Ativação</Label>
                              <Textarea 
                                placeholder="olá&#10;oi&#10;bom dia&#10;boa tarde&#10;preciso de ajuda"
                                rows={4}
                                value={nodeConfig.triggerMessages || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, triggerMessages: e.target.value})}
                                data-testid="trigger-messages"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Uma mensagem por linha. Use quebras de linha para separar</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center space-x-2">
                                <Switch 
                                  id="case-sensitive"
                                  checked={nodeConfig.caseSensitive || false}
                                  onCheckedChange={(checked) => setNodeConfig({...nodeConfig, caseSensitive: checked})}
                                  data-testid="case-sensitive"
                                />
                                <Label htmlFor="case-sensitive" className="text-sm">Sensível a maiúsculas/minúsculas</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch 
                                  id="exact-match"
                                  checked={nodeConfig.exactMatch || false}
                                  onCheckedChange={(checked) => setNodeConfig({...nodeConfig, exactMatch: checked})}
                                  data-testid="exact-match"
                                />
                                <Label htmlFor="exact-match" className="text-sm">Correspondência exata</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch id="partial-match" />
                                <Label htmlFor="partial-match" className="text-sm">Correspondência parcial</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch id="regex-enabled" />
                                <Label htmlFor="regex-enabled" className="text-sm">Usar expressões regulares</Label>
                              </div>
                            </div>
                            <div>
                              <Label>Prioridade do Gatilho</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a prioridade" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1 - Mais Alta</SelectItem>
                                  <SelectItem value="5">5 - Alta</SelectItem>
                                  <SelectItem value="10">10 - Normal</SelectItem>
                                  <SelectItem value="15">15 - Baixa</SelectItem>
                                  <SelectItem value="20">20 - Mais Baixa</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Condições Adicionais</Label>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Switch id="first-message-only" />
                                  <Label htmlFor="first-message-only" className="text-sm">Apenas primeira mensagem do usuário</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch id="business-hours-only" />
                                  <Label htmlFor="business-hours-only" className="text-sm">Apenas em horário comercial</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch id="new-users-only" />
                                  <Label htmlFor="new-users-only" className="text-sm">Apenas usuários novos</Label>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label>Timeout do Gatilho (segundos)</Label>
                              <Input type="number" min="0" defaultValue="0" placeholder="0 = sem timeout" />
                              <p className="text-xs text-muted-foreground mt-1">Tempo limite para o gatilho ser ativado após a mensagem</p>
                            </div>
                          </div>
                        )}

                        {nodeTypes.find(nt => nt.id.includes('trigger-keyword'))?.id === selectedNode.id && (
                          <div className="space-y-4">
                            <div>
                              <Label>Palavras-chave Principais</Label>
                              <Textarea placeholder="suporte, ajuda, problema, dúvida" rows={3} />
                              <p className="text-xs text-muted-foreground mt-1">Palavras-chave primárias separadas por vírgula</p>
                            </div>
                            <div>
                              <Label>Palavras-chave Secundárias (Opcionais)</Label>
                              <Textarea placeholder="auxílio, apoio, questão, pergunta" rows={2} />
                              <p className="text-xs text-muted-foreground mt-1">Palavras-chave que aumentam a pontuação</p>
                            </div>
                            <div>
                              <Label>Palavras Excludentes</Label>
                              <Textarea placeholder="não, nunca, pare, cancele" rows={2} />
                              <p className="text-xs text-muted-foreground mt-1">Palavras que impedem a ativação do gatilho</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Prioridade</Label>
                                <Select>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a prioridade" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1 - Crítica</SelectItem>
                                    <SelectItem value="5">5 - Alta</SelectItem>
                                    <SelectItem value="10">10 - Normal</SelectItem>
                                    <SelectItem value="15">15 - Baixa</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Pontuação Mínima</Label>
                                <Input type="number" min="1" max="100" defaultValue="70" />
                                <p className="text-xs text-muted-foreground mt-1">0-100%</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Switch id="stemming" />
                                <Label htmlFor="stemming" className="text-sm">Usar stemming (raiz das palavras)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch id="synonyms" />
                                <Label htmlFor="synonyms" className="text-sm">Incluir sinônimos automáticos</Label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Node Configurations */}
                    {selectedNode.type === 'action' && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Configurações de Ação</h4>
                        
                        {selectedNode.title === 'Enviar Mensagem' && (
                          <div className="space-y-4">
                            <div>
                              <Label>Texto da Mensagem</Label>
                              <Textarea 
                                placeholder="Digite a mensagem que será enviada..."
                                rows={4}
                                value={nodeConfig.messageText || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, messageText: e.target.value})}
                                data-testid="message-text"
                                className={configErrors.messageText ? 'border-red-500 focus:border-red-500' : ''}
                              />
                              <ErrorMessage fieldName="messageText" />
                              <p className="text-xs text-muted-foreground mt-1">Use {'{{'} variável {'}}'}  para incluir variáveis dinâmicas</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Delay de Envio (segundos)</Label>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  value={nodeConfig.sendDelay || 0}
                                  onChange={(e) => setNodeConfig({...nodeConfig, sendDelay: parseInt(e.target.value) || 0})}
                                  data-testid="send-delay"
                                />
                              </div>
                              <div>
                                <Label>Tipo de Formatação</Label>
                                <Select 
                                  value={nodeConfig.formatting || 'plain'}
                                  onValueChange={(value) => setNodeConfig({...nodeConfig, formatting: value})}
                                >
                                  <SelectTrigger data-testid="formatting-select">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="plain">Texto Simples</SelectItem>
                                    <SelectItem value="markdown">Markdown</SelectItem>
                                    <SelectItem value="html">HTML</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="enable-preview"
                                checked={nodeConfig.enablePreview || false}
                                onCheckedChange={(checked) => setNodeConfig({...nodeConfig, enablePreview: checked})}
                                data-testid="enable-preview"
                              />
                              <Label htmlFor="enable-preview" className="text-sm">Mostrar prévia antes de enviar</Label>
                            </div>
                          </div>
                        )}

                        {selectedNode.title === 'Enviar Imagem' && (
                          <div className="space-y-4">
                            <div>
                              <Label>URL da Imagem</Label>
                              <Input 
                                placeholder="https://exemplo.com/imagem.jpg"
                                value={nodeConfig.imageUrl || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, imageUrl: e.target.value})}
                                data-testid="image-url"
                              />
                            </div>
                            <div>
                              <Label>Legenda (Opcional)</Label>
                              <Textarea 
                                placeholder="Descrição da imagem..."
                                rows={2}
                                value={nodeConfig.caption || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, caption: e.target.value})}
                                data-testid="image-caption"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Largura Máxima (px)</Label>
                                <Input 
                                  type="number" 
                                  value={nodeConfig.maxWidth || 800}
                                  onChange={(e) => setNodeConfig({...nodeConfig, maxWidth: parseInt(e.target.value) || 800})}
                                  data-testid="max-width"
                                />
                              </div>
                              <div>
                                <Label>Qualidade (%)</Label>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="100" 
                                  value={nodeConfig.quality || 80}
                                  onChange={(e) => setNodeConfig({...nodeConfig, quality: parseInt(e.target.value) || 80})}
                                  data-testid="image-quality"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedNode.title === 'Definir Variável' && (
                          <div className="space-y-4">
                            <div>
                              <Label>Nome da Variável</Label>
                              <Input 
                                placeholder="Ex: nome_usuario, pedido_id, etc."
                                value={nodeConfig.variableName || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, variableName: e.target.value})}
                                data-testid="variable-name"
                                className={configErrors.variableName ? 'border-red-500 focus:border-red-500' : ''}
                              />
                              <ErrorMessage fieldName="variableName" />
                            </div>
                            <div>
                              <Label>Valor da Variável</Label>
                              <Input 
                                placeholder="Ex: {{user.name}}, Novo Pedido, 12345"
                                value={nodeConfig.variableValue || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, variableValue: e.target.value})}
                                data-testid="variable-value"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Use {'{{'} outra_variavel {'}}'}  para referenciar outras variáveis</p>
                            </div>
                            <div>
                              <Label>Tipo de Variável</Label>
                              <Select 
                                value={nodeConfig.variableType || 'string'}
                                onValueChange={(value) => setNodeConfig({...nodeConfig, variableType: value})}
                              >
                                <SelectTrigger data-testid="variable-type">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="string">Texto</SelectItem>
                                  <SelectItem value="number">Número</SelectItem>
                                  <SelectItem value="boolean">Verdadeiro/Falso</SelectItem>
                                  <SelectItem value="array">Lista</SelectItem>
                                  <SelectItem value="object">Objeto</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="persist-variable"
                                checked={nodeConfig.persistVariable || false}
                                onCheckedChange={(checked) => setNodeConfig({...nodeConfig, persistVariable: checked})}
                                data-testid="persist-variable"
                              />
                              <Label htmlFor="persist-variable" className="text-sm">Manter variável entre conversas</Label>
                            </div>
                          </div>
                        )}

                        {selectedNode.title === 'Chamada API' && (
                          <div className="space-y-4">
                            <div>
                              <Label>URL da API</Label>
                              <Input 
                                placeholder="https://api.exemplo.com/endpoint"
                                value={nodeConfig.apiUrl || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, apiUrl: e.target.value})}
                                data-testid="api-url"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Método HTTP</Label>
                                <Select 
                                  value={nodeConfig.httpMethod || 'GET'}
                                  onValueChange={(value) => setNodeConfig({...nodeConfig, httpMethod: value})}
                                >
                                  <SelectTrigger data-testid="http-method">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="GET">GET</SelectItem>
                                    <SelectItem value="POST">POST</SelectItem>
                                    <SelectItem value="PUT">PUT</SelectItem>
                                    <SelectItem value="DELETE">DELETE</SelectItem>
                                    <SelectItem value="PATCH">PATCH</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Timeout (segundos)</Label>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  value={nodeConfig.timeout || 30}
                                  onChange={(e) => setNodeConfig({...nodeConfig, timeout: parseInt(e.target.value) || 30})}
                                  data-testid="api-timeout"
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Cabeçalhos HTTP (JSON)</Label>
                              <Textarea 
                                placeholder='{"Authorization": "Bearer {{token}}", "Content-Type": "application/json"}'
                                rows={3}
                                value={nodeConfig.headers || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, headers: e.target.value})}
                                data-testid="api-headers"
                              />
                            </div>
                            <div>
                              <Label>Corpo da Requisição (JSON)</Label>
                              <Textarea 
                                placeholder='{"nome": "{{user.name}}", "email": "{{user.email}}"}'
                                rows={4}
                                value={nodeConfig.requestBody || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, requestBody: e.target.value})}
                                data-testid="request-body"
                              />
                            </div>
                            <div>
                              <Label>Variável para Resposta</Label>
                              <Input 
                                placeholder="Ex: api_response, user_data"
                                value={nodeConfig.responseVariable || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, responseVariable: e.target.value})}
                                data-testid="response-variable"
                              />
                            </div>
                          </div>
                        )}

                        {selectedNode.title === 'Marcar Usuário' && (
                          <div className="space-y-4">
                            <div>
                              <Label>Tags (separadas por vírgula)</Label>
                              <Input 
                                placeholder="vip, interessado, suporte, cliente"
                                value={nodeConfig.tags || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, tags: e.target.value})}
                                data-testid="user-tags"
                              />
                            </div>
                            <div>
                              <Label>Ação das Tags</Label>
                              <Select 
                                value={nodeConfig.tagAction || 'add'}
                                onValueChange={(value) => setNodeConfig({...nodeConfig, tagAction: value})}
                              >
                                <SelectTrigger data-testid="tag-action">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="add">Adicionar Tags</SelectItem>
                                  <SelectItem value="remove">Remover Tags</SelectItem>
                                  <SelectItem value="replace">Substituir Todas as Tags</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Observações sobre o Usuário</Label>
                              <Textarea 
                                placeholder="Adicionar observações sobre o usuário..."
                                rows={3}
                                value={nodeConfig.notes || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, notes: e.target.value})}
                                data-testid="user-notes"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="notify-team"
                                checked={nodeConfig.notifyTeam || false}
                                onCheckedChange={(checked) => setNodeConfig({...nodeConfig, notifyTeam: checked})}
                                data-testid="notify-team"
                              />
                              <Label htmlFor="notify-team" className="text-sm">Notificar equipe sobre a marcação</Label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Response Node Configurations */}
                    {selectedNode.type === 'response' && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Configurações de Resposta</h4>
                        
                        {selectedNode.title === 'Resposta Texto' && (
                          <div className="space-y-4">
                            <div>
                              <Label>Texto da Resposta</Label>
                              <Textarea 
                                placeholder="Digite a resposta que será enviada..."
                                rows={4}
                                value={nodeConfig.responseText || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, responseText: e.target.value})}
                                data-testid="response-text"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Use {'{{'} variavel {'}}'}  para incluir variáveis dinâmicas</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Delay de Resposta (segundos)</Label>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  value={nodeConfig.responseDelay || 0}
                                  onChange={(e) => setNodeConfig({...nodeConfig, responseDelay: parseInt(e.target.value) || 0})}
                                  data-testid="response-delay"
                                />
                              </div>
                              <div>
                                <Label>Prioridade</Label>
                                <Select 
                                  value={nodeConfig.priority || 'normal'}
                                  onValueChange={(value) => setNodeConfig({...nodeConfig, priority: value})}
                                >
                                  <SelectTrigger data-testid="response-priority">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="low">Baixa</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedNode.title === 'Resposta Rápida' && (
                          <div className="space-y-4">
                            <div>
                              <Label>Texto Principal</Label>
                              <Textarea 
                                placeholder="Texto que aparecerá acima dos botões..."
                                rows={3}
                                value={nodeConfig.quickReplyText || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, quickReplyText: e.target.value})}
                                data-testid="quick-reply-text"
                              />
                            </div>
                            <div>
                              <Label>Botões de Resposta Rápida (um por linha)</Label>
                              <Textarea 
                                placeholder="Sim&#10;Não&#10;Talvez&#10;Mais informações"
                                rows={4}
                                value={nodeConfig.quickReplyButtons || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, quickReplyButtons: e.target.value})}
                                data-testid="quick-reply-buttons"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Digite um botão por linha</p>
                            </div>
                            <div>
                              <Label>Máximo de Botões</Label>
                              <Input 
                                type="number" 
                                min="1" 
                                max="10" 
                                value={nodeConfig.maxButtons || 3}
                                onChange={(e) => setNodeConfig({...nodeConfig, maxButtons: parseInt(e.target.value) || 3})}
                                data-testid="max-buttons"
                              />
                            </div>
                          </div>
                        )}

                        {selectedNode.title === 'Menu Interativo' && (
                          <div className="space-y-4">
                            <div>
                              <Label>Título do Menu</Label>
                              <Input 
                                placeholder="Ex: Escolha uma opção"
                                value={nodeConfig.menuTitle || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, menuTitle: e.target.value})}
                                data-testid="menu-title"
                              />
                            </div>
                            <div>
                              <Label>Descrição do Menu</Label>
                              <Textarea 
                                placeholder="Descrição que aparecerá no menu..."
                                rows={2}
                                value={nodeConfig.menuDescription || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, menuDescription: e.target.value})}
                                data-testid="menu-description"
                              />
                            </div>
                            <div>
                              <Label>Opções do Menu (formato: Título|Descrição|Valor)</Label>
                              <Textarea 
                                placeholder="Suporte|Preciso de ajuda|support&#10;Vendas|Quero comprar|sales&#10;Informações|Mais detalhes|info"
                                rows={4}
                                value={nodeConfig.menuOptions || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, menuOptions: e.target.value})}
                                data-testid="menu-options"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Use | para separar título, descrição e valor</p>
                            </div>
                          </div>
                        )}

                        {selectedNode.title === 'Formulário' && (
                          <div className="space-y-4">
                            <div>
                              <Label>Título do Formulário</Label>
                              <Input 
                                placeholder="Ex: Dados para Contato"
                                value={nodeConfig.formTitle || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, formTitle: e.target.value})}
                                data-testid="form-title"
                              />
                            </div>
                            <div>
                              <Label>Campos do Formulário (JSON)</Label>
                              <Textarea 
                                placeholder='[{"name": "nome", "type": "text", "required": true, "label": "Nome completo"}, {"name": "email", "type": "email", "required": true, "label": "E-mail"}]'
                                rows={6}
                                value={nodeConfig.formFields || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, formFields: e.target.value})}
                                data-testid="form-fields"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Defina os campos em formato JSON</p>
                            </div>
                            <div>
                              <Label>Mensagem de Confirmação</Label>
                              <Textarea 
                                placeholder="Obrigado! Seus dados foram registrados com sucesso."
                                rows={2}
                                value={nodeConfig.confirmationMessage || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, confirmationMessage: e.target.value})}
                                data-testid="confirmation-message"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Condition Node Configurations */}
                    {selectedNode.type === 'condition' && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Configurações de Condição</h4>
                        
                        {selectedNode.title === 'Condição Texto' && (
                          <div className="space-y-4">
                            <div>
                              <Label>Texto para Comparação</Label>
                              <Input 
                                placeholder="Digite o texto a ser verificado"
                                value={nodeConfig.comparisonText || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, comparisonText: e.target.value})}
                                data-testid="comparison-text"
                              />
                            </div>
                            <div>
                              <Label>Operador de Comparação</Label>
                              <Select 
                                value={nodeConfig.operator || 'equals'}
                                onValueChange={(value) => setNodeConfig({...nodeConfig, operator: value})}
                              >
                                <SelectTrigger data-testid="comparison-operator">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="equals">Igual a</SelectItem>
                                  <SelectItem value="contains">Contém</SelectItem>
                                  <SelectItem value="starts_with">Inicia com</SelectItem>
                                  <SelectItem value="ends_with">Termina com</SelectItem>
                                  <SelectItem value="not_equals">Diferente de</SelectItem>
                                  <SelectItem value="regex">Expressão Regular</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="case-sensitive-condition"
                                checked={nodeConfig.caseSensitiveCondition || false}
                                onCheckedChange={(checked) => setNodeConfig({...nodeConfig, caseSensitiveCondition: checked})}
                                data-testid="case-sensitive-condition"
                              />
                              <Label htmlFor="case-sensitive-condition" className="text-sm">Sensível a maiúsculas/minúsculas</Label>
                            </div>
                          </div>
                        )}

                        {selectedNode.title === 'Condição Variável' && (
                          <div className="space-y-4">
                            <div>
                              <Label>Nome da Variável</Label>
                              <Input 
                                placeholder="Ex: user_age, status, score"
                                value={nodeConfig.variableName || ''}
                                onChange={(e) => setNodeConfig({...nodeConfig, variableName: e.target.value})}
                                data-testid="variable-name-condition"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Operador</Label>
                                <Select 
                                  value={nodeConfig.variableOperator || 'equals'}
                                  onValueChange={(value) => setNodeConfig({...nodeConfig, variableOperator: value})}
                                >
                                  <SelectTrigger data-testid="variable-operator">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="equals">Igual (==)</SelectItem>
                                    <SelectItem value="not_equals">Diferente (!=)</SelectItem>
                                    <SelectItem value="greater">Maior ({'>'}) </SelectItem>
                                    <SelectItem value="less">Menor ({'<'})</SelectItem>
                                    <SelectItem value="greater_equals">Maior ou igual ({'>'}=)</SelectItem>
                                    <SelectItem value="less_equals">Menor ou igual ({'<'}=)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Valor de Comparação</Label>
                                <Input 
                                  placeholder="Valor para comparar"
                                  value={nodeConfig.comparisonValue || ''}
                                  onChange={(e) => setNodeConfig({...nodeConfig, comparisonValue: e.target.value})}
                                  data-testid="comparison-value"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="connections" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Configurações de Conexão</Label>
                  <div className="space-y-3">
                    <div>
                      <Label>Tipo de Conexão</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sequential">Sequencial</SelectItem>
                          <SelectItem value="conditional">Condicional</SelectItem>
                          <SelectItem value="parallel">Paralelo</SelectItem>
                          <SelectItem value="random">Aleatório</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Timeout de Conexão (segundos)</Label>
                      <Input type="number" min="1" max="300" defaultValue="30" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="log-connections" />
                      <Label htmlFor="log-connections" className="text-sm">Registrar todas as conexões</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="parallel-connections" />
                      <Label htmlFor="parallel-connections" className="text-sm">Permitir conexões paralelas</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-3 block">Condições de Conexão</Label>
                  <div className="space-y-3">
                    <div>
                      <Label>Condições para Ativação</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a condição" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="always">Sempre</SelectItem>
                          <SelectItem value="success">Apenas em caso de sucesso</SelectItem>
                          <SelectItem value="error">Apenas em caso de erro</SelectItem>
                          <SelectItem value="custom">Condição customizada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Expressão Condicional (Opcional)</Label>
                      <Input placeholder="Ex: user_age > 18" />
                      <p className="text-xs text-muted-foreground mt-1">Use variáveis entre chaves duplas</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                {selectedNode && (
                  <div className="space-y-6">
                    <div className="bg-muted/30 rounded-lg p-4 border">
                      <h4 className="font-semibold text-sm mb-3 flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview em Tempo Real
                      </h4>
                      
                      {/* Trigger Node Preview */}
                      {selectedNode.type === 'trigger' && (
                        <div className="space-y-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center text-blue-700 mb-2">
                              <Play className="h-4 w-4 mr-2" />
                              <span className="font-medium">Gatilho de Ativação</span>
                            </div>
                            <div className="space-y-2">
                              {nodeConfig.triggerMessages ? (
                                nodeConfig.triggerMessages.split('\n').filter(msg => msg.trim()).slice(0, 3).map((message, index) => (
                                  <div key={index} className="bg-white rounded border p-2 text-sm">
                                    <span className="text-muted-foreground">Exemplo:</span> "{message.trim()}"
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted-foreground text-sm italic">
                                  Configure mensagens de ativação para ver o preview
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {nodeConfig.caseSensitive !== undefined && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <div className="text-amber-700 text-sm">
                                <strong>Sensibilidade:</strong> {nodeConfig.caseSensitive ? 'Sensível a maiúsculas/minúsculas' : 'Não sensível a maiúsculas/minúsculas'}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Response Node Preview */}
                      {selectedNode.type === 'response' && (
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center text-green-700 mb-2">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              <span className="font-medium">Resposta do Bot</span>
                            </div>
                            <div className="bg-white rounded border p-3">
                              {nodeConfig.responseMessage ? (
                                <div className="space-y-2">
                                  <div className="text-sm font-medium">Mensagem:</div>
                                  <div className="bg-slate-50 rounded p-2 text-sm border-l-4 border-green-500">
                                    {nodeConfig.responseMessage}
                                  </div>
                                  {nodeConfig.quickReplies && nodeConfig.quickReplies.split('\n').filter(r => r.trim()).length > 0 && (
                                    <div className="mt-2">
                                      <div className="text-xs text-muted-foreground mb-1">Respostas Rápidas:</div>
                                      <div className="flex flex-wrap gap-1">
                                        {nodeConfig.quickReplies.split('\n').filter(r => r.trim()).map((reply, index) => (
                                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border">
                                            {reply.trim()}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-sm italic">
                                  Configure uma mensagem de resposta para ver o preview
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Condition Node Preview */}
                      {selectedNode.type === 'condition' && (
                        <div className="space-y-4">
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="flex items-center text-purple-700 mb-2">
                              <GitBranch className="h-4 w-4 mr-2" />
                              <span className="font-medium">Lógica Condicional</span>
                            </div>
                            <div className="space-y-2">
                              {nodeConfig.conditionField && nodeConfig.conditionOperator && nodeConfig.conditionValue ? (
                                <div className="bg-white rounded border p-3">
                                  <div className="text-sm font-mono bg-slate-50 p-2 rounded border">
                                    SE <span className="text-blue-600">{nodeConfig.conditionField}</span> {' '}
                                    <span className="text-purple-600">{nodeConfig.conditionOperator}</span> {' '}
                                    <span className="text-green-600">"{nodeConfig.conditionValue}"</span>
                                  </div>
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    Exemplo: usuário envia "idade: 25" → {nodeConfig.conditionField === 'idade' && nodeConfig.conditionOperator === 'maior_que' && nodeConfig.conditionValue === '18' ? 'VERDADEIRO' : 'avaliado'}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-sm italic">
                                  Configure campo, operador e valor para ver o preview
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Integration Node Preview */}
                      {selectedNode.type === 'integration' && (
                        <div className="space-y-4">
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center text-orange-700 mb-2">
                              <Link className="h-4 w-4 mr-2" />
                              <span className="font-medium">Integração Externa</span>
                            </div>
                            <div className="space-y-2">
                              {nodeConfig.apiUrl ? (
                                <div className="bg-white rounded border p-3 space-y-2">
                                  <div className="text-sm">
                                    <span className="font-medium">Endpoint:</span> 
                                    <span className="font-mono text-blue-600 ml-2">{nodeConfig.apiMethod || 'GET'} {nodeConfig.apiUrl}</span>
                                  </div>
                                  {nodeConfig.apiHeaders && (
                                    <div className="text-sm">
                                      <span className="font-medium">Headers:</span>
                                      <pre className="bg-slate-50 p-2 rounded text-xs mt-1 overflow-x-auto">
                                        {nodeConfig.apiHeaders}
                                      </pre>
                                    </div>
                                  )}
                                  {nodeConfig.apiBody && (
                                    <div className="text-sm">
                                      <span className="font-medium">Body:</span>
                                      <pre className="bg-slate-50 p-2 rounded text-xs mt-1 overflow-x-auto">
                                        {nodeConfig.apiBody}
                                      </pre>
                                    </div>
                                  )}
                                  <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                                    <strong>Status esperado:</strong> 200 OK
                                  </div>
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-sm italic">
                                  Configure a URL da API para ver o preview
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI Node Preview */}
                      {selectedNode.type === 'ai' && (
                        <div className="space-y-4">
                          <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                            <div className="flex items-center text-violet-700 mb-2">
                              <Brain className="h-4 w-4 mr-2" />
                              <span className="font-medium">Inteligência Artificial</span>
                            </div>
                            <div className="space-y-2">
                              {nodeConfig.aiPrompt ? (
                                <div className="bg-white rounded border p-3 space-y-2">
                                  <div className="text-sm">
                                    <span className="font-medium">Prompt:</span>
                                    <div className="bg-slate-50 p-2 rounded mt-1 text-sm border-l-4 border-violet-500">
                                      {nodeConfig.aiPrompt}
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    <span className="font-medium">Modelo:</span> {nodeConfig.aiModel || 'GPT-3.5-turbo'} | 
                                    <span className="font-medium ml-2">Temperatura:</span> {nodeConfig.aiTemperature || '0.7'}
                                  </div>
                                  <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs">
                                    <strong>Exemplo de resposta:</strong> 
                                    <div className="italic mt-1">
                                      "Olá! Sou seu assistente virtual. Como posso ajudá-lo hoje?"
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-sm italic">
                                  Configure o prompt da IA para ver o preview
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Node Preview */}
                      {selectedNode.type === 'action' && (
                        <div className="space-y-4">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center text-red-700 mb-2">
                              <Settings className="h-4 w-4 mr-2" />
                              <span className="font-medium">Ação do Sistema</span>
                            </div>
                            <div className="space-y-2">
                              {nodeConfig.actionType ? (
                                <div className="bg-white rounded border p-3">
                                  <div className="text-sm font-medium mb-2">Tipo de Ação: {nodeConfig.actionType}</div>
                                  {nodeConfig.actionType === 'create_ticket' && (
                                    <div className="bg-blue-50 p-2 rounded text-sm">
                                      <strong>Criar Ticket:</strong> {nodeConfig.ticketTitle || 'Título não definido'}
                                    </div>
                                  )}
                                  {nodeConfig.actionType === 'send_email' && (
                                    <div className="bg-green-50 p-2 rounded text-sm">
                                      <strong>Enviar Email:</strong> {nodeConfig.emailSubject || 'Assunto não definido'}
                                    </div>
                                  )}
                                  {nodeConfig.actionType === 'webhook' && (
                                    <div className="bg-purple-50 p-2 rounded text-sm">
                                      <strong>Webhook:</strong> {nodeConfig.webhookUrl || 'URL não definida'}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-sm italic">
                                  Configure o tipo de ação para ver o preview
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Flow Information */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center text-slate-700 mb-2">
                          <Info className="h-4 w-4 mr-2" />
                          <span className="font-medium">Informações do Fluxo</span>
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <div><strong>Tipo:</strong> {selectedNode.type || 'Não definido'}</div>
                          <div><strong>ID:</strong> {selectedNode.id}</div>
                          <div><strong>Posição:</strong> x: {selectedNode.position?.x || 0}, y: {selectedNode.position?.y || 0}</div>
                          <div><strong>Status:</strong> {hasValidationError(selectedNode) ? '❌ Configuração incompleta' : '✅ Configurado'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNodeConfig(false)} data-testid="cancel-node-config">
              Cancelar
            </Button>
            <Button onClick={handleSaveNodeConfig} data-testid="save-node-config">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Configuration Modal */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar Configuração</DialogTitle>
            <DialogDescription>
              Salve a configuração atual do chatbot para uso posterior
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="config-name">Nome da Configuração</Label>
              <Input
                id="config-name"
                placeholder="Ex: Atendimento Principal v1.0"
                value={configurationName}
                onChange={(e) => setConfigurationName(e.target.value)}
                data-testid="configuration-name"
              />
            </div>
            {selectedChatbot && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Chatbot: {selectedChatbot.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedChatbot.flow.nodes.length} nós, {selectedChatbot.flow.connections.length} conexões
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveCurrentConfiguration}
              disabled={!configurationName.trim() || !selectedChatbot}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Configuration Modal */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Carregar Configuração</DialogTitle>
            <DialogDescription>
              Selecione uma configuração salva para carregar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {Object.keys(savedConfigurations).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma configuração salva encontrada</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Salve uma configuração primeiro para poder carregá-la aqui
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(savedConfigurations).map(([key, config]) => (
                  <div 
                    key={key}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      loadConfiguration(key);
                      setShowLoadDialog(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{config.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Salvo em: {new Date(config.savedAt).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {config.chatbot?.flow?.nodes?.length || 0} nós, {config.chatbot?.flow?.connections?.length || 0} conexões
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = { ...savedConfigurations };
                          delete updated[key];
                          setSavedConfigurations(updated);
                          localStorage.setItem('chatbot-configurations', JSON.stringify(updated));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
