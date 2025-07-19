import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Bot
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
    },
  });

  // Query para buscar integrações
  const { data: integrationsData, isLoading } = useQuery({
    queryKey: ['/api/tenant-admin/integrations'],
    queryFn: async () => {
      const response = await fetch('/api/tenant-admin/integrations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    }
  });

  // Mutation para salvar configuração
  const saveConfigMutation = useMutation({
    mutationFn: ({ integrationId, config }: { integrationId: string; config: any }) =>
      apiRequest('POST', `/api/tenant-admin/integrations/${integrationId}/config`, config),
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
        title: "Erro ao salvar configuração",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  });

  // Mutation para testar integração
  const testIntegrationMutation = useMutation({
    mutationFn: (integrationId: string) =>
      apiRequest('POST', `/api/tenant-admin/integrations/${integrationId}/test`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/integrations'] });
      toast({
        title: "Teste realizado",
        description: data.success ? "Integração funcionando corretamente." : "Erro na integração: " + data.error,
        variant: data.success ? "default" : "destructive",
      });
    }
  });

  // Map integrations with proper icons
  const tenantIntegrations: TenantIntegration[] = (integrationsData?.integrations || []).map((integration: any) => ({
    ...integration,
    icon: getIntegrationIcon(integration.id)
  })) || [
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
      features: ['Notificações por email', 'Tickets por email', 'Relatórios automáticos']
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
      features: ['Métricas de conversão', 'Funis de atendimento', 'Relatórios customizados']
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
    }
  ];

  function getIntegrationIcon(id: string) {
    switch (id) {
      case 'gmail-oauth2':
      case 'outlook-oauth2':
      case 'email-smtp':
        return Mail;
      case 'whatsapp-business':
        return MessageSquare;
      case 'slack':
        return MessageCircle;
      case 'twilio-sms':
        return Phone;
      case 'zapier':
        return Zap;
      case 'webhooks':
        return Webhook;
      case 'google-analytics':
        return BarChart3;
      case 'crm-integration':
        return Database;
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

  const onConfigureIntegration = (integration: TenantIntegration) => {
    setSelectedIntegration(integration);
    if (integration.config) {
      configForm.reset(integration.config);
    }
    setIsConfigDialogOpen(true);
  };

  // Função para iniciar fluxo OAuth2
  const startOAuthFlow = async (integration: TenantIntegration) => {
    try {
      const response = await apiRequest('POST', `/api/tenant-admin/integrations/${integration.id}/oauth/start`, {
        clientId: 'your-client-id', // This would come from form data
        redirectUri: window.location.origin + `/auth/${integration.id}/callback`
      });
      
      if (response.authUrl) {
        // Open OAuth2 URL in new window
        window.open(response.authUrl, 'oauth2', 'width=600,height=600,scrollbars=yes,resizable=yes');
        toast({
          title: "OAuth2 Iniciado",
          description: "Janela de autorização aberta. Complete o processo de login.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro OAuth2",
        description: error.message || "Erro ao iniciar fluxo OAuth2",
        variant: "destructive",
      });
    }
  };

  const onSubmitConfig = (data: z.infer<typeof integrationConfigSchema>) => {
    if (selectedIntegration) {
      saveConfigMutation.mutate({
        integrationId: selectedIntegration.id,
        config: data
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
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Integrações do Tenant
            </h1>
            <p className="text-gray-600 mt-2">
              Configurar integrações específicas para este workspace
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Integrações</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenantIntegrations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tenantIntegrations.filter(i => i.status === 'connected').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuradas</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenantIntegrations.filter(i => i.configured).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(groupedIntegrations).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrações por Categoria */}
      <Tabs defaultValue={Object.keys(groupedIntegrations)[0]} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          {Object.keys(groupedIntegrations).map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(groupedIntegrations).map(([category, integrations]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => {
                const IconComponent = integration.icon || Mail; // Fallback to Mail icon
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
                            <Badge className={getCategoryColor(integration.category)}>
                              {integration.category}
                            </Badge>
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
                      
                      {integration.features && integration.features.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Recursos:</h4>
                          <div className="flex flex-wrap gap-1">
                            {integration.features.slice(0, 3).map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {integration.features.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{integration.features.length - 3} mais
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => onConfigureIntegration(integration)}
                          className="flex-1"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Configurar
                        </Button>
                        
                        {(integration.id === 'gmail-oauth2' || integration.id === 'outlook-oauth2') && (
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => startOAuthFlow(integration)}
                            className="flex-1"
                          >
                            <Key className="h-4 w-4 mr-1" />
                            OAuth2
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => testIntegrationMutation.mutate(integration.id)}
                          disabled={testIntegrationMutation.isPending}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Testar
                        </Button>
                      </div>

                      {integration.lastSync && (
                        <p className="text-xs text-gray-500 mt-2">
                          Última sincronização: {new Date(integration.lastSync).toLocaleDateString()}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Configurar {selectedIntegration?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedIntegration && (
            <Form {...configForm}>
              <form onSubmit={configForm.handleSubmit(onSubmitConfig)} className="space-y-4">
                <FormField
                  control={configForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Habilitar Integração
                        </FormLabel>
                        <div className="text-sm text-gray-500">
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
                              placeholder={`${window.location.origin}/auth/${selectedIntegration.id}/callback`} 
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
                          <FormControl>
                            <Input placeholder="smtp.gmail.com" {...field} />
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
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Usar SSL/TLS
                            </FormLabel>
                            <div className="text-sm text-gray-500">
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

                {/* Campos genéricos para outras integrações */}
                {!['gmail-oauth2', 'outlook-oauth2', 'email-smtp'].includes(selectedIntegration.id) && (
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
                    {saveConfigMutation.isPending ? "Salvando..." : "Salvar Configuração"}
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