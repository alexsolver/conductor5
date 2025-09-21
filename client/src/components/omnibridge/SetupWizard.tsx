import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  MessageSquare,
  Mail,
  Phone,
  Smartphone,
  Settings,
  Users,
  Bot,
  Zap,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Star,
  Globe,
  Calendar,
  FileText,
  Target,
  Lightbulb,
  Brain,
  Sparkles,
  Cog,
  Play,
  Clock,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Shield,
  Workflow,
  MousePointer2,
  Send,
  Bell,
  Tag,
  Archive,
  Forward,
  Reply
} from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isComplete: boolean;
  isOptional?: boolean;
}

interface SetupData {
  channels: {
    email: boolean;
    whatsapp: boolean;
    telegram: boolean;
    sms: boolean;
  };
  businessInfo: {
    businessName: string;
    businessType: string;
    workingHours: {
      start: string;
      end: string;
      timezone: string;
    };
    supportEmail: string;
  };
  automationPreferences: {
    autoRespond: boolean;
    createTickets: boolean;
    transferToHuman: boolean;
    priorityLevel: string;
  };
  chatbotConfig: {
    enabled: boolean;
    greeting: string;
    fallbackMessage: string;
    collectFeedback: boolean;
  };
  templates: string[];
}

interface SetupWizardProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function SetupWizard({ isOpen, onComplete, onSkip }: SetupWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<SetupData>({
    channels: {
      email: true,
      whatsapp: false,
      telegram: false,
      sms: false
    },
    businessInfo: {
      businessName: '',
      businessType: 'service',
      workingHours: {
        start: '09:00',
        end: '18:00',
        timezone: 'America/Sao_Paulo'
      },
      supportEmail: ''
    },
    automationPreferences: {
      autoRespond: true,
      createTickets: true,
      transferToHuman: true,
      priorityLevel: 'medium'
    },
    chatbotConfig: {
      enabled: true,
      greeting: 'Olá! Como posso ajudar você hoje?',
      fallbackMessage: 'Desculpe, não entendi. Vou transferir você para um atendente.',
      collectFeedback: true
    },
    templates: []
  });

  // Save setup configuration
  const saveSetupMutation = useMutation({
    mutationFn: (data: SetupData) =>
      apiRequest('POST', '/api/omnibridge/setup', data),
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Configuração inicial concluída com sucesso!' });
      onComplete();
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao salvar configuração', variant: 'destructive' });
    }
  });

  const steps: SetupStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao OmniBridge',
      description: 'Vamos configurar sua central de comunicação em poucos passos',
      component: WelcomeStep,
      isComplete: true
    },
    {
      id: 'channels',
      title: 'Canais de Comunicação',
      description: 'Escolha quais canais deseja integrar',
      component: ChannelsStep,
      isComplete: Object.values(setupData.channels).some(Boolean)
    },
    {
      id: 'business',
      title: 'Informações do Negócio',
      description: 'Configure informações básicas da sua empresa',
      component: BusinessStep,
      isComplete: setupData.businessInfo.businessName.length > 0
    },
    {
      id: 'automation',
      title: 'Preferências de Automação',
      description: 'Configure como o sistema deve responder automaticamente',
      component: AutomationStep,
      isComplete: true // Always complete as has defaults
    },
    {
      id: 'chatbot',
      title: 'Configurar Chatbot',
      description: 'Personalize seu assistente virtual',
      component: ChatbotStep,
      isComplete: setupData.chatbotConfig.greeting.length > 0
    },
    {
      id: 'templates',
      title: 'Templates Iniciais',
      description: 'Escolha modelos prontos para acelerar o início',
      component: TemplatesStep,
      isComplete: true,
      isOptional: true
    },
    {
      id: 'complete',
      title: 'Configuração Concluída',
      description: 'Tudo pronto! Sua central está configurada',
      component: CompleteStep,
      isComplete: true
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    saveSetupMutation.mutate(setupData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {currentStepData.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentStepData.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Passo {currentStep + 1} de {steps.length}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-700"
                data-testid="skip-setup"
              >
                Pular configuração
              </Button>
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <currentStepData.component
            data={setupData}
            onUpdate={setSetupData}
            onNext={nextStep}
            onPrev={prevStep}
            isFirst={currentStep === 0}
            isLast={currentStep === steps.length - 1}
            onComplete={handleComplete}
            isLoading={saveSetupMutation.isPending}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              data-testid="prev-step"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index <= currentStep
                      ? 'bg-blue-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep} data-testid="next-step">
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={saveSetupMutation.isPending}
                data-testid="complete-setup"
              >
                {saveSetupMutation.isPending ? 'Salvando...' : 'Finalizar'}
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Welcome Step
function WelcomeStep({ onNext }: any) {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <MessageSquare className="h-12 w-12 text-white" />
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Bem-vindo ao OmniBridge!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Sua central unificada de comunicação que conecta todos os canais (email, WhatsApp, Telegram, SMS) 
          em um só lugar, com automação inteligente e chatbots fáceis de configurar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card className="text-center p-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Canais Unificados
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gerencie todas as mensagens em um inbox centralizado
          </p>
        </Card>

        <Card className="text-center p-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Automação Inteligente
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Respostas automáticas e regras personalizáveis
          </p>
        </Card>

        <Card className="text-center p-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Bot className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Chatbots Simples
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Crie assistentes virtuais sem conhecimento técnico
          </p>
        </Card>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          <Lightbulb className="h-4 w-4 inline mr-1" />
          Este assistente irá configurar tudo em aproximadamente 5 minutos. 
          Você pode pular etapas opcionais e configurar depois.
        </p>
      </div>

      <Button onClick={onNext} size="lg" className="px-8" data-testid="start-setup">
        Começar Configuração
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}

// Channels Step
function ChannelsStep({ data, onUpdate }: any) {
  const updateChannel = (channel: string, enabled: boolean) => {
    onUpdate((prev: SetupData) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: enabled
      }
    }));
  };

  const channels = [
    {
      id: 'email',
      name: 'Email',
      description: 'Integração via IMAP/SMTP para emails',
      icon: Mail,
      color: 'bg-blue-500',
      popular: true
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'API oficial do WhatsApp Business',
      icon: MessageSquare,
      color: 'bg-green-500',
      popular: true
    },
    {
      id: 'telegram',
      name: 'Telegram',
      description: 'Bot do Telegram para atendimento',
      icon: Send,
      color: 'bg-blue-400',
      popular: false
    },
    {
      id: 'sms',
      name: 'SMS',
      description: 'Mensagens de texto via Twilio',
      icon: Phone,
      color: 'bg-purple-500',
      popular: false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Quais canais você quer integrar?
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Selecione os canais de comunicação que sua empresa utiliza. Você pode adicionar mais depois.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((channel) => {
          const isSelected = data.channels[channel.id as keyof typeof data.channels];
          
          return (
            <Card
              key={channel.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:shadow-md'
              }`}
              onClick={() => updateChannel(channel.id, !isSelected)}
              data-testid={`channel-${channel.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${channel.color} text-white`}>
                    <channel.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {channel.name}
                      </h4>
                      {channel.popular && (
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {channel.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => updateChannel(channel.id, !isSelected)}
                        data-testid={`checkbox-${channel.id}`}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {isSelected ? 'Selecionado' : 'Selecionar'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
        <p className="text-amber-800 dark:text-amber-200 text-sm">
          <AlertCircle className="h-4 w-4 inline mr-1" />
          As integrações precisarão ser configuradas individualmente em "Integrações" no menu principal. 
          Este assistente irá preparar o sistema para recebê-las.
        </p>
      </div>
    </div>
  );
}

// Business Step
function BusinessStep({ data, onUpdate }: any) {
  const updateBusinessInfo = (field: string, value: any) => {
    onUpdate((prev: SetupData) => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        [field]: value
      }
    }));
  };

  const updateWorkingHours = (field: string, value: string) => {
    onUpdate((prev: SetupData) => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        workingHours: {
          ...prev.businessInfo.workingHours,
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Informações do seu negócio
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Essas informações ajudam a personalizar as respostas automáticas
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome da Empresa *
          </label>
          <Input
            placeholder="ex: Minha Empresa Ltda"
            value={data.businessInfo.businessName}
            onChange={(e) => updateBusinessInfo('businessName', e.target.value)}
            data-testid="business-name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Negócio
          </label>
          <Select
            value={data.businessInfo.businessType}
            onValueChange={(value) => updateBusinessInfo('businessType', value)}
          >
            <SelectTrigger data-testid="business-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Prestação de Serviços</SelectItem>
              <SelectItem value="retail">Varejo</SelectItem>
              <SelectItem value="ecommerce">E-commerce</SelectItem>
              <SelectItem value="saas">Software/SaaS</SelectItem>
              <SelectItem value="healthcare">Saúde</SelectItem>
              <SelectItem value="education">Educação</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email de Suporte
          </label>
          <Input
            type="email"
            placeholder="ex: suporte@minhaempresa.com"
            value={data.businessInfo.supportEmail}
            onChange={(e) => updateBusinessInfo('supportEmail', e.target.value)}
            data-testid="support-email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Horário de Funcionamento
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Início
              </label>
              <Input
                type="time"
                value={data.businessInfo.workingHours.start}
                onChange={(e) => updateWorkingHours('start', e.target.value)}
                data-testid="working-hours-start"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Fim
              </label>
              <Input
                type="time"
                value={data.businessInfo.workingHours.end}
                onChange={(e) => updateWorkingHours('end', e.target.value)}
                data-testid="working-hours-end"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          <HelpCircle className="h-4 w-4 inline mr-1" />
          O horário de funcionamento será usado para automações como "Estamos fechados" 
          e para determinar quando transferir para atendentes humanos.
        </p>
      </div>
    </div>
  );
}

// Automation Step
function AutomationStep({ data, onUpdate }: any) {
  const updateAutomation = (field: string, value: any) => {
    onUpdate((prev: SetupData) => ({
      ...prev,
      automationPreferences: {
        ...prev.automationPreferences,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Como deve funcionar a automação?
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Configure o comportamento padrão do sistema
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={data.automationPreferences.autoRespond}
              onCheckedChange={(checked) => updateAutomation('autoRespond', checked)}
              data-testid="auto-respond"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Respostas Automáticas
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Responder automaticamente mensagens recebidas fora do horário ou com palavras-chave específicas
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={data.automationPreferences.createTickets}
              onCheckedChange={(checked) => updateAutomation('createTickets', checked)}
              data-testid="create-tickets"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Criar Tickets Automaticamente
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gerar tickets automáticos para solicitações que precisam de acompanhamento
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={data.automationPreferences.transferToHuman}
              onCheckedChange={(checked) => updateAutomation('transferToHuman', checked)}
              data-testid="transfer-to-human"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Transferir para Humano
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permitir que clientes solicitem atendimento humano a qualquer momento
              </p>
            </div>
          </div>
        </Card>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nível de Prioridade Padrão
          </label>
          <Select
            value={data.automationPreferences.priorityLevel}
            onValueChange={(value) => updateAutomation('priorityLevel', value)}
          >
            <SelectTrigger data-testid="priority-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <p className="text-green-800 dark:text-green-200 text-sm">
          <CheckCircle className="h-4 w-4 inline mr-1" />
          Essas configurações podem ser ajustadas a qualquer momento. 
          Você também poderá criar regras específicas depois.
        </p>
      </div>
    </div>
  );
}

// Chatbot Step
function ChatbotStep({ data, onUpdate }: any) {
  const updateChatbot = (field: string, value: any) => {
    onUpdate((prev: SetupData) => ({
      ...prev,
      chatbotConfig: {
        ...prev.chatbotConfig,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Configure seu assistente virtual
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Personalize como seu chatbot irá se apresentar
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Checkbox
            checked={data.chatbotConfig.enabled}
            onCheckedChange={(checked) => updateChatbot('enabled', checked)}
            data-testid="chatbot-enabled"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Ativar chatbot
          </label>
        </div>

        {data.chatbotConfig.enabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mensagem de Boas-vindas
              </label>
              <Textarea
                placeholder="ex: Olá! Como posso ajudar você hoje?"
                value={data.chatbotConfig.greeting}
                onChange={(e) => updateChatbot('greeting', e.target.value)}
                rows={3}
                data-testid="chatbot-greeting"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mensagem quando não entender
              </label>
              <Textarea
                placeholder="ex: Desculpe, não entendi. Vou transferir você para um atendente."
                value={data.chatbotConfig.fallbackMessage}
                onChange={(e) => updateChatbot('fallbackMessage', e.target.value)}
                rows={3}
                data-testid="chatbot-fallback"
              />
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                checked={data.chatbotConfig.collectFeedback}
                onCheckedChange={(checked) => updateChatbot('collectFeedback', checked)}
                data-testid="collect-feedback"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Coletar feedback dos usuários
              </label>
            </div>
          </>
        )}
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        <p className="text-purple-800 dark:text-purple-200 text-sm">
          <Bot className="h-4 w-4 inline mr-1" />
          Após a configuração inicial, você poderá criar fluxos mais complexos 
          com perguntas, opções e ações personalizadas.
        </p>
      </div>
    </div>
  );
}

// Templates Step
function TemplatesStep({ data, onUpdate }: any) {
  const templates = [
    {
      id: 'welcome_sequence',
      name: 'Sequência de Boas-vindas',
      description: 'Mensagens automáticas para novos clientes',
      category: 'Automação'
    },
    {
      id: 'support_faq',
      name: 'FAQ de Suporte',
      description: 'Respostas para perguntas frequentes',
      category: 'Chatbot'
    },
    {
      id: 'business_hours',
      name: 'Horário de Funcionamento',
      description: 'Mensagem para fora do horário comercial',
      category: 'Automação'
    },
    {
      id: 'ticket_creation',
      name: 'Criação de Tickets',
      description: 'Regras para abrir tickets automaticamente',
      category: 'Automação'
    },
    {
      id: 'lead_qualification',
      name: 'Qualificação de Leads',
      description: 'Chatbot para coletar dados de prospects',
      category: 'Chatbot'
    }
  ];

  const toggleTemplate = (templateId: string) => {
    onUpdate((prev: SetupData) => ({
      ...prev,
      templates: prev.templates.includes(templateId)
        ? prev.templates.filter(t => t !== templateId)
        : [...prev.templates, templateId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Escolha templates para começar
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Modelos prontos que você pode personalizar depois
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => {
          const isSelected = data.templates.includes(template.id);
          
          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:shadow-md'
              }`}
              onClick={() => toggleTemplate(template.id)}
              data-testid={`template-${template.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleTemplate(template.id)}
                    data-testid={`checkbox-${template.id}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {template.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Você pode adicionar ou remover estes templates a qualquer momento
        </p>
      </div>
    </div>
  );
}

// Complete Step
function CompleteStep({ onComplete, isLoading }: any) {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
        <CheckCircle className="h-12 w-12 text-white" />
      </div>

      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Configuração Concluída!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Sua central de comunicação está pronta. Agora você pode começar a receber e gerenciar 
          mensagens de todos os seus canais em um só lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        <Card className="p-4 text-center">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            Inbox Unificado
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Todas as mensagens em um lugar
          </p>
        </Card>

        <Card className="p-4 text-center">
          <Zap className="h-8 w-8 mx-auto mb-2 text-purple-500" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            Automação Ativa
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Respostas e regras configuradas
          </p>
        </Card>

        <Card className="p-4 text-center">
          <Bot className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            Chatbot Pronto
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Assistente virtual configurado
          </p>
        </Card>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
          Próximos Passos:
        </h4>
        <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 text-left max-w-md mx-auto">
          <li>• Configure as integrações dos canais no menu "Integrações"</li>
          <li>• Personalize regras de automação conforme necessário</li>
          <li>• Teste o chatbot e ajuste as respostas</li>
          <li>• Monitore o inbox e gerencie as mensagens</li>
        </ul>
      </div>

      <Button
        onClick={onComplete}
        size="lg"
        className="px-8"
        disabled={isLoading}
        data-testid="finish-setup"
      >
        {isLoading ? 'Finalizando...' : 'Ir para o OmniBridge'}
        <ExternalLink className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}