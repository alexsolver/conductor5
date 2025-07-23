import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const createContractSchema = z.object({
  contractNumber: z.string().optional(), // Gerado automaticamente pelo backend
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  contractType: z.string().min(1, 'Tipo de contrato é obrigatório'),
  status: z.string().default('draft'),
  priority: z.string().default('medium'),
  customerCompanyId: z.string().optional(),
  managerId: z.string().optional(),
  totalValue: z.number().min(0, 'Valor deve ser maior que zero'),
  currency: z.string().default('BRL'),
  startDate: z.date({
    required_error: 'Data de início é obrigatória',
  }),
  endDate: z.date({
    required_error: 'Data de fim é obrigatória',
  }),
  renewalTerms: z.string().optional(),
  paymentTerms: z.string().optional(),
  terminationClause: z.string().optional(),
  scopeOfWork: z.string().optional(),
});

type CreateContractFormData = z.infer<typeof createContractSchema>;

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateContractDialog({ open, onOpenChange, onSuccess }: CreateContractDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateContractFormData>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      title: '',
      description: '',
      contractType: 'service',
      status: 'draft',
      priority: 'medium',
      currency: 'BRL',
      totalValue: 0,
      customerCompanyId: '',
      managerId: '',
    },
  });

  // Fetch customer companies for dropdown using apiRequest
  const { data: customerCompaniesData, isLoading: companiesLoading, error: companiesError } = useQuery({
    queryKey: ['/api/customers/companies'],
    retry: 1,
  });

  // Fetch users for manager dropdown
  const { data: usersData } = useQuery({
    queryKey: ['/api/user-management/users'],
  });

  // Ensure data is always arrays
  const customerCompanies = Array.isArray(customerCompaniesData) ? customerCompaniesData : 
                           customerCompaniesData?.data ? customerCompaniesData.data : [];
  const users = Array.isArray(usersData) ? usersData : 
               usersData?.users ? usersData.users : [];

  // Debug log
  console.log('Customer companies data:', { customerCompaniesData, customerCompanies, companiesLoading, companiesError });

  const createContractMutation = useMutation({
    mutationFn: (data: CreateContractFormData) => {
      return apiRequest('POST', '/api/contracts/contracts', data);
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Contrato criado com sucesso!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar contrato',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateContractFormData) => {
    createContractMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Contrato</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Contract Number Auto-Generated Info */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-gray-700">Número do Contrato:</div>
                <div className="text-sm text-gray-500 italic">
                  Será gerado automaticamente após a criação (ex: CTR-2025-003)
                </div>
              </div>
            </div>

            {/* Contract Type */}
            <FormField
              control={form.control}
              name="contractType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Contrato *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="service">Serviço</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                      <SelectItem value="support">Suporte</SelectItem>
                      <SelectItem value="consultation">Consultoria</SelectItem>
                      <SelectItem value="license">Licenciamento</SelectItem>
                      <SelectItem value="partnership">Parceria</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Contrato *</FormLabel>
                  <FormControl>
                    <Input placeholder="Contrato de Prestação de Serviços de TI" {...field} />
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
                      placeholder="Descrição detalhada do contrato..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contract Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="expired">Expirado</SelectItem>
                        <SelectItem value="terminated">Rescindido</SelectItem>
                        <SelectItem value="renewed">Renovado</SelectItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Client and Manager */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerCompanyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa Contratante *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa contratante" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma empresa</SelectItem>
                        {companiesLoading && <SelectItem value="loading">Carregando empresas...</SelectItem>}
                        {companiesError && <SelectItem value="error">Erro ao carregar empresas</SelectItem>}
                        {!companiesLoading && !companiesError && Array.isArray(customerCompanies) && customerCompanies.length === 0 && (
                          <SelectItem value="empty">Nenhuma empresa encontrada</SelectItem>
                        )}
                        {Array.isArray(customerCompanies) && customerCompanies.map((company: any) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name} {company.cnpj ? `(${company.cnpj})` : ''}
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
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gerente Responsável</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o gerente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum gerente</SelectItem>
                        {Array.isArray(users) && users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moeda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BRL">Real (BRL)</SelectItem>
                        <SelectItem value="USD">Dólar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
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
                            date < new Date()
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
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fim *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
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
                            date < form.getValues().startDate || date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Terms */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="scopeOfWork"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escopo do Trabalho</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o escopo detalhado do trabalho..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termos de Pagamento</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Exemplo: Pagamento em 30 dias após a prestação do serviço..."
                        className="min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="renewalTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termos de Renovação</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Exemplo: Renovação automática por igual período, salvo manifestação contrária..."
                        className="min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terminationClause"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cláusula de Rescisão</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Exemplo: Qualquer das partes pode rescindir mediante aviso prévio de 30 dias..."
                        className="min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createContractMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createContractMutation.isPending}
              >
                {createContractMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Criar Contrato
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}