import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { Link } from 'wouter';
import {
  MessageSquare,
  Mail,
  Phone,
  Settings as SettingsIcon,
  Plus,
  Search,
  Filter,
  Send,
  Archive,
  Star,
  Reply,
  Forward,
  MoreHorizontal,
  Bot,
  Zap,
  Bell,
  Users,
  Calendar,
  FileText,
  Workflow,
  Target,
  MessageCircle,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Tag,
  Hash,
  Activity,
  Sparkles,
  Lightbulb,
  HelpCircle,
  Upload,
  Play,
  Trash2,
  Globe,
  Download,
  TrendingUp,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  ArrowLeft,
  Check,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AutomationRules from './AutomationRules';
import SimplifiedInbox from '@/components/omnibridge/SimplifiedInbox';
import OmniBridgeSettings from '@/components/omnibridge/OmniBridgeSettings';



interface Channel {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'telegram' | 'sms' | 'chat';
  enabled: boolean;
  icon: any;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  messageCount: number;
  lastMessage?: string;
  lastActivity?: string;
  features?: string[];
}

interface Message {
  id: string;
  channelId: string;
  channelType: 'email' | 'whatsapp' | 'telegram' | 'sms' | 'chat';
  from: string;
  to: string;
  subject?: string;
  content: string;
  timestamp: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  attachments?: number;
  starred?: boolean;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  isEnabled?: boolean;
  trigger?: {
    type: 'new_message' | 'keyword' | 'time' | 'channel';
    conditions: string[];
  };
  triggers?: {
    type: 'new_message' | 'keyword' | 'time_based' | 'channel_specific' | 'priority_based' | 'sender_pattern' | 'content_pattern' | 'ai_analysis';
    conditions: any;
  }[];
  actions: {
    type: 'reply' | 'forward' | 'create_ticket' | 'notify' | 'tag' | 'auto_reply' | 'forward_message' | 'send_notification' | 'add_tags' | 'assign_agent' | 'mark_priority' | 'archive' | 'webhook_call' | 'ai_response';
    parameters: Record<string, any>;
  }[];
  priority: number;
  executionStats?: {
    totalExecutions: number;
    successRate: number;
  };
}

interface Template {
  id: string;
  name: string;
  category: 'email' | 'whatsapp' | 'general';
  subject?: string;
  content: string;
  variables: string[];
  usage_count: number;
  created_at: string;
}


// Helper functions for channel mapping
function getChannelType(integrationId: string): 'email' | 'whatsapp' | 'telegram' | 'sms' | 'chat' {
  if (integrationId.includes('email') || integrationId.includes('gmail') || integrationId.includes('outlook') || integrationId.includes('imap')) {
    return 'email';
  }
  if (integrationId.includes('whatsapp')) {
    return 'whatsapp';
  }
  if (integrationId.includes('telegram')) {
    return 'telegram';
  }
  if (integrationId.includes('sms') || integrationId.includes('twilio')) {
    return 'sms';
  }
  return 'chat';
}

function getChannelIcon(integrationId: string) {
  if (integrationId.includes('email') || integrationId.includes('gmail') || integrationId.includes('outlook') || integrationId.includes('imap')) {
    return Mail;
  }
  if (integrationId.includes('whatsapp')) {
    return MessageSquare;
  }
  if (integrationId.includes('telegram')) {
    return MessageCircle;
  }
  if (integrationId.includes('sms') || integrationId.includes('twilio')) {
    return Phone;
  }
  return MessageSquare;
}

export default function OmniBridge() {
  console.log('🚀 [OmniBridge-DEBUG] Component function executed - starting render');
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inbox');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [newRuleData, setNewRuleData] = useState({
    name: '',
    description: '',
    triggerType: 'new_message',
    actionType: 'auto_reply',
    priority: 0
  });
  const [replyContent, setReplyContent] = useState('');
  const [forwardContent, setForwardContent] = useState('');
  const [forwardRecipients, setForwardRecipients] = useState('');

  // AI Configuration with react-query
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Zod schemas for validation with numeric preprocessing
  const aiConfigSchema = z.object({
    model: z.string(),
    temperature: z.preprocess((val) => Number(val), z.number().min(0).max(1)),
    maxTokens: z.preprocess((val) => Number(val), z.number().min(100).max(4000)),
    confidenceThreshold: z.preprocess((val) => Number(val), z.number().min(0).max(1)),
    enabledAnalysis: z.object({
      intention: z.boolean(),
      priority: z.boolean(),
      sentiment: z.boolean(),
      language: z.boolean(),
      entities: z.boolean()
    }),
    prompts: z.object({
      intentionAnalysis: z.string(),
      priorityClassification: z.string(),
      autoResponse: z.string(),
      sentimentAnalysis: z.string(),
      entityExtraction: z.string()
    })
  });

  // Load AI Configuration
  const { data: aiConfigData, isLoading: aiConfigLoading } = useQuery({
    queryKey: ['/api/omnibridge/ai-config'],
    enabled: activeTab === 'ai-config'
  });

  // Load AI Metrics
  const { data: aiMetricsData, isLoading: aiMetricsLoading } = useQuery({
    queryKey: ['/api/omnibridge/ai-metrics'],
    enabled: activeTab === 'ai-config'
  });

  // Save AI Configuration mutation
  const saveAiConfigMutation = useMutation({
    mutationFn: (config: any) => apiRequest('PUT', '/api/omnibridge/ai-config', config),
    onSuccess: () => {
      toast({ title: 'Configuração salva', description: 'Configurações de IA atualizadas com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/ai-config'] });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: 'Falha ao salvar configurações de IA', variant: 'destructive' });
    }
  });

  // Test AI Prompt mutation
  const testPromptMutation = useMutation({
    mutationFn: ({ prompt, testMessage, promptType }: any) =>
      apiRequest('POST', '/api/omnibridge/ai-prompts/test', { prompt, testMessage, promptType }),
    onSuccess: (response) => {
      toast({
        title: 'Teste concluído',
        description: `Resultado: ${JSON.stringify(response)}`,
        duration: 5000
      });
    }
  });

  // Form for AI Configuration
  const aiForm = useForm({
    resolver: zodResolver(aiConfigSchema),
    defaultValues: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      confidenceThreshold: 0.8,
      enabledAnalysis: {
        intention: true,
        priority: true,
        sentiment: true,
        language: true,
        entities: true
      },
      prompts: {
        intentionAnalysis: 'Analise a mensagem e identifique a intenção principal:\n- reclamacao: Cliente insatisfeito\n- duvida: Pergunta ou esclarecimento\n- solicitacao: Pedido de serviço\n- elogio: Feedback positivo\n- urgente: Situação urgente\n\nResponda apenas com a categoria.',
        priorityClassification: 'Classifique a prioridade da mensagem:\n- baixa: Dúvidas gerais\n- media: Solicitações padrão\n- alta: Problemas operacionais\n- critica: Emergências\n\nConsidere palavras como "urgente", "parou", "não funciona".',
        autoResponse: 'Responda de forma profissional e prestativa. Se for dúvida técnica, forneça informações úteis. Se for reclamação, seja empático e ofereça soluções.',
        sentimentAnalysis: 'Analise o sentimento da mensagem:\n- positivo: Satisfação, elogio\n- neutro: Informativo, neutro\n- negativo: Insatisfação, reclamação\n\nResponda apenas com a categoria.',
        entityExtraction: 'Extraia informações importantes da mensagem:\n- nomes de pessoas\n- números de pedido/protocolo\n- datas\n- produtos/serviços mencionados\n\nRetorne em formato JSON.'
      }
    }
  });

  // Update form when data loads
  React.useEffect(() => {
    if (aiConfigData) {
      aiForm.reset(aiConfigData);
    }
  }, [aiConfigData, aiForm]);

  const handleSaveAiConfig = (data: any) => {
    saveAiConfigMutation.mutate(data);
  };
  const [showAiPromptEditor, setShowAiPromptEditor] = useState(false);
  const [selectedPromptType, setSelectedPromptType] = useState('intentionAnalysis');
  const [tempPromptContent, setTempPromptContent] = useState('');
  const [promptTestMessage, setPromptTestMessage] = useState('');

  // Get current values from form or API data
  const currentAiConfig = aiForm.watch();
  const currentMetrics = {
    totalAnalyses: (aiConfigData as any)?.totalAnalyses || 0,
    accuracyRate: (aiConfigData as any)?.accuracyRate || 0,
    responseTime: (aiConfigData as any)?.responseTime || 0,
    autoResponseRate: (aiConfigData as any)?.autoResponseRate || 0,
    escalationRate: (aiConfigData as any)?.escalationRate || 0,
    dailyAnalyses: (aiConfigData as any)?.dailyAnalyses || []
  };

  // Add automation state with detailed logging
  useEffect(() => {
    console.log('🔍 [OmniBridge-DEBUG] Component mounted, fetching automation rules...');

    const fetchAutomationRules = async () => {
      try {
        console.log('🚀 [OmniBridge-DEBUG] Starting fetch automation rules...');

        const response = await fetch('/api/omnibridge/automation-rules', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('📨 [OmniBridge-DEBUG] Response received:', response.status, response.ok);

        if (response.ok) {
          const result = await response.json();
          console.log('📋 [OmniBridge-DEBUG] Response data:', result);

          if (result.success) {
            setAutomationRules(result.data);
            console.log('✅ [OmniBridge] Automation rules loaded:', result.data.length, 'rules');
          } else {
            console.error('❌ [OmniBridge-DEBUG] Response not successful:', result);
          }
        } else {
          console.error('❌ [OmniBridge-DEBUG] Response failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ [OmniBridge-DEBUG] Error fetching automation rules:', error);
      }
    };

    // Fetch immediately on component mount
    fetchAutomationRules();
  }, []); // Empty dependency array means it runs once on mount

  // Add auto-refresh for messages every 5 seconds
  useEffect(() => {
    const refreshMessages = async () => {
      if (!user?.tenantId) return;

      try {
        console.log(`🔄 [OMNIBRIDGE-AUTO-REFRESH] Refreshing messages for tenant: ${user.tenantId}`);

        const response = await apiRequest('GET', '/api/omnibridge/messages');
        console.log('🔍 [OmniBridge-AUTO-REFRESH] API Response for inbox:', response);

        const data = await response.json();
        if (data.success) {
          setMessages(data.messages || []);
          console.log(`📥 [OMNIBRIDGE-AUTO-REFRESH] Updated messages count: ${data.messages?.length || 0}`);
        }
      } catch (error) {
        console.error('[OmniBridge-AUTO-REFRESH] Error refreshing messages:', error);
      }
    };

    const interval = setInterval(refreshMessages, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [user?.tenantId]);

  const handleToggleAutomationRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/omnibridge/automation-rules/${ruleId}/toggle`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isEnabled: enabled })
      });

      if (response.ok) {
        setAutomationRules(prev => prev.map(rule =>
          rule.id === ruleId ? { ...rule, isEnabled: enabled } : rule
        ));
        console.log(`✅ [OmniBridge] Automation rule ${enabled ? 'enabled' : 'disabled'}: ${ruleId}`);

        // Refresh the automation rules list after toggle
        const refreshResponse = await fetch('/api/omnibridge/automation-rules', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (refreshResponse.ok) {
          const result = await refreshResponse.json();
          if (result.success) {
            setAutomationRules(result.data);
          }
        }
      }
    } catch (error) {
      console.error('❌ [OmniBridge] Error toggling automation rule:', error);
    }
  };

  const handleDeleteAutomationRule = async (ruleId: string, ruleName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a regra "${ruleName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/omnibridge/automation-rules/${ruleId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setAutomationRules(prev => prev.filter(rule => rule.id !== ruleId));
        console.log(`✅ [OmniBridge] Automation rule deleted: ${ruleId}`);

        toast({
          title: "Regra excluída",
          description: `A regra "${ruleName}" foi excluída com sucesso.`
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao excluir regra",
          description: error.message || "Ocorreu um erro ao excluir a regra",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ [OmniBridge] Error deleting automation rule:', error);
      toast({
        title: "Erro ao excluir regra",
        description: "Ocorreu um erro ao excluir a regra",
        variant: "destructive"
      });
    }
  };


  const handleCreateAutomationRule = async () => {
    try {
      const response = await fetch('/api/omnibridge/automation-rules', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newRuleData.name || 'Nova Regra',
          description: newRuleData.description || 'Regra criada pelo usuário',
          isEnabled: true,
          triggers: [{ type: newRuleData.triggerType, conditions: [] }],
          actions: [{ type: newRuleData.actionType, parameters: {} }],
          priority: newRuleData.priority || 0
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAutomationRules(prev => [result.data, ...prev]);
          setShowCreateRuleModal(false);
          setNewRuleData({
            name: '',
            description: '',
            triggerType: 'new_message',
            actionType: 'auto_reply',
            priority: 0
          });
          console.log('✅ [OmniBridge] Automation rule created successfully');

          // Refresh the automation rules list after creation
          const refreshResponse = await fetch('/api/omnibridge/automation-rules', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (refreshResponse.ok) {
            const refreshResult = await refreshResponse.json();
            if (refreshResult.success) {
              setAutomationRules(refreshResult.data);
            }
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [OmniBridge] Failed to create automation rule:', errorData);
        alert(`Erro ao criar regra: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ [OmniBridge] Error creating automation rule:', error);
      alert('Erro ao criar regra. Verifique o console para mais detalhes.');
    }
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('token');

        // ✅ TELEGRAM FIX: Garantir autenticação adequada com tenantId
        const headers = {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        };

        console.log('🔧 [OMNIBRIDGE-FIX] Using headers:', headers);
        console.log('🔧 [OMNIBRIDGE-FIX] User tenantId:', user?.tenantId);

        console.log('🔧 [OMNIBRIDGE-FIX] Using headers:', headers);

        // Primeiro, sincronizar integrações para canais
        try {
          const syncResponse = await fetch('/api/omnibridge/sync-integrations', {
            method: 'POST',
            headers
          });

          if (syncResponse.ok) {
            console.log('✅ [OMNIBRIDGE-SYNC] Manual sync completed');
          } else {
            console.warn('⚠️ [OMNIBRIDGE-SYNC] Sync failed, continuing with existing channels');
          }
        } catch (syncError) {
          console.warn('⚠️ [OMNIBRIDGE-SYNC] Sync error:', syncError);
        }

        // Agora buscar canais sincronizados
        const channelsResponse = await fetch('/api/omnibridge/channels', {
          headers
        });

        const inboxResponse = await fetch('/api/omnibridge/messages', {
          headers
        });

        let channelsData = [];
        let messagesData = [];

        if (channelsResponse.ok) {
          const channelsResult = await channelsResponse.json();
          console.log('🔍 [OmniBridge] Channels data:', channelsResult);

          if (channelsResult.success) {
            channelsData = channelsResult.data.map((channel: any) => ({
              id: channel.id,
              name: channel.name,
              type: channel.type,
              status: channel.status === 'active' ? 'connected' : 'disconnected',
              enabled: channel.status === 'active',
              icon: channel.icon,
              description: channel.description,
              features: channel.features || [],
              messageCount: channel.metrics?.totalMessages || 0,
              lastMessage: null
            }));
          }
        } else {
          console.log('⚠️ [OmniBridge] Failed to fetch channels, status:', channelsResponse.status);
          // Fallback to fetching from integrations if /api/omnibridge/channels fails
          const integrationsResponse = await fetch('/api/tenant-admin-integration/integrations', {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json',
              'x-tenant-id': user?.tenantId || ''
            }
          });

          if (integrationsResponse.ok) {
            const integrationsResult = await integrationsResponse.json();
            console.log('🔍 [OmniBridge] Raw integrations data:', integrationsResult?.data || integrationsResult);

            if (integrationsResult?.data && Array.isArray(integrationsResult.data)) {
              const communicationChannels = integrationsResult.data.filter((integration: any) => {
                const category = integration.category?.toLowerCase() || '';
                return category === 'comunicação' || category === 'communication' || category === 'comunicacao';
              });

              console.log('🔍 [OmniBridge] Filtered communication channels:', communicationChannels.length, 'channels');

              channelsData = communicationChannels.map((integration: any) => ({
                id: integration.id,
                name: integration.name,
                type: getChannelType(integration.id),
                enabled: integration.status === 'connected' || integration.enabled === true,
                icon: getChannelIcon(integration.id),
                description: integration.description || 'Canal de comunicação',
                status: integration.status || 'disconnected',
                messageCount: 0,
                lastMessage: integration.status === 'connected' ? 'Configurado' : 'Aguardando configuração',
                lastActivity: integration.status === 'connected' ? 'Ativo' : 'Nunca',
                features: integration.features || []
              }));
            }
          } else {
            console.log('⚠️ [OmniBridge] Failed to fetch integrations, status:', integrationsResponse.status);
          }
        }

        let inboxResult = null;
        if (inboxResponse.ok) {
          inboxResult = await inboxResponse.json();
          console.log('🔍 [OmniBridge] API Response for inbox:', inboxResult);
        } else {
          console.log('⚠️ [OmniBridge] Failed to fetch inbox, status:', inboxResponse.status);
        }

        if (inboxResult && inboxResult.success) {
          messagesData = inboxResult.messages.map((msg: any) => ({
            id: msg.id,
            channelId: msg.channelId,
            channelType: msg.channelType,
            from: msg.from,
            to: msg.to,
            subject: msg.subject,
            content: msg.body || msg.content,
            timestamp: new Date(msg.receivedAt || msg.timestamp || msg.createdAt).toLocaleString(),
            status: msg.status,
            priority: msg.priority,
            tags: msg.tags,
            attachments: msg.attachments
          }));
        }

        if (channelsData.length === 0) {
          console.log('⚠️ [OmniBridge] No integrations data available, showing message to configure in Workspace Admin');
          channelsData = [];
        }

        console.log('🔍 [OmniBridge-DEBUG] Final channels count:', channelsData.length);
        console.log('🔍 [OmniBridge-DEBUG] Final inbox count:', messagesData.length);

        setChannels(channelsData);
        setMessages(messagesData);

        if (messagesData.length === 0) {
          console.log('📪 No inbox messages available');
        }

      } catch (error) {
        console.error('❌ [OmniBridge] Error fetching data:', error);

        // Fallback data if both endpoints fail
        setChannels([
          {
            id: 'email-imap',
            name: 'Email (IMAP)',
            type: 'email',
            enabled: false,
            icon: Mail,
            description: 'Configuração de email via IMAP/SMTP',
            status: 'disconnected',
            messageCount: 0,
            lastMessage: 'Erro ao carregar',
            lastActivity: 'Erro'
          },
          {
            id: 'whatsapp-business',
            name: 'WhatsApp Business',
            type: 'whatsapp',
            enabled: false,
            icon: MessageSquare,
            description: 'API do WhatsApp Business',
            status: 'disconnected',
            messageCount: 0,
            lastMessage: 'Erro ao carregar',
            lastActivity: 'Erro'
          },
          {
            id: 'telegram-bot',
            name: 'Telegram Bot',
            type: 'telegram',
            enabled: false,
            icon: MessageCircle,
            description: 'Bot do Telegram para atendimento',
            status: 'disconnected',
            messageCount: 0,
            lastMessage: 'Erro ao carregar',
            lastActivity: 'Erro'
          }
        ]);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChannelToggle = async (channelId: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('token');
      // Assuming a new endpoint for toggling channels or using the integrations endpoint
      const response = await fetch(`/api/omnibridge/channels/${channelId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        setChannels(prev => prev.map(channel =>
          channel.id === channelId
            ? {
              ...channel,
              enabled,
              status: enabled ? 'connected' : 'disconnected',
              lastMessage: enabled ? 'Ativo' : 'Desativado',
              lastActivity: enabled ? 'Agora' : 'Desabilitado'
            }
            : channel
        ));

        console.log(`✅ Canal ${channelId} ${enabled ? 'ativado' : 'desativado'} com sucesso`);
      } else {
        console.error('Erro ao alterar status do canal:', response.status);
      }
    } catch (error) {
      console.error('Error toggling channel:', error);
    }
  };

  const handleSendMessage = async (content: string, channelId: string, recipient: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/omnibridge/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        },
        body: JSON.stringify({
          channelId,
          recipient,
          content
        })
      });

      if (response.ok) {
        console.log('✅ [OMNIBRIDGE] Message sent successfully');
        // Refresh messages
        await refreshMessages();
      } else {
        console.error('❌ [OMNIBRIDGE] Failed to send message:', response.status);
      }
    } catch (error) {
      console.error('❌ [OMNIBRIDGE] Error sending message:', error);
    }
  };

  const refreshMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const messagesResponse = await fetch('/api/omnibridge/messages', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        }
      });

      if (messagesResponse.ok) {
        const result = await messagesResponse.json();
        if (result.success) {
          const messagesData = result.messages.map((msg: any) => ({
            id: msg.id,
            channelId: msg.channelId,
            channelType: msg.channelType,
            from: msg.from,
            to: msg.to,
            subject: msg.subject,
            content: msg.body || msg.content,
            timestamp: new Date(msg.receivedAt || msg.timestamp || msg.createdAt).toLocaleString(),
            status: msg.status,
            priority: msg.priority,
            tags: msg.tags,
            attachments: msg.attachments
          }));
          setMessages(messagesData);
          console.log('✅ [OMNIBRIDGE] Messages refreshed successfully');
        }
      }
    } catch (error) {
      console.error('❌ [OMNIBRIDGE] Error refreshing messages:', error);
    }
  };

  const handleReplyMessage = async (messageId: string, content: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const token = localStorage.getItem('token');
      const response = await fetch('/api/omnibridge/messages/reply', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        },
        body: JSON.stringify({
          originalMessageId: messageId,
          channelId: message.channelId,
          recipient: message.from,
          content
        })
      });

      if (response.ok) {
        console.log('✅ [OMNIBRIDGE] Reply sent successfully');
        await refreshMessages();
        // Update message status to replied
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, status: 'replied' } : msg
        ));
      } else {
        console.error('❌ [OMNIBRIDGE] Failed to send reply:', response.status);
      }
    } catch (error) {
      console.error('❌ [OMNIBRIDGE] Error sending reply:', error);
    }
  };

  const handleForwardMessage = async (messageId: string, recipients: string[], content: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const token = localStorage.getItem('token');
      const response = await fetch('/api/omnibridge/messages/forward', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        },
        body: JSON.stringify({
          originalMessageId: messageId,
          channelId: message.channelId,
          recipients,
          content,
          originalContent: message.content
        })
      });

      if (response.ok) {
        console.log('✅ [OMNIBRIDGE] Message forwarded successfully');
        await refreshMessages();
      } else {
        console.error('❌ [OMNIBRIDGE] Failed to forward message:', response.status);
      }
    } catch (error) {
      console.error('❌ [OMNIBRIDGE] Error forwarding message:', error);
    }
  };

  const handleArchiveMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/omnibridge/messages/${messageId}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        }
      });

      if (response.ok) {
        console.log('✅ [OMNIBRIDGE] Message archived successfully');
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, status: 'archived' } : msg
        ));
      } else {
        console.error('❌ [OMNIBRIDGE] Failed to archive message:', response.status);
      }
    } catch (error) {
      console.error('❌ [OMNIBRIDGE] Error archiving message:', error);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/omnibridge/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        }
      });

      if (response.ok) {
        console.log('✅ [OMNIBRIDGE] Message marked as read');
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, status: 'read' } : msg
        ));
      } else {
        console.error('❌ [OMNIBRIDGE] Failed to mark message as read:', response.status);
      }
    } catch (error) {
      console.error('❌ [OMNIBRIDGE] Error marking message as read:', error);
    }
  };

  const handleStarMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/omnibridge/messages/${messageId}/star`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        }
      });

      if (response.ok) {
        console.log('✅ [OMNIBRIDGE] Message starred');
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, starred: !msg.starred } : msg
        ));
      } else {
        console.error('❌ [OMNIBRIDGE] Failed to star message:', response.status);
      }
    } catch (error) {
      console.error('❌ [OMNIBRIDGE] Error starring message:', error);
    }
  };

  const filteredMessages = messages.filter(message => {
    const content = message.content || '';
    const from = message.from || '';
    const subject = message.subject || '';
    const matchesSearch = content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
    const matchesChannel = filterChannel === 'all' || message.channelType === filterChannel;

    return matchesSearch && matchesStatus && matchesChannel;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800 border-green-200';
      case 'disconnected': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando OmniBridge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OmniBridge</h1>
          <p className="text-muted-foreground">
            Central de comunicação unificada - Email, WhatsApp, Telegram e mais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveTab('settings')}>
            <SettingsIcon className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button size="sm" onClick={() => setShowCreateRuleModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="conversation-logs" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Canais
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automação
          </TabsTrigger>
        </TabsList>

        {/* Conversation Logs Tab */}
        <TabsContent value="conversation-logs" className="space-y-4">
          <ConversationLogsContent />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <ConversationAnalyticsContent />
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Canais de Comunicação</CardTitle>
              <CardDescription>
                Gerencie seus canais de comunicação. Integrações configuradas no Workspace Admin aparecerão aqui.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {channels.length === 0 ? (
                <div className="text-center py-12">
                  <SettingsIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Nenhum canal configurado</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure seus canais de comunicação no Workspace Admin para que eles apareçam aqui.
                  </p>
                  <Button
                    onClick={() => window.open('/tenant-admin/integrations', '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ir para Integrações
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.map((channel) => (
                    <Card key={channel.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Use the actual icon if available, otherwise fallback */}
                            {channel.icon ? (
                              <div className="p-2 rounded-lg bg-primary/10">
                                <img src={channel.icon} alt={channel.name} className="h-5 w-5 text-primary" />
                              </div>
                            ) : (
                              <div className="p-2 rounded-lg bg-primary/10">
                                {React.createElement(getChannelIcon(channel.id), { className: "h-5 w-5 text-primary" })}
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium">{channel.name}</h3>
                              <p className="text-sm text-muted-foreground">{channel.type}</p>
                            </div>
                          </div>
                          <Switch
                            checked={channel.enabled}
                            onCheckedChange={(enabled) => handleChannelToggle(channel.id, enabled)}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-3">
                          {channel.description}
                        </p>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Status:</span>
                            <Badge variant="outline" className={getStatusColor(channel.status)}>
                              {channel.status}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span>Mensagens:</span>
                            <span className="font-medium">{channel.messageCount}</span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span>Última atividade:</span>
                            <span className="text-muted-foreground">{channel.lastActivity || 'Nenhuma'}</span>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open('/tenant-admin/integrations', '_blank')}
                          >
                            <SettingsIcon className="h-4 w-4 mr-2" />
                            Configurar
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Activity className="h-4 w-4 mr-2" />
                            Logs
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <OmniBridgeSettings />
        </TabsContent>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
          <div className="h-[calc(100vh-200px)]">
            <SimplifiedInbox
              onCreateRule={(messageData?: any) => {
                setSelectedMessage(messageData);
                setShowCreateRuleModal(true);
              }}
            />
          </div>
        </TabsContent>

        {/* Automation Tab - Advanced Rules Builder */}
        <TabsContent value="automation" className="h-full">
          <AutomationRules />
        </TabsContent>

        {/* AI Agents Tab */}
        <TabsContent value="ai-agents" className="space-y-4">
          {/* Placeholder for AI Agents Component */}
          <Card>
            <CardHeader>
              <CardTitle>Agentes IA Conversacionais</CardTitle>
              <CardDescription>
                Gerencie e configure seus Agentes IA Conversacionais aqui.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16">
                <Bot className="h-24 w-24 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Agentes IA em breve!</h3>
                <p className="text-muted-foreground max-w-md text-center">
                  A funcionalidade de Agentes IA Conversacionais está em desenvolvimento e será lançada em breve. Fique atento às atualizações!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Resposta */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder Mensagem</DialogTitle>
            <DialogDescription>
              Respondendo para: {selectedMessage?.from}
              {selectedMessage?.subject && ` - ${selectedMessage.subject}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded p-3 bg-muted">
              <p className="text-sm text-muted-foreground">Mensagem original:</p>
              <p className="text-sm mt-1">{selectedMessage?.content}</p>
            </div>
            <Textarea
              placeholder="Digite sua resposta..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={6}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReplyModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (selectedMessage && replyContent.trim()) {
                    await handleReplyMessage(selectedMessage.id, replyContent);
                    setShowReplyModal(false);
                    setReplyContent('');
                  }
                }}
                disabled={!replyContent.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Resposta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Encaminhamento */}
      <Dialog open={showForwardModal} onOpenChange={setShowForwardModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Encaminhar Mensagem</DialogTitle>
            <DialogDescription>
              Encaminhando mensagem de: {selectedMessage?.from}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded p-3 bg-muted">
              <p className="text-sm text-muted-foreground">Mensagem original:</p>
              <p className="text-sm mt-1">{selectedMessage?.content}</p>
            </div>
            <div>
              <Label htmlFor="recipients">Destinatários (separados por vírgula)</Label>
              <Input
                id="recipients"
                placeholder="email1@exemplo.com, email2@exemplo.com"
                value={forwardRecipients}
                onChange={(e) => setForwardRecipients(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="forward-message">Mensagem adicional (opcional)</Label>
              <Textarea
                id="forward-message"
                placeholder="Adicione uma mensagem..."
                value={forwardContent}
                onChange={(e) => setForwardContent(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForwardModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (selectedMessage && forwardRecipients.trim()) {
                    const recipients = forwardRecipients.split(',').map(r => r.trim()).filter(r => r);
                    await handleForwardMessage(selectedMessage.id, recipients, forwardContent);
                    setShowForwardModal(false);
                    setForwardContent('');
                    setForwardRecipients('');
                  }
                }}
                disabled={!forwardRecipients.trim()}
              >
                <Forward className="h-4 w-4 mr-2" />
                Encaminhar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Criar Regra de Automação */}
      <Dialog open={showCreateRuleModal} onOpenChange={setShowCreateRuleModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Regra de Automação</DialogTitle>
            <DialogDescription>
              Configure uma nova regra para automatizar o processamento de mensagens
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rule-name">Nome da Regra</Label>
              <Input
                id="rule-name"
                placeholder="Ex: Resposta automática para novos clientes"
                value={newRuleData.name}
                onChange={(e) => setNewRuleData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="rule-description">Descrição</Label>
              <Textarea
                id="rule-description"
                placeholder="Descreva o que esta regra faz..."
                value={newRuleData.description}
                onChange={(e) => setNewRuleData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trigger-type">Quando acontecer</Label>
                <Select
                  value={newRuleData.triggerType}
                  onValueChange={(value) => setNewRuleData(prev => ({ ...prev, triggerType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gatilho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_message">Nova mensagem</SelectItem>
                    <SelectItem value="keyword">Palavra-chave</SelectItem>
                    <SelectItem value="channel_specific">Canal específico</SelectItem>
                    <SelectItem value="priority_based">Baseado em prioridade</SelectItem>
                    <SelectItem value="time_based">Baseado em horário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="action-type">Ação</Label>
                <Select
                  value={newRuleData.actionType}
                  onValueChange={(value) => setNewRuleData(prev => ({ ...prev, actionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto_reply">Resposta automática</SelectItem>
                    <SelectItem value="forward_message">Encaminhar mensagem</SelectItem>
                    <SelectItem value="create_ticket">Criar ticket</SelectItem>
                    <SelectItem value="send_notification">Enviar notificação</SelectItem>
                    <SelectItem value="add_tags">Adicionar tags</SelectItem>
                    <SelectItem value="assign_agent">Atribuir agente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="priority">Prioridade (0-10)</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                max="10"
                value={newRuleData.priority}
                onChange={(e) => setNewRuleData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateRuleModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAutomationRule}
                disabled={!newRuleData.name.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Regra
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Prompt Editor Modal */}
      <Dialog open={showAiPromptEditor} onOpenChange={setShowAiPromptEditor}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Editor de Prompt IA</DialogTitle>
            <DialogDescription>
              Edite o prompt para: {
                selectedPromptType === 'intentionAnalysis' ? 'Análise de Intenção' :
                selectedPromptType === 'priorityClassification' ? 'Classificação de Prioridade' :
                selectedPromptType === 'autoResponse' ? 'Resposta Automática' :
                selectedPromptType === 'sentimentAnalysis' ? 'Análise de Sentimento' :
                selectedPromptType === 'entityExtraction' ? 'Extração de Entidades' : selectedPromptType
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prompt-content">Conteúdo do Prompt</Label>
                <Textarea
                  id="prompt-content"
                  value={tempPromptContent}
                  onChange={(e) => setTempPromptContent(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Digite o prompt aqui..."
                  data-testid="textarea-prompt-content"
                />
                <div className="space-y-2">
                  <Label htmlFor="test-message">Mensagem de Teste</Label>
                  <Textarea
                    id="test-message"
                    value={promptTestMessage}
                    onChange={(e) => setPromptTestMessage(e.target.value)}
                    className="min-h-[100px] text-sm"
                    placeholder="Digite uma mensagem para testar o prompt..."
                    data-testid="textarea-test-message"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preview & Dicas</Label>
                <div className="border rounded p-4 bg-muted min-h-[300px] space-y-3">
                  <div className="text-sm">
                    <strong>Dicas para prompts eficazes:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-muted-foreground">
                      <li>Seja específico e claro nas instruções</li>
                      <li>Use exemplos quando necessário</li>
                      <li>Defina o formato de saída esperado</li>
                      <li>Inclua contexto relevante</li>
                      <li>Use linguagem consistente</li>
                    </ul>
                  </div>

                  <Separator />

                  <div className="text-sm">
                    <strong>Variáveis disponíveis:</strong>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground font-mono">
                      <div>{'{{message_content}}'} - Conteúdo da mensagem</div>
                      <div>{'{{sender_info}}'} - Informações do remetente</div>
                      <div>{'{{channel_type}}'} - Tipo do canal</div>
                      <div>{'{{previous_context}}'} - Contexto anterior</div>
                      <div>{'{{user_history}}'} - Histórico do usuário</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-sm">
                    <strong>Análise do prompt:</strong>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Linhas:</span>
                        <span>{tempPromptContent.split('\n').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Caracteres:</span>
                        <span>{tempPromptContent.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tokens (aprox):</span>
                        <span>{Math.ceil(tempPromptContent.length / 4)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (tempPromptContent.trim() && promptTestMessage.trim()) {
                      testPromptMutation.mutate({
                        prompt: tempPromptContent,
                        testMessage: promptTestMessage,
                        promptType: selectedPromptType
                      });
                    }
                  }}
                  disabled={testPromptMutation.isPending || !tempPromptContent.trim() || !promptTestMessage.trim()}
                  data-testid="button-test-prompt"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {testPromptMutation.isPending ? 'Testando...' : 'Testar Prompt'}
                </Button>
                <Button variant="outline" size="sm" data-testid="button-use-template">
                  <FileText className="h-4 w-4 mr-2" />
                  Usar Template
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAiPromptEditor(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    const currentPrompts = { ...currentAiConfig.prompts };
                    currentPrompts[selectedPromptType as keyof typeof currentPrompts] = tempPromptContent;
                    aiForm.setValue('prompts', currentPrompts);
                    setShowAiPromptEditor(false);
                  }}
                  disabled={!tempPromptContent.trim()}
                  data-testid="button-save-prompt"
                >
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Conversation Logs Content Component
function ConversationLogsContent() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: '',
    category: '',
    notes: '',
    correctiveAction: '',
    expectedBehavior: '',
    severity: 'medium',
  });
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/omnibridge/conversation-logs', agentFilter, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (agentFilter !== 'all') {
        params.append('agentId', agentFilter);
      }
      const response = await fetch(`/api/omnibridge/conversation-logs?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
    enabled: true,
  });

  const { data: conversationDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['/api/omnibridge/conversation-logs', selectedConversationId],
    queryFn: async () => {
      const response = await fetch(`/api/omnibridge/conversation-logs/${selectedConversationId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch conversation');
      return response.json();
    },
    enabled: !!selectedConversationId,
  });

  const addFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      return apiRequest('POST', `/api/omnibridge/conversation-logs/${selectedConversationId}/feedback`, feedbackData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/conversation-logs', selectedConversationId] });
      toast({
        title: t('common.success', 'Sucesso'),
        description: t('omnibridge.feedback.added', 'Feedback adicionado com sucesso'),
      });
      setFeedbackOpen(false);
      setFeedbackForm({
        rating: '',
        category: '',
        notes: '',
        correctiveAction: '',
        expectedBehavior: '',
        severity: 'medium',
      });
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/conversation-logs', agentFilter, page, limit] });
    }, 5000);

    return () => clearInterval(interval);
  }, [queryClient, agentFilter, page, limit]);

  useEffect(() => {
    if (selectedConversationId) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/conversation-logs', selectedConversationId] });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [queryClient, selectedConversationId]);

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'pt-BR': return ptBR;
      case 'es': return es;
      default: return enUS;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPp', { locale: getDateLocale() });
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm:ss', { locale: getDateLocale() });
  };

  const handleAddFeedback = () => {
    const feedbackData = {
      ...feedbackForm,
      messageId: selectedMessageId,
      actionExecutionId: selectedActionId,
    };
    addFeedbackMutation.mutate(feedbackData);
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'excellent': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'good': return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'poor': return <ThumbsDown className="h-4 w-4 text-orange-500" />;
      case 'terrible': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getChannelConfig = (channelType: string) => {
    switch (channelType?.toLowerCase()) {
      case 'email':
        return {
          icon: Mail,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
          label: 'Email'
        };
      case 'whatsapp':
        return {
          icon: MessageCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
          label: 'WhatsApp'
        };
      case 'telegram':
        return {
          icon: Send,
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
          borderColor: 'border-cyan-200 dark:border-cyan-800',
          badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
          label: 'Telegram'
        };
      case 'sms':
        return {
          icon: Phone,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
          label: 'SMS'
        };
      default:
        return {
          icon: MessageSquare,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          badgeColor: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
          label: channelType || 'Chat'
        };
    }
  };

  const getLastInteraction = (conv: any) => {
    return conv.endedAt || conv.startedAt;
  };

  const filteredConversations = data?.data?.filter((conv: any) => {
    const matchesSearch = !searchTerm || 
      conv.agentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.channelType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'escalated' && conv.escalatedToHuman) ||
      (statusFilter === 'completed' && !conv.escalatedToHuman && conv.endedAt);
    
    return matchesSearch && matchesStatus;
  }) || [];

  const exportData = () => {
    const dataStr = JSON.stringify(filteredConversations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversations-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Se uma conversa estiver selecionada, mostrar os detalhes
  if (selectedConversationId && conversationDetail?.data) {
    const { conversation, messages, actions, feedback } = conversationDetail.data;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedConversationId(null)} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{t('omnibridge.conversationDetail.title', 'Detalhes da Conversa')}</h2>
            <p className="text-muted-foreground">
              {conversation?.agentName} • {format(new Date(conversation?.startedAt), 'PPp', { locale: getDateLocale() })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {t('omnibridge.conversationDetail.timeline', 'Timeline da Conversa')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {messages?.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedMessageId === msg.id ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedMessageId(msg.id)}
                    data-testid={`message-${msg.id}`}
                  >
                    <div className="flex-shrink-0">
                      {msg.role === 'assistant' ? (
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-purple-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">
                          {msg.role === 'assistant' ? t('omnibridge.agent', 'Agente') : t('omnibridge.user', 'Usuário')}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                      </div>
                      <p className="text-sm">{msg.content}</p>
                      {feedback?.find((f: any) => f.messageId === msg.id) && (
                        <Badge variant="secondary" className="mt-2">
                          {t('omnibridge.feedback.hasAnnotation', 'Com anotação')}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {actions?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChevronRight className="h-5 w-5" />
                    {t('omnibridge.conversationDetail.actions', 'Ações Executadas')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {actions.map((action: any) => (
                    <div
                      key={action.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedActionId === action.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedActionId(action.id)}
                      data-testid={`action-${action.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {action.success ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{action.actionName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(action.executedAt)} • {action.executionTimeMs}ms
                          </p>
                          {action.errorMessage && (
                            <p className="text-xs text-red-600 mt-1">{action.errorMessage}</p>
                          )}
                        </div>
                      </div>
                      {feedback?.find((f: any) => f.actionExecutionId === action.id) && (
                        <Badge variant="secondary">
                          {t('omnibridge.feedback.hasAnnotation', 'Com anotação')}
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('omnibridge.conversationDetail.info', 'Informações')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t('omnibridge.conversationLogs.channel', 'Canal')}</p>
                  <p className="font-medium capitalize">{conversation?.channel}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">{t('omnibridge.conversationLogs.messages', 'Mensagens')}</p>
                  <p className="font-medium">{conversation?.totalMessages}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">{t('omnibridge.conversationLogs.actions', 'Ações')}</p>
                  <p className="font-medium">{conversation?.totalActions}</p>
                </div>
                {conversation?.escalatedToHuman && (
                  <>
                    <Separator />
                    <div>
                      <Badge variant="destructive" className="w-full justify-center">
                        {t('omnibridge.conversationLogs.escalated', 'Escalada para Humano')}
                      </Badge>
                      {conversation?.escalationReason && (
                        <p className="text-sm mt-2 text-muted-foreground">{conversation.escalationReason}</p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('omnibridge.feedback.add', 'Adicionar Feedback')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(!selectedMessageId && !selectedActionId) ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('omnibridge.feedback.selectItem', 'Selecione uma mensagem ou ação para adicionar feedback')}
                  </p>
                ) : (
                  <>
                    <div>
                      <Label>{t('omnibridge.feedback.rating', 'Avaliação')}</Label>
                      <Select value={feedbackForm.rating} onValueChange={(v) => setFeedbackForm({...feedbackForm, rating: v})}>
                        <SelectTrigger data-testid="select-rating">
                          <SelectValue placeholder={t('omnibridge.feedback.selectRating', 'Selecione uma avaliação')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">⭐ {t('omnibridge.feedback.excellent', 'Excelente')}</SelectItem>
                          <SelectItem value="good">👍 {t('omnibridge.feedback.good', 'Bom')}</SelectItem>
                          <SelectItem value="neutral">😐 {t('omnibridge.feedback.neutral', 'Neutro')}</SelectItem>
                          <SelectItem value="poor">👎 {t('omnibridge.feedback.poor', 'Ruim')}</SelectItem>
                          <SelectItem value="terrible">⚠️ {t('omnibridge.feedback.terrible', 'Péssimo')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{t('omnibridge.feedback.severity', 'Severidade')}</Label>
                      <Select value={feedbackForm.severity} onValueChange={(v) => setFeedbackForm({...feedbackForm, severity: v})}>
                        <SelectTrigger data-testid="select-severity">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{t('omnibridge.feedback.low', 'Baixa')}</SelectItem>
                          <SelectItem value="medium">{t('omnibridge.feedback.medium', 'Média')}</SelectItem>
                          <SelectItem value="high">{t('omnibridge.feedback.high', 'Alta')}</SelectItem>
                          <SelectItem value="critical">{t('omnibridge.feedback.critical', 'Crítica')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{t('omnibridge.feedback.notes', 'Observações')}</Label>
                      <Textarea
                        value={feedbackForm.notes}
                        onChange={(e) => setFeedbackForm({...feedbackForm, notes: e.target.value})}
                        placeholder={t('omnibridge.feedback.notesPlaceholder', 'Descreva o que observou...')}
                        data-testid="textarea-notes"
                      />
                    </div>

                    <div>
                      <Label>{t('omnibridge.feedback.expectedBehavior', 'Comportamento Esperado')}</Label>
                      <Textarea
                        value={feedbackForm.expectedBehavior}
                        onChange={(e) => setFeedbackForm({...feedbackForm, expectedBehavior: e.target.value})}
                        placeholder={t('omnibridge.feedback.expectedPlaceholder', 'O que deveria ter acontecido...')}
                        data-testid="textarea-expected"
                      />
                    </div>

                    <div>
                      <Label>{t('omnibridge.feedback.correctiveAction', 'Ação Corretiva')}</Label>
                      <Textarea
                        value={feedbackForm.correctiveAction}
                        onChange={(e) => setFeedbackForm({...feedbackForm, correctiveAction: e.target.value})}
                        placeholder={t('omnibridge.feedback.correctivePlaceholder', 'Como o agente deve agir...')}
                        data-testid="textarea-corrective"
                      />
                    </div>

                    <Button 
                      onClick={handleAddFeedback} 
                      className="w-full"
                      disabled={addFeedbackMutation.isPending}
                      data-testid="button-submit-feedback"
                    >
                      {addFeedbackMutation.isPending 
                        ? t('common.saving', 'Salvando...') 
                        : t('common.save', 'Salvar Feedback')
                      }
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {feedback?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('omnibridge.feedback.annotations', 'Anotações')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {feedback.map((f: any) => (
                    <div key={f.id} className="p-3 bg-muted rounded-lg space-y-2" data-testid={`feedback-${f.id}`}>
                      {f.rating && (
                        <div className="flex items-center gap-2">
                          {getRatingIcon(f.rating)}
                          <Badge variant="outline" className="capitalize">{f.rating}</Badge>
                        </div>
                      )}
                      {f.notes && <p className="text-sm">{f.notes}</p>}
                      {f.severity && (
                        <Badge variant={f.severity === 'critical' || f.severity === 'high' ? 'destructive' : 'secondary'}>
                          {f.severity}
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Caso contrário, mostrar a lista de conversas
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('omnibridge.conversationLogs.title', 'Histórico de Conversas IA')}</h2>
          <p className="text-muted-foreground mt-1">
            {t('omnibridge.conversationLogs.description', 'Visualize e analise todas as conversas dos agentes IA')}
          </p>
        </div>
        <Button variant="outline" onClick={exportData} data-testid="button-export-conversations">
          <Download className="h-4 w-4 mr-2" />
          {t('common.export', 'Exportar')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('common.filters', 'Filtros')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('common.search', 'Pesquisar')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('omnibridge.conversationLogs.searchPlaceholder', 'Agente, usuário, canal...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-conversations"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('omnibridge.conversationLogs.status', 'Status')}</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all', 'Todos')}</SelectItem>
                  <SelectItem value="completed">{t('omnibridge.conversationLogs.completed', 'Concluídas')}</SelectItem>
                  <SelectItem value="escalated">{t('omnibridge.conversationLogs.escalated', 'Escaladas')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('omnibridge.conversationLogs.agent', 'Agente')}</label>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger data-testid="select-agent-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all', 'Todos')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {t('omnibridge.conversationLogs.noConversations', 'Nenhuma conversa encontrada')}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredConversations.map((conv: any) => {
            const channelConfig = getChannelConfig(conv.channelType);
            const ChannelIcon = channelConfig.icon;
            const lastInteraction = getLastInteraction(conv);
            
            return (
              <Card 
                key={conv.id} 
                className={`hover:shadow-lg transition-all cursor-pointer border-l-4 ${channelConfig.borderColor}`}
                data-testid={`card-conversation-${conv.id}`}
                onClick={() => setSelectedConversationId(conv.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${channelConfig.bgColor}`}>
                          <ChannelIcon className={`h-5 w-5 ${channelConfig.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{conv.agentName}</h3>
                            <Badge className={channelConfig.badgeColor}>
                              {channelConfig.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {conv.escalatedToHuman && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {t('omnibridge.conversationLogs.escalated', 'Escalada')}
                              </Badge>
                            )}
                            {conv.endedAt && !conv.escalatedToHuman && (
                              <Badge variant="default" className="gap-1 bg-green-600">
                                <CheckCircle className="h-3 w-3" />
                                {t('omnibridge.conversationLogs.completed', 'Concluída')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">{t('omnibridge.conversationLogs.messages', 'Mensagens')}</p>
                          <p className="font-medium flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {conv.totalMessages}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t('omnibridge.conversationLogs.actions', 'Ações')}</p>
                          <p className="font-medium flex items-center gap-1">
                            <ChevronRight className="h-3 w-3" />
                            {conv.totalActions}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-muted-foreground">
                            {conv.endedAt ? t('omnibridge.conversationLogs.lastInteraction', 'Última Interação') : t('omnibridge.conversationLogs.startTime', 'Início')}
                          </p>
                          <p className="font-medium flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {formatDate(lastInteraction)}
                          </p>
                        </div>
                      </div>
                      {conv.escalationReason && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-sm text-red-800 dark:text-red-200">
                            <strong>{t('omnibridge.conversationLogs.escalationReason', 'Motivo da escalação')}:</strong> {conv.escalationReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {data?.total > limit && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            data-testid="button-previous-page"
          >
            {t('common.previous', 'Anterior')}
          </Button>
          <span className="flex items-center px-4">
            {t('common.page', 'Página')} {page + 1} {t('common.of', 'de')} {Math.ceil(data.total / limit)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * limit >= data.total}
            data-testid="button-next-page"
          >
            {t('common.next', 'Próximo')}
          </Button>
        </div>
      )}
    </div>
  );
}

// Conversation Analytics Content Component
function ConversationAnalyticsContent() {
  const { t } = useTranslation();
  const [agentId, setAgentId] = useState<string>('1');

  const { data, isLoading } = useQuery<{ success: boolean; data: any }>({
    queryKey: ['/api/omnibridge/conversation-logs/analytics', agentId],
    queryFn: async () => {
      const response = await fetch(`/api/omnibridge/conversation-logs/analytics/${agentId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  const analytics = data?.data;

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'neutral': return 'bg-gray-500';
      case 'poor': return 'bg-orange-500';
      case 'terrible': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRatingPercentage = (count: number, total: number) => {
    return total > 0 ? (count / total) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('omnibridge.analytics.title', 'Analytics de Conversas IA')}</h2>
          <p className="text-muted-foreground mt-1">
            {t('omnibridge.analytics.description', 'Métricas de performance e aprendizado dos agentes')}
          </p>
        </div>
        <Select value={agentId} onValueChange={setAgentId}>
          <SelectTrigger className="w-48" data-testid="select-agent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Agente Suporte Técnico</SelectItem>
            <SelectItem value="2">Agente Vendas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('omnibridge.analytics.totalConversations', 'Total de Conversas')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="text-total-conversations">{analytics.conversations.total}</p>
                <p className="text-xs opacity-90 mt-1">
                  {analytics.conversations.totalMessages} {t('omnibridge.analytics.messages', 'mensagens')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  {t('omnibridge.analytics.totalActions', 'Total de Ações')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="text-total-actions">{analytics.conversations.totalActions}</p>
                <p className="text-xs opacity-90 mt-1">
                  {analytics.conversations.avgActionsPerConversation.toFixed(1)} {t('omnibridge.analytics.perConversation', 'por conversa')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {t('omnibridge.analytics.escalationRate', 'Taxa de Escalação')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="text-escalation-rate">
                  {analytics.conversations.escalationRate.toFixed(1)}%
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {t('omnibridge.analytics.escalatedToHuman', 'escaladas para humano')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('omnibridge.analytics.avgMessages', 'Média de Mensagens')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="text-avg-messages">
                  {analytics.conversations.avgMessagesPerConversation.toFixed(1)}
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {t('omnibridge.analytics.messagesPerConversation', 'mensagens por conversa')}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t('omnibridge.analytics.actionPerformance', 'Performance das Ações')}
                </CardTitle>
                <CardDescription>
                  {t('omnibridge.analytics.actionDescription', 'Taxa de sucesso e tempo médio de execução')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.actions.map((action: any) => (
                    <div key={action.actionName} className="space-y-2" data-testid={`action-stats-${action.actionName}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{action.actionName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {action.avgExecutionTime.toFixed(0)}ms
                          </span>
                          <Badge 
                            variant={action.successRate >= 90 ? 'default' : action.successRate >= 70 ? 'secondary' : 'destructive'}
                            className="gap-1"
                          >
                            {action.successRate >= 90 ? <CheckCircle className="h-3 w-3" /> : <Target className="h-3 w-3" />}
                            {action.successRate.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
                        <div 
                          className="bg-green-500" 
                          style={{ width: `${action.successRate}%` }}
                        />
                        <div 
                          className="bg-red-500" 
                          style={{ width: `${100 - action.successRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{action.success} {t('omnibridge.analytics.successful', 'sucesso')}</span>
                        <span>{action.failed} {t('omnibridge.analytics.failed', 'falha')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('omnibridge.analytics.feedbackDistribution', 'Distribuição de Feedback')}
                </CardTitle>
                <CardDescription>
                  {t('omnibridge.analytics.feedbackDescription', 'Avaliações dos usuários sobre o agente')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center pb-4">
                    <p className="text-4xl font-bold" data-testid="text-total-feedback">{analytics.feedback.total}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('omnibridge.analytics.totalFeedbacks', 'avaliações totais')}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(analytics.feedback.byRating).map(([rating, count]: [string, any]) => (
                      <div key={rating} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize">{t(`omnibridge.feedback.${rating}`, rating)}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div 
                            className={`h-full ${getRatingColor(rating)}`}
                            style={{ width: `${getRatingPercentage(count, analytics.feedback.total)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('omnibridge.analytics.resolved', 'Resolvidos')}</span>
                      <span className="font-semibold text-green-600">{analytics.feedback.resolved} / {analytics.feedback.total}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-muted-foreground">{t('omnibridge.analytics.unresolved', 'Pendentes')}</span>
                      <span className="font-semibold text-orange-600">{analytics.feedback.unresolved}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('omnibridge.analytics.insights', 'Insights e Recomendações')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.conversations.escalationRate > 20 && (
                  <div className="flex gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-200">
                        {t('omnibridge.analytics.highEscalation', 'Taxa de escalação elevada')}
                      </p>
                      <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                        {t('omnibridge.analytics.highEscalationText', 'Considere revisar o contexto do agente e adicionar mais exemplos de resolução.')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {t('omnibridge.analytics.noData', 'Nenhum dado disponível para este agente')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}