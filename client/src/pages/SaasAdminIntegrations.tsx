import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

import { 
  Brain, 
  MessageCircle, 
  Cloud, 
  Zap, 
  Bot, 
  Settings, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Shield,
  Mail,
  Building,
  Calendar,
  MessageSquare,
  Send,
  Bell,
  Database,
  Phone,
  Hash,
  Plug
} from 'lucide-react';
import { apiRequest, queryClient } from "@/lib/queryClient";

// Define the schema for integration configurations
const integrationConfigSchema = z.object({
  // General fields
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional().or(z.literal('')),
  maxTokens: z.number().min(1).max(32000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  enabled: z.boolean().default(true),

  // OAuth2 fields
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  redirectUri: z.string().optional(),
  tenantId: z.string().optional(),

  // Google specific
  serviceAccountKey: z.string().optional(),
  delegatedEmail: z.string().optional(),
  domain: z.string().optional(),
  adminEmail: z.string().optional(),
  scopes: z.array(z.string()).optional(),

  // AWS specific
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  region: z.string().optional(),

  // Email specific
  fromEmail: z.string().email().optional().or(z.literal('')),
  replyToEmail: z.string().email().optional().or(z.literal('')),

  // Communication specific
  botToken: z.string().optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  channelId: z.string().optional(),
  guildId: z.string().optional(),
  accountSid: z.string().optional(),
  authToken: z.string().optional(),
  phoneNumber: z.string().optional(),
});

// Interface for integration details
interface Integration {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: any;
  status: 'connected' | 'error' | 'disconnected';
  apiKeyConfigured: boolean;
  lastTested?: string;
  config?: z.infer<typeof integrationConfigSchema>; // Use the schema for config type
}

// Main component for SaaS Admin Integrations
export default function SaasAdminIntegrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('geral'); // State for active tab

  // Redirect if user is not a SaaS admin
  if (!user || user.role !== 'saas_admin') {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Acesso Negado
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Esta página é restrita para administradores SaaS.
        </p>
      </div>
    );
  }

  // Fetch integrations data
  const { data: integrationsData, isLoading } = useQuery({
    queryKey: ['/api/saas-admin/integrations'],
    staleTime: 5 * 60 * 1000,
  });

  // Form hook for integration configuration
  const configForm = useForm({
    resolver: zodResolver(integrationConfigSchema),
    defaultValues: {
      apiKey: "",
      baseUrl: "",
      maxTokens: 4000,
      temperature: 0.7,
      enabled: true,
      // Initialize other fields to empty or default values
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      tenantId: '',
      serviceAccountKey: '',
      delegatedEmail: '',
      domain: '',
      adminEmail: '',
      scopes: [],
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      fromEmail: '',
      replyToEmail: '',
      botToken: '',
      webhookUrl: '',
      channelId: '',
      guildId: '',
      accountSid: '',
      authToken: '',
      phoneNumber: '',
    }
  });

  // Mutation for saving integration configuration
  const saveConfigMutation = useMutation({
    mutationFn: (data: { integrationId: string; config: z.infer<typeof integrationConfigSchema> }) => 
      apiRequest(`/api/saas-admin/integrations/${data.integrationId}/config`, { 
        method: 'PUT', 
        body: JSON.stringify(data.config) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations'] });
      setIsConfigDialogOpen(false);
      configForm.reset();
      toast({
        title: "Configuração salva",
        description: "A integração foi configurada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar configuração",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  });

  // Mutation for testing integration
  const testIntegrationMutation = useMutation({
    mutationFn: (integrationId: string) => 
      apiRequest(`/api/saas-admin/integrations/${integrationId}/test`, { 
        method: 'POST'
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations'] });
      toast({
        title: "Teste realizado",
        description: data.success ? "Integração funcionando corretamente." : "Erro na integração: " + data.error,
        variant: data.success ? "default" : "destructive",
      });
    }
  });

  // SaaS-level integrations categorized
  const saasIntegrations = {
    geral: [
      {
        id: 'openai',
        name: 'OpenAI',
        provider: 'OpenAI',
        description: 'Integração com GPT-4 para IA conversacional e assistentes virtuais',
        icon: Brain,
        status: 'connected' as const,
        apiKeyConfigured: true,
        lastTested: '2024-03-15 14:30',
        config: {
          apiKey: "sk-proj-****",
          baseUrl: "https://api.openai.com/v1",
          maxTokens: 4000,
          temperature: 0.7,
          enabled: true
        }
      },
      {
        id: 'anthropic',
        name: 'Anthropic Claude',
        provider: 'Anthropic',
        description: 'Claude AI para análise avançada e geração de conteúdo',
        icon: MessageCircle,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
      },
      {
        id: 'azure-openai',
        name: 'Azure OpenAI',
        provider: 'Microsoft',
        description: 'Serviços de IA da Microsoft Azure com GPT-4',
        icon: Cloud,
        status: 'error' as const,
        apiKeyConfigured: true,
        lastTested: '2024-03-14 09:15',
      }
    ],
    comunicacao: [
      // Google Services
      {
        id: 'google-oauth',
        name: 'Google OAuth2',
        provider: 'Google',
        description: 'Autenticação OAuth2 para todos os serviços Google (Gmail, Drive, Calendar)',
        icon: Mail,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
        config: {
          clientId: '',
          clientSecret: '',
          redirectUri: 'https://your-domain.replit.dev/auth/google/callback',
          scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/calendar']
        }
      },
      {
        id: 'gmail-api',
        name: 'Gmail API',
        provider: 'Google',
        description: 'Envio e recebimento de emails via Gmail API para todos os tenants',
        icon: Mail,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
        config: {
          clientId: '',
          clientSecret: '',
          serviceAccountKey: '',
          delegatedEmail: ''
        }
      },
      {
        id: 'google-workspace',
        name: 'Google Workspace',
        provider: 'Google',
        description: 'Integração completa com Google Workspace (Admin SDK, Groups, Users)',
        icon: Building,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
        config: {
          adminEmail: '',
          serviceAccountKey: '',
          domain: ''
        }
      },
      {
        id: 'google-calendar',
        name: 'Google Calendar',
        provider: 'Google',
        description: 'Sincronização de eventos e agendamentos com Google Calendar',
        icon: Calendar,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
      },
      // Microsoft Services
      {
        id: 'microsoft-graph',
        name: 'Microsoft Graph',
        provider: 'Microsoft',
        description: 'API central da Microsoft para Office 365, Outlook, Teams e OneDrive',
        icon: Building,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
        config: {
          tenantId: '',
          clientId: '',
          clientSecret: '',
          redirectUri: 'https://your-domain.replit.dev/auth/microsoft/callback'
        }
      },
      {
        id: 'outlook-api',
        name: 'Outlook API',
        provider: 'Microsoft',
        description: 'Integração com Outlook para envio e recebimento de emails corporativos',
        icon: Mail,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
      },
      {
        id: 'microsoft-teams',
        name: 'Microsoft Teams',
        provider: 'Microsoft',
        description: 'Notificações e integração com Microsoft Teams',
        icon: MessageSquare,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
      },
      // Amazon Services
      {
        id: 'aws-ses',
        name: 'Amazon SES',
        provider: 'Amazon',
        description: 'Serviço de email transacional da AWS com alta deliverability',
        icon: Send,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
        config: {
          accessKeyId: '',
          secretAccessKey: '',
          region: 'us-east-1',
          fromEmail: ''
        }
      },
      {
        id: 'aws-sns',
        name: 'Amazon SNS',
        provider: 'Amazon',
        description: 'Notificações push, SMS e email via Amazon Simple Notification Service',
        icon: Bell,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
      },
      {
        id: 'aws-s3',
        name: 'Amazon S3',
        provider: 'Amazon',
        description: 'Armazenamento de arquivos e backups na nuvem AWS',
        icon: Database,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
      },
      // Communication Services
      {
        id: 'sendgrid',
        name: 'SendGrid',
        provider: 'SendGrid',
        description: 'Plataforma de email marketing e transacional com alta deliverability',
        icon: Mail,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
        config: {
          apiKey: '',
          fromEmail: '',
          replyToEmail: ''
        }
      },
      {
        id: 'twilio',
        name: 'Twilio',
        provider: 'Twilio',
        description: 'SMS, WhatsApp, chamadas de voz e verificação telefônica',
        icon: Phone,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
        config: {
          accountSid: '',
          authToken: '',
          phoneNumber: ''
        }
      },
      {
        id: 'slack-saas',
        name: 'Slack (SaaS)',
        provider: 'Slack',
        description: 'Integração global do Slack para notificações de sistema e monitoramento',
        icon: Hash,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
        config: {
          botToken: '',
          webhookUrl: '',
          channelId: ''
        }
      },
      {
        id: 'discord-saas',
        name: 'Discord (SaaS)',
        provider: 'Discord',
        description: 'Notificações e comunicação via Discord para comunidades técnicas',
        icon: MessageCircle,
        status: 'disconnected' as const,
        apiKeyConfigured: false,
        config: {
          botToken: '',
          webhookUrl: '',
          guildId: ''
        }
      }
    ]
  };

  // Filter integrations based on the active tab
  const integrations = saasIntegrations[activeTab as keyof typeof saasIntegrations] || saasIntegrations.geral;

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'disconnected': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'disconnected': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Handler for configuring an integration
  const onConfigureIntegration = (integration: Integration) => {
    setSelectedIntegration(integration);
    // Pre-fill form if existing config is available
    if (integration.config) {
      configForm.reset(integration.config);
    } else {
      // Reset form to defaults if no config exists
      configForm.reset();
    }
    setIsConfigDialogOpen(true);
  };

  // Handler for testing an integration (using the mutation)
  const onTestIntegration = (integration: Integration) => {
    testIntegrationMutation.mutate(integration.id);
  };

  // Submit handler for the configuration form
  const onSubmitConfig = (data: z.infer<typeof integrationConfigSchema>) => {
    if (selectedIntegration) {
      saveConfigMutation.mutate({
        integrationId: selectedIntegration.id,
        config: data
      });
    }
  };

  // Render the component
  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Integrações de IA
            </h1>
            <p className="text-gray-600 mt-2">
              Configurar e gerenciar integrações com provedores de IA e comunicação
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Integrações</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.values(saasIntegrations).flat().length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conectadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(saasIntegrations).flat().filter(i => i.status === 'connected').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Erro</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(saasIntegrations).flat().filter(i => i.status === 'error').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desconectadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(saasIntegrations).flat().filter(i => i.status === 'disconnected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for integration categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="geral" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Geral & IA
          </TabsTrigger>
          <TabsTrigger value="comunicacao" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Comunicação
          </TabsTrigger>
        </TabsList>

        {/* Content for Geral & IA tab */}
        <TabsContent value="geral">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Integrações de IA e Serviços Gerais</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Configure provedores de IA e serviços gerais para todo o sistema SaaS
            </p>
          </div>
        </TabsContent>

        {/* Content for Comunicação tab */}
        <TabsContent value="comunicacao">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Integrações de Comunicação</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Configure serviços de email, SMS, notificações e armazenamento para todos os tenants
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Integrações Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => {
            const IconComponent = integration.icon || Plug; // Fallback to Plug if icon is undefined
            return (
              <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                        <IconComponent className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <p className="text-sm text-gray-500">{integration.provider}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(integration.status)}>
                      {getStatusIcon(integration.status)}
                      <span className="ml-1 capitalize">{integration.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {integration.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">API Key:</span>
                    <Badge variant={integration.apiKeyConfigured ? "default" : "secondary"}>
                      {integration.apiKeyConfigured ? "Configurada" : "Não configurada"}
                    </Badge>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => onConfigureIntegration(integration)}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Configurar
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onTestIntegration(integration)}
                      disabled={!integration.apiKeyConfigured || testIntegrationMutation.isPending}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Testar
                    </Button>
                  </div>

                  {integration.lastTested && (
                    <p className="text-xs text-gray-500 mt-2">
                      Último teste: {new Date(integration.lastTested).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de Configuração */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Configurar {selectedIntegration?.name}
            </DialogTitle>
          </DialogHeader>

          <Form {...configForm}>
            <form onSubmit={configForm.handleSubmit(onSubmitConfig)} className="space-y-4">
              {/* Dynamically render fields based on integration type */}
              {selectedIntegration?.id === 'google-oauth' && (
                <>
                  <FormField
                    control={configForm.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client ID *</FormLabel>
                        <FormControl>
                          <Input placeholder="Google Client ID" {...field} />
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
                        <FormLabel>Client Secret *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Google Client Secret" {...field} />
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
                        <FormLabel>Redirect URI *</FormLabel>
                        <FormControl>
                          <Input placeholder="https://your-domain.replit.dev/auth/google/callback" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={configForm.control}
                    name="scopes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scopes</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/userinfo.profile,https://www.googleapis.com/auth/gmail.modify" 
                            value={Array.isArray(field.value) ? field.value.join(',') : field.value || ''}
                            onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedIntegration?.id === 'gmail-api' && (
                <>
                  <FormField
                    control={configForm.control}
                    name="serviceAccountKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Account Key (JSON) *</FormLabel>
                        <FormControl>
                          <Textarea placeholder='{"type": "service_account", ...}' {...field} className="min-h-[100px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="delegatedEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delegated Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="user@yourdomain.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedIntegration?.id === 'google-workspace' && (
                <>
                  <FormField
                    control={configForm.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="admin@yourdomain.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="serviceAccountKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Account Key (JSON) *</FormLabel>
                        <FormControl>
                          <Textarea placeholder='{"type": "service_account", ...}' {...field} className="min-h-[100px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain *</FormLabel>
                        <FormControl>
                          <Input placeholder="yourdomain.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedIntegration?.id === 'microsoft-graph' && (
                <>
                  <FormField
                    control={configForm.control}
                    name="tenantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant ID *</FormLabel>
                        <FormControl>
                          <Input placeholder="Microsoft Tenant ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client ID *</FormLabel>
                        <FormControl>
                          <Input placeholder="Microsoft Client ID" {...field} />
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
                        <FormLabel>Client Secret *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Microsoft Client Secret" {...field} />
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
                        <FormLabel>Redirect URI *</FormLabel>
                        <FormControl>
                          <Input placeholder="https://your-domain.replit.dev/auth/microsoft/callback" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {['aws-ses', 'aws-sns', 'aws-s3'].includes(selectedIntegration?.id || '') && (
                <>
                  <FormField
                    control={configForm.control}
                    name="accessKeyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Key ID *</FormLabel>
                        <FormControl>
                          <Input placeholder="AWS Access Key ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="secretAccessKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secret Access Key *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="AWS Secret Access Key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {selectedIntegration?.id === 'aws-ses' && (
                    <FormField
                      control={configForm.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Region *</FormLabel>
                          <FormControl>
                            <Input placeholder="us-east-1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {['aws-ses'].includes(selectedIntegration?.id || '') && (
                    <FormField
                      control={configForm.control}
                      name="fromEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Email *</FormLabel>
                          <FormControl>
                            <Input placeholder="noreply@yourdomain.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
              
              {['sendgrid'].includes(selectedIntegration?.id || '') && (
                <>
                  <FormField
                    control={configForm.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="SendGrid API Key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="fromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="sender@yourdomain.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={configForm.control}
                    name="replyToEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reply-To Email</FormLabel>
                        <FormControl>
                          <Input placeholder="reply@yourdomain.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {['twilio'].includes(selectedIntegration?.id || '') && (
                <>
                  <FormField
                    control={configForm.control}
                    name="accountSid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account SID *</FormLabel>
                        <FormControl>
                          <Input placeholder="Twilio Account SID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="authToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auth Token *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Twilio Auth Token" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {['slack-saas', 'discord-saas'].includes(selectedIntegration?.id || '') && (
                <>
                  <FormField
                    control={configForm.control}
                    name="botToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bot Token *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Bot Token" {...field} />
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
                          <Input placeholder="Slack/Discord Webhook URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="channelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel ID (Slack)</FormLabel>
                        <FormControl>
                          <Input placeholder="C1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="guildId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guild ID (Discord)</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789012345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* General Configuration fields */}
              {selectedIntegration && !['google-oauth', 'gmail-api', 'google-workspace', 'microsoft-graph', 'aws-ses', 'aws-sns', 'aws-s3', 'sendgrid', 'twilio', 'slack-saas', 'discord-saas'].includes(selectedIntegration.id) && (
                <>
                  <FormField
                    control={configForm.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="sk-..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="baseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base URL (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://api.openai.com/v1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={configForm.control}
                      name="maxTokens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Tokens</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="4000" 
                              {...field} 
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperature</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1"
                              min="0"
                              max="2"
                              placeholder="0.7" 
                              {...field} 
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {selectedIntegration && (
                <FormField
                  control={configForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Habilitar Integração
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Permitir que esta integração seja usada no sistema
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
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsConfigDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveConfigMutation.isPending}>
                  {saveConfigMutation.isPending ? "Salvando..." : "Salvar Configuração"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}