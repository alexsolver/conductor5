
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface DaySchedule {
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  breakDurationMinutes?: number;
}

interface WeeklySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

interface WeeklyScheduleFormProps {
  weeklySchedule: WeeklySchedule;
  workDays: string[];
  onWeeklyScheduleChange: (schedule: WeeklySchedule) => void;
  onWorkDaysChange: (days: string[]) => void;
}

const dayNames = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira', 
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const WeeklyScheduleForm: React.FC<WeeklyScheduleFormProps> = ({
  weeklySchedule,
  workDays,
  onWeeklyScheduleChange,
  onWorkDaysChange
}) => {
  const handleDayToggle = (day: string, enabled: boolean) => {
    if (enabled) {
      // Adicionar dia aos workDays e criar schedule padrão
      const newWorkDays = [...workDays, day];
      onWorkDaysChange(newWorkDays);
      
      const newSchedule = {
        ...weeklySchedule,
        [day]: {
          startTime: '08:00',
          endTime: '17:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          breakDurationMinutes: 60
        }
      };
      onWeeklyScheduleChange(newSchedule);
    } else {
      // Remover dia dos workDays e do schedule
      const newWorkDays = workDays.filter(d => d !== day);
      onWorkDaysChange(newWorkDays);
      
      const newSchedule = { ...weeklySchedule };
      delete newSchedule[day as keyof WeeklySchedule];
      onWeeklyScheduleChange(newSchedule);
    }
  };

  const handleTimeChange = (day: string, field: string, value: string) => {
    const daySchedule = weeklySchedule[day as keyof WeeklySchedule] || {
      startTime: '08:00',
      endTime: '17:00',
      breakDurationMinutes: 60
    };

    const updatedSchedule = {
      ...weeklySchedule,
      [day]: {
        ...daySchedule,
        [field]: value
      }
    };

    onWeeklyScheduleChange(updatedSchedule);
  };

  return (
    <div className="space-y-4>
      <Label className="text-sm font-medium">Horários por Dia da Semana</Label>
      
      {dayOrder.map((day) => {
        const isWorkDay = workDays.includes(day);
        const schedule = weeklySchedule[day as keyof WeeklySchedule];
        
        return (
          <Card key={day} className="">
            <CardHeader className="pb-3>
              <div className="flex items-center justify-between>
                <CardTitle className="text-sm">{dayNames[day as keyof typeof dayNames]}</CardTitle>
                <Switch
                  checked={isWorkDay}
                  onCheckedChange={(checked) => handleDayToggle(day, checked)}
                />
              </div>
            </CardHeader>
            
            {isWorkDay && schedule && (
              <CardContent className="space-y-3>
                <div className="grid grid-cols-2 gap-3>
                  <div>
                    <Label className="text-xs">Entrada</Label>
                    <Input
                      type="time"
                      value={schedule.startTime || '08:00'}
                      onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Saída</Label>
                    <Input
                      type="time"
                      value={schedule.endTime || '17:00'}
                      onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3>
                  <div>
                    <Label className="text-xs">Início Pausa</Label>
                    <Input
                      type="time"
                      value={schedule.breakStart || '12:00'}
                      onChange={(e) => handleTimeChange(day, 'breakStart', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fim Pausa</Label>
                    <Input
                      type="time"
                      value={schedule.breakEnd || '13:00'}
                      onChange={(e) => handleTimeChange(day, 'breakEnd', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
