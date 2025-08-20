import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, Building, Settings, BarChart3, Shield } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// import useLocalization from '@/hooks/useLocalization';
const createTenantSchema = z.object({
  // Localization temporarily disabled
  name: z.string().min(1, "Nome é obrigatório"),
  subdomain: z.string().min(1, "Subdomínio é obrigatório").regex(/^[a-z0-9-]+$/, "Subdomínio deve conter apenas letras minúsculas, números e hífens"),
  settings: z.object({}).optional()
});
export default function SaasAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  // Verificar se usuário é SaaS admin
  if (user?.role !== 'saas_admin') {
    return (
      <div className="p-4"
        <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="p-4"
          Acesso Negado
        </h1>
        <p className="p-4"
          Esta página é restrita para administradores da plataforma SaaS.
        </p>
      </div>
    );
  }
  // Query para listar tenants
  const { data: tenantsData, isLoading: isLoadingTenants } = useQuery({
    queryKey: ['/api/saas-admin/tenants'],
    staleTime: 5 * 60 * 1000,
  });
  // Query para analytics da plataforma
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/saas-admin/analytics'],
    staleTime: 2 * 60 * 1000,
  });
  // Query para lista de usuários
  const { data: usersData } = useQuery({
    queryKey: ['/api/saas-admin/users'],
    staleTime: 5 * 60 * 1000,
  });
  // Form para criar tenant
  const form = useForm({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      settings: {}
    }
  });
  // Mutation para criar tenant
  const createTenantMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTenantSchema>) => {
      const res = await apiRequest('POST', '/api/saas-admin/tenants', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/tenants'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Tenant criado",
        description: "Novo tenant criado com sucesso!",
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
  const onSubmit = (data: z.infer<typeof createTenantSchema>) => {
    createTenantMutation.mutate(data);
  };
  return (
    <div className="p-4"
      {/* Header */}
      <div className="p-4"
        <div>
          <h1 className="p-4"
            Administração SaaS
          </h1>
          <p className="p-4"
            Gerencie tenants, usuários e configurações da plataforma
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="p-4"
              <Plus className="w-4 h-4 mr-2" />
              Novo Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Tenant</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-4"
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Tenant</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corporation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subdomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subdomínio</FormLabel>
                      <FormControl>
                        <Input placeholder="acme" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="p-4"
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createTenantMutation.isPending}>
                    {createTenantMutation.isPending ? 'Criando...' : '[TRANSLATION_NEEDED]'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      {/* Analytics Cards */}
      <div className="p-4"
        <Card className="p-4"
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Total Tenants</CardTitle>
            <Building className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {tenantsData?.total || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="p-4"
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Total Usuários</CardTitle>
            <Users className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {analyticsData?.totalUsers || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="p-4"
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Total Tickets</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {analyticsData?.totalTickets || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="p-4"
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {analyticsData?.activeUsers || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Tenants and Users Tables */}
      <div className="p-4"
        {/* Tenants Table */}
        <Card>
          <CardHeader>
            <CardTitle className="p-4"
              <Building className="w-5 h-5 mr-2" />
              Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTenants ? (
              <div className="p-4"
                <div className="text-lg">"</div>
              </div>
            ) : (
              <div className="p-4"
                {tenantsData?.tenants?.map((tenant: any) => (
                  <div key={tenant.id} className="p-4"
                    <div className="p-4"
                      <h3 className="text-lg">"{tenant.name}</h3>
                      <Badge className="text-lg">"Ativo</Badge>
                    </div>
                    <div className="p-4"
                      <div className="p-4"
                        <span className="text-lg">"Subdomínio:</span>
                        <Badge variant="outline">{tenant.subdomain}</Badge>
                      </div>
                      <div>
                        <span className="text-lg">"Criado em:</span>
                        {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="p-4"
                      <Button variant="ghost" size="sm" className="p-4"
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
        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="p-4"
              <Users className="w-5 h-5 mr-2" />
              Usuários da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersData ? (
              <div className="p-4"
                {usersData?.users?.slice(0, 5).map((user: any) => (
                  <div key={user.id} className="p-4"
                    <div className="p-4"
                      <h3 className="p-4"
                        {user.firstName} {user.lastName}
                      </h3>
                      <Badge 
                        variant={user.role === 'saas_admin' ? 'default' : 'secondary'}
                        className={user.role === 'saas_admin' ? 'bg-red-100 text-red-700' : ''}
                      >
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="p-4"
                      <div>{user.email}</div>
                      <div>
                        <span className="text-lg">"Status:</span>
                        <Badge className={user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {user.lastLoginAt && (
                        <div>
                          <span className="text-lg">"Último login:</span>
                          {new Date(user.lastLoginAt).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="p-4"
                  <Button variant="outline" size="sm" className="p-4"
                    Ver todos os usuários
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4"
                <div className="text-lg">"</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}