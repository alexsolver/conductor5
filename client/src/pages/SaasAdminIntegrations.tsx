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
  Plug,
  CloudRain,
  Loader2,
  Play
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const integrationConfigSchema = z.object({
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

  // Query para integrações
  const { data: integrationsData, isLoading } = useQuery({
    queryKey: ['/api/saas-admin/integrations'],
    staleTime: 5 * 60 * 1000,
  });

  // Query específica para OpenWeather
  const { data: openWeatherData, isLoading: isOpenWeatherLoading, refetch: refetchOpenWeather } = useQuery({
    queryKey: ['/api/saas-admin/integrations/openweather'],
    staleTime: 5 * 60 * 1000,
  });

  // Query específica para OpenAI
  const { data: openAIData, isLoading: isOpenAILoading, refetch: refetchOpenAI } = useQuery({
    queryKey: ['/api/saas-admin/integrations/openai'],
    staleTime: 5 * 60 * 1000,
  });

  // Query específica para SendGrid
  const { data: sendGridData, isLoading: isSendGridLoading, refetch: refetchSendGrid } = useQuery({
    queryKey: ['/api/saas-admin/integrations/sendgrid'],
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

      // Rota específica para OpenWeather API key
      if (integrationId === 'openweather') {
        const url = `/api/saas-admin/integrations/openweather/api-key`;
        return apiRequest('PUT', url, {
          apiKey: sanitizedConfig.apiKey,
          testConnection: Boolean(sanitizedConfig.testConnection)
        });
      }

      // Rota específica para OpenAI API key
      if (integrationId === 'openai') {
        const url = `/api/saas-admin/integrations/openai/api-key`;
        return apiRequest('PUT', url, {
          apiKey: sanitizedConfig.apiKey,
          enabled: sanitizedConfig.enabled,
          maxTokens: sanitizedConfig.maxTokens,
          temperature: sanitizedConfig.temperature,
        });
      }

      // Rota específica para SendGrid API key
      if (integrationId === 'sendgrid') {
        const url = `/api/saas-admin/integrations/sendgrid/api-key`;
        return apiRequest('PUT', url, {
          apiKey: sanitizedConfig.apiKey,
          enabled: sanitizedConfig.enabled,
        });
      }

      const url = `/api/saas-admin/integrations/${integrationId}/config`;
      return apiRequest('PUT', url, sanitizedConfig);
    },
    onSuccess: (data) => {
      console.log('✅ [SAAS-ADMIN-CONFIG] Configuração salva com sucesso:', data);
      // Invalidar ambas as queries para forçar recarregamento
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations/openweather'] });
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations/openai'] });
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations/sendgrid'] });
      // Aguardar um tempo para que as queries sejam recarregadas
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/saas-admin/integrations'] });
        queryClient.refetchQueries({ queryKey: ['/api/saas-admin/integrations/openweather'] });
        queryClient.refetchQueries({ queryKey: ['/api/saas-admin/integrations/openai'] });
        queryClient.refetchQueries({ queryKey: ['/api/saas-admin/integrations/sendgrid'] });
      }, 500);
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
        title: "Erro ao salvar configuração",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Mutation para testar integração
  const testIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      console.log(`🧪 [SAAS-ADMIN-TEST] Testando integração: ${integrationId}`);
      const url = `/api/saas-admin/integrations/${integrationId}/test`;
      const response = await apiRequest('POST', url, {});

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations/openweather'] });
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations/openai'] });
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations/sendgrid'] });

      // Check both data.success and success fields
      const isSuccess = data?.success === true || data?.success === 'true';

      if (isSuccess) {
        toast({
          title: "Teste bem-sucedido",
          description: data.message || `Integração funcionando corretamente. Tempo de resposta: ${data.result?.responseTime || 'N/A'}ms`,
        });
      } else {
        console.error('❌ [SAAS-ADMIN-TEST] Test failed with data:', data);
        toast({
          title: "Teste falhou", 
          description: data.error || data.message || "Erro na integração",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('❌ [SAAS-ADMIN-TEST] Erro no teste:', error);

      let errorMessage = "Erro ao testar integração";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro no teste",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Mutation específica para testar OpenWeather
  const testOpenWeatherMutation = useMutation({
    mutationFn: async () => {
      console.log('🧪 [SAAS-ADMIN-TEST-OW] Testando integração OpenWeather');
      const url = `/api/saas-admin/integrations/openweather/test`; // Endpoint específico para testar OpenWeather
      const response = await apiRequest('POST', url, {});

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🧪 [SAAS-ADMIN-TEST-OW] Parsed response data:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ [SAAS-ADMIN-TEST-OW] Teste OpenWeather concluído:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations/openweather'] });

      if (data?.success) {
        toast({
          title: "Teste OpenWeather bem-sucedido",
          description: data.message || `Integração OpenWeather funcionando corretamente.`,
        });
      } else {
        console.error('❌ [SAAS-ADMIN-TEST-OW] Test failed with data:', data);
        toast({
          title: "Teste OpenWeather falhou", 
          description: data.error || data.message || "Erro na integração OpenWeather",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('❌ [SAAS-ADMIN-TEST-OW] Erro no teste OpenWeather:', error);
      let errorMessage = "Erro ao testar integração OpenWeather";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Erro no teste OpenWeather",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Mutation específica para testar OpenAI
  const testOpenAIMutation = useMutation({
    mutationFn: async () => {
      console.log('🧪 [SAAS-ADMIN-TEST-AI] Testando integração OpenAI');
      const url = `/api/saas-admin/integrations/openai/test`;
      const response = await apiRequest('POST', url, {});

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🧪 [SAAS-ADMIN-TEST-AI] Parsed response data:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ [SAAS-ADMIN-TEST-AI] Teste OpenAI concluído:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations/openai'] });

      if (data?.success) {
        toast({
          title: "Teste OpenAI bem-sucedido",
          description: data.message || `Integração OpenAI funcionando corretamente.`,
        });
      } else {
        console.error('❌ [SAAS-ADMIN-TEST-AI] Test failed with data:', data);
        toast({
          title: "Teste OpenAI falhou", 
          description: data.error || data.message || "Erro na integração OpenAI",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('❌ [SAAS-ADMIN-TEST-AI] Erro no teste OpenAI:', error);
      let errorMessage = "Erro ao testar integração OpenAI";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Erro no teste OpenAI",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Mutation específica para testar SendGrid
  const testSendGridMutation = useMutation({
    mutationFn: async () => {
      console.log('🧪 [SAAS-ADMIN-TEST-SG] Testando integração SendGrid');
      const url = `/api/saas-admin/integrations/sendgrid/test`;
      const response = await apiRequest('POST', url, {});

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🧪 [SAAS-ADMIN-TEST-SG] Parsed response data:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ [SAAS-ADMIN-TEST-SG] Teste SendGrid concluído:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/integrations/sendgrid'] });

      if (data?.success) {
        toast({
          title: "Teste SendGrid bem-sucedido",
          description: data.message || `Integração SendGrid funcionando corretamente.`,
        });
      } else {
        console.error('❌ [SAAS-ADMIN-TEST-SG] Test failed with data:', data);
        toast({
          title: "Teste SendGrid falhou", 
          description: data.error || data.message || "Erro na integração SendGrid",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('❌ [SAAS-ADMIN-TEST-SG] Erro no teste SendGrid:', error);
      let errorMessage = "Erro ao testar integração SendGrid";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Erro no teste SendGrid",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Use data from API when available, adding icons to each integration
  const apiIntegrations = integrationsData?.integrations || integrationsData?.data?.integrations || [];

  let integrations: Integration[];

  // If there are saved configs, use them to populate integrations
  const savedConfigs = integrationsData?.savedConfigs;

  // If there are API data and saved configs, use them
  if (apiIntegrations.length > 0 && savedConfigs) {
    const baseIntegrations: Integration[] = apiIntegrations.map(baseIntegration => {
      const savedConfig = savedConfigs.rows.find(row => row.integration_id === baseIntegration.id);

      console.log(`[INTEGRATION-REPO] Processing ${baseIntegration.id}:`, {
        hasSavedConfig: !!savedConfig,
        savedConfigData: savedConfig?.config,
        hasApiKey: savedConfig?.config?.apiKey && savedConfig.config.apiKey.length > 0
      });

      if (savedConfig) {
        let hasApiKey = false;

        // Different validation for different providers
        if (baseIntegration.id === 'openweather') {
          hasApiKey = savedConfig.config?.apiKey && savedConfig.config.apiKey.length >= 30;
        } else if (baseIntegration.id === 'sendgrid') {
          hasApiKey = savedConfig.config?.apiKey && 
                    savedConfig.config.apiKey.startsWith('SG.') && 
                    savedConfig.config.apiKey.length >= 60;
        } else {
          hasApiKey = savedConfig.config?.apiKey && savedConfig.config.apiKey.length > 0;
        }

        const integration = {
          ...baseIntegration,
          status: hasApiKey ? 'connected' : 'disconnected',
          config: savedConfig.config || {},
          updatedAt: new Date(savedConfig.updated_at),
          // ✅ Adicionar propriedades que o frontend espera
          apiKeyConfigured: hasApiKey,
          hasApiKey: () => hasApiKey,
          isActive: () => hasApiKey,
          isOpenWeatherIntegration: () => baseIntegration.id === 'openweather',
          isSendGridIntegration: () => baseIntegration.id === 'sendgrid',
          canMakeRequest: () => hasApiKey,
          getLastTestedAt: () => savedConfig.config?.lastTested ? new Date(savedConfig.config.lastTested) : null,
          getApiKeyMasked: () => savedConfig.config?.apiKey ? `${savedConfig.config.apiKey.substring(0, 8)}...` : null
        };

        // Override status and apiKeyConfigured for OpenAI based on its specific query
        if (baseIntegration.id === 'openai') {
          const openAIStatus = openAIData?.status || 'disconnected';
          const openAIConfigured = !!openAIData?.apiKeyConfigured;
          integration.status = openAIStatus;
          integration.apiKeyConfigured = openAIConfigured;
        }
        // Override status and apiKeyConfigured for OpenWeather based on its specific query
        else if (baseIntegration.id === 'openweather') {
          const openWeatherStatus = openWeatherData?.status || openWeatherData?.data?.status || 'disconnected';
          const openWeatherConfigured = !!(openWeatherData?.config?.apiKey || openWeatherData?.data?.config?.apiKey);
          integration.status = openWeatherStatus;
          integration.apiKeyConfigured = openWeatherConfigured;
          integration.config = openWeatherData?.config || openWeatherData?.data?.config || {};
        }
        // Override status and apiKeyConfigured for SendGrid based on its specific query
        else if (baseIntegration.id === 'sendgrid') {
          const sendGridStatus = sendGridData?.status || 'disconnected';
          const sendGridConfigured = !!sendGridData?.apiKeyConfigured;
          integration.status = sendGridStatus;
          integration.apiKeyConfigured = sendGridConfigured;
          integration.config = sendGridData?.config || {};
        }
        
        return integration;
      } else {
        // If no saved config, create a default integration object
        const integration = {
          ...baseIntegration,
          // ✅ Propriedades padrão para integrações não configuradas
          apiKeyConfigured: false,
          hasApiKey: () => false,
          isActive: () => false,
          isOpenWeatherIntegration: () => baseIntegration.id === 'openweather',
          isSendGridIntegration: () => baseIntegration.id === 'sendgrid',
          canMakeRequest: () => false,
          getLastTestedAt: () => null,
          getApiKeyMasked: () => null
        };

        // Set default status and config for specific integrations if not found in savedConfigs
        if (baseIntegration.id === 'openai') {
          integration.status = openAIData?.status || 'disconnected';
          integration.apiKeyConfigured = !!openAIData?.apiKeyConfigured;
          integration.config = openAIData?.config || {};
        } else if (baseIntegration.id === 'openweather') {
          integration.status = openWeatherData?.status || openWeatherData?.data?.status || 'disconnected';
          integration.apiKeyConfigured = !!(openWeatherData?.config?.apiKey || openWeatherData?.data?.config?.apiKey);
          integration.config = openWeatherData?.config || openWeatherData?.data?.config || {};
        } else if (baseIntegration.id === 'sendgrid') {
          integration.status = sendGridData?.status || 'disconnected';
          integration.apiKeyConfigured = !!sendGridData?.apiKeyConfigured;
          integration.config = sendGridData?.config || {};
        }

        return integration;
      }
    });

    // Always include OpenWeather card if not in API response
    const openWeatherExists = baseIntegrations.some(i => i.id === 'openweather');
    if (!openWeatherExists) {
      baseIntegrations.push({
        id: 'openweather',
        name: 'OpenWeather API',
        provider: 'openweather',
        description: 'Serviço de dados meteorológicos para o mapa interativo do sistema',
        icon: CloudRain,
        status: openWeatherData?.status || openWeatherData?.data?.status || 'disconnected',
        apiKeyConfigured: !!(openWeatherData?.config?.apiKey || openWeatherData?.data?.config?.apiKey),
        config: openWeatherData?.config || openWeatherData?.data?.config || {},
        createdAt: new Date(),
        updatedAt: new Date(),
        hasApiKey: () => !!(openWeatherData?.config?.apiKey || openWeatherData?.data?.config?.apiKey),
        isActive: () => !!(openWeatherData?.config?.apiKey || openWeatherData?.data?.config?.apiKey),
        isOpenWeatherIntegration: () => true,
        isSendGridIntegration: () => false,
        canMakeRequest: () => !!(openWeatherData?.config?.apiKey || openWeatherData?.data?.config?.apiKey),
        getLastTestedAt: () => null,
        getApiKeyMasked: () => null
      });
    }

    // Include OpenAI card if not already present
    const openaiExists = baseIntegrations.some(i => i.id === 'openai');
    if (!openaiExists) {
      baseIntegrations.push({
        id: 'openai',
        name: 'OpenAI',
        provider: 'OpenAI',
        description: 'Integração com APIs da OpenAI para geração de conteúdo inteligente',
        icon: Brain,
        status: openAIData?.status || 'disconnected',
        apiKeyConfigured: !!openAIData?.apiKeyConfigured,
        config: openAIData?.config,
        createdAt: new Date(),
        updatedAt: new Date(),
        hasApiKey: () => !!openAIData?.apiKeyConfigured,
        isActive: () => !!openAIData?.apiKeyConfigured,
        isOpenWeatherIntegration: () => false,
        isSendGridIntegration: () => false,
        canMakeRequest: () => !!openAIData?.apiKeyConfigured,
        getLastTestedAt: () => null,
        getApiKeyMasked: () => null
      });
    }

    // Include SendGrid card if not already present
    const sendGridExists = baseIntegrations.some(i => i.id === 'sendgrid');
    if (!sendGridExists) {
      baseIntegrations.push({
        id: 'sendgrid',
        name: 'SendGrid',
        provider: 'SendGrid',
        description: 'Serviço de envio de e-mails transacionais e de marketing',
        icon: Plug, // Placeholder icon, consider a specific SendGrid icon if available
        status: sendGridData?.status || 'disconnected',
        apiKeyConfigured: !!sendGridData?.apiKeyConfigured,
        config: sendGridData?.config || {},
        createdAt: new Date(),
        updatedAt: new Date(),
        hasApiKey: () => !!sendGridData?.apiKeyConfigured,
        isActive: () => !!sendGridData?.apiKeyConfigured,
        isOpenWeatherIntegration: () => false,
        isSendGridIntegration: () => true,
        canMakeRequest: () => !!sendGridData?.apiKeyConfigured,
        getLastTestedAt: () => null,
        getApiKeyMasked: () => null
      });
    }

    integrations = baseIntegrations;
  } else {
    // Fallback integrations if no API data or saved configs
    integrations = [
    {
      id: 'openai',
      name: 'OpenAI',
      provider: 'OpenAI',
      description: 'Integração com APIs da OpenAI para geração de conteúdo inteligente',
      icon: Brain,
      status: openAIData?.status || 'disconnected',
      apiKeyConfigured: !!openAIData?.apiKeyConfigured,
      config: openAIData?.config,
      createdAt: new Date(),
      updatedAt: new Date(),
      hasApiKey: () => !!openAIData?.apiKeyConfigured,
      isActive: () => !!openAIData?.apiKeyConfigured,
      isOpenWeatherIntegration: () => false,
      isSendGridIntegration: () => false,
      canMakeRequest: () => !!openAIData?.apiKeyConfigured,
      getLastTestedAt: () => null,
      getApiKeyMasked: () => null
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      provider: 'DeepSeek',
      description: 'Modelos de IA avançados para análise e processamento de linguagem natural',
      icon: Bot,
      status: 'disconnected',
      apiKeyConfigured: false,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      hasApiKey: () => false,
      isActive: () => false,
      isOpenWeatherIntegration: () => false,
      isSendGridIntegration: () => false,
      canMakeRequest: () => false,
      getLastTestedAt: () => null,
      getApiKeyMasked: () => null
    },
    {
      id: 'google-ai',
      name: 'Google AI',
      provider: 'Google',
      description: 'Integração com Gemini e outros modelos do Google AI para análise multimodal',
      icon: Zap,
      status: 'disconnected',
      apiKeyConfigured: false,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      hasApiKey: () => false,
      isActive: () => false,
      isOpenWeatherIntegration: () => false,
      isSendGridIntegration: () => false,
      canMakeRequest: () => false,
      getLastTestedAt: () => null,
      getApiKeyMasked: () => null
    },
    {
      id: 'openweather',
      name: 'OpenWeather API',
      provider: 'openweather',
      description: 'Serviço de dados meteorológicos para o mapa interativo do sistema',
      icon: CloudRain,
      status: openWeatherData?.status || openWeatherData?.data?.status || 'disconnected',
      apiKeyConfigured: !!(openWeatherData?.config?.apiKey || openWeatherData?.data?.config?.apiKey),
      config: openWeatherData?.config || openWeatherData?.data?.config || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      hasApiKey: () => !!(openWeatherData?.config?.apiKey || openWeatherData?.data?.config?.apiKey),
      isActive: () => !!(openWeatherData?.config?.apiKey || openWeatherData?.data?.config?.apiKey),
      isOpenWeatherIntegration: () => true,
      isSendGridIntegration: () => false,
      canMakeRequest: () => !!(openWeatherData?.config?.apiKey || openWeatherData?.data?.config?.apiKey),
      getLastTestedAt: () => null,
      getApiKeyMasked: () => null
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      provider: 'SendGrid',
      description: 'Serviço de envio de e-mails transacionais e de marketing',
      icon: Plug, // Placeholder icon
      status: sendGridData?.status || 'disconnected',
      apiKeyConfigured: !!sendGridData?.apiKeyConfigured,
      config: sendGridData?.config || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      hasApiKey: () => !!sendGridData?.apiKeyConfigured,
      isActive: () => !!sendGridData?.apiKeyConfigured,
      isOpenWeatherIntegration: () => false,
      isSendGridIntegration: () => true,
      canMakeRequest: () => !!sendGridData?.apiKeyConfigured,
      getLastTestedAt: () => null,
      getApiKeyMasked: () => null
    }
    ];
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

  // Função para configurar integração
  const handleConfigure = async (integration: Integration) => {
    console.log('🔧 [CONFIGURE] Opening config dialog for:', integration.id);
    console.log('🔧 [CONFIGURE] Integration config:', integration.config);

    setSelectedIntegration(integration);

    // For OpenWeather, get the latest config from the specific endpoint
    if (integration.id === 'openweather') {
      try {
        console.log('🔧 [CONFIGURE-OW] Fetching latest OpenWeather config...');
        await refetchOpenWeather();

        const latestConfig = openWeatherData?.data?.config || openWeatherData?.config;
        console.log('🔧 [CONFIGURE-OW] Latest config:', latestConfig);

        if (latestConfig && latestConfig.apiKey) {
          console.log('📋 [CONFIGURE-OW] Loading saved OpenWeather configuration');
          configForm.reset({
            apiKey: latestConfig.apiKey || "",
            baseUrl: latestConfig.baseUrl || "https://api.openweathermap.org/data/2.5",
            maxTokens: 4000,
            temperature: 0.7,
            enabled: latestConfig.enabled !== false
          });
        } else {
          console.log('📋 [CONFIGURE-OW] No saved config, using defaults');
          configForm.reset({
            apiKey: "",
            baseUrl: "https://api.openweathermap.org/data/2.5",
            maxTokens: 4000,
            temperature: 0.7,
            enabled: true
          });
        }
      } catch (error) {
        console.error('❌ [CONFIGURE-OW] Error fetching config:', error);
        configForm.reset({
          apiKey: "",
          baseUrl: "https://api.openweathermap.org/data/2.5",
          maxTokens: 4000,
          temperature: 0.7,
          enabled: true
        });
      }
    } else if (integration.id === 'openai') {
      try {
        console.log('🔧 [CONFIGURE-AI] Fetching latest OpenAI config...');
        await refetchOpenAI();

        const latestConfig = openAIData?.data?.config || openAIData?.config;
        console.log('🔧 [CONFIGURE-AI] Latest config:', latestConfig);

        if (latestConfig && latestConfig.apiKey) {
          console.log('📋 [CONFIGURE-AI] Loading saved OpenAI configuration');
          configForm.reset({
            apiKey: latestConfig.apiKey || "",
            baseUrl: latestConfig.baseUrl || "",
            maxTokens: latestConfig.maxTokens || 4000,
            temperature: latestConfig.temperature || 0.7,
            enabled: latestConfig.enabled !== false
          });
        } else {
          console.log('📋 [CONFIGURE-AI] No saved config, using defaults');
          configForm.reset({
            apiKey: "",
            baseUrl: "",
            maxTokens: 4000,
            temperature: 0.7,
            enabled: true
          });
        }
      } catch (error) {
        console.error('❌ [CONFIGURE-AI] Error fetching config:', error);
        configForm.reset({
          apiKey: "",
          baseUrl: "",
          maxTokens: 4000,
          temperature: 0.7,
          enabled: true
        });
      }
    } else if (integration.id === 'sendgrid') {
      try {
        console.log('🔧 [CONFIGURE-SG] Fetching latest SendGrid config...');
        await refetchSendGrid();

        const latestConfig = sendGridData?.data?.config || sendGridData?.config;
        console.log('🔧 [CONFIGURE-SG] Latest config:', latestConfig);

        if (latestConfig && latestConfig.apiKey) {
          console.log('📋 [CONFIGURE-SG] Loading saved SendGrid configuration');
          configForm.reset({
            apiKey: latestConfig.apiKey || "",
            enabled: latestConfig.enabled !== false,
            // SendGrid doesn't use baseUrl, maxTokens, or temperature in the same way
            baseUrl: "", 
            maxTokens: 4000,
            temperature: 0.7,
          });
        } else {
          console.log('📋 [CONFIGURE-SG] No saved config, using defaults');
          configForm.reset({
            apiKey: "",
            enabled: true,
            baseUrl: "",
            maxTokens: 4000,
            temperature: 0.7,
          });
        }
      } catch (error) {
        console.error('❌ [CONFIGURE-SG] Error fetching config:', error);
        configForm.reset({
          apiKey: "",
          enabled: true,
          baseUrl: "",
          maxTokens: 4000,
          temperature: 0.7,
        });
      }
    } else {
      // For other integrations, use the config from the integration object
      if (integration.config && Object.keys(integration.config).length > 0) {
        console.log('📋 [CONFIGURE] Found existing configuration');
        configForm.reset({
          apiKey: integration.config.apiKey || "",
          baseUrl: integration.config.baseUrl || "",
          maxTokens: integration.config.maxTokens || 4000,
          temperature: integration.config.temperature || 0.7,
          enabled: integration.config.enabled !== false
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

  const renderActionButtons = (integration: Integration) => {
    // Padronizar todos os cards com o mesmo layout
    return (
      <div className="flex gap-2">
        <Button 
          size="sm" 
          onClick={() => handleConfigure(integration)}
          className="flex-1"
        >
          <Settings className="h-4 w-4 mr-1" />
          Configurar
        </Button>

        <Button 
          size="sm" 
          variant="outline"
          onClick={() => {
            if (integration.id === 'openweather') {
              testOpenWeatherMutation.mutate();
            } else if (integration.id === 'openai') {
              testOpenAIMutation.mutate();
            } else if (integration.id === 'sendgrid') {
              testSendGridMutation.mutate();
            } else {
              testIntegrationMutation.mutate(integration.id);
            }
          }}
          disabled={
            !integration.apiKeyConfigured || 
            (integration.id === 'openweather' && testOpenWeatherMutation.isPending) ||
            (integration.id === 'openai' && testOpenAIMutation.isPending) ||
            (integration.id === 'sendgrid' && testSendGridMutation.isPending) ||
            (integration.id !== 'openweather' && integration.id !== 'openai' && integration.id !== 'sendgrid' && testIntegrationMutation.isPending)
          }
        >
          {integration.id === 'openweather' && testOpenWeatherMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : integration.id === 'openai' && testOpenAIMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : integration.id === 'sendgrid' && testSendGridMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-1" />
          )}
          {integration.id === 'openweather' && testOpenWeatherMutation.isPending ? 'Testando...' : 
           integration.id === 'openai' && testOpenAIMutation.isPending ? 'Testando...' :
           integration.id === 'sendgrid' && testSendGridMutation.isPending ? 'Testando...' : 'Testar'}
        </Button>
      </div>
    );
  };

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
              Configurar e gerenciar integrações com provedores de IA
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
            <div className="text-2xl font-bold">{integrations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conectadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.filter(i => i.status === 'connected').length}
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
              {integrations.filter(i => i.status === 'error').length}
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
              {integrations.filter(i => i.status === 'disconnected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrações Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => {
          const IconComponent = integration.icon || Plug; // Fallback para Plug se icon for undefined
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

                {renderActionButtons(integration)}

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

              {selectedIntegration?.id !== 'openai' && selectedIntegration?.id !== 'sendgrid' && ( // BaseUrl is optional for OpenAI and SendGrid
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
              )}

              {selectedIntegration?.id === 'openai' && ( // Configurações específicas para OpenAI
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