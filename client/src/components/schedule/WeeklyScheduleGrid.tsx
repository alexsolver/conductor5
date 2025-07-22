import React from 'react';
import { format, addDays, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  // Generate 14 days starting from selected date
  const days = Array.from({ length: 14 }, (_, i) => addDays(startDate, i));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-green-500';
      case 'low': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getSchedulesForDay = (agentId: string, day: Date, type: 'planned' | 'actual') => {
    return schedules.filter(schedule => {
      if (!schedule.agentId || !schedule.type || !schedule.startDateTime) return false;
      
      const scheduleStart = parseISO(schedule.startDateTime);
      
      // Match agent ID (handle both UUID formats)
      const agentMatch = schedule.agentId === agentId || 
                        schedule.agentId.startsWith(agentId.substring(0, 8));
      
      return agentMatch &&
             schedule.type === type &&
             scheduleStart.getDate() === day.getDate() &&
             scheduleStart.getMonth() === day.getMonth() &&
             scheduleStart.getFullYear() === day.getFullYear();
    });
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Agenda 14 Dias - {format(startDate, 'dd/MM/yyyy', { locale: ptBR })} até {format(addDays(startDate, 13), 'dd/MM/yyyy', { locale: ptBR })}
        </h3>
      </div>

      {/* Days header */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <div className="w-48 flex-shrink-0 p-3 bg-gray-50 border-r font-medium text-sm">
            Técnicos
          </div>
          {days.map((day, index) => (
            <div key={index} className="flex-1 min-w-20 p-2 text-center border-r last:border-r-0">
              <div className="text-xs font-medium text-gray-900">
                {format(day, 'dd/MM')}
              </div>
              <div className="text-xs text-gray-600">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="overflow-x-auto">
        <div className="flex">
          {/* Left sidebar with agent list */}
          <div className="w-48 flex-shrink-0 border-r bg-gray-50">
            {agents.map((agent) => (
              <div key={agent.id} className="border-b">
                {/* Planned row */}
                <div className="h-12 px-3 py-2 bg-white border-b border-gray-100 flex items-center">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 text-xs">{agent.name}</div>
                    <div className="text-xs text-green-600">Previsto</div>
                  </div>
                </div>
                
                {/* Actual row */}
                <div className="h-12 px-3 py-2 bg-gray-50 flex items-center">
                  <div className="text-sm">
                    <div className="font-medium text-gray-700 text-xs">{agent.name}</div>
                    <div className="text-xs text-blue-600">Realizado</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="flex flex-1">
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="flex-1 min-w-20 border-r last:border-r-0">
                {agents.map((agent) => {
                  const plannedSchedules = getSchedulesForDay(agent.id, day, 'planned');
                  const actualSchedules = getSchedulesForDay(agent.id, day, 'actual');
                  
                  return (
                    <div key={agent.id} className="border-b">
                      {/* Planned row */}
                      <div 
                        className="h-12 relative bg-green-50 border-b border-gray-100 cursor-pointer hover:bg-green-100 p-1"
                        onClick={() => onTimeSlotClick(day, format(day, 'dd/MM'), agent.id)}
                      >
                        {plannedSchedules.map((schedule, index) => (
                          <div
                            key={schedule.id}
                            className={`mb-1 last:mb-0 text-white text-xs rounded px-1 py-0.5 cursor-pointer hover:opacity-80 ${getPriorityColor(schedule.priority)}`}
                            style={{ fontSize: '10px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onScheduleClick(schedule);
                            }}
                            title={`${schedule.title} - ${format(parseISO(schedule.startDateTime), 'HH:mm')}`}
                          >
                            <span className="truncate block">
                              {schedule.title.substring(0, 8)}...
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Actual row */}
                      <div 
                        className="h-12 relative bg-blue-50 cursor-pointer hover:bg-blue-100 p-1"
                        onClick={() => onTimeSlotClick(day, format(day, 'dd/MM'), agent.id)}
                      >
                        {actualSchedules.map((schedule, index) => (
                          <div
                            key={schedule.id}
                            className={`mb-1 last:mb-0 text-white text-xs rounded px-1 py-0.5 cursor-pointer hover:opacity-80 ${getPriorityColor(schedule.priority)}`}
                            style={{ fontSize: '10px', opacity: 0.7 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onScheduleClick(schedule);
                            }}
                            title={`${schedule.title} - ${format(parseISO(schedule.startDateTime), 'HH:mm')}`}
                          >
                            <span className="truncate block">
                              {schedule.title.substring(0, 8)}...
                            </span>
                          </div>
                        ))}
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

export default WeeklyScheduleGrid;