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
import AgentList from '@/components/schedule/AgentList';
import ScheduleModal from '@/components/schedule/ScheduleModal';

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
  const [view] = useState<'day' | 'week' | 'month'>('week');
  const [selectedAgentId, setSelectedAgentId] = useState<string>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>();
  const [newScheduleDefaults, setNewScheduleDefaults] = useState<{
    date?: Date;
    time?: string;
    agentId?: string;
  }>({});

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

  // Mock agents data (since we don't have a user management module yet)
  const mockAgents = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Carlos Silva',
      email: 'carlos@conductor.com',
      profileImageUrl: undefined,
    },
    {
      id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      name: 'Ana Santos',
      email: 'ana@conductor.com',
      profileImageUrl: undefined,
    },
    {
      id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
      name: 'Roberto Lima',
      email: 'roberto@conductor.com',
      profileImageUrl: undefined,
    },
  ];

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

  if (isLoadingActivityTypes || isLoadingSchedules || isLoadingCustomers) {
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
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button size="sm" onClick={handleNewSchedule}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="font-medium">
            {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Layout - Always Grid View */}
      <div className="mb-6">
        <WeeklyScheduleGrid
          schedules={schedules}
          activityTypes={activityTypes}
          agents={mockAgents}
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
        agents={mockAgents}
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