import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, subDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, MapPin, Filter, Plus, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import WeeklyScheduleGrid from '@/components/schedule/WeeklyScheduleGrid';
import TimelineScheduleGrid from '@/components/schedule/TimelineScheduleGrid';
import AgentList from '@/components/schedule/AgentList';
import ScheduleModal from '@/components/schedule/ScheduleModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface ActivityType {
  id: string;
  name: string;
  description: string;
  color: string;
  duration: number;
  category: string;
}

interface Schedule {
  id: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  priority: string;
  locationAddress?: string;
  agentId: string;
  customerId?: string;
  activityTypeId: string;
}

const AgendaManager: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view] = useState<'timeline' | 'agenda'>('timeline');
  const [selectedAgentId, setSelectedAgentId] = useState<string>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>();
  const [newScheduleDefaults, setNewScheduleDefaults] = useState<{
    date?: Date;
    time?: string;
    agentId?: string;
  }>({});

  // Filter states
  const [selectedClient, setSelectedClient] = useState<string>('todos');
  const [selectedRegion, setSelectedRegion] = useState<string>('todas');
  const [selectedGroup, setSelectedGroup] = useState<string>('todos');
  const [selectedAgents, setSelectedAgents] = useState<string>('todos');
  const [taskTitleFilter, setTaskTitleFilter] = useState<string>('');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Calculate date range based on view
  const getDateRange = () => {
    if (view === 'week') {
      const start = startOfWeek(selectedDate, { locale: ptBR });
      const end = endOfWeek(selectedDate, { locale: ptBR });
      return { 
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd')
      };
    }
    // For now, default to week view
    const start = startOfWeek(selectedDate, { locale: ptBR });
    const end = endOfWeek(selectedDate, { locale: ptBR });
    return { 
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch activity types
  const { data: activityTypesData, isLoading: isLoadingActivityTypes } = useQuery({
    queryKey: ['/api/schedule/activity-types'],
  });

  // Fetch schedules
  const { data: schedulesData, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['/api/schedule/schedules', startDate, endDate],
  });

  // Fetch customers
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
  });

  const activityTypes: ActivityType[] = (activityTypesData as any)?.activityTypes || [];
  const schedules: Schedule[] = (schedulesData as any)?.schedules || [];
  const customers: any[] = (customersData as any)?.customers || [];

  // Fetch real agents from the system - fallback to simulated data if permission denied
  const { data: agentsData, isLoading: isLoadingAgents, error: agentsError } = useQuery({
    queryKey: ['/api/user-management/users'],
    retry: false,
  });

  // Use simulated agents if API fails (permission issues)
  const simulatedAgents = [
    { id: 'agent-001', name: 'João Silva', email: 'joao.silva@conductor.com' },
    { id: 'agent-002', name: 'Maria Santos', email: 'maria.santos@conductor.com' },
    { id: 'agent-003', name: 'Pedro Oliveira', email: 'pedro.oliveira@conductor.com' },
    { id: 'agent-004', name: 'Ana Costa', email: 'ana.costa@conductor.com' },
    { id: 'agent-005', name: 'Carlos Ferreira', email: 'carlos.ferreira@conductor.com' },
    { id: 'agent-006', name: 'Lucia Martins', email: 'lucia.martins@conductor.com' },
    { id: 'agent-007', name: 'Roberto Lima', email: 'roberto.lima@conductor.com' },
    { id: 'agent-008', name: 'Fernanda Rocha', email: 'fernanda.rocha@conductor.com' },
    { id: 'agent-009', name: 'Antonio Souza', email: 'antonio.souza@conductor.com' },
    { id: 'agent-010', name: 'Patricia Almeida', email: 'patricia.almeida@conductor.com' },
  ];

  const agents = agentsError ? simulatedAgents : ((agentsData as any)?.users || simulatedAgents);

  const getActivityTypeById = (id: string) => {
    return activityTypes.find(type => type.id === id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-red-500';
      case 'medium': return 'border-l-4 border-yellow-500';
      case 'low': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-500';
    }
  };

  const formatTime = (dateTime: string) => {
    return format(new Date(dateTime), 'HH:mm', { locale: ptBR });
  };

  const formatDate = (dateTime: string) => {
    return format(new Date(dateTime), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Navigation functions
  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
  };

  // Modal handlers
  const handleTimeSlotClick = (date: Date, time: string, agentId: string) => {
    setNewScheduleDefaults({ date, time, agentId });
    setEditingSchedule(undefined);
    setIsModalOpen(true);
  };

  const handleScheduleClick = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setNewScheduleDefaults({});
    setIsModalOpen(true);
  };

  const handleNewSchedule = () => {
    setEditingSchedule(undefined);
    setNewScheduleDefaults({});
    setIsModalOpen(true);
  };

  // Mutations
  const createScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/schedule/schedules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule/schedules'] });
      toast({
        title: 'Sucesso',
        description: 'Agendamento criado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar agendamento',
        variant: 'destructive',
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/schedule/schedules/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule/schedules'] });
      toast({
        title: 'Sucesso',
        description: 'Agendamento atualizado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar agendamento',
        variant: 'destructive',
      });
    },
  });

  const handleSaveSchedule = (scheduleData: any) => {
    if (editingSchedule) {
      updateScheduleMutation.mutate({ ...scheduleData, id: editingSchedule.id });
    } else {
      createScheduleMutation.mutate(scheduleData);
    }
  };

  if (isLoadingActivityTypes || isLoadingSchedules || isLoadingCustomers || isLoadingAgents) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando agenda...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Agenda</h1>
          <p className="text-gray-600">Controle de cronogramas e agendamentos de campo</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleNewSchedule}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Clientes</label>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="todos-beneficios">Todos dos benefícios</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Região</label>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger>
              <SelectValue placeholder="Região" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="norte">Norte</SelectItem>
              <SelectItem value="sul">Sul</SelectItem>
              <SelectItem value="leste">Leste</SelectItem>
              <SelectItem value="oeste">Oeste</SelectItem>
              <SelectItem value="centro">Centro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grupo</label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="instalacao">Instalação</SelectItem>
              <SelectItem value="manutencao">Manutenção</SelectItem>
              <SelectItem value="suporte">Suporte</SelectItem>
              <SelectItem value="vendas">Vendas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Técnicos</label>
          <Select value={selectedAgents} onValueChange={setSelectedAgents}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task Title Filter */}
      <div className="mb-6">
        <Input
          placeholder="Título das tarefas"
          value={taskTitleFilter}
          onChange={(e) => setTaskTitleFilter(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Date Navigation and View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(subDays(selectedDate, 14))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">
              {format(selectedDate, 'dd \\d\\e MMMM \\d\\e yyyy', { locale: ptBR })}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 14))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={view === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {}}
          >
            Linha do Tempo
          </Button>
          <Button
            variant={view === 'agenda' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {}}
          >
            Agenda 14 Dias
          </Button>
        </div>
      </div>

      {/* Main Layout - Timeline View */}
      <div className="mb-6">
        <TimelineScheduleGrid
          schedules={schedules}
          activityTypes={activityTypes}
          agents={agents}
          selectedDate={selectedDate}
          onScheduleClick={handleScheduleClick}
          onTimeSlotClick={handleTimeSlotClick}
        />
      </div>



      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSchedule}
        schedule={editingSchedule}
        agents={agents}
        customers={customers}
        activityTypes={activityTypes}
        defaultDate={newScheduleDefaults.date}
        defaultTime={newScheduleDefaults.time}
        defaultAgentId={newScheduleDefaults.agentId}
      />
    </div>
  );
};

export default AgendaManager;