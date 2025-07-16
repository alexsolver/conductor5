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

const createTenantSchema = z.object({
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
        title: "Erro ao criar tenant",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: z.infer<typeof createTenantSchema>) => {
    createTenantMutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Administração SaaS
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie tenants, usuários e configurações da plataforma
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Tenant</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createTenantMutation.isPending}>
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
            <div className="text-2xl font-bold text-white">
              {tenantsData?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Usuários</CardTitle>
            <Users className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analyticsData?.totalUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Tickets</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analyticsData?.totalTickets || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analyticsData?.activeUsers || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Tenants
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTenants ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Subdomínio</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantsData?.tenants?.map((tenant: any) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tenant.subdomain}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700">Ativo</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
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