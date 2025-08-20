import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, Settings, BarChart3, Shield, Building, Mail } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// import useLocalization from '@/hooks/useLocalization';
const createUserSchema = z.object({
  // Localization temporarily disabled
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
export default function TenantAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  // Verificar se usuário é tenant admin ou superior
  if (!user || !['tenant_admin', 'saas_admin'].includes(user.role)) {
    return (
      <div className="p-4"
        <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="p-4"
          Acesso Negado
        </h1>
        <p className="p-4"
          Esta página é restrita para administradores de workspace.
        </p>
      </div>
    );
  }
  // Query para configurações do tenant
  const { data: tenantSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/tenant-admin/settings'],
    staleTime: 5 * 60 * 1000,
  });
  // Query para usuários do tenant
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/tenant-admin/users'],
    staleTime: 5 * 60 * 1000,
  });
  // Query para analytics do tenant
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/tenant-admin/analytics'],
    staleTime: 2 * 60 * 1000,
  });
  // Form para criar usuário
  const userForm = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "agent" as const
    }
  });
  // Form para configurações
  const settingsForm = useForm({
    resolver: zodResolver(tenantSettingsSchema),
    defaultValues: {
      name: tenantSettings?.name || "",
      settings: tenantSettings?.settings || {}
    }
  });
  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createUserSchema>) => {
      const res = await apiRequest('POST', '/api/tenant-admin/users', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/users'] });
      setIsCreateUserDialogOpen(false);
      userForm.reset();
      toast({
        title: "Usuário criado",
        description: "Novo usuário criado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message,
        variant: "destructive",
      });
    }
  });
  // Mutation para atualizar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof tenantSettingsSchema>) => {
      const res = await apiRequest('PUT', '/api/tenant-admin/settings', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/settings'] });
      setIsSettingsDialogOpen(false);
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message,
        variant: "destructive",
      });
    }
  });
  const onSubmitUser = (data: z.infer<typeof createUserSchema>) => {
    createUserMutation.mutate(data);
  };
  const onSubmitSettings = (data: z.infer<typeof tenantSettingsSchema>) => {
    updateSettingsMutation.mutate(data);
  };
  return (
    <div className="p-4"
      {/* Header */}
      <div className="p-4"
        <div>
          <h1 className="p-4"
            Administração do Workspace
          </h1>
          <p className="p-4"
            Gerencie usuários e configurações do seu workspace
          </p>
        </div>
        
        <div className="p-4"
          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurações do Workspace</DialogTitle>
              </DialogHeader>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSubmitSettings)} className="p-4"
                  <FormField
                    control={settingsForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Workspace</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="p-4"
                    <Button type="button" variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateSettingsMutation.isPending}>
                      {updateSettingsMutation.isPending ? 'Salvando...' : '[TRANSLATION_NEEDED]'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="p-4"
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="p-4"
                  <FormField
                    control={userForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="usuario@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="João" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sobrenome</FormLabel>
                        <FormControl>
                          <Input placeholder="Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Papel</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
                  <div className="p-4"
                    <Button type="button" variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending ? 'Criando...' : '[TRANSLATION_NEEDED]'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Tenant Info Card */}
      <Card className="p-4"
        <CardHeader>
          <CardTitle className="p-4"
            <Building className="w-5 h-5 mr-2" />
            Informações do Tenant
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSettings ? (
            <div className="p-4"
              <div className="text-lg">"</div>
            </div>
          ) : (
            <div className="p-4"
              <div>
                <label className="text-lg">"Nome</label>
                <p className="text-lg">"{tenantSettings?.name}</p>
              </div>
              <div>
                <label className="text-lg">"Subdomínio</label>
                <p className="text-lg">"{tenantSettings?.subdomain}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Analytics Cards */}
      <div className="p-4"
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Tickets Ativos</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {analyticsData?.activeTickets || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Usuários</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {usersData?.users?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Satisfação</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {analyticsData?.satisfactionScore || 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Agentes Online</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {analyticsData?.onlineAgents || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="p-4"
            <Users className="w-5 h-5 mr-2" />
            Usuários do Tenant
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="p-4"
              <div className="text-lg">"</div>
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
                {usersData?.users?.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="p-4"
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="p-4"
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="p-4"
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700>
                        {user.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : 'Nunca'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm>
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
    </div>
  );
}