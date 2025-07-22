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

interface TimelineScheduleGridProps {
  schedules: Schedule[];
  activityTypes: ActivityType[];
  agents: Agent[];
  selectedDate: Date;
  onScheduleClick: (schedule: Schedule) => void;
  onTimeSlotClick: (date: Date, time: string, agentId: string) => void;
}

const TimelineScheduleGrid: React.FC<TimelineScheduleGridProps> = ({
  schedules,
  activityTypes,
  agents,
  selectedDate,
  onScheduleClick,
  onTimeSlotClick,
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
        // Today from 6:00 to 22:00
        return Array.from({ length: 17 }, (_, i) => {
          const time = addHours(startOfDay(selectedDate), i + 6);
          return time;
        });
    }
  };

  const timeSlots = getTimeSlots();

  // Filter agents by search
  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchAgent.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchAgent.toLowerCase())
  );

  const getActivityType = (activityTypeId: string) => {
    return activityTypes.find(type => type.id === activityTypeId);
  };

  const getSchedulesForTimeSlot = (agentId: string, timeSlot: Date, type: 'planned' | 'actual') => {
    return schedules.filter(schedule => {
      const scheduleStart = parseISO(schedule.startDateTime);
      const scheduleEnd = parseISO(schedule.endDateTime);
      
      return schedule.agentId === agentId &&
             schedule.type === type &&
             scheduleStart <= timeSlot &&
             scheduleEnd > timeSlot;
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
            {filteredAgents.map((agent) => (
              <div key={agent.id} className="border-b">
                {/* Planned row */}
                <div className="h-10 px-4 py-2 bg-white border-b border-gray-100 flex items-center">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 text-xs">{agent.name}</div>
                    <div className="text-xs text-green-600">Previsto</div>
                  </div>
                </div>
                
                {/* Actual row */}
                <div className="h-10 px-4 py-2 bg-gray-50 flex items-center">
                  <div className="text-sm">
                    <div className="font-medium text-gray-700 text-xs">{agent.name}</div>
                    <div className="text-xs text-blue-600">Realizado</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline grid */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex" style={{ minWidth: `${timeSlots.length * 64}px` }}>
              {timeSlots.map((timeSlot, timeIndex) => (
                <div key={timeIndex} className="flex-shrink-0 w-16 border-r last:border-r-0">
                  {filteredAgents.map((agent) => {
                    const plannedSchedules = getSchedulesForTimeSlot(agent.id, timeSlot, 'planned');
                    const actualSchedules = getSchedulesForTimeSlot(agent.id, timeSlot, 'actual');
                    
                    return (
                      <div key={agent.id} className="border-b">
                        {/* Planned row - opaque background */}
                        <div 
                          className="h-10 relative bg-green-50 border-b border-gray-100 cursor-pointer hover:bg-green-100"
                          onClick={() => onTimeSlotClick(timeSlot, formatTimeSlot(timeSlot), agent.id)}
                        >
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
                          className="h-10 relative bg-blue-50 cursor-pointer hover:bg-blue-100"
                          onClick={() => onTimeSlotClick(timeSlot, formatTimeSlot(timeSlot), agent.id)}
                        >
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