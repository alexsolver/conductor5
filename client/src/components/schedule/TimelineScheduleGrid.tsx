import React, { useState, useRef, useEffect } from 'react';
import { format, addDays, addHours, addMinutes, startOfDay, parseISO, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import SimpleAvatar from '@/components/ui/avatar';
import InternalActionDetailsModal from './InternalActionDetailsModal';

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
  const [selectedInternalAction, setSelectedInternalAction] = useState<any>(null);
  const [showInternalActionModal, setShowInternalActionModal] = useState(false);
  
  // Refs para sincronização de scroll
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // Sincronizar scroll horizontal entre cabeçalho e conteúdo
  const syncScrollToContent = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollLeft = scrollLeft;
    }
  };

  const syncScrollToHeader = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollLeft;
    }
  };

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
        // Today from 0:00 to 24:00 (full day to catch all internal actions)
        return Array.from({ length: 24 }, (_, i) => {
          const time = addHours(startOfDay(selectedDate), i);
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
    const filtered = schedules.filter(schedule => {
      if (!schedule.agentId || !schedule.startDateTime) return false;
      
      const scheduleStart = parseISO(schedule.startDateTime);
      const scheduleEnd = schedule.endDateTime ? parseISO(schedule.endDateTime) : scheduleStart;
      
      // Match agent ID (handle both UUID formats)
      const agentMatch = schedule.agentId === agentId || 
                        schedule.agentId.startsWith(agentId.substring(0, 8));
      
      // For internal actions, they don't have a 'type' field, so treat them as 'planned'
      const typeMatch = schedule.type === type || 
                       (schedule.type === 'internal_action' && type === 'planned') ||
                       (schedule.activityTypeId === 'internal-action' && type === 'planned');
      
      // Date matching - convert both to same date format for comparison
      const timeSlotDate = timeSlot.toDateString();
      const scheduleDate = scheduleStart.toDateString();
      const dateMatch = timeSlotDate === scheduleDate;
      
      // Time range matching - check if time slot falls within schedule duration
      const timeSlotStart = timeSlot.getTime();
      const timeSlotEnd = timeSlotStart + (60 * 60 * 1000); // 1 hour slots
      
      const scheduleStartTime = scheduleStart.getTime();
      const scheduleEndTime = scheduleEnd.getTime();
      
      // Check if schedule overlaps with time slot
      const timeOverlap = scheduleStartTime < timeSlotEnd && scheduleEndTime > timeSlotStart;
      
      const result = agentMatch && typeMatch && dateMatch && timeOverlap;
      
      return result;
    });
    
    return filtered;
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
          <div 
            ref={headerScrollRef}
            className="flex-1 flex overflow-x-auto"
            onScroll={syncScrollToContent}
          >
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
          <div 
            ref={contentScrollRef}
            className="flex-1 overflow-x-auto"
            onScroll={syncScrollToHeader}
          >
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
                          className={`h-10 relative border-b border-gray-100 ${
                            !worksToday 
                              ? 'bg-gray-200' 
                              : isBreakTime 
                                ? 'bg-orange-100'
                                : isWorkingHour 
                                  ? 'bg-white' 
                                  : 'bg-gray-100'
                          }`}
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
                          {plannedSchedules.map((schedule) => {
                            const activityType = getActivityType(schedule.activityTypeId);
                            const isInternalAction = schedule.activityTypeId === 'internal-action' || schedule.type === 'internal_action';
                            
                            // Calculate if this is the starting slot for the action
                            const scheduleStart = parseISO(schedule.startDateTime);
                            const scheduleEnd = schedule.endDateTime ? parseISO(schedule.endDateTime) : scheduleStart;
                            const isStartingSlot = timeSlot.getTime() <= scheduleStart.getTime() && 
                                                   scheduleStart.getTime() < (timeSlot.getTime() + (60 * 60 * 1000));
                            
                            // Calculate duration in hours for visual width
                            const durationHours = Math.max(1, Math.ceil((scheduleEnd.getTime() - scheduleStart.getTime()) / (60 * 60 * 1000)));
                            
                            return (
                              <div
                                key={schedule.id}
                                className={`absolute inset-1 rounded text-white text-xs flex items-center justify-center cursor-pointer hover:opacity-80 ${
                                  isInternalAction 
                                    ? 'bg-purple-600 border border-purple-400' 
                                    : getPriorityColor(schedule.priority)
                                }`}
                                style={{ 
                                  opacity: 0.9,
                                  // Extend width for multi-hour actions only on starting slot
                                  width: isStartingSlot && isInternalAction && durationHours > 1 
                                    ? `${Math.min(durationHours * 64, 320)}px` // Max 5 hours visual
                                    : undefined,
                                  zIndex: isStartingSlot ? 10 : 5
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isInternalAction) {
                                    // Open custom internal action modal
                                    setSelectedInternalAction(schedule);
                                    setShowInternalActionModal(true);
                                  } else {
                                    onScheduleClick(schedule);
                                  }
                                }}
                                title={
                                  isInternalAction 
                                    ? `Ação Interna: ${schedule.title} - ${format(parseISO(schedule.startDateTime), 'HH:mm')} até ${format(parseISO(schedule.endDateTime || schedule.startDateTime), 'HH:mm')}`
                                    : `${schedule.title} - ${format(parseISO(schedule.startDateTime), 'HH:mm')}`
                                }
                              >
                                <span className="truncate font-medium">
                                  {isInternalAction ? (isStartingSlot ? `T ${durationHours}h` : 'T') : // T for Ticket action with duration
                                   schedule.priority === 'urgent' ? 'U' : 
                                   schedule.priority === 'high' ? 'H' : 
                                   schedule.priority === 'low' ? 'L' : 'M'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Actual row - clear background */}
                        <div 
                          className={`h-10 relative ${
                            !worksToday 
                              ? 'bg-gray-200' 
                              : isBreakTime 
                                ? 'bg-orange-100'
                                : isWorkingHour 
                                  ? 'bg-white' 
                                  : 'bg-gray-100'
                          }`}
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

      {/* Internal Action Details Modal */}
      <InternalActionDetailsModal
        internalAction={selectedInternalAction}
        isOpen={showInternalActionModal}
        onClose={() => {
          setShowInternalActionModal(false);
          setSelectedInternalAction(null);
        }}
      />
    </div>
  );
};

export default TimelineScheduleGrid;