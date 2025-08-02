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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkSchedule {
  id: string;
  userId: string;
  scheduleType: '5x2' | '6x1' | '12x36' | 'shift' | 'flexible' | 'intermittent';
  startDate: string;
  endDate?: string;
  workDays: number[];
  startTime: string;
  endTime: string;
  breakDurationMinutes: number;
  isActive: boolean;
  userName?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const scheduleTypeLabels = {
  '5x2': '5x2 (Segunda a Sexta)',
  '6x1': '6x1 (Seis dias com folga)', 
  '12x36': '12x36 (Plantões)',
  'shift': 'Escalas por Turno',
  'flexible': 'Horário Flexível',
  'intermittent': 'Trabalho Intermitente'
};

const scheduleTypeOptions = [
  { value: '5x2', label: '5x2 (Segunda a Sexta)' },
  { value: '6x1', label: '6x1 (Seis dias com folga)' },
  { value: '12x36', label: '12x36 (Plantões)' },
  { value: 'shift', label: 'Escalas por Turno' },
  { value: 'flexible', label: 'Horário Flexível' },
  { value: 'intermittent', label: 'Trabalho Intermitente' }
];

const weekDays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' }
];

import { WorkScheduleErrorBoundary } from '@/components/WorkScheduleErrorBoundary';

function WorkSchedulesContent() {
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    userId: '',
    scheduleType: '5x2',
    startDate: '',
    endDate: '',
    workDays: [1, 2, 3, 4, 5],
    startTime: '08:00',
    endTime: '18:00',
    breakDurationMinutes: 60,
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as escalas
  const { data: schedulesData, isLoading: schedulesLoading, error: schedulesError } = useQuery({
    queryKey: ['/api/timecard/work-schedules'],
    queryFn: async () => {
      console.log('[FRONTEND-QA] Fetching work schedules...');
      const response = await apiRequest('GET', '/api/timecard/work-schedules');
      console.log('[FRONTEND-QA] API Response:', response);
      return response;
    },
    staleTime: 30000, // Cache for 30 seconds
    retry: 3,
    retryDelay: 1000
  });

  // Buscar usuários/funcionários do sistema via endpoint de admin que funciona
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

  // Buscar tipos de escalas personalizados
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

  // Criar escala
  const createScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/timecard/work-schedules', data);
    },
    onSuccess: () => {
      toast({
        title: 'Escala criada!',
        description: 'A escala de trabalho foi criada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/work-schedules'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar escala',
        description: error.message || 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    },
  });

  // Atualizar escala
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest('PUT', `/api/timecard/work-schedules/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Escala atualizada!',
        description: 'A escala de trabalho foi atualizada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/work-schedules'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar escala',
        description: error.message || 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    },
  });

  // Excluir escala
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

  // Safe data processing with proper type checking
  let schedules: WorkSchedule[] = [];
  
  try {
    if (Array.isArray(schedulesData)) {
      schedules = schedulesData.map(schedule => ({
        ...schedule,
        // Ensure workDays is always an array
        workDays: Array.isArray(schedule.workDays) ? schedule.workDays : [1,2,3,4,5],
        // Ensure required fields have defaults
        userName: schedule.userName || 'Usuário',
        scheduleType: schedule.scheduleType || '5x2',
        breakDurationMinutes: schedule.breakDurationMinutes || 60,
        isActive: schedule.isActive ?? true
      }));
    } else if (schedulesData && typeof schedulesData === 'object') {
      const rawSchedules = (schedulesData as any).schedules || (schedulesData as any).data || [];
      schedules = Array.isArray(rawSchedules) ? rawSchedules : [];
    }
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
      endTime: '18:00',
      breakDurationMinutes: 60,
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações obrigatórias
    if (!formData.userId) {
      toast({
        title: 'Erro de validação',
        description: 'Selecione um funcionário.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.startDate) {
      toast({
        title: 'Erro de validação',
        description: 'Data de início é obrigatória.',
        variant: 'destructive',
      });
      return;
    }

    if (!Array.isArray(formData.workDays) || formData.workDays.length === 0) {
      toast({
        title: 'Erro de validação',
        description: 'Selecione pelo menos um dia da semana.',
        variant: 'destructive',
      });
      return;
    }

    // Validação de horários
    if (formData.startTime >= formData.endTime) {
      toast({
        title: 'Erro de validação',
        description: 'Horário de saída deve ser posterior ao de entrada.',
        variant: 'destructive',
      });
      return;
    }

    // Mapear dados do frontend para o formato esperado pela API
    const apiData = {
      userId: formData.userId,
      scheduleType: formData.scheduleType as '5x2' | '6x1' | '12x36' | 'shift' | 'flexible' | 'intermittent',
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      workDays: Array.from(new Set(formData.workDays)), // Remove duplicates
      startTime: formData.startTime,
      endTime: formData.endTime,
      breakDurationMinutes: Math.max(0, Math.min(480, formData.breakDurationMinutes)), // Validate range
      isActive: formData.isActive
    };

    console.log('[QA-DEBUG] Submitting schedule data:', apiData);

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
      startDate: schedule.startDate.split('T')[0],
      endDate: schedule.endDate ? schedule.endDate.split('T')[0] : '',
      workDays: schedule.workDays,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      breakDurationMinutes: schedule.breakDurationMinutes,
      isActive: schedule.isActive
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

    const scheduleData = {
      scheduleType: formData.scheduleType,
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      workDays: formData.workDays,
      startTime: formData.startTime,
      endTime: formData.endTime,
      breakDurationMinutes: formData.breakDurationMinutes,
      isActive: formData.isActive
    };

    try {
      await apiRequest('/api/timecard/work-schedules/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers, scheduleData })
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
                    {users.map((user) => (
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
                        {scheduleTypesData?.templates?.filter((t: any) => t.isActive).map((template: any) => (
                          <SelectItem key={template.name} value={template.name}>
                            {template.name}
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
                  <Select value={formData.userId} onValueChange={(value) => setFormData({...formData, userId: value})}>
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
                  <Select value={formData.scheduleType} onValueChange={(value) => setFormData({...formData, scheduleType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Templates padrão */}
                      {Object.entries(scheduleTypeLabels).map(([key, label]) => (
                        <SelectItem key={`default-${key}`} value={key}>{label}</SelectItem>
                      ))}
                      {/* Separador visual removido para evitar erro de valor vazio */}
                      {/* Templates customizados criados pelo usuário */}
                      {scheduleTypesData?.templates?.filter((template: any) => 
                        template.isActive && !['5x2', '6x1', '12x36'].includes(template.name) // Filtrar templates padrão duplicados
                      ).map((template: any) => (
                        <SelectItem key={`custom-${template.id}`} value={template.name}>
                          📋 {template.name}
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
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Data de Fim (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="breakDurationMinutes">Pausa (minutos)</Label>
                  <Input
                    type="number"
                    value={formData.breakDurationMinutes}
                    onChange={(e) => setFormData({...formData, breakDurationMinutes: parseInt(e.target.value)})}
                    min="0"
                    max="240"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Horário de Entrada</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endTime">Horário de Saída</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    required
                  />
                </div>
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
                        setFormData({...formData, workDays: newWorkDays});
                      }}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                >
                  {(createScheduleMutation.isPending || updateScheduleMutation.isPending) ? 'Salvando...' : 'Salvar'}
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
            <Card key={schedule.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{schedule.userName || 'Usuário'}</h3>
                      {getStatusBadge(schedule.isActive)}
                      <Badge variant="outline">
                        {scheduleTypeLabels[schedule.scheduleType]}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{schedule.startTime} - {schedule.endTime}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{schedule?.workDays ? getWorkDaysText(schedule.workDays) : 'Não definido'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-500" />
                        <span>Pausa: {schedule.breakDurationMinutes}min</span>
                      </div>

                      <div className="text-gray-600">
                        Início: {format(new Date(schedule.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(schedule.id)}
                      disabled={deleteScheduleMutation.isPending}
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