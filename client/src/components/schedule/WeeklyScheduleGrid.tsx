import React, { useState } from 'react';
import { format, addDays, addHours, addMinutes, startOfDay, parseISO, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import SimpleAvatar from '@/components/ui/avatar';

interface Schedule {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  priority: string;
  status: string;
  type: 'planned' | 'actual';
  agentId: string;
  activityTypeId: string;
  customerId?: string;
}

interface ActivityType {
  id: string;
  name: string;
  color: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
}

interface WeeklyScheduleGridProps {
  schedules: Schedule[];
  activityTypes: ActivityType[];
  agents: Agent[];
  startDate: Date;
  onScheduleClick: (schedule: Schedule) => void;
  onTimeSlotClick: (date: Date, time: string, agentId: string) => void;
}

const WeeklyScheduleGrid: React.FC<WeeklyScheduleGridProps> = ({
  schedules,
  activityTypes,
  agents,
  startDate,
  onScheduleClick,
  onTimeSlotClick,
}) => {
  const [searchAgent, setSearchAgent] = useState('');
  const [timeFilter, setTimeFilter] = useState<'hoje' | '2min' | '10min' | '30min' | '1hora' | '24horas'>('hoje');

  // Generate 14 days starting from selected date
  const days = Array.from({ length: 14 }, (_, i) => addDays(startDate, i));

  // Generate time slots based on selected filter
  const getTimeSlots = () => {
    switch (timeFilter) {
      case '2min':
        return Array.from({ length: 24 }, (_, i) => {
          const hour = Math.floor(i / 12) + 6; // Start from 6:00
          const minute = (i % 12) * 5; // 5-minute intervals
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        });
      
      case '10min':
        return Array.from({ length: 60 }, (_, i) => {
          const hour = Math.floor(i / 6) + 6; // Start from 6:00
          const minute = (i % 6) * 10; // 10-minute intervals
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        });
      
      case '30min':
        return Array.from({ length: 36 }, (_, i) => {
          const hour = Math.floor(i / 2) + 6; // Start from 6:00
          const minute = (i % 2) * 30; // 30-minute intervals
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        });
      
      case '1hora':
        return Array.from({ length: 18 }, (_, i) => {
          const hour = i + 6; // Start from 6:00 to 23:00
          return `${hour.toString().padStart(2, '0')}:00`;
        });
      
      case '24horas':
        return ['06:00', '12:00', '18:00', '24:00']; // 4 key times
      
      default: // 'hoje'
        return Array.from({ length: 18 }, (_, i) => {
          const hour = i + 6; // From 6:00 to 23:00
          return `${hour.toString().padStart(2, '0')}:00`;
        });
    }
  };

  const timeSlots = getTimeSlots();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-green-500';
      case 'low': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  // Filter agents by search - fixed to handle firstName/lastName structure
  const filteredAgents = agents.filter(agent => {
    if (!agent || !agent.email) return false;
    
    const agentName = agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email;
    
    return agentName.toLowerCase().includes(searchAgent.toLowerCase()) ||
           agent.email.toLowerCase().includes(searchAgent.toLowerCase());
  });

  const getActivityType = (activityTypeId: string) => {
    return activityTypes.find(type => type.id === activityTypeId);
  };

  const getSchedulesForDayAndTime = (agentId: string, day: Date, timeSlot: string, type: 'planned' | 'actual') => {
    return schedules.filter(schedule => {
      if (!schedule.agentId || !schedule.type || !schedule.startDateTime) return false;
      
      const scheduleStart = parseISO(schedule.startDateTime);
      const scheduleHour = scheduleStart.getHours();
      const scheduleMinute = scheduleStart.getMinutes();
      const timeSlotTime = timeSlot.split(':');
      const timeSlotHour = parseInt(timeSlotTime[0]);
      const timeSlotMinute = parseInt(timeSlotTime[1]);
      
      // Match agent ID (handle both UUID formats)
      const agentMatch = schedule.agentId === agentId || 
                        schedule.agentId.startsWith(agentId.substring(0, 8));
      
      // Check if schedule is on the same day
      const dayMatch = scheduleStart.getDate() === day.getDate() &&
                      scheduleStart.getMonth() === day.getMonth() &&
                      scheduleStart.getFullYear() === day.getFullYear();
      
      // Check if schedule time overlaps with time slot
      const timeMatch = scheduleHour === timeSlotHour && Math.abs(scheduleMinute - timeSlotMinute) < 30;
      
      return agentMatch && schedule.type === type && dayMatch && timeMatch;
    });
  };

  return (
    <div className="flex h-full bg-white">
      {/* Left sidebar with agents list */}
      <div className="w-80 bg-gray-50 p-4 border-r overflow-y-auto">
        {/* Search Agent */}
        <div className="mb-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar técnico..."
              value={searchAgent}
              onChange={(e) => setSearchAgent(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
        </div>

        {/* Filtered Agents List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Técnicos ({filteredAgents.length})</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredAgents.map((agent) => {
              const agentName = agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email;
              return (
                <div
                  key={agent.id}
                  className="p-2 text-sm bg-gray-50 rounded border flex items-center gap-2"
                >
                  <SimpleAvatar 
                    src={agent.profileImageUrl} 
                    name={agentName} 
                    size="sm" 
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{agentName}</div>
                    <div className="text-xs text-gray-500">{agent.email}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main timeline grid - horizontal continuous layout */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Header with date range and hours */}
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
            {/* Date range header */}
            <div className="flex bg-gray-100 border-b">
              <div className="w-48 p-2 border-r border-gray-200 bg-gray-50 font-medium text-sm text-center">
                {format(days[0], 'dd', { locale: ptBR })} - {format(days[days.length - 1], 'dd \'de\' MMM \'de\' yyyy', { locale: ptBR })}
              </div>
              {/* Day headers */}
              {days.map((day) => (
                <div key={day.toISOString()} className="flex">
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div key={hour} className="w-4 border-r border-gray-100 text-center">
                      {hour === 12 && (
                        <div className="text-xs text-gray-600 bg-gray-200 px-1">
                          {format(day, 'eee. dd/MM', { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            {/* Hour numbers header */}
            <div className="flex bg-gray-50">
              <div className="w-48 p-1 border-r border-gray-200 text-xs text-center text-gray-500">
                Linha do Tempo
              </div>
              {days.map((day) => (
                <div key={day.toISOString()} className="flex">
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div key={hour} className="w-4 border-r border-gray-100 text-xs text-center text-gray-500">
                      {hour % 6 === 0 ? hour.toString().padStart(2, '0') : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Agents rows */}
          <div className="divide-y divide-gray-200">
            {filteredAgents.map((agent) => {
              const agentName = agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email;
              
              return (
                <div key={agent.id} className="border-b">
                  {/* Planned row */}
                  <div className="flex items-center">
                    <div className="w-48 p-2 border-r border-gray-200 bg-white flex items-center gap-2">
                      <SimpleAvatar 
                        src={agent.profileImageUrl} 
                        name={agentName} 
                        size="sm" 
                      />
                      <div>
                        <div className="text-xs font-medium text-gray-900">{agentName}</div>
                        <div className="text-xs text-green-600">Previsto</div>
                      </div>
                    </div>
                    {/* Timeline cells for each hour of each day */}
                    <div className="flex">
                      {days.map((day) => (
                        <div key={day.toISOString()} className="flex">
                          {Array.from({ length: 24 }, (_, hour) => {
                            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                            const plannedSchedules = getSchedulesForDayAndTime(agent.id, day, timeSlot, 'planned');
                            
                            return (
                              <div
                                key={hour}
                                className="w-4 h-8 border-r border-gray-100 relative cursor-pointer hover:bg-gray-50 bg-white"
                                onClick={() => onTimeSlotClick(day, timeSlot, agent.id)}
                              >
                                {plannedSchedules.map((schedule) => {
                                  const activityType = getActivityType(schedule.activityTypeId);
                                  return (
                                    <div
                                      key={schedule.id}
                                      className={`absolute inset-0 cursor-pointer ${getPriorityColor(schedule.priority)}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onScheduleClick(schedule);
                                      }}
                                      title={`${schedule.title} - ${activityType?.name || 'N/A'}`}
                                    />
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Actual row */}
                  <div className="flex items-center">
                    <div className="w-48 p-2 border-r border-gray-200 bg-gray-50 flex items-center gap-2">
                      <SimpleAvatar 
                        src={agent.profileImageUrl} 
                        name={agentName} 
                        size="sm" 
                      />
                      <div>
                        <div className="text-xs font-medium text-gray-700">{agentName}</div>
                        <div className="text-xs text-blue-600">Realizado</div>
                      </div>
                    </div>
                    {/* Timeline cells for each hour of each day */}
                    <div className="flex">
                      {days.map((day) => (
                        <div key={day.toISOString()} className="flex">
                          {Array.from({ length: 24 }, (_, hour) => {
                            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                            const actualSchedules = getSchedulesForDayAndTime(agent.id, day, timeSlot, 'actual');
                            
                            return (
                              <div
                                key={hour}
                                className="w-4 h-8 bg-gray-50 border-r border-gray-100 relative cursor-pointer hover:bg-gray-100"
                                onClick={() => onTimeSlotClick(day, timeSlot, agent.id)}
                              >
                                {actualSchedules.map((schedule) => {
                                  const activityType = getActivityType(schedule.activityTypeId);
                                  return (
                                    <div
                                      key={schedule.id}
                                      className={`absolute inset-0 cursor-pointer ${getPriorityColor(schedule.priority)}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onScheduleClick(schedule);
                                      }}
                                      title={`${schedule.title} - ${activityType?.name || 'N/A'}`}
                                    />
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduleGrid;