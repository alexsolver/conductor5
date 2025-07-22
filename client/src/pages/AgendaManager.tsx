import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, MapPin, Filter, Plus, AlertCircle } from 'lucide-react';

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
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  
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

  const activityTypes: ActivityType[] = activityTypesData?.activityTypes || [];
  const schedules: Schedule[] = schedulesData?.schedules || [];

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

  if (isLoadingActivityTypes || isLoadingSchedules) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando agenda...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
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
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex gap-2 mb-6">
        <Button 
          variant={view === 'day' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setView('day')}
        >
          Dia
        </Button>
        <Button 
          variant={view === 'week' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setView('week')}
        >
          Semana
        </Button>
        <Button 
          variant={view === 'month' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setView('month')}
        >
          Mês
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Agendamentos</p>
                <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tipos de Atividade</p>
                <p className="text-2xl font-bold text-gray-900">{activityTypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Em Progresso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {schedules.filter(s => s.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Alta Prioridade</p>
                <p className="text-2xl font-bold text-gray-900">
                  {schedules.filter(s => s.priority === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Types */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Tipos de Atividade Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activityTypes.map((type) => (
              <div key={type.id} className="flex items-center p-3 border rounded-lg">
                <div 
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: type.color }}
                />
                <div>
                  <p className="font-medium">{type.name}</p>
                  <p className="text-sm text-gray-600">{type.duration}min - {type.category}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Agendamentos ({startDate} a {endDate})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhum agendamento encontrado para este período</p>
              <p className="text-sm text-gray-500 mt-2">
                Clique em "Novo Agendamento" para criar um
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => {
                const activityType = getActivityTypeById(schedule.activityTypeId);
                return (
                  <div key={schedule.id} className={`p-4 border rounded-lg ${getPriorityColor(schedule.priority)}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{schedule.title}</h3>
                          <Badge className={getStatusColor(schedule.status)}>
                            {schedule.status === 'scheduled' ? 'Agendado' :
                             schedule.status === 'in_progress' ? 'Em Progresso' :
                             schedule.status === 'completed' ? 'Concluído' : 'Cancelado'}
                          </Badge>
                          <Badge variant="outline">
                            {schedule.priority === 'high' ? 'Alta' :
                             schedule.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                          </Badge>
                        </div>
                        
                        {schedule.description && (
                          <p className="text-gray-600 mb-2">{schedule.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(schedule.startDateTime)} às {formatTime(schedule.startDateTime)} - {formatTime(schedule.endDateTime)}
                          </div>
                          
                          {activityType && (
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-1"
                                style={{ backgroundColor: activityType.color }}
                              />
                              {activityType.name}
                            </div>
                          )}
                          
                          {schedule.locationAddress && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {schedule.locationAddress}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button variant="outline" size="sm">
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendaManager;