// ✅ 1QA.MD COMPLIANCE: CREATE CONTRACT DIALOG
// Clean Architecture - Frontend Form Component

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
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

// ✅ 1QA.MD COMPLIANCE: ZOD SCHEMA VALIDATION
const createContractSchema = z.object({
  contractNumber: z.string().min(1, 'Número do contrato é obrigatório'),
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  contractType: z.enum(['service', 'supply', 'maintenance', 'rental', 'sla']),
  priority: z.enum(['low', 'medium', 'high', 'critical', 'emergency']).default('medium'),
  customerCompanyId: z.string().min(1, 'Empresa cliente é obrigatória'),
  managerId: z.string().min(1, 'Gerente responsável é obrigatório'),
  technicalManagerId: z.string().optional(),
  locationId: z.string().optional(),
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

type CreateContractFormData = z.infer<typeof createContractSchema>;

// Opções para os selects
const contractTypes = [
  { value: 'service', label: 'Serviço' },
  { value: 'supply', label: 'Fornecimento' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'rental', label: 'Locação' },
  { value: 'sla', label: 'SLA' },
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

interface CreateContractDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateContractDialog({ children, open, onOpenChange }: CreateContractDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateContractFormData>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      contractNumber: '',
      title: '',
      contractType: 'service',
      priority: 'medium',
      customerCompanyId: '',
      managerId: '',
      technicalManagerId: '',
      locationId: '',
      startDate: '',
      endDate: '',
      totalValue: 0,
      monthlyValue: 0,
      currency: 'BRL',
      paymentTerms: undefined,
      description: '',
      termsConditions: '',
      autoRenewal: false,
      renewalPeriodMonths: undefined,
    },
  });

  // ✅ 1QA.MD COMPLIANCE: MUTATION WITH PROPER ERROR HANDLING
  const createContractMutation = useMutation({
    mutationFn: async (data: CreateContractFormData) => {
      console.log('Creating contract with data:', data);
      const response = await apiRequest('/api/contracts', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/dashboard-metrics'] });
      toast({
        title: "Sucesso",
        description: "Contrato criado com sucesso",
      });
      form.reset();
      if (onOpenChange) {
        onOpenChange(false);
      } else {
        setIsOpen(false);
      }
    },
    onError: (error: any) => {
      console.error('Error creating contract:', error);
      toast({
        title: "Erro",
        description: error?.message || "Falha ao criar contrato",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateContractFormData) => {
    createContractMutation.mutate(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setIsOpen(newOpen);
    }
  };

  const isDialogOpen = open !== undefined ? open : isOpen;

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild data-testid="button-create-contract">
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-contract">
        <DialogHeader>
          <DialogTitle data-testid="title-create-contract">Criar Novo Contrato</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo contrato. Todos os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">Informações Básicas</h3>

                <FormField
                  control={form.control}
                  name="contractNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Contrato *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="CTR-2024-001" 
                          {...field} 
                          data-testid="input-contract-number"
                        />
                      </FormControl>
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
                        <Input 
                          placeholder="Contrato de Manutenção Predial" 
                          {...field} 
                          data-testid="input-contract-title"
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
                          <SelectTrigger data-testid="select-contract-type">
                            <SelectValue placeholder="Selecione o tipo" />
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
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue placeholder="Selecione a prioridade" />
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
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerCompanyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa Cliente *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ID da empresa cliente" 
                          {...field} 
                          data-testid="input-customer-company"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gerente Responsável *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ID do gerente responsável" 
                          {...field} 
                          data-testid="input-manager"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="technicalManagerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gerente Técnico</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ID do gerente técnico (opcional)" 
                          {...field} 
                          data-testid="input-technical-manager"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localização</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ID da localização (opcional)" 
                          {...field} 
                          data-testid="input-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Informações Comerciais e Datas */}
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
                            data-testid="input-start-date"
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
                            data-testid="input-end-date"
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
                            data-testid="input-total-value"
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
                            data-testid="input-monthly-value"
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
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue placeholder="Selecione a moeda" />
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
                          data-testid="input-payment-terms"
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
                            data-testid="switch-auto-renewal"
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
                              data-testid="input-renewal-period"
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
                          data-testid="textarea-terms"
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
                onClick={() => handleOpenChange(false)}
                data-testid="button-cancel-contract"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createContractMutation.isPending}
                data-testid="button-save-contract"
              >
                {createContractMutation.isPending ? 'Salvando...' : 'Criar Contrato'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}