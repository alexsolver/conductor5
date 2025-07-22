import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, MapPin, Filter, Plus, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import TimelineScheduleGrid from '@/components/schedule/TimelineScheduleGrid';
import WeeklyScheduleGrid from '@/components/schedule/WeeklyScheduleGrid';
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
  type: 'planned' | 'actual';
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tenantId: string;
  customerId?: string;
  activityTypeId: string;
}

const AgendaManager: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 6, 22)); // 22 de julho de 2025
  const [view, setView] = useState<'timeline' | 'agenda'>('timeline');
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
    } else {
      // For timeline view, show current week
      const start = startOfWeek(selectedDate, { locale: ptBR });
      const end = endOfWeek(selectedDate, { locale: ptBR });
      return { 
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd')
      };
    }
  };

  const { startDate, endDate } = getDateRange();

  // Data queries
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['/api/schedule/schedules', startDate, endDate],
    queryFn: () => apiRequest('GET', `/api/schedule/schedules/${startDate}/${endDate}`),
    enabled: !!startDate && !!endDate,
  });

  const { data: activityTypes = [], isLoading: activityTypesLoading } = useQuery({
    queryKey: ['/api/schedule/activity-types'],
    queryFn: () => apiRequest('GET', '/api/schedule/activity-types'),
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/user-management/users'],
    queryFn: () => apiRequest('GET', '/api/user-management/users'),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: () => apiRequest('GET', '/api/customers'),
  });

  // Navigation functions
  const navigatePrevious = () => {
    if (view === 'agenda') {
      setSelectedDate(prevDate => subWeeks(prevDate, 2)); // 14 dias = 2 semanas
    } else {
      setSelectedDate(prevDate => subWeeks(prevDate, 1));
    }
  };

  const navigateNext = () => {
    if (view === 'agenda') {
      setSelectedDate(prevDate => addWeeks(prevDate, 2)); // 14 dias = 2 semanas
    } else {
      setSelectedDate(prevDate => addWeeks(prevDate, 1));
    }
  };

  // Schedule handlers
  const handleScheduleClick = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleTimeSlotClick = (date: Date, time: string, agentId: string) => {
    setNewScheduleDefaults({ date, time, agentId });
    setEditingSchedule(undefined);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSchedule(undefined);
    setNewScheduleDefaults({});
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/schedule/schedules'] });
    handleModalClose();
    toast({
      title: editingSchedule ? 'Agendamento Atualizado' : 'Agendamento Criado',
      description: 'As alterações foram salvas com sucesso.',
    });
  };

  const isLoading = schedulesLoading || activityTypesLoading || agentsLoading;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Gestão de Agenda
              </CardTitle>
              <p className="text-gray-600 mt-1">
                {view === 'timeline' ? 'Linha do Tempo' : 'Agenda 14 Dias'} - {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Client Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os clientes</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Região</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as regiões</SelectItem>
                  <SelectItem value="norte">Norte</SelectItem>
                  <SelectItem value="sul">Sul</SelectItem>
                  <SelectItem value="leste">Leste</SelectItem>
                  <SelectItem value="oeste">Oeste</SelectItem>
                  <SelectItem value="centro">Centro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os grupos</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Agents Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Técnicos</label>
              <Select value={selectedAgents} onValueChange={setSelectedAgents}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os técnicos</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Task Title Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título da Tarefa</label>
              <Input
                type="text"
                placeholder="Buscar por título..."
                value={taskTitleFilter}
                onChange={(e) => setTaskTitleFilter(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 items-end">
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Bulk edit
              </Button>
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Generate
              </Button>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Publish
              </Button>
            </div>
          </div>

          {/* Date Navigation and View Toggles */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={navigatePrevious}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="mx-4 text-sm font-medium">
                {view === 'agenda' 
                  ? `${format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(addDays(selectedDate, 13), 'dd/MM/yyyy', { locale: ptBR })}`
                  : format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                }
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={navigateNext}
                className="flex items-center gap-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={view === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('timeline')}
              >
                Linha do Tempo
              </Button>
              <Button
                variant={view === 'agenda' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('agenda')}
              >
                Agenda 14 Dias
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Layout */}
      <div className="mb-6">
        {view === 'timeline' ? (
          <TimelineScheduleGrid
            schedules={schedules}
            activityTypes={activityTypes}
            agents={agents}
            selectedDate={selectedDate}
            onScheduleClick={handleScheduleClick}
            onTimeSlotClick={handleTimeSlotClick}
          />
        ) : (
          <WeeklyScheduleGrid
            schedules={schedules}
            activityTypes={activityTypes}
            agents={agents}
            startDate={selectedDate}
            onScheduleClick={handleScheduleClick}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )}
      </div>

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        schedule={editingSchedule}
        defaultDate={newScheduleDefaults.date}
        defaultTime={newScheduleDefaults.time}
        defaultAgentId={newScheduleDefaults.agentId}
        activityTypes={activityTypes}
        agents={agents}
        customers={customers}
      />
    </div>
  );
};

export default AgendaManager;