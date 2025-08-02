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
  const [timeFilter] = useState<'1hora'>('1hora'); // Fixed to 1 hour for 14-day view

  // Generate 14 days starting from selected date
  const days = Array.from({ length: 14 }, (_, i) => addDays(startDate, i));

  // Generate hourly time slots for all 14 days (6:00 to 23:00)
  const getTimeSlots = () => {
    const slots: Date[] = [];
    
    days.forEach(day => {
      for (let hour = 6; hour < 24; hour++) {
        slots.push(addHours(startOfDay(day), hour));
      }
    });
    
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

  const getTimeSlotDuration = () => 60; // Always 1 hour for 14-day view

  const formatTimeSlot = (timeSlot: Date) => {
    return format(timeSlot, 'HH'); // Show only hours (two digits)
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
      {/* Header with Search */}
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
          
          {/* Fixed to hourly view for 14 days */}
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
            Visualização por hora - 14 dias
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
                const cellWidth = 32; // Fixed 32px width for better text readability
                
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
                          className={`flex-shrink-0 px-1 py-2 text-center border-r last:border-r-0`}
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
                
                const cellWidth = 32; // Fixed 32px width for better text readability
                
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
                                  const isInternalAction = schedule.activityTypeId === 'internal-action' || schedule.type === 'internal_action';
                                  
                                  return (
                                    <div
                                      key={schedule.id}
                                      className={`absolute inset-0 text-white text-xs cursor-pointer hover:opacity-80 ${
                                        isInternalAction 
                                          ? 'bg-purple-600 border border-purple-400' 
                                          : getPriorityColor(schedule.priority)
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onScheduleClick(schedule);
                                      }}
                                      title={
                                        isInternalAction 
                                          ? `Ação Interna: ${schedule.title} - ${activityType?.name || 'Ticket'}`
                                          : `${schedule.title} - ${activityType?.name || 'N/A'}`
                                      }
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
                                  const isInternalAction = schedule.activityTypeId === 'internal-action' || schedule.type === 'internal_action';
                                  
                                  return (
                                    <div
                                      key={schedule.id}
                                      className={`absolute inset-0 text-white text-xs cursor-pointer hover:opacity-80 ${
                                        isInternalAction 
                                          ? 'bg-purple-600 border border-purple-400' 
                                          : getPriorityColor(schedule.priority)
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onScheduleClick(schedule);
                                      }}
                                      title={
                                        isInternalAction 
                                          ? `Ação Interna: ${schedule.title} - ${activityType?.name || 'Ticket'}`
                                          : `${schedule.title} - ${activityType?.name || 'N/A'}`
                                      }
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