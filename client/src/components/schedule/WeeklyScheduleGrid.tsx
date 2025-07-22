import React, { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay, parseISO, startOfDay, addMinutes } from 'date-fns';
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

interface WeeklyScheduleGridProps {
  schedules: Schedule[];
  activityTypes: ActivityType[];
  agents: Agent[];
  selectedDate: Date;
  onScheduleClick: (schedule: Schedule) => void;
  onTimeSlotClick: (date: Date, time: string, agentId: string) => void;
}

const WeeklyScheduleGrid: React.FC<WeeklyScheduleGridProps> = ({
  schedules,
  activityTypes,
  agents,
  selectedDate,
  onScheduleClick,
  onTimeSlotClick,
}) => {
  const [searchAgent, setSearchAgent] = useState('');

  // Generate time slots (30-minute intervals from 9:00 to 23:00) 
  const timeSlots = [];
  for (let hour = 9; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  // Generate week days starting from Monday
  const weekStart = startOfWeek(selectedDate, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter agents by search
  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchAgent.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchAgent.toLowerCase())
  );

  const getActivityType = (activityTypeId: string) => {
    return activityTypes.find(type => type.id === activityTypeId);
  };

  const getScheduleForSlot = (agentId: string, date: Date, timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = addMinutes(slotStart, 30);

    return schedules.find(schedule => {
      const scheduleStart = parseISO(schedule.startDateTime);
      const scheduleEnd = parseISO(schedule.endDateTime);
      
      return (
        schedule.agentId === agentId &&
        isSameDay(scheduleStart, date) &&
        ((scheduleStart <= slotStart && scheduleEnd > slotStart) ||
         (scheduleStart < slotEnd && scheduleEnd >= slotEnd) ||
         (scheduleStart >= slotStart && scheduleEnd <= slotEnd))
      );
    });
  };

  const getScheduleSpan = (schedule: any, date: Date) => {
    const scheduleStart = parseISO(schedule.startDateTime);
    const scheduleEnd = parseISO(schedule.endDateTime);
    
    if (!isSameDay(scheduleStart, date)) return { start: 0, span: 0 };
    
    const dayStart = startOfDay(date);
    dayStart.setHours(9, 0, 0, 0); // Start at 9:00
    
    const startMinutes = Math.max(0, (scheduleStart.getTime() - dayStart.getTime()) / (1000 * 60));
    const endMinutes = Math.min(14 * 60, (scheduleEnd.getTime() - dayStart.getTime()) / (1000 * 60)); // Max 14 hours (9:00-23:00)
    
    const startSlot = Math.floor(startMinutes / 30);
    const endSlot = Math.ceil(endMinutes / 30);
    
    return {
      start: startSlot,
      span: Math.max(1, endSlot - startSlot)
    };
  };

  const getScheduleColor = (activityTypeId: string, priority: string, status: string) => {
    const activityType = getActivityType(activityTypeId);
    
    if (status === 'cancelled') {
      return 'bg-gray-300 text-gray-700';
    }
    
    if (status === 'completed') {
      return 'bg-green-400 text-white';
    }
    
    // Base colors by priority
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-400 text-white';
      case 'medium':
        return activityType ? `bg-green-400 text-white` : 'bg-blue-400 text-white';
      case 'low':
        return 'bg-yellow-400 text-gray-900';
      default:
        return 'bg-blue-400 text-white';
    }
  };

  const getScheduleLabel = (schedule: any) => {
    const activityType = getActivityType(schedule.activityTypeId);
    
    // Priority indicators
    if (schedule.priority === 'urgent') return 'U';
    if (schedule.priority === 'high') return 'H';
    if (schedule.priority === 'low') return 'L';
    
    // Activity type abbreviations
    if (activityType) {
      switch (activityType.category) {
        case 'visita_tecnica': return 'Tx';
        case 'instalacao': return 'I';
        case 'manutencao': return 'M';
        case 'suporte': return 'S';
        default: return 'Tx';
      }
    }
    
    return 'Tx';
  };

  return (
    <div className="bg-white border overflow-hidden" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="bg-gray-50 p-3 border-b flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Day</span>
          <span className="text-sm">{format(selectedDate, 'EEE, MMM dd, yyyy', { locale: ptBR })}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-600">Bulk edit</span>
          <span className="text-xs text-gray-600">Generate</span>
          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Publish</span>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-40 border-r bg-gray-50">
          {/* Group Toggle - Same height as time header */}
          <div className="p-2 border-b bg-gray-50" style={{ height: '36px' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">By group</span>
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">104</span>
            </div>
          </div>

          {/* Agent List - Exactly aligned with grid rows */}
          <div className="overflow-y-auto">
            {filteredAgents.map((agent, index) => (
              <div 
                key={agent.id} 
                className="flex items-center px-2 text-xs border-b bg-gray-50" 
                style={{ height: '40px' }}
              >
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                  {agent.name.charAt(0)}
                </div>
                <span className="font-medium text-xs">{agent.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="flex-1 overflow-x-auto">
          {/* Time Header - Hourly from 09:00 to 23:00 */}
          <div className="bg-gray-50 border-b flex text-xs" style={{ height: '36px' }}>
            {Array.from({ length: 15 }, (_, i) => {
              const hour = 9 + i;
              return (
                <div key={hour} className="w-12 px-1 py-2 text-center border-r text-xs flex items-center justify-center">
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>
              );
            })}
          </div>

          {/* Schedule Grid - Each agent row exactly aligned */}
          <div className="relative">
            {filteredAgents.map((agent, agentIndex) => (
              <div key={agent.id} className="flex border-b bg-white" style={{ height: '40px' }}>
                {/* Single day column for now (Monday) */}
                <div className="relative flex" style={{ width: `${15 * 48}px` }}>
                  {/* Hour slots background */}
                  {Array.from({ length: 15 }, (_, hourIndex) => (
                    <div
                      key={hourIndex}
                      className="w-12 h-full border-r border-gray-200 hover:bg-blue-50 cursor-pointer"
                      onClick={() => {
                        const hour = 9 + hourIndex;
                        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                        onTimeSlotClick(weekDays[0], timeSlot, agent.id);
                      }}
                    />
                  ))}
                  
                  {/* Schedule blocks for Monday only */}
                  {schedules
                    .filter(s => s.agentId === agent.id && isSameDay(parseISO(s.startDateTime), weekDays[0]))
                    .map(schedule => {
                      const scheduleStart = parseISO(schedule.startDateTime);
                      const scheduleEnd = parseISO(schedule.endDateTime);
                      
                      const startHour = scheduleStart.getHours() + scheduleStart.getMinutes() / 60;
                      const endHour = scheduleEnd.getHours() + scheduleEnd.getMinutes() / 60;
                      
                      // Position calculation
                      const left = Math.max(0, (startHour - 9) * 48);
                      const width = Math.max(24, (endHour - Math.max(9, startHour)) * 48 - 2);
                      
                      if (startHour < 9 || startHour >= 24) return null;
                      
                      return (
                        <div
                          key={schedule.id}
                          className={`absolute top-1 rounded text-xs font-medium cursor-pointer hover:opacity-80 flex items-center justify-center ${getScheduleColor(schedule.activityTypeId, schedule.priority, schedule.status)}`}
                          style={{
                            left: `${left}px`,
                            width: `${width}px`,
                            height: '32px',
                          }}
                          onClick={() => onScheduleClick(schedule)}
                          title={`${schedule.title} - ${format(scheduleStart, 'HH:mm')} to ${format(scheduleEnd, 'HH:mm')}`}
                        >
                          {getScheduleLabel(schedule)}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
          

        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduleGrid;