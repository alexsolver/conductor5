import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Play, 
  Save, 
  ArrowLeft,
  MessageSquare,
  Menu,
  Zap,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ActionField {
  id?: string;
  fieldKey: string;
  fieldLabel: string;
  fieldDescription?: string;
  fieldType: string;
  isRequired: boolean;
  isCritical: boolean;
  collectionStrategy: 'conversational' | 'interactive' | 'hybrid' | 'adaptive';
  widgetConfig?: {
    type: string;
    options?: any;
    placeholder?: string;
    helpText?: string;
  };
  displayOrder: number;
}

interface ConfigurableAction {
  id?: string;
  actionKey: string;
  name: string;
  description?: string;
  category?: string;
  targetModule: string;
  targetEndpoint: string;
  collectionStrategy: 'conversational' | 'interactive' | 'hybrid' | 'adaptive';
  linkedFormId?: string;
  requiresConfirmation: boolean;
  endpointConfig: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
  };
  responseTemplates: {
    success: string;
    error: string;
    confirmation?: string;
  };
}

const WIDGET_TYPES = [
  { value: 'smart_client_selector', label: 'Seletor de Cliente Inteligente', icon: '👤' },
  { value: 'smart_location_picker', label: 'Seletor de Localização', icon: '📍' },
  { value: 'smart_datetime_picker', label: 'Seletor de Data/Hora', icon: '📅' },
  { value: 'priority_picker', label: 'Seletor de Prioridade', icon: '🔥' },
  { value: 'status_picker', label: 'Seletor de Status', icon: '✅' },
  { value: 'user_picker', label: 'Seletor de Usuário', icon: '👥' },
  { value: 'rich_text_editor', label: 'Editor de Texto Rico', icon: '📝' },
  { value: 'dropdown', label: 'Dropdown Simples', icon: '🔽' },
  { value: 'multi_select', label: 'Seleção Múltipla', icon: '☑️' },
  { value: 'number_stepper', label: 'Contador Numérico', icon: '🔢' },
  { value: 'email_input', label: 'Input de Email', icon: '📧' },
  { value: 'phone_input', label: 'Input de Telefone', icon: '📱' },
];

const FIELD_TYPES = [
  { value: 'string', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'date', label: 'Data' },
  { value: 'datetime', label: 'Data e Hora' },
  { value: 'select', label: 'Seleção' },
  { value: 'multiselect', label: 'Seleção Múltipla' },
  { value: 'boolean', label: 'Sim/Não' },
];

const MODULES = [
  { value: 'tickets', label: 'Tickets', endpoint: '/api/tickets' },
  { value: 'customers', label: 'Clientes', endpoint: '/api/customers' },
  { value: 'locations', label: 'Localizações', endpoint: '/api/locations' },
  { value: 'users', label: 'Usuários', endpoint: '/api/users' },
  { value: 'schedules', label: 'Agendamentos', endpoint: '/api/schedules' },
  { value: 'internal_forms', label: 'Formulários Internos', endpoint: '/api/internal-forms/submit' },
];

export default function AIActionBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [action, setAction] = useState<ConfigurableAction>({
    actionKey: '',
    name: '',
    description: '',
    category: '',
    targetModule: '',
    targetEndpoint: '',
    collectionStrategy: 'hybrid',
    requiresConfirmation: true,
    endpointConfig: {
      method: 'POST',
      url: ''
    },
    responseTemplates: {
      success: '✅ Ação executada com sucesso!',
      error: '❌ Erro ao executar ação: {error}',
      confirmation: '🔍 Confirmar execução da ação?'
    }
  });

  const [fields, setFields] = useState<ActionField[]>([]);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<ActionField | null>(null);

  // Query para listar ações existentes
  const { data: actionsData } = useQuery({
    queryKey: ['/api/ai-configurable-actions'],
  });

  // Query para listar formulários internos
  const { data: formsData } = useQuery({
    queryKey: ['/api/internal-forms'],
  });

  // Mutation para salvar ação
  const saveActionMutation = useMutation({
    mutationFn: async (data: { action: ConfigurableAction; fields: ActionField[] }) => {
      // Criar ação
      const actionResult = await apiRequest('/api/ai-configurable-actions', {
        method: 'POST',
        data: data.action
      });

      // Criar campos
      const actionId = actionResult.action.id;
      for (const field of data.fields) {
        await apiRequest(`/api/ai-configurable-actions/${actionId}/fields`, {
          method: 'POST',
          data: field
        });
      }

      return actionResult;
    },
    onSuccess: () => {
      toast({
        title: 'Ação salva!',
        description: 'A ação foi configurada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-configurable-actions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar a ação.',
        variant: 'destructive',
      });
    }
  });

  const handleAddField = () => {
    setEditingField({
      fieldKey: '',
      fieldLabel: '',
      fieldType: 'string',
      isRequired: false,
      isCritical: false,
      collectionStrategy: 'hybrid',
      displayOrder: fields.length,
    });
    setShowFieldDialog(true);
  };

  const handleSaveField = (field: ActionField) => {
    if (field.id) {
      // Editar campo existente
      setFields(fields.map(f => f.id === field.id ? field : f));
    } else {
      // Adicionar novo campo
      setFields([...fields, { ...field, id: `field-${Date.now()}` }]);
    }
    setShowFieldDialog(false);
    setEditingField(null);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const handleModuleChange = (moduleValue: string) => {
    const module = MODULES.find(m => m.value === moduleValue);
    if (module) {
      setAction({
        ...action,
        targetModule: module.value,
        targetEndpoint: module.endpoint,
        endpointConfig: {
          ...action.endpointConfig,
          url: module.endpoint
        }
      });
    }
  };

  const handleSave = () => {
    if (!action.actionKey || !action.name || !action.targetEndpoint) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    saveActionMutation.mutate({ action, fields });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Lista de Ações */}
      <div className="w-80 border-r bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" data-testid="text-actions-title">Ações Configuradas</h2>
          <Button size="sm" variant="outline" data-testid="button-new-action">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="space-y-2">
            {actionsData?.actions?.map((act: any) => (
              <Card key={act.id} className="cursor-pointer hover:bg-accent" data-testid={`card-action-${act.id}`}>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm" data-testid={`text-action-name-${act.id}`}>{act.name}</CardTitle>
                  <CardDescription className="text-xs" data-testid={`text-action-category-${act.id}`}>
                    {act.category || 'Sem categoria'}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
            
            {(!actionsData?.actions || actionsData.actions.length === 0) && (
              <div className="text-center text-muted-foreground text-sm py-8" data-testid="text-no-actions">
                Nenhuma ação configurada ainda
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">Configurador de Ações IA</h1>
              <p className="text-muted-foreground mt-1" data-testid="text-page-description">
                Configure ações que seus agentes IA podem executar automaticamente
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" data-testid="button-test-action">
                <Play className="mr-2 h-4 w-4" />
                Testar
              </Button>
              <Button onClick={handleSave} disabled={saveActionMutation.isPending} data-testid="button-save-action">
                <Save className="mr-2 h-4 w-4" />
                {saveActionMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" data-testid="tab-basic">
                <Settings className="mr-2 h-4 w-4" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="fields" data-testid="tab-fields">
                <FileText className="mr-2 h-4 w-4" />
                Campos ({fields.length})
              </TabsTrigger>
              <TabsTrigger value="strategy" data-testid="tab-strategy">
                <Zap className="mr-2 h-4 w-4" />
                Estratégia
              </TabsTrigger>
              <TabsTrigger value="integration" data-testid="tab-integration">
                <LinkIcon className="mr-2 h-4 w-4" />
                Integração
              </TabsTrigger>
            </TabsList>

            {/* Aba Básico */}
            <TabsContent value="basic" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-basic-info-title">Informações Básicas</CardTitle>
                  <CardDescription data-testid="text-basic-info-description">
                    Defina o nome e identificador da ação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="actionKey" data-testid="label-action-key">Chave da Ação *</Label>
                      <Input
                        id="actionKey"
                        placeholder="criar_ticket"
                        value={action.actionKey}
                        onChange={(e) => setAction({ ...action, actionKey: e.target.value })}
                        data-testid="input-action-key"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Identificador único (use snake_case)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="name" data-testid="label-action-name">Nome da Ação *</Label>
                      <Input
                        id="name"
                        placeholder="Criar Ticket"
                        value={action.name}
                        onChange={(e) => setAction({ ...action, name: e.target.value })}
                        data-testid="input-action-name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" data-testid="label-action-description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva o que essa ação faz..."
                      value={action.description}
                      onChange={(e) => setAction({ ...action, description: e.target.value })}
                      rows={3}
                      data-testid="input-action-description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" data-testid="label-action-category">Categoria</Label>
                      <Input
                        id="category"
                        placeholder="Tickets, Clientes, etc"
                        value={action.category}
                        onChange={(e) => setAction({ ...action, category: e.target.value })}
                        data-testid="input-action-category"
                      />
                    </div>
                    <div>
                      <Label htmlFor="module" data-testid="label-action-module">Módulo Destino *</Label>
                      <Select value={action.targetModule} onValueChange={handleModuleChange}>
                        <SelectTrigger data-testid="select-target-module">
                          <SelectValue placeholder="Selecione o módulo" />
                        </SelectTrigger>
                        <SelectContent>
                          {MODULES.map(module => (
                            <SelectItem key={module.value} value={module.value} data-testid={`select-item-module-${module.value}`}>
                              {module.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="method" data-testid="label-http-method">Método HTTP *</Label>
                      <Select 
                        value={action.endpointConfig.method} 
                        onValueChange={(value: any) => setAction({
                          ...action,
                          endpointConfig: { ...action.endpointConfig, method: value }
                        })}
                      >
                        <SelectTrigger data-testid="select-http-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="endpoint" data-testid="label-endpoint-url">Endpoint URL *</Label>
                      <Input
                        id="endpoint"
                        placeholder="/api/tickets"
                        value={action.targetEndpoint}
                        onChange={(e) => setAction({ ...action, targetEndpoint: e.target.value })}
                        data-testid="input-endpoint-url"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-templates-title">Templates de Resposta</CardTitle>
                  <CardDescription data-testid="text-templates-description">
                    Personalize as mensagens que a IA enviará
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="successTemplate" data-testid="label-success-template">Mensagem de Sucesso</Label>
                    <Textarea
                      id="successTemplate"
                      value={action.responseTemplates.success}
                      onChange={(e) => setAction({
                        ...action,
                        responseTemplates: { ...action.responseTemplates, success: e.target.value }
                      })}
                      rows={2}
                      data-testid="input-success-template"
                    />
                  </div>
                  <div>
                    <Label htmlFor="errorTemplate" data-testid="label-error-template">Mensagem de Erro</Label>
                    <Textarea
                      id="errorTemplate"
                      value={action.responseTemplates.error}
                      onChange={(e) => setAction({
                        ...action,
                        responseTemplates: { ...action.responseTemplates, error: e.target.value }
                      })}
                      rows={2}
                      data-testid="input-error-template"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Campos */}
            <TabsContent value="fields" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle data-testid="text-fields-title">Campos da Ação</CardTitle>
                      <CardDescription data-testid="text-fields-description">
                        Configure os campos necessários para executar a ação
                      </CardDescription>
                    </div>
                    <Button onClick={handleAddField} data-testid="button-add-field">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Campo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {fields.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground" data-testid="text-no-fields">
                      <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Nenhum campo adicionado ainda</p>
                      <p className="text-sm">Clique em "Adicionar Campo" para começar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <Card key={field.id} className="border-2" data-testid={`card-field-${field.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium" data-testid={`text-field-label-${field.id}`}>{field.fieldLabel}</span>
                                  {field.isRequired && (
                                    <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                                  )}
                                  {field.isCritical && (
                                    <Badge variant="secondary" className="text-xs">Crítico</Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs" data-testid={`badge-field-type-${field.id}`}>
                                    {field.fieldType}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span data-testid={`text-field-key-${field.id}`}>
                                    <code className="bg-muted px-1 rounded">{field.fieldKey}</code>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    {field.collectionStrategy === 'conversational' && <MessageSquare className="h-3 w-3" />}
                                    {field.collectionStrategy === 'interactive' && <Menu className="h-3 w-3" />}
                                    {field.collectionStrategy === 'hybrid' && <Zap className="h-3 w-3" />}
                                    {field.collectionStrategy === 'adaptive' && <Settings className="h-3 w-3" />}
                                    <span className="capitalize">{field.collectionStrategy}</span>
                                  </span>
                                  {field.widgetConfig && (
                                    <span className="flex items-center gap-1">
                                      Widget: {WIDGET_TYPES.find(w => w.value === field.widgetConfig?.type)?.label || field.widgetConfig.type}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingField(field);
                                    setShowFieldDialog(true);
                                  }}
                                  data-testid={`button-edit-field-${field.id}`}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleDeleteField(field.id!)}
                                  data-testid={`button-delete-field-${field.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Estratégia */}
            <TabsContent value="strategy" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-strategy-title">Estratégia de Coleta</CardTitle>
                  <CardDescription data-testid="text-strategy-description">
                    Defina como a IA deve coletar os dados dos usuários
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label data-testid="label-collection-strategy">Estratégia Padrão</Label>
                    <Select 
                      value={action.collectionStrategy} 
                      onValueChange={(value: any) => setAction({ ...action, collectionStrategy: value })}
                    >
                      <SelectTrigger className="mt-2" data-testid="select-collection-strategy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conversational">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Conversacional</div>
                              <div className="text-xs text-muted-foreground">Apenas via conversa natural</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="interactive">
                          <div className="flex items-center gap-2">
                            <Menu className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Interativo</div>
                              <div className="text-xs text-muted-foreground">Apenas menus/widgets</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="hybrid">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Híbrido (Recomendado)</div>
                              <div className="text-xs text-muted-foreground">Tenta conversa, depois menu</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="adaptive">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Adaptativo</div>
                              <div className="text-xs text-muted-foreground">IA decide baseado no contexto</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label data-testid="label-requires-confirmation">Requer Confirmação</Label>
                      <p className="text-sm text-muted-foreground">
                        Solicitar confirmação antes de executar a ação
                      </p>
                    </div>
                    <Switch
                      checked={action.requiresConfirmation}
                      onCheckedChange={(checked) => setAction({ ...action, requiresConfirmation: checked })}
                      data-testid="switch-requires-confirmation"
                    />
                  </div>

                  {action.requiresConfirmation && (
                    <div>
                      <Label htmlFor="confirmationTemplate" data-testid="label-confirmation-template">Mensagem de Confirmação</Label>
                      <Textarea
                        id="confirmationTemplate"
                        value={action.responseTemplates.confirmation}
                        onChange={(e) => setAction({
                          ...action,
                          responseTemplates: { ...action.responseTemplates, confirmation: e.target.value }
                        })}
                        rows={2}
                        className="mt-2"
                        data-testid="input-confirmation-template"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Integração */}
            <TabsContent value="integration" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-integration-title">Integração com Formulários</CardTitle>
                  <CardDescription data-testid="text-integration-description">
                    Vincule esta ação a um formulário interno existente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="linkedForm" data-testid="label-linked-form">Formulário Interno (Opcional)</Label>
                    <Select 
                      value={action.linkedFormId || 'none'} 
                      onValueChange={(value) => setAction({ ...action, linkedFormId: value === 'none' ? undefined : value })}
                    >
                      <SelectTrigger className="mt-2" data-testid="select-linked-form">
                        <SelectValue placeholder="Nenhum formulário vinculado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum formulário</SelectItem>
                        {formsData?.forms?.map((form: any) => (
                          <SelectItem key={form.id} value={form.id} data-testid={`select-item-form-${form.id}`}>
                            {form.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {action.linkedFormId && (
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Formulário Vinculado
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            A IA usará o schema do formulário para validar e preencher os dados automaticamente. 
                            Os campos mapeados serão preenchidos com base na conversa.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog para Adicionar/Editar Campo */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-field-dialog-title">
              {editingField?.id ? 'Editar Campo' : 'Adicionar Novo Campo'}
            </DialogTitle>
            <DialogDescription data-testid="text-field-dialog-description">
              Configure as propriedades do campo para coleta de dados
            </DialogDescription>
          </DialogHeader>
          
          {editingField && (
            <FieldEditor
              field={editingField}
              onSave={handleSaveField}
              onCancel={() => {
                setShowFieldDialog(false);
                setEditingField(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para editar campo
function FieldEditor({ 
  field, 
  onSave, 
  onCancel 
}: { 
  field: ActionField; 
  onSave: (field: ActionField) => void; 
  onCancel: () => void;
}) {
  const [editedField, setEditedField] = useState<ActionField>(field);

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fieldKey" data-testid="label-field-key">Chave do Campo *</Label>
          <Input
            id="fieldKey"
            placeholder="customer_id"
            value={editedField.fieldKey}
            onChange={(e) => setEditedField({ ...editedField, fieldKey: e.target.value })}
            data-testid="input-field-key"
          />
        </div>
        <div>
          <Label htmlFor="fieldLabel" data-testid="label-field-label">Rótulo *</Label>
          <Input
            id="fieldLabel"
            placeholder="Cliente"
            value={editedField.fieldLabel}
            onChange={(e) => setEditedField({ ...editedField, fieldLabel: e.target.value })}
            data-testid="input-field-label"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="fieldDescription" data-testid="label-field-description">Descrição</Label>
        <Textarea
          id="fieldDescription"
          placeholder="Descrição do campo..."
          value={editedField.fieldDescription}
          onChange={(e) => setEditedField({ ...editedField, fieldDescription: e.target.value })}
          rows={2}
          data-testid="input-field-description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fieldType" data-testid="label-field-type">Tipo de Dado *</Label>
          <Select 
            value={editedField.fieldType} 
            onValueChange={(value) => setEditedField({ ...editedField, fieldType: value })}
          >
            <SelectTrigger data-testid="select-field-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value} data-testid={`select-item-type-${type.value}`}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="collectionStrategy" data-testid="label-field-strategy">Estratégia de Coleta</Label>
          <Select 
            value={editedField.collectionStrategy} 
            onValueChange={(value: any) => setEditedField({ ...editedField, collectionStrategy: value })}
          >
            <SelectTrigger data-testid="select-field-strategy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conversational">Conversacional</SelectItem>
              <SelectItem value="interactive">Interativo</SelectItem>
              <SelectItem value="hybrid">Híbrido</SelectItem>
              <SelectItem value="adaptive">Adaptativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="widgetType" data-testid="label-widget-type">Widget Interativo</Label>
        <Select 
          value={editedField.widgetConfig?.type || 'none'} 
          onValueChange={(value) => {
            if (value === 'none') {
              setEditedField({ ...editedField, widgetConfig: undefined });
            } else {
              setEditedField({ 
                ...editedField, 
                widgetConfig: { type: value } 
              });
            }
          }}
        >
          <SelectTrigger data-testid="select-widget-type">
            <SelectValue placeholder="Selecione um widget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum widget</SelectItem>
            {WIDGET_TYPES.map(widget => (
              <SelectItem key={widget.value} value={widget.value} data-testid={`select-item-widget-${widget.value}`}>
                <span className="flex items-center gap-2">
                  <span>{widget.icon}</span>
                  <span>{widget.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="isRequired"
            checked={editedField.isRequired}
            onCheckedChange={(checked) => setEditedField({ ...editedField, isRequired: checked })}
            data-testid="switch-is-required"
          />
          <Label htmlFor="isRequired" data-testid="label-is-required">Campo Obrigatório</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isCritical"
            checked={editedField.isCritical}
            onCheckedChange={(checked) => setEditedField({ ...editedField, isCritical: checked })}
            data-testid="switch-is-critical"
          />
          <Label htmlFor="isCritical" data-testid="label-is-critical">Campo Crítico</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} data-testid="button-cancel-field">
          Cancelar
        </Button>
        <Button 
          onClick={() => onSave(editedField)}
          disabled={!editedField.fieldKey || !editedField.fieldLabel}
          data-testid="button-save-field"
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar Campo
        </Button>
      </div>
    </div>
  );
}
