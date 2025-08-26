import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query'; // Import added for useQuery
import { apiRequest } from '@/lib/api'; // Import added for apiRequest

// --- Simulação de variáveis e funções que as mudanças referenciam ---
// Estas seriam definidas em um componente pai ou no mesmo arquivo, mas não estão no código original fornecido.
// Para que o código abaixo seja executável, essas definições seriam necessárias.
const formData = { userId: 'user123', startDate: '2023-10-27', workDays: [] }; // Exemplo de formData
const toast = ({ title, description, variant }) => { console.log(`Toast: ${title} - ${description} (${variant})`); };
const updateScheduleMutation = { mutateAsync: async (data) => { console.log("Updating schedule:", data); } };
const createScheduleMutation = { mutateAsync: async (data) => { console.log("Creating schedule:", data); } };
const setIsSubmitting = (value) => { console.log("Setting isSubmitting to:", value); }; // Exemplo de função
const onSuccess = () => { console.log("Operation successful"); };
const schedule = null; // Exemplo: se estiver editando um schedule existente
// --- Fim da simulação ---

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

  // --- Aplicação das mudanças hipotéticas ---
  // ✅ 1QA.MD COMPLIANCE: Fetch users from tenant admin team management
  const { data: usersData } = useQuery({
    queryKey: ['/api/tenant-admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tenant-admin/users');
      return await response.json();
    },
  });
  // --- Fim da aplicação das mudanças hipotéticas ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[WEEKLY-SCHEDULE-FORM] Submitting form data:', formData);

    if (!formData.userId || !formData.startDate) {
      console.log('[WEEKLY-SCHEDULE-FORM] Validation failed - missing required fields');
      toast({
        title: 'Erro de validação',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        ...formData,
        workDays: formData.workDays.length > 0 ? formData.workDays : [1, 2, 3, 4, 5]
      };

      console.log('[WEEKLY-SCHEDULE-FORM] Submitting payload:', payload);

      if (schedule) {
        console.log('[WEEKLY-SCHEDULE-FORM] Updating existing schedule:', schedule.id);
        await updateScheduleMutation.mutateAsync({ id: schedule.id, data: payload });
      } else {
        console.log('[WEEKLY-SCHEDULE-FORM] Creating new schedule');
        await createScheduleMutation.mutateAsync(payload);
      }

      console.log('[WEEKLY-SCHEDULE-FORM] Form submitted successfully');
      onSuccess();
    } catch (error) {
      console.error('[WEEKLY-SCHEDULE-FORM] Error submitting form:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar a escala. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Este é o componente WeeklyScheduleForm. O botão "+Nova Escala" e o formulário associado
          devem estar em um componente pai ou em outro lugar. */}
      <Label className="text-sm font-medium">Horários por Dia da Semana</Label>

      {dayOrder.map((day) => {
        const isWorkDay = workDays.includes(day);
        const schedule = weeklySchedule[day as keyof WeeklySchedule];

        return (
          <Card key={day} className={`${isWorkDay ? '' : 'opacity-50'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{dayNames[day as keyof typeof dayNames]}</CardTitle>
                <Switch
                  checked={isWorkDay}
                  onCheckedChange={(checked) => handleDayToggle(day, checked)}
                />
              </div>
            </CardHeader>

            {isWorkDay && schedule && (
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
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

                <div className="grid grid-cols-2 gap-3">
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