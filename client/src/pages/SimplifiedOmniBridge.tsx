import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Bot,
  Zap,
  Settings,
  Star,
  Plus,
  Eye,
  TrendingUp,
  Users,
  Calendar,
  Bell,
  Archive,
  Target,
  Lightbulb,
  Brain,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Download,
  Play,
  BarChart3,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Search,
  Globe
} from 'lucide-react';

// Import new simplified components
import SimplifiedInbox from '@/components/omnibridge/SimplifiedInbox';
import AutomationRuleBuilder from '@/components/omnibridge/AutomationRuleBuilder';
import SimplifiedChatbotBuilder from '@/components/omnibridge/SimplifiedChatbotBuilder';
import SetupWizard from '@/components/omnibridge/SetupWizard';
import TemplateGallery from '@/components/omnibridge/TemplateGallery';
import LivePreview from '@/components/omnibridge/LivePreview';

export default function SimplifiedOmniBridge() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('inbox');
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [showChatbotBuilder, setShowChatbotBuilder] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [previewConfig, setPreviewConfig] = useState<any>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // Fetch user setup status
  const { data: setupStatus } = useQuery({
    queryKey: ['/api/omnibridge/setup-status'],
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/omnibridge/dashboard-stats'],
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  // Check if user needs setup wizard
  useEffect(() => {
    // Show setup wizard if it's first time or setup is incomplete
    if (setupStatus && !setupStatus.setupComplete) {
      setIsFirstTimeUser(true);
      setShowSetupWizard(true);
    }
  }, [setupStatus]);

  const handleCreateRule = (messageData?: any) => {
    setShowRuleBuilder(true);
  };

  const handleCreateChatbot = () => {
    setShowChatbotBuilder(true);
  };

  const handlePreviewRule = (ruleConfig: any) => {
    setPreviewConfig({ automationRule: ruleConfig });
    setShowLivePreview(true);
  };

  const handlePreviewChatbot = (chatbotConfig: any) => {
    setPreviewConfig({ chatbotConfig });
    setShowLivePreview(true);
  };

  const handleTemplateSelect = (template: any) => {
    toast({ 
      title: 'Template Selecionado', 
      description: `Template "${template.name}" foi aplicado com sucesso!` 
    });
    setShowTemplateGallery(false);
  };

  const stats = dashboardStats?.data || {
    totalMessages: 0,
    unreadMessages: 0,
    activeRules: 0,
    activeChatbots: 0,
    responseTime: '0 min',
    automationRate: 0
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="simplified-omnibridge">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  OmniBridge
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Central de Comunicação Unificada
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateGallery(true)}
                data-testid="open-templates"
              >
                <Download className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSetupWizard(true)}
                data-testid="open-setup"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuração
              </Button>
              <Button
                size="sm"
                onClick={handleCreateRule}
                data-testid="create-rule"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalMessages}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total de mensagens
                  </p>
                </div>
              </div>
              {stats.unreadMessages > 0 && (
                <Badge variant="destructive" className="mt-2">
                  {stats.unreadMessages} não lidas
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.activeRules}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Regras ativas
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(stats.automationRate, 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{stats.automationRate}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Bot className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.activeChatbots}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Chatbots ativos
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Funcionando
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.responseTime}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tempo de resposta
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                Otimizado
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none lg:flex">
                <TabsTrigger value="inbox" className="flex items-center gap-2" data-testid="tab-inbox">
                  <MessageSquare className="h-4 w-4" />
                  Inbox
                </TabsTrigger>
                <TabsTrigger value="automation" className="flex items-center gap-2" data-testid="tab-automation">
                  <Zap className="h-4 w-4" />
                  Automação
                </TabsTrigger>
                <TabsTrigger value="chatbots" className="flex items-center gap-2" data-testid="tab-chatbots">
                  <Bot className="h-4 w-4" />
                  Chatbots
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2" data-testid="tab-analytics">
                  <BarChart3 className="h-4 w-4" />
                  Relatórios
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="inbox" className="p-0">
              <SimplifiedInbox
                onCreateRule={handleCreateRule}
                onCreateChatbot={handleCreateChatbot}
              />
            </TabsContent>

            <TabsContent value="automation" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Regras de Automação
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure regras para automatizar respostas e ações
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowTemplateGallery(true)}
                      data-testid="automation-templates"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Templates
                    </Button>
                    <Button onClick={handleCreateRule} data-testid="create-automation">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Regra
                    </Button>
                  </div>
                </div>

                {/* Quick Start Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-all border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400">
                    <CardContent className="p-4 text-center">
                      <Clock className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Resposta Fora do Horário
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Responda automaticamente fora do horário comercial
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-all border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-purple-400">
                    <CardContent className="p-4 text-center">
                      <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-500" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Escalação Urgente
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Detecte e escale situações urgentes automaticamente
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-all border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-green-400">
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 mx-auto mb-3 text-green-500" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Boas-vindas Novos Clientes
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Dê boas-vindas automáticas para novos contatos
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chatbots" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Assistentes Virtuais
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Crie e gerencie chatbots para atendimento automático
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowTemplateGallery(true)}
                      data-testid="chatbot-templates"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Templates
                    </Button>
                    <Button onClick={handleCreateChatbot} data-testid="create-chatbot">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Chatbot
                    </Button>
                  </div>
                </div>

                {/* Chatbot Quick Start */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-all border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400">
                    <CardContent className="p-4 text-center">
                      <HelpCircle className="h-8 w-8 mx-auto mb-3 text-purple-500" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        FAQ Básico
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Responde perguntas frequentes automaticamente
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-all border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-400">
                    <CardContent className="p-4 text-center">
                      <Target className="h-8 w-8 mx-auto mb-3 text-indigo-500" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Qualificação de Leads
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Coleta informações e qualifica prospects
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-all border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-teal-400">
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-3 text-teal-500" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Agendamento
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Permite agendar consultas e serviços
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Relatórios e Métricas
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Acompanhe o desempenho da sua central de comunicação
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Atividade Recente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">Mensagens hoje</span>
                          </div>
                          <Badge variant="outline">{stats.totalMessages}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-purple-600" />
                            <span className="text-sm">Automações executadas</span>
                          </div>
                          <Badge variant="outline">{Math.round(stats.totalMessages * stats.automationRate / 100)}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Taxa de resolução</span>
                          </div>
                          <Badge variant="outline">85%</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Desempenho
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Automação</span>
                            <span>{stats.automationRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{ width: `${stats.automationRate}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Satisfação</span>
                            <span>92%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Resposta Rápida</span>
                            <span>78%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      <SetupWizard
        isOpen={showSetupWizard}
        onComplete={() => {
          setShowSetupWizard(false);
          setIsFirstTimeUser(false);
          toast({ title: 'Sucesso', description: 'Configuração inicial concluída!' });
        }}
        onSkip={() => {
          setShowSetupWizard(false);
          setIsFirstTimeUser(false);
        }}
      />

      <AutomationRuleBuilder
        isOpen={showRuleBuilder}
        onClose={() => setShowRuleBuilder(false)}
        onSave={(rule) => {
          setShowRuleBuilder(false);
          toast({ title: 'Sucesso', description: 'Regra de automação criada!' });
        }}
      />

      <SimplifiedChatbotBuilder
        isOpen={showChatbotBuilder}
        onClose={() => setShowChatbotBuilder(false)}
      />

      <TemplateGallery
        isOpen={showTemplateGallery}
        onClose={() => setShowTemplateGallery(false)}
        onTemplateSelect={handleTemplateSelect}
      />

      {showLivePreview && (
        <LivePreview
          {...previewConfig}
          onClose={() => {
            setShowLivePreview(false);
            setPreviewConfig(null);
          }}
        />
      )}

      {/* Getting Started Hint */}
      {isFirstTimeUser && !showSetupWizard && (
        <div className="fixed bottom-4 right-4 max-w-sm">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Começar agora!</h4>
                  <p className="text-sm opacity-90 mb-3">
                    Configure sua central em poucos cliques
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowSetupWizard(true)}
                    data-testid="start-setup-hint"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Iniciar Setup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}