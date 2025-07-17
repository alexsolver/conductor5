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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Target, Clock, AlertTriangle, CheckCircle, TrendingUp, Settings } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const slaSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  priority: z.enum(['baixa', 'media', 'alta', 'critica', 'urgente']),
  responseTime: z.number().min(1, "Tempo de resposta é obrigatório"),
  resolutionTime: z.number().min(1, "Tempo de resolução é obrigatório"),
  timeUnit: z.enum(['minutes', 'hours', 'days']).default('hours'),
  category: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().default(true)
});

export default function TenantAdminSLAs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateSLADialogOpen, setIsCreateSLADialogOpen] = useState(false);

  // Verificar se usuário é tenant admin ou superior
  if (!user || !['tenant_admin', 'saas_admin'].includes(user.role)) {
    return (
      <div className="p-8 text-center">
        <Target className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Acesso Negado
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Esta página é restrita para administradores de tenant.
        </p>
      </div>
    );
  }

  // Query para SLAs do tenant
  const { data: slasData, isLoading: isLoadingSLAs } = useQuery({
    queryKey: ['/api/tenant-admin/slas'],
    staleTime: 5 * 60 * 1000,
  });

  // Query para métricas de SLA
  const { data: slaMetrics } = useQuery({
    queryKey: ['/api/tenant-admin/sla-metrics'],
    staleTime: 2 * 60 * 1000,
  });

  // Form para criar SLA
  const slaForm = useForm({
    resolver: zodResolver(slaSchema),
    defaultValues: {
      name: "",
      priority: "media",
      responseTime: 4,
      resolutionTime: 24,
      timeUnit: "hours",
      category: "",
      description: "",
      active: true
    }
  });

  // Mutation para criar SLA
  const createSLAMutation = useMutation({
    mutationFn: (data: z.infer<typeof slaSchema>) => 
      apiRequest('/api/tenant-admin/slas', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/slas'] });
      setIsCreateSLADialogOpen(false);
      slaForm.reset();
      toast({
        title: "SLA criado com sucesso",
        description: "O novo SLA foi configurado para o tenant.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar SLA",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  });

  const slas = slasData?.slas || [];
  const metrics = slaMetrics || {
    totalSLAs: 0,
    activeSLAs: 0,
    averageCompliance: 0,
    criticalBreaches: 0
  };

  const onSubmitSLA = (data: z.infer<typeof slaSchema>) => {
    createSLAMutation.mutate(data);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'bg-green-100 text-green-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'alta': return 'bg-orange-100 text-orange-800';
      case 'critica': return 'bg-red-100 text-red-800';
      case 'urgente': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gestão de SLAs
            </h1>
            <p className="text-gray-600 mt-2">
              Configurar e monitorar Acordos de Nível de Serviço
            </p>
          </div>
          <Dialog open={isCreateSLADialogOpen} onOpenChange={setIsCreateSLADialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo SLA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo SLA</DialogTitle>
              </DialogHeader>
              <Form {...slaForm}>
                <form onSubmit={slaForm.handleSubmit(onSubmitSLA)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={slaForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do SLA</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Suporte Crítico" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={slaForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a prioridade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="baixa">Baixa</SelectItem>
                              <SelectItem value="media">Média</SelectItem>
                              <SelectItem value="alta">Alta</SelectItem>
                              <SelectItem value="critica">Crítica</SelectItem>
                              <SelectItem value="urgente">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={slaForm.control}
                      name="responseTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tempo de Resposta</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="4" 
                              {...field} 
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={slaForm.control}
                      name="resolutionTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tempo de Resolução</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="24" 
                              {...field} 
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={slaForm.control}
                      name="timeUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="minutes">Minutos</SelectItem>
                              <SelectItem value="hours">Horas</SelectItem>
                              <SelectItem value="days">Dias</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={slaForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Hardware, Software, Rede" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={slaForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Descreva os critérios do SLA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateSLADialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createSLAMutation.isPending}>
                      {createSLAMutation.isPending ? "Criando..." : "Criar SLA"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Métricas de SLA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de SLAs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSLAs}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeSLAs} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conformidade Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageCompliance}%</div>
            <Progress value={metrics.averageCompliance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Violações Críticas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.criticalBreaches}</div>
            <p className="text-xs text-muted-foreground">
              Últimas 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">
              Tempo de resposta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de SLAs */}
      <Card>
        <CardHeader>
          <CardTitle>SLAs Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSLAs ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Tempo Resposta</TableHead>
                  <TableHead>Tempo Resolução</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      <div className="py-8">
                        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">Nenhum SLA configurado</p>
                        <p className="text-sm text-gray-400">
                          Crie seu primeiro SLA para começar o monitoramento
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  slas.map((sla: any) => (
                    <TableRow key={sla.id}>
                      <TableCell className="font-medium">{sla.name}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(sla.priority)}>
                          {sla.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{sla.responseTime} {sla.timeUnit}</TableCell>
                      <TableCell>{sla.resolutionTime} {sla.timeUnit}</TableCell>
                      <TableCell>{sla.category || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={sla.active ? "default" : "secondary"}>
                          {sla.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}