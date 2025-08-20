import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
// import { useLocalization } from '@/hooks/useLocalization';

const bulkAssignmentSchema = z.object({
  // Localization temporarily disabled

  templateId: z.string().min(1, 'Template é obrigatório'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  userIds: z.array(z.string()).min(1, 'Selecione pelo menos um funcionário'),
});

type BulkAssignmentForm = z.infer<typeof bulkAssignmentSchema>;

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  scheduleType: string;
  workDaysPerWeek: number;
  hoursPerDay: string;
  isActive: boolean;
}

export default function BulkScheduleAssignment() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BulkAssignmentForm>({
    resolver: zodResolver(bulkAssignmentSchema),
    defaultValues: {
      templateId: '',
      startDate: '',
      userIds: [],
    },
  });

  // Buscar todos os tipos de escala disponíveis (templates customizados + tipos padrão)
  const { data: templatesResponse, isLoading: loadingTemplates } = useQuery({
    queryKey: ['/api/timecard/schedule-templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/schedule-templates');
      console.log('[BULK-ASSIGNMENT] Templates response:', response);
      return response;
    },
  });

  const templates = templatesResponse?.templates || [];

  // Buscar usuários disponíveis para escalas de trabalho
  const { data: availableUsersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/timecard/available-users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/available-users');
      console.log('[BULK-ASSIGNMENT] Users response:', response);
      return response;
    },
  });

  // Transformar dados dos usuários para o formato esperado
  const availableUsers = availableUsersData?.users ? availableUsersData.users.map((user: any) => ({
    id: user.id,
    first_name: user.firstName || user.first_name || user.name?.split(' ')[0] || '',
    last_name: user.lastName || user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
    email: user.email,
    role: user.role || 'Funcionário'
  })) : [];

  // Verificar escalas existentes para usuários selecionados
  const { data: existingSchedules = [] } = useQuery({
    queryKey: ['/api/timecard/schedules/by-users', selectedUsers],
    queryFn: async () => {
      if (selectedUsers.length === 0) return [];
      // Endpoint não implementado ainda, retornar array vazio por enquanto
      return [];
    },
    enabled: selectedUsers.length > 0,
  });

  // Mutation para aplicar escala em lote
  const applyScheduleMutation = useMutation({
    mutationFn: async (data: BulkAssignmentForm) => {
      // Endpoint não implementado ainda, simular sucesso por enquanto
      console.log('[BULK-ASSIGNMENT] Would apply:', data);
      toast({
        title: 'Funcionalidade em desenvolvimento',
        description: 'A aplicação em lote será implementada em breve.',
        variant: 'default',
      });
      return { applied_count: data.userIds.length };
    },
    onSuccess: (data) => {
      toast({
        title: 'Visualização Completa',
        description: " funcionários seriam afetados`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/schedules'] });
      form.reset();
      setSelectedUsers([]);
      setPreviewMode(false);
    },
    onError: (error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    },
  });

  // Atualizar form quando usuários são selecionados
  useEffect(() => {
    form.setValue('userIds', selectedUsers);
  }, [selectedUsers, form]);

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const selectAllUsers = () => {
    const allUserIds = availableUsers.map((user: any) => user.id);
    setSelectedUsers(allUserIds);
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const onSubmit = (data: BulkAssignmentForm) => {
    if (!previewMode) {
      setPreviewMode(true);
      return;
    }
    applyScheduleMutation.mutate(data);
  };

  const selectedTemplate = templates.find((t: ScheduleTemplate) => t.id === form.watch('templateId'));
  const usersWithConflicts = existingSchedules.map((schedule: any) => schedule.userId);

  return (
    <div className="p-4 space-y-6>
      <div className="flex justify-between items-center>
        <div>
          <h2 className="text-2xl font-bold">Atribuição em Lote de Escalas</h2>
          <p className="text-muted-foreground>
            Aplique um template de escala para múltiplos funcionários de uma vez
          </p>
        </div>
        <Badge variant={previewMode ? 'secondary' : 'default'}>
          {previewMode ? 'Modo Visualização' : 'Seleção'}
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6>
            {/* Seleção de Template */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2>
                  <Clock className="h-5 w-5" />
                  Template de Escala
                </CardTitle>
                <CardDescription>
                  Escolha o template que será aplicado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={previewMode}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingTemplates ? (
                            <SelectItem value="loading" disabled>Carregando templates...</SelectItem>
                          ) : templates.length === 0 ? (
                            <SelectItem value="empty" disabled>Nenhum template disponível</SelectItem>
                          ) : (
                            templates.map((template: any) => (
                              <SelectItem key={template.id} value={template.id}>
                                <div className="flex flex-col>
                                  <span className="font-medium">{template.name}</span>
                                  <span className="text-sm text-muted-foreground>
                                    {template.scheduleType} • {template.description || 'Sem descrição'}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="mt-4>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          disabled={previewMode}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedTemplate && (
                  <div className="mt-4 p-3 bg-muted rounded-lg>
                    <h4 className="font-medium mb-2">Detalhes do Template</h4>
                    <div className="space-y-1 text-sm>
                      <p><strong>Tipo:</strong> {selectedTemplate.scheduleType}</p>
                      <p><strong>Dias por semana:</strong> {selectedTemplate.workDaysPerWeek}</p>
                      <p><strong>Horas por dia:</strong> {selectedTemplate.hoursPerDay}</p>
                      <p><strong>Descrição:</strong> {selectedTemplate.description}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seleção de Funcionários */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2>
                  <Users className="h-5 w-5" />
                  Funcionários ({selectedUsers.length} selecionados)
                </CardTitle>
                <CardDescription>
                  Selecione os funcionários que receberão a escala
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllUsers}
                    disabled={previewMode}
                  >
                    Selecionar Todos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    disabled={previewMode}
                  >
                    Limpar Seleção
                  </Button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2>
                  {loadingUsers ? (
                    <p className="text-sm text-muted-foreground">Carregando funcionários...</p>
                  ) : availableUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum funcionário disponível</p>
                  ) : (
                    availableUsers.map((user: any) => {
                      const hasConflict = usersWithConflicts.includes(user.id);
                      const displayName = "
                      return (
                        <div
                          key={user.id}
                          className={`flex items-center space-x-2 p-2 rounded border ${
                            hasConflict ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                          "
                        >
                          <Checkbox
                            id={user.id}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => 
                              handleUserSelection(user.id, checked as boolean)
                            }
                            disabled={previewMode}
                          />
                          <label htmlFor={user.id} className="flex-1 cursor-pointer>
                            <div className="flex items-center justify-between>
                              <div>
                                <p className="text-sm font-medium>
                                  {displayName}
                                </p>
                                <p className="text-xs text-muted-foreground>
                                  {user.email} • {user.role || 'Funcionário'}
                                </p>
                              </div>
                              {hasConflict && (
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>

                {usersWithConflicts.length > 0 && selectedUsers.some(id => usersWithConflicts.includes(id)) && (
                  <Alert className="mt-4>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Alguns funcionários selecionados já possuem escalas ativas. 
                      A nova escala substituirá as existentes.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview da Atribuição */}
          {previewMode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Confirmação da Atribuição
                </CardTitle>
                <CardDescription>
                  Revise os detalhes antes de aplicar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4>
                  <div>
                    <p className="text-sm font-medium">Template</p>
                    <p className="text-sm text-muted-foreground">{selectedTemplate?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Data de Início</p>
                    <p className="text-sm text-muted-foreground>
                      {new Date(form.watch('startDate')).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Funcionários</p>
                    <p className="text-sm text-muted-foreground">{selectedUsers.length} selecionados</p>
                  </div>
                </div>

                <div className="flex gap-2>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPreviewMode(false)}
                  >
                    Voltar para Edição
                  </Button>
                  <Button
                    type="submit"
                    disabled={applyScheduleMutation.isPending}
                  >
                    {applyScheduleMutation.isPending ? 'Aplicando...' : 'Confirmar Atribuição'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          {!previewMode && (
            <div className="flex justify-end gap-2>
              <Button type="submit" disabled={selectedUsers.length === 0 || !form.watch('templateId')}>
                Visualizar Atribuição
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}