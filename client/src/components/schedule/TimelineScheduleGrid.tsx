import React, { useState } from 'react';
import { format, addDays, startOfDay, parseISO, differenceInMinutes } from 'date-fns';
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
  type: 'planned' | 'actual'; // New field to distinguish planned vs actual
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

interface WorkingHours {
  start: string; // "08:00"
  end: string;   // "18:00"
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

  // Generate 14 consecutive days starting from selectedDate
  const timelineDays = Array.from({ length: 14 }, (_, i) => addDays(selectedDate, i));

  // Generate time slots (1-hour intervals from 6:00 to 22:00)
  const timeSlots = [];
  for (let hour = 6; hour <= 22; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    timeSlots.push(time);
  }

  // Filter agents by search
  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchAgent.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchAgent.toLowerCase())
  );

  const getActivityType = (activityTypeId: string) => {
    return activityTypes.find(type => type.id === activityTypeId);
  };

  const getSchedulesForAgent = (agentId: string, day: Date, type: 'planned' | 'actual') => {
    const dayStart = startOfDay(day);
    const dayEnd = addDays(dayStart, 1);
    
    return schedules.filter(schedule => {
      const scheduleDate = parseISO(schedule.startDateTime);
      return schedule.agentId === agentId &&
             schedule.type === type &&
             scheduleDate >= dayStart &&
             scheduleDate < dayEnd;
    });
  };

  const getSchedulePosition = (schedule: Schedule, dayDate: Date) => {
    const scheduleStart = parseISO(schedule.startDateTime);
    const scheduleEnd = parseISO(schedule.endDateTime);
    const duration = differenceInMinutes(scheduleEnd, scheduleStart);
    
    // Calculate position based on hours (6:00 = 0, 7:00 = 1, etc.)
    const hour = scheduleStart.getHours();
    const minute = scheduleStart.getMinutes();
    const startHour = 6;
    
    if (hour < startHour) return { left: 0, width: 0 }; // Before start time
    
    const left = ((hour - startHour) + (minute / 60)) * 60; // 60px per hour
    const width = (duration / 60) * 60; // Convert minutes to pixels
    
    return { left, width: Math.max(width, 30) }; // Minimum 30px width
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-green-500';
      case 'low': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getWorkingHours = (agentId: string): WorkingHours => {
    // Simulated working hours - can be retrieved from API later
    return { start: '08:00', end: '18:00' };
  };

  const isWorkingTime = (time: string, workingHours: WorkingHours) => {
    const timeHour = parseInt(time.split(':')[0]);
    const startHour = parseInt(workingHours.start.split(':')[0]);
    const endHour = parseInt(workingHours.end.split(':')[0]);
    return timeHour >= startHour && timeHour < endHour;
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* Header with days */}
      <div className="flex border-b bg-gray-50">
        {/* Left sidebar space */}
        <div className="w-64 flex-shrink-0 border-r bg-gray-100 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar técnico..."
              value={searchAgent}
              onChange={(e) => setSearchAgent(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
        
        {/* Days header */}
        <div className="flex-1 flex">
          {timelineDays.map((day, index) => (
            <div key={index} className="flex-1 min-w-0 p-3 text-center border-r last:border-r-0">
              <div className="text-sm font-medium text-gray-900">
                {format(day, 'dd/MM', { locale: ptBR })}
              </div>
              <div className="text-xs text-gray-500">
                {format(day, 'EEE', { locale: ptBR })}
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
            const workingHours = getWorkingHours(agent.id);
            return (
              <div key={agent.id} className="border-b">
                {/* Planned row */}
                <div className="h-12 px-4 py-2 bg-white border-b border-gray-100 flex items-center">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{agent.name}</div>
                    <div className="text-xs text-gray-500">Previsto</div>
                  </div>
                </div>
                
                {/* Actual row */}
                <div className="h-12 px-4 py-2 bg-gray-50 flex items-center">
                  <div className="text-sm">
                    <div className="font-medium text-gray-700">{agent.name}</div>
                    <div className="text-xs text-gray-500">Realizado</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex" style={{ minWidth: `${timelineDays.length * 120}px` }}>
            {timelineDays.map((day, dayIndex) => (
              <div key={dayIndex} className="flex-1 min-w-0 border-r last:border-r-0" style={{ minWidth: '120px' }}>
                {filteredAgents.map((agent) => {
                  const plannedSchedules = getSchedulesForAgent(agent.id, day, 'planned');
                  const actualSchedules = getSchedulesForAgent(agent.id, day, 'actual');
                  const workingHours = getWorkingHours(agent.id);
                  
                  return (
                    <div key={agent.id} className="border-b">
                      {/* Planned row - opaque background */}
                      <div className="h-12 relative bg-white border-b border-gray-100">
                        {/* Working hours background */}
                        <div className="absolute inset-0 bg-green-50"></div>
                        
                        {/* Scheduled blocks */}
                        {plannedSchedules.map((schedule) => {
                          const activityType = getActivityType(schedule.activityTypeId);
                          const position = getSchedulePosition(schedule, day);
                          
                          return (
                            <div
                              key={schedule.id}
                              className={`absolute top-1 h-10 rounded text-white text-xs p-1 cursor-pointer hover:opacity-80 ${getPriorityColor(schedule.priority)}`}
                              style={{
                                left: `${(position.left / (17 * 60)) * 100}%`,
                                width: `${Math.min((position.width / (17 * 60)) * 100, 95)}%`,
                                opacity: 0.9 // Opaque for planned
                              }}
                              onClick={() => onScheduleClick(schedule)}
                              title={`${schedule.title} - ${format(parseISO(schedule.startDateTime), 'HH:mm')} às ${format(parseISO(schedule.endDateTime), 'HH:mm')}`}
                            >
                              <div className="truncate font-medium">{schedule.title}</div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Actual row - clear background */}
                      <div className="h-12 relative bg-gray-50">
                        {/* Working hours background */}
                        <div className="absolute inset-0 bg-blue-50"></div>
                        
                        {/* Scheduled blocks */}
                        {actualSchedules.map((schedule) => {
                          const activityType = getActivityType(schedule.activityTypeId);
                          const position = getSchedulePosition(schedule, day);
                          
                          return (
                            <div
                              key={schedule.id}
                              className={`absolute top-1 h-10 rounded text-white text-xs p-1 cursor-pointer hover:opacity-80 ${getPriorityColor(schedule.priority)}`}
                              style={{
                                left: `${(position.left / (17 * 60)) * 100}%`,
                                width: `${Math.min((position.width / (17 * 60)) * 100, 95)}%`,
                                opacity: 0.4 // Clear for actual
                              }}
                              onClick={() => onScheduleClick(schedule)}
                              title={`${schedule.title} - ${format(parseISO(schedule.startDateTime), 'HH:mm')} às ${format(parseISO(schedule.endDateTime), 'HH:mm')}`}
                            >
                              <div className="truncate font-medium">{schedule.title}</div>
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
  );
};

export default TimelineScheduleGrid;