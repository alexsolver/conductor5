// ✅ 1QA.MD COMPLIANCE: EDIT CONTRACT DIALOG
// Clean Architecture - Frontend Form Component for Contract Editing

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Edit } from 'lucide-react';
import {
// import { useLocalization } from '@/hooks/useLocalization';
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// ✅ 1QA.MD COMPLIANCE: ZOD SCHEMA VALIDATION FOR EDIT
const editContractSchema = z.object({
  // Localization temporarily disabled

  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  contractType: z.enum(['service', 'supply', 'maintenance', 'rental', 'sla']),
  status: z.enum(['draft', 'analysis', 'approved', 'active', 'finished', 'canceled']),
  priority: z.enum(['low', 'medium', 'high', 'critical', 'emergency']),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de fim é obrigatória'),
  totalValue: z.string().transform(val => parseFloat(val)).refine(val => val >= 0, 'Valor total deve ser positivo'),
  monthlyValue: z.string().transform(val => parseFloat(val)).refine(val => val >= 0, 'Valor mensal deve ser positivo'),
  currency: z.string().default('BRL'),
  paymentTerms: z.string().transform(val => parseInt(val)).optional(),
  description: z.string().optional(),
  termsConditions: z.string().optional(),
  autoRenewal: z.boolean().default(false),
  renewalPeriodMonths: z.string().transform(val => parseInt(val)).optional(),
});

type EditContractFormData = z.infer<typeof editContractSchema>;

// Opções para os selects
const contractTypes = [
  { value: 'service', label: 'Serviço' },
  { value: 'supply', label: 'Fornecimento' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'rental', label: 'Locação' },
  { value: 'sla', label: 'SLA' },
];

const contractStatuses = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'analysis', label: 'Análise' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'active', label: 'Ativo' },
  { value: 'finished', label: 'Finalizado' },
  { value: 'canceled', label: '[TRANSLATION_NEEDED]' },
];

const priorities = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
  { value: 'emergency', label: 'Emergencial' },
];

const currencies = [
  { value: 'BRL', label: 'Real (BRL)' },
  { value: 'USD', label: 'Dólar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

interface EditContractDialogProps {
  contractId: string;
  children?: React.ReactNode;
}

export function EditContractDialog({ contractId, children }: EditContractDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ 1QA.MD COMPLIANCE: FETCH CONTRACT DATA
  const { data: contractData, isLoading: isLoadingContract } = useQuery({
    queryKey: ['/api/contracts', contractId],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${contractId}`);
      const data = await response.json();
      return data?.contract || data?.data || data;
    },
    enabled: isOpen && !!contractId,
  });

  const form = useForm<EditContractFormData>({
    resolver: zodResolver(editContractSchema),
    defaultValues: {
      contractType: 'service',
      status: 'draft',
      priority: 'medium',
      currency: 'BRL',
      autoRenewal: false,
    },
  });

  // ✅ RESET FORM WITH CONTRACT DATA
  useEffect(() => {
    if (contractData && isOpen) {
      form.reset({
        title: contractData.title || '',
        contractType: contractData.contractType || 'service',
        status: contractData.status || 'draft',
        priority: contractData.priority || 'medium',
        startDate: contractData.startDate || '',
        endDate: contractData.endDate || '',
        totalValue: contractData.totalValue?.toString() || '0',
        monthlyValue: contractData.monthlyValue?.toString() || '0',
        currency: contractData.currency || 'BRL',
        paymentTerms: contractData.paymentTerms?.toString() || '',
        description: contractData.description || '',
        termsConditions: contractData.termsConditions || '',
        autoRenewal: contractData.autoRenewal || false,
        renewalPeriodMonths: contractData.renewalPeriodMonths?.toString() || '',
      });
    }
  }, [contractData, isOpen, form]);

  // ✅ 1QA.MD COMPLIANCE: UPDATE MUTATION
  const updateContractMutation = useMutation({
    mutationFn: async (data: EditContractFormData) => {
      const response = await apiRequest(`/api/contracts/${contractId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', contractId] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/dashboard-metrics'] });
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Contrato atualizado com sucesso",
      });
      setIsOpen(false);
    },
    onError: (error: any) => {
      console.error('[TRANSLATION_NEEDED]', error);
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error?.message || "Falha ao atualizar contrato",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditContractFormData) => {
    updateContractMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild data-testid={`button-edit-contract-${contractId}`}>
        {children || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-contract">
        <DialogHeader>
          <DialogTitle data-testid="title-edit-contract">Editar Contrato</DialogTitle>
          <DialogDescription>
            Atualize as informações do contrato. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        {isLoadingContract ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Carregando dados do contrato...</div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-muted-foreground">Informações Básicas</h3>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título do Contrato *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Contrato de Manutenção Predial" 
                            {...field} 
                            data-testid="input-edit-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contractType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Contrato *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-type">
                              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contractTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-status">
                              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contractStatuses.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
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
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-priority">
                              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorities.map((priority) => (
                              <SelectItem key={priority.value} value={priority.value}>
                                {priority.label}
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição detalhada do contrato..." 
                            className="min-h-[100px]"
                            {...field} 
                            data-testid="textarea-edit-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Informações Comerciais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-muted-foreground">Dados Comerciais</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Início *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              data-testid="input-edit-start-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Término *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              data-testid="input-edit-end-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                              placeholder="0.00" 
                              {...field} 
                              data-testid="input-edit-total-value"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="monthlyValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Mensal *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              {...field} 
                              data-testid="input-edit-monthly-value"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moeda</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-currency">
                              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
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
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prazo de Pagamento (dias)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="30" 
                            {...field} 
                            data-testid="input-edit-payment-terms"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="autoRenewal"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Renovação Automática</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Renovar automaticamente o contrato
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-edit-auto-renewal"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch('autoRenewal') && (
                      <FormField
                        control={form.control}
                        name="renewalPeriodMonths"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Período de Renovação (meses)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="12" 
                                {...field} 
                                data-testid="input-edit-renewal-period"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="termsConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Termos e Condições</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Termos e condições específicas do contrato..." 
                            className="min-h-[100px]"
                            {...field} 
                            data-testid="textarea-edit-terms"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateContractMutation.isPending}
                  data-testid="button-save-edit"
                >
                  {updateContractMutation.isPending ? 'Salvando...' : '[TRANSLATION_NEEDED]'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}