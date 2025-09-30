import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle,
  FileText,
  MessageSquare,
  Settings,
  Sparkles,
  ListTree,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { ActionCatalogData } from './ActionCatalog';
import { apiRequest } from '@/lib/queryClient';

export interface FieldMapping {
  fieldId: string;
  fieldName: string;
  fieldType: string;
  required: boolean;
  aiQuestion: string;
  extractionHint: string;
  validationRules?: string;
}

export interface MenuOption {
  id: string;
  label: string;
  value: string;
  action?: string;
  subOptions?: MenuOption[];
}

export interface ActionFieldConfig {
  actionType: 'createTicket' | 'updateTicket' | 'scheduleAppointment' | 'other';
  templateId?: string;
  fieldsToMap: FieldMapping[];
  conversationMode: 'natural' | 'menu' | 'hybrid';
  menuTree?: MenuOption[];
  feedbackMessage: string;
  showResultDetails: boolean;
  subject?: string;
  description?: string;
  priority?: string;
  category?: string;
}

interface ActionFieldMapperProps {
  actionType: 'createTicket' | 'updateTicket' | 'scheduleAppointment' | 'other';
  config: ActionFieldConfig;
  onChange: (config: ActionFieldConfig) => void;
}

export default function ActionFieldMapper({ actionType, config, onChange }: ActionFieldMapperProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(config.templateId || '');
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // ✅ 1QA.MD COMPLIANCE: Buscar templates de ticket
  const { data: ticketTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['ticket-templates'],
    queryFn: async () => {
      const response = await apiRequest('/api/ticket-templates');
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });


  // Agrupar ações por categoria
  const actionsByCategory = ActionCatalogData.reduce((acc, action) => {
    const categoryKey = action.category;
    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey].push(action);
    return acc;
  }, {} as Record<string, typeof ActionCatalogData>);

  const categoryLabels: Record<string, string> = {
    entity: '🏢 Criar Entidades',
    communication: '📧 Comunicação',
    integration: '🔗 Integrações',
    knowledge: '📖 Base de Conhecimento',
    workflow: '⚙️ Fluxo de Trabalho'
  };

  // Buscar templates de ticket disponíveis
  const { data: templates } = useQuery<any>({
    queryKey: ['/api/ticket-templates'],
    enabled: actionType === 'createTicket',
  });

  // Buscar campos disponíveis do template selecionado
  const { data: templateFields } = useQuery<any>({
    queryKey: ['/api/ticket-templates', selectedTemplate, 'fields'],
    enabled: !!selectedTemplate && actionType === 'createTicket',
  });

  useEffect(() => {
    if (templateFields?.data) {
      setAvailableFields(templateFields.data);
    }
  }, [templateFields]);

  const updateConfig = (updates: Partial<ActionFieldConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateField = (key: string, value: any) => {
    onChange({
      ...config,
      [key]: value
    });
  };

  const toggleFieldMapping = (field: any, checked: boolean) => {
    if (checked) {
      // Adicionar campo ao mapeamento
      const newMapping: FieldMapping = {
        fieldId: field.id || field.name,
        fieldName: field.label || field.name,
        fieldType: field.type || 'text',
        required: field.required || false,
        aiQuestion: `Por favor, informe ${field.label || field.name}`,
        extractionHint: `Extrair valor para o campo ${field.label || field.name}`,
        validationRules: field.validation || ''
      };
      updateConfig({
        fieldsToMap: [...config.fieldsToMap, newMapping]
      });
    } else {
      // Remover campo do mapeamento
      updateConfig({
        fieldsToMap: config.fieldsToMap.filter(f => f.fieldId !== field.id && f.fieldId !== field.name)
      });
    }
  };

  const updateFieldMapping = (fieldId: string, updates: Partial<FieldMapping>) => {
    updateConfig({
      fieldsToMap: config.fieldsToMap.map(f =>
        f.fieldId === fieldId ? { ...f, ...updates } : f
      )
    });
  };

  const isFieldMapped = (fieldId: string) => {
    return config.fieldsToMap.some(f => f.fieldId === fieldId);
  };

  const addMenuOption = (parentId?: string) => {
    const newOption: MenuOption = {
      id: `menu_${Date.now()}`,
      label: '',
      value: '',
      action: '',
      subOptions: []
    };

    if (!parentId) {
      updateConfig({
        menuTree: [...(config.menuTree || []), newOption]
      });
    } else {
      const addToParent = (options: MenuOption[]): MenuOption[] => {
        return options.map(opt => {
          if (opt.id === parentId) {
            return {
              ...opt,
              subOptions: [...(opt.subOptions || []), newOption]
            };
          }
          if (opt.subOptions) {
            return {
              ...opt,
              subOptions: addToParent(opt.subOptions)
            };
          }
          return opt;
        });
      };

      updateConfig({
        menuTree: addToParent(config.menuTree || [])
      });
    }
  };

  const removeMenuOption = (optionId: string) => {
    const removeFromTree = (options: MenuOption[]): MenuOption[] => {
      return options
        .filter(opt => opt.id !== optionId)
        .map(opt => ({
          ...opt,
          subOptions: opt.subOptions ? removeFromTree(opt.subOptions) : []
        }));
    };

    updateConfig({
      menuTree: removeFromTree(config.menuTree || [])
    });
  };

  const updateMenuOption = (optionId: string, updates: Partial<MenuOption>) => {
    const updateInTree = (options: MenuOption[]): MenuOption[] => {
      return options.map(opt => {
        if (opt.id === optionId) {
          return { ...opt, ...updates };
        }
        if (opt.subOptions) {
          return {
            ...opt,
            subOptions: updateInTree(opt.subOptions)
          };
        }
        return opt;
      });
    };

    updateConfig({
      menuTree: updateInTree(config.menuTree || [])
    });
  };

  const toggleMenuExpanded = (menuId: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const renderMenuOption = (option: MenuOption, level: number = 0) => {
    const isExpanded = expandedMenus.has(option.id);
    const hasSubOptions = option.subOptions && option.subOptions.length > 0;

    return (
      <div key={option.id} style={{ marginLeft: `${level * 24}px` }}>
        <Card className="mb-2">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              {hasSubOptions && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleMenuExpanded(option.id)}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              )}
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Label (visível para usuário)</Label>
                  <Input
                    value={option.label}
                    onChange={(e) => updateMenuOption(option.id, { label: e.target.value })}
                    placeholder="Ex: Reportar Problema"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Valor</Label>
                  <Input
                    value={option.value}
                    onChange={(e) => updateMenuOption(option.id, { value: e.target.value })}
                    placeholder="Ex: report_issue"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Ação</Label>
                  <Select
                    value={option.action || ''}
                    onValueChange={(value) => updateMenuOption(option.id, { action: value })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Selecione uma ação" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(actionsByCategory).map(([categoryKey, actions]) => (
                        <div key={categoryKey}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {categoryLabels[categoryKey] || categoryKey}
                          </div>
                          {actions.map(action => (
                            <SelectItem key={action.name} value={action.name}>
                              <div className="flex items-center gap-2">
                                <action.icon className="w-3 h-3" />
                                <span>{action.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => addMenuOption(option.id)}
                  title="Adicionar sub-opção"
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => removeMenuOption(option.id)}
                  title="Remover"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {isExpanded && option.subOptions && option.subOptions.map(subOpt => renderMenuOption(subOpt, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seção 1: Modo de Conversação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Modo de Conversação
          </CardTitle>
          <CardDescription>
            Como a IA deve interagir com o usuário para coletar informações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card
              className={`cursor-pointer transition-all ${config.conversationMode === 'natural' ? 'border-primary border-2 bg-primary/5' : 'hover:border-primary/50'}`}
              onClick={() => updateConfig({ conversationMode: 'natural' })}
            >
              <CardContent className="p-4">
                <Sparkles className={`w-6 h-6 mb-2 ${config.conversationMode === 'natural' ? 'text-primary' : 'text-muted-foreground'}`} />
                <h4 className="font-medium mb-1">Natural</h4>
                <p className="text-xs text-muted-foreground">
                  IA conversa naturalmente e extrai informações do contexto
                </p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${config.conversationMode === 'menu' ? 'border-primary border-2 bg-primary/5' : 'hover:border-primary/50'}`}
              onClick={() => updateConfig({ conversationMode: 'menu' })}
            >
              <CardContent className="p-4">
                <ListTree className={`w-6 h-6 mb-2 ${config.conversationMode === 'menu' ? 'text-primary' : 'text-muted-foreground'}`} />
                <h4 className="font-medium mb-1">Menu</h4>
                <p className="text-xs text-muted-foreground">
                  Apresenta opções numeradas para o usuário escolher
                </p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${config.conversationMode === 'hybrid' ? 'border-primary border-2 bg-primary/5' : 'hover:border-primary/50'}`}
              onClick={() => updateConfig({ conversationMode: 'hybrid' })}
            >
              <CardContent className="p-4">
                <Settings className={`w-6 h-6 mb-2 ${config.conversationMode === 'hybrid' ? 'text-primary' : 'text-muted-foreground'}`} />
                <h4 className="font-medium mb-1">Híbrido</h4>
                <p className="text-xs text-muted-foreground">
                  Combina conversa natural com menus quando necessário
                </p>
              </CardContent>
            </Card>
          </div>

          {(config.conversationMode === 'menu' || config.conversationMode === 'hybrid') && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="flex items-center gap-2">
                  <ListTree className="w-4 h-4" />
                  Árvore de Menus
                </Label>
                <Button
                  size="sm"
                  onClick={() => addMenuOption()}
                  data-testid="button-add-menu-option"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>

              <ScrollArea className="h-[300px] border rounded-md p-4">
                {(!config.menuTree || config.menuTree.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ListTree className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Nenhuma opção de menu configurada.</p>
                    <p className="text-xs">Clique em "Adicionar Opção" para criar uma árvore de menus.</p>
                  </div>
                ) : (
                  config.menuTree.map(option => renderMenuOption(option, 0))
                )}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção 2: Template e Campos */}
      {actionType === 'createTicket' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Template de Ticket
            </CardTitle>
            <CardDescription>
              Selecione o template e configure quais campos a IA deve coletar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Template de Ticket</Label>
              <Select
                value={selectedTemplate}
                onValueChange={(value) => {
                  setSelectedTemplate(value);
                  updateConfig({ templateId: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.data?.map((template: any) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && availableFields.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <Label className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Campos para a IA Coletar
                </Label>
                <p className="text-xs text-muted-foreground">
                  Selecione os campos que a IA deve extrair da conversa com o usuário
                </p>

                <ScrollArea className="h-[400px] border rounded-md p-4">
                  <div className="space-y-2">
                    {availableFields.map((field: any) => {
                      const mapped = isFieldMapped(field.id || field.name);
                      const mapping = config.fieldsToMap.find(f => f.fieldId === (field.id || field.name));

                      return (
                        <Card key={field.id || field.name} className={mapped ? 'border-primary' : ''}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={mapped}
                                onCheckedChange={(checked) => toggleFieldMapping(field, checked as boolean)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{field.label || field.name}</span>
                                  <Badge variant="outline" className="text-xs">{field.type}</Badge>
                                  {field.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">{field.description || 'Sem descrição'}</p>
                              </div>
                            </div>

                            {mapped && mapping && (
                              <div className="ml-7 space-y-3 pt-3 border-t">
                                <div>
                                  <Label className="text-xs">Como a IA deve perguntar</Label>
                                  <Textarea
                                    value={mapping.aiQuestion}
                                    onChange={(e) => updateFieldMapping(mapping.fieldId, { aiQuestion: e.target.value })}
                                    placeholder="Ex: Por favor, me informe o título do problema que você está enfrentando"
                                    className="h-16 text-sm mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Dica de Extração (para IA)</Label>
                                  <Input
                                    value={mapping.extractionHint}
                                    onChange={(e) => updateFieldMapping(mapping.fieldId, { extractionHint: e.target.value })}
                                    placeholder="Ex: Procurar por descrições do problema ou erro"
                                    className="h-8 text-sm mt-1"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={mapping.required}
                                    onCheckedChange={(checked) => updateFieldMapping(mapping.fieldId, { required: checked as boolean })}
                                  />
                                  <Label className="text-xs">Campo obrigatório (IA deve insistir se não obtiver)</Label>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seção 2: Configuração específica para criar ticket */}
      {actionType === 'createTicket' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Configuração de Criação de Ticket
            </CardTitle>
            <CardDescription>
              Defina os detalhes e o template para a criação de tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="templateId">Template de Ticket</Label>
              <Select value={config.templateId || ''} onValueChange={(value) => updateField('templateId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem template</SelectItem>
                  {ticketTemplates?.map((template: any) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Assunto do Ticket</Label>
              <Input
                id="subject"
                value={config.subject || ''}
                onChange={(e) => updateField('subject', e.target.value)}
                placeholder="Assunto do ticket... (use {{message_content}}, {{sender}}, etc.)"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={config.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Descrição do ticket... (use {{ai_summary}}, {{ai_category}}, etc.)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={config.priority || 'medium'} onValueChange={(value) => updateField('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={config.category || ''}
                onChange={(e) => updateField('category', e.target.value)}
                placeholder="Categoria do ticket..."
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Variáveis disponíveis:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>• {`{{message_content}}`}</div>
                <div>• {{sender}}</div>
                <div>• {{channel}}</div>
                <div>• {{timestamp}}</div>
                <div>• {{ai_summary}}</div>
                <div>• {{ai_category}}</div>
                <div>• {{ai_urgency}}</div>
                <div>• {{ai_sentiment}}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Seção 3: Feedback ao Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Feedback Após Ação
          </CardTitle>
          <CardDescription>
            Configure a mensagem que a IA enviará após executar a ação com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Mensagem de Sucesso</Label>
            <Textarea
              value={config.feedbackMessage}
              onChange={(e) => updateConfig({ feedbackMessage: e.target.value })}
              placeholder="Ex: ✅ Ticket criado com sucesso! Número do ticket: {{ticketNumber}}. Você pode acompanhar o andamento pelo sistema."
              className="min-h-[100px] mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Use variáveis: <code className="bg-muted px-1 rounded">{'{{ticketNumber}}'}</code>, <code className="bg-muted px-1 rounded">{'{{ticketTitle}}'}</code>, <code className="bg-muted px-1 rounded">{'{{assignedTo}}'}</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={config.showResultDetails}
              onCheckedChange={(checked) => updateConfig({ showResultDetails: checked })}
            />
            <Label>Incluir detalhes completos do resultado</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}