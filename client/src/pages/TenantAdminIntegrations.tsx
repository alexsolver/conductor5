import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Slack, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Key,
  Plug,
  Webhook,
  Database,
  Shield,
  Globe,
  Zap,
  Bot
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const integrationConfigSchema = z.object({
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  redirectUri: z.string().url("URL de redirecionamento deve ser válida").optional(),
  webhookUrl: z.string().url("URL deve ser válida").optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  enabled: z.boolean().default(true),
  settings: z.record(z.any()).optional()
});

interface TenantIntegration {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: any;
  status: 'connected' | 'error' | 'disconnected';
  configured: boolean;
  lastSync?: string;
  config?: any;
  features: string[];
}

export default function TenantAdminIntegrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedIntegration, setSelectedIntegration] = useState<TenantIntegration | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  // Verificar se usuário é tenant admin
  if (!user || (user.role !== 'tenant_admin' && user.role !== 'saas_admin')) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Acesso Negado
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Esta página é restrita para administradores do tenant.
        </p>
      </div>
    );
  }

  // Query para integrações do tenant
  const { data: integrationsData, isLoading } = useQuery({
    queryKey: ['/api/tenant-admin/integrations'],
    staleTime: 5 * 60 * 1000,
  });

  // Form para configurar integração
  const configForm = useForm({
    resolver: zodResolver(integrationConfigSchema),
    defaultValues: {
      apiKey: "",
      apiSecret: "",
      clientId: "",
      clientSecret: "",
      redirectUri: "",
      webhookUrl: "",
      accessToken: "",
      refreshToken: "",
      enabled: true,
      settings: {}
    }
  });

  // Mutation para salvar configuração
  const saveConfigMutation = useMutation({
    mutationFn: (data: { integrationId: string; config: z.infer<typeof integrationConfigSchema> }) => 
      apiRequest(`/api/tenant-admin/integrations/${data.integrationId}/config`, { 
        method: 'PUT', 
        body: JSON.stringify(data.config) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/integrations'] });
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

  // Mutation para testar integração
  const testIntegrationMutation = useMutation({
    mutationFn: (integrationId: string) => 
      apiRequest(`/api/tenant-admin/integrations/${integrationId}/test`, { 
        method: 'POST'
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/integrations'] });
      toast({
        title: "Teste realizado",
        description: data.success ? "Integração funcionando corretamente." : "Erro na integração: " + data.error,
        variant: data.success ? "default" : "destructive",
      });
    }
  });

  const tenantIntegrations: TenantIntegration[] = integrationsData?.integrations || [
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
      features: ['Chat em tempo real', 'Mensagens automáticas', 'Status de entrega']
    },
    {
      id: 'slack',
      name: 'Slack',
      category: 'Comunicação',
      description: 'Integração com Slack para notificações e colaboração da equipe',
      icon: Slack,
      status: 'disconnected',
      configured: false,
      features: ['Notificações de tickets', 'Alertas de SLA', 'Colaboração em tempo real']
    },
    {
      id: 'twilio-sms',
      name: 'Twilio SMS',
      category: 'Comunicação',
      description: 'Envio de SMS através da API Twilio para notificações urgentes',
      icon: Phone,
      status: 'disconnected',
      configured: false,
      features: ['SMS automático', 'Notificações urgentes', 'Confirmações']
    },
    {
      id: 'zapier',
      name: 'Zapier',
      category: 'Automação',
      description: 'Conecte com mais de 3000 aplicativos através do Zapier',
      icon: Zap,
      status: 'disconnected',
      configured: false,
      features: ['Automação de fluxos', 'Sincronização de dados', 'Triggers personalizados']
    },
    {
      id: 'webhooks',
      name: 'Webhooks',
      category: 'Automação',
      description: 'Configuração de webhooks personalizados para integração com sistemas externos',
      icon: Webhook,
      status: 'disconnected',
      configured: false,
      features: ['URLs personalizadas', 'Eventos em tempo real', 'Payload customizável']
    },
    {
      id: 'crm-integration',
      name: 'CRM Integration',
      category: 'Dados',
      description: 'Sincronização bidirecional com sistemas CRM (Salesforce, HubSpot, etc.)',
      icon: Database,
      status: 'disconnected',
      configured: false,
      features: ['Sincronização de contatos', 'Histórico de interações', 'Pipeline de vendas']
    },
    {
      id: 'sso-saml',
      name: 'SSO/SAML',
      category: 'Segurança',
      description: 'Single Sign-On com provedores SAML para autenticação corporativa',
      icon: Shield,
      status: 'disconnected',
      configured: false,
      features: ['Login único', 'Autenticação corporativa', 'Gerenciamento de usuários']
    },
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      category: 'Produtividade',
      description: 'Integração com Google Workspace para calendário, drive e documentos',
      icon: Globe,
      status: 'disconnected',
      configured: false,
      features: ['Calendário compartilhado', 'Documentos colaborativos', 'Backup automático']
    },
    {
      id: 'chatbot',
      name: 'Chatbot IA',
      category: 'Automação',
      description: 'Chatbot inteligente para atendimento automatizado 24/7',
      icon: Bot,
      status: 'disconnected',
      configured: false,
      features: ['Atendimento 24/7', 'Respostas inteligentes', 'Escalação automática']
    }
  ];

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
      const response = await apiRequest(`/api/tenant-admin/integrations/${integration.id}/oauth/start`, {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'your-client-id', // This would come from form data
          redirectUri: window.location.origin + `/auth/${integration.id}/callback`
        })
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
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenantIntegrations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conectadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenantIntegrations.filter(i => i.status === 'connected').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuradas</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
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
                const IconComponent = integration.icon;
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Configurar {selectedIntegration?.name}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...configForm}>
            <form onSubmit={configForm.handleSubmit(onSubmitConfig)} className="space-y-4">
              {selectedIntegration?.id === 'gmail-oauth2' && (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Configuração OAuth2 Gmail</h4>
                    <p className="text-sm text-blue-700">
                      Configure as credenciais OAuth2 do Google Cloud Console para integração segura com Gmail.
                    </p>
                  </div>
                  
                  <FormField
                    control={configForm.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client ID *</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789-abc.apps.googleusercontent.com" {...field} />
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
                          <Input type="password" placeholder="GOCSPX-..." {...field} />
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
                            placeholder="https://seudominio.com/auth/gmail/callback" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedIntegration?.id === 'outlook-oauth2' && (
                <>
                  <div className="bg-orange-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-orange-900 mb-2">Configuração OAuth2 Outlook</h4>
                    <p className="text-sm text-orange-700">
                      Configure as credenciais OAuth2 do Azure AD para integração com Microsoft Outlook/Exchange.
                    </p>
                  </div>
                  
                  <FormField
                    control={configForm.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application (Client) ID *</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678-1234-1234-1234-123456789012" {...field} />
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
                          <Input type="password" placeholder="abc~123..." {...field} />
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
                            placeholder="https://seudominio.com/auth/outlook/callback" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={configForm.control}
                    name="settings.tenantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant ID (Opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="87654321-4321-4321-4321-210987654321" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedIntegration?.id === 'email-smtp' && (
                <>
                  <FormField
                    control={configForm.control}
                    name="settings.smtpHost"
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
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={configForm.control}
                      name="settings.smtpPort"
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
                      name="settings.smtpUser"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuário</FormLabel>
                          <FormControl>
                            <Input placeholder="usuario@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={configForm.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha/App Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedIntegration?.id === 'whatsapp-business' && (
                <>
                  <FormField
                    control={configForm.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Business API Token</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="EAAxxxxxxxxx..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="settings.phoneNumberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number ID</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789012345" {...field} />
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
                          <Input placeholder="https://seudominio.com/webhook/whatsapp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedIntegration?.id === 'webhooks' && (
                <>
                  <FormField
                    control={configForm.control}
                    name="webhookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Webhook</FormLabel>
                        <FormControl>
                          <Input placeholder="https://seudominio.com/webhook" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="apiSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secret Key (Opcional)</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Configuração genérica para outras integrações */}
              {!['email-smtp', 'whatsapp-business', 'webhooks'].includes(selectedIntegration?.id || '') && (
                <>
                  <FormField
                    control={configForm.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
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
                        <FormLabel>Webhook URL (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://seudominio.com/webhook" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

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
                        Permitir que esta integração seja usada no tenant
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