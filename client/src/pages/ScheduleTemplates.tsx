
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Settings, Clock, Calendar, Users, Copy, UserPlus } from 'lucide-react';
import BulkScheduleAssignment from '@/components/timecard/BulkScheduleAssignment';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const scheduleTemplateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  category: z.enum(['fixed', 'rotating', 'flexible', 'shift']),
  scheduleType: z.string().min(1, 'Tipo de escala é obrigatório'),
  rotationCycleDays: z.number().optional(),
  configuration: z.object({
    workDays: z.array(z.number()).min(1, 'Selecione pelo menos um dia'),
    startTime: z.string().min(1, 'Horário de início é obrigatório'),
    endTime: z.string().min(1, 'Horário de fim é obrigatório'),
    breakDuration: z.number().min(0, 'Duração do intervalo deve ser positiva'),
    flexTimeWindow: z.number().optional(),
  }),
  requiresApproval: z.boolean().optional(),
});

type ScheduleTemplateFormData = z.infer<typeof scheduleTemplateSchema>;

interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  scheduleType: string;
  rotationCycleDays?: number;
  configuration: {
    workDays: number[];
    startTime: string;
    endTime: string;
    breakDuration: number;
    flexTimeWindow?: number;
  };
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
}

const categoryLabels = {
  fixed: 'Fixa',
  rotating: 'Rotativa',
  flexible: 'Flexível',
  shift: 'Turnos'
};

const scheduleTypeOptions = [
  { value: '5x2', label: '5x2 (5 dias trabalhados, 2 dias de folga)' },
  { value: '6x1', label: '6x1 (6 dias trabalhados, 1 dia de folga)' },
  { value: '12x36', label: '12x36 (12 horas trabalhadas, 36 horas de folga)' },
  { value: 'plantao', label: 'Plantão' },
  { value: 'intermitente', label: 'Intermitente' },
  { value: 'custom', label: 'Personalizada' }
];

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function ScheduleTemplates() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ScheduleTemplateFormData>({
    resolver: zodResolver(scheduleTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'fixed',
      scheduleType: '5x2',
      rotationCycleDays: undefined,
      configuration: {
        workDays: [1, 2, 3, 4, 5], // Segunda a sexta por padrão
        startTime: '08:00',
        endTime: '18:00',
        breakDuration: 60,
        flexTimeWindow: undefined,
      },
      requiresApproval: true,
    },
  });

  // Buscar templates de escalas
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['/api/timecard/schedule-templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/schedule-templates');
      return response;
    },
  });

  // Criar template
  const createTemplateMutation = useMutation({
    mutationFn: async (data: ScheduleTemplateFormData) => {
      return await apiRequest('POST', '/api/timecard/schedule-templates', data);
    },
    onSuccess: () => {
      toast({
        title: 'Template Criado',
        description: 'Template de escala criado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/schedule-templates'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Criar Template',
        description: error.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Excluir template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/timecard/schedule-templates/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Template Excluído',
        description: 'Template de escala excluído com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/schedule-templates'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Excluir Template',
        description: error.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  const templates = templatesData?.templates || [];
  
  console.log('Templates data:', templatesData);
  console.log('Templates array:', templates);
  console.log('Templates length:', templates.length);

  const handleSubmit = (data: ScheduleTemplateFormData) => {
    createTemplateMutation.mutate(data);
  };

  const handleWorkDayToggle = (dayIndex: number, checked: boolean) => {
    const currentWorkDays = form.getValues('configuration.workDays');
    if (checked) {
      form.setValue('configuration.workDays', [...currentWorkDays, dayIndex].sort());
    } else {
      form.setValue('configuration.workDays', currentWorkDays.filter(day => day !== dayIndex));
    }
  };

  const formatWorkDays = (workDays: number[]) => {
    return workDays.map(day => dayNames[day]).join(', ');
  };

  const calculateWorkingHours = (startTime: string, endTime: string, breakDuration: number) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const totalMinutes = endMinutes - startMinutes - breakDuration;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h${minutes > 0 ? `${minutes}m` : ''}`;
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando templates de escalas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Escalas</h1>
          <p className="text-gray-600">Gerencie templates e atribuições de escalas de trabalho</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Template de Escala</DialogTitle>
              <DialogDescription>
                Crie um modelo reutilizável para escalas de trabalho
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Template</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Escala Padrão 5x2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(categoryLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva o propósito e uso do template..."
                          rows={2}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Escala</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {scheduleTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rotationCycleDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciclo de Rotação (dias)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Ex: 7, 14, 30"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Configuração da Escala</h3>
                  
                  <div>
                    <FormLabel>Dias de Trabalho</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {dayNames.map((day, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${index}`}
                            checked={form.watch('configuration.workDays').includes(index)}
                            onCheckedChange={(checked) => handleWorkDayToggle(index, checked as boolean)}
                          />
                          <label htmlFor={`day-${index}`} className="text-sm font-medium">
                            {day}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="configuration.startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário de Início</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="configuration.endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário de Fim</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="configuration.breakDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Intervalo (minutos)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="60"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="configuration.flexTimeWindow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Janela de Flexibilidade (minutos)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="30 (tolerância para entrada/saída)"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requiresApproval"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Requer aprovação para aplicar este template
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createTemplateMutation.isPending}>
                    {createTemplateMutation.isPending ? 'Criando...' : 'Criar Template'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Templates de Escalas
          </TabsTrigger>
          <TabsTrigger value="bulk-assignment" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Atribuição em Lote
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-4">
            {templates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template criado</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Crie seu primeiro template de escala para reutilizar em diferentes equipes
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template: ScheduleTemplate) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {template.description || 'Sem descrição'}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          {categoryLabels[template.category as keyof typeof categoryLabels]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatWorkDays(template.configuration.workDays)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>
                            {template.configuration.startTime} - {template.configuration.endTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>
                            {calculateWorkingHours(
                              template.configuration.startTime,
                              template.configuration.endTime,
                              template.configuration.breakDuration
                            )} por dia
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-4">
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id)}
                              disabled={deleteTemplateMutation.isPending}
                            >
                              Excluir
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: 'Funcionalidade em desenvolvimento',
                                  description: 'A aplicação de templates será implementada em breve.',
                                });
                              }}
                            >
                              Aplicar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bulk-assignment" className="space-y-6">
          <BulkScheduleAssignment />
        </TabsContent>
      </Tabs>
    </div>
  );
}
