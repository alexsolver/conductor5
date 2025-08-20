/**
 * GDPR Compliance Page - Frontend Interface
 * Clean Architecture - React implementation
 * Following 1qa.md enterprise patterns
 */

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
// import useLocalization from '@/hooks/useLocalization';
  Shield, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Search,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  Users,
  BarChart3,
  Calendar,
  Bell,
  Archive,
  Send,
  CheckSquare,
  TrendingUp,
  Activity,
  AlertCircle,
  FileCheck
} from 'lucide-react';

// ✅ Form Schemas following 1qa.md patterns
const gdprReportSchema = z.object({
  // Localization temporarily disabled

  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  reportType: z.enum([
    'dpia', 'audit_trail', 'data_breach', 'consent_management',
    'right_of_access', 'right_of_rectification', 'right_of_erasure',
    'data_portability', 'processing_activities', 'vendor_assessment',
    'training_compliance', 'incident_response'
  ]),
  priority: z.enum(['low', 'medium', 'high', 'critical', 'urgent']),
  riskLevel: z.enum(['minimal', 'low', 'medium', 'high', 'very_high']).optional(),
  assignedUserId: z.string().optional(),
  dueDate: z.string().optional(),
  reportData: z.record(z.any()).optional()
});

type GdprReportFormData = z.infer<typeof gdprReportSchema>;

interface GdprReport {
  id: string;
  title: string;
  description?: string;
  reportType: string;
  status: 'draft' | 'in_progress' | 'under_review' | 'approved' | 'published' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  riskLevel?: 'minimal' | 'low' | 'medium' | 'high' | 'very_high';
  complianceScore?: number;
  assignedUserId?: string;
  createdAt: string;
  dueDate?: string;
  submittedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
}

interface GdprMetrics {
  totalReports: number;
  activeReports: number;
  completedReports: number;
  overdueReports: number;
  averageComplianceScore: number;
  highRiskReports: number;
  reportsThisMonth: number;
  reportsLastMonth: number;
}

export default function GdprCompliance() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ✅ Queries following 1qa.md patterns
  const { data: reports, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['/api/gdpr-compliance/reports'],
    queryFn: () => apiRequest('/api/gdpr-compliance/reports')
  });

  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/gdpr-compliance/metrics'],
    queryFn: () => apiRequest('/api/gdpr-compliance/metrics')
  });

  // ✅ Mutations following 1qa.md patterns
  const createReportMutation = useMutation({
    mutationFn: (data: GdprReportFormData) => apiRequest('/api/gdpr-compliance/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({ title: 'Relatório GDPR criado com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['/api/gdpr-compliance/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gdpr-compliance/metrics'] });
    },
    onError: () => {
      toast({ title: 'Erro ao criar relatório GDPR', variant: 'destructive' });
    }
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<GdprReportFormData>) =>
      apiRequest(`/api/gdpr-compliance/reports/${id", {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: 'Relatório GDPR atualizado com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['/api/gdpr-compliance/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gdpr-compliance/metrics'] });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar relatório GDPR', variant: 'destructive' });
    }
  });

  // ✅ Report Type Translation
  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'dpia': 'DPIA - Avaliação de Impacto',
      'audit_trail': 'Trilha de Auditoria',
      'data_breach': 'Violação de Dados',
      'consent_management': 'Gestão de Consentimento',
      'right_of_access': 'Direito de Acesso',
      'right_of_rectification': 'Direito de Retificação',
      'right_of_erasure': 'Direito ao Apagamento',
      'data_portability': 'Portabilidade de Dados',
      'processing_activities': 'Atividades de Processamento',
      'vendor_assessment': 'Avaliação de Fornecedores',
      'training_compliance': 'Treinamento de Compliance',
      'incident_response': 'Resposta a Incidentes'
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'draft': 'Rascunho',
      'in_progress': 'Em Progresso',
      'under_review': 'Em Revisão',
      'approved': 'Aprovado',
      'published': 'Publicado',
      'archived': 'Arquivado'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta',
      'critical': 'Crítica',
      'urgent': 'Urgente'
    };
    return labels[priority] || priority;
  };

  // ✅ CreateGdprReportDialog Component
  const CreateGdprReportDialog = () => {
    const form = useForm<GdprReportFormData>({
      resolver: zodResolver(gdprReportSchema),
      defaultValues: {
        title: '',
        description: '',
        priority: 'medium'
      }
    });

    const onSubmit = (data: GdprReportFormData) => {
      createReportMutation.mutate(data);
      form.reset();
    };

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button data-testid="button-create-report">
            <Plus className="w-4 h-4 mr-2" />
            Novo Relatório GDPR
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Relatório GDPR</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Relatório</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-report-type">
                          <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dpia">DPIA - Avaliação de Impacto</SelectItem>
                        <SelectItem value="audit_trail">Trilha de Auditoria</SelectItem>
                        <SelectItem value="data_breach">Violação de Dados</SelectItem>
                        <SelectItem value="consent_management">Gestão de Consentimento</SelectItem>
                        <SelectItem value="right_of_access">Direito de Acesso</SelectItem>
                        <SelectItem value="right_of_rectification">Direito de Retificação</SelectItem>
                        <SelectItem value="right_of_erasure">Direito ao Apagamento</SelectItem>
                        <SelectItem value="data_portability">Portabilidade de Dados</SelectItem>
                        <SelectItem value="processing_activities">Atividades de Processamento</SelectItem>
                        <SelectItem value="vendor_assessment">Avaliação de Fornecedores</SelectItem>
                        <SelectItem value="training_compliance">Treinamento de Compliance</SelectItem>
                        <SelectItem value="incident_response">Resposta a Incidentes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="riskLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Risco</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-risk-level">
                            <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="minimal">Mínimo</SelectItem>
                          <SelectItem value="low">Baixo</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="high">Alto</SelectItem>
                          <SelectItem value="very_high">Muito Alto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-due-date" />
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
                      <Textarea {...field} rows={3} data-testid="textarea-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="submit" disabled={createReportMutation.isPending} data-testid="button-submit-report">
                  {createReportMutation.isPending ? 'Criando...' : '[TRANSLATION_NEEDED]'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };

  // ✅ Dashboard rendering
  const renderDashboard = () => {
    const metrics: GdprMetrics = metricsData?.data?.metrics || {
      totalReports: 0,
      activeReports: 0,
      completedReports: 0,
      overdueReports: 0,
      averageComplianceScore: 0,
      highRiskReports: 0,
      reportsThisMonth: 0,
      reportsLastMonth: 0
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Dashboard GDPR Compliance</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => refetchReports()} data-testid="button-refresh">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="card-total-reports">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalReports}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-active-reports">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Relatórios Ativos</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.activeReports}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-overdue-reports">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Relatórios Vencidos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.overdueReports}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-compliance-score">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score de Compliance</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.averageComplianceScore}%</div>
              <Progress value={metrics.averageComplianceScore} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Additional metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card data-testid="card-high-risk">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Relatórios de Alto Risco</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.highRiskReports}</div>
              <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
            </CardContent>
          </Card>

          <Card data-testid="card-this-month">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.reportsThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.reportsThisMonth > metrics.reportsLastMonth ? '+' : ''}
                {metrics.reportsThisMonth - metrics.reportsLastMonth} vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-completed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.completedReports}</div>
              <p className="text-xs text-muted-foreground">Aprovados e publicados</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ✅ Reports listing rendering
  const renderReports = () => {
    const reportsData = reports?.data || [];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Relatórios GDPR</h2>
          <CreateGdprReportDialog />
        </div>

        {/* Filters */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <Input
              placeholder='[TRANSLATION_NEEDED]'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              data-testid="input-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="under_review">Em Revisão</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-6">
          {reportsData && Array.isArray(reportsData) && reportsData.length > 0 ? (
            reportsData.map((report: GdprReport) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow" data-testid={`card-report-${report.id"}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={report.priority === 'high' || report.priority === 'critical' ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {getPriorityLabel(report.priority)}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            report.status === 'published' ? 'bg-green-50 text-green-700' :
                            report.status === 'approved' ? 'bg-blue-50 text-blue-700' : 
                            'bg-gray-50 text-gray-700'
                          "}
                        >
                          {getStatusLabel(report.status)}
                        </Badge>
                        {report.riskLevel && (
                          <Badge variant="secondary" className="text-xs">
                            Risco: {report.riskLevel === 'very_high' ? 'Muito Alto' : 
                                   report.riskLevel === 'high' ? 'Alto' :
                                   report.riskLevel === 'medium' ? 'Médio' :
                                   report.riskLevel === 'low' ? 'Baixo' : 'Mínimo'}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {getReportTypeLabel(report.reportType)}
                        {report.description && ` - ${report.description"}
                      </CardDescription>
                    </div>
                    
                    {report.complianceScore && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Score</div>
                        <div className="text-2xl font-bold text-green-600">{report.complianceScore}%</div>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-muted-foreground">Criado:</span>
                      <span className="font-medium">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {report.dueDate && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-muted-foreground">Vencimento:</span>
                        <span className={`font-medium ${
                          new Date(report.dueDate) < new Date() ? 'text-red-600' : ''
                        "}>
                          {new Date(report.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {report.assignedUserId && (
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-muted-foreground">Responsável:</span>
                        <span className="font-medium">Atribuído</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button size="sm" variant="outline" data-testid={`button-view-${report.id"}>
                      <Eye className="w-3 h-3 mr-1" />
                      Ver Detalhes
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-edit-${report.id"}>
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    {report.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => updateReportMutation.mutate({ id: report.id, status: 'in_progress' })}
                        data-testid={`button-submit-${report.id"}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Enviar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Nenhum relatório GDPR
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Crie relatórios GDPR para gerenciar compliance de dados.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            GDPR Compliance
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sistema completo de gestão de compliance GDPR e proteção de dados
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">
              <FileText className="w-4 h-4 mr-2" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              <FileCheck className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit">
              <Shield className="w-4 h-4 mr-2" />
              Auditoria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            {renderDashboard()}
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            {renderReports()}
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Templates GDPR</CardTitle>
                <CardDescription>
                  Modelos predefinidos para diferentes tipos de relatórios GDPR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento - Templates para DPIA, relatórios de violação, etc.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Trilha de Auditoria</CardTitle>
                <CardDescription>
                  Registro completo de todas as ações relacionadas ao compliance GDPR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento - Logs de auditoria e rastreamento de mudanças
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}