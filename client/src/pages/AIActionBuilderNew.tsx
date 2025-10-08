import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronRight, 
  ChevronLeft,
  Check,
  Sparkles,
  MessageSquare,
  Layers,
  Settings,
  Send,
  Target,
  Palette,
  Database,
  Zap,
  CheckCircle2,
  Rocket,
  Play,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

// ========================================
// TYPES & INTERFACES
// ========================================

interface ActionWizardData {
  // Step 1: Objective
  objective: string;
  templateId?: string;
  actionKey: string;
  name: string;
  description: string;
  category: string;
  
  // Step 2: Prompt
  aiTone: 'professional' | 'friendly' | 'technical' | 'casual';
  aiStyle: 'concise' | 'detailed' | 'step_by_step';
  customPrompt: string;
  requiresConfirmation: boolean;
  
  // Step 3: Mapping
  targetModule: string;
  targetEndpoint: string;
  mappingType: 'internal_module' | 'internal_form' | 'external_api';
  linkedFormId?: string;
  selectedFields: ActionField[];
  
  // Step 4: Interaction
  defaultCollectionStrategy: 'conversational' | 'interactive' | 'hybrid' | 'adaptive';
  
  // Step 5: Response
  endpointMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  successTemplate: string;
  errorTemplate: string;
  confirmationTemplate: string;
}

interface ActionField {
  id?: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  isRequired: boolean;
  collectionStrategy: 'conversational' | 'interactive' | 'hybrid';
  widgetConfig?: any;
  displayOrder: number;
}

interface ActionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  prefilledData: Partial<ActionWizardData>;
}

// ========================================
// TEMPLATES PREDEFINIDOS
// ========================================

const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: 'create_ticket',
    name: 'Criar Ticket',
    description: 'Permitir que o agente crie tickets de suporte automaticamente',
    category: 'Tickets',
    icon: '🎫',
    prefilledData: {
      actionKey: 'create_ticket',
      name: 'Criar Ticket',
      category: 'Tickets',
      targetModule: 'tickets',
      targetEndpoint: '/api/tickets',
      endpointMethod: 'POST',
      aiTone: 'professional',
      aiStyle: 'step_by_step',
      requiresConfirmation: true,
      defaultCollectionStrategy: 'hybrid',
      successTemplate: '✅ Ticket #{ticketId} criado com sucesso! Prioridade: {priority}',
      errorTemplate: '❌ Erro ao criar ticket: {error}',
      confirmationTemplate: '🔍 Confirmar criação do ticket "{title}" com prioridade {priority}?'
    }
  },
  {
    id: 'search_customer',
    name: 'Buscar Cliente',
    description: 'Permitir que o agente busque informações de clientes',
    category: 'Clientes',
    icon: '👤',
    prefilledData: {
      actionKey: 'search_customer',
      name: 'Buscar Cliente',
      category: 'Clientes',
      targetModule: 'customers',
      targetEndpoint: '/api/customers/search',
      endpointMethod: 'GET',
      aiTone: 'friendly',
      aiStyle: 'concise',
      requiresConfirmation: false,
      defaultCollectionStrategy: 'conversational',
      successTemplate: '✅ Cliente encontrado: {customerName} - {email}',
      errorTemplate: '❌ Cliente não encontrado',
      confirmationTemplate: ''
    }
  },
  {
    id: 'schedule_visit',
    name: 'Agendar Visita',
    description: 'Agendar visitas técnicas automaticamente',
    category: 'Agendamentos',
    icon: '📅',
    prefilledData: {
      actionKey: 'schedule_visit',
      name: 'Agendar Visita',
      category: 'Agendamentos',
      targetModule: 'schedules',
      targetEndpoint: '/api/schedules',
      endpointMethod: 'POST',
      aiTone: 'professional',
      aiStyle: 'detailed',
      requiresConfirmation: true,
      defaultCollectionStrategy: 'interactive',
      successTemplate: '✅ Visita agendada para {date} às {time} com {technician}',
      errorTemplate: '❌ Erro ao agendar: {error}',
      confirmationTemplate: '📅 Confirmar agendamento para {date} às {time}?'
    }
  },
  {
    id: 'custom',
    name: 'Começar do Zero',
    description: 'Criar uma ação customizada completamente do zero',
    category: 'Custom',
    icon: '🎨',
    prefilledData: {
      aiTone: 'professional',
      aiStyle: 'step_by_step',
      requiresConfirmation: true,
      defaultCollectionStrategy: 'hybrid',
      endpointMethod: 'POST'
    }
  }
];

