import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
// import { useLocalization } from '@/hooks/useLocalization';

interface Schedule {
  id?: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  priority: string;
  locationAddress?: string;
  agentId: string;
  customerId?: string;
  activityTypeId: string;
  internalNotes?: string;
  clientNotes?: string;
}

interface ActivityType {
  id: string;
  name: string;
  color: string;
  category: string;
  duration: number;
}

interface Agent {
  id: string;
  name: string;
  email: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Schedule) => void;
  schedule?: Schedule;
  agents: Agent[];
  customers: Customer[];
  activityTypes: ActivityType[];
  defaultDate?: Date;
  defaultTime?: string;
  defaultAgentId?: string;
}

const scheduleSchema = z.object({
  // Localization temporarily disabled

  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  agentId: z.string().min(1, 'Agente é obrigatório'),
  customerId: z.string().optional(),
  activityTypeId: z.string().min(1, 'Tipo de atividade é obrigatório'),
  date: z.date({ required_error: 'Data é obrigatória' }),
  startTime: z.string().min(1, 'Horário de início é obrigatório'),
  duration: z.number().min(15, 'Duração mínima de 15 minutos'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  locationAddress: z.string().optional(),
  internalNotes: z.string().optional(),
  clientNotes: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  schedule,
  agents,
  customers,
  activityTypes,
  defaultDate,
  defaultTime,
  defaultAgentId,
}) => {
  // Buscar usuários do módulo de gestão de equipe - usando API que funciona
  const { data: teamMembersData } = useQuery({
    queryKey: ['/api/user-management/users'],
    enabled: isOpen,
  });

  // Combinar agentes passados como props com usuários do módulo de gestão de equipe
  const allAgents = React.useMemo(() => {
    const teamAgents = teamMembersData && teamMembersData.users && Array.isArray(teamMembersData.users) 
      ? teamMembersData.users.map((member: any) => ({
        id: member.id,
        name: member.name || "
        email: member.email
      })) : [];

    // Combinar e remover duplicatas
    const combinedAgents = [...(agents || []), ...teamAgents];
    const uniqueAgents = combinedAgents.filter((agent, index, self) => 
      index === self.findIndex(a => a.id === agent.id)
    );

    return uniqueAgents;
  }, [agents, teamMembersData]);
  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: schedule ? {
      title: schedule.title,
      description: schedule.description || '',
      agentId: schedule.agentId,
      customerId: schedule.customerId || '',
      activityTypeId: schedule.activityTypeId,
      date: new Date(schedule.startDateTime),
      startTime: format(new Date(schedule.startDateTime), 'HH:mm'),
      duration: Math.floor((new Date(schedule.endDateTime).getTime() - new Date(schedule.startDateTime).getTime()) / (1000 * 60)),
      priority: schedule.priority as any,
      status: schedule.status as any,
      locationAddress: schedule.locationAddress || '',
      internalNotes: schedule.internalNotes || '',
      clientNotes: schedule.clientNotes || '',
    } : {
      title: '',
      description: '',
      agentId: defaultAgentId || '',
      customerId: '',
      activityTypeId: '',
      date: defaultDate || new Date(),
      startTime: defaultTime || '09:00',
      duration: 60,
      priority: 'medium',
      status: 'scheduled',
      locationAddress: '',
      internalNotes: '',
      clientNotes: '',
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    const startDateTime = new Date(data.date);
    const [hours, minutes] = data.startTime.split(':').map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + data.duration);

    const scheduleData: Schedule = {
      ...schedule,
      title: data.title,
      description: data.description,
      agentId: data.agentId,
      customerId: data.customerId || undefined,
      activityTypeId: data.activityTypeId,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      status: data.status,
      priority: data.priority,
      locationAddress: data.locationAddress,
      internalNotes: data.internalNotes,
      clientNotes: data.clientNotes,
    };

    onSave(scheduleData);
    onClose();
  };

  const selectedActivityType = activityTypes?.find?.(type => type.id === form.watch('activityTypeId'));

  // Update duration when activity type changes
  React.useEffect(() => {
    if (selectedActivityType && !schedule) {
      form.setValue('duration', selectedActivityType.duration);
    }
  }, [selectedActivityType, form, schedule]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            {schedule ? '[TRANSLATION_NEEDED]' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Título e Descrição */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Visita técnica para diagnóstico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detalhes adicionais sobre o agendamento..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Agente e Cliente */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="agentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allAgents?.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
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
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum cliente</SelectItem>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.firstName} {customer.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tipo de Atividade */}
            <FormField
              control={form.control}
              name="activityTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Atividade *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activityTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: type.color }}
                            />
                            {type.name} ({type.duration}min)
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data e Horário */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="15" 
                        step="15"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 15)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status e Prioridade */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Agendado</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Endereço */}
            <FormField
              control={form.control}
              name="locationAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço completo do local de atendimento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notas */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Internas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='[TRANSLATION_NEEDED]'
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas do Cliente</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='[TRANSLATION_NEEDED]'
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {schedule ? 'Atualizar' : '[TRANSLATION_NEEDED]'} Agendamento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleModal;