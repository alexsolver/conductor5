import React, { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';

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
  // Generate time slots (8:00 to 18:00 every hour)
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Generate week days starting from Monday
  const weekStart = startOfWeek(selectedDate, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getActivityType = (activityTypeId: string) => {
    return activityTypes.find(type => type.id === activityTypeId);
  };

  const getSchedulesForAgentAndSlot = (agentId: string, date: Date, timeSlot: string) => {
    return schedules.filter(schedule => {
      const scheduleDate = parseISO(schedule.startDateTime);
      const scheduleHour = format(scheduleDate, 'HH:00');
      return (
        schedule.agentId === agentId &&
        isSameDay(scheduleDate, date) &&
        scheduleHour === timeSlot
      );
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 border-blue-300';
      case 'in_progress': return 'bg-yellow-100 border-yellow-300';
      case 'completed': return 'bg-green-100 border-green-300';
      case 'cancelled': return 'bg-red-100 border-red-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-4 border-red-500';
      case 'high': return 'border-l-4 border-orange-500';
      case 'medium': return 'border-l-4 border-yellow-500';
      case 'low': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Header with days */}
      <div className="grid grid-cols-8 border-b">
        <div className="p-4 bg-gray-50 border-r font-medium">
          Agente / Horário
        </div>
        {weekDays.map((day, index) => (
          <div key={index} className="p-4 bg-gray-50 border-r last:border-r-0 text-center">
            <div className="font-medium">{format(day, 'EEE', { locale: ptBR })}</div>
            <div className="text-sm text-gray-600">{format(day, 'dd/MM', { locale: ptBR })}</div>
          </div>
        ))}
      </div>

      {/* Grid with time slots */}
      <div className="max-h-96 overflow-y-auto">
        {agents.map((agent) => (
          <div key={agent.id}>
            {/* Agent header */}
            <div className="grid grid-cols-8 border-b bg-gray-25">
              <div className="p-3 bg-gray-50 border-r flex items-center">
                <div className="flex items-center space-x-2">
                  {agent.profileImageUrl ? (
                    <img 
                      src={agent.profileImageUrl} 
                      alt={agent.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      {agent.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-sm">{agent.name}</div>
                    <div className="text-xs text-gray-500">{agent.email}</div>
                  </div>
                </div>
              </div>
              {weekDays.map((day, dayIndex) => (
                <div key={dayIndex} className="p-2 border-r last:border-r-0 bg-gray-25">
                  <div className="text-xs text-gray-500 text-center">
                    {schedules.filter(s => 
                      s.agentId === agent.id && 
                      isSameDay(parseISO(s.startDateTime), day)
                    ).length} agend.
                  </div>
                </div>
              ))}
            </div>

            {/* Time slots for this agent */}
            {timeSlots.map((timeSlot) => (
              <div key={`${agent.id}-${timeSlot}`} className="grid grid-cols-8 border-b last:border-b-0">
                <div className="p-2 bg-gray-50 border-r text-sm text-gray-600 flex items-center justify-center">
                  {timeSlot}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const daySchedules = getSchedulesForAgentAndSlot(agent.id, day, timeSlot);
                  return (
                    <div 
                      key={dayIndex} 
                      className="p-1 border-r last:border-r-0 min-h-[60px] cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => !daySchedules.length && onTimeSlotClick(day, timeSlot, agent.id)}
                    >
                      {daySchedules.map((schedule) => {
                        const activityType = getActivityType(schedule.activityTypeId);
                        return (
                          <div
                            key={schedule.id}
                            className={`
                              p-2 rounded text-xs cursor-pointer transition-all hover:shadow-sm
                              ${getStatusColor(schedule.status)}
                              ${getPriorityBorder(schedule.priority)}
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              onScheduleClick(schedule);
                            }}
                          >
                            <div className="font-medium truncate mb-1">{schedule.title}</div>
                            <div className="flex items-center text-xs text-gray-600 mb-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {format(parseISO(schedule.startDateTime), 'HH:mm', { locale: ptBR })} - 
                              {format(parseISO(schedule.endDateTime), 'HH:mm', { locale: ptBR })}
                            </div>
                            {activityType && (
                              <div className="flex items-center">
                                <div 
                                  className="w-2 h-2 rounded-full mr-1"
                                  style={{ backgroundColor: activityType.color }}
                                />
                                <span className="text-xs truncate">{activityType.name}</span>
                              </div>
                            )}
                            {schedule.locationAddress && (
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="truncate">{schedule.locationAddress.split(',')[0]}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyScheduleGrid;