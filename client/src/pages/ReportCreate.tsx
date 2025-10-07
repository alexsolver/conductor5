
import { useState } from "react";
import { useLocation } from 'wouter';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { 
  Plus, ArrowLeft, Save, Eye, Settings, Database, Palette, FileText,
  BarChart3, LineChart, PieChart, Grid, TrendingUp, CheckCircle2
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Enhanced schema for comprehensive report creation
const reportSchema = z.object({
  name: z.string().min(1, "Report name is required"),
  description: z.string().optional(),
  dataSource: z.enum(["tickets", "customers", "users", "materials", "services", "timecard", "locations", "omnibridge"]),
  category: z.enum(["operational", "analytical", "compliance", "financial", "hr", "strategic"]),
  chartType: z.enum(["bar", "line", "pie", "table", "gauge", "area", "scatter", "heatmap"]),
  filters: z.string().optional(),
  schedulingEnabled: z.boolean().default(false),
  scheduleType: z.enum(["cron", "interval", "event_driven", "threshold"]).optional(),
  scheduleConfig: z.string().optional(),
  isPublic: z.boolean().default(false),
  accessLevel: z.enum(["private", "team", "company", "public"]).default("private"),
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function ReportCreate() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("basic");
  const [reportType, setReportType] = useState<'standard' | 'advanced' | 'wysiwyg'>('standard');
  const [query, setQuery] = useState<any>({});
  const [wysiwygDesign, setWysiwygDesign] = useState<any>({});
  const [isCreating, setIsCreating] = useState(false);

  const { toast } = useToast();

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      category: "operational",
      chartType: "table",
      accessLevel: "private",
      schedulingEnabled: false,
      isPublic: false,
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const reportData = {
        ...data,
        query: reportType === 'advanced' ? query : undefined,
        wysiwygDesign: reportType === 'wysiwyg' ? wysiwygDesign : undefined,
        reportType,
      };
      return apiRequest("POST", "/api/reports-dashboards/reports", reportData);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Relatório criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-dashboards/reports"] });
      setLocation("/reports");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.message || "Falha ao criar relatório.",
        variant: "destructive",
      });
    },
  });

  const handleCreateReport = async (data: ReportFormData) => {
    setIsCreating(true);
    try {
      await createReportMutation.mutateAsync(data);
    } finally {
      setIsCreating(false);
    }
  };

  const handleQueryChange = (newQuery: any) => {
    console.log('✅ [QUERY-BUILDER] Query updated:', newQuery);
    setQuery(newQuery);
  };

  const handleWysiwygSave = (design: any) => {
    console.log('✅ [WYSIWYG] Design saved:', design);
    setWysiwygDesign(design);
    if (design.name) {
      form.setValue('name', design.name);
    }
    if (design.description) {
      form.setValue('description', design.description);
    }
  };

  const canCreateReport = () => {
    const formData = form.getValues();
    if (!formData.name?.trim()) return false;
    
    if (reportType === 'advanced') {
      return query.dataSource && query.selectedTables?.length > 0;
    }
    if (reportType === 'standard') {
      return formData.dataSource;
    }
    if (reportType === 'wysiwyg') {
      return wysiwygDesign.elements?.length > 0;
    }
    return true;
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/reports")}
            data-testid="button-back-to-reports"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Relatórios
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Criar Novo Relatório
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Configure seu relatório com todas as funcionalidades avançadas
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setActiveTab("preview")}
            data-testid="button-preview"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={form.handleSubmit(handleCreateReport)}
            disabled={isCreating || !canCreateReport()}
            data-testid="button-save-report"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isCreating ? "Criando..." : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Criar Relatório
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                reportType === 'standard' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setReportType('standard')}
            >
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h4 className="font-semibold mb-2">Relatório Padrão</h4>
                <p className="text-sm text-muted-foreground">
                  Seleção simples de fonte de dados e campos básicos
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                reportType === 'advanced' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setReportType('advanced')}
            >
              <CardContent className="p-6 text-center">
                <Database className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h4 className="font-semibold mb-2">Query Builder Avançado</h4>
                <p className="text-sm text-muted-foreground">
                  Construção completa com filtros, períodos, joins e SQL
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                reportType === 'wysiwyg' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setReportType('wysiwyg')}
            >
              <CardContent className="p-6 text-center">
                <Palette className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h4 className="font-semibold mb-2">WYSIWYG Designer</h4>
                <p className="text-sm text-muted-foreground">
                  Designer visual para relatórios e PDFs personalizados
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Main Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" data-testid="tab-basic">
            <Settings className="w-4 h-4 mr-2" />
            Configurações Básicas
          </TabsTrigger>
          <TabsTrigger value="builder" data-testid="tab-builder">
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
          <TabsTrigger value="schedule" data-testid="tab-schedule">
            <TrendingUp className="w-4 h-4 mr-2" />
            Agendamento
          </TabsTrigger>
          <TabsTrigger value="preview" data-testid="tab-preview">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateReport)} className="space-y-6">
            {/* Basic Configuration Tab */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Selecione a categoria" />
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
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="accessLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nível de Acesso</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-access-level">
                                <SelectValue placeholder="Selecione o nível de acesso" />
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
                                  <SelectTrigger data-testid="select-data-source">
                                    <SelectValue placeholder="Selecione a fonte de dados" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="tickets">Sistema de Tickets</SelectItem>
                                  <SelectItem value="customers">Clientes e Empresas</SelectItem>
                                  <SelectItem value="users">Usuários</SelectItem>
                                  <SelectItem value="timecard">Controle de Ponto</SelectItem>
                                  <SelectItem value="materials">Materiais e Serviços</SelectItem>
                                  <SelectItem value="locations">Locais</SelectItem>
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
                              <div className="grid grid-cols-2 gap-2 mt-2">
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
                                    }`}
                                    onClick={() => field.onChange(type.value)}
                                  >
                                    <CardContent className="p-3 text-center">
                                      <type.icon className="w-6 h-6 mx-auto mb-1" />
                                      <div className="text-xs">{type.label}</div>
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
            <TabsContent value="builder" className="space-y-6">
              {reportType === 'wysiwyg' && (
                <Card>
                  <CardHeader>
                    <CardTitle>WYSIWYG Designer - Canvas A4 Profissional</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="min-h-[800px]">
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
                    <div className="min-h-[600px]">
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
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-blue-800 dark:text-blue-200">
                              Configuração Básica
                            </h5>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Para relatórios padrão, configure a fonte de dados e tipo de visualização na aba "Configurações Básicas".
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
            <TabsContent value="schedule" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agendamento e Automação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="schedulingEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Habilitar Agendamento</FormLabel>
                          <div className="text-sm text-muted-foreground">
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
                                <SelectTrigger data-testid="select-schedule-type">
                                  <SelectValue placeholder="Selecione o tipo" />
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
            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview do Relatório</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-6 rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-lg">{form.watch('name') || 'Nome do Relatório'}</h4>
                        <p className="text-muted-foreground">{form.watch('description') || 'Sem descrição'}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Tipo:</span>
                          <div className="capitalize">{reportType}</div>
                        </div>
                        <div>
                          <span className="font-medium">Categoria:</span>
                          <div className="capitalize">{form.watch('category')}</div>
                        </div>
                        <div>
                          <span className="font-medium">Acesso:</span>
                          <div className="capitalize">{form.watch('accessLevel')}</div>
                        </div>
                        <div>
                          <span className="font-medium">Agendamento:</span>
                          <div>{form.watch('schedulingEnabled') ? 'Ativo' : 'Inativo'}</div>
                        </div>
                      </div>

                      {reportType === 'wysiwyg' && wysiwygDesign.elements?.length > 0 && (
                        <div>
                          <span className="font-medium">WYSIWYG Elements:</span>
                          <div className="text-sm text-muted-foreground">
                            {wysiwygDesign.elements.length} elementos configurados
                          </div>
                        </div>
                      )}

                      {reportType === 'advanced' && query.dataSource && (
                        <div>
                          <span className="font-medium">Query Configuration:</span>
                          <div className="text-sm text-muted-foreground">
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
