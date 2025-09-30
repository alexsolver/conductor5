import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Brain,
  Target,
  MessageSquare,
  Database,
  Zap,
  Plus,
  Trash2,
  GripVertical,
  FileText,
  Calendar,
  Hash,
  CheckSquare,
  FileUp,
  Type,
  BookOpen,
  Upload,
  Search,
  Mail,
  UserPlus,
  PhoneCall,
  ArrowUp,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import ActionFieldMapper, { ActionFieldConfig } from './ActionFieldMapper';
import { EnhancedActionsTab } from './EnhancedActionsTab';

export interface FieldConfig {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'file';
  required: boolean;
  question: string;
  validation?: string;
  options?: string[];
}

export interface AiAgentConfig {
  goal: string;
  prompts: {
    system: string;
    context: string;
    goalPrompt: string;
  };
  fieldsToCollect: FieldConfig[];
  knowledgeBase: {
    articleIds: string[];
    documents: string[];
    accessMaterials: boolean;
    accessServices: boolean;
  };
  availableActions: {
    createTicket: boolean;
    queryKnowledgeBase: boolean;
    searchMaterials: boolean;
    scheduleAppointment: boolean;
    escalateToHuman: boolean;
    sendEmail: boolean;
  };
  actionConfigs?: {
    createTicket?: ActionFieldConfig;
    scheduleAppointment?: ActionFieldConfig;
    [key: string]: any;
  };
}

interface AiAgentActionConfigProps {
  config: AiAgentConfig;
  onChange: (config: AiAgentConfig) => void;
}

const goalExamples = [
  {
    title: 'Atendimento ao Cliente',
    description: 'Responder dúvidas frequentes e coletar informações para criação de tickets',
    goal: 'Atender clientes de forma amigável, responder perguntas sobre produtos e serviços, e coletar informações necessárias para abrir tickets de suporte quando necessário.'
  },
  {
    title: 'Qualificação de Leads',
    description: 'Identificar potenciais clientes e agendar reuniões',
    goal: 'Qualificar leads através de perguntas estratégicas sobre necessidades e orçamento, e agendar reuniões com a equipe de vendas para leads qualificados.'
  },
  {
    title: 'Suporte Técnico',
    description: 'Diagnosticar problemas e oferecer soluções',
    goal: 'Ajudar usuários a diagnosticar problemas técnicos, consultar a base de conhecimento para soluções, e escalar para técnicos quando necessário.'
  },
  {
    title: 'Agendamento',
    description: 'Coordenar horários e criar compromissos',
    goal: 'Consultar disponibilidade, coletar preferências de horário, e agendar compromissos automaticamente no sistema.'
  }
];

const promptTemplates = {
  system: [
    {
      name: 'Assistente Profissional',
      content: 'Você é um assistente virtual profissional e prestativo. Sempre seja educado, claro e objetivo. Use uma linguagem formal, mas amigável. Mantenha respostas concisas e relevantes.'
    },
    {
      name: 'Suporte Técnico',
      content: 'Você é um especialista em suporte técnico. Seja paciente e detalhista ao explicar soluções. Use linguagem simples e evite jargões técnicos desnecessários. Sempre confirme o entendimento do usuário.'
    },
    {
      name: 'Vendas Consultivas',
      content: 'Você é um consultor de vendas experiente. Faça perguntas abertas para entender necessidades. Seja entusiasta mas não insistente. Foque em como os produtos/serviços podem resolver problemas específicos.'
    },
    {
      name: 'Atendimento Casual',
      content: 'Você é um assistente amigável e descontraído. Use uma linguagem mais informal e próxima. Pode usar emojis ocasionalmente. Seja empático e crie conexão genuína com o usuário.'
    }
  ],
  context: [
    {
      name: 'Empresa de Tecnologia',
      content: 'Nossa empresa oferece soluções de software para gestão empresarial. Temos planos Basic, Professional e Enterprise. Oferecemos suporte 24/7 para clientes Professional e Enterprise.'
    },
    {
      name: 'Serviços de Manutenção',
      content: 'Prestamos serviços de manutenção residencial e comercial. Atendemos 24h para emergências. Áreas de atuação: elétrica, hidráulica, ar-condicionado e pintura.'
    },
    {
      name: 'E-commerce',
      content: 'Somos uma loja online com entrega em todo o país. Frete grátis acima de R$ 200. Aceita devolução em até 30 dias. Parcelamento em até 12x sem juros.'
    }
  ],
  goal: [
    {
      name: 'Coletar Informações',
      content: 'Seu objetivo é coletar as seguintes informações do usuário: [LISTA DE CAMPOS]. Faça perguntas de forma natural e contextual, não como um formulário.'
    },
    {
      name: 'Resolver Problema',
      content: 'Seu objetivo é entender o problema do usuário e oferecer uma solução da base de conhecimento. Se não conseguir resolver, colete informações e crie um ticket para a equipe técnica.'
    },
    {
      name: 'Agendar Reunião',
      content: 'Seu objetivo é agendar uma reunião. Pergunte sobre disponibilidade, preferência de horário e modalidade (presencial ou online). Confirme todos os detalhes antes de finalizar.'
    }
  ]
};

const fieldTypeIcons = {
  text: Type,
  number: Hash,
  date: Calendar,
  select: CheckSquare,
  file: FileUp
};

interface SortableFieldItemProps {
  field: FieldConfig;
  onEdit: (field: FieldConfig) => void;
  onDelete: (id: string) => void;
}

function SortableFieldItem({ field, onEdit, onDelete }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = fieldTypeIcons[field.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-md transition-shadow"
      data-testid={`field-item-${field.id}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium truncate">{field.name}</span>
          {field.required && (
            <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
          )}
          <Badge variant="outline" className="text-xs">{field.type}</Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">{field.question}</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(field)}
          data-testid={`button-edit-field-${field.id}`}
        >
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(field.id)}
          data-testid={`button-delete-field-${field.id}`}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export default function AiAgentActionConfig({ config, onChange }: AiAgentActionConfigProps) {
  const defaultConfig: AiAgentConfig = {
    goal: '',
    prompts: {
      system: '',
      context: '',
      goalPrompt: ''
    },
    fieldsToCollect: [],
    knowledgeBase: {
      articleIds: [],
      documents: [],
      accessMaterials: false,
      accessServices: false
    },
    availableActions: {
      createTicket: false,
      queryKnowledgeBase: false,
      searchMaterials: false,
      scheduleAppointment: false,
      escalateToHuman: false,
      sendEmail: false
    }
  };

  const mergedConfig: AiAgentConfig = {
    ...defaultConfig,
    ...config,
    prompts: { ...defaultConfig.prompts, ...(config.prompts || {}) },
    fieldsToCollect: config.fieldsToCollect || defaultConfig.fieldsToCollect,
    knowledgeBase: { ...defaultConfig.knowledgeBase, ...(config.knowledgeBase || {}) },
    availableActions: { ...defaultConfig.availableActions, ...(config.availableActions || {}) }
  };

  const [activeTab, setActiveTab] = useState('goal');
  const [editingField, setEditingField] = useState<FieldConfig | null>(null);
  const [showFieldForm, setShowFieldForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateConfig = (updates: Partial<AiAgentConfig>) => {
    onChange({ ...mergedConfig, ...updates });
  };

  const updatePrompts = (key: keyof AiAgentConfig['prompts'], value: string) => {
    updateConfig({
      prompts: { ...mergedConfig.prompts, [key]: value }
    });
  };

  const updateKnowledgeBase = (updates: Partial<AiAgentConfig['knowledgeBase']>) => {
    updateConfig({
      knowledgeBase: { ...mergedConfig.knowledgeBase, ...updates }
    });
  };

  const updateAvailableActions = (action: keyof AiAgentConfig['availableActions'], value: boolean) => {
    updateConfig({
      availableActions: { ...mergedConfig.availableActions, [action]: value }
    });
  };

  const updateActionConfig = (action: string, actionConfig: ActionFieldConfig) => {
    updateConfig({
      actionConfigs: { ...mergedConfig.actionConfigs, [action]: actionConfig }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = mergedConfig.fieldsToCollect.findIndex((f) => f.id === active.id);
      const newIndex = mergedConfig.fieldsToCollect.findIndex((f) => f.id === over.id);

      updateConfig({
        fieldsToCollect: arrayMove(mergedConfig.fieldsToCollect, oldIndex, newIndex)
      });
    }
  };

  const addOrUpdateField = (field: FieldConfig) => {
    const existingIndex = mergedConfig.fieldsToCollect.findIndex(f => f.id === field.id);

    if (existingIndex >= 0) {
      const updated = [...mergedConfig.fieldsToCollect];
      updated[existingIndex] = field;
      updateConfig({ fieldsToCollect: updated });
    } else {
      updateConfig({
        fieldsToCollect: [...mergedConfig.fieldsToCollect, field]
      });
    }

    setShowFieldForm(false);
    setEditingField(null);
  };

  const deleteField = (id: string) => {
    updateConfig({
      fieldsToCollect: mergedConfig.fieldsToCollect.filter(f => f.id !== id)
    });
  };

  const applyTemplate = (type: 'system' | 'context' | 'goal', content: string) => {
    updatePrompts(type === 'system' ? 'system' : type === 'context' ? 'context' : 'goalPrompt', content);
  };

  return (
    <div className="w-full h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="goal" data-testid="tab-goal">
            <Target className="w-4 h-4 mr-2" />
            Objetivo
          </TabsTrigger>
          <TabsTrigger value="prompts" data-testid="tab-prompts">
            <MessageSquare className="w-4 h-4 mr-2" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="fields" data-testid="tab-fields">
            <FileText className="w-4 h-4 mr-2" />
            Campos
          </TabsTrigger>
          <TabsTrigger value="knowledge" data-testid="tab-knowledge">
            <Database className="w-4 h-4 mr-2" />
            Base
          </TabsTrigger>
          <TabsTrigger value="actions" data-testid="tab-actions">
            <Zap className="w-4 h-4 mr-2" />
            Ações
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[600px] mt-4">
          {/* Aba 1: Objetivo */}
          <TabsContent value="goal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Objetivo do Agente
                </CardTitle>
                <CardDescription>
                  Descreva claramente o que você quer que o agente de IA alcance nas conversas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="agent-goal">Objetivo Principal</Label>
                  <Textarea
                    id="agent-goal"
                    value={mergedConfig.goal}
                    onChange={(e) => updateConfig({ goal: e.target.value })}
                    placeholder="Descreva o objetivo do agente de IA..."
                    className="min-h-[120px] mt-2"
                    data-testid="textarea-goal"
                  />
                </div>

                <Separator />

                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4" />
                    Exemplos de Objetivos
                  </Label>
                  <div className="grid gap-3">
                    {goalExamples.map((example, index) => (
                      <Card key={index} className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => updateConfig({ goal: example.goal })}
                        data-testid={`card-goal-example-${index}`}
                      >
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            {example.title}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {example.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba 2: Prompts */}
          <TabsContent value="prompts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Configuração de Prompts
                </CardTitle>
                <CardDescription>
                  Configure como o agente deve se comportar e responder.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="system-prompt">System Prompt (Personalidade)</Label>
                    <Select onValueChange={(value) => applyTemplate('system', value)}>
                      <SelectTrigger className="w-[200px]" data-testid="select-system-template">
                        <SelectValue placeholder="Usar template" />
                      </SelectTrigger>
                      <SelectContent>
                        {promptTemplates.system.map((template, index) => (
                          <SelectItem key={index} value={template.content}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    id="system-prompt"
                    value={mergedConfig.prompts.system}
                    onChange={(e) => updatePrompts('system', e.target.value)}
                    placeholder="Define a personalidade, tom e comportamento do agente..."
                    className="min-h-[100px]"
                    data-testid="textarea-system-prompt"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Como o agente deve se comportar e se comunicar
                  </p>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="context-prompt">Context Prompt (Contexto)</Label>
                    <Select onValueChange={(value) => applyTemplate('context', value)}>
                      <SelectTrigger className="w-[200px]" data-testid="select-context-template">
                        <SelectValue placeholder="Usar template" />
                      </SelectTrigger>
                      <SelectContent>
                        {promptTemplates.context.map((template, index) => (
                          <SelectItem key={index} value={template.content}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    id="context-prompt"
                    value={mergedConfig.prompts.context}
                    onChange={(e) => updatePrompts('context', e.target.value)}
                    placeholder="Informações sobre sua empresa, produtos e serviços..."
                    className="min-h-[100px]"
                    data-testid="textarea-context-prompt"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Informações de contexto que o agente deve conhecer
                  </p>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="goal-prompt">Goal Prompt (Objetivo Específico)</Label>
                    <Select onValueChange={(value) => applyTemplate('goal', value)}>
                      <SelectTrigger className="w-[200px]" data-testid="select-goal-template">
                        <SelectValue placeholder="Usar template" />
                      </SelectTrigger>
                      <SelectContent>
                        {promptTemplates.goal.map((template, index) => (
                          <SelectItem key={index} value={template.content}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    id="goal-prompt"
                    value={mergedConfig.prompts.goalPrompt}
                    onChange={(e) => updatePrompts('goalPrompt', e.target.value)}
                    placeholder="O que especificamente o agente deve fazer nesta conversa..."
                    className="min-h-[100px]"
                    data-testid="textarea-goal-prompt"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Instrução específica sobre o que fazer na conversa
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba 3: Campos a Coletar */}
          <TabsContent value="fields" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Campos a Coletar
                    </CardTitle>
                    <CardDescription>
                      Configure quais informações o agente deve coletar do usuário.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingField({
                        id: `field_${Date.now()}`,
                        name: '',
                        type: 'text',
                        required: false,
                        question: '',
                        validation: ''
                      });
                      setShowFieldForm(true);
                    }}
                    data-testid="button-add-field"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Campo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showFieldForm && mergedConfig.fieldsToCollect.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Nenhum campo configurado ainda.</p>
                    <p className="text-sm">Clique em "Adicionar Campo" para começar.</p>
                  </div>
                )}

                {showFieldForm && editingField && (
                  <Card className="border-2 border-primary">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {editingField.name ? 'Editar Campo' : 'Novo Campo'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="field-name">Nome do Campo</Label>
                          <Input
                            id="field-name"
                            value={editingField.name}
                            onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                            placeholder="Ex: Nome do cliente"
                            data-testid="input-field-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="field-type">Tipo</Label>
                          <Select
                            value={editingField.type}
                            onValueChange={(value: any) => setEditingField({ ...editingField, type: value })}
                          >
                            <SelectTrigger data-testid="select-field-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="number">Número</SelectItem>
                              <SelectItem value="date">Data</SelectItem>
                              <SelectItem value="select">Seleção</SelectItem>
                              <SelectItem value="file">Arquivo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="field-question">Pergunta Sugerida</Label>
                        <Input
                          id="field-question"
                          value={editingField.question}
                          onChange={(e) => setEditingField({ ...editingField, question: e.target.value })}
                          placeholder="Como o agente deve perguntar isso?"
                          data-testid="input-field-question"
                        />
                      </div>

                      {editingField.type === 'select' && (
                        <div>
                          <Label htmlFor="field-options">Opções (separadas por vírgula)</Label>
                          <Input
                            id="field-options"
                            value={editingField.options?.join(', ') || ''}
                            onChange={(e) => setEditingField({
                              ...editingField,
                              options: e.target.value.split(',').map(o => o.trim()).filter(Boolean)
                            })}
                            placeholder="Opção 1, Opção 2, Opção 3"
                            data-testid="input-field-options"
                          />
                        </div>
                      )}

                      <div>
                        <Label htmlFor="field-validation">Validação (Regex - opcional)</Label>
                        <Input
                          id="field-validation"
                          value={editingField.validation || ''}
                          onChange={(e) => setEditingField({ ...editingField, validation: e.target.value })}
                          placeholder="Ex: ^[0-9]{11}$ para CPF"
                          data-testid="input-field-validation"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="field-required"
                          checked={editingField.required}
                          onCheckedChange={(required) => setEditingField({ ...editingField, required })}
                          data-testid="switch-field-required"
                        />
                        <Label htmlFor="field-required">Campo obrigatório</Label>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowFieldForm(false);
                            setEditingField(null);
                          }}
                          data-testid="button-cancel-field"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={() => addOrUpdateField(editingField)}
                          disabled={!editingField.name || !editingField.question}
                          data-testid="button-save-field"
                        >
                          Salvar Campo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!showFieldForm && mergedConfig.fieldsToCollect.length > 0 && (
                  <div className="space-y-3">
                    <Label>Campos Configurados ({mergedConfig.fieldsToCollect.length})</Label>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={mergedConfig.fieldsToCollect.map(f => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {mergedConfig.fieldsToCollect.map((field) => (
                          <SortableFieldItem
                            key={field.id}
                            field={field}
                            onEdit={(f) => {
                              setEditingField(f);
                              setShowFieldForm(true);
                            }}
                            onDelete={deleteField}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba 4: Base de Conhecimento */}
          <TabsContent value="knowledge" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Base de Conhecimento
                </CardTitle>
                <CardDescription>
                  Configure quais recursos de conhecimento o agente pode acessar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="kb-articles" className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4" />
                    Artigos da Base de Conhecimento
                  </Label>
                  <Input
                    id="kb-articles"
                    value={mergedConfig.knowledgeBase.articleIds.join(', ')}
                    onChange={(e) => updateKnowledgeBase({
                      articleIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                    })}
                    placeholder="IDs dos artigos separados por vírgula"
                    data-testid="input-article-ids"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O agente poderá consultar estes artigos para responder perguntas
                  </p>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="kb-documents" className="flex items-center gap-2 mb-2">
                    <Upload className="w-4 h-4" />
                    Documentos Específicos
                  </Label>
                  <Input
                    id="kb-documents"
                    value={mergedConfig.knowledgeBase.documents.join(', ')}
                    onChange={(e) => updateKnowledgeBase({
                      documents: e.target.value.split(',').map(doc => doc.trim()).filter(Boolean)
                    })}
                    placeholder="URLs ou IDs de documentos"
                    data-testid="input-documents"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Documentos adicionais que o agente pode referenciar
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Acesso a Recursos</Label>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="access-materials"
                      checked={mergedConfig.knowledgeBase.accessMaterials}
                      onCheckedChange={(checked) => updateKnowledgeBase({ accessMaterials: checked })}
                      data-testid="switch-access-materials"
                    />
                    <Label htmlFor="access-materials" className="font-normal">
                      Permitir busca de materiais
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="access-services"
                      checked={mergedConfig.knowledgeBase.accessServices}
                      onCheckedChange={(checked) => updateKnowledgeBase({ accessServices: checked })}
                      data-testid="switch-access-services"
                    />
                    <Label htmlFor="access-services" className="font-normal">
                      Permitir busca de serviços
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba 5: Ações Disponíveis - Nova Interface Visual */}
          <TabsContent value="actions" className="space-y-4">
            <EnhancedActionsTab
              availableActions={mergedConfig.availableActions}
              actionConfigs={mergedConfig.actionConfigs || {}}
              onActionToggle={updateAvailableActions}
              onActionConfigChange={updateActionConfig}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
