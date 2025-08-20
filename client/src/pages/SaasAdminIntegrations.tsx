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
// import useLocalization from '@/hooks/useLocalization';
  Brain, 
  Bot, 
  Zap, 
  Shield, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Key,
  Plug
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
const integrationConfigSchema = z.object({
  // Localization temporarily disabled
  apiKey: z.string().min(1, "API Key é obrigatória"),
  baseUrl: z.string().optional().refine((val) => {
    if (!val || val === "") return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, "URL deve ser válida"),
  maxTokens: z.number().min(1).max(32000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  enabled: z.boolean().default(true)
});
interface Integration {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: any;
  status: 'connected' | 'error' | 'disconnected';
  apiKeyConfigured: boolean;
  lastTested?: string;
  config?: any;
}
export default function SaasAdminIntegrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  // Verificar se usuário é SaaS admin
  if (!user || user.role !== 'saas_admin') {
    return (
      <div className="p-4"
        <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="p-4"
          Acesso Negado
        </h1>
        <p className="p-4"
          Esta página é restrita para administradores SaaS.
        </p>
      </div>
    );
  }
  // Query para integrações
  const { data: integrationsData, isLoading } = useQuery({
    queryKey: ['/api/saas-admin/integrations'],
    staleTime: 5 * 60 * 1000,
  });
  // Form para configurar integração
  const configForm = useForm({
    resolver: zodResolver(integrationConfigSchema),
    defaultValues: {
      apiKey: "",
      baseUrl: "",
      maxTokens: 4000,
      temperature: 0.7,
      enabled: true
    }
  });
  // Mutation para salvar configuração
  const saveConfigMutation = useMutation({
    mutationFn: async ({ integrationId, config }: { integrationId: string; config: any }) => {
      console.log('🔧 [SAAS-ADMIN-CONFIG] Salvando configuração:', { integrationId, hasApiKey: !!config.apiKey });
      // Sanitizar dados antes de enviar
      const sanitizedConfig = {
        ...config,
        apiKey: config.apiKey ? config.apiKey.toString().trim() : '',
        baseUrl: config.baseUrl ? config.baseUrl.toString().trim() : '',
        maxTokens: Number(config.maxTokens) || 4000,
        temperature: Number(config.temperature) || 0.7,
        enabled: Boolean(config.enabled)
      };
      const url = "/config`;
      return apiRequest('PUT', url, sanitizedConfig);
    },
    onSuccess: (data) => {
      console.log('✅ [SAAS-ADMIN-CONFIG] Configuração salva com sucesso:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations'] });
      setIsConfigDialogOpen(false);
      configForm.reset();
      toast({
        title: "Configuração salva",
        description: "A integração foi configurada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('❌ [SAAS-ADMIN-CONFIG] Erro ao salvar:', error);
      console.error('❌ [SAAS-ADMIN-CONFIG] Error details:', {
        status: error?.status,
        response: error?.response?.data,
        message: error?.message,
        stack: error?.stack
      });
      // Extrair mensagem de erro mais específica
      let errorMessage = "Verifique os dados e tente novamente.";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: errorMessage,
        variant: "destructive",
      });
    }
  });
  // Mutation para testar integração
  const testIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      console.log("
      const url = "/test`;
      const response = await apiRequest('POST', url, {});
      
      if (!response.ok) {
        throw new Error("
      }
      
      const data = await response.json();
      console.log('🧪 [SAAS-ADMIN-TEST] Parsed response data:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ [SAAS-ADMIN-TEST] Teste concluído:', data);
      console.log('✅ [SAAS-ADMIN-TEST] Data keys:', Object.keys(data || {}));
      console.log('✅ [SAAS-ADMIN-TEST] Success field:', data?.success);
      console.log('✅ [SAAS-ADMIN-TEST] Result field:', data?.result);
      
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations'] });
      // Check both data.success and success fields
      const isSuccess = data?.success === true || data?.success === 'true';
      
      if (isSuccess) {
        toast({
          title: "Teste bem-sucedido",
          description: data.message || "ms`,
        });
      } else {
        console.error('❌ [SAAS-ADMIN-TEST] Test failed with data:', data);
        toast({
          title: "Teste falhou", 
          description: data.error || data.message || '[TRANSLATION_NEEDED]',
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('❌ [SAAS-ADMIN-TEST] Erro no teste:', error);
      let errorMessage = '[TRANSLATION_NEEDED]';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: errorMessage,
        variant: "destructive",
      });
    }
  });
  // Use data from API when available, adding icons to each integration
  const integrations: Integration[] = integrationsData?.integrations?.map((integration: any) => ({
    ...integration,
    icon: integration.id === 'openai' ? Brain : 
          integration.id === 'deepseek' ? Bot : 
          integration.id === 'google-ai' ? Zap : Brain
  })) || [
    {
      id: 'openai',
      name: 'OpenAI',
      provider: 'OpenAI',
      description: 'Integração com modelos GPT-4 e ChatGPT para chat inteligente e geração de conteúdo',
      icon: Brain,
      status: 'disconnected',
      apiKeyConfigured: false,
      config: {}
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      provider: 'DeepSeek',
      description: 'Modelos de IA avançados para análise e processamento de linguagem natural',
      icon: Bot,
      status: 'disconnected',
      apiKeyConfigured: false,
      config: {}
    },
    {
      id: 'google-ai',
      name: 'Google AI',
      provider: 'Google',
      description: 'Integração com Gemini e outros modelos do Google AI para análise multimodal',
      icon: Zap,
      status: 'disconnected',
      apiKeyConfigured: false,
      config: {}
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
  const onConfigureIntegration = (integration: Integration) => {
    console.log('🔧 [CONFIGURE] Opening config dialog for:', integration.id);
    console.log('🔧 [CONFIGURE] Integration config:', integration.config);
    
    setSelectedIntegration(integration);
    
    // Check if integration has saved configuration
    if (integration.config && Object.keys(integration.config).length > 0) {
      console.log('✅ [CONFIGURE] Loading saved configuration');
      configForm.reset({
        apiKey: integration.config.apiKey || "",
        baseUrl: integration.config.baseUrl || "",
        maxTokens: integration.config.maxTokens || 4000,
        temperature: integration.config.temperature !== undefined ? integration.config.temperature : 0.7,
        enabled: integration.config.enabled !== undefined ? integration.config.enabled : true
      });
    } else {
      console.log('📋 [CONFIGURE] Using default configuration');
      configForm.reset({
        apiKey: "",
        baseUrl: "",
        maxTokens: 4000,
        temperature: 0.7,
        enabled: true
      });
    }
    setIsConfigDialogOpen(true);
  };
  const onSubmitConfig = (data: z.infer<typeof integrationConfigSchema>) => {
    if (selectedIntegration) {
      // Limpar baseUrl se for string vazia
      const cleanedData = {
        ...data,
        baseUrl: data.baseUrl === "" ? undefined : data.baseUrl
      };
      saveConfigMutation.mutate({
        integrationId: selectedIntegration.id,
        config: cleanedData
      });
    }
  };
  return (
    <div className="p-4"
      {/* Header */}
      <div className="p-4"
        <div className="p-4"
          <div>
            <h1 className="p-4"
              Integrações de IA
            </h1>
            <p className="p-4"
              Configurar e gerenciar integrações com provedores de IA
            </p>
          </div>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="p-4"
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Total de Integrações</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"{integrations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Conectadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {integrations.filter(i => i.status === 'connected').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Com Erro</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {integrations.filter(i => i.status === 'error').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Desconectadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {integrations.filter(i => i.status === 'disconnected').length}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Integrações Cards */}
      <div className="p-4"
        {integrations.map((integration) => {
          const IconComponent = integration.icon || Plug; // Fallback para Plug se icon for undefined
          return (
            <Card key={integration.id} className="p-4"
              <CardHeader>
                <div className="p-4"
                  <div className="p-4"
                    <div className="p-4"
                      <IconComponent className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">"{integration.name}</CardTitle>
                      <p className="text-lg">"{integration.provider}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(integration.status)}>
                    {getStatusIcon(integration.status)}
                    <span className="text-lg">"{integration.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="p-4"
                  {integration.description}
                </p>
                <div className="p-4"
                  <span className="text-lg">"API Key:</span>
                  <Badge variant={integration.apiKeyConfigured ? "default" : "secondary>
                    {integration.apiKeyConfigured ? "Configurada" : "Não configurada"
                  </Badge>
                </div>
                <div className="p-4"
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
                    onClick={() => testIntegrationMutation.mutate(integration.id)}
                    disabled={!integration.apiKeyConfigured || testIntegrationMutation.isPending}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Testar
                  </Button>
                </div>
                {integration.lastTested && (
                  <p className="p-4"
                    Último teste: {new Date(integration.lastTested).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Dialog de Configuração */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="p-4"
          <DialogHeader>
            <DialogTitle>
              Configurar {selectedIntegration?.name}
            </DialogTitle>
          </DialogHeader>
          <Form {...configForm}>
            <form onSubmit={configForm.handleSubmit(onSubmitConfig)} className="p-4"
              <FormField
                control={configForm.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key *</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="sk-..." 
                        {...field} 
                      />
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
                      <Input 
                        placeholder="Opcional - Ex: https://api.openai.com/v1" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="p-4"
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
              <FormField
                control={configForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="p-4"
                    <div className="p-4"
                      <FormLabel className="p-4"
                        Habilitar Integração
                      </FormLabel>
                      <div className="p-4"
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
              <div className="p-4"
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsConfigDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveConfigMutation.isPending}>
                  {saveConfigMutation.isPending ? "Salvando..." : '[TRANSLATION_NEEDED]'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}