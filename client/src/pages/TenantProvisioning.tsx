/**
 * Tenant Auto-Provisioning Management Page
 * Interface for configuring and managing automatic tenant creation
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
export default function TenantProvisioning() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProvisionDialogOpen, setIsProvisionDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  // Verificar se usuário é SaaS admin
  if (user?.role !== 'saas_admin') {
    return (
      <div className="p-4"
        <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="p-4"
          Acesso Negado
        </h1>
        <p className="p-4"
          Esta página é restrita para administradores da plataforma SaaS.
        </p>
      </div>
    );
  }
  // Query para configuração de auto-provisioning
  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['/api/tenant-provisioning/config'],
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
        description: "criado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao Criar Tenant',
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
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-provisioning/config'] });
      setIsConfigDialogOpen(false);
      toast({
        title: "Configuração Atualizada",
        description: 'Configurações de Autoprovisioning Atualizadas com Sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao Atualizar Configuração',
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
      <Badge variant="default" className="p-4"
        <CheckCircle className="w-3 h-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="secondary>
        <XCircle className="w-3 h-3 mr-1" />
        Inativo
      </Badge>
    );
  };
  return (
    <div className="p-4"
      <div className="p-4"
        <div>
          <h1 className="p-4"
            Auto-Provisioning de Tenants
          </h1>
          <p className="p-4"
            Configure e gerencie a criação automática de tenants
          </p>
        </div>
        <div className="p-4"
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </DialogTrigger>
            <DialogContent className="p-4"
              <DialogHeader>
                <DialogTitle>Configurações de Auto-Provisioning</DialogTitle>
              </DialogHeader>
              <Form {...configForm}>
                <form onSubmit={configForm.handleSubmit(onConfigSubmit)} className="p-4"
                  <div className="p-4"
                    <FormField
                      control={configForm.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="p-4"
                          <div className="p-4"
                            <FormLabel className="text-lg">"Auto-Provisioning</FormLabel>
                            <div className="p-4"
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
                        <FormItem className="p-4"
                          <div className="p-4"
                            <FormLabel className="text-lg">"Auto-Provisioning</FormLabel>
                            <div className="p-4"
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
                              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                  <div className="p-4"
                    <Button type="button" variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateConfigMutation.isPending}>
                      {updateConfigMutation.isPending ? "Salvando..." : 'Salvar Configuração'}
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
                <form onSubmit={provisionForm.handleSubmit(onProvisionSubmit)} className="p-4"
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
                  <div className="p-4"
                    <Button type="button" variant="outline" onClick={() => setIsProvisionDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={provisionMutation.isPending}>
                      {provisionMutation.isPending ? "Criando..." : 'Criar Tenant'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Status Cards */}
      <div className="p-4"
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Status do Sistema</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {isLoadingConfig ? (
                <Badge variant="secondary">Carregando...</Badge>
              ) : (
                getStatusBadge(config?.enabled || false)
              )}
            </div>
            <p className="p-4"
              {config?.enabled ? 'Auto-provisioning ativo' : 'Auto-provisioning desabilitado'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Geração de Subdomínio</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {config?.subdomainGeneration === 'company-based' && 'Empresa'}
              {config?.subdomainGeneration === 'user-based' && 'Usuário'}
              {config?.subdomainGeneration === 'random' && 'Aleatório'}
            </div>
            <p className="p-4"
              Método de geração ativo
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Limites Padrão</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {config?.defaultTenantSettings?.maxUsers || 50}
            </div>
            <p className="p-4"
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
            <div className="text-lg">"Carregando configurações...</div>
          ) : config ? (
            <div className="p-4"
              <div className="p-4"
                <div>
                  <Label>Auto-Provisioning</Label>
                  <div className="p-4"
                    {getStatusBadge(config.enabled)}
                  </div>
                </div>
                <div>
                  <Label>Criação por Usuários</Label>
                  <div className="p-4"
                    {getStatusBadge(config.allowSelfProvisioning)}
                  </div>
                </div>
                <div>
                  <Label>Criação no Primeiro Usuário</Label>
                  <div className="p-4"
                    {getStatusBadge(config.autoCreateOnFirstUser)}
                  </div>
                </div>
                <div>
                  <Label>Método de Subdomínio</Label>
                  <div className="p-4"
                    {config.subdomainGeneration}
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Configurações Padrão</Label>
                <div className="p-4"
                  <div className="p-4"
                    <div>
                      <span className="text-lg">"Máximo de Usuários:</span> {config.defaultTenantSettings.maxUsers}
                    </div>
                    <div>
                      <span className="text-lg">"Máximo de Tickets:</span> {config.defaultTenantSettings.maxTickets}
                    </div>
                    <div>
                      <span className="text-lg">"Funcionalidades:</span> {config.defaultTenantSettings.features.join(', ')}
                    </div>
                    <div>
                      <span className="text-lg">"Tema:</span> {config.defaultTenantSettings.theme}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4"
              Falha ao carregar configurações
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}