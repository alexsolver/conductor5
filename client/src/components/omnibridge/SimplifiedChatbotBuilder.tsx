import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Bot,
  MessageSquare,
  Plus,
  Minus,
  ArrowRight,
  Play,
  Pause,
  Save,
  Eye,
  Copy,
  Trash2,
  Settings,
  Star,
  Users,
  Calendar,
  FileText,
  Tag,
  Hash,
  Mail,
  Phone,
  Smartphone,
  Globe,
  Lightbulb,
  Brain,
  Sparkles,
  MousePointer2,
  Cog,
  Target,
  CheckCircle,
  AlertCircle,
  Clock,
  HelpCircle,
  Workflow,
  Send,
  Reply,
  Forward,
  Archive,
  Bell,
  Filter,
  Search,
  Edit,
  Download,
  Upload
} from 'lucide-react';

interface ChatStep {
  id: string;
  type: 'message' | 'question' | 'options' | 'action';
  title: string;
  content: string;
  options?: Array<{
    id: string;
    text: string;
    nextStep?: string;
  }>;
  nextStep?: string;
  actions?: Array<{
    type: 'create_ticket' | 'send_email' | 'transfer_human' | 'add_tag';
    config: Record<string, any>;
  }>;
}

interface SimpleChatbot {
  id?: string;
  name: string;
  description: string;
  greeting: string;
  enabled: boolean;
  channels: string[];
  steps: ChatStep[];
  fallbackMessage: string;
  transferToHuman: boolean;
}

interface SimplifiedChatbotBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  chatbotId?: string;
}

// Predefined templates for quick start
const chatbotTemplates = [
  {
    name: 'Atendimento Geral',
    description: 'Bot básico para primeiros atendimentos',
    greeting: 'Olá! Como posso ajudar você hoje?',
    steps: [
      {
        id: 'welcome',
        type: 'options' as const,
        title: 'Menu Principal',
        content: 'Escolha uma opção:',
        options: [
          { id: 'opt1', text: 'Suporte técnico', nextStep: 'support' },
          { id: 'opt2', text: 'Informações comerciais', nextStep: 'sales' },
          { id: 'opt3', text: 'Falar com humano', nextStep: 'transfer' }
        ]
      },
      {
        id: 'support',
        type: 'message' as const,
        title: 'Suporte Técnico',
        content: 'Vou transferir você para nossa equipe de suporte técnico.',
        actions: [{ type: 'transfer_human' as const, config: { department: 'technical' } }]
      },
      {
        id: 'sales',
        type: 'message' as const,
        title: 'Comercial',
        content: 'Vou transferir você para nossa equipe comercial.',
        actions: [{ type: 'transfer_human' as const, config: { department: 'sales' } }]
      },
      {
        id: 'transfer',
        type: 'message' as const,
        title: 'Transferir',
        content: 'Aguarde um momento, vou conectar você com um de nossos atendentes.',
        actions: [{ type: 'transfer_human' as const, config: { priority: 'normal' } }]
      }
    ]
  },
  {
    name: 'FAQ Automático',
    description: 'Responde perguntas frequentes',
    greeting: 'Oi! Tenho algumas informações que podem te ajudar.',
    steps: [
      {
        id: 'faq_menu',
        type: 'options' as const,
        title: 'Perguntas Frequentes',
        content: 'Sobre o que você gostaria de saber?',
        options: [
          { id: 'hours', text: 'Horário de funcionamento', nextStep: 'hours_info' },
          { id: 'contact', text: 'Como entrar em contato', nextStep: 'contact_info' },
          { id: 'location', text: 'Endereço', nextStep: 'location_info' },
          { id: 'other', text: 'Outra pergunta', nextStep: 'transfer' }
        ]
      },
      {
        id: 'hours_info',
        type: 'message' as const,
        title: 'Horário',
        content: 'Funcionamos de segunda a sexta, das 8h às 18h. Sábados das 8h às 12h.',
        nextStep: 'faq_menu'
      },
      {
        id: 'contact_info',
        type: 'message' as const,
        title: 'Contato',
        content: 'Você pode nos contatar pelo telefone (11) 1234-5678 ou email contato@empresa.com',
        nextStep: 'faq_menu'
      },
      {
        id: 'location_info',
        type: 'message' as const,
        title: 'Endereço',
        content: 'Estamos localizados na Rua das Flores, 123 - Centro, São Paulo - SP',
        nextStep: 'faq_menu'
      }
    ]
  },
  {
    name: 'Coleta de Dados',
    description: 'Coleta informações do cliente',
    greeting: 'Olá! Para melhor te atender, preciso de algumas informações.',
    steps: [
      {
        id: 'ask_name',
        type: 'question' as const,
        title: 'Nome',
        content: 'Qual é o seu nome?',
        nextStep: 'ask_email'
      },
      {
        id: 'ask_email',
        type: 'question' as const,
        title: 'Email',
        content: 'Qual é o seu email?',
        nextStep: 'ask_phone'
      },
      {
        id: 'ask_phone',
        type: 'question' as const,
        title: 'Telefone',
        content: 'Qual é o seu telefone?',
        nextStep: 'create_contact'
      },
      {
        id: 'create_contact',
        type: 'message' as const,
        title: 'Dados Coletados',
        content: 'Obrigado! Suas informações foram registradas e nossa equipe entrará em contato.',
        actions: [{ type: 'create_ticket' as const, config: { title: 'Novo contato via chatbot' } }]
      }
    ]
  }
];

export default function SimplifiedChatbotBuilder({ 
  isOpen, 
  onClose, 
  chatbotId 
}: SimplifiedChatbotBuilderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [chatbot, setChatbot] = useState<SimpleChatbot>({
    name: '',
    description: '',
    greeting: 'Olá! Como posso ajudar você?',
    enabled: true,
    channels: ['whatsapp'],
    steps: [],
    fallbackMessage: 'Desculpe, não entendi. Vou transferir você para um atendente.',
    transferToHuman: true
  });

  const [currentStep, setCurrentStep] = useState<string>('setup');
  const [editingStep, setEditingStep] = useState<ChatStep | null>(null);
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewStep, setPreviewStep] = useState<string>('welcome');

  // Load existing chatbot if editing
  const { data: existingChatbot } = useQuery({
    queryKey: [`/api/omnibridge/chatbots/${chatbotId}`],
    enabled: !!chatbotId && isOpen
  });

  // Save chatbot mutation
  const saveChatbotMutation = useMutation({
    mutationFn: (chatbotData: SimpleChatbot) =>
      apiRequest(chatbotId ? `/api/omnibridge/chatbots/${chatbotId}` : '/api/omnibridge/chatbots', {
        method: chatbotId ? 'PUT' : 'POST',
        body: JSON.stringify(chatbotData)
      }),
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Chatbot salvo com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/chatbots'] });
      onClose();
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao salvar chatbot', variant: 'destructive' });
    }
  });

  // Test chatbot mutation
  const testChatbotMutation = useMutation({
    mutationFn: (message: string) =>
      apiRequest('/api/omnibridge/chatbots/test', {
        method: 'POST',
        body: JSON.stringify({ chatbot, message })
      }),
    onSuccess: (response) => {
      toast({ 
        title: 'Teste realizado', 
        description: `Resposta: ${response.data.response}`,
        duration: 5000
      });
    }
  });

  useEffect(() => {
    if (existingChatbot?.data) {
      setChatbot(existingChatbot.data);
    }
  }, [existingChatbot]);

  const handleTemplateSelect = (template: typeof chatbotTemplates[0]) => {
    setChatbot(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      greeting: template.greeting,
      steps: template.steps
    }));
    setCurrentStep('steps');
  };

  const addStep = (type: ChatStep['type']) => {
    const newStep: ChatStep = {
      id: `step_${Date.now()}`,
      type,
      title: type === 'message' ? 'Nova Mensagem' : 
             type === 'question' ? 'Nova Pergunta' :
             type === 'options' ? 'Novas Opções' : 'Nova Ação',
      content: '',
      ...(type === 'options' && { options: [] })
    };
    
    setChatbot(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
    
    setEditingStep(newStep);
    setShowStepEditor(true);
  };

  const editStep = (step: ChatStep) => {
    setEditingStep(step);
    setShowStepEditor(true);
  };

  const deleteStep = (stepId: string) => {
    setChatbot(prev => ({
      ...prev,
      steps: prev.steps.filter(s => s.id !== stepId)
    }));
  };

  const updateStep = (updatedStep: ChatStep) => {
    setChatbot(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === updatedStep.id ? updatedStep : s)
    }));
    setShowStepEditor(false);
    setEditingStep(null);
  };

  const handleSave = () => {
    if (!chatbot.name.trim()) {
      toast({ title: 'Erro', description: 'Nome do chatbot é obrigatório', variant: 'destructive' });
      return;
    }
    if (chatbot.steps.length === 0) {
      toast({ title: 'Erro', description: 'Adicione pelo menos um passo', variant: 'destructive' });
      return;
    }

    saveChatbotMutation.mutate(chatbot);
  };

  const getStepIcon = (type: ChatStep['type']) => {
    switch (type) {
      case 'message': return MessageSquare;
      case 'question': return HelpCircle;
      case 'options': return Target;
      case 'action': return Cog;
      default: return MessageSquare;
    }
  };

  const getStepColor = (type: ChatStep['type']) => {
    switch (type) {
      case 'message': return 'bg-blue-500';
      case 'question': return 'bg-green-500';
      case 'options': return 'bg-purple-500';
      case 'action': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0" data-testid="chatbot-builder">
        <div className="flex h-full">
          {/* Left Sidebar - Navigation */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Criador de Chatbot
              </h3>
            </div>

            <div className="p-4">
              <div className="space-y-2">
                <Button
                  variant={currentStep === 'setup' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setCurrentStep('setup')}
                  data-testid="step-setup"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configuração
                </Button>
                <Button
                  variant={currentStep === 'steps' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setCurrentStep('steps')}
                  data-testid="step-steps"
                >
                  <Workflow className="h-4 w-4 mr-2" />
                  Passos do Bot
                </Button>
                <Button
                  variant={currentStep === 'preview' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setCurrentStep('preview')}
                  data-testid="step-preview"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ações Rápidas
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowPreview(true)}
                  data-testid="test-chatbot"
                >
                  <Play className="h-3 w-3 mr-2" />
                  Testar Bot
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleSave}
                  disabled={saveChatbotMutation.isPending}
                  data-testid="save-chatbot"
                >
                  <Save className="h-3 w-3 mr-2" />
                  {saveChatbotMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {chatbotId ? 'Editar Chatbot' : 'Novo Chatbot'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Crie um assistente virtual para atender seus clientes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={chatbot.enabled}
                    onCheckedChange={(enabled) => setChatbot(prev => ({ ...prev, enabled }))}
                    data-testid="chatbot-enabled"
                  />
                  <Label className="text-sm">Ativo</Label>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 p-6">
              {currentStep === 'setup' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Templates */}
                  {!chatbot.name && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5" />
                          Começar com Template
                        </CardTitle>
                        <CardDescription>
                          Escolha um modelo pronto ou crie do zero
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {chatbotTemplates.map((template, index) => (
                            <Card 
                              key={index}
                              className="cursor-pointer hover:shadow-md transition-all border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                              onClick={() => handleTemplateSelect(template)}
                              data-testid={`template-${index}`}
                            >
                              <CardContent className="p-4">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                  {template.name}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {template.description}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  {template.steps.length} passos
                                </Badge>
                              </CardContent>
                            </Card>
                          ))}
                          <Card 
                            className="cursor-pointer hover:shadow-md transition-all border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-green-400"
                            onClick={() => setCurrentStep('steps')}
                            data-testid="create-from-scratch"
                          >
                            <CardContent className="p-4 text-center">
                              <Plus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Criar do Zero
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Comece com um chatbot vazio
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Basic Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações Básicas</CardTitle>
                      <CardDescription>
                        Informações gerais do seu chatbot
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="chatbot-name">Nome do Chatbot</Label>
                          <Input
                            id="chatbot-name"
                            placeholder="ex: Assistente de Atendimento"
                            value={chatbot.name}
                            onChange={(e) => setChatbot(prev => ({ ...prev, name: e.target.value }))}
                            data-testid="chatbot-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="chatbot-description">Descrição</Label>
                          <Input
                            id="chatbot-description"
                            placeholder="ex: Bot para primeiros atendimentos"
                            value={chatbot.description}
                            onChange={(e) => setChatbot(prev => ({ ...prev, description: e.target.value }))}
                            data-testid="chatbot-description"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="greeting">Mensagem de Boas-vindas</Label>
                        <Textarea
                          id="greeting"
                          placeholder="ex: Olá! Como posso ajudar você hoje?"
                          value={chatbot.greeting}
                          onChange={(e) => setChatbot(prev => ({ ...prev, greeting: e.target.value }))}
                          rows={3}
                          data-testid="chatbot-greeting"
                        />
                      </div>

                      <div>
                        <Label htmlFor="fallback">Mensagem de Fallback</Label>
                        <Textarea
                          id="fallback"
                          placeholder="ex: Desculpe, não entendi. Vou transferir você para um atendente."
                          value={chatbot.fallbackMessage}
                          onChange={(e) => setChatbot(prev => ({ ...prev, fallbackMessage: e.target.value }))}
                          rows={2}
                          data-testid="chatbot-fallback"
                        />
                      </div>

                      <div>
                        <Label>Canais Ativos</Label>
                        <div className="flex gap-2 mt-2">
                          {['whatsapp', 'telegram', 'email', 'sms'].map((channel) => (
                            <Button
                              key={channel}
                              variant={chatbot.channels.includes(channel) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                const newChannels = chatbot.channels.includes(channel)
                                  ? chatbot.channels.filter(c => c !== channel)
                                  : [...chatbot.channels, channel];
                                setChatbot(prev => ({ ...prev, channels: newChannels }));
                              }}
                              data-testid={`channel-${channel}`}
                            >
                              {channel.charAt(0).toUpperCase() + channel.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="transfer-human"
                          checked={chatbot.transferToHuman}
                          onCheckedChange={(checked) => setChatbot(prev => ({ ...prev, transferToHuman: checked }))}
                          data-testid="transfer-human"
                        />
                        <Label htmlFor="transfer-human">
                          Permitir transferência para humano
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentStep === 'steps' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Steps Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Passos do Chatbot
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Defina como seu bot irá conversar com os usuários
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => addStep('message')}
                        data-testid="add-message-step"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Mensagem
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => addStep('question')}
                        data-testid="add-question-step"
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Pergunta
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => addStep('options')}
                        data-testid="add-options-step"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Opções
                      </Button>
                    </div>
                  </div>

                  {/* Steps List */}
                  {chatbot.steps.length === 0 ? (
                    <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
                      <CardContent className="p-8 text-center">
                        <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Nenhum passo criado
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Adicione passos para definir como seu chatbot irá se comportar
                        </p>
                        <div className="flex justify-center gap-2">
                          <Button size="sm" onClick={() => addStep('message')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Mensagem
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {chatbot.steps.map((step, index) => {
                        const StepIcon = getStepIcon(step.type);
                        return (
                          <Card key={step.id} className="relative">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={`p-2 rounded ${getStepColor(step.type)} text-white`}>
                                    <StepIcon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                        {step.title}
                                      </h4>
                                      <Badge variant="outline" className="text-xs">
                                        {step.type}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                      {step.content || 'Sem conteúdo definido'}
                                    </p>
                                    {step.options && step.options.length > 0 && (
                                      <div className="flex gap-1 mt-2 flex-wrap">
                                        {step.options.slice(0, 3).map((option) => (
                                          <Badge key={option.id} variant="secondary" className="text-xs">
                                            {option.text}
                                          </Badge>
                                        ))}
                                        {step.options.length > 3 && (
                                          <Badge variant="secondary" className="text-xs">
                                            +{step.options.length - 3} mais
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => editStep(step)}
                                    data-testid={`edit-step-${step.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteStep(step.id)}
                                    data-testid={`delete-step-${step.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                            {index < chatbot.steps.length - 1 && (
                              <div className="absolute -bottom-2 left-8 z-10">
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-1">
                                  <ArrowRight className="h-3 w-3 text-gray-500" />
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 'preview' && (
                <div className="max-w-4xl mx-auto">
                  <ChatbotPreview chatbot={chatbot} />
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Step Editor Modal */}
        <Dialog open={showStepEditor} onOpenChange={setShowStepEditor}>
          <DialogContent className="sm:max-w-lg" data-testid="step-editor-modal">
            {editingStep && (
              <StepEditor
                step={editingStep}
                onSave={updateStep}
                onCancel={() => setShowStepEditor(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// Step Editor Component
function StepEditor({ 
  step, 
  onSave, 
  onCancel 
}: { 
  step: ChatStep; 
  onSave: (step: ChatStep) => void; 
  onCancel: () => void; 
}) {
  const [editedStep, setEditedStep] = useState<ChatStep>({ ...step });

  const addOption = () => {
    const newOption = {
      id: `opt_${Date.now()}`,
      text: '',
      nextStep: ''
    };
    setEditedStep(prev => ({
      ...prev,
      options: [...(prev.options || []), newOption]
    }));
  };

  const updateOption = (optionId: string, field: string, value: string) => {
    setEditedStep(prev => ({
      ...prev,
      options: prev.options?.map(opt =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      ) || []
    }));
  };

  const removeOption = (optionId: string) => {
    setEditedStep(prev => ({
      ...prev,
      options: prev.options?.filter(opt => opt.id !== optionId) || []
    }));
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Editar {editedStep.type === 'message' ? 'Mensagem' : 
                              editedStep.type === 'question' ? 'Pergunta' :
                              editedStep.type === 'options' ? 'Opções' : 'Ação'}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label htmlFor="step-title">Título</Label>
          <Input
            id="step-title"
            value={editedStep.title}
            onChange={(e) => setEditedStep(prev => ({ ...prev, title: e.target.value }))}
            data-testid="step-title"
          />
        </div>

        <div>
          <Label htmlFor="step-content">Conteúdo</Label>
          <Textarea
            id="step-content"
            value={editedStep.content}
            onChange={(e) => setEditedStep(prev => ({ ...prev, content: e.target.value }))}
            rows={3}
            data-testid="step-content"
          />
        </div>

        {editedStep.type === 'options' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Opções</Label>
              <Button size="sm" onClick={addOption} data-testid="add-option">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {editedStep.options?.map((option, index) => (
                <div key={option.id} className="flex gap-2">
                  <Input
                    placeholder="Texto da opção"
                    value={option.text}
                    onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                    data-testid={`option-text-${index}`}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeOption(option.id)}
                    data-testid={`remove-option-${index}`}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(editedStep)} data-testid="save-step">
          Salvar
        </Button>
      </div>
    </div>
  );
}

// Chatbot Preview Component
function ChatbotPreview({ chatbot }: { chatbot: SimpleChatbot }) {
  const [currentStepId, setCurrentStepId] = useState<string>('welcome');
  const [conversation, setConversation] = useState<Array<{ type: 'bot' | 'user'; message: string }>>([
    { type: 'bot', message: chatbot.greeting }
  ]);

  const currentStep = chatbot.steps.find(s => s.id === currentStepId);

  const handleOptionClick = (nextStep?: string) => {
    if (nextStep) {
      const step = chatbot.steps.find(s => s.id === nextStep);
      if (step) {
        setConversation(prev => [...prev, { type: 'bot', message: step.content }]);
        setCurrentStepId(nextStep);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Visualização do Chatbot
        </CardTitle>
        <CardDescription>
          Veja como seu chatbot irá se comportar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
          {/* Chat Messages */}
          <div className="space-y-3">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.type === 'bot' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.type === 'bot'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}

            {/* Current Step Options */}
            {currentStep?.type === 'options' && currentStep.options && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {currentStep.content}
                    </p>
                    <div className="space-y-1">
                      {currentStep.options.map((option) => (
                        <Button
                          key={option.id}
                          size="sm"
                          variant="outline"
                          className="w-full justify-start text-xs"
                          onClick={() => {
                            setConversation(prev => [...prev, { type: 'user', message: option.text }]);
                            handleOptionClick(option.nextStep);
                          }}
                          data-testid={`preview-option-${option.id}`}
                        >
                          {option.text}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reset Preview */}
        <div className="mt-4 text-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCurrentStepId('welcome');
              setConversation([{ type: 'bot', message: chatbot.greeting }]);
            }}
            data-testid="reset-preview"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reiniciar Conversa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}