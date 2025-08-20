import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
// import useLocalization from '@/hooks/useLocalization';
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import CertificateManager from "./CertificateManager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Settings, 
  ExternalLink, 
  Key, 
  Mail,
  Database,
  Activity,
  UserCheck,
  Phone,
  MessageSquare,
  MessageCircle,
  Zap,
  Webhook,
  BarChart3,
  Shield,
  Calendar,
  Bot,
  Inbox,
  Cloud,
  HardDrive,
  Send
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
interface TenantIntegration {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: any;
  status: 'connected' | 'error' | 'disconnected';
  configured: boolean;
  features: string[];
  config?: any;
  lastSync?: string;
}
// ✅ VALIDATION: Schema for integration configurations
const integrationConfigSchema = z.object({
  // Localization temporarily disabled
  enabled: z.boolean().default(false),
  useSSL: z.boolean().default(false),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  webhookUrl: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  redirectUri: z.string().optional(),
  tenantId: z.string().optional(),
  serverHost: z.string().optional(),
  serverPort: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  // IMAP specific fields
  imapServer: z.string().optional(),
  imapPort: z.string().optional(),
  imapSecurity: z.enum(['SSL/TLS', 'STARTTLS', '[TRANSLATION_NEEDED]']).optional(),
  emailAddress: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Deve ser um email válido"
  }),
  // Dropbox specific fields
  dropboxAppKey: z.string().optional(),
  dropboxAppSecret: z.string().optional(),
  dropboxAccessToken: z.string().optional(),
  backupFolder: z.string().optional(),
  // Telegram specific fields
  telegramBotToken: z.string().optional(),
  telegramChatId: z.string().optional(),
  telegramWebhookUrl: z.string().optional(), // Webhook URL for receiving messages
  telegramNotificationTemplate: z.string().optional(),
  telegramAlertTemplate: z.string().optional(),
  telegramSummaryTemplate: z.string().optional(),
  // WhatsApp Business specific fields
  whatsappApiKey: z.string().optional(),
  whatsappPhoneNumberId: z.string().optional(),
  whatsappWebhookUrl: z.string().optional(),
  whatsappVerifyToken: z.string().optional(),
  whatsappNotificationTemplate: z.string().optional(),
  whatsappConfirmationTemplate: z.string().optional(),
});
export default function TenantAdminIntegrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<TenantIntegration | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isTestingIntegration, setIsTestingIntegration] = useState(false); // State for general testing
  const [testResult, setTestResult] = useState<any>(null); // State for test results
  const configForm = useForm<z.infer<typeof integrationConfigSchema>>({
    resolver: zodResolver(integrationConfigSchema),
    defaultValues: {
      enabled: false,
      useSSL: false,
      apiKey: '',
      apiSecret: '',
      webhookUrl: '',
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      tenantId: '',
      serverHost: '',
      serverPort: '',
      username: '',
      password: '',
      imapServer: '',
      imapPort: '',
      imapSecurity: 'SSL/TLS',
      emailAddress: '',
      dropboxAppKey: '',
      dropboxAppSecret: '',
      dropboxAccessToken: '',
      backupFolder: '/Backups/Conductor',
      // Telegram default values
      telegramBotToken: '',
      telegramChatId: '',
      telegramWebhookUrl: '', // Default for webhook URL
      telegramNotificationTemplate: `🔔 Nova notificação: {title}\nDescrição: {description}\nData: {date}\nTicket: #{ticketId",
      telegramAlertTemplate: "🚨 ALERTA: {alertType}\nPrioridade: {priority}\nDescrição: {description}\nAção necessária: {action",
      telegramSummaryTemplate: "📊 Resumo diário:\nTickets criados: {todayTickets}\nTickets resolvidos: {resolvedTickets}\nPendentes: {pendingTickets}\nTempo médio: {avgTime",
      // WhatsApp Business default values
      whatsappApiKey: '',
      whatsappPhoneNumberId: '',
      whatsappWebhookUrl: '',
      whatsappVerifyToken: '',
      whatsappNotificationTemplate: "Olá {customer_name}, você tem uma nova notificação do Conductor:\n\nTítulo: {title}\nDescrição: {description}\nData: {date}\n\nPara mais detalhes, acesse o sistema.`,
      whatsappConfirmationTemplate: `Olá {customer_name}, confirmamos o recebimento da sua solicitação:\n\nProtocolo: {protocol}\nTipo: {type}\nStatus: {status}\n\nAcompanhe pelo sistema Conductor.`,
    },
  });
  // Function to load integrations
  const loadIntegrations = async () => {
    const response = await fetch('/api/tenant-admin/integrations', {
      method: 'GET',
      headers: {
        'Authorization': "Bearer " + (localStorage.getItem("accessToken") || ""),
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error("HTTP error! status: " + response.status);
    }
    return response.json();
  };
  // Query para buscar integrações
  const { data: integrationsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/tenant-admin/integrations'],
    queryFn: loadIntegrations,
  });
  // Mutation para salvar configuração
  const saveConfigMutation = useMutation({
    mutationFn: ({ integrationId, config }: { integrationId: string; config: any }) =>
      apiRequest('POST', "/api/tenant-admin/config", config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/integrations'] });
      setIsConfigDialogOpen(false);
      toast({
        title: "Configuração salva",
        description: "A integração foi configurada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  });
  // ✅ CRITICAL FIX: Função para testar uma integração específica com melhor tratamento de erros
  const handleTestIntegration = async (integrationId: string) => {
    console.log('🧪 [TESTE-INTEGRAÇÃO] Iniciando teste para:', integrationId);
    setIsTestingIntegration(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/tenant-admin/test", {
        method: 'POST',
        headers: {
          'Authorization': "Bearer " + (localStorage.getItem("accessToken") || ""), // Use accessToken consistently
          'Content-Type': 'application/json'
        }
      });
      console.log('🧪 [TESTE-INTEGRAÇÃO] Response status:', response.status);
      console.log('🔍 [TESTE-INTEGRAÇÃO] Response details:', {
        status: response.status,
        contentType: response.headers.get('content-type'),
        headers: Object.fromEntries(response.headers.entries())
      });
      // ✅ VALIDATION: Check for JSON response
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ [TESTE-INTEGRAÇÃO] Non-JSON response received:', { status: response.status, contentType, body: textResponse.substring(0, 200) });
        throw new Error("Erro na integração");
      }
      const result = await response.json();
      if (response.ok && result.success) { // Check for HTTP OK and backend success flag
        console.log('✅ [TESTE-INTEGRAÇÃO] Sucesso:', result);
        setTestResult({
          success: true,
          message: result.message || "Teste bem-sucedido!",
          details: result.details
        });
        // Invalidate queries to reflect any status changes
        queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/integrations'] });
      } else {
        console.warn('⚠️ [TESTE-INTEGRAÇÃO] Falha na integração:', result);
        setTestResult({
          success: false,
          message: result.message || result.error || 'Falha no teste da integração',
          details: result.details
        });
      }
    } catch (error: any) {
      console.error('❌ [TESTE-INTEGRAÇÃO] Erro:', error);
      let errorMessage = '[TRANSLATION_NEEDED]';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      setTestResult({
        success: false,
        message: "Falha ao testar integração: " + errorMessage,
        error: error
      });
    } finally {
      setIsTestingIntegration(false);
    }
  };
  // ✅ NEW: Webhook management functions for Telegram
  const handleSetWebhook = async () => {
    if (!selectedIntegration) return;
    console.log('🔧 [WEBHOOK-SETUP] Configurando webhook para Telegram');
    setIsTestingIntegration(true);
    setTestResult(null); // Clear previous test results
    try {
      const webhookUrl = configForm.getValues('telegramWebhookUrl');
      if (!webhookUrl) {
        setTestResult({
          success: false,
          message: 'URL do webhook é obrigatória para configurar recebimento de mensagens'
        });
        return;
      }
      // ✅ SECURITY: Ensure the URL is valid and points to your service
      if (!webhookUrl.startsWith(window.location.origin)) {
          console.warn(") não parece ser interna. Certifique-se de que é segura e pública.");
      }
      const response = await fetch('/api/tenant-admin/integrations/telegram/set-webhook', {
        method: 'POST',
        headers: {
          'Authorization': "Bearer " + (localStorage.getItem("accessToken") || ""),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ webhookUrl })
      });
      console.log('🔧 [WEBHOOK-SETUP] Response status:', response.status);
      const result = await response.json();
      if (response.ok && result.success) { // Check for HTTP OK and backend success flag
        console.log('✅ [WEBHOOK-SETUP] Webhook configurado com sucesso:', result);
        setTestResult({
          success: true,
          message: result.message || 'Webhook configurado com sucesso!',
          details: result
        });
        // Invalidate queries to refresh integration status and potentially show updated info
        queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/integrations'] });
      } else {
        console.error('❌ [WEBHOOK-SETUP] Erro:', result);
        setTestResult({
          success: false,
          message: result.message || result.error || '[TRANSLATION_NEEDED]',
          details: result
        });
      }
    } catch (error: any) {
      console.error('❌ [WEBHOOK-SETUP] Erro de rede:', error);
      setTestResult({
        success: false,
        message: '[TRANSLATION_NEEDED]',
        error: error
      });
    } finally {
      setIsTestingIntegration(false);
    }
  };
  // ✅ NEW: Set default webhook using current domain
  const handleSetDefaultWebhook = async () => {
    if (!selectedIntegration) return;
    console.log('🚀 [DEFAULT-WEBHOOK-SETUP] Configurando webhook padrão para Telegram');
    setIsTestingIntegration(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/tenant-admin/integrations/telegram/set-webhook', {
        method: 'POST',
        headers: {
          'Authorization': "Bearer " + (localStorage.getItem("accessToken") || ""),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          useDefault: true 
        })
      });
      console.log('🚀 [DEFAULT-WEBHOOK-SETUP] Response status:', response.status);
      const result = await response.json();
      if (response.ok && result.success) {
        console.log('✅ [DEFAULT-WEBHOOK-SETUP] Webhook padrão configurado com sucesso:', result);
        setTestResult({
          success: true,
          message: result.message || '✅ Webhook padrão configurado automaticamente!',
          details: result
        });
        // Invalidate queries to refresh integration status
        queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/integrations'] });
        // Refresh config to show the new webhook URL
        queryClient.invalidateQueries({ queryKey: ["/api/tenant-admin/config"] });
      } else {
        console.error('❌ [DEFAULT-WEBHOOK-SETUP] Erro:', result);
        setTestResult({
          success: false,
          message: result.message || result.error || '[TRANSLATION_NEEDED]',
          details: result
        });
      }
    } catch (error: any) {
      console.error('❌ [DEFAULT-WEBHOOK-SETUP] Erro de rede:', error);
      setTestResult({
        success: false,
        message: '[TRANSLATION_NEEDED]',
        error: error
      });
    } finally {
      setIsTestingIntegration(false);
    }
  };
  // ✅ NEW: Check webhook status function
  const handleCheckWebhookStatus = async () => {
    if (!selectedIntegration) return;
    console.log('📊 [WEBHOOK-STATUS] Verificando status do webhook para Telegram');
    setIsTestingIntegration(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/tenant-admin/integrations/telegram/webhook-status', {
        method: 'GET',
        headers: {
          'Authorization': "Bearer " + (localStorage.getItem("accessToken") || ""),
          'Content-Type': 'application/json'
        }
      });
      console.log('📊 [WEBHOOK-STATUS] Response status:', response.status);
      const result = await response.json();
      if (response.ok && result.success) {
        console.log('✅ [WEBHOOK-STATUS] Status obtido com sucesso:', result);
        setTestResult({
          success: true,
          message: '📊 Status do webhook obtido com sucesso!',
          details: {
            webhookInfo: result.webhookInfo,
            localConfig: result.localConfig
          }
        });
      } else {
        console.error('❌ [WEBHOOK-STATUS] Erro:', result);
        setTestResult({
          success: false,
          message: result.message || result.error || '[TRANSLATION_NEEDED]',
          details: result
        });
      }
    } catch (error: any) {
      console.error('❌ [WEBHOOK-STATUS] Erro de rede:', error);
      setTestResult({
        success: false,
        message: '[TRANSLATION_NEEDED]',
        error: error
      });
    } finally {
      setIsTestingIntegration(false);
    }
  };
  // Map integrations with proper icons and saved configuration status
  const tenantIntegrations: TenantIntegration[] = integrationsData?.integrations?.length > 0 
    ? integrationsData.integrations.map((integration: any) => ({
        ...integration,
        icon: getIntegrationIcon(integration.id),
        // Use the actual status from backend instead of overriding it
        status: integration.status || 'disconnected',
        configured: integration.configured || false
      }))
    : [
    // Comunicação
    {
      id: 'gmail-oauth2',
      name: 'Gmail OAuth2',
      category: 'Comunicação',
      description: 'Integração OAuth2 com Gmail para envio e recebimento seguro de emails',
      icon: Mail,
      status: 'disconnected',
      configured: false,
      features: ['OAuth2 Authentication', 'Send/Receive Emails', 'Auto-sync', 'Secure Token Management']
    },
    {
      id: 'outlook-oauth2',
      name: 'Outlook OAuth2',
      category: 'Comunicação',
      description: 'Integração OAuth2 com Microsoft Outlook para emails corporativos',
      icon: Mail,
      status: 'disconnected',
      configured: false,
      features: ['OAuth2 Authentication', 'Exchange Integration', 'Calendar Sync', 'Corporate Email']
    },
    {
      id: 'email-smtp',
      name: 'Email SMTP',
      category: 'Comunicação',
      description: 'Configuração de servidor SMTP para envio de emails automáticos e notificações',
      icon: Mail,
      status: 'disconnected',
      configured: false,
      features: ['Notificações por email', '[TRANSLATION_NEEDED]', '[TRANSLATION_NEEDED]']
    },
    {
      id: 'imap-email',
      name: 'IMAP Email',
      category: 'Comunicação',
      description: 'Conexão IMAP para recebimento automático de emails e criação de tickets',
      icon: Inbox,
      status: 'disconnected',
      configured: false,
      features: ['Auto-criação de tickets', 'Monitoramento de caixa de entrada', 'Sincronização bidirecional', 'Suporte SSL/TLS']
    },
    {
      id: 'whatsapp-business',
      name: 'WhatsApp Business',
      category: 'Comunicação',
      description: 'Integração com WhatsApp Business API para atendimento via WhatsApp',
      icon: MessageSquare,
      status: 'disconnected',
      configured: false,
      features: ['Mensagens automáticas', 'Templates aprovados', 'Webhooks']
    },
    {
      id: 'slack',
      name: 'Slack',
      category: 'Comunicação',
      description: 'Notificações e gerenciamento de tickets através do Slack',
      icon: MessageCircle,
      status: 'disconnected',
      configured: false,
      features: ['Notificações de tickets', 'Comandos slash', 'Bot integrado']
    },
    {
      id: 'twilio-sms',
      name: 'Twilio SMS',
      category: 'Comunicação',
      description: 'Envio de SMS para notificações e alertas importantes',
      icon: Phone,
      status: 'disconnected',
      configured: false,
      features: ['SMS automático', 'Notificações críticas', 'Verificação 2FA']
    },
    {
      id: 'telegram',
      name: 'Telegram',
      category: 'Comunicação',
      description: 'Envio de notificações e alertas via Telegram para grupos ou usuários',
      icon: Send,
      status: 'disconnected',
      configured: false,
      features: ['Notificações em tempo real', 'Mensagens personalizadas', 'Integração com Bot API']
    },
    // Automação
    {
      id: 'zapier',
      name: 'Zapier',
      category: 'Automação',
      description: 'Conecte com mais de 3000 aplicativos através de automações Zapier',
      icon: Zap,
      status: 'disconnected',
      configured: false,
      features: ['Workflows automáticos', '3000+ integrações', 'Triggers personalizados']
    },
    {
      id: 'webhooks',
      name: 'Webhooks',
      category: 'Automação',
      description: 'Configure webhooks personalizados para eventos do sistema',
      icon: Webhook,
      status: 'disconnected',
      configured: false,
      features: ['Eventos em tempo real', 'Payload customizável', 'Retry automático']
    },
    // Dados
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      category: 'Dados',
      description: 'Rastreamento e análise de performance do atendimento',
      icon: BarChart3,
      status: 'disconnected',
      configured: false,
      features: ['Métricas de conversão', 'Funis de atendimento', '[TRANSLATION_NEEDED]']
    },
    {
      id: 'crm-integration',
      name: 'CRM Integration',
      category: 'Dados',
      description: 'Sincronização bidirecional com seu sistema CRM',
      icon: Database,
      status: 'disconnected',
      configured: false,
      features: ['Sync automático', 'Campos customizados', 'Histórico completo']
    },
    // Segurança
    {
      id: 'sso-saml',
      name: 'SSO/SAML',
      category: 'Segurança',
      description: 'Single Sign-On com provedores SAML para login corporativo',
      icon: Shield,
      status: 'disconnected',
      configured: false,
      features: ['Login corporativo', 'Múltiplos provedores', 'Controle de acesso']
    },
    // Produtividade
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      category: 'Produtividade',
      description: 'Integração com Gmail, Calendar e Drive para produtividade',
      icon: Calendar,
      status: 'disconnected',
      configured: false,
      features: ['Sincronização de calendário', 'Anexos do Drive', 'Emails corporativos']
    },
    {
      id: 'chatbot-ai',
      name: 'Chatbot IA',
      category: 'Produtividade',
      description: 'Chatbot inteligente para atendimento automatizado 24/7',
      icon: Bot,
      status: 'disconnected',
      configured: false,
      features: ['Respostas automáticas', 'Machine Learning', 'Escalação inteligente']
    },
    {
      id: 'dropbox-personal',
      name: 'Dropbox Pessoal',
      category: 'Dados',
      description: 'Integração com conta pessoal do Dropbox para backup e armazenamento de documentos',
      icon: Cloud,
      status: 'disconnected',
      configured: false,
      features: ['Backup automático', 'Sincronização de anexos', 'Armazenamento seguro', 'API v2 Dropbox']
    }
  ];
  function getIntegrationIcon(id: string) {
    switch (id) {
      case 'gmail-oauth2':
      case 'outlook-oauth2':
      case 'email-smtp':
        return Mail;
      case 'imap-email':
        return Inbox;
      case 'whatsapp-business':
        return MessageSquare;
      case 'slack':
        return MessageCircle;
      case 'twilio-sms':
        return Phone;
      case 'telegram':
        return Send; // Telegram icon
      case 'zapier':
        return Zap;
      case 'webhooks':
        return Webhook;
      case 'google-analytics':
        return BarChart3;
      case 'crm-integration':
        return Database;
      case 'dropbox-personal':
        return Cloud;
      case 'sso-saml':
        return Shield;
      case 'google-workspace':
        return Calendar;
      case 'chatbot-ai':
        return Bot;
      default:
        return Database;
    }
  }
  if (isLoading) {
    return (
      <div className=""
        <div className=""
          <div className="text-lg">"Carregando integrações...</div>
        </div>
      </div>
    );
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'disconnected': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'disconnected': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Comunicação': return 'bg-blue-100 text-blue-800';
      case 'Automação': return 'bg-purple-100 text-purple-800';
      case 'Dados': return 'bg-green-100 text-green-800';
      case 'Segurança': return 'bg-red-100 text-red-800';
      case 'Produtividade': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const onConfigureIntegration = async (integration: TenantIntegration) => {
    console.log(`🔧 [CONFIG-LOAD] Configurando integração: " + integration.id`);
    setSelectedIntegration(integration);
    setTestResult(null); // Clear previous test results when opening dialog
    try {
      // ✅ CRITICAL FIX: Usar fetch direto com headers corretos
      console.log("🔍 [CONFIG-LOAD] Buscando configuração para: ${integration.id`);
      const response = await fetch("/api/tenant-admin/config", {
        method: 'GET',
        headers: {
          'Authorization': "Bearer " + (localStorage.getItem("accessToken") || ""),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      console.log("
      if (!response.ok) {
        // Handle case where config might not exist yet (e.g., return 404)
        if (response.status === 404) {
          console.log(", usando valores padrão.`);
          // Set default values here
          configForm.reset(getDefaultValues(integration.id));
          setIsConfigDialogOpen(true);
          return;
        }
        throw new Error("
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error(`❌ [CONFIG-LOAD] Non-JSON response received:`, {
          status: response.status,
          contentType,
          bodyStart: textResponse.substring(0, 200)
        });
        throw new Error('Servidor retornou resposta inválida (não JSON)');
      }
      const existingConfigData = await response.json(); // Renamed to avoid confusion with form data
      console.log(`📋 [CONFIG-LOAD] Resposta recebida:`, existingConfigData);
      // ✅ IMPROVED: Validação mais robusta da configuração existente
      // Check if 'configured' field exists and is true, and if 'config' object is present and has keys
      const hasValidConfig = existingConfigData && 
        existingConfigData.configured === true && 
        existingConfigData.config && 
        typeof existingConfigData.config === 'object' &&
        Object.keys(existingConfigData.config).length > 0;
      if (hasValidConfig) {
        const config = existingConfigData.config;
        console.log("
        // ✅ SECURITY: Função para mascarar dados sensíveis de forma consistente
        const maskSensitiveData = (value: string | undefined | null): string => {
          if (!value || value.length === 0) return '';
          // Keep already masked values or mask new ones
          if (value === '••••••••') return value; 
          // Mask if the value is long enough to be considered sensitive
          return value.length > 8 ? '••••••••' : value; 
        };
        // ✅ STANDARDIZED: Carregamento padronizado para todas as integrações
        const formValues = {
          enabled: Boolean(config.enabled),
          useSSL: config.useSSL !== false,
          // OAuth2 fields
          clientId: config.clientId || '',
          clientSecret: maskSensitiveData(config.clientSecret),
          redirectUri: config.redirectUri || '',
          tenantId: config.tenantId || '',
          // Generic API fields
          apiKey: maskSensitiveData(config.apiKey),
          apiSecret: maskSensitiveData(config.apiSecret),
          webhookUrl: config.webhookUrl || '',
          // Server/Email fields
          serverHost: config.serverHost || config.imapServer || '',
          serverPort: config.serverPort ? String(config.serverPort) : (config.imapPort ? String(config.imapPort) : ''),
          username: config.username || config.emailAddress || '',
          password: maskSensitiveData(config.password),
          // IMAP specific fields
          imapServer: config.imapServer || 'imap.gmail.com',
          imapPort: config.imapPort ? String(config.imapPort) : '993',
          imapSecurity: config.imapSecurity || 'SSL/TLS',
          emailAddress: config.emailAddress || '',
          // Dropbox specific fields
          dropboxAppKey: config.dropboxAppKey || '',
          dropboxAppSecret: maskSensitiveData(config.dropboxAppSecret),
          dropboxAccessToken: maskSensitiveData(config.dropboxAccessToken),
          backupFolder: config.backupFolder || '/Backups/Conductor',
          // Telegram specific fields - CRITICAL FIX
          telegramBotToken: maskSensitiveData(config.telegramBotToken),
          telegramChatId: config.telegramChatId || '',
          telegramWebhookUrl: config.telegramWebhookUrl || '', // Load the webhook URL
          telegramNotificationTemplate: config.telegramNotificationTemplate || `🔔 Nova notificação: {title}\nDescrição: {description}\nData: {date}\nTicket: #{ticketId",
          telegramAlertTemplate: config.telegramAlertTemplate || "🚨 ALERTA: {alertType}\nPrioridade: {priority}\nDescrição: {description}\nAção necessária: {action",
          telegramSummaryTemplate: config.telegramSummaryTemplate || "📊 Resumo diário:\nTickets criados: {todayTickets}\nTickets resolvidos: {resolvedTickets}\nPendentes: {pendingTickets}\nTempo médio: {avgTime",
          // WhatsApp Business specific fields
          whatsappApiKey: maskSensitiveData(config.whatsappApiKey),
          whatsappPhoneNumberId: config.whatsappPhoneNumberId || '',
          whatsappWebhookUrl: config.whatsappWebhookUrl || '',
          whatsappVerifyToken: config.whatsappVerifyToken || '',
          whatsappNotificationTemplate: config.whatsappNotificationTemplate || '',
          whatsappConfirmationTemplate: config.whatsappConfirmationTemplate || '',
        };
        // ✅ TELEGRAM DEBUG: Log específico para debugging
        if (integration.id === 'telegram') {
          console.log(`📱 [TELEGRAM-CONFIG] Configuração carregada:`, {
            enabled: formValues.enabled,
            hasBotToken: Boolean(config.telegramBotToken),
            botTokenMasked: formValues.telegramBotToken,
            chatId: formValues.telegramChatId,
            webhookUrl: formValues.telegramWebhookUrl
          });
        }
        configForm.reset(formValues);
        toast({
          title: "✅ Configuração carregada",
          description: " carregados com sucesso",
        });
      } else {
        console.log(", usando valores padrão.`);
        configForm.reset(getDefaultValues(integration.id));
        toast({
          title: "ℹ️ Nova configuração",
          description: " pela primeira vez`,
        });
      }
    } catch (error: any) {
      console.error(":`, error);
      // ✅ IMPROVED: Tratamento de erro mais robusto
      const errorMessage = error?.message || '[TRANSLATION_NEEDED]';
      const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('Network');
      // Fallback values if an error occurs during loading
      configForm.reset(getDefaultValues(integration.id));
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: isNetworkError 
          ? "Problema de conectividade. Usando valores padrão." 
          : '[TRANSLATION_NEEDED]',
        variant: "destructive",
      });
    }
    setIsConfigDialogOpen(true);
  };
  // Helper function to get default values based on integration ID
  const getDefaultValues = (integrationId: string) => {
    const baseDefaults = {
      enabled: false,
      useSSL: true, // Default to true for secure connections
      apiKey: '',
      apiSecret: '',
      webhookUrl: '',
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      tenantId: '',
      serverHost: '',
      serverPort: '',
      username: '',
      password: '',
      imapServer: 'imap.gmail.com', // Common default
      imapPort: '993', // Common default for IMAP SSL
      imapSecurity: 'SSL/TLS' as const,
      emailAddress: '',
      dropboxAppKey: '',
      dropboxAppSecret: '',
      dropboxAccessToken: '',
      backupFolder: '/Backups/Conductor',
      telegramBotToken: '',
      telegramChatId: '',
      telegramWebhookUrl: '', // Default for webhook URL
      telegramNotificationTemplate: `🔔 Nova notificação: {title}\nDescrição: {description}\nData: {date}\nTicket: #{ticketId",
      telegramAlertTemplate: "🚨 ALERTA: {alertType}\nPrioridade: {priority}\nDescrição: {description}\nAção necessária: {action",
      telegramSummaryTemplate: "📊 Resumo diário:\nTickets criados: {todayTickets}\nTickets resolvidos: {resolvedTickets}\nPendentes: {pendingTickets}\nTempo médio: {avgTime",
      // WhatsApp Business default values
      whatsappApiKey: '',
      whatsappPhoneNumberId: '',
      whatsappWebhookUrl: '',
      whatsappVerifyToken: '',
      whatsappNotificationTemplate: "Olá {customer_name}, você tem uma nova notificação do Conductor:\n\nTítulo: {title}\nDescrição: {description}\nData: {date}\n\nPara mais detalhes, acesse o sistema.`,
      whatsappConfirmationTemplate: `Olá {customer_name}, confirmamos o recebimento da sua solicitação:\n\nProtocolo: {protocol}\nTipo: {type}\nStatus: {status}\n\nAcompanhe pelo sistema Conductor.`,
    };
    // Specific defaults by integration type
    switch (integrationId) {
      case 'imap-email':
        return { ...baseDefaults, serverPort: '993', imapPort: '993', imapSecurity: 'SSL/TLS' };
      case 'email-smtp':
        return { ...baseDefaults, serverPort: '587', useSSL: true }; // SMTP often uses STARTTLS on 587
      case 'telegram':
        return { ...baseDefaults, telegramWebhookUrl: "/api/webhooks/telegram` }; // Suggest a default webhook URL
      case 'whatsapp-business':
        return { ...baseDefaults, whatsappWebhookUrl: "/api/webhooks/whatsapp` }; // Suggest a default webhook URL
      default:
        return baseDefaults;
    }
  };
  // Function to initiate OAuth2 flow
  const startOAuthFlow = async (integration: TenantIntegration) => {
    try {
      // ✅ ENHANCEMENT: Use the actual integration ID to construct the redirect URI
      const redirectUri = "/callback`;
      // ✅ IMPROVEMENT: Pass redirectUri to backend for state management and validation
      const response = await fetch("/oauth/start`, {
        method: 'POST',
        headers: {
          'Authorization': "Bearer " + (localStorage.getItem("accessToken") || ""),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ redirectUri }) // Send redirect URI to backend
      });
      // ✅ VALIDATION: Check for 'authUrl' in response
      const result = await response.json();
      if (!result.authUrl) {
        throw new Error(result.error || 'Não foi possível obter a URL de autorização.');
      }
      // Open OAuth2 URL in new window
      window.open(result.authUrl, 'oauth2', 'width=600,height=600,scrollbars=yes,resizable=yes');
      toast({
        title: "OAuth2 Iniciado",
        description: "Janela de autorização aberta. Complete o processo de login.",
      });
    } catch (error: any) {
      console.error('❌ [OAUTH-FLOW] Erro:', error);
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || '[TRANSLATION_NEEDED]',
        variant: "destructive",
      });
    }
  };
  const onSubmitConfig = async (data: z.infer<typeof integrationConfigSchema>) => {
    if (!selectedIntegration) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
        variant: "destructive",
      });
      return;
    }
    try {
      // ✅ VALIDATION: Validação específica por tipo de integração
      const validateIntegrationData = (integrationId: string, formData: any) => {
        const errors: string[] = [];
        // Helper to check if a sensitive field needs to be provided (not masked)
        const isSensitiveFieldProvided = (fieldName: string): boolean => {
          const value = formData[fieldName];
          return value && value !== '••••••••';
        };
        switch (integrationId) {
          case 'telegram':
            if (formData.enabled) {
              if (!formData.telegramBotToken || formData.telegramBotToken === '••••••••') {
                errors.push('Bot Token é obrigatório para ativar o Telegram');
              }
              if (!formData.telegramChatId) {
                errors.push('Chat ID é obrigatório para ativar o Telegram');
              }
              // Optional: Validate webhook URL if it's intended to be used
              if (formData.telegramWebhookUrl && !formData.telegramWebhookUrl.startsWith('https://')) {
                errors.push('URL do Webhook deve começar com "https://"');
              }
            }
            break;
          case 'email-smtp':
            if (formData.enabled) {
              if (!formData.serverHost) errors.push('Servidor SMTP é obrigatório');
              if (!formData.serverPort) errors.push('Porta SMTP é obrigatória');
              if (!formData.username) errors.push('Usuário é obrigatório');
              if (!formData.password || formData.password === '••••••••') {
                errors.push('Senha é obrigatória');
              }
            }
            break;
          case 'imap-email':
            if (formData.enabled) {
              if (!formData.imapServer) errors.push('Servidor IMAP é obrigatório');
              if (!formData.emailAddress) errors.push('Endereço de email é obrigatório');
              if (!formData.password || formData.password === '••••••••') {
                errors.push('Senha é obrigatória');
              }
            }
            break;
          case 'gmail-oauth2':
          case 'outlook-oauth2':
            if (formData.enabled) {
              if (!formData.clientId) errors.push('Client ID é obrigatório');
              if (!formData.clientSecret || formData.clientSecret === '••••••••') {
                errors.push('Client Secret é obrigatório');
              }
            }
            break;
          case 'dropbox-personal':
            if (formData.enabled) {
              if (!formData.dropboxAppKey) errors.push('App Key é obrigatória');
              if (!formData.dropboxAccessToken || formData.dropboxAccessToken === '••••••••') {
                errors.push('Access Token é obrigatório');
              }
            }
            break;
          case 'webhooks':
            if (formData.enabled && formData.webhookUrl && !formData.webhookUrl.startsWith('https://')) {
                errors.push('URL do Webhook deve começar com "https://"');
            }
            break;
          case 'whatsapp-business':
            if (formData.enabled) {
              if (!formData.whatsappApiKey) errors.push('API Key do WhatsApp Business é obrigatória');
              if (!formData.whatsappPhoneNumberId) errors.push('Phone Number ID é obrigatório');
              if (!formData.whatsappWebhookUrl) errors.push('URL do Webhook é obrigatória');
              if (!formData.whatsappVerifyToken) errors.push('Verify Token é obrigatório');
            }
            break;
        }
        return errors;
      };
      const validationErrors = validateIntegrationData(selectedIntegration.id, data);
      if (validationErrors.length > 0) {
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: validationErrors.join('. '),
          variant: "destructive",
        });
        return;
      }
      // ✅ PREPARATION: Preparar dados baseado no tipo de integração
      let configData: any = {
        enabled: data.enabled === true,
        lastUpdated: new Date().toISOString(),
        integrationVersion: '1.0',
        ...data
      };
      // ✅ SPECIALIZED PROCESSING: Processamento específico por integração
      // Ensure sensitive data is not re-masked if it was already '••••••••'
      const processSensitiveData = (currentConfig: any, newData: any) => {
        const sensitiveFields = [
          'clientSecret', 'apiSecret', 'password', 'dropboxAppSecret', 
          'dropboxAccessToken', 'telegramBotToken', 'whatsappApiKey', 'whatsappVerifyToken'
        ];
        sensitiveFields.forEach(field => {
          if (newData[field] === '••••••••' && currentConfig && currentConfig[field]) {
            // If the new value is masked and we have a previous value, keep the previous one
            newData[field] = currentConfig[field];
          } else if (newData[field] === '••••••••' && (!currentConfig || !currentConfig[field])) {
             // If it's masked and there was no previous value, it's an invalid state
             // This should ideally be caught by validation, but as a safeguard:
             // newData[field] = ''; // Or handle as error
          }
        });
        return newData;
      };
      // Fetch current config to handle sensitive data correctly
      let currentConfig = null;
      try {
        const configResponse = await fetch("/api/tenant-admin/config", {
          method: 'GET',
          headers: {
            'Authorization': "Bearer " + (localStorage.getItem("accessToken") || ""),
            'Content-Type': 'application/json'
          }
        });
        if (configResponse.ok) {
          const configResult = await configResponse.json();
          if (configResult.config) {
            currentConfig = configResult.config;
          }
        }
      } catch (fetchError) {
        console.warn("Could not fetch current config for sensitive data processing:", fetchError);
      }
      configData = processSensitiveData(currentConfig, configData);
      switch (selectedIntegration.id) {
        case 'imap-email':
          configData = {
            ...configData,
            imapServer: data.imapServer || 'imap.gmail.com',
            imapPort: parseInt(data.imapPort || '993') || 993,
            emailAddress: data.emailAddress || '',
            // useSSL is handled by the general field, but ensure it maps correctly if needed
            serverHost: data.imapServer || 'imap.gmail.com',
            serverPort: parseInt(data.imapPort || '993') || 993,
            username: data.emailAddress || ''
          };
          break;
        case 'email-smtp':
          configData = {
            ...configData,
            serverHost: data.serverHost || '',
            serverPort: parseInt(data.serverPort || '587') || 587,
            username: data.username || '',
            // useSSL is handled by the general field
          };
          break;
        case 'telegram':
          configData = {
            ...configData,
            telegramBotToken: data.telegramBotToken || '',
            telegramChatId: data.telegramChatId || '',
            telegramWebhookUrl: data.telegramWebhookUrl || '', // Include the webhook URL
            telegramNotificationTemplate: data.telegramNotificationTemplate || `🔔 Nova notificação: {title}\nDescrição: {description}\nData: {date}\nTicket: #{ticketId",
            telegramAlertTemplate: data.telegramAlertTemplate || "🚨 ALERTA: {alertType}\nPrioridade: {priority}\nDescrição: {description}\nAção necessária: {action",
            telegramSummaryTemplate: data.telegramSummaryTemplate || "📊 Resumo diário:\nTickets criados: {todayTickets}\nTickets resolvidos: {resolvedTickets}\nPendentes: {pendingTickets}\nTempo médio: {avgTime",
          };
          break;
        case 'dropbox-personal':
          configData = {
            ...configData,
            dropboxAppKey: data.dropboxAppKey || '',
            dropboxAppSecret: data.dropboxAppSecret || '',
            dropboxAccessToken: data.dropboxAccessToken || '',
            backupFolder: data.backupFolder || '/Backups/Conductor'
          };
          break;
        case 'whatsapp-business':
          configData = {
            ...configData,
            whatsappApiKey: data.whatsappApiKey || '',
            whatsappPhoneNumberId: data.whatsappPhoneNumberId || '',
            whatsappWebhookUrl: data.whatsappWebhookUrl || '',
            whatsappVerifyToken: data.whatsappVerifyToken || '',
            whatsappNotificationTemplate: data.whatsappNotificationTemplate || '',
            whatsappConfirmationTemplate: data.whatsappConfirmationTemplate || '',
          };
          break;
        default:
          // For other integrations, standard fields apply
          break;
      }
      console.log(":`, {
        integrationId: selectedIntegration.id,
        enabled: configData.enabled,
        fieldsCount: Object.keys(configData).length
      });
      saveConfigMutation.mutate({
        integrationId: selectedIntegration.id,
        config: configData
      });
    } catch (error: any) {
      console.error('❌ [SUBMIT-CONFIG] Erro ao processar configuração:', error);
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
        variant: "destructive",
      });
    }
  };
  const groupedIntegrations = tenantIntegrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, TenantIntegration[]>);
  return (
    <div className=""
      {/* Header */}
      <div className=""
        <div className=""
          <div>
            <h1 className=""
              Integrações do Tenant
            </h1>
            <p className=""
              Configurar integrações específicas para este workspace
            </p>
          </div>
        </div>
      </div>
      {/* Stats Cards */}
      <div className=""
        <Card>
          <CardHeader className=""
            <CardTitle className="text-lg">"Total de Integrações</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"{tenantIntegrations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className=""
            <CardTitle className="text-lg">"Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className=""
              {tenantIntegrations.filter(i => i.status === 'connected').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className=""
            <CardTitle className="text-lg">"Configuradas</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className=""
              {tenantIntegrations.filter(i => i.configured).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className=""
            <CardTitle className="text-lg">"Categorias</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className=""
              {Object.keys(groupedIntegrations).length}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Integrações por Categoria */}
      <Tabs defaultValue="certificados" className=""
        <TabsList className="text-lg">"
          <TabsTrigger value="certificados>
            Certificados
          </TabsTrigger>
          {Object.keys(groupedIntegrations).map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* Aba de Certificados */}
        <TabsContent value="certificados" className=""
          <Card>
            <CardHeader>
              <CardTitle className=""
                <Shield className="h-6 w-6 text-purple-600" />
                <span>Gerenciamento de Certificados Digitais</span>
              </CardTitle>
              <p className=""
                Configure e gerencie certificados digitais ICP-Brasil para assinatura de documentos CLT
              </p>
            </CardHeader>
            <CardContent>
              <CertificateManager />
            </CardContent>
          </Card>
        </TabsContent>
        {Object.entries(groupedIntegrations).map(([category, integrations]) => (
          <TabsContent key={category} value={category} className=""
            <div className=""
              {integrations.map((integration) => {
                const IconComponent = integration.icon || Mail; // Fallback to Mail icon
                return (
                  <Card key={integration.id} className=""
                    <CardHeader className=""
                      <div className=""
                        <div className=""
                          <div className=""
                            <IconComponent className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className=""
                            <CardTitle className="text-base md:text-lg truncate" title={integration.name}>
                              {integration.name}
                            </CardTitle>
                            <Badge className="" text-xs mt-1>
                              {integration.category}
                            </Badge>
                          </div>
                        </div>
                        <div className=""
                          {integration.configured && (
                            <Badge className=""
                              <CheckCircle className="h-3 w-3 mr-1" />
                              <span className="text-lg">"Configurado</span>
                              <span className="text-lg">"Config.</span>
                            </Badge>
                          )}
                          <Badge className="" text-xs>
                            {getStatusIcon(integration.status)}
                            <span className="text-lg">"{integration.status}</span>
                            <span className=""
                              {integration.status === 'connected' ? 'OK' : 
                               integration.status === 'disconnected' ? 'OFF' : 'ERR'}
                            </span>
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className=""
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2" title={integration.description}>
                        {integration.description}
                      </p>
                      {integration.features && integration.features.length > 0 && (
                        <div className=""
                          <h4 className="text-lg">"Recursos:</h4>
                          <div className=""
                            {integration.features.slice(0, 2).map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs" title={feature}>
                                {feature.length > 20 ? "...` : feature}
                              </Badge>
                            ))}
                            {integration.features.length > 2 && (
                              <Badge variant="outline" className="text-xs" title={" recursos adicionais>
                                +{integration.features.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {/* ✅ IMPROVED: Layout responsivo dos botões */}
                      <div className=""
                        {/* Primeira linha - Configurar (sempre visível) */}
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onConfigureIntegration(integration);
                          }}
                          className="w-full"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar
                        </Button>
                        {/* Segunda linha - OAuth2 e Testar */}
                        <div className=""
                          {(integration.id === 'gmail-oauth2' || integration.id === 'outlook-oauth2') && (
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startOAuthFlow(integration);
                              }}
                              className="flex-1"
                            >
                              <Key className="h-4 w-4 mr-1" />
                              <span className="text-lg">"OAuth2</span>
                              <span className="text-lg">"Auth</span>
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleTestIntegration(integration.id`);
                            }}
                            disabled={isTestingIntegration}
                            className=""
                          >
                            {isTestingIntegration ? ( // Use the general isTestingIntegration state
                              <>
                                <div className="h-4 w-4 mr-1 animate-spin border-2 border-current border-t-transparent rounded-full" />
                                <span className="text-lg">"Testando...</span>
                                <span className="text-lg">"Test...</span>
                              </>
                            ) : (
                              <>
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Testar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      {integration.lastSync && (
                        <p className="text-xs text-gray-500 mt-3 truncate" title={"
                          Sync: {new Date(integration.lastSync).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      {/* Dialog de Configuração */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="integration-config-description>
          <DialogHeader>
            <DialogTitle>
              Configurar {selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription id="integration-config-description>
              Configure os parâmetros necessários para ativar esta integração no seu workspace.
            </DialogDescription>
          </DialogHeader>
          {selectedIntegration && (
            <Form {...configForm}>
              <form onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                configForm.handleSubmit(onSubmitConfig)(e);
              }} className=""
                <FormField
                  control={configForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className=""
                      <div className=""
                        <FormLabel className=""
                          Habilitar Integração
                        </FormLabel>
                        <div className=""
                          Ativar ou desativar esta integração
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {/* Campos específicos para OAuth2 */}
                {(selectedIntegration.id === 'gmail-oauth2' || selectedIntegration.id === 'outlook-oauth2') && (
                  <>
                    <FormField
                      control={configForm.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {selectedIntegration.id === 'gmail-oauth2' ? 'Client ID (Google Cloud Console)' : 'Application (Client) ID (Azure AD)'}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 123456789-abcdef.apps.googleusercontent.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="clientSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Secret</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Client Secret" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="redirectUri"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Redirect URI</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter ${window.location.origin}/auth/${selectedIntegration.id}/callback" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {selectedIntegration.id === 'outlook-oauth2' && (
                      <FormField
                        control={configForm.control}
                        name="tenantId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tenant ID (Opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Azure AD Tenant ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}
                {/* Campos para SMTP */}
                {selectedIntegration.id === 'email-smtp' && (
                  <>
                    <FormField
                      control={configForm.control}
                      name="serverHost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Servidor SMTP</FormLabel>
                          <FormControl>                            <Input placeholder="smtp.gmail.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="serverPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porta</FormLabel>
                          <FormControl>
                            <Input placeholder="587" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuário</FormLabel>
                          <FormControl>
                            <Input placeholder="usuario@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Senha do email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="useSSL"
                      render={({ field }) => (
                        <FormItem className=""
                          <div className=""
                            <FormLabel className=""
                              Usar SSL/TLS
                            </FormLabel>
                            <div className=""
                              Habilitar conexão segura
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}
                {/* Campos para IMAP Email */}
                {selectedIntegration.id === 'imap-email' && (
                  <div className=""
                    <FormField
                      control={configForm.control}
                      name="imapServer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Servidor IMAP</FormLabel>
                          <FormControl>
                            <Input placeholder="imap.gmail.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="imapPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porta IMAP</FormLabel>
                          <FormControl>
                            <Input placeholder="993" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="emailAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço de Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="suporte@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha do Email</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Senha ou App Password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="imapSecurity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Segurança</FormLabel>
                          <FormControl>
                            <select 
                              {...field} 
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="SSL/TLS">SSL/TLS (Porta 993)</option>
                              <option value="STARTTLS">STARTTLS (Porta 143)</option>
                              <option value='[TRANSLATION_NEEDED]'>Sem criptografia (Porta 143)</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="useSSL"
                      render={({ field }) => (
                        <FormItem className=""
                          <div className=""
                            <FormLabel className=""
                              Usar SSL/TLS
                            </FormLabel>
                            <div className=""
                              Habilitar conexão segura IMAP
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                {/* Campos para Dropbox Pessoal */}
                {selectedIntegration.id === 'dropbox-personal' && (
                  <>
                    <FormField
                      control={configForm.control}
                      name="dropboxAppKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>App Key</FormLabel>
                          <FormControl>
                            <Input placeholder="Chave da aplicação Dropbox" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="dropboxAppSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>App Secret</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Segredo da aplicação Dropbox" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="dropboxAccessToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Token</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Token de acesso da conta pessoal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="backupFolder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pasta de Backup</FormLabel>
                          <FormControl>
                            <Input placeholder="/Backups/Conductor" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                {/* Campos para Telegram */}
                {selectedIntegration.id === 'telegram' && (
                  <>
                    {/* Original Telegram Fields */}
                    <div className=""
                      <h4 className="text-lg">"🤖 Configuração do Bot Telegram</h4>
                      <FormField
                        control={configForm.control}
                        name="telegramBotToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bot Token</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Token do Bot Telegram" {...field} />
                            </FormControl>
                            <FormDescription>
                              Obtenha seu token conversando com @BotFather no Telegram
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={configForm.control}
                        name="telegramChatId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chat ID</FormLabel>
                            <FormControl>
                              <Input placeholder="ID do chat (ex: @meucanal ou 123456789)" {...field} />
                            </FormControl>
                            <FormDescription>
                              Para descobrir seu Chat ID, envie uma mensagem para @userinfobot
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={configForm.control}
                        name="telegramWebhookUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Webhook (Para receber mensagens)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://seu-dominio.com (opcional - use o botão 'Webhook Padrão' para configurar automaticamente)" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Configure para receber mensagens do Telegram no sistema. Use o botão "Webhook Padrão" para configurar automaticamente com a URL atual.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Templates de Mensagens Personalizáveis */}
                    <div className=""
                      <h4 className="text-lg">"📝 Templates de Mensagens</h4>
                      <div className=""
                        <div className=""
                          <Label className="text-lg">"Template de Notificação</Label>
                          <Textarea
                            placeholder="🔔 Nova notificação: {title}\nDescrição: {description}\nData: {date}\nTicket: #{ticketId}"
                            className="text-xs h-24 bg-white border-green-200"
                            value={configForm.watch('telegramNotificationTemplate') || ''}
                            onChange={(e) => configForm.setValue('telegramNotificationTemplate', e.target.value)}
                          />
                        </div>
                        <div className=""
                          <Label className="text-lg">"Template de Alerta</Label>
                          <Textarea
                            placeholder="🚨 ALERTA: {alertType}\nPrioridade: {priority}\nDescrição: {description}\nAção necessária: {action}"
                            className="text-xs h-24 bg-white border-green-200"
                            value={configForm.watch('telegramAlertTemplate') || ''}
                            onChange={(e) => configForm.setValue('telegramAlertTemplate', e.target.value)}
                          />
                        </div>
                        <div className=""
                          <Label className="text-lg">"Template de Resumo</Label>
                          <Textarea
                            placeholder="📊 Resumo diário:\nTickets criados: {todayTickets}\nTickets resolvidos: {resolvedTickets}\nPendentes: {pendingTickets}\nTempo médio: {avgTime}"
                            className="text-xs h-24 bg-white border-green-200"
                            value={configForm.watch('telegramSummaryTemplate') || ''}
                            onChange={(e) => configForm.setValue('telegramSummaryTemplate', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {/* Campos para WhatsApp Business */}
                {selectedIntegration.id === 'whatsapp-business' && (
                  <div className=""
                    <FormField
                      control={configForm.control}
                      name="whatsappApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp Business API Key</FormLabel>
                          <FormControl>
                            <Input placeholder="Sua API Key do WhatsApp Business" {...field} />
                          </FormControl>
                          <FormDescription>
                            Obtenha sua API Key no WhatsApp Business Platform
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="whatsappPhoneNumberId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number ID</FormLabel>
                          <FormControl>
                            <Input placeholder="ID do número de telefone" {...field} />
                          </FormControl>
                          <FormDescription>
                            ID do número de telefone configurado no WhatsApp Business
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="whatsappWebhookUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL do Webhook</FormLabel>
                          <FormControl>
                            <Input placeholder="https://seu-dominio.com/webhook/whatsapp" {...field} />
                          </FormControl>
                          <FormDescription>
                            URL para receber mensagens do WhatsApp
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="whatsappVerifyToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verify Token</FormLabel>
                          <FormControl>
                            <Input placeholder="Token de verificação do webhook" {...field} />
                          </FormControl>
                          <FormDescription>
                            Token usado para verificar a autenticidade do webhook
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* WhatsApp Templates */}
                    <div className=""
                      <h4 className="text-lg">"📱 Templates Aprovados do WhatsApp</h4>
                      <div className=""
                        <div className=""
                          <Label className="text-lg">"Template de Notificação (aprovado)</Label>
                          <Textarea
                            placeholder="Olá {customer_name}, você tem uma nova notificação do Conductor:
Título: {title}
Descrição: {description}
Data: {date}
Para mais detalhes, acesse o sistema."
                            className="text-xs h-24 bg-white border-green-200"
                            value={configForm.watch('whatsappNotificationTemplate') || ''}
                            onChange={(e) => configForm.setValue('whatsappNotificationTemplate', e.target.value)}
                          />
                        </div>
                        <div className=""
                          <Label className="text-lg">"Template de Confirmação (aprovado)</Label>
                          <Textarea
                            placeholder="Olá {customer_name}, confirmamos o recebimento da sua solicitação:
Protocolo: {protocol}
Tipo: {type}
Status: {status}
Acompanhe pelo sistema Conductor."
                            className="text-xs h-24 bg-white border-green-200"
                            value={configForm.watch('whatsappConfirmationTemplate') || ''}
                            onChange={(e) => configForm.setValue('whatsappConfirmationTemplate', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className=""
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-green-700 border-green-300 hover:bg-green-100"
                          onClick={() => {
                            toast({
                              title: "📱 Validando Template",
                              description: "Verificando conformidade com WhatsApp Business...",
                            });
                          }}
                        >
                          ✅ Validar Template
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-green-700 border-green-300 hover:bg-green-100"
                          onClick={() => {
                            toast({
                              title: "📋 Enviando para Aprovação",
                              description: "Template enviado para análise do WhatsApp...",
                            });
                          }}
                        >
                          📋 Enviar para Aprovação
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Campos genéricos para outras integrações */}
                {!['gmail-oauth2', 'outlook-oauth2', 'email-smtp', 'imap-email', 'dropbox-personal', 'telegram', 'whatsapp-business'].includes(selectedIntegration.id) && (
                  <>
                    <FormField
                      control={configForm.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="API Key da integração" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name="webhookUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Webhook URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://seu-webhook.com/endpoint" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                {/* Display test results below the form if available and not for webhook section */}
                {testResult && !['telegram'].includes(selectedIntegration.id) && (
                  <pre className="text-lg">"
                    {testResult.message}
                    {testResult.details && <code className="text-lg">"{JSON.stringify(testResult.details, null, 2)}</code>}
                  </pre>
                )}
                <div className=""
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsConfigDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveConfigMutation.isPending || isTestingIntegration} // Disable if saving or testing
                  >
                    {saveConfigMutation.isPending ? "Salvando..." : '[TRANSLATION_NEEDED]'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}