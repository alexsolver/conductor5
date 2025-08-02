import React, { useState, useRef } from 'react';
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
  const [timeFilter, setTimeFilter] = useState<'hoje' | '2min' | '10min' | '30min' | '1hora' | '24horas'>('1hora');

  // Generate 14 days starting from selected date
  const days = Array.from({ length: 14 }, (_, i) => addDays(startDate, i));

  // Generate time slots for all 14 days based on selected filter
  const getTimeSlots = () => {
    const slots: Date[] = [];
    
    switch (timeFilter) {
      case '2min':
        days.forEach(day => {
          for (let hour = 6; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 5) {
              slots.push(addMinutes(addHours(startOfDay(day), hour), minute));
            }
          }
        });
        break;
      
      case '10min':
        days.forEach(day => {
          for (let hour = 6; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 10) {
              slots.push(addMinutes(addHours(startOfDay(day), hour), minute));
            }
          }
        });
        break;
      
      case '30min':
        days.forEach(day => {
          for (let hour = 6; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
              slots.push(addMinutes(addHours(startOfDay(day), hour), minute));
            }
          }
        });
        break;
      
      case '1hora':
        days.forEach(day => {
          for (let hour = 6; hour < 24; hour++) {
            slots.push(addHours(startOfDay(day), hour));
          }
        });
        break;
      
      case '24horas':
        days.forEach(day => {
          [6, 12, 18, 24].forEach(hour => {
            if (hour === 24) {
              slots.push(startOfDay(addDays(day, 1)));
            } else {
              slots.push(addHours(startOfDay(day), hour));
            }
          });
        });
        break;
      
      default: // 'hoje'
        days.forEach(day => {
          for (let hour = 6; hour < 24; hour++) {
            slots.push(addHours(startOfDay(day), hour));
          }
        });
        break;
    }
    
    return slots;
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

  const getSchedulesForTimeSlot = (agentId: string, timeSlot: Date, type: 'planned' | 'actual') => {
    return schedules.filter(schedule => {
      if (!schedule.agentId || !schedule.type || !schedule.startDateTime) return false;
      
      const scheduleStart = parseISO(schedule.startDateTime);
      
      // Match agent ID (handle both UUID formats)
      const agentMatch = schedule.agentId === agentId || 
                        schedule.agentId.startsWith(agentId.substring(0, 8));
      
      // Check if schedule overlaps with time slot
      const scheduleEnd = schedule.endDateTime ? parseISO(schedule.endDateTime) : addHours(scheduleStart, 1);
      const timeSlotEnd = addMinutes(timeSlot, getTimeSlotDuration());
      
      const timeMatch = scheduleStart < timeSlotEnd && scheduleEnd > timeSlot;
      
      return agentMatch && schedule.type === type && timeMatch;
    });
  };

  const getTimeSlotDuration = () => {
    switch (timeFilter) {
      case '2min': return 5;
      case '10min': return 10;
      case '30min': return 30;
      case '1hora': return 60;
      case '24horas': return 360; // 6 hours
      default: return 60;
    }
  };

  const formatTimeSlot = (timeSlot: Date) => {
    if (timeFilter === '24horas') {
      return format(timeSlot, 'dd/MM');
    }
    return format(timeSlot, 'HH:mm');
  };

  // Scroll synchronization refs
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  const syncScrollToContent = () => {
    if (headerScrollRef.current && contentScrollRef.current) {
      contentScrollRef.current.scrollLeft = headerScrollRef.current.scrollLeft;
    }
  };

  const syncScrollToHeader = () => {
    if (headerScrollRef.current && contentScrollRef.current) {
      headerScrollRef.current.scrollLeft = contentScrollRef.current.scrollLeft;
    }
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
          
          {/* Time slots header with day information */}
          <div 
            ref={headerScrollRef}
            className="flex-1 overflow-x-auto"
            onScroll={syncScrollToContent}
          >
            <div className="flex">
              {/* Group time slots by day */}
              {days.map((day, dayIndex) => {
                const dayTimeSlots = timeSlots.filter(slot => 
                  slot.getDate() === day.getDate() && 
                  slot.getMonth() === day.getMonth() && 
                  slot.getFullYear() === day.getFullYear()
                );
                
                const slotsPerDay = dayTimeSlots.length;
                const cellWidth = timeFilter === '1hora' ? 16 : timeFilter === '30min' ? 12 : timeFilter === '10min' ? 8 : 6;
                
                return (
                  <div key={dayIndex} className="border-r">
                    {/* Day header */}
                    <div 
                      className="bg-gray-200 border-b text-center py-1 text-xs font-semibold text-gray-700"
                      style={{ width: `${slotsPerDay * cellWidth}px` }}
                    >
                      {format(day, 'eee. dd/MM', { locale: ptBR })}
                    </div>
                    {/* Time slots for this day */}
                    <div className="flex">
                      {dayTimeSlots.map((timeSlot, slotIndex) => (
                        <div 
                          key={slotIndex} 
                          className={`flex-shrink-0 p-1 text-center border-r last:border-r-0`}
                          style={{ width: `${cellWidth}px` }}
                        >
                          <div className="text-xs font-medium text-gray-900">
                            {formatTimeSlot(timeSlot)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex">
          {/* Left sidebar with agent list */}
          <div className="w-64 flex-shrink-0 border-r bg-gray-50">
            {filteredAgents.map((agent) => {
              const agentName = agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email;
              
              return (
                <div key={agent.id} className="border-b">
                  {/* Planned row */}
                  <div className="h-10 px-4 py-2 bg-white border-b border-gray-100 flex items-center justify-between">
                    <div className="text-sm flex-1 flex items-center gap-2">
                      <SimpleAvatar 
                        src={agent.profileImageUrl} 
                        name={agentName} 
                        size="sm" 
                      />
                      <div>
                        <div className="font-medium text-gray-900 text-xs">{agentName}</div>
                        <div className="text-xs text-green-600">Previsto</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actual row */}
                  <div className="h-10 px-4 py-2 bg-gray-50 flex items-center justify-between">
                    <div className="text-sm flex-1 flex items-center gap-2">
                      <SimpleAvatar 
                        src={agent.profileImageUrl} 
                        name={agentName} 
                        size="sm" 
                      />
                      <div>
                        <div className="font-medium text-gray-700 text-xs">{agentName}</div>
                        <div className="text-xs text-blue-600">Realizado</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline grid */}
          <div 
            ref={contentScrollRef}
            className="flex-1 overflow-x-auto"
            onScroll={syncScrollToHeader}
          >
            <div className="flex">
              {/* Group content by day to match header structure */}
              {days.map((day, dayIndex) => {
                const dayTimeSlots = timeSlots.filter(slot => 
                  slot.getDate() === day.getDate() && 
                  slot.getMonth() === day.getMonth() && 
                  slot.getFullYear() === day.getFullYear()
                );
                
                const cellWidth = timeFilter === '1hora' ? 16 : timeFilter === '30min' ? 12 : timeFilter === '10min' ? 8 : 6;
                
                return (
                  <div key={dayIndex} className="flex border-r">
                    {dayTimeSlots.map((timeSlot, timeIndex) => (
                      <div 
                        key={timeIndex} 
                        className="border-r last:border-r-0"
                        style={{ width: `${cellWidth}px` }}
                      >
                        {filteredAgents.map((agent) => {
                          const plannedSchedules = getSchedulesForTimeSlot(agent.id, timeSlot, 'planned');
                          const actualSchedules = getSchedulesForTimeSlot(agent.id, timeSlot, 'actual');
                          
                          return (
                            <div key={agent.id} className="border-b">
                              {/* Planned row */}
                              <div 
                                className="h-10 relative border-b border-gray-100 cursor-pointer bg-white hover:bg-gray-50"
                                onClick={() => onTimeSlotClick(timeSlot, format(timeSlot, 'HH:mm'), agent.id)}
                              >
                                {plannedSchedules.map((schedule) => {
                                  const activityType = getActivityType(schedule.activityTypeId);
                                  return (
                                    <div
                                      key={schedule.id}
                                      className={`absolute inset-0 text-white text-xs cursor-pointer hover:opacity-80 ${getPriorityColor(schedule.priority)}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onScheduleClick(schedule);
                                      }}
                                      title={`${schedule.title} - ${activityType?.name || 'N/A'}`}
                                    />
                                  );
                                })}
                              </div>
                              
                              {/* Actual row */}
                              <div 
                                className="h-10 bg-gray-50 relative cursor-pointer hover:bg-gray-100"
                                onClick={() => onTimeSlotClick(timeSlot, format(timeSlot, 'HH:mm'), agent.id)}
                              >
                                {actualSchedules.map((schedule) => {
                                  const activityType = getActivityType(schedule.activityTypeId);
                                  return (
                                    <div
                                      key={schedule.id}
                                      className={`absolute inset-0 text-white text-xs cursor-pointer hover:opacity-80 ${getPriorityColor(schedule.priority)}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onScheduleClick(schedule);
                                      }}
                                      title={`${schedule.title} - ${activityType?.name || 'N/A'}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduleGrid;