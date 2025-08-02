import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

const weekDays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' }
];

export default function WorkSchedules() {
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ['/api/timecard/work-schedules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/work-schedules');
      return response;
    },
  });

  // Buscar usuários
  const { data: usersData } = useQuery({
    queryKey: ['/api/tenant-admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tenant-admin/users');
      return response;
    },
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

  const schedules = Array.isArray(schedulesData) ? schedulesData : (schedulesData?.schedules || []);
  const users = usersData?.users || [];

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

    if (formData.workDays.length === 0) {
      toast({
        title: 'Erro de validação',
        description: 'Selecione pelo menos um dia da semana.',
        variant: 'destructive',
      });
      return;
    }

    // Mapear dados do frontend para o formato esperado pela API
    const apiData = {
      userId: formData.userId,
      scheduleType: formData.scheduleType,
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      workDays: formData.workDays,
      startTime: formData.startTime,
      endTime: formData.endTime,
      breakDurationMinutes: formData.breakDurationMinutes,
      isActive: formData.isActive
    };

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

  const getWorkDaysText = (workDays: number[] | null) => {
    if (!workDays || !Array.isArray(workDays)) return 'Não definido';
    return workDays.map(day => weekDays.find(wd => wd.value === day)?.label).join(', ');
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

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Escalas de Trabalho</h1>
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
                      {users.map((user: User) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
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
                      {Object.entries(scheduleTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
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
                        <span>{getWorkDaysText(schedule.workDays)}</span>
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