// ========================================
// COMPONENT
// ========================================

export default function AIActionBuilderNew() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<ActionWizardData>({
    objective: '',
    actionKey: '',
    name: '',
    description: '',
    category: '',
    aiTone: 'professional',
    aiStyle: 'step_by_step',
    customPrompt: '',
    requiresConfirmation: true,
    targetModule: '',
    targetEndpoint: '',
    mappingType: 'internal_module',
    selectedFields: [],
    defaultCollectionStrategy: 'hybrid',
    endpointMethod: 'POST',
    successTemplate: '✅ Ação executada com sucesso!',
    errorTemplate: '❌ Erro ao executar: {error}',
    confirmationTemplate: '🔍 Confirmar execução?'
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateWizardData = (updates: Partial<ActionWizardData>) => {
    setWizardData({ ...wizardData, ...updates });
  };

  const handleTemplateSelect = (template: ActionTemplate) => {
    updateWizardData(template.prefilledData);
    if (template.id !== 'custom') {
      setCurrentStep(2); // Pula para step 2 se usar template
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      // Salvar ação (implementar API call)
      toast({
        title: '🎉 Ação criada com sucesso!',
        description: `${wizardData.name} está pronta para uso.`
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // ========================================
  // WIZARD STEPS
  // ========================================

  const renderStep1 = () => (
    <div className="space-y-6" data-testid="step-objective">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <Target className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold" data-testid="text-step1-title">Qual o objetivo da ação?</h2>
        <p className="text-muted-foreground" data-testid="text-step1-description">
          Comece com um template pronto ou crie do zero
        </p>
      </div>

      {/* Template Gallery */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        {ACTION_TEMPLATES.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              wizardData.templateId === template.id ? 'border-purple-500 border-2' : ''
            }`}
            onClick={() => handleTemplateSelect(template)}
            data-testid={`card-template-${template.id}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="text-4xl mb-2">{template.icon}</div>
                {wizardData.templateId === template.id && (
                  <Badge className="bg-purple-500">Selecionado</Badge>
                )}
              </div>
              <CardTitle className="text-lg" data-testid={`text-template-name-${template.id}`}>
                {template.name}
              </CardTitle>
              <CardDescription data-testid={`text-template-desc-${template.id}`}>
                {template.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Custom Objective Input */}
      {wizardData.templateId === 'custom' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle data-testid="text-custom-objective-title">Descreva o objetivo</CardTitle>
            <CardDescription data-testid="text-custom-objective-desc">
              Explique em linguagem natural o que essa ação deve fazer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="objective">Objetivo da Ação</Label>
              <Textarea
                id="objective"
                placeholder="Ex: Quero que a IA crie tickets automaticamente quando o cliente reportar problemas..."
                value={wizardData.objective}
                onChange={(e) => updateWizardData({ objective: e.target.value })}
                rows={4}
                data-testid="input-objective"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="actionKey">Chave da Ação</Label>
                <Input
                  id="actionKey"
                  placeholder="criar_ticket"
                  value={wizardData.actionKey}
                  onChange={(e) => updateWizardData({ actionKey: e.target.value })}
                  data-testid="input-action-key"
                />
              </div>
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Criar Ticket"
                  value={wizardData.name}
                  onChange={(e) => updateWizardData({ name: e.target.value })}
                  data-testid="input-name"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6" data-testid="step-prompt">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold" data-testid="text-step2-title">Como o agente deve conversar?</h2>
        <p className="text-muted-foreground" data-testid="text-step2-description">
          Configure a personalidade e tom de voz da IA
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-ai-tone-title">Tom de Voz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { value: 'professional', label: 'Profissional', icon: '👔', desc: 'Formal e corporativo' },
              { value: 'friendly', label: 'Amigável', icon: '😊', desc: 'Caloroso e acolhedor' },
              { value: 'technical', label: 'Técnico', icon: '🔧', desc: 'Preciso e detalhado' },
              { value: 'casual', label: 'Casual', icon: '😎', desc: 'Descontraído' }
            ].map((tone) => (
              <div
                key={tone.value}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  wizardData.aiTone === tone.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'hover:bg-accent'
                }`}
                onClick={() => updateWizardData({ aiTone: tone.value as any })}
                data-testid={`option-tone-${tone.value}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tone.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{tone.label}</div>
                    <div className="text-xs text-muted-foreground">{tone.desc}</div>
                  </div>
                  {wizardData.aiTone === tone.value && <Check className="w-5 h-5 text-blue-500" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle data-testid="text-ai-style-title">Estilo de Resposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { value: 'concise', label: 'Conciso', icon: '⚡', desc: 'Respostas curtas e diretas' },
              { value: 'detailed', label: 'Detalhado', icon: '📝', desc: 'Explicações completas' },
              { value: 'step_by_step', label: 'Passo a Passo', icon: '🎯', desc: 'Guiado e estruturado' }
            ].map((style) => (
              <div
                key={style.value}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  wizardData.aiStyle === style.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'hover:bg-accent'
                }`}
                onClick={() => updateWizardData({ aiStyle: style.value as any })}
                data-testid={`option-style-${style.value}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{style.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{style.label}</div>
                    <div className="text-xs text-muted-foreground">{style.desc}</div>
                  </div>
                  {wizardData.aiStyle === style.value && <Check className="w-5 h-5 text-blue-500" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle data-testid="text-custom-prompt-title">Prompt Customizado (Opcional)</CardTitle>
          <CardDescription data-testid="text-custom-prompt-desc">
            Personalize ainda mais o comportamento da IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ex: Sempre pergunte o nível de urgência antes de criar o ticket..."
            value={wizardData.customPrompt}
            onChange={(e) => updateWizardData({ customPrompt: e.target.value })}
            rows={4}
            data-testid="input-custom-prompt"
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6" data-testid="step-mapping">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
          <Database className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold" data-testid="text-step3-title">Onde executar a ação?</h2>
        <p className="text-muted-foreground" data-testid="text-step3-description">
          Selecione o módulo ou API de destino
        </p>
      </div>

      {/* Mapping Type Selector */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        {[
          { value: 'internal_module', label: 'Módulo Interno', icon: Layers, desc: 'Tickets, Clientes, etc.' },
          { value: 'internal_form', label: 'Formulário', icon: Settings, desc: 'Formulários internos' },
          { value: 'external_api', label: 'API Externa', icon: Zap, desc: 'Webhooks e APIs' }
        ].map((type) => (
          <Card
            key={type.value}
            className={`cursor-pointer transition-all ${
              wizardData.mappingType === type.value ? 'border-green-500 border-2' : 'hover:shadow-lg'
            }`}
            onClick={() => updateWizardData({ mappingType: type.value as any })}
            data-testid={`card-mapping-${type.value}`}
          >
            <CardHeader className="text-center pb-4">
              <type.icon className="mx-auto w-10 h-10 mb-2 text-green-500" />
              <CardTitle className="text-base">{type.label}</CardTitle>
              <CardDescription className="text-xs">{type.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Configuration based on mapping type */}
      {wizardData.mappingType === 'internal_module' && (
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-module-config-title">Configurar Módulo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="targetModule">Módulo</Label>
              <Select value={wizardData.targetModule} onValueChange={(value) => updateWizardData({ targetModule: value })}>
                <SelectTrigger data-testid="select-target-module">
                  <SelectValue placeholder="Selecione o módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tickets">🎫 Tickets</SelectItem>
                  <SelectItem value="customers">👤 Clientes</SelectItem>
                  <SelectItem value="locations">📍 Localizações</SelectItem>
                  <SelectItem value="schedules">📅 Agendamentos</SelectItem>
                  <SelectItem value="projects">📊 Projetos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="targetEndpoint">Endpoint</Label>
              <Input
                id="targetEndpoint"
                placeholder="/api/tickets"
                value={wizardData.targetEndpoint}
                onChange={(e) => updateWizardData({ targetEndpoint: e.target.value })}
                data-testid="input-target-endpoint"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder for drag & drop field mapper - será implementado na próxima tarefa */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <Layers className="mx-auto w-12 h-12 mb-3 opacity-50" />
            <p data-testid="text-field-mapper-placeholder">Drag & Drop Field Mapper</p>
            <p className="text-sm">(Será implementado em breve)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6" data-testid="step-interaction">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold" data-testid="text-step4-title">Como coletar os dados?</h2>
        <p className="text-muted-foreground" data-testid="text-step4-description">
          Defina como o agente deve interagir com os usuários
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        {[
          { 
            value: 'conversational', 
            label: 'Conversacional', 
            icon: '💬', 
            desc: 'Chat natural - IA extrai informações da conversa',
            example: 'IA: "Qual o título do ticket?" → Usuário: "Sistema lento"'
          },
          { 
            value: 'interactive', 
            label: 'Interativo', 
            icon: '🎛️', 
            desc: 'Menus e botões - interface visual',
            example: 'IA apresenta botões: [Alta] [Média] [Baixa]'
          },
          { 
            value: 'hybrid', 
            label: 'Híbrido', 
            icon: '⚡', 
            desc: 'Tenta conversa, depois mostra menus se necessário',
            example: 'Conversacional primeiro, fallback para menu'
          },
          { 
            value: 'adaptive', 
            label: 'Adaptativo', 
            icon: '🤖', 
            desc: 'IA decide automaticamente baseado no contexto',
            example: 'IA escolhe o melhor método dinamicamente'
          }
        ].map((strategy) => (
          <Card
            key={strategy.value}
            className={`cursor-pointer transition-all ${
              wizardData.defaultCollectionStrategy === strategy.value ? 'border-orange-500 border-2' : 'hover:shadow-lg'
            }`}
            onClick={() => updateWizardData({ defaultCollectionStrategy: strategy.value as any })}
            data-testid={`card-strategy-${strategy.value}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl">{strategy.icon}</span>
                {wizardData.defaultCollectionStrategy === strategy.value && (
                  <CheckCircle2 className="w-6 h-6 text-orange-500" />
                )}
              </div>
              <CardTitle className="text-base" data-testid={`text-strategy-${strategy.value}`}>
                {strategy.label}
              </CardTitle>
              <CardDescription className="text-xs">{strategy.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs bg-muted p-2 rounded">
                <code>{strategy.example}</code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6" data-testid="step-response">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <Send className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold" data-testid="text-step5-title">O que fazer após coletar?</h2>
        <p className="text-muted-foreground" data-testid="text-step5-description">
          Configure a execução e resposta ao usuário
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-execution-title">Execução</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="method">Método HTTP</Label>
              <Select 
                value={wizardData.endpointMethod} 
                onValueChange={(value) => updateWizardData({ endpointMethod: value as any })}
              >
                <SelectTrigger data-testid="select-http-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST - Criar</SelectItem>
                  <SelectItem value="GET">GET - Buscar</SelectItem>
                  <SelectItem value="PUT">PUT - Substituir</SelectItem>
                  <SelectItem value="PATCH">PATCH - Atualizar</SelectItem>
                  <SelectItem value="DELETE">DELETE - Excluir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium text-sm">Confirmação</div>
                <div className="text-xs text-muted-foreground">Pedir confirmação antes de executar</div>
              </div>
              <input
                type="checkbox"
                checked={wizardData.requiresConfirmation}
                onChange={(e) => updateWizardData({ requiresConfirmation: e.target.checked })}
                className="w-5 h-5"
                data-testid="checkbox-confirmation"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle data-testid="text-response-templates-title">Templates de Resposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="successTemplate">Sucesso</Label>
              <Textarea
                id="successTemplate"
                placeholder="✅ Ação executada com sucesso!"
                value={wizardData.successTemplate}
                onChange={(e) => updateWizardData({ successTemplate: e.target.value })}
                rows={2}
                data-testid="input-success-template"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use variáveis: {'{ticketId}'}, {'{priority}'}, etc.
              </p>
            </div>
            <div>
              <Label htmlFor="errorTemplate">Erro</Label>
              <Textarea
                id="errorTemplate"
                placeholder="❌ Erro: {error}"
                value={wizardData.errorTemplate}
                onChange={(e) => updateWizardData({ errorTemplate: e.target.value })}
                rows={2}
                data-testid="input-error-template"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="border-2 border-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="text-summary-title">
            <CheckCircle2 className="w-5 h-5 text-purple-500" />
            Resumo da Ação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Nome:</span>
              <p className="font-medium" data-testid="text-summary-name">{wizardData.name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Categoria:</span>
              <p className="font-medium" data-testid="text-summary-category">{wizardData.category || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tom:</span>
              <p className="font-medium capitalize" data-testid="text-summary-tone">{wizardData.aiTone}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Estratégia:</span>
              <p className="font-medium capitalize" data-testid="text-summary-strategy">{wizardData.defaultCollectionStrategy}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Módulo:</span>
              <p className="font-medium" data-testid="text-summary-module">{wizardData.targetModule || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Método:</span>
              <p className="font-medium" data-testid="text-summary-method">{wizardData.endpointMethod}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-wizard-title">
                <Sparkles className="w-6 h-6 text-purple-500" />
                Action Studio
              </h1>
              <p className="text-sm text-muted-foreground" data-testid="text-wizard-subtitle">
                Crie ações poderosas para seus agentes IA
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" data-testid="button-test">
                <Play className="mr-2 w-4 h-4" />
                Testar
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={currentStep < totalSteps}
                data-testid="button-save"
              >
                <Save className="mr-2 w-4 h-4" />
                Salvar
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Passo {currentStep} de {totalSteps}</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-bar" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mt-6">
            {[
              { num: 1, label: 'Objetivo', icon: Target },
              { num: 2, label: 'Prompt', icon: MessageSquare },
              { num: 3, label: 'Mapeamento', icon: Database },
              { num: 4, label: 'Interação', icon: Zap },
              { num: 5, label: 'Resposta', icon: Send }
            ].map((step) => (
              <div 
                key={step.num}
                className={`flex flex-col items-center cursor-pointer transition-all ${
                  currentStep === step.num ? 'opacity-100' : 'opacity-40'
                }`}
                onClick={() => setCurrentStep(step.num)}
                data-testid={`step-indicator-${step.num}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                  currentStep >= step.num ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' : 'bg-muted'
                }`}>
                  {currentStep > step.num ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs font-medium">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-5xl mx-auto p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>
      </ScrollArea>

      {/* Footer Navigation */}
      <div className="border-t bg-card p-4">
        <div className="max-w-5xl mx-auto flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            data-testid="button-prev"
          >
            <ChevronLeft className="mr-2 w-4 h-4" />
            Anterior
          </Button>
          <Button
            onClick={nextStep}
            disabled={currentStep === totalSteps}
            data-testid="button-next"
          >
            Próximo
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
