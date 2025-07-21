
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useToast } from '../hooks/use-toast';
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, User, FileText } from 'lucide-react';

interface Schedule {
  id: string;
  title: string;
  description?: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  type: 'meeting' | 'task' | 'appointment' | 'reminder';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  attendees?: string[];
  ticketId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    type: 'meeting' as const,
    priority: 'medium' as const,
    location: '',
    ticketId: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSchedules();
  }, [selectedDate]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/schedule?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Agendamento criado",
          description: "Seu agendamento foi criado com sucesso!",
        });
        setIsCreateDialogOpen(false);
        resetForm();
        loadSchedules();
      } else {
        throw new Error('Erro ao criar agendamento');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/schedule/${editingSchedule.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Agendamento atualizado",
          description: "Seu agendamento foi atualizado com sucesso!",
        });
        setEditingSchedule(null);
        resetForm();
        loadSchedules();
      } else {
        throw new Error('Erro ao atualizar agendamento');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o agendamento.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/schedule/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Agendamento excluído",
          description: "O agendamento foi excluído com sucesso!",
        });
        loadSchedules();
      } else {
        throw new Error('Erro ao excluir agendamento');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento.",
        variant: "destructive"
      });
    }
  };

  const handleStatusUpdate = async (scheduleId: string, newStatus: Schedule['status']) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/schedule/${scheduleId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast({
          title: "Status atualizado",
          description: "O status do agendamento foi atualizado!",
        });
        loadSchedules();
      } else {
        throw new Error('Erro ao atualizar status');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scheduledDate: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      type: 'meeting',
      priority: 'medium',
      location: '',
      ticketId: ''
    });
  };

  const openEditDialog = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title,
      description: schedule.description || '',
      scheduledDate: new Date(schedule.scheduledDate).toISOString().split('T')[0],
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      type: schedule.type,
      priority: schedule.priority,
      location: schedule.location || '',
      ticketId: schedule.ticketId || ''
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <User className="h-4 w-4" />;
      case 'task':
        return <FileText className="h-4 w-4" />;
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      case 'reminder':
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-500">Agendado</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500">Em andamento</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Concluído</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-600">Urgente</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Média</Badge>;
      case 'low':
        return <Badge className="bg-gray-500">Baixa</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'Reunião';
      case 'task':
        return 'Tarefa';
      case 'appointment':
        return 'Compromisso';
      case 'reminder':
        return 'Lembrete';
      default:
        return type;
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestão de Agenda
          </h1>
          <p className="text-gray-600 mt-2">
            Organize seus compromissos, reuniões e tarefas
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Agendamento</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo agendamento
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Input
                placeholder="Título do agendamento"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
              
              <Textarea
                placeholder="Descrição (opcional)"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                />
                
                <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="task">Tarefa</SelectItem>
                    <SelectItem value="appointment">Compromisso</SelectItem>
                    <SelectItem value="reminder">Lembrete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="time"
                  placeholder="Início"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                />
                
                <Input
                  type="time"
                  placeholder="Fim"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                />
              </div>
              
              <Select value={formData.priority} onValueChange={(value: any) => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Local (opcional)"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
              
              <Input
                placeholder="ID do Ticket (opcional)"
                value={formData.ticketId}
                onChange={(e) => setFormData({...formData, ticketId: e.target.value})}
              />
              
              <Button 
                onClick={handleCreateSchedule} 
                className="w-full"
                disabled={!formData.title || !formData.startTime}
              >
                Criar Agendamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtro de Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Selecionar Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* Lista de Agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos para {new Date(selectedDate).toLocaleDateString()}</CardTitle>
          <CardDescription>
            {schedules.length} agendamento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center py-8">Carregando agendamentos...</p>
            ) : schedules.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhum agendamento encontrado para esta data
              </p>
            ) : (
              schedules.map((schedule) => (
                <div key={schedule.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(schedule.type)}
                        <h3 className="font-semibold">{schedule.title}</h3>
                        {getStatusBadge(schedule.status)}
                        {getPriorityBadge(schedule.priority)}
                      </div>
                      
                      {schedule.description && (
                        <p className="text-gray-600 text-sm">{schedule.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{schedule.startTime} - {schedule.endTime}</span>
                        </div>
                        
                        {schedule.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{schedule.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{getTypeLabel(schedule.type)}</span>
                        </div>
                      </div>
                      
                      {schedule.ticketId && (
                        <div className="text-sm text-blue-600">
                          Ticket: #{schedule.ticketId}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {schedule.status === 'scheduled' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusUpdate(schedule.id, 'in_progress')}
                          className="text-xs"
                        >
                          Iniciar
                        </Button>
                      )}
                      
                      {schedule.status === 'in_progress' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusUpdate(schedule.id, 'completed')}
                          className="text-xs bg-green-600 hover:bg-green-700"
                        >
                          Concluir
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openEditDialog(schedule)}
                        className="text-xs"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={!!editingSchedule} onOpenChange={() => setEditingSchedule(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
            <DialogDescription>
              Atualize os dados do agendamento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Título do agendamento"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
            
            <Textarea
              placeholder="Descrição (opcional)"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
              />
              
              <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="task">Tarefa</SelectItem>
                  <SelectItem value="appointment">Compromisso</SelectItem>
                  <SelectItem value="reminder">Lembrete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="time"
                placeholder="Início"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              />
              
              <Input
                type="time"
                placeholder="Fim"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              />
            </div>
            
            <Select value={formData.priority} onValueChange={(value: any) => setFormData({...formData, priority: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Local (opcional)"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
            
            <Input
              placeholder="ID do Ticket (opcional)"
              value={formData.ticketId}
              onChange={(e) => setFormData({...formData, ticketId: e.target.value})}
            />
            
            <Button 
              onClick={handleUpdateSchedule} 
              className="w-full"
              disabled={!formData.title || !formData.startTime}
            >
              Atualizar Agendamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
