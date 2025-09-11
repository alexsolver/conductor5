/**
 * Unified Tenants Management Page
 * Consolidates functionality from SaasAdmin.tsx, TenantAdmin.tsx, and TenantProvisioning.tsx
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Users, 
  Building, 
  Settings, 
  BarChart3, 
  Shield, 
  Mail, 
  CheckCircle,
  XCircle,
  Zap,
  Globe,
  Cog
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TenantTemplateApplicator } from '../components/TenantTemplateApplicator';

// ============================================================================
// SCHEMAS - Consolidated from all three pages
// ============================================================================

// From SaasAdmin.tsx
const createTenantSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  subdomain: z.string().min(1, "Subdomínio é obrigatório").regex(/^[a-z0-9-]+$/, "Subdomínio deve conter apenas letras minúsculas, números e hífens"),
  settings: z.object({}).optional()
});

// From TenantAdmin.tsx
const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().optional(),
  role: z.enum(['agent', 'customer']).default('agent')
});

const tenantSettingsSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  settings: z.object({
    allowRegistration: z.boolean().optional(),
    maxUsers: z.number().optional(),
    features: z.array(z.string()).optional()
  }).optional()
});

// From TenantProvisioning.tsx
const provisionTenantSchema = z.object({
  name: z.string().min(1, "Nome do tenant é obrigatório"),
  subdomain: z.string().optional(),
  companyName: z.string().optional(),
  settings: z.record(z.any()).optional()
});

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

type CreateTenantFormData = z.infer<typeof createTenantSchema>;
type CreateUserFormData = z.infer<typeof createUserSchema>;
type TenantSettingsFormData = z.infer<typeof tenantSettingsSchema>;
type ProvisionTenantFormData = z.infer<typeof provisionTenantSchema>;
type ConfigFormData = z.infer<typeof configSchema>;

export default function Tenants() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Dialog states
  const [isCreateTenantDialogOpen, setIsCreateTenantDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isProvisionDialogOpen, setIsProvisionDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  // Role access check
  if (user?.role !== 'saas_admin') {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Acesso Negado
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Esta página é restrita para administradores da plataforma SaaS.
        </p>
      </div>
    );
  }

  // ============================================================================
  // QUERIES - Consolidated from all three pages
  // ============================================================================

  // From SaasAdmin.tsx
  const { data: tenantsData, isLoading: isLoadingTenants } = useQuery({
    queryKey: ['/api/saas-admin/tenants'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['/api/saas-admin/analytics'],
    staleTime: 2 * 60 * 1000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['/api/saas-admin/users'],
    staleTime: 5 * 60 * 1000,
  });

  // From TenantAdmin.tsx
  const { data: tenantSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/tenant-admin/settings'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: tenantUsersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/tenant-admin/users'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: tenantAnalyticsData } = useQuery({
    queryKey: ['/api/tenant-admin/analytics'],
    staleTime: 2 * 60 * 1000,
  });

  // From TenantProvisioning.tsx
  const { data: provisioningConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['/api/saas-admin/tenant-provisioning/config'],
    staleTime: 5 * 60 * 1000,
  });

  // ============================================================================
  // FORMS - Consolidated from all three pages
  // ============================================================================

  const createTenantForm = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      settings: {}
    }
  });

  const createUserForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "agent" as const
    }
  });

  const settingsForm = useForm<TenantSettingsFormData>({
    resolver: zodResolver(tenantSettingsSchema),
    defaultValues: {
      name: (tenantSettings as any)?.name || "",
      settings: (tenantSettings as any)?.settings || {}
    }
  });

  const provisionForm = useForm<ProvisionTenantFormData>({
    resolver: zodResolver(provisionTenantSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      companyName: "",
      settings: {}
    }
  });

  const configForm = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: provisioningConfig || {
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

  // ============================================================================
  // MUTATIONS - Consolidated from all three pages
  // ============================================================================

  const createTenantMutation = useMutation({
    mutationFn: async (data: CreateTenantFormData) => {
      const res = await apiRequest('POST', '/api/saas-admin/tenants', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/tenants'] });
      setIsCreateTenantDialogOpen(false);
      createTenantForm.reset();
      toast({
        title: "Tenant criado",
        description: "Novo tenant criado com sucesso!",
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

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      const res = await apiRequest('POST', '/api/tenant-admin/users', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/users'] });
      setIsCreateUserDialogOpen(false);
      createUserForm.reset();
      toast({
        title: "Usuário criado",
        description: "Novo usuário criado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: TenantSettingsFormData) => {
      const res = await apiRequest('PUT', '/api/tenant-admin/settings', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/settings'] });
      setIsSettingsDialogOpen(false);
      toast({
        title: "Configurações atualizadas",
        description: "Configurações do workspace atualizadas com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message,
        variant: "destructive",
      });
    }
  });

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

  const updateConfigMutation = useMutation({
    mutationFn: async (data: Partial<ConfigFormData>) => {
      const res = await apiRequest('PUT', '/api/tenant-provisioning/config', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/tenant-provisioning/config'] });
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

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const onCreateTenantSubmit = (data: CreateTenantFormData) => {
    createTenantMutation.mutate(data);
  };

  const onCreateUserSubmit = (data: CreateUserFormData) => {
    createUserMutation.mutate(data);
  };

  const onSettingsSubmit = (data: TenantSettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  const onProvisionSubmit = (data: ProvisionTenantFormData) => {
    provisionMutation.mutate(data);
  };

  const onConfigSubmit = (data: ConfigFormData) => {
    updateConfigMutation.mutate(data);
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

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

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gerenciamento de Tenants
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Administração completa de tenants, usuários e configurações da plataforma
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="tenant-management" data-testid="tab-tenant-management">
            <Building className="w-4 h-4 mr-2" />
            Gestão de Tenant
          </TabsTrigger>
          <TabsTrigger value="provisioning" data-testid="tab-provisioning">
            <Zap className="w-4 h-4 mr-2" />
            Provisionamento
          </TabsTrigger>
          <TabsTrigger value="platform-users" data-testid="tab-platform-users">
            <Users className="w-4 h-4 mr-2" />
            Usuários da Plataforma
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================== */}
        {/* OVERVIEW TAB - From SaasAdmin.tsx */}
        {/* ========================================================================== */}
        <TabsContent value="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Dashboard SaaS</h2>
            <Dialog open={isCreateTenantDialogOpen} onOpenChange={setIsCreateTenantDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-white hover:opacity-90" data-testid="button-create-tenant">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Tenant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Tenant</DialogTitle>
                </DialogHeader>
                <Form {...createTenantForm}>
                  <form onSubmit={createTenantForm.handleSubmit(onCreateTenantSubmit)} className="space-y-4">
                    <FormField
                      control={createTenantForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Tenant</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corporation" {...field} data-testid="input-tenant-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createTenantForm.control}
                      name="subdomain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subdomínio</FormLabel>
                          <FormControl>
                            <Input placeholder="acme" {...field} data-testid="input-tenant-subdomain" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateTenantDialogOpen(false)} data-testid="button-cancel-tenant">
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createTenantMutation.isPending} data-testid="button-submit-tenant">
                        {createTenantMutation.isPending ? 'Criando...' : 'Criar'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="gradient-card border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Total Tenants</CardTitle>
                <Building className="h-4 w-4 text-purple-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" data-testid="text-total-tenants">
                  {(tenantsData as any)?.total || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Total Usuários</CardTitle>
                <Users className="h-4 w-4 text-purple-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" data-testid="text-total-users">
                  {(analyticsData as any)?.totalUsers || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Total Tickets</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" data-testid="text-total-tickets">
                  {(analyticsData as any)?.totalTickets || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Usuários Ativos</CardTitle>
                <Users className="h-4 w-4 text-purple-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" data-testid="text-active-users">
                  {(analyticsData as any)?.activeUsers || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tenants Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Tenants Cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTenants ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(tenantsData as any)?.tenants?.map((tenant: any) => (
                    <div key={tenant.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`card-tenant-${tenant.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`text-tenant-name-${tenant.id}`}>{tenant.name}</h3>
                        <Badge className="bg-green-100 text-green-700">Ativo</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Subdomínio:</span>
                          <Badge variant="outline" data-testid={`text-tenant-subdomain-${tenant.id}`}>{tenant.subdomain}</Badge>
                        </div>
                        <div>
                          <span className="font-medium mr-2">Criado em:</span>
                          <span data-testid={`text-tenant-created-${tenant.id}`}>{new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button variant="ghost" size="sm" className="text-purple-600" data-testid={`button-manage-tenant-${tenant.id}`}>
                          <Settings className="w-4 h-4 mr-1" />
                          Gerenciar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================== */}
        {/* TENANT MANAGEMENT TAB - From TenantAdmin.tsx */}
        {/* ========================================================================== */}
        <TabsContent value="tenant-management" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Administração do Workspace</h2>
            <div className="flex space-x-2">
              <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-tenant-settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configurações do Workspace</DialogTitle>
                  </DialogHeader>
                  <Form {...settingsForm}>
                    <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4">
                      <FormField
                        control={settingsForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Workspace</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da empresa" {...field} data-testid="input-workspace-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsSettingsDialogOpen(false)} data-testid="button-cancel-settings">
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={updateSettingsMutation.isPending} data-testid="button-submit-settings">
                          {updateSettingsMutation.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary text-white hover:opacity-90" data-testid="button-create-user">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Usuário</DialogTitle>
                  </DialogHeader>
                  <Form {...createUserForm}>
                    <form onSubmit={createUserForm.handleSubmit(onCreateUserSubmit)} className="space-y-4">
                      <FormField
                        control={createUserForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="usuario@empresa.com" {...field} data-testid="input-user-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createUserForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="João" {...field} data-testid="input-user-firstname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createUserForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sobrenome</FormLabel>
                            <FormControl>
                              <Input placeholder="Silva" {...field} data-testid="input-user-lastname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createUserForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Papel</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-user-role">
                                  <SelectValue placeholder="Selecionar papel" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="agent">Agente</SelectItem>
                                <SelectItem value="customer">Cliente</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateUserDialogOpen(false)} data-testid="button-cancel-user">
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-submit-user">
                          {createUserMutation.isPending ? 'Criando...' : 'Criar'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tenant Info Card */}
          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Building className="w-5 h-5 mr-2" />
                Informações do Tenant
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSettings ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-white">
                  <div>
                    <label className="text-sm text-purple-200">Nome</label>
                    <p className="text-lg font-medium" data-testid="text-tenant-info-name">{(tenantSettings as any)?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-purple-200">Subdomínio</label>
                    <p className="text-lg font-medium" data-testid="text-tenant-info-subdomain">{(tenantSettings as any)?.subdomain}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tenant Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tickets Ativos</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-tenant-active-tickets">
                  {(tenantAnalyticsData as any)?.activeTickets || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-tenant-users-count">
                  {(tenantUsersData as any)?.users?.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-tenant-satisfaction">
                  {(tenantAnalyticsData as any)?.satisfactionScore || 0}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agentes Online</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-tenant-online-agents">
                  {(tenantAnalyticsData as any)?.onlineAgents || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Usuários do Tenant
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último Login</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tenantUsersData as any)?.users?.map((user: any) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="font-medium" data-testid={`text-user-name-${user.id}`}>
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            <span data-testid={`text-user-email-${user.id}`}>{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize" data-testid={`badge-user-role-${user.id}`}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"} data-testid={`badge-user-status-${user.id}`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-user-login-${user.id}`}>
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : 'Nunca'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" data-testid={`button-user-settings-${user.id}`}>
                            <Settings className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Template Configuration Section */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Configuração de Template</h2>
            <p className="text-sm text-gray-600 mb-4">
              Caso as configurações padrão não tenham sido aplicadas automaticamente durante a criação do tenant,
              você pode aplicá-las manualmente usando o botão abaixo.
            </p>
            <TenantTemplateApplicator
              onTemplateApplied={() => {
                // Refresh tenant data after template application
                window.location.reload();
              }}
            />
          </div>
        </TabsContent>

        {/* ========================================================================== */}
        {/* PROVISIONING TAB - From TenantProvisioning.tsx */}
        {/* ========================================================================== */}
        <TabsContent value="provisioning" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Auto-Provisioning de Tenants</h2>
            <div className="flex gap-3">
              <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-provisioning-config">
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
                                  data-testid="switch-auto-provisioning"
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
                                  data-testid="switch-self-provisioning"
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
                                <SelectTrigger data-testid="select-subdomain-generation">
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
                        <Button type="button" variant="outline" onClick={() => setIsConfigDialogOpen(false)} data-testid="button-cancel-config">
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={updateConfigMutation.isPending} data-testid="button-submit-config">
                          {updateConfigMutation.isPending ? "Salvando..." : "Salvar Configuração"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={isProvisionDialogOpen} onOpenChange={setIsProvisionDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-provision-tenant">
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
                              <Input placeholder="Ex: Empresa ABC" {...field} data-testid="input-provision-name" />
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
                              <Input placeholder="Ex: empresa-abc" {...field} data-testid="input-provision-subdomain" />
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
                              <Input placeholder="Ex: Empresa ABC Ltda" {...field} data-testid="input-provision-company" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsProvisionDialogOpen(false)} data-testid="button-cancel-provision">
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={provisionMutation.isPending} data-testid="button-submit-provision">
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
                    <div data-testid="badge-system-status">
                      {getStatusBadge((provisioningConfig as any)?.enabled || false)}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2" data-testid="text-system-status-description">
                  {(provisioningConfig as any)?.enabled ? 'Auto-provisioning ativo' : 'Auto-provisioning desabilitado'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Geração de Subdomínio</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-subdomain-method">
                  {(provisioningConfig as any)?.subdomainGeneration === 'company-based' && 'Empresa'}
                  {(provisioningConfig as any)?.subdomainGeneration === 'user-based' && 'Usuário'}
                  {(provisioningConfig as any)?.subdomainGeneration === 'random' && 'Aleatório'}
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
                <div className="text-2xl font-bold" data-testid="text-default-limits">
                  {(provisioningConfig as any)?.defaultTenantSettings?.maxUsers || 50}
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
              ) : provisioningConfig ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Auto-Provisioning</Label>
                      <div className="mt-1" data-testid="status-auto-provisioning">
                        {getStatusBadge((provisioningConfig as any).enabled)}
                      </div>
                    </div>
                    <div>
                      <Label>Criação por Usuários</Label>
                      <div className="mt-1" data-testid="status-self-provisioning">
                        {getStatusBadge((provisioningConfig as any).allowSelfProvisioning)}
                      </div>
                    </div>
                    <div>
                      <Label>Criação no Primeiro Usuário</Label>
                      <div className="mt-1" data-testid="status-first-user">
                        {getStatusBadge((provisioningConfig as any).autoCreateOnFirstUser)}
                      </div>
                    </div>
                    <div>
                      <Label>Método de Subdomínio</Label>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400" data-testid="text-subdomain-method-details">
                        {(provisioningConfig as any).subdomainGeneration}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Configurações Padrão</Label>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Máximo de Usuários:</span> 
                          <span data-testid="text-config-max-users">{(provisioningConfig as any).defaultTenantSettings.maxUsers}</span>
                        </div>
                        <div>
                          <span className="font-medium">Máximo de Tickets:</span> 
                          <span data-testid="text-config-max-tickets">{(provisioningConfig as any).defaultTenantSettings.maxTickets}</span>
                        </div>
                        <div>
                          <span className="font-medium">Funcionalidades:</span> 
                          <span data-testid="text-config-features">{(provisioningConfig as any).defaultTenantSettings.features.join(', ')}</span>
                        </div>
                        <div>
                          <span className="font-medium">Tema:</span> 
                          <span data-testid="text-config-theme">{(provisioningConfig as any).defaultTenantSettings.theme}</span>
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
        </TabsContent>

        {/* ========================================================================== */}
        {/* PLATFORM USERS TAB - From SaasAdmin.tsx */}
        {/* ========================================================================== */}
        <TabsContent value="platform-users" className="space-y-6">
          <h2 className="text-2xl font-semibold">Usuários da Plataforma</h2>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Todos os Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersData ? (
                <div className="space-y-4">
                  {(usersData as any)?.users?.map((user: any) => (
                    <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`card-platform-user-${user.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`text-platform-user-name-${user.id}`}>
                          {user.firstName} {user.lastName}
                        </h3>
                        <Badge 
                          variant={user.role === 'saas_admin' ? 'default' : 'secondary'}
                          className={user.role === 'saas_admin' ? 'bg-red-100 text-red-700' : ''}
                          data-testid={`badge-platform-user-role-${user.id}`}
                        >
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div data-testid={`text-platform-user-email-${user.id}`}>{user.email}</div>
                        <div>
                          <span className="font-medium mr-2">Status:</span>
                          <Badge className={user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"} data-testid={`badge-platform-user-status-${user.id}`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        {user.lastLoginAt && (
                          <div>
                            <span className="font-medium mr-2">Último login:</span>
                            <span data-testid={`text-platform-user-login-${user.id}`}>{new Date(user.lastLoginAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}