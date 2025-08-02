import React, { useState } from 'react';
import { format, addDays, addHours, addMinutes, startOfDay, parseISO, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar - Time Filters and Agent Search */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-4">
        {/* Time Filter Buttons */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Filtro de Tempo</h3>
          <div className="grid grid-cols-2 gap-2">
            {(['hoje', '2min', '10min', '30min', '1hora', '24horas'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-2 text-xs rounded-md font-medium transition-colors ${
                  timeFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter === 'hoje' ? 'Hoje' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Agent Search */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Buscar Técnicos</h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar técnico..."
              value={searchAgent}
              onChange={(e) => setSearchAgent(e.target.value)}
              className="pl-9 text-sm"
            />
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
                  className="p-2 text-sm bg-gray-50 rounded border"
                >
                  <div className="font-medium text-gray-900">{agentName}</div>
                  <div className="text-xs text-gray-500">{agent.email}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid - Days as Columns, Hours as Rows */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max bg-white">
          {/* Header with Days */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
            <div className="grid" style={{ gridTemplateColumns: `120px repeat(${days.length}, 100px)` }}>
              <div className="p-3 border-r border-gray-200">
                <div className="text-sm font-semibold text-gray-900">Horários</div>
              </div>
              {days.map((day, index) => (
                <div key={index} className="p-3 border-r border-gray-200 text-center">
                  <div className="text-xs text-gray-500">
                    {format(day, 'eee', { locale: ptBR }).toUpperCase()}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {format(day, 'dd/MM', { locale: ptBR })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Slots as Rows */}
          {timeSlots.map((timeSlot) => (
            <div key={timeSlot} className="border-b border-gray-100">
              {/* Time Label */}
              <div className="grid" style={{ gridTemplateColumns: `120px repeat(${days.length}, 100px)` }}>
                <div className="p-3 border-r border-gray-200 bg-gray-50">
                  <div className="text-sm font-medium text-gray-900">{timeSlot}</div>
                </div>
                
                {/* Day Columns */}
                {days.map((day, dayIndex) => (
                  <div key={dayIndex} className="border-r border-gray-200">
                    {/* Each Agent gets two mini-rows: Planned and Actual */}
                    {filteredAgents.map((agent, agentIndex) => (
                      <div key={agent.id} className="border-b border-gray-100 last:border-b-0">
                        {/* Planned Row */}
                        <div 
                          className="p-1 bg-green-50 min-h-[30px] relative text-xs cursor-pointer hover:bg-green-100"
                          onClick={() => onTimeSlotClick(day, timeSlot, agent.id)}
                        >
                          {getSchedulesForDayAndTime(agent.id, day, timeSlot, 'planned').map((schedule) => {
                            const activityType = getActivityType(schedule.activityTypeId);
                            return (
                              <div
                                key={schedule.id}
                                className="absolute inset-1 rounded text-white text-xs p-1 cursor-pointer hover:opacity-80 flex items-center justify-center"
                                style={{ backgroundColor: activityType?.color || '#3b82f6' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onScheduleClick(schedule);
                                }}
                              >
                                <Badge variant="secondary" className="text-xs">
                                  {schedule.priority === 'urgent' ? 'U' : 
                                   schedule.priority === 'high' ? 'H' : 
                                   schedule.priority === 'low' ? 'L' : 'M'}
                                </Badge>
                              </div>
                            );
                          })}
                          {agentIndex === 0 && (
                            <div className="absolute -left-20 top-1 text-xs text-green-600 font-medium">
                              P
                            </div>
                          )}
                        </div>
                        
                        {/* Actual Row */}
                        <div 
                          className="p-1 bg-blue-50 min-h-[30px] relative text-xs cursor-pointer hover:bg-blue-100"
                          onClick={() => onTimeSlotClick(day, timeSlot, agent.id)}
                        >
                          {getSchedulesForDayAndTime(agent.id, day, timeSlot, 'actual').map((schedule) => {
                            const activityType = getActivityType(schedule.activityTypeId);
                            return (
                              <div
                                key={schedule.id}
                                className="absolute inset-1 rounded text-white text-xs p-1 cursor-pointer hover:opacity-80 flex items-center justify-center"
                                style={{ backgroundColor: activityType?.color || '#3b82f6' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onScheduleClick(schedule);
                                }}
                              >
                                <Badge variant="secondary" className="text-xs">
                                  {schedule.priority === 'urgent' ? 'U' : 
                                   schedule.priority === 'high' ? 'H' : 
                                   schedule.priority === 'low' ? 'L' : 'M'}
                                </Badge>
                              </div>
                            );
                          })}
                          {agentIndex === 0 && (
                            <div className="absolute -left-20 top-1 text-xs text-blue-600 font-medium">
                              R
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduleGrid;