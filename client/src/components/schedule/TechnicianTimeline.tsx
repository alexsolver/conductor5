import React from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Clock, Coffee } from 'lucide-react';

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

interface Schedule {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  agentId: string;
}

interface Technician {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface TechnicianTimelineProps {
  technician: Technician;
  workSchedule: WorkSchedule;
  selectedDate: Date;
  schedules: Schedule[];
}

const TechnicianTimeline: React.FC<TechnicianTimelineProps> = ({
  technician,
  workSchedule,
  selectedDate,
  schedules = []
}) => {
  // Verificar se o técnico trabalha no dia selecionado
  const dayOfWeek = selectedDate.getDay(); // 0 = domingo, 1 = segunda, etc.
  const worksToday = workSchedule.workDays.includes(dayOfWeek);

  if (!worksToday) {
    return (
      <div className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg">
        <Clock className="h-4 w-4 inline mr-2" />
        Não trabalha neste dia
      </div>
    );
  }

  // Gerar horários de 8:00 às 18:00 (pode ser ajustado conforme necessário)
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = parseInt(workSchedule.startTime.split(':')[0]);
    const endHour = parseInt(workSchedule.endTime.split(':')[0]);
    
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(":00`);
      if (hour < endHour) {
        slots.push(":30`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Verificar se um horário está ocupado
  const isTimeSlotOccupied = (time: string) => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const slotDateTime = ":00`;
    
    return schedules.some(schedule => {
      const scheduleStart = new Date(schedule.startDateTime);
      const scheduleEnd = new Date(schedule.endDateTime);
      const slotTime = new Date(slotDateTime);
      
      return slotTime >= scheduleStart && slotTime < scheduleEnd;
    });
  };

  // Verificar se está no horário de intervalo
  const isBreakTime = (time: string) => {
    if (!workSchedule.breakStart || !workSchedule.breakEnd) return false;
    return time >= workSchedule.breakStart && time <= workSchedule.breakEnd;
  };

  return (
    <div className="py-2">
      {/* Informações da jornada */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {workSchedule.startTime} - {workSchedule.endTime}
        </span>
        {workSchedule.breakStart && workSchedule.breakEnd && (
          <span className="flex items-center gap-1">
            <Coffee className="h-3 w-3" />
            Intervalo: {workSchedule.breakStart} - {workSchedule.breakEnd}
          </span>
        )}
      </div>

      {/* Timeline visual */}
      <div className="flex flex-wrap gap-1">
        {timeSlots.map((time) => {
          const isOccupied = isTimeSlotOccupied(time);
          const isBreak = isBreakTime(time);
          
          let slotClass = "px-2 py-1 text-xs rounded border transition-colors cursor-pointer ";
          let slotContent = time;
          
          if (isBreak) {
            slotClass += "bg-orange-100 border-orange-300 text-orange-700";
            slotContent = "Intervalo";
          } else if (isOccupied) {
            slotClass += "bg-red-100 border-red-300 text-red-700";
          } else {
            slotClass += "bg-green-100 border-green-300 text-green-700 hover:bg-green-200";
          }

          return (
            <div
              key={time}
              className={slotClass}
              title={"
            >
              {isBreak ? '☕' : slotContent}
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-gray-600">Disponível</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
          <span className="text-gray-600">Ocupado</span>
        </div>
        {workSchedule.breakStart && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
            <span className="text-gray-600">Intervalo</span>
          </div>
        )}
      </div>

      {/* Agendamentos do dia */}
      {schedules.length > 0 && (
        <div className="mt-3 pt-2 border-t">
          <h5 className="text-xs font-medium text-gray-700 mb-1">Agendamentos de hoje:</h5>
          <div className="space-y-1">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                <span className="font-medium">{schedule.title}</span>
                <span className="text-gray-500">
                  {format(new Date(schedule.startDateTime), 'HH:mm')} - {format(new Date(schedule.endDateTime), 'HH:mm')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianTimeline;