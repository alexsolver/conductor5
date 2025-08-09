import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Users, Plus, Edit, Trash2, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Define the new interface for weekly schedules
interface DaySchedule {
  startTime: string;
  endTime: string;
  breakDurationMinutes: number;
}

interface WeeklySchedule {
  [key: number]: DaySchedule; // Key is the day of the week (0 for Sunday, 6 for Saturday)
}

interface WorkSchedule {
  id: string;
  userId: string;
  scheduleType: '5x2' | '6x1' | '12x36' | 'shift' | 'flexible' | 'intermittent';
  startDate: string;
  endDate?: string;
  workDays: number[];
  startTime?: string; // Optional if using weeklySchedule
  endTime?: string; // Optional if using weeklySchedule
  breakDurationMinutes?: number; // Optional if using weeklySchedule
  isActive: boolean;
  userName?: string;
  useWeeklySchedule?: boolean;
  weeklySchedule?: WeeklySchedule;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

import { SCHEDULE_TYPE_OPTIONS, SCHEDULE_TYPE_LABELS } from '@shared/schedule-types';

// Use shared definitions for consistency
const scheduleTypeLabels = SCHEDULE_TYPE_LABELS;
const scheduleTypeOptions = SCHEDULE_TYPE_OPTIONS;

const weekDays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' }
];

// Component for configuring weekly schedules
function WeeklyScheduleForm({ weeklySchedule, workDays, onWeeklyScheduleChange, onWorkDaysChange }: {
  weeklySchedule: WeeklySchedule;
  workDays: number[];
  onWeeklyScheduleChange: (schedule: WeeklySchedule) => void;
  onWorkDaysChange: (days: number[]) => void;
}) {
  const handleDayChange = (dayValue: number, field: keyof DaySchedule, value: string) => {
    const newWeeklySchedule = {
      ...weeklySchedule,
      [dayValue]: {
        ...(weeklySchedule[dayValue] || { startTime: '08:00', endTime: '17:00', breakDurationMinutes: 60 }),
        [field]: value,
      },
    };
    onWeeklyScheduleChange(newWeeklySchedule);
  };

  const handleDayToggle = (dayValue: number) => {
    const currentIndex = workDays.indexOf(dayValue);
    const newWorkDays = [...workDays];

    if (currentIndex > -1) {
      newWorkDays.splice(currentIndex, 1);
      // Optionally remove the schedule for this day if it exists
      const { [dayValue]: _, ...rest } = weeklySchedule;
      onWeeklyScheduleChange(rest);
    } else {
      newWorkDays.push(dayValue);
      // Ensure a default entry exists if it's the first time for this day
      if (!weeklySchedule[dayValue]) {
        onWeeklyScheduleChange({
          ...weeklySchedule,
          [dayValue]: { startTime: '08:00', endTime: '17:00', breakDurationMinutes: 60 }
        });
      }
    }
    onWorkDaysChange(newWorkDays);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {weekDays.map(day => (
          <Button
            key={day.value}
            type="button"
            variant={workDays.includes(day.value) ? "default" : "outline"}
            size="sm"
            onClick={() => handleDayToggle(day.value)}
          >
            {day.label}
          </Button>
        ))}
      </div>
      {workDays.sort((a, b) => a - b).map(dayValue => (
        <div key={dayValue} className="border rounded-md p-4 bg-gray-50">
          <h4 className="text-lg font-semibold mb-3">{weekDays.find(d => d.value === dayValue)?.label}</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor={`weekly-start-time-${dayValue}`}>Entrada</Label>
              <Input
                id={`weekly-start-time-${dayValue}`}
                type="time"
                value={weeklySchedule[dayValue]?.startTime || '08:00'}
                onChange={(e) => handleDayChange(dayValue, 'startTime', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`weekly-end-time-${dayValue}`}>Saída</Label>
              <Input
                id={`weekly-end-time-${dayValue}`}
                type="time"
                value={weeklySchedule[dayValue]?.endTime || '17:00'}
                onChange={(e) => handleDayChange(dayValue, 'endTime', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`weekly-break-${dayValue}`}>Pausa (min)</Label>
              <Input
                id={`weekly-break-${dayValue}`}
                type="number"
                value={weeklySchedule[dayValue]?.breakDurationMinutes || 60}
                onChange={(e) => handleDayChange(dayValue, 'breakDurationMinutes', e.target.value)}
                min="0"
                max="480"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


import { WorkScheduleErrorBoundary } from '@/components/WorkScheduleErrorBoundary';

function WorkSchedulesContent() {
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Updated formData with new states for weekly schedules
  const [formData, setFormData] = useState({
    userId: '',
    scheduleType: '5x2',
    startDate: '',
    endDate: '',
    workDays: [1, 2, 3, 4, 5], // Default to weekdays
    startTime: '08:00',
    endTime: '17:00',
    breakDurationMinutes: 60,
    isActive: true,
    useWeeklySchedule: false, // New state for toggling weekly schedule
    weeklySchedule: {} as WeeklySchedule, // New state for weekly schedule data
    saveAsTemplate: false, // New field for template saving
    templateName: '', // Template name when saving as template
    templateDescription: '' // Template description when saving as template
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetching all schedules
  const { data: schedulesData, isLoading: schedulesLoading, error: schedulesError } = useQuery({
    queryKey: ['/api/timecard/work-schedules'],
    queryFn: async () => {
      console.log('[FRONTEND-QA] Fetching work schedules...');
      const response = await apiRequest('GET', '/api/timecard/work-schedules');
      const data = await response.json();
      console.log('[FRONTEND-QA] API Response:', data);
      return data;
    },
    staleTime: 1000, // Reduced for faster updates during development
    retry: 3,
    retryDelay: 1000
  });

  // Fetching users/employees via the admin endpoint
  const { data: usersData, error: usersError } = useQuery({
    queryKey: ['/api/tenant-admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tenant-admin/users');
      const data = await response.json();
      console.log('[USERS-DEBUG] Users data received:', data);
      return data;
    },
    retry: 3,
    retryDelay: 1000
  });

  // Fetching custom schedule types
  const { data: scheduleTypesData, error: templatesError } = useQuery({
    queryKey: ['/api/timecard/schedule-templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/schedule-templates');
      const data = await response.json();
      console.log('[TEMPLATES-DEBUG] Schedule templates loaded:', data);
      return data;
    },
    retry: 3,
    retryDelay: 1000
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/timecard/work-schedules', data);
      console.log('[SCHEDULE-CREATE] Response:', response);
      return response;
    },
    onSuccess: async () => {
      toast({
        title: 'Escala criada!',
        description: 'A escala de trabalho foi criada com sucesso.',
      });
      await queryClient.invalidateQueries({ queryKey: ['/api/timecard/work-schedules'] });
      await queryClient.refetchQueries({ queryKey: ['/api/timecard/work-schedules'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('[SCHEDULE-CREATE-ERROR]:', error);
      toast({
        title: 'Erro ao criar escala',
        description: error.message || 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    },
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/timecard/work-schedules/${id}`, data);
      console.log('[SCHEDULE-UPDATE] Response:', response);
      return response;
    },
    onSuccess: async () => {
      toast({
        title: 'Escala atualizada!',
        description: 'A escala de trabalho foi atualizada com sucesso.',
      });
      await queryClient.invalidateQueries({ queryKey: ['/api/timecard/work-schedules'] });
      await queryClient.refetchQueries({ queryKey: ['/api/timecard/work-schedules'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('[SCHEDULE-UPDATE-ERROR]:', error);
      toast({
        title: 'Erro ao atualizar escala',
        description: error.message || 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/timecard/work-schedules/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Escala excluída!',
        description: 'A escala foi removida com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/work-schedules'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir escala',
        description: error.message || 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest('POST', '/api/timecard/schedule-templates', templateData);
      console.log('[TEMPLATE-CREATE] Response:', response);
      return response;
    },
    onSuccess: async () => {
      toast({
        title: 'Template criado!',
        description: 'O template da escala foi salvo com sucesso.',
      });
      await queryClient.invalidateQueries({ queryKey: ['/api/timecard/schedule-templates'] });
      await queryClient.refetchQueries({ queryKey: ['/api/timecard/schedule-templates'] });
    },
    onError: (error: any) => {
      console.error('[TEMPLATE-CREATE-ERROR]:', error);
      toast({
        title: 'Erro ao criar template',
        description: error.message || 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    },
  });

  // Safe data processing with proper type checking
  let schedules: WorkSchedule[] = [];

  console.log('[FRONTEND-DEBUG] Processing schedules data:', schedulesData);
  console.log('[FRONTEND-DEBUG] Data type:', typeof schedulesData);
  console.log('[FRONTEND-DEBUG] Is array:', Array.isArray(schedulesData));

  try {
    if (Array.isArray(schedulesData)) {
      console.log('[FRONTEND-DEBUG] Processing as direct array, length:', schedulesData.length);
      schedules = schedulesData.map(schedule => {
        try {
          return {
            ...schedule,
            // Ensure workDays is always an array
            workDays: Array.isArray(schedule.workDays) ? schedule.workDays : [1,2,3,4,5],
            // Ensure required fields have defaults
            userName: schedule.userName || 'Usuário',
            scheduleType: schedule.scheduleType || '5x2',
            breakDurationMinutes: schedule.breakDurationMinutes || 60,
            isActive: schedule.isActive ?? true,
            useWeeklySchedule: schedule.useWeeklySchedule ?? false,
            weeklySchedule: schedule.weeklySchedule || {},
            // Safe date handling
            createdAt: schedule.createdAt ? new Date(schedule.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: schedule.updatedAt ? new Date(schedule.updatedAt).toISOString() : new Date().toISOString(),
            startDate: schedule.startDate ? new Date(schedule.startDate).toISOString().split('T')[0] : null,
            endDate: schedule.endDate ? new Date(schedule.endDate).toISOString().split('T')[0] : null
          };
        } catch (err) {
          console.error('Error processing schedule:', err, schedule);
          return {
            ...schedule,
            workDays: [1,2,3,4,5],
            userName: 'Usuário',
            scheduleType: '5x2',
            breakDurationMinutes: 60,
            isActive: true,
            useWeeklySchedule: false,
            weeklySchedule: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            startDate: null,
            endDate: null
          };
        }
      });
    } else if (schedulesData && typeof schedulesData === 'object') {
      console.log('[FRONTEND-DEBUG] Processing as object, looking for schedules/data property');
      const rawSchedules = (schedulesData as any).schedules || (schedulesData as any).data || schedulesData;
      console.log('[FRONTEND-DEBUG] Found raw schedules:', rawSchedules);
      if (Array.isArray(rawSchedules)) {
        schedules = rawSchedules.map(schedule => {
          try {
            return {
              ...schedule,
              workDays: Array.isArray(schedule.workDays) ? schedule.workDays : [1,2,3,4,5],
              userName: schedule.userName || 'Usuário',
              scheduleType: schedule.scheduleType || '5x2',
              breakDurationMinutes: schedule.breakDurationMinutes || 60,
              isActive: schedule.isActive ?? true,
              useWeeklySchedule: schedule.useWeeklySchedule ?? false,
              weeklySchedule: schedule.weeklySchedule || {},
              // Safe date handling
              createdAt: schedule.createdAt ? new Date(schedule.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: schedule.updatedAt ? new Date(schedule.updatedAt).toISOString() : new Date().toISOString(),
              startDate: schedule.startDate ? new Date(schedule.startDate).toISOString().split('T')[0] : null,
              endDate: schedule.endDate ? new Date(schedule.endDate).toISOString().split('T')[0] : null
            };
          } catch (err) {
            console.error('Error processing schedule:', err, schedule);
            return {
              ...schedule,
              workDays: [1,2,3,4,5],
              userName: 'Usuário',
              scheduleType: '5x2',
              breakDurationMinutes: 60,
              isActive: true,
              useWeeklySchedule: false,
              weeklySchedule: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              startDate: null,
              endDate: null
            };
          }
        });
      }
    }
    console.log('[FRONTEND-DEBUG] Final processed schedules:', schedules.length);
  } catch (error) {
    console.error('[QA-ERROR] Error processing schedules data:', error);
    schedules = [];
  }

  const users = Array.isArray(usersData) ? usersData : (usersData?.users || usersData?.members || []);

  // Debug information for troubleshooting
  if (process.env.NODE_ENV === 'development') {
    console.log('Work schedules loaded:', schedules.length);
    console.log('Users available:', users.length);
    console.log('Schedule templates:', scheduleTypesData?.templates?.length || 0);
    console.log('Active templates:', scheduleTypesData?.templates?.filter((t: any) => t.isActive)?.length || 0);
    console.log('Raw users data:', usersData);
    console.log('Raw templates data:', scheduleTypesData);
    console.log('Active templates list:', scheduleTypesData?.templates?.filter((t: any) => t.isActive));
    console.log('Custom templates (excluding defaults):', scheduleTypesData?.templates?.filter((t: any) => t.isActive && !['5x2', '6x1', '12x36'].includes(t.name)));
  }

  if (templatesError) {
    console.error('Templates fetch error:', templatesError);
  }

  if (usersError) {
    console.error('Users fetch error:', usersError);
  }

  // Add error state handling
  if (schedulesError) {
    console.error('[QA-DEBUG] Schedules fetch error:', schedulesError);
  }

  const resetForm = () => {
    setSelectedSchedule(null);
    setFormData({
      userId: '',
      scheduleType: '5x2',
      startDate: '',
      endDate: '',
      workDays: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '17:00',
      breakDurationMinutes: 60,
      isActive: true,
      useWeeklySchedule: false,
      weeklySchedule: {},
      saveAsTemplate: false,
      templateName: '',
      templateDescription: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formData.userId) {
      toast({ title: 'Erro de validação', description: 'Selecione um funcionário.', variant: 'destructive' });
      return;
    }
    if (!formData.startDate) {
      toast({ title: 'Erro de validação', description: 'Data de início é obrigatória.', variant: 'destructive' });
      return;
    }
    if (!formData.useWeeklySchedule && (!formData.startTime || !formData.endTime)) {
      toast({ title: 'Erro de validação', description: 'Horários de entrada e saída são obrigatórios para escalas fixas.', variant: 'destructive' });
      return;
    }
    if (!formData.useWeeklySchedule && formData.startTime >= formData.endTime) {
      toast({ title: 'Erro de validação', description: 'Horário de saída deve ser posterior ao de entrada.', variant: 'destructive' });
      return;
    }
    if (formData.workDays.length === 0) {
      toast({ title: 'Erro de validação', description: 'Selecione pelo menos um dia da semana.', variant: 'destructive' });
      return;
    }
    if (formData.saveAsTemplate && !formData.templateName.trim()) {
      toast({ title: 'Erro de validação', description: 'Nome do template é obrigatório quando salvar como template.', variant: 'destructive' });
      return;
    }

    // Prepare data for API
    const apiData = {
      userId: formData.userId,
      scheduleType: formData.scheduleType as '5x2' | '6x1' | '12x36' | 'shift' | 'flexible' | 'intermittent',
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      workDays: Array.from(new Set(formData.workDays)), // Remove duplicates
      isActive: formData.isActive,
      useWeeklySchedule: formData.useWeeklySchedule,
      ...(formData.useWeeklySchedule
        ? { weeklySchedule: formData.weeklySchedule }
        : {
            startTime: formData.startTime,
            endTime: formData.endTime,
            breakDurationMinutes: Math.max(0, Math.min(480, formData.breakDurationMinutes)), // Validate range
          }),
    };

    console.log('[QA-DEBUG] Submitting schedule data:', apiData);

    // If saving as template, create template first
    if (formData.saveAsTemplate && !selectedSchedule) {
      const templateData = {
        name: formData.templateName.trim(),
        description: formData.templateDescription.trim() || `Template baseado em escala ${formData.scheduleType}`,
        scheduleType: formData.scheduleType,
        category: 'custom',
        workDays: Array.from(new Set(formData.workDays)),
        useWeeklySchedule: formData.useWeeklySchedule,
        ...(formData.useWeeklySchedule
          ? { weeklySchedule: formData.weeklySchedule }
          : {
              startTime: formData.startTime,
              endTime: formData.endTime,
              breakDurationMinutes: Math.max(0, Math.min(480, formData.breakDurationMinutes)),
            }),
        isActive: true
      };

      createTemplateMutation.mutate(templateData);
    }

    if (selectedSchedule) {
      updateScheduleMutation.mutate({
        id: selectedSchedule.id,
        data: apiData
      });
    } else {
      createScheduleMutation.mutate(apiData);
    }
  };

  const handleEdit = (schedule: WorkSchedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      userId: schedule.userId,
      scheduleType: schedule.scheduleType,
      startDate: schedule.startDate ? schedule.startDate.split('T')[0] : '',
      endDate: schedule.endDate ? schedule.endDate.split('T')[0] : '',
      workDays: schedule.workDays || [],
      startTime: schedule.startTime || '08:00',
      endTime: schedule.endTime || '17:00',
      breakDurationMinutes: schedule.breakDurationMinutes || 60,
      isActive: schedule.isActive,
      useWeeklySchedule: schedule.useWeeklySchedule || false,
      weeklySchedule: schedule.weeklySchedule || {},
      saveAsTemplate: false,
      templateName: '',
      templateDescription: ''
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta escala?')) {
      deleteScheduleMutation.mutate(id);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um funcionário.',
        variant: 'destructive',
      });
      return;
    }

    const bulkScheduleData = {
      scheduleType: formData.scheduleType,
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      workDays: formData.workDays,
      useWeeklySchedule: formData.useWeeklySchedule,
      ...(formData.useWeeklySchedule
        ? { weeklySchedule: formData.weeklySchedule }
        : {
            startTime: formData.startTime,
            endTime: formData.endTime,
            breakDurationMinutes: formData.breakDurationMinutes,
          }),
    };

    try {
      await apiRequest('POST', '/api/timecard/work-schedules/bulk-assign', {
        userIds: selectedUsers,
        scheduleData: bulkScheduleData
      });

      queryClient.invalidateQueries({ queryKey: ['/api/timecard/work-schedules'] });
      setBulkAssignOpen(false);
      setSelectedUsers([]);

      toast({
        title: 'Sucesso!',
        description: `Escalas atribuídas para ${selectedUsers.length} funcionários.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro na atribuição em lote',
        description: error?.message || 'Erro interno',
        variant: 'destructive',
      });
    }
  };

  const getWorkDaysText = (workDays: number[] | null | undefined) => {
    try {
      if (!workDays || !Array.isArray(workDays) || workDays.length === 0) return 'Não definido';
      return workDays.map(day => weekDays.find(wd => wd.value === day)?.label).filter(Boolean).join(', ');
    } catch (error) {
      console.error('Error processing workDays:', error, workDays);
      return 'Erro na formatação';
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500">Ativa</Badge>
    ) : (
      <Badge variant="secondary">Inativa</Badge>
    );
  };

  if (schedulesLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando escalas...</div>
        </div>
      </div>
    );
  }

  if (schedulesError) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-2">Erro ao carregar escalas</div>
            <div className="text-sm text-gray-600">{schedulesError.message}</div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper to get schedule details for display, handling weekly schedules
  const getScheduleDetails = (schedule: WorkSchedule) => {
    if (schedule.useWeeklySchedule && schedule.weeklySchedule) {
      const days = Object.keys(schedule.weeklySchedule)
        .map(Number)
        .sort((a, b) => a - b)
        .map(dayValue => weekDays.find(wd => wd.value === dayValue)?.label)
        .filter(Boolean)
        .join(', ');
      return `Horários variados por dia: ${days}`;
    } else {
      return `${schedule.startTime} - ${schedule.endTime} (${schedule.breakDurationMinutes} min pausa)`;
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Escalas de Trabalho</h1>
        <div className="space-x-2">
          <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Atribuir em Lote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Atribuição em Lote</DialogTitle>
                <DialogDescription>
                  Selecione os funcionários e configure a escala que será aplicada para todos.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Funcionários</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                    {users.map((user: User) => (
                      <div key={user.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={user.id}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                        />
                        <Label htmlFor={user.id} className="cursor-pointer">
                          {user.firstName} {user.lastName}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bulk-schedule-type">Tipo de Escala</Label>
                    <Select value={formData.scheduleType} onValueChange={(value) => setFormData(prev => ({ ...prev, scheduleType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {scheduleTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bulk-start-date">Data de Início</Label>
                    <Input
                      id="bulk-start-date"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setBulkAssignOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleBulkAssign}>
                    Atribuir para {selectedUsers.length} funcionários
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Escala
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedSchedule ? 'Editar Escala' : 'Nova Escala de Trabalho'}
                </DialogTitle>
                <DialogDescription>
                  {selectedSchedule
                    ? 'Modifique os dados da escala de trabalho existente.'
                    : 'Configure uma nova escala de trabalho para o funcionário selecionado.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userId">Funcionário</Label>
                    <Select value={formData.userId} onValueChange={(value) => setFormData({ ...formData, userId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName || user.first_name || user.name || ''} {user.lastName || user.last_name || ''} - {user.role || 'Funcionário'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="scheduleType">Tipo de Escala</Label>
                    <Select value={formData.scheduleType} onValueChange={(value) => setFormData({ ...formData, scheduleType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {scheduleTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">Data de Fim (opcional)</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* New section for weekly schedule toggle and form */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="useWeeklySchedule"
                      checked={formData.useWeeklySchedule}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({ ...prev, useWeeklySchedule: checked, workDays: checked ? [] : [1, 2, 3, 4, 5] }));
                        if (!checked) {
                          setFormData(prev => ({ ...prev, weeklySchedule: {} })); // Clear weekly schedule when toggled off
                        }
                      }}
                    />
                    <Label htmlFor="useWeeklySchedule">Horários diferentes por dia da semana</Label>
                  </div>

                  {formData.useWeeklySchedule ? (
                    <WeeklyScheduleForm
                      weeklySchedule={formData.weeklySchedule}
                      workDays={formData.workDays}
                      onWeeklyScheduleChange={(schedule) => setFormData(prev => ({ ...prev, weeklySchedule: schedule }))}
                      onWorkDaysChange={(days) => setFormData(prev => ({ ...prev, workDays: days }))}
                    />
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startTime">Horário de Entrada</Label>
                          <Input
                            id="startTime"
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="endTime">Horário de Saída</Label>
                          <Input
                            id="endTime"
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="breakDurationMinutes">Pausa (minutos)</Label>
                        <Input
                          id="breakDurationMinutes"
                          type="number"
                          value={formData.breakDurationMinutes}
                          onChange={(e) => setFormData({ ...formData, breakDurationMinutes: parseInt(e.target.value) })}
                          min="0"
                          max="480"
                        />
                      </div>

                      <div>
                        <Label>Dias da Semana</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {weekDays.map((day) => (
                            <Button
                              key={day.value}
                              type="button"
                              variant={formData.workDays.includes(day.value) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const newWorkDays = formData.workDays.includes(day.value)
                                  ? formData.workDays.filter(d => d !== day.value)
                                  : [...formData.workDays, day.value];
                                setFormData({ ...formData, workDays: newWorkDays });
                              }}
                            >
                              {day.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Save as Template Section */}
                {!selectedSchedule && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="saveAsTemplate"
                        checked={formData.saveAsTemplate}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, saveAsTemplate: checked as boolean }))}
                      />
                      <Label htmlFor="saveAsTemplate" className="text-sm font-medium">
                        Salvar configuração como template
                      </Label>
                    </div>

                    {formData.saveAsTemplate && (
                      <div className="grid grid-cols-1 gap-4 pl-6">
                        <div>
                          <Label htmlFor="templateName">Nome do Template *</Label>
                          <Input
                            id="templateName"
                            type="text"
                            placeholder="Ex: Escala Comercial Personalizada"
                            value={formData.templateName}
                            onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
                            required={formData.saveAsTemplate}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="templateDescription">Descrição (opcional)</Label>
                          <Input
                            id="templateDescription"
                            type="text"
                            placeholder="Descreva quando usar este template..."
                            value={formData.templateDescription}
                            onChange={(e) => setFormData(prev => ({ ...prev, templateDescription: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending || createTemplateMutation.isPending}
                  >
                    {(createScheduleMutation.isPending || updateScheduleMutation.isPending || createTemplateMutation.isPending) ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {schedules.length > 0 ? (
          schedules.map((schedule: WorkSchedule) => (
            <Card key={schedule.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    {/* Header with name and badges */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <h3 className="font-semibold text-lg">{schedule.userName || 'Usuário Não Identificado'}</h3>
                      </div>
                      {getStatusBadge(schedule.isActive)}
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {scheduleTypeLabels[schedule.scheduleType] || schedule.scheduleType}
                      </Badge>
                    </div>

                    {/* Main information organized */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Schedule Type Details */}
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="text-xs text-gray-500">Jornada</div>
                          <div className="font-medium">{getScheduleDetails(schedule)}</div>
                        </div>
                      </div>

                      {/* Work Days */}
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="text-xs text-gray-500">Dias da Semana</div>
                          <div className="font-medium text-sm">
                            {schedule.useWeeklySchedule ? getWorkDaysText(Object.keys(schedule.weeklySchedule || {}).map(Number)) : getWorkDaysText(schedule.workDays)}
                          </div>
                        </div>
                      </div>

                      {/* Start Date */}
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="text-xs text-gray-500">Data de Início</div>
                          <div className="font-medium">
                            {schedule.startDate ? format(new Date(schedule.startDate), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* End Date */}
                      {schedule.endDate && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                          <Calendar className="h-4 w-4 text-gray-600" />
                          <div>
                            <div className="text-xs text-gray-500">Data de Fim</div>
                            <div className="font-medium">
                              {format(new Date(schedule.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                      className="hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(schedule.id)}
                      disabled={deleteScheduleMutation.isPending}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Nenhuma escala configurada</h3>
              <p className="text-gray-600 mb-4">
                Configure escalas de trabalho para gerenciar jornadas dos funcionários
              </p>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Escala
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function WorkSchedules() {
  return (
    <WorkScheduleErrorBoundary>
      <WorkSchedulesContent />
    </WorkScheduleErrorBoundary>
  );
}