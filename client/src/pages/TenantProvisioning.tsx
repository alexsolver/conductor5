/**
 * Tenant Auto-Provisioning Management Page
 * Interface for configuring and managing automatic tenant creation
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Zap, 
  Globe,
  Building,
  Users,
  Cog
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Schema for manual tenant provisioning
const provisionTenantSchema = z.object({
  name: z.string().min(1, "Nome do tenant é obrigatório"),
  subdomain: z.string().optional(),
  companyName: z.string().optional(),
  settings: z.record(z.any()).optional()
});

// Schema for configuration updates
const configSchema = z.object({
  enabled: z.boolean(),
  allowSelfProvisioning: z.boolean(),
  autoCreateOnFirstUser: z.boolean(),
  subdomainGeneration: z.enum(['random', 'company-based', 'user-based']),
  defaultTenantSettings: z.object({
    maxUsers: z.number().min(1),
    maxTickets: z.number().min(1),
    features: z.array(z.string()),
    theme: z.string()
  })
});

type ProvisionTenantFormData = z.infer<typeof provisionTenantSchema>;
type ConfigFormData = z.infer<typeof configSchema>;

// Interface for the config API response
interface ProvisioningConfig {
  enabled: boolean;
  allowSelfProvisioning: boolean;
  autoCreateOnFirstUser: boolean;
  subdomainGeneration: 'random' | 'company-based' | 'user-based';
  defaultTenantSettings: {
    maxUsers: number;
    maxTickets: number;
    features: string[];
    theme: string;
  };
}

export default function TenantProvisioning() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [isProvisionDialogOpen, setIsProvisionDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  
  // Check if this is SaaS Admin page
  const isSaasAdmin = location.includes('/saas-admin/tenant-provisioning');

  // Verificar se usuário é SaaS admin
  if (user?.role !== 'saas_admin') {
    return (
      <div className="p-8 text-center">
        <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Acesso Negado
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Esta página é restrita para administradores da plataforma SaaS.
        </p>
      </div>
    );
  }

  // Query para configuração de auto-provisioning
  const { data: config, isLoading: isLoadingConfig } = useQuery<ProvisioningConfig>({
    queryKey: isSaasAdmin ? ['/api/saas-admin/tenant-provisioning/config'] : ['/api/tenant-provisioning/config'],
    staleTime: 5 * 60 * 1000,
  });

  // Form para provisionamento manual
  const provisionForm = useForm<ProvisionTenantFormData>({
    resolver: zodResolver(provisionTenantSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      companyName: "",
      settings: {}
    }
  });

  // Form para configuração
  const configForm = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: config || {
      enabled: true,
      allowSelfProvisioning: true,
      autoCreateOnFirstUser: true,
      subdomainGeneration: 'company-based',
      defaultTenantSettings: {
        maxUsers: 50,
        maxTickets: 1000,
        features: ['tickets', 'customers', 'analytics'],
        theme: 'default'
      }
    }
  });

  // Mutation para provisionamento manual
  const provisionMutation = useMutation({
    mutationFn: async (data: ProvisionTenantFormData) => {
      const res = await apiRequest('POST', '/api/tenant-provisioning/provision', data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/tenants'] });
      setIsProvisionDialogOpen(false);
      provisionForm.reset();
      toast({
        title: "Tenant Criado",
        description: `Tenant "${data.tenant.name}" criado com sucesso!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar tenant",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar configuração
  const updateConfigMutation = useMutation({
    mutationFn: async (data: Partial<ConfigFormData>) => {
      const res = await apiRequest('PUT', '/api/tenant-provisioning/config', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: isSaasAdmin ? ['/api/saas-admin/tenant-provisioning/config'] : ['/api/tenant-provisioning/config'] });
      setIsConfigDialogOpen(false);
      toast({
        title: "Configuração Atualizada",
        description: "Configurações de auto-provisioning atualizadas com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar configuração",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onProvisionSubmit = (data: ProvisionTenantFormData) => {
    provisionMutation.mutate(data);
  };

  const onConfigSubmit = (data: ConfigFormData) => {
    updateConfigMutation.mutate(data);
  };

  const getStatusBadge = (enabled: boolean) => {
    return enabled ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="secondary">
        <XCircle className="w-3 h-3 mr-1" />
        Inativo
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Auto-Provisioning de Tenants
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure e gerencie a criação automática de tenants
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configurações de Auto-Provisioning</DialogTitle>
              </DialogHeader>
              <Form {...configForm}>
                <form onSubmit={configForm.handleSubmit(onConfigSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={configForm.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Auto-Provisioning</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Habilitar criação automática de tenants
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
                    
                    <FormField
                      control={configForm.control}
                      name="allowSelfProvisioning"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Auto-Provisioning</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Permitir criação por usuários
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

                  <FormField
                    control={configForm.control}
                    name="subdomainGeneration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geração de Subdomínio</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o método" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="company-based">Baseado na Empresa</SelectItem>
                            <SelectItem value="user-based">Baseado no Usuário</SelectItem>
                            <SelectItem value="random">Aleatório</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateConfigMutation.isPending}>
                      {updateConfigMutation.isPending ? "Salvando..." : "Salvar Configuração"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isProvisionDialogOpen} onOpenChange={setIsProvisionDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Provisionar Tenant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Provisionar Novo Tenant</DialogTitle>
              </DialogHeader>
              <Form {...provisionForm}>
                <form onSubmit={provisionForm.handleSubmit(onProvisionSubmit)} className="space-y-4">
                  <FormField
                    control={provisionForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Tenant</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Empresa ABC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={provisionForm.control}
                    name="subdomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subdomínio (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: empresa-abc" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={provisionForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Empresa (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Empresa ABC Ltda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsProvisionDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={provisionMutation.isPending}>
                      {provisionMutation.isPending ? "Criando..." : "Criar Tenant"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {isLoadingConfig ? (
                <Badge variant="secondary">Carregando...</Badge>
              ) : (
                getStatusBadge(config?.enabled || false)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {config?.enabled ? 'Auto-provisioning ativo' : 'Auto-provisioning desabilitado'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geração de Subdomínio</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {config?.subdomainGeneration === 'company-based' && 'Empresa'}
              {config?.subdomainGeneration === 'user-based' && 'Usuário'}
              {config?.subdomainGeneration === 'random' && 'Aleatório'}
            </div>
            <p className="text-xs text-muted-foreground">
              Método de geração ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Limites Padrão</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {config?.defaultTenantSettings?.maxUsers || 50}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuários por tenant
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração Atual</CardTitle>
          <CardDescription>
            Visão geral das configurações de auto-provisioning
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingConfig ? (
            <div className="text-center py-8">Carregando configurações...</div>
          ) : config ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Auto-Provisioning</Label>
                  <div className="mt-1">
                    {getStatusBadge(config.enabled)}
                  </div>
                </div>
                <div>
                  <Label>Criação por Usuários</Label>
                  <div className="mt-1">
                    {getStatusBadge(config.allowSelfProvisioning)}
                  </div>
                </div>
                <div>
                  <Label>Criação no Primeiro Usuário</Label>
                  <div className="mt-1">
                    {getStatusBadge(config.autoCreateOnFirstUser)}
                  </div>
                </div>
                <div>
                  <Label>Método de Subdomínio</Label>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {config.subdomainGeneration}
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Configurações Padrão</Label>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Máximo de Usuários:</span> {config.defaultTenantSettings.maxUsers}
                    </div>
                    <div>
                      <span className="font-medium">Máximo de Tickets:</span> {config.defaultTenantSettings.maxTickets}
                    </div>
                    <div>
                      <span className="font-medium">Funcionalidades:</span> {config.defaultTenantSettings.features.join(', ')}
                    </div>
                    <div>
                      <span className="font-medium">Tema:</span> {config.defaultTenantSettings.theme}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Falha ao carregar configurações
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}