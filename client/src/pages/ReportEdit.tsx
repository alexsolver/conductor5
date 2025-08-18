
import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, X } from 'lucide-react';

// ✅ 1QA.MD COMPLIANCE: Schema validation for report editing
const editReportSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().optional(),
  dataSource: z.string().min(1, 'Fonte de dados é obrigatória'),
  category: z.enum(['operational', 'analytical', 'compliance', 'financial', 'executive']),
  chartType: z.enum(['bar', 'line', 'pie', 'gauge', 'table', 'scatter']),
  isPublic: z.boolean().default(false),
  accessLevel: z.enum(['public', 'team', 'private']).default('private'),
});

type EditReportFormData = z.infer<typeof editReportSchema>;

interface Report {
  id: string;
  name: string;
  description?: string;
  dataSource: string;
  category: string;
  chartType: string;
  isPublic: boolean;
  accessLevel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ✅ 1QA.MD COMPLIANCE: API request helper following patterns
const apiRequest = async (method: string, url: string, data?: any) => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`/api${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export default function ReportEdit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('✅ [REPORT-EDIT] Editing report ID:', id);

  // ✅ 1QA.MD COMPLIANCE: Data fetching with error handling
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: [`/api/reports-dashboards/reports/${id}`],
    queryFn: () => apiRequest('GET', `/reports-dashboards/reports/${id}`),
    enabled: !!id,
    retry: false,
  });

  const report: Report | undefined = reportData?.data;

  // ✅ 1QA.MD COMPLIANCE: Form setup with validation
  const form = useForm<EditReportFormData>({
    resolver: zodResolver(editReportSchema),
    defaultValues: {
      name: '',
      description: '',
      dataSource: '',
      category: 'operational',
      chartType: 'bar',
      isPublic: false,
      accessLevel: 'private',
    },
  });

  // ✅ 1QA.MD COMPLIANCE: Update form when data loads
  useEffect(() => {
    if (report) {
      console.log('✅ [REPORT-EDIT] Loading report data into form:', report);
      form.reset({
        name: report.name,
        description: report.description || '',
        dataSource: report.dataSource,
        category: report.category as any,
        chartType: report.chartType as any,
        isPublic: report.isPublic,
        accessLevel: report.accessLevel as any,
      });
    }
  }, [report, form]);

  // ✅ 1QA.MD COMPLIANCE: Update mutation with error handling
  const updateMutation = useMutation({
    mutationFn: (data: EditReportFormData) => {
      console.log('✅ [REPORT-EDIT] Updating report with data:', data);
      return apiRequest('PUT', `/reports-dashboards/reports/${id}`, data);
    },
    onSuccess: () => {
      console.log('✅ [REPORT-EDIT] Report updated successfully');
      toast({
        title: 'Relatório atualizado',
        description: 'O relatório foi atualizado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reports-dashboards/reports'] });
      setLocation('/reports');
    },
    onError: (error: any) => {
      console.error('❌ [REPORT-EDIT] Error updating report:', error);
      toast({
        title: 'Erro ao atualizar relatório',
        description: error.message || 'Ocorreu um erro ao atualizar o relatório.',
        variant: 'destructive',
      });
    },
  });

  // ✅ 1QA.MD COMPLIANCE: Form submission handler
  const onSubmit = (data: EditReportFormData) => {
    console.log('✅ [REPORT-EDIT] Form submitted with data:', data);
    updateMutation.mutate(data);
  };

  // ✅ 1QA.MD COMPLIANCE: Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando relatório...</div>
        </div>
      </div>
    );
  }

  // ✅ 1QA.MD COMPLIANCE: Error state
  if (error || !report) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Relatório não encontrado
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                O relatório solicitado não foi encontrado ou você não tem permissão para editá-lo.
              </p>
              <Button onClick={() => setLocation('/reports')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar aos Relatórios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* ✅ 1QA.MD COMPLIANCE: Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/reports')}
            data-testid="button-back-to-reports"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Editar Relatório
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Edite as configurações do relatório "{report.name}"
            </p>
          </div>
        </div>
        <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
          {report.status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* ✅ 1QA.MD COMPLIANCE: Edit form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Relatório *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o nome do relatório"
                          {...field}
                          data-testid="input-report-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fonte de Dados */}
                <FormField
                  control={form.control}
                  name="dataSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fonte de Dados *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-data-source">
                            <SelectValue placeholder="Selecione a fonte de dados" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tickets">Tickets</SelectItem>
                          <SelectItem value="customers">Clientes</SelectItem>
                          <SelectItem value="users">Usuários</SelectItem>
                          <SelectItem value="timecard">Cartão de Ponto</SelectItem>
                          <SelectItem value="materials">Materiais</SelectItem>
                          <SelectItem value="contracts">Contratos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categoria */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="operational">Operacional</SelectItem>
                          <SelectItem value="analytical">Analítico</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="financial">Financeiro</SelectItem>
                          <SelectItem value="executive">Executivo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo de Gráfico */}
                <FormField
                  control={form.control}
                  name="chartType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Gráfico *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-chart-type">
                            <SelectValue placeholder="Selecione o tipo de gráfico" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bar">Barras</SelectItem>
                          <SelectItem value="line">Linha</SelectItem>
                          <SelectItem value="pie">Pizza</SelectItem>
                          <SelectItem value="gauge">Gauge</SelectItem>
                          <SelectItem value="table">Tabela</SelectItem>
                          <SelectItem value="scatter">Dispersão</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nível de Acesso */}
                <FormField
                  control={form.control}
                  name="accessLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Acesso *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-access-level">
                            <SelectValue placeholder="Selecione o nível de acesso" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="private">Privado</SelectItem>
                          <SelectItem value="team">Equipe</SelectItem>
                          <SelectItem value="public">Público</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Descrição */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite uma descrição para o relatório (opcional)"
                        className="min-h-[100px]"
                        {...field}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/reports')}
                  disabled={updateMutation.isPending}
                  data-testid="button-cancel-edit"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-save-report"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
