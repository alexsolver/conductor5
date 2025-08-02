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
import TechnicianTimeline from '@/components/schedule/TechnicianTimeline';
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
  const [selectedGroup, setSelectedGroup] = useState<string>('todos');
  const [selectedAgents, setSelectedAgents] = useState<string>('todos');
  const [taskTitleFilter, setTaskTitleFilter] = useState<string>('');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Calculate date range based on view
  const getDateRange = () => {
    if (view === 'agenda') {
      // For agenda view, show 14 days (2 weeks)
      const start = startOfWeek(selectedDate, { locale: ptBR });
      const end = addWeeks(endOfWeek(selectedDate, { locale: ptBR }), 1); // Add one more week
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
  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ['/api/schedule/schedules', startDate, endDate],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/schedule/schedules/${startDate}/${endDate}`);
      return await response.json();
    },
    enabled: !!startDate && !!endDate,
  });
  
  const schedules = Array.isArray(schedulesData) ? schedulesData : [];

  const { data: activityTypesData, isLoading: activityTypesLoading } = useQuery({
    queryKey: ['/api/schedule/activity-types'],
    queryFn: () => apiRequest('GET', '/api/schedule/activity-types'),
  });
  
  const activityTypes = (activityTypesData as any)?.activityTypes || [];

  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/user-management/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user-management/users');
      return await response.json();
    },
  });
  
  const agents = (agentsData as any)?.users || [];

  // Buscar empresas clientes (não pessoas físicas)
  const { data: companiesData } = useQuery({
    queryKey: ['/api/customers/companies'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/customers/companies');
      return await response.json();
    },
  });
  
  const companies = Array.isArray(companiesData) ? companiesData : [];

  // Buscar grupos de usuários do módulo de gestão de equipes
  const { data: groupsData } = useQuery({
    queryKey: ['/api/user-management/groups'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user-management/groups');
      return await response.json();
    },
  });
  
  const groups = (groupsData as any)?.groups || [];

  // Buscar membros do grupo selecionado
  const { data: groupMembersData } = useQuery({
    queryKey: ['/api/user-management/groups', selectedGroup, 'members'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/user-management/groups/${selectedGroup}/members`);
      return await response.json();
    },
    enabled: selectedGroup !== 'todos' && !!selectedGroup,
  });

  // Filtrar agentes com base no grupo selecionado
  const filteredAgents = React.useMemo(() => {
    if (selectedGroup === 'todos') {
      return agents;
    }
    
    if (!groupMembersData || !groupMembersData.members) {
      return [];
    }
    
    const memberUserIds = groupMembersData.members.map((member: any) => member.userId);
    return agents.filter((agent: any) => memberUserIds.includes(agent.id));
  }, [agents, selectedGroup, groupMembersData]);

  // Buscar jornadas de trabalho dos técnicos
  const { data: workSchedulesData } = useQuery({
    queryKey: ['/api/timecard/work-schedules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/work-schedules');
      return await response.json();
    },
  });

  const workSchedules = Array.isArray(workSchedulesData) ? workSchedulesData : [];

  // Obter técnicos selecionados para exibir na timeline
  const selectedTechnicians = React.useMemo(() => {
    if (selectedAgents === 'todos') {
      return filteredAgents;
    }
    return filteredAgents.filter((agent: any) => agent.id === selectedAgents);
  }, [filteredAgents, selectedAgents]);

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

  const handleModalSave = (data: Schedule) => {
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
                Agenda
              </CardTitle>
              <p className="text-gray-600 mt-1">
                {view === 'timeline' ? 'Linha do Tempo' : 'Agenda 14 Dias'} - {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Client Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as empresas</SelectItem>
                  {Array.isArray(companies) && companies.map((company) => {
                    const companyName = company.name || company.companyName || company.razaoSocial || company.id;
                    return (
                      <SelectItem key={company.id} value={company.id}>
                        {companyName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Group Filter - Grupos de membros da gestão de equipes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os grupos</SelectItem>
                  {Array.isArray(groups) && groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
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
                  {Array.isArray(filteredAgents) && filteredAgents.map((agent) => {
                    const agentName = agent.name || `${agent.firstName || agent.first_name || ''} ${agent.lastName || agent.last_name || ''}`.trim() || agent.email;
                    return (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agentName}
                      </SelectItem>
                    );
                  })}
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

            {/* Actions - removed bulk edit, generate and publish buttons */}
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
            schedules={schedules as Schedule[]}
            activityTypes={activityTypes}
            agents={selectedTechnicians}
            selectedDate={selectedDate}
            onScheduleClick={handleScheduleClick}
            onTimeSlotClick={handleTimeSlotClick}
            workSchedules={workSchedules}
          />
        ) : (
          <WeeklyScheduleGrid
            schedules={schedules as Schedule[]}
            activityTypes={activityTypes}
            agents={filteredAgents}
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
        onSave={handleModalSave}
        schedule={editingSchedule}
        defaultDate={newScheduleDefaults.date}
        defaultTime={newScheduleDefaults.time}
        defaultAgentId={newScheduleDefaults.agentId}
        activityTypes={activityTypes}
        agents={filteredAgents}
        customers={companies}
      />
    </div>
  );
};

export default AgendaManager;