import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  role?: string;
  name?: string; // Added for potential name field if first/last name are not available
}

// Interface for Schedule Template
interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  scheduleType: '5x2' | '6x1' | '12x36' | 'shift' | 'flexible' | 'intermittent';
  workDays: number[];
  startTime?: string;
  endTime?: string;
  breakStart?: string; // If needed for more granular break control
  breakEnd?: string;   // If needed for more granular break control
  breakDurationMinutes?: number;
  useWeeklySchedule?: boolean;
  weeklySchedule?: WeeklySchedule;
  isActive: boolean;
  category: 'default' | 'custom';
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
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {weekDays.map(day => (
          <Button
            key={day.value}
            type="button"
            variant={workDays.includes(day.value) ? "default" : "outline"}
            size="sm"
            onClick={() => handleDayToggle(day.value)}
            className="text-xs px-2 py-1 min-w-0"
          >
            {day.label.substring(0, 3)}
          </Button>
        ))}
      </div>
      <div className="space-y-3 max-h-72 overflow-y-auto">
        {workDays.sort((a, b) => a - b).map(dayValue => (
          <div key={dayValue} className="border rounded-md p-3 bg-white shadow-sm">
            <h4 className="text-sm font-semibold mb-2 text-gray-700">
              {weekDays.find(d => d.value === dayValue)?.label}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor={`weekly-start-time-${dayValue}`} className="text-xs text-gray-600">
                  Entrada
                </Label>
                <Input
                  id={`weekly-start-time-${dayValue}`}
                  type="time"
                  value={weeklySchedule[dayValue]?.startTime || '08:00'}
                  onChange={(e) => handleDayChange(dayValue, 'startTime', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`weekly-end-time-${dayValue}`} className="text-xs text-gray-600">
                  Saída
                </Label>
                <Input
                  id={`weekly-end-time-${dayValue}`}
                  type="time"
                  value={weeklySchedule[dayValue]?.endTime || '17:00'}
                  onChange={(e) => handleDayChange(dayValue, 'endTime', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`weekly-break-${dayValue}`} className="text-xs text-gray-600">
                  Pausa (min)
                </Label>
                <Input
                  id={`weekly-break-${dayValue}`}
                  type="number"
                  value={weeklySchedule[dayValue]?.breakDurationMinutes || 60}
                  onChange={(e) => handleDayChange(dayValue, 'breakDurationMinutes', e.target.value)}
                  min="0"
                  max="480"
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


import { WorkScheduleErrorBoundary } from '@/components/WorkScheduleErrorBoundary';

function WorkSchedulesContent() {
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Template related states
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplate | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    id: '',
    name: '',
    description: '',
    scheduleType: '5x2' as '5x2' | '6x1' | '12x36' | 'shift' | 'flexible' | 'intermittent',
    workDays: [1, 2, 3, 4, 5] as number[],
    startTime: '08:00',
    endTime: '17:00',
    breakStart: '',
    breakEnd: '',
    breakDurationMinutes: 60,
    useWeeklySchedule: false,
    weeklySchedule: {} as WeeklySchedule,
    isActive: true,
    category: 'custom' as 'default' | 'custom'
  });

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
  // ✅ 1QA.MD COMPLIANCE: Fetch users from tenant admin team management
  const { data: usersData, error: usersError, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/tenant-admin/users'],
    queryFn: async () => {
      console.log('[FRONTEND-QA] Fetching users from tenant admin...');
      try {
        const response = await apiRequest('GET', '/api/tenant-admin/users');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('[USERS-DEBUG] Users data received from tenant admin team:', data);
        console.log('[USERS-DEBUG] Data structure keys:', Object.keys(data || {}));
        return data;
      } catch (error) {
        console.error('[USERS-DEBUG] Error fetching users:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000
  });

  // Fetching custom schedule types (templates)
  const { data: scheduleTemplatesData, error: templatesError, isLoading: templatesLoading } = useQuery<any, Error>({
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
    mutationFn: async (templateData: Partial<ScheduleTemplate>) => {
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
      setIsTemplateDialogOpen(false); // Close template dialog
      resetTemplateForm(); // Reset template form
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

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (templateData: ScheduleTemplate) => {
      const response = await apiRequest('PUT', `/api/timecard/schedule-templates/${templateData.id}`, templateData);
      console.log('[TEMPLATE-UPDATE] Response:', response);
      return response;
    },
    onSuccess: async () => {
      toast({
        title: 'Template atualizado!',
        description: 'O template da escala foi atualizado com sucesso.',
      });
      await queryClient.invalidateQueries({ queryKey: ['/api/timecard/schedule-templates'] });
      await queryClient.refetchQueries({ queryKey: ['/api/timecard/schedule-templates'] });
      setIsTemplateDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      console.error('[TEMPLATE-UPDATE-ERROR]:', error);
      toast({
        title: 'Erro ao atualizar template',
        description: error.message || 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/timecard/schedule-templates/${id}`);
      console.log('[TEMPLATE-DELETE] Response:', response);
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Template excluído!',
        description: 'O template da escala foi removido com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/schedule-templates'] });
      setSelectedTemplate(null); // Clear selected template if deleted
    },
    onError: (error: any) => {
      console.error('[TEMPLATE-DELETE-ERROR]:', error);
      toast({
        title: 'Erro ao excluir template',
        description: error.message || 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    },
  });

  // Assign template to user mutation
  const assignTemplateMutation = useMutation({
    mutationFn: async ({ userId, templateId }: { userId: string; templateId: string }) => {
      const response = await apiRequest('POST', `/api/timecard/work-schedules/assign-template/${templateId}`, { userId });
      console.log('[TEMPLATE-ASSIGN] Response:', response);
      return response;
    },
    onSuccess: async () => {
      toast({
        title: 'Template atribuído!',
        description: 'O template foi atribuído ao funcionário com sucesso.',
      });
      await queryClient.invalidateQueries({ queryKey: ['/api/timecard/work-schedules'] });
      setIsAssignDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      console.error('[TEMPLATE-ASSIGN-ERROR]:', error);
      toast({
        title: 'Erro ao atribuir template',
        description: error.message || 'Erro interno do servidor',
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

  // Filter custom templates (excluding default ones like 5x2, 6x1, 12x36)
  const customTemplates = React.useMemo(() => {
    if (!scheduleTemplatesData || !Array.isArray(scheduleTemplatesData.templates)) {
      return [];
    }
    return scheduleTemplatesData.templates.filter((t: ScheduleTemplate) =>
      !['5x2', '6x1', '12x36', '4x3', 'flexible', 'part-time'].includes(t.id)
    );
  }, [scheduleTemplatesData]);

  // ✅ 1QA.MD COMPLIANCE: Map users correctly from tenant admin team response
  const users = useMemo(() => {
    if (!usersData || (!Array.isArray(usersData.members) && !Array.isArray(usersData.users))) {
      console.warn('[WORK-SCHEDULES] Users data is not in expected format:', usersData);
      return [];
    }

    // Prioritize 'members' if available, otherwise fall back to 'users'
    const userList = usersData.members || usersData.users || [];
    return userList
      .filter((user: any) => user && user.id && user.id.trim() !== '') // Filter out users with empty or invalid IDs
      .map((user: any) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email || '',
        role: user.role, // Assuming role is available and needed for display
        name: user.name // Include name field if present
      }));
  }, [usersData]);

  // Debug information for troubleshooting
  if (process.env.NODE_ENV === 'development') {
    console.log('Work schedules loaded:', schedules.length);
    console.log('Users available:', users.length);
    console.log('Users data structure:', usersData);
    console.log('Users loading state:', usersLoading);
    console.log('Schedule templates data:', scheduleTemplatesData);
    console.log('Custom templates (excluding defaults):', customTemplates);
  }

  if (templatesError) {
    console.error('Templates fetch error:', templatesError);
  }

  if (usersError) {
    console.error('Users fetch error:', usersError);
    console.error('Users error details:', {
      message: usersError.message,
      stack: usersError.stack
    });
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

  const resetTemplateForm = () => {
    setTemplateFormData({
      id: '',
      name: '',
      description: '',
      scheduleType: '5x2',
      workDays: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '17:00',
      breakStart: '',
      breakEnd: '',
      breakDurationMinutes: 60,
      useWeeklySchedule: false,
      weeklySchedule: {},
      isActive: true,
      category: 'custom'
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
    if (!formData.useWeeklySchedule && formData.workDays.length === 0) {
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

  const handleCreateOrUpdateTemplate = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation for template name
    if (!templateFormData.name.trim()) {
      toast({ title: 'Erro de validação', description: 'O nome do template é obrigatório.', variant: 'destructive' });
      return;
    }

    // Validate work days
    if (!templateFormData.useWeeklySchedule && templateFormData.workDays.length === 0) {
      toast({ title: 'Erro de validação', description: 'Selecione pelo menos um dia da semana.', variant: 'destructive' });
      return;
    }

    // Validate time fields for non-weekly schedules
    if (!templateFormData.useWeeklySchedule) {
      if (!templateFormData.startTime || !templateFormData.endTime) {
        toast({ title: 'Erro de validação', description: 'Horários de entrada e saída são obrigatórios.', variant: 'destructive' });
        return;
      }
      if (templateFormData.startTime >= templateFormData.endTime) {
        toast({ title: 'Erro de validação', description: 'Horário de saída deve ser posterior ao de entrada.', variant: 'destructive' });
        return;
      }
    }

    const templatePayload = {
      name: templateFormData.name.trim(),
      description: templateFormData.description?.trim() || '',
      scheduleType: templateFormData.scheduleType,
      workDays: templateFormData.workDays,
      useWeeklySchedule: templateFormData.useWeeklySchedule,
      category: 'custom', // Explicitly set as custom
      isActive: templateFormData.isActive,
      ...(templateFormData.useWeeklySchedule
        ? { weeklySchedule: templateFormData.weeklySchedule }
        : {
            startTime: templateFormData.startTime,
            endTime: templateFormData.endTime,
            breakDurationMinutes: Math.max(0, Math.min(480, templateFormData.breakDurationMinutes)),
          })
    };

    console.log('[FRONTEND-TEMPLATE] Submitting template:', templatePayload);

    if (selectedTemplate) {
      // Update existing template
      updateTemplateMutation.mutate({ ...selectedTemplate, ...templatePayload });
    } else {
      // Create new template
      createTemplateMutation.mutate(templatePayload);
    }
  };

  // ✅ 1QA.MD COMPLIANCE: Function to handle opening the dialog for new schedule
  const handleNewSchedule = () => {
    console.log('[WORK-SCHEDULES] Opening new schedule dialog');
    setSelectedSchedule(null);
    setIsDialogOpen(true);
  };

  // ✅ 1QA.MD COMPLIANCE: Function to handle editing existing schedule
  const handleEditSchedule = (schedule: WorkSchedule) => {
    console.log('[WORK-SCHEDULES] Opening edit schedule dialog for:', schedule.id);
    setSelectedSchedule(schedule);
    setIsDialogOpen(true);
  };

  // ✅ 1QA.MD COMPLIANCE: Function to handle opening new template dialog
  const handleNewTemplate = () => {
    console.log('[WORK-SCHEDULES] Opening new template dialog');
    setSelectedTemplate(null);
    resetTemplateForm();
    setIsTemplateDialogOpen(true);
  };

  // ✅ 1QA.MD COMPLIANCE: Function to handle editing existing template
  const handleEditTemplate = (template: ScheduleTemplate) => {
    console.log('[WORK-SCHEDULES] Opening edit template dialog for:', template.id);
    setSelectedTemplate(template);
    setTemplateFormData({
      id: template.id,
      name: template.name,
      description: template.description || '',
      scheduleType: template.scheduleType,
      workDays: template.workDays,
      startTime: template.startTime || '08:00',
      endTime: template.endTime || '17:00',
      breakStart: template.breakStart || '',
      breakEnd: template.breakEnd || '',
      breakDurationMinutes: template.breakDurationMinutes || 60,
      useWeeklySchedule: template.useWeeklySchedule || false,
      weeklySchedule: template.weeklySchedule || {},
      isActive: template.isActive,
      category: template.category || 'custom'
    });
    setIsTemplateDialogOpen(true);
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

    if (!formData.startDate) {
      toast({
        title: 'Erro',
        description: 'Data de início é obrigatória.',
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
      isActive: true,
      ...(formData.useWeeklySchedule
        ? { weeklySchedule: formData.weeklySchedule }
        : {
            startTime: formData.startTime,
            endTime: formData.endTime,
            breakDurationMinutes: formData.breakDurationMinutes,
          }),
    };

    try {
      const response = await apiRequest('POST', '/api/timecard/work-schedules/bulk-assign', {
        userIds: selectedUsers,
        scheduleData: bulkScheduleData
      });

      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ['/api/timecard/work-schedules'] });
        setBulkAssignOpen(false);
        setSelectedUsers([]);
        resetForm();

        toast({
          title: 'Sucesso!',
          description: `Escalas atribuídas para ${selectedUsers.length} funcionários.`,
        });
      } else {
        throw new Error('Falha na atribuição em massa');
      }
    } catch (error: any) {
      console.error('[BULK-ASSIGN-ERROR]:', error);
      toast({
        title: 'Erro na atribuição em lote',
        description: error?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    }
  };

  const handleAssignTemplate = async () => {
    if (!selectedTemplate || selectedUsers.length === 0) {
      toast({ title: 'Erro', description: 'Selecione um template e pelo menos um funcionário.', variant: 'destructive' });
      return;
    }

    try {
      // Process each user assignment
      for (const userId of selectedUsers) {
        await assignTemplateMutation.mutateAsync({ userId, templateId: selectedTemplate.id });
      }

      // Close dialogs and reset selections
      setIsAssignDialogOpen(false);
      setSelectedUsers([]);
      setSelectedTemplate(null);

      toast({
        title: 'Templates atribuídos!',
        description: `Template "${selectedTemplate.name}" atribuído para ${selectedUsers.length} funcionários.`,
      });
    } catch (error: any) {
      console.error('[TEMPLATE-ASSIGN-ERROR]:', error);
      toast({
        title: 'Erro ao atribuir template',
        description: error?.message || 'Erro interno do servidor',
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

  if (schedulesLoading || templatesLoading || usersLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">
            Carregando dados...
            {schedulesLoading && <div className="text-sm">• Escalas</div>}
            {templatesLoading && <div className="text-sm">• Templates</div>}
            {usersLoading && <div className="text-sm">• Funcionários</div>}
          </div>
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
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Escalas de Trabalho</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleNewTemplate}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Novo Template
          </Button>
          <Button
            onClick={() => setBulkAssignOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Atribuição em Massa
          </Button>
          <Button
              onClick={handleNewSchedule}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Escala
            </Button>
        </div>
      </div>

      {/* Templates Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Templates de Escala Disponíveis
          </CardTitle>
          <CardDescription>
            Gerencie templates independentes que podem ser atribuídos a funcionários
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-gray-500">Carregando templates...</div>
            </div>
          ) : customTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum template personalizado encontrado. Crie um novo template.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customTemplates.map((template) => (
                <Card key={template.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsAssignDialogOpen(true);
                          }}
                        >
                          Atribuir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {template.description && (
                      <CardDescription className="text-sm">{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div><strong>Tipo:</strong> {template.scheduleType}</div>
                      <div><strong>Horário:</strong> {template.startTime ? `${template.startTime} - ${template.endTime}` : 'N/A'}</div>
                      <div><strong>Dias:</strong> {template.workDays?.length || 0} dias por semana</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for creating/editing templates */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? 'Editar Template' : 'Novo Template de Escala'}</DialogTitle>
            <DialogDescription>
              {selectedTemplate ? 'Modifique os detalhes do template.' : 'Crie um novo template de escala independente.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrUpdateTemplate} className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto"  style={{ scrollbarWidth: 'thin' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Nome do Template *</Label>
                <Input
                  id="template-name"
                  type="text"
                  value={templateFormData.name}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="template-description">Descrição (opcional)</Label>
                <Input
                  id="template-description"
                  type="text"
                  value={templateFormData.description}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-scheduleType">Tipo de Escala</Label>
                <Select
                  value={templateFormData.scheduleType}
                  onValueChange={(value) => setTemplateFormData(prev => ({ ...prev, scheduleType: value as any }))}
                >
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

            {/* Toggle for weekly schedule */}
            <div className="flex items-center space-x-2">
              <Switch
                id="template-useWeeklySchedule"
                checked={templateFormData.useWeeklySchedule}
                onCheckedChange={(checked) => {
                  setTemplateFormData(prev => ({ ...prev, useWeeklySchedule: checked, workDays: checked ? [] : [1, 2, 3, 4, 5] }));
                  if (!checked) {
                    setTemplateFormData(prev => ({ ...prev, weeklySchedule: {} })); // Clear weekly schedule when toggled off
                  }
                }}
              />
              <Label htmlFor="template-useWeeklySchedule">Horários diferentes por dia da semana</Label>
            </div>

            {templateFormData.useWeeklySchedule ? (
              <div className="max-h-96 overflow-y-auto border rounded-md p-4 bg-gray-50">
                <WeeklyScheduleForm
                  weeklySchedule={templateFormData.weeklySchedule}
                  workDays={templateFormData.workDays}
                  onWeeklyScheduleChange={(schedule) => setTemplateFormData(prev => ({ ...prev, weeklySchedule: schedule }))}
                  onWorkDaysChange={(days) => setTemplateFormData(prev => ({ ...prev, workDays: days }))}
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-startTime">Horário de Entrada</Label>
                    <Input
                      id="template-startTime"
                      type="time"
                      value={templateFormData.startTime}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-endTime">Horário de Saída</Label>
                    <Input
                      id="template-endTime"
                      type="time"
                      value={templateFormData.endTime}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="template-breakDurationMinutes">Pausa (minutos)</Label>
                  <Input
                    id="template-breakDurationMinutes"
                    type="number"
                    value={templateFormData.breakDurationMinutes}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, breakDurationMinutes: parseInt(e.target.value) })}
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
                        variant={templateFormData.workDays.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newWorkDays = templateFormData.workDays.includes(day.value)
                            ? templateFormData.workDays.filter(d => d !== day.value)
                            : [...templateFormData.workDays, day.value];
                          setTemplateFormData({ ...templateFormData, workDays: newWorkDays });
                        }}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              >
                {(createTemplateMutation.isPending || updateTemplateMutation.isPending) ? 'Salvando...' : 'Salvar Template'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for bulk assignment */}
      <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atribuição em Massa</DialogTitle>
            <DialogDescription>
              Configure uma escala e atribua para múltiplos funcionários de uma vez.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleBulkAssign(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulk-scheduleType">Tipo de Escala</Label>
                <Select
                  value={formData.scheduleType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, scheduleType: value }))}
                >
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
                <Label htmlFor="bulk-startDate">Data de Início</Label>
                <Input
                  id="bulk-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulk-startTime">Horário de Entrada</Label>
                <Input
                  id="bulk-startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="bulk-endTime">Horário de Saída</Label>
                <Input
                  id="bulk-endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Funcionários</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                {users.map((user: User) => (
                  <div key={user.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`bulk-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                    <Label htmlFor={`bulk-${user.id}`} className="cursor-pointer">
                      {user.firstName} {user.lastName} ({user.role || 'Funcionário'})
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setBulkAssignOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={selectedUsers.length === 0}>
                Atribuir para {selectedUsers.length} funcionários
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for assigning template to users */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atribuir Template a Funcionários</DialogTitle>
            <DialogDescription>
              Selecione os funcionários para os quais o template "{selectedTemplate?.name}" será atribuído.
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
                      {user.firstName} {user.lastName} ({user.role || 'Funcionário'})
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAssignTemplate} disabled={selectedUsers.length === 0 || !selectedTemplate}>
                Atribuir a {selectedUsers.length} funcionários
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ 1QA.MD COMPLIANCE: Work Schedule Dialog with proper state management */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSchedule ? 'Editar Escala de Trabalho' : 'Nova Escala de Trabalho'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userId">Funcionário *</Label>
                <Select
                  value={formData.userId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}
                  disabled={!!selectedSchedule} // Disable if editing an existing schedule
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      usersData === undefined
                        ? "Carregando funcionários..."
                        : (usersData?.members?.length || usersData?.users?.length) > 0
                          ? "Selecione um funcionário"
                          : "Nenhum funcionário encontrado"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {/* ✅ 1QA.MD COMPLIANCE: Debug users data structure */}
                    {console.log('[USERS-SELECT-DEBUG] usersData structure:', usersData)}
                    {(usersData?.members || usersData?.users || []).map((user: User) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName} (${user.email})`
                          : user.name || user.email
                        }
                      </SelectItem>
                    ))}
                    {/* ✅ 1QA.MD COMPLIANCE: Show debug info if no users - using valid value */}
                    {(!usersData?.members && !usersData?.users) && (
                      <SelectItem value="debug-no-users" disabled>
                        Nenhum usuário encontrado - Debug: {JSON.stringify(usersData)}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="scheduleType">Tipo de Escala *</Label>
                <Select
                  value={formData.scheduleType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, scheduleType: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de escala" />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data de Fim (opcional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Toggle for weekly schedule */}
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
              <div className="max-h-96 overflow-y-auto border rounded-md p-4 bg-gray-50">
                <WeeklyScheduleForm
                  weeklySchedule={formData.weeklySchedule}
                  workDays={formData.workDays}
                  onWeeklyScheduleChange={(schedule) => setFormData(prev => ({ ...prev, weeklySchedule: schedule }))}
                  onWorkDaysChange={(days) => setFormData(prev => ({ ...prev, workDays: days }))}
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Horário de Entrada</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Horário de Saída</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, breakDurationMinutes: parseInt(e.target.value) }))}
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

            {/* Template saving option */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saveAsTemplate"
                  checked={formData.saveAsTemplate}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, saveAsTemplate: checked }))}
                />
                <Label htmlFor="saveAsTemplate">Salvar como novo template de escala</Label>
              </div>
              {formData.saveAsTemplate && (
                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <Label htmlFor="templateName">Nome do Template</Label>
                      <Input
                        id="templateName"
                        value={formData.templateName}
                        onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
                        placeholder="Ex: Escala Padrão Administrativo"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor="templateDescription">Descrição do Template</Label>
                      <Input
                        id="templateDescription"
                        value={formData.templateDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, templateDescription: e.target.value }))}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                console.log('[WORK-SCHEDULES] Closing dialog');
                setIsDialogOpen(false);
                setSelectedSchedule(null);
              }}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
              >
                {selectedSchedule ? (createScheduleMutation.isPending || updateScheduleMutation.isPending) ? 'Atualizando...' : 'Atualizar Escala' : (createScheduleMutation.isPending || updateScheduleMutation.isPending) ? 'Salvando...' : 'Salvar Escala'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Main schedules list */}
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
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSchedule(schedule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('[WORK-SCHEDULES] Deleting schedule:', schedule.id);
                        deleteScheduleMutation.mutate(schedule.id);
                      }}
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
              <Button onClick={handleNewSchedule}>
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