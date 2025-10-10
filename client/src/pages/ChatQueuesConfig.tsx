import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Users, Settings, Clock, TrendingUp } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

const queueSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  strategy: z.enum(['fifo', 'priority', 'skill_based', 'round_robin', 'least_busy']),
  maxWaitTime: z.number().min(1, 'Tempo máximo deve ser maior que 0'),
  alertThreshold: z.number().min(1, 'Limite de alerta deve ser maior que 0'),
  escalationEnabled: z.boolean().default(false),
  escalationTime: z.number().min(1).optional(),
  autoAssign: z.boolean().default(true),
  maxConcurrentChats: z.number().min(1).default(5),
  isActive: z.boolean().default(true)
});

type QueueFormData = z.infer<typeof queueSchema>;

interface Queue {
  id: string;
  name: string;
  description?: string;
  strategy: string;
  maxWaitTime: number;
  alertThreshold: number;
  escalationEnabled: boolean;
  escalationTime?: number;
  autoAssign: boolean;
  maxConcurrentChats: number;
  isActive: boolean;
  createdAt: Date;
}

interface QueueStats {
  queueId: string;
  waitingCustomers: number;
  activeChats: number;
  availableAgents: number;
  avgWaitTime: number;
  avgResponseTime: number;
}

export default function ChatQueuesConfig() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState<Queue | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);

  const { data: queues, isLoading } = useQuery<Queue[]>({
    queryKey: ['/api/chat/queues'],
  });

  const { data: queueStats } = useQuery<QueueStats[]>({
    queryKey: ['/api/chat/queues/stats'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const form = useForm<QueueFormData>({
    resolver: zodResolver(queueSchema),
    defaultValues: {
      name: '',
      description: '',
      strategy: 'fifo',
      maxWaitTime: 300,
      alertThreshold: 180,
      escalationEnabled: false,
      escalationTime: 600,
      autoAssign: true,
      maxConcurrentChats: 5,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: QueueFormData) => apiRequest('POST', '/api/chat/queues', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/queues'] });
      toast({ title: 'Fila criada com sucesso!' });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: 'Erro ao criar fila', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: QueueFormData }) => 
      apiRequest('PUT', `/api/chat/queues/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/queues'] });
      toast({ title: 'Fila atualizada com sucesso!' });
      setEditingQueue(null);
      form.reset();
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar fila', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/chat/queues/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/queues'] });
      toast({ title: 'Fila excluída com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao excluir fila', variant: 'destructive' });
    },
  });

  const onSubmit = (data: QueueFormData) => {
    if (editingQueue) {
      updateMutation.mutate({ id: editingQueue.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (queue: Queue) => {
    setEditingQueue(queue);
    form.reset({
      name: queue.name,
      description: queue.description || '',
      strategy: queue.strategy as any,
      maxWaitTime: queue.maxWaitTime,
      alertThreshold: queue.alertThreshold,
      escalationEnabled: queue.escalationEnabled,
      escalationTime: queue.escalationTime || 600,
      autoAssign: queue.autoAssign,
      maxConcurrentChats: queue.maxConcurrentChats,
      isActive: queue.isActive,
    });
  };

  const getStrategyLabel = (strategy: string) => {
    const labels: Record<string, string> = {
      fifo: 'FIFO (Primeiro a chegar)',
      priority: 'Por Prioridade',
      skill_based: 'Por Habilidade',
      round_robin: 'Round-Robin',
      least_busy: 'Menos Ocupado',
    };
    return labels[strategy] || strategy;
  };

  const getQueueStats = (queueId: string) => {
    return queueStats?.find(s => s.queueId === queueId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando filas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Configuração de Filas de Atendimento
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie filas, estratégias de distribuição e SLA
          </p>
        </div>
        <Dialog open={isCreateOpen || !!editingQueue} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingQueue(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setIsCreateOpen(true)} 
              className="bg-gradient-to-r from-purple-600 to-blue-600"
              data-testid="button-create-queue"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Fila
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQueue ? 'Editar Fila' : 'Nova Fila de Atendimento'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Fila</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Suporte Técnico" data-testid="input-queue-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descrição da fila" rows={3} data-testid="input-queue-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estratégia de Distribuição</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-distribution-strategy">
                            <SelectValue placeholder="Selecione a estratégia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fifo">FIFO (Primeiro a chegar)</SelectItem>
                          <SelectItem value="priority">Por Prioridade</SelectItem>
                          <SelectItem value="skill_based">Por Habilidade</SelectItem>
                          <SelectItem value="round_robin">Round-Robin</SelectItem>
                          <SelectItem value="least_busy">Menos Ocupado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxWaitTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo Máximo de Espera (seg)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))} 
                            data-testid="input-max-wait-time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alertThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alerta SLA (seg)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))} 
                            data-testid="input-alert-threshold"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="escalationEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Escalação Automática</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Escalar para supervisor quando SLA excedido
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-escalation-enabled"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch('escalationEnabled') && (
                  <FormField
                    control={form.control}
                    name="escalationTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo para Escalação (seg)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))} 
                            data-testid="input-escalation-time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="autoAssign"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Auto-atribuição</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Atribuir automaticamente
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-auto-assign"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxConcurrentChats"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máx. Chats Simultâneos</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))} 
                            data-testid="input-max-concurrent"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Fila Ativa</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Fila disponível para receber clientes
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-queue"
                  >
                    {editingQueue ? 'Atualizar' : 'Criar'} Fila
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateOpen(false);
                      setEditingQueue(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-queue"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Total de Filas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-queues">{queues?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Clientes Aguardando
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-waiting-customers">
              {queueStats?.reduce((sum, s) => sum + s.waitingCustomers, 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Chats Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-chats">
              {queueStats?.reduce((sum, s) => sum + s.activeChats, 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4 text-orange-600" />
              Agentes Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-available-agents">
              {queueStats?.reduce((sum, s) => sum + s.availableAgents, 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Filas Configuradas</CardTitle>
          <CardDescription>
            Gerencie suas filas de atendimento e configurações de SLA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Estratégia</TableHead>
                <TableHead>SLA (seg)</TableHead>
                <TableHead>Aguardando</TableHead>
                <TableHead>Ativos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queues?.map((queue) => {
                const stats = getQueueStats(queue.id);
                return (
                  <TableRow key={queue.id} data-testid={`row-queue-${queue.id}`}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{queue.name}</div>
                        {queue.description && (
                          <div className="text-sm text-muted-foreground">{queue.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getStrategyLabel(queue.strategy)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Máx: {queue.maxWaitTime}s</div>
                        <div className="text-muted-foreground">Alerta: {queue.alertThreshold}s</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stats?.waitingCustomers ? 'default' : 'secondary'} data-testid={`badge-waiting-${queue.id}`}>
                        {stats?.waitingCustomers || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-active-${queue.id}`}>
                        {stats?.activeChats || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={queue.isActive ? 'default' : 'secondary'} data-testid={`badge-status-${queue.id}`}>
                        {queue.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(queue)}
                          data-testid={`button-edit-${queue.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta fila?')) {
                              deleteMutation.mutate(queue.id);
                            }
                          }}
                          data-testid={`button-delete-${queue.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!queues?.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma fila configurada. Clique em "Nova Fila" para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
