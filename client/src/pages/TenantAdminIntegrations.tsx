import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
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

const integrationConfigSchema = z.object({
  enabled: z.boolean().default(false),
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
  useSSL: z.boolean().default(false),
  // IMAP specific fields
  imapServer: z.string().optional(),
  imapPort: z.string().optional(),
  imapSecurity: z.enum(['SSL/TLS', 'STARTTLS', 'None']).optional(),
  emailAddress: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Deve ser um email válido"
  }),
  // Dropbox specific fields
  dropboxAppKey: z.string().optional(),
  dropboxAppSecret: z.string().optional(),
  dropboxAccessToken: z.string().optional(),
  dropboxRefreshToken: z.string().optional(),
  backupFolder: z.string().optional(),
  // Telegram specific fields - com validação mais rigorosa
  telegramBotToken: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    return val.length > 10 && val.includes(':');
  }, {
    message: "Token do bot deve ter formato válido (ex: 123456789:ABCdefGHIjklMNOpqr)"
  }),
  telegramChatId: z.string().optional(),
  telegramWebhookUrl: z.string().optional().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: "URL do webhook deve ser uma URL válida"
  }),
});

export default function TenantAdminIntegrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<TenantIntegration | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

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
      telegramWebhookUrl: '',
    },
  });

  // Query para buscar integrações
  const { data: integrationsData, isLoading, error } = useQuery({
    queryKey: ['/api/tenant-admin/integrations'],
    queryFn: () => apiRequest('GET', '/api/tenant-admin/integrations'),
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Query para buscar configuração específica de uma integração
  const { data: integrationConfigData, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['/api/tenant-admin/integrations', selectedIntegration?.id, 'config'],
    queryFn: () => apiRequest('GET', `/api/tenant-admin/integrations/${selectedIntegration?.id}/config`),
    enabled: !!selectedIntegration?.id && isConfigDialogOpen,
    retry: 1,
  });

  // Effect para popular o formulário quando os dados de configuração chegam
  React.useEffect(() => {
    if (integrationConfigData && selectedIntegration && isConfigDialogOpen) {
      console.log(`📝 [FRONTEND] Loading saved config for ${selectedIntegration.id}:`, integrationConfigData);
      
      const config = integrationConfigData.config || {};
      
      // Popular formulário com dados salvos
      configForm.reset({
        enabled: config.enabled || false,
        apiKey: config.apiKey || '',
        apiSecret: config.apiSecret || '',
        webhookUrl: config.webhookUrl || '',
        clientId: config.clientId || '',
        clientSecret: config.clientSecret || '',
        redirectUri: config.redirectUri || '',
        tenantId: config.tenantId || '',
        serverHost: config.serverHost || '',
        serverPort: config.serverPort || '',
        username: config.username || '',
        password: config.password || '',
        useSSL: config.useSSL || false,
        // IMAP fields
        imapServer: config.imapServer || '',
        imapPort: config.imapPort || '',
        imapSecurity: config.imapSecurity || 'SSL/TLS',
        emailAddress: config.emailAddress || '',
        // Dropbox fields
        dropboxAppKey: config.dropboxAppKey || '',
        dropboxAppSecret: config.dropboxAppSecret || '',
        dropboxAccessToken: config.dropboxAccessToken || '',
        dropboxRefreshToken: config.dropboxRefreshToken || '',
        backupFolder: config.backupFolder || '/Backups/Conductor',
        // Telegram fields - dados importantes salvos
        telegramBotToken: config.telegramBotToken || '',
        telegramChatId: config.telegramChatId || '',
        telegramWebhookUrl: config.telegramWebhookUrl || '',
      });
      
      console.log(`✅ [FRONTEND] Form populated with saved data for ${selectedIntegration.id}`);
    }
  }, [integrationConfigData, selectedIntegration, isConfigDialogOpen, configForm]);

  // Mutation para salvar configuração
  const saveConfigMutation = useMutation({
    mutationFn: ({ integrationId, config }: { integrationId: string; config: any }) => {
      console.log(`💾 [FRONTEND] Saving config for ${integrationId}:`, config);
      
      // Validação específica para Telegram
      if (integrationId === 'telegram') {
        if (!config.telegramBotToken || config.telegramBotToken.trim() === '') {
          throw new Error('Token do bot Telegram é obrigatório');
        }
        console.log(`🤖 [FRONTEND] Telegram config validation passed`);
      }
      
      return apiRequest('POST', `/api/tenant-admin/integrations/${integrationId}/config`, config);
    },
    onSuccess: (data, variables) => {
      console.log(`✅ [FRONTEND] Config saved successfully for ${variables.integrationId}:`, data);
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/integrations'] });
      setIsConfigDialogOpen(false);
      toast({
        title: "Configuração salva",
        description: "A integração foi configurada com sucesso.",
      });
    },
    onError: (error: any, variables) => {
      console.error(`❌ [FRONTEND] Error saving config for ${variables?.integrationId}:`, error);
      toast({
        title: "Erro ao salvar configuração",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  });

  // Estado para controlar qual integração específica está sendo testada
  const [testingIntegrationId, setTestingIntegrationId] = useState<string | null>(null);

  const testIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      console.log(`🧪 [FRONTEND] Testing integration: ${integrationId}`);
      
      try {
        const response = await apiRequest('POST', `/api/tenant-admin/integrations/${integrationId}/test`);
        console.log(`🔍 [FRONTEND] Raw test response:`, response);
        
        // Handle different response types
        if (response && typeof response === 'object') {
          // Direct object response with data
          if ('success' in response || 'error' in response || Object.keys(response).length > 0) {
            console.log(`🔍 [FRONTEND] Direct object response:`, response);
            return response;
          }
          // Check if it's a Response object
          else if (typeof response.json === 'function') {
            const data = await response.json();
            console.log(`🔍 [FRONTEND] Parsed JSON response:`, data);
            return data;
          }
        }
        
        console.error(`❌ [FRONTEND] Invalid response format:`, response);
        throw new Error('Formato de resposta inválido do servidor');
      } catch (parseError) {
        console.error(`❌ [FRONTEND] Parse error:`, parseError);
        throw parseError;
      }
    },
    onSuccess: (data, integrationId) => {
      console.log(`✅ [FRONTEND] Test result for ${integrationId}:`, data);
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/integrations'] });
      
      const isSuccess = data?.success === true;
      const errorMessage = data?.error || 'Erro desconhecido';
      
      toast({
        title: "Teste realizado",
        description: isSuccess 
          ? "Integração funcionando corretamente." 
          : `Erro na integração: ${errorMessage}`,
        variant: isSuccess ? "default" : "destructive",
      });
      setTestingIntegrationId(null);
    },
    onError: (error: any, integrationId) => {
      console.error(`❌ [FRONTEND] Test error for ${integrationId}:`, error);
      toast({
        title: "Erro no teste",
        description: error?.message || "Falha ao testar a integração",
        variant: "destructive",
      });
      setTestingIntegrationId(null);
    }
  });

  // Função para testar uma integração específica
  const handleTestIntegration = (integrationId: string) => {
    if (testingIntegrationId === null) {
      setTestingIntegrationId(integrationId);
      testIntegrationMutation.mutate(integrationId);
    }
  };

  // Função para abrir modal de configuração e carregar dados salvos
  const handleConfigureIntegration = (integration: TenantIntegration) => {
    console.log(`🔧 [FRONTEND] Opening configuration for ${integration.id}`);
    setSelectedIntegration(integration);
    setIsConfigDialogOpen(true);
  };

  // Map integrations with proper icons and saved configuration status
  const tenantIntegrations: TenantIntegration[] = (integrationsData as any)?.integrations?.length > 0 
    ? (integrationsData as any).integrations.map((integration: any) => ({
        ...integration,
        icon: getIntegrationIcon(integration.id),
        // Use the actual status from backend
        status: integration.status === 'connected' ? 'connected' : 
                integration.status === 'error' ? 'error' : 'disconnected',
        configured: integration.configured || false
      }))
    : [];

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
      <div className="space-y-8 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando integrações...</div>
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

  const onSubmitConfig = (data: z.infer<typeof integrationConfigSchema>) => {
    if (selectedIntegration) {
      console.log(`💾 [FRONTEND] Submitting config for ${selectedIntegration.id}:`, data);

      // Preparar dados específicos para cada integração
      let configData = { ...data };

      if (selectedIntegration.id === 'telegram') {
        // Validação específica para Telegram
        if (!data.telegramBotToken || data.telegramBotToken.trim() === '') {
          toast({
            title: "Erro de validação",
            description: "Token do bot Telegram é obrigatório",
            variant: "destructive",
          });
          return;
        }

        configData = {
          ...data,
          // Garantir que campos Telegram estejam presentes
          telegramBotToken: data.telegramBotToken.trim(),
          telegramChatId: data.telegramChatId || '',
          telegramWebhookUrl: data.telegramWebhookUrl || `${window.location.origin}/api/webhooks/telegram/${localStorage.getItem('tenantId')}`,
          enabled: data.enabled === true
        };
      }

      saveConfigMutation.mutate({ integrationId: selectedIntegration.id, config: configData });
    }
  };

  // Group integrations by category
  const integrationsByCategory = tenantIntegrations.reduce((acc, integration) => {
    const category = integration.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(integration);
    return acc;
  }, {} as Record<string, TenantIntegration[]>);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'error': return 'Erro';
      case 'disconnected': return 'Desconectado';
      default: return 'Desconectado';
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
          <p className="text-muted-foreground mt-2">
            Configure e gerencie integrações com serviços externos
          </p>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="Comunicação">Comunicação</TabsTrigger>
          <TabsTrigger value="Automação">Automação</TabsTrigger>
          <TabsTrigger value="Dados">Dados</TabsTrigger>
          <TabsTrigger value="Segurança">Segurança</TabsTrigger>
          <TabsTrigger value="Produtividade">Produtividade</TabsTrigger>
          <TabsTrigger value="certificates">Certificados</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {Object.entries(integrationsByCategory).map(([category, integrations]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{category}</h2>
                <Badge variant="secondary" className={getCategoryColor(category)}>
                  {integrations.length} integração{integrations.length !== 1 ? 'ões' : ''}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration) => {
                  const IconComponent = integration.icon;
                  const isTestingThis = testingIntegrationId === integration.id;
                  return (
                    <Card key={integration.id} className="relative overflow-hidden group hover:shadow-lg transition-all duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                              <IconComponent className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{integration.name}</CardTitle>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge 
                                  variant="outline" 
                                  className={`${getStatusColor(integration.status)} text-xs px-2 py-1`}
                                >
                                  {getStatusIcon(integration.status)}
                                  <span className="ml-1">{getStatusText(integration.status)}</span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {integration.description}
                        </p>
                        
                        {integration.features && integration.features.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">Recursos:</div>
                            <div className="flex flex-wrap gap-1">
                              {integration.features.slice(0, 3).map((feature, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                              {integration.features.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{integration.features.length - 3} mais
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleConfigureIntegration(integration)}
                            className="flex-1"
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Configurar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleTestIntegration(integration.id)}
                            disabled={isTestingThis}
                            className="px-3"
                          >
                            {isTestingThis ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-1"></div>
                                <span className="text-xs">Testando...</span>
                              </div>
                            ) : (
                              <>
                                <Activity className="h-4 w-4 mr-1" />
                                <span className="text-xs">Testar</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </TabsContent>

        {Object.keys(integrationsByCategory).map(category => (
          <TabsContent key={category} value={category} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrationsByCategory[category]?.map((integration) => {
                const IconComponent = integration.icon;
                const isTestingThis = testingIntegrationId === integration.id;
                return (
                  <Card key={integration.id} className="relative overflow-hidden group hover:shadow-lg transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                            <IconComponent className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className={`${getStatusColor(integration.status)} text-xs px-2 py-1`}
                              >
                                {getStatusIcon(integration.status)}
                                <span className="ml-1">{getStatusText(integration.status)}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {integration.description}
                      </p>
                      
                      {integration.features && integration.features.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700">Recursos:</div>
                          <div className="flex flex-wrap gap-1">
                            {integration.features.slice(0, 3).map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {integration.features.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{integration.features.length - 3} mais
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleConfigureIntegration(integration)}
                          className="flex-1"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Configurar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleTestIntegration(integration.id)}
                          disabled={isTestingThis}
                          className="px-3"
                        >
                          {isTestingThis ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-1"></div>
                              <span className="text-xs">Testando...</span>
                            </div>
                          ) : (
                            <>
                              <Activity className="h-4 w-4 mr-1" />
                              <span className="text-xs">Testar</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}

        <TabsContent value="certificates">
          <CertificateManager />
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedIntegration && (
                <>
                  {React.createElement(selectedIntegration.icon, { className: "h-5 w-5" })}
                  <span>Configurar {selectedIntegration.name}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Configure os parâmetros de integração para {selectedIntegration?.name}.
              {isLoadingConfig && (
                <div className="text-blue-600 mt-2">Carregando configurações salvas...</div>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...configForm}>
            <form onSubmit={configForm.handleSubmit(onSubmitConfig)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={configForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativar integração</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Habilita ou desabilita esta integração
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

                {selectedIntegration?.id === 'telegram' && (
                  <>
                    <FormField
                      control={configForm.control}
                      name="telegramBotToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token do Bot Telegram *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
                              {...field}
                            />
                          </FormControl>
                          <div className="text-sm text-muted-foreground">
                            Token obtido do @BotFather no Telegram
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="telegramChatId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chat ID / Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="@meucanal ou -1001234567890"
                              {...field}
                            />
                          </FormControl>
                          <div className="text-sm text-muted-foreground">
                            ID do chat ou username do canal/grupo onde enviar mensagens
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="telegramWebhookUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL do Webhook</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://seudominio.com/webhook/telegram"
                              {...field}
                            />
                          </FormControl>
                          <div className="text-sm text-muted-foreground">
                            URL para receber webhooks do Telegram (opcional)
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsConfigDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={saveConfigMutation.isPending}
                >
                  {saveConfigMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </div>
                  ) : (
                    'Salvar Configuração'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}