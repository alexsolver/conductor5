import { useState, useEffect } from "react";
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
// import useLocalization from '@/hooks/useLocalization';
  ArrowLeft, Save, Eye, Settings, Database, Palette, Trash2,
  BarChart3, LineChart, PieChart, Grid, TrendingUp, CheckCircle2, Loader2
} from "lucide-react";
import AdvancedWYSIWYGDesigner from '@/components/reports/AdvancedWYSIWYGDesigner';
import AdvancedQueryBuilder from '@/components/reports/AdvancedQueryBuilder';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
// Schema for report editing
const reportSchema = z.object({
  // Localization temporarily disabled
  name: z.string().min(1, "Report name is required"),
  description: z.string().optional(),
  dataSource: z.enum(["tickets", "customers", "users", "materials", "services", "timecard", "locations", "omnibridge"]),
  category: z.enum(["operational", "analytical", "compliance", "financial", "hr", "strategic"]),
  chartType: z.enum(["bar", "line", "pie", "table", "gauge", "area", "scatter", "heatmap"]),
  schedulingEnabled: z.boolean().default(false),
  scheduleType: z.enum(["cron", "interval", "event_driven", "threshold"]).optional(),
  scheduleConfig: z.string().optional(),
  accessLevel: z.enum(["private", "team", "company", "public"]).default("private"),
});
type ReportFormData = z.infer<typeof reportSchema>;
export default function ReportEdit() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/reports/:id/edit');
  const [activeTab, setActiveTab] = useState("basic");
  const [reportType, setReportType] = useState<'standard' | 'advanced' | 'wysiwyg'>('standard');
  const [query, setQuery] = useState<any>({});
  const [wysiwygDesign, setWysiwygDesign] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const reportId = params?.id;
  // Fetch existing report data
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ["/api/reports-dashboards/reports", reportId],
    queryFn: () => apiRequest("GET", "
    enabled: !!reportId,
  });
  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      category: "operational",
      chartType: "table",
      accessLevel: "private",
      schedulingEnabled: false,
    },
  });
  // Update form when data is loaded
  useEffect(() => {
    if (reportData?.data) {
      const report = reportData.data;
      form.reset({
        name: report.name,
        description: report.description,
        dataSource: report.dataSource,
        category: report.category,
        chartType: report.chartType,
        accessLevel: report.accessLevel,
        schedulingEnabled: !!report.scheduleConfig,
        scheduleType: report.scheduleConfig?.type,
        scheduleConfig: report.scheduleConfig ? JSON.stringify(report.scheduleConfig) : undefined,
      });
      // Determine report type based on existing data
      if (report.wysiwygDesign) {
        setReportType('wysiwyg');
        setWysiwygDesign(report.wysiwygDesign);
      } else if (report.query) {
        setReportType('advanced');
        setQuery(report.query);
      } else {
        setReportType('standard');
      }
    }
  }, [reportData, form]);
  const updateReportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const reportData = {
        ...data,
        query: reportType === 'advanced' ? query : undefined,
        wysiwygDesign: reportType === 'wysiwyg' ? wysiwygDesign : undefined,
        reportType,
      };
      return apiRequest("PUT", "
    },
    onSuccess: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Relatório atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-dashboards/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-dashboards/reports", reportId] });
      setLocation("/reports");
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error?.message || "Falha ao atualizar relatório.",
        variant: "destructive",
      });
    },
  });
  const deleteReportMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "
    onSuccess: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Relatório excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-dashboards/reports"] });
      setLocation("/reports");
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error?.message || "Falha ao excluir relatório.",
        variant: "destructive",
      });
    },
  });
  const handleUpdateReport = async (data: ReportFormData) => {
    setIsUpdating(true);
    try {
      await updateReportMutation.mutateAsync(data);
    } finally {
      setIsUpdating(false);
    }
  };
  const handleDeleteReport = () => {
    if (window.confirm('Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.')) {
      deleteReportMutation.mutate();
    }
  };
  const handleQueryChange = (newQuery: any) => {
    console.log('✅ [QUERY-BUILDER] Query updated:', newQuery);
    setQuery(newQuery);
  };
  const handleWysiwygSave = (design: any) => {
    console.log('✅ [WYSIWYG] Design saved:', design);
    setWysiwygDesign(design);
    if (design.name && design.name !== form.getValues('name')) {
      form.setValue('name', design.name);
    }
    if (design.description && design.description !== form.getValues('description')) {
      form.setValue('description', design.description);
    }
  };
  if (!match) {
    setLocation("/reports");
    return null;
  }
  if (isLoading) {
    return (
      <div className="p-4"
        <div className="p-4"
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Carregando relatório...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4"
        <Card>
          <CardContent className="p-4"
            <p className="text-lg">"Erro ao carregar relatório: {error.message}</p>
            <Button
              onClick={() => setLocation("/reports")}
              className="mt-4"
            >
              Voltar aos Relatórios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="p-4"
      {/* Header */}
      <div className="p-4"
        <div className="p-4"
          <Button
            variant="ghost"
            onClick={() => setLocation("/reports")}
            data-testid="button-back-to-reports"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Relatórios
          </Button>
          <div>
            <h1 className="p-4"
              Editar Relatório
            </h1>
            <p className="p-4"
              {reportData?.data?.name || '[TRANSLATION_NEEDED]'}
            </p>
          </div>
        </div>
        <div className="p-4"
          <Button
            variant="outline"
            onClick={() => setActiveTab("preview")}
            data-testid="button-preview"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteReport}
            disabled={deleteReportMutation.isPending}
            data-testid="button-delete-report"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleteReportMutation.isPending ? "Excluindo..." : '[TRANSLATION_NEEDED]'}
          </Button>
          <Button
            onClick={form.handleSubmit(handleUpdateReport)}
            disabled={isUpdating}
            data-testid="button-save-report"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isUpdating ? "Salvando..." : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
      <Separator />
      {/* Report Type Display */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4"
            <Card className={reportType === 'standard' ? 'ring-2 ring-primary' : 'opacity-50'}>
              <CardContent className="p-4"
                <BarChart3 className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h4 className="text-lg">"Relatório Padrão</h4>
                <p className="p-4"
                  Seleção simples de fonte de dados e campos básicos
                </p>
              </CardContent>
            </Card>
            <Card className={reportType === 'advanced' ? 'ring-2 ring-primary' : 'opacity-50'}>
              <CardContent className="p-4"
                <Database className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h4 className="text-lg">"Query Builder Avançado</h4>
                <p className="p-4"
                  Construção completa com filtros, períodos, joins e SQL
                </p>
              </CardContent>
            </Card>
            <Card className={reportType === 'wysiwyg' ? 'ring-2 ring-primary' : 'opacity-50'}>
              <CardContent className="p-4"
                <Palette className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h4 className="text-lg">"WYSIWYG Designer</h4>
                <p className="p-4"
                  Designer visual para relatórios e PDFs personalizados
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      {/* Main Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="p-4"
          <TabsTrigger value="basic" data-testid="tab-basic>
            <Settings className="w-4 h-4 mr-2" />
            Configurações Básicas
          </TabsTrigger>
          <TabsTrigger value="builder" data-testid="tab-builder>
            {reportType === 'wysiwyg' ? (
              <>
                <Palette className="w-4 h-4 mr-2" />
                WYSIWYG Designer
              </>
            ) : reportType === 'advanced' ? (
              <>
                <Database className="w-4 h-4 mr-2" />
                Query Builder
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Configuração
              </>
            )}
          </TabsTrigger>
          <TabsTrigger value="schedule" data-testid="tab-schedule>
            <TrendingUp className="w-4 h-4 mr-2" />
            Agendamento
          </TabsTrigger>
          <TabsTrigger value="preview" data-testid="tab-preview>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdateReport)} className="p-4"
            {/* Basic Configuration Tab */}
            <TabsContent value="basic" className="p-4"
              <div className="p-4"
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4"
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Relatório *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: Relatório de Performance Mensal" 
                              {...field} 
                              data-testid="input-report-name"
                            />
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
                              placeholder="Descreva o objetivo e conteúdo do relatório..." 
                              {...field} 
                              data-testid="textarea-description"
                              rows={3}
                            />
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category>
                                <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="operational">Operacional</SelectItem>
                              <SelectItem value="analytical">Analítico</SelectItem>
                              <SelectItem value="compliance">Compliance</SelectItem>
                              <SelectItem value="financial">Financeiro</SelectItem>
                              <SelectItem value="hr">RH</SelectItem>
                              <SelectItem value="strategic">Estratégico</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de Acesso</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4"
                    <FormField
                      control={form.control}
                      name="accessLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nível de Acesso</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-access-level>
                                <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="private">Privado</SelectItem>
                              <SelectItem value="team">Equipe</SelectItem>
                              <SelectItem value="company">Empresa</SelectItem>
                              <SelectItem value="public">Público</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {reportType === 'standard' && (
                      <>
                        <FormField
                          control={form.control}
                          name="dataSource"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fonte de Dados *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-data-source>
                                    <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="tickets">Sistema de Tickets</SelectItem>
                                  <SelectItem value="customers">Clientes e Empresas</SelectItem>
                                  <SelectItem value="users">Usuários</SelectItem>
                                  <SelectItem value="timecard">Controle de Ponto</SelectItem>
                                  <SelectItem value="materials">Materiais e Serviços</SelectItem>
                                  <SelectItem value="locations">Localizações</SelectItem>
                                  <SelectItem value="omnibridge">OmniBridge</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="chartType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Visualização</FormLabel>
                              <div className="p-4"
                                {[
                                  { value: 'table', icon: Grid, label: 'Tabela' },
                                  { value: 'bar', icon: BarChart3, label: 'Barras' },
                                  { value: 'line', icon: LineChart, label: 'Linha' },
                                  { value: 'pie', icon: PieChart, label: 'Pizza' }
                                ].map((type) => (
                                  <Card
                                    key={type.value}
                                    className={`cursor-pointer transition-all hover:shadow-sm ${
                                      field.value === type.value ? 'ring-2 ring-primary' : ''
                                    "
                                    onClick={() => field.onChange(type.value)}
                                  >
                                    <CardContent className="p-4"
                                      <type.icon className="w-6 h-6 mx-auto mb-1" />
                                      <div className="text-lg">"{type.label}</div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            {/* Builder Tab */}
            <TabsContent value="builder" className="p-4"
              {reportType === 'wysiwyg' && (
                <Card>
                  <CardHeader>
                    <CardTitle>WYSIWYG Designer - Canvas A4 Profissional</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4"
                      <AdvancedWYSIWYGDesigner 
                        onSave={handleWysiwygSave}
                        initialDesign={wysiwygDesign}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
              {reportType === 'advanced' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Query Builder Avançado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4"
                      <AdvancedQueryBuilder 
                        onQueryChange={handleQueryChange}
                        onExecute={handleQueryChange}
                        initialQuery={query}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
              {reportType === 'standard' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configuração Padrão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4"
                      <div className="p-4"
                        <div className="p-4"
                          <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5" />
                          <div>
                            <h5 className="p-4"
                              Configuração Básica
                            </h5>
                            <p className="p-4"
                              Para relatórios padrão, configure a fonte de dados e tipo de visualização na aba '[TRANSLATION_NEEDED]'.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            {/* Schedule Tab */}
            <TabsContent value="schedule" className="p-4"
              <Card>
                <CardHeader>
                  <CardTitle>Agendamento e Automação</CardTitle>
                </CardHeader>
                <CardContent className="p-4"
                  <FormField
                    control={form.control}
                    name="schedulingEnabled"
                    render={({ field }) => (
                      <FormItem className="p-4"
                        <div className="p-4"
                          <FormLabel className="text-lg">"Habilitar Agendamento</FormLabel>
                          <div className="p-4"
                            Execute este relatório automaticamente
                          </div>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            data-testid="checkbox-scheduling"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {form.watch('schedulingEnabled') && (
                    <>
                      <FormField
                        control={form.control}
                        name="scheduleType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Agendamento</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-schedule-type>
                                  <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cron">Cron (Horário específico)</SelectItem>
                                <SelectItem value="interval">Intervalo (Repetir a cada X tempo)</SelectItem>
                                <SelectItem value="event_driven">Baseado em eventos</SelectItem>
                                <SelectItem value="threshold">Por limite/threshold</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="scheduleConfig"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Configuração do Agendamento</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Ex: 0 9 * * * (todo dia às 9h)" 
                                {...field} 
                                data-testid="textarea-schedule-config"
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {/* Preview Tab */}
            <TabsContent value="preview" className="p-4"
              <Card>
                <CardHeader>
                  <CardTitle>Preview do Relatório</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4"
                    <div className="p-4"
                      <div>
                        <h4 className="text-lg">"{form.watch('name') || 'Nome do Relatório'}</h4>
                        <p className="text-lg">"{form.watch('description') || 'Sem descrição'}</p>
                      </div>
                      
                      <div className="p-4"
                        <div>
                          <span className="text-lg">"Tipo:</span>
                          <div className="text-lg">"{reportType}</div>
                        </div>
                        <div>
                          <span className="text-lg">"Categoria:</span>
                          <div className="text-lg">"{form.watch('category')}</div>
                        </div>
                        <div>
                          <span className="text-lg">"Acesso:</span>
                          <div className="text-lg">"{form.watch('accessLevel')}</div>
                        </div>
                        <div>
                          <span className="text-lg">"Agendamento:</span>
                          <div>{form.watch('schedulingEnabled') ? 'Ativo' : 'Inativo'}</div>
                        </div>
                      </div>
                      {reportType === 'wysiwyg' && wysiwygDesign.elements?.length > 0 && (
                        <div>
                          <span className="text-lg">"WYSIWYG Elements:</span>
                          <div className="p-4"
                            {wysiwygDesign.elements.length} elementos configurados
                          </div>
                        </div>
                      )}
                      {reportType === 'advanced' && query.dataSource && (
                        <div>
                          <span className="text-lg">"Query Configuration:</span>
                          <div className="p-4"
                            Fonte: {query.dataSource}, Tabelas: {query.selectedTables?.length || 0}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  );
}
