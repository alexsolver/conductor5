import React, { useState } from 'react';
import { format, addDays, addHours, addMinutes, startOfDay, parseISO, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

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

interface ActivityType {
  id: string;
  name: string;
  color: string;
  category: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  profileImageUrl?: string;
}

interface WorkSchedule {
  id: string;
  userId: string;
  scheduleType: string;
  scheduleName: string;
  workDays: number[];
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isActive: boolean;
}

interface TimelineScheduleGridProps {
  schedules: Schedule[];
  activityTypes: ActivityType[];
  agents: Agent[];
  selectedDate: Date;
  onScheduleClick: (schedule: Schedule) => void;
  onTimeSlotClick: (date: Date, time: string, agentId: string) => void;
  workSchedules?: WorkSchedule[];
}

const TimelineScheduleGrid: React.FC<TimelineScheduleGridProps> = ({
  schedules,
  activityTypes,
  agents,
  selectedDate,
  onScheduleClick,
  onTimeSlotClick,
  workSchedules = [],
}) => {
  const [searchAgent, setSearchAgent] = useState('');
  const [timeFilter, setTimeFilter] = useState<'hoje' | '2min' | '10min' | '30min' | '1hora' | '24horas'>('hoje');

  // Generate time slots based on selected filter
  const getTimeSlots = () => {
    switch (timeFilter) {
      case '2min':
        // 2 hours with 5-minute intervals
        return Array.from({ length: 24 }, (_, i) => {
          const time = addMinutes(startOfDay(selectedDate), i * 5);
          return time;
        });
      
      case '10min':
        // 10 hours with 10-minute intervals
        return Array.from({ length: 60 }, (_, i) => {
          const time = addMinutes(startOfDay(selectedDate), i * 10);
          return time;
        });
      
      case '30min':
        // 24 hours with 30-minute intervals
        return Array.from({ length: 48 }, (_, i) => {
          const time = addMinutes(startOfDay(selectedDate), i * 30);
          return time;
        });
      
      case '1hora':
        // 24 hours with 1-hour intervals
        return Array.from({ length: 24 }, (_, i) => {
          const time = addHours(startOfDay(selectedDate), i);
          return time;
        });
      
      case '24horas':
        // 7 days
        return Array.from({ length: 7 }, (_, i) => {
          const time = addDays(selectedDate, i);
          return time;
        });
      
      default: // 'hoje'
        // Today from 6:00 to 24:00
        return Array.from({ length: 19 }, (_, i) => {
          const time = addHours(startOfDay(selectedDate), i + 6);
          return time;
        });
    }
  };

  const timeSlots = getTimeSlots();

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

  const getSchedulesForTimeSlot = (agentId: string, timeSlot: Date, type: 'planned' | 'actual') => {
    return schedules.filter(schedule => {
      if (!schedule.agentId || !schedule.type || !schedule.startDateTime) return false;
      
      const scheduleStart = parseISO(schedule.startDateTime);
      const scheduleEnd = parseISO(schedule.endDateTime);
      const timeSlotHour = timeSlot.getHours();
      const scheduleHour = scheduleStart.getHours();
      
      // Match agent ID (handle both UUID formats)
      const agentMatch = schedule.agentId === agentId || 
                        schedule.agentId.startsWith(agentId.substring(0, 8));
      
      return agentMatch &&
             schedule.type === type &&
             scheduleHour === timeSlotHour &&
             scheduleStart.getDate() === timeSlot.getDate();
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-green-500';
      case 'low': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const formatTimeSlot = (timeSlot: Date) => {
    if (timeFilter === '24horas') {
      return format(timeSlot, 'dd/MM');
    }
    return format(timeSlot, 'HH:mm');
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header with Search and Time Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar técnico..."
              className="pl-10"
              value={searchAgent}
              onChange={(e) => setSearchAgent(e.target.value)}
            />
          </div>
          
          {/* Time Filter Buttons */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'hoje', label: 'Hoje' },
              { key: '2min', label: '2min' },
              { key: '10min', label: '10min' },
              { key: '30min', label: '30min' },
              { key: '1hora', label: '1hora' },
              { key: '24horas', label: '24horas' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setTimeFilter(filter.key as any)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeFilter === filter.key
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="border rounded-lg bg-white overflow-hidden">
        {/* Header with time slots */}
        <div className="flex border-b bg-gray-50">
          {/* Left sidebar space */}
          <div className="w-64 flex-shrink-0 border-r bg-gray-100 p-4">
            <div className="text-sm font-medium text-gray-700">Técnicos</div>
          </div>
          
          {/* Time slots header */}
          <div className="flex-1 flex overflow-x-auto">
            {timeSlots.map((timeSlot, index) => (
              <div key={index} className="flex-shrink-0 w-16 p-2 text-center border-r last:border-r-0">
                <div className="text-xs font-medium text-gray-900">
                  {formatTimeSlot(timeSlot)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="flex">
          {/* Left sidebar with agent list */}
          <div className="w-64 flex-shrink-0 border-r bg-gray-50">
            {filteredAgents.map((agent) => {
              const workSchedule = workSchedules.find(ws => ws.userId === agent.id);
              const dayOfWeek = selectedDate.getDay();
              const worksToday = workSchedule?.workDays.includes(dayOfWeek) || false;
              const agentName = agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email;
              
              return (
                <div key={agent.id} className="border-b">
                  {/* Planned row */}
                  <div className="h-10 px-4 py-2 bg-white border-b border-gray-100 flex items-center justify-between">
                    <div className="text-sm flex-1">
                      <div className="font-medium text-gray-900 text-xs">{agentName}</div>
                      <div className="text-xs text-green-600">Previsto</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {worksToday && workSchedule ? (
                        <div className="text-right">
                          <div>{workSchedule.startTime}-{workSchedule.endTime}</div>
                          <div className="text-xs text-orange-600">
                            {workSchedule.scheduleType}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400">Folga</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actual row */}
                  <div className="h-10 px-4 py-2 bg-gray-50 flex items-center justify-between">
                    <div className="text-sm flex-1">
                      <div className="font-medium text-gray-700 text-xs">{agentName}</div>
                      <div className="text-xs text-blue-600">Realizado</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {worksToday && workSchedule?.breakStart && workSchedule?.breakEnd ? (
                        <div className="text-right">
                          <div className="text-orange-600">
                            ☕ {workSchedule.breakStart}-{workSchedule.breakEnd}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline grid */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex" style={{ minWidth: `${timeSlots.length * 64}px` }}>
              {timeSlots.map((timeSlot, timeIndex) => (
                <div key={timeIndex} className="flex-shrink-0 w-16 border-r last:border-r-0">
                  {filteredAgents.map((agent) => {
                    const plannedSchedules = getSchedulesForTimeSlot(agent.id, timeSlot, 'planned');
                    const actualSchedules = getSchedulesForTimeSlot(agent.id, timeSlot, 'actual');
                    
                    // Get work schedule for this agent
                    const workSchedule = workSchedules.find(ws => ws.userId === agent.id);
                    const dayOfWeek = timeSlot.getDay(); // 0 = domingo, 1 = segunda, etc.
                    const worksToday = workSchedule?.workDays.includes(dayOfWeek) || false;
                    
                    // Check if it's working hour based on actual schedule
                    const isWorkingHour = worksToday && workSchedule ? (() => {
                      const currentHour = timeSlot.getHours();
                      const currentMinute = timeSlot.getMinutes();
                      const currentTime = currentHour * 60 + currentMinute;
                      
                      const [startHour, startMinute] = workSchedule.startTime.split(':').map(Number);
                      const [endHour, endMinute] = workSchedule.endTime.split(':').map(Number);
                      const startTime = startHour * 60 + startMinute;
                      const endTime = endHour * 60 + endMinute;
                      
                      return currentTime >= startTime && currentTime < endTime;
                    })() : false;
                    
                    // Check if it's break time
                    const isBreakTime = worksToday && workSchedule?.breakStart && workSchedule?.breakEnd ? (() => {
                      const currentHour = timeSlot.getHours();
                      const currentMinute = timeSlot.getMinutes();
                      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
                      
                      return currentTime >= workSchedule.breakStart && currentTime <= workSchedule.breakEnd;
                    })() : false;
                    
                    return (
                      <div key={agent.id} className="border-b">
                        {/* Planned row - opaque background */}
                        <div 
                          className={`h-10 relative border-b border-gray-100 cursor-pointer ${
                            !worksToday 
                              ? 'bg-gray-200 hover:bg-gray-300' 
                              : isBreakTime 
                                ? 'bg-orange-100 hover:bg-orange-200'
                                : isWorkingHour 
                                  ? 'bg-green-50 hover:bg-green-100' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          onClick={() => onTimeSlotClick(timeSlot, formatTimeSlot(timeSlot), agent.id)}
                          title={
                            !worksToday 
                              ? 'Não trabalha neste dia'
                              : isBreakTime 
                                ? 'Horário de intervalo'
                                : isWorkingHour 
                                  ? 'Horário disponível' 
                                  : 'Fora do horário de trabalho'
                          }
                        >
                          {/* Status indicator bar */}
                          <div className={`absolute inset-x-0 bottom-0 h-1 ${
                            !worksToday 
                              ? 'bg-gray-400'
                              : isBreakTime 
                                ? 'bg-orange-400'
                                : isWorkingHour 
                                  ? 'bg-green-400' 
                                  : 'bg-gray-300'
                          }`}></div>
                          {plannedSchedules.map((schedule) => {
                            const activityType = getActivityType(schedule.activityTypeId);
                            return (
                              <div
                                key={schedule.id}
                                className={`absolute inset-1 rounded text-white text-xs flex items-center justify-center cursor-pointer hover:opacity-80 ${getPriorityColor(schedule.priority)}`}
                                style={{ opacity: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onScheduleClick(schedule);
                                }}
                                title={`${schedule.title} - ${format(parseISO(schedule.startDateTime), 'HH:mm')}`}
                              >
                                <span className="truncate font-medium">
                                  {schedule.priority === 'urgent' ? 'U' : 
                                   schedule.priority === 'high' ? 'H' : 
                                   schedule.priority === 'low' ? 'L' : 'M'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Actual row - clear background */}
                        <div 
                          className={`h-10 relative cursor-pointer ${
                            !worksToday 
                              ? 'bg-gray-200 hover:bg-gray-300' 
                              : isBreakTime 
                                ? 'bg-orange-100 hover:bg-orange-200'
                                : isWorkingHour 
                                  ? 'bg-blue-50 hover:bg-blue-100' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          onClick={() => onTimeSlotClick(timeSlot, formatTimeSlot(timeSlot), agent.id)}
                          title={
                            !worksToday 
                              ? 'Não trabalha neste dia'
                              : isBreakTime 
                                ? 'Horário de intervalo'
                                : isWorkingHour 
                                  ? 'Horário disponível' 
                                  : 'Fora do horário de trabalho'
                          }
                        >
                          {/* Status indicator bar */}
                          <div className={`absolute inset-x-0 bottom-0 h-1 ${
                            !worksToday 
                              ? 'bg-gray-400'
                              : isBreakTime 
                                ? 'bg-orange-400'
                                : isWorkingHour 
                                  ? 'bg-blue-400' 
                                  : 'bg-gray-300'
                          }`}></div>
                          {actualSchedules.map((schedule) => {
                            const activityType = getActivityType(schedule.activityTypeId);
                            return (
                              <div
                                key={schedule.id}
                                className={`absolute inset-1 rounded text-white text-xs flex items-center justify-center cursor-pointer hover:opacity-80 ${getPriorityColor(schedule.priority)}`}
                                style={{ opacity: 0.5 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onScheduleClick(schedule);
                                }}
                                title={`${schedule.title} - ${format(parseISO(schedule.startDateTime), 'HH:mm')}`}
                              >
                                <span className="truncate font-medium">
                                  {schedule.priority === 'urgent' ? 'U' : 
                                   schedule.priority === 'high' ? 'H' : 
                                   schedule.priority === 'low' ? 'L' : 'M'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineScheduleGrid;