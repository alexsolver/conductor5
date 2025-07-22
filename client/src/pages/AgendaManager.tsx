import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Users,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Types
interface Schedule {
  id: string;
  tenantId: string;
  agentId: string;
  customerId?: string;
  activityTypeId: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  duration: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  locationAddress?: string;
  coordinates?: { lat: number; lng: number };
  internalNotes?: string;
  clientNotes?: string;
  agent?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  activityType?: {
    id: string;
    name: string;
    color: string;
    category: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ActivityType {
  id: string;
  name: string;
  description?: string;
  color: string;
  duration: number;
  category: 'visita_tecnica' | 'instalacao' | 'manutencao' | 'suporte';
  isActive: boolean;
}

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
}

// Form Schema
const scheduleSchema = z.object({
  agentId: z.string().min(1, 'Agente é obrigatório'),
  customerId: z.string().optional(),
  activityTypeId: z.string().min(1, 'Tipo de atividade é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  startDateTime: z.string().min(1, 'Data e hora são obrigatórias'),
  duration: z.number().min(15, 'Duração mínima de 15 minutos'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  locationAddress: z.string().optional(),
  internalNotes: z.string().optional(),
  clientNotes: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

// Activity type colors mapping
const getActivityTypeColor = (color: string) => {
  const colorMap: Record<string, string> = {
    '#3B82F6': 'bg-blue-500',
    '#10B981': 'bg-green-500',
    '#F59E0B': 'bg-yellow-500',
    '#EF4444': 'bg-red-500',
    '#8B5CF6': 'bg-purple-500',
    '#06B6D4': 'bg-cyan-500',
  };
  return colorMap[color] || 'bg-gray-500';
};

// Status badge styles
const getStatusBadge = (status: string) => {
  const statusMap = {
    scheduled: { label: 'Agendado', variant: 'default' as const },
    in_progress: { label: 'Em Andamento', variant: 'secondary' as const },
    completed: { label: 'Concluído', variant: 'success' as const },
    cancelled: { label: 'Cancelado', variant: 'destructive' as const },
  };
  return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'default' as const };
};

const getPriorityBadge = (priority: string) => {
  const priorityMap = {
    low: { label: 'Baixa', variant: 'outline' as const },
    medium: { label: 'Média', variant: 'secondary' as const },
    high: { label: 'Alta', variant: 'default' as const },
    urgent: { label: 'Urgente', variant: 'destructive' as const },
  };
  return priorityMap[priority as keyof typeof priorityMap] || { label: priority, variant: 'default' as const };
};

export default function AgendaManager() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  // Queries
  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ['/api/schedule/schedules', weekStart.toISOString(), weekEnd.toISOString()],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/schedule/schedules?startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`);
      return response;
    },
  });

  const { data: activityTypesData } = useQuery({
    queryKey: ['/api/schedule/activity-types'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/schedule/activity-types');
      return response;
    },
  });

  const { data: agentsData } = useQuery({
    queryKey: ['/api/users', { role: 'agent' }],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users?role=agent');
      return response;
    },
  });

  // Mutations
  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      return await apiRequest('POST', '/api/schedule/schedules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule/schedules'] });
      setIsCreateModalOpen(false);
      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar agendamento",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ScheduleFormData> }) => {
      return await apiRequest('PUT', `/api/schedule/schedules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule/schedules'] });
      setIsEditModalOpen(false);
      setSelectedSchedule(null);
      toast({
        title: "Agendamento atualizado",
        description: "O agendamento foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar agendamento",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/schedule/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule/schedules'] });
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir agendamento",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      agentId: '',
      activityTypeId: '',
      title: '',
      description: '',
      startDateTime: '',
      duration: 60,
      priority: 'medium',
      locationAddress: '',
      internalNotes: '',
      clientNotes: '',
    },
  });

  // Helper functions
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const getDaysOfWeek = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  };

  const getSchedulesForDate = (date: Date) => {
    if (!schedulesData?.schedules) return [];
    return schedulesData.schedules.filter((schedule: Schedule) => 
      isSameDay(parseISO(schedule.startDateTime), date)
    );
  };

  const getAgentsWithSchedules = () => {
    if (!agentsData?.users || !schedulesData?.schedules) return [];
    
    return agentsData.users.map((agent: Agent) => {
      const agentSchedules = schedulesData.schedules.filter((s: Schedule) => s.agentId === agent.id);
      return {
        ...agent,
        schedules: agentSchedules,
      };
    });
  };

  const onSubmit = (data: ScheduleFormData) => {
    if (selectedSchedule) {
      updateScheduleMutation.mutate({ id: selectedSchedule.id, data });
    } else {
      createScheduleMutation.mutate(data);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    form.reset({
      agentId: schedule.agentId,
      customerId: schedule.customerId || '',
      activityTypeId: schedule.activityTypeId,
      title: schedule.title,
      description: schedule.description || '',
      startDateTime: format(parseISO(schedule.startDateTime), "yyyy-MM-dd'T'HH:mm"),
      duration: schedule.duration,
      priority: schedule.priority,
      locationAddress: schedule.locationAddress || '',
      internalNotes: schedule.internalNotes || '',
      clientNotes: schedule.clientNotes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      deleteScheduleMutation.mutate(id);
    }
  };

  const schedules = schedulesData?.schedules || [];
  const activityTypes = activityTypesData?.activityTypes || [];
  const agents = agentsData?.users || [];
  const agentsWithSchedules = getAgentsWithSchedules();

  if (schedulesLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando agenda...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Agenda de Campo</h1>
          <p className="text-gray-600">
            {format(weekStart, 'd MMM', { locale: ptBR })} - {format(weekEnd, 'd MMM yyyy', { locale: ptBR })}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentWeek(new Date())}>
            Hoje
          </Button>
          <Button variant="outline" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Agendamento</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="agentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agente</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um agente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {agents.map((agent: Agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {agent.firstName} {agent.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="activityTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Atividade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {activityTypes.map((type: ActivityType) => (
                                <SelectItem key={type.id} value={type.id}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className={cn("w-3 h-3 rounded-full", getActivityTypeColor(type.color))}
                                    />
                                    {type.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Título do agendamento" {...field} />
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
                          <Textarea 
                            placeholder="Descrição detalhada da atividade"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="startDateTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data e Hora</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duração (min)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min={15}
                              step={15}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                              <SelectItem value="urgent">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="locationAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Endereço completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="internalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Internas</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações para uso interno"
                            className="resize-none"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createScheduleMutation.isPending}>
                      {createScheduleMutation.isPending ? 'Criando...' : 'Criar Agendamento'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {/* Header with days */}
        <div className="grid grid-cols-8 bg-gray-50 border-b">
          <div className="p-4 font-medium border-r">Agentes</div>
          {getDaysOfWeek().map((day) => (
            <div key={day.toISOString()} className="p-4 text-center border-r last:border-r-0">
              <div className="font-medium">{format(day, 'EEE', { locale: ptBR })}</div>
              <div className="text-sm text-gray-600">{format(day, 'd')}</div>
            </div>
          ))}
        </div>

        {/* Agent rows */}
        {agentsWithSchedules.map((agent) => (
          <div key={agent.id} className="grid grid-cols-8 border-b last:border-b-0">
            {/* Agent info */}
            <div className="p-4 border-r bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                  {agent.firstName[0]}{agent.lastName[0]}
                </div>
                <div>
                  <div className="font-medium text-sm">{agent.firstName} {agent.lastName}</div>
                  <div className="text-xs text-gray-600">{agent.email}</div>
                </div>
              </div>
            </div>

            {/* Schedule cells for each day */}
            {getDaysOfWeek().map((day) => {
              const daySchedules = getSchedulesForDate(day).filter(s => s.agentId === agent.id);
              
              return (
                <div key={day.toISOString()} className="p-2 border-r last:border-r-0 min-h-[120px]">
                  <div className="space-y-1">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className={cn(
                          "p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity",
                          schedule.activityType ? getActivityTypeColor(schedule.activityType.color) : 'bg-gray-500',
                          "text-white"
                        )}
                        onClick={() => handleEdit(schedule)}
                      >
                        <div className="font-medium truncate">{schedule.title}</div>
                        <div className="flex items-center gap-1 text-xs opacity-90">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(schedule.startDateTime), 'HH:mm')}
                        </div>
                        {schedule.locationAddress && (
                          <div className="flex items-center gap-1 text-xs opacity-90">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{schedule.locationAddress}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4">
              {/* Schedule details */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{selectedSchedule.title}</h3>
                  <p className="text-sm text-gray-600">{selectedSchedule.description}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getStatusBadge(selectedSchedule.status).variant}>
                    {getStatusBadge(selectedSchedule.status).label}
                  </Badge>
                  <Badge variant={getPriorityBadge(selectedSchedule.priority).variant}>
                    {getPriorityBadge(selectedSchedule.priority).label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium">Agente:</label>
                  <p>{selectedSchedule.agent?.firstName} {selectedSchedule.agent?.lastName}</p>
                </div>
                <div>
                  <label className="font-medium">Data/Hora:</label>
                  <p>{format(parseISO(selectedSchedule.startDateTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                </div>
                <div>
                  <label className="font-medium">Duração:</label>
                  <p>{selectedSchedule.duration} minutos</p>
                </div>
                <div>
                  <label className="font-medium">Tipo:</label>
                  <p>{selectedSchedule.activityType?.name}</p>
                </div>
              </div>

              {selectedSchedule.locationAddress && (
                <div>
                  <label className="font-medium text-sm">Endereço:</label>
                  <p className="text-sm">{selectedSchedule.locationAddress}</p>
                </div>
              )}

              {selectedSchedule.internalNotes && (
                <div>
                  <label className="font-medium text-sm">Observações Internas:</label>
                  <p className="text-sm">{selectedSchedule.internalNotes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Fechar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleEdit(selectedSchedule)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleDelete(selectedSchedule.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}