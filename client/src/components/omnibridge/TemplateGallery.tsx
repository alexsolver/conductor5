import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Search,
  Filter,
  Star,
  Download,
  Plus,
  Clock,
  Users,
  Bot,
  Zap,
  Mail,
  Phone,
  MessageSquare,
  Bell,
  FileText,
  Tag,
  Archive,
  Forward,
  Reply,
  Settings,
  Target,
  CheckCircle,
  AlertCircle,
  Calendar,
  Globe,
  Lightbulb,
  Brain,
  Sparkles,
  MousePointer2,
  Eye,
  Copy,
  ExternalLink,
  TrendingUp,
  Shield,
  HelpCircle,
  PlayCircle
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'automation' | 'chatbot' | 'workflow';
  type: 'rule' | 'chatbot' | 'sequence';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popular: boolean;
  tags: string[];
  preview: string;
  config: any;
  estimatedSetupTime: string;
  useCases: string[];
  icon: any;
  color: string;
}

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (template: Template) => void;
}

// Predefined templates
const templates: Template[] = [
  // Automation Templates
  {
    id: 'business-hours-auto-reply',
    name: 'Resposta Fora do Horário',
    description: 'Responde automaticamente quando receber mensagens fora do horário comercial',
    category: 'automation',
    type: 'rule',
    difficulty: 'beginner',
    popular: true,
    tags: ['horário', 'resposta automática', 'básico'],
    preview: 'QUANDO: Mensagem recebida fora do horário → ENTÃO: Enviar resposta automática',
    estimatedSetupTime: '2 min',
    useCases: ['Informar horário de funcionamento', 'Expectativa de resposta', 'Atendimento 24/7'],
    icon: Clock,
    color: 'bg-blue-500',
    config: {
      triggers: [
        {
          type: 'time',
          config: {
            outsideBusinessHours: true
          }
        }
      ],
      actions: [
        {
          type: 'auto_reply',
          config: {
            message: 'Olá! Recebemos sua mensagem fora do nosso horário comercial (seg-sex, 9h-18h). Retornaremos em breve no próximo dia útil. Obrigado!'
          }
        }
      ]
    }
  },
  {
    id: 'urgent-keywords-escalation',
    name: 'Escalação de Urgências',
    description: 'Detecta palavras urgentes e cria tickets de alta prioridade',
    category: 'automation',
    type: 'rule',
    difficulty: 'beginner',
    popular: true,
    tags: ['urgente', 'escalação', 'prioridade'],
    preview: 'QUANDO: Palavras como "urgente", "parou" → ENTÃO: Criar ticket alta prioridade + notificar equipe',
    estimatedSetupTime: '3 min',
    useCases: ['Problemas críticos', 'Emergências', 'SLA prioritário'],
    icon: AlertCircle,
    color: 'bg-red-500',
    config: {
      triggers: [
        {
          type: 'keyword',
          config: {
            keywords: 'urgente,emergência,parou,não funciona,crítico,grave',
            matchType: 'contains'
          }
        }
      ],
      actions: [
        {
          type: 'create_ticket',
          config: {
            priority: 'urgent',
            title: 'Situação Urgente Detectada'
          }
        },
        {
          type: 'send_notification',
          config: {
            recipients: 'equipe-tecnica@empresa.com',
            message: 'Nova situação urgente detectada. Verificar imediatamente.'
          }
        }
      ]
    }
  },
  {
    id: 'new-customer-welcome',
    name: 'Boas-vindas Novos Clientes',
    description: 'Detecta novos clientes e envia sequência de boas-vindas',
    category: 'automation',
    type: 'rule',
    difficulty: 'intermediate',
    popular: true,
    tags: ['boas-vindas', 'novos clientes', 'onboarding'],
    preview: 'QUANDO: Primeiro contato detectado → ENTÃO: Enviar boas-vindas + agendar follow-up',
    estimatedSetupTime: '5 min',
    useCases: ['Onboarding', 'Primeira impressão', 'Relacionamento'],
    icon: Users,
    color: 'bg-green-500',
    config: {
      triggers: [
        {
          type: 'sender',
          config: {
            newContact: true
          }
        }
      ],
      actions: [
        {
          type: 'auto_reply',
          config: {
            message: 'Seja bem-vindo(a)! Ficamos felizes em ter você conosco. Nossa equipe está aqui para ajudar em tudo que precisar.'
          }
        },
        {
          type: 'add_tags',
          config: {
            tags: 'novo-cliente,bem-vindo'
          }
        },
        {
          type: 'create_ticket',
          config: {
            title: 'Follow-up Novo Cliente',
            priority: 'medium'
          }
        }
      ]
    }
  },
  {
    id: 'vip-customer-priority',
    name: 'Atendimento VIP',
    description: 'Prioriza mensagens de clientes VIP com atendimento especial',
    category: 'automation',
    type: 'rule',
    difficulty: 'intermediate',
    popular: false,
    tags: ['vip', 'prioridade', 'atendimento especial'],
    preview: 'QUANDO: Cliente VIP envia mensagem → ENTÃO: Prioridade máxima + notificação imediata',
    estimatedSetupTime: '4 min',
    useCases: ['Clientes premium', 'Contas especiais', 'SLA diferenciado'],
    icon: Star,
    color: 'bg-yellow-500',
    config: {
      triggers: [
        {
          type: 'sender',
          config: {
            vipList: 'cliente1@vip.com,cliente2@vip.com'
          }
        }
      ],
      actions: [
        {
          type: 'mark_priority',
          config: {
            priority: 'urgent'
          }
        },
        {
          type: 'add_tags',
          config: {
            tags: 'vip,prioridade-maxima'
          }
        },
        {
          type: 'send_notification',
          config: {
            recipients: 'gerencia@empresa.com',
            message: 'Cliente VIP necessita atendimento imediato.'
          }
        }
      ]
    }
  },

  // Chatbot Templates
  {
    id: 'basic-support-faq',
    name: 'FAQ de Suporte Básico',
    description: 'Chatbot com perguntas frequentes de suporte técnico',
    category: 'chatbot',
    type: 'chatbot',
    difficulty: 'beginner',
    popular: true,
    tags: ['faq', 'suporte', 'autoatendimento'],
    preview: 'Menu: Suporte → Horários → Contato → FAQ → Transferir humano',
    estimatedSetupTime: '8 min',
    useCases: ['Reduzir tickets', 'Autoatendimento', 'Disponibilidade 24/7'],
    icon: HelpCircle,
    color: 'bg-purple-500',
    config: {
      name: 'Assistente de Suporte',
      greeting: 'Olá! Sou seu assistente virtual. Como posso ajudar?',
      steps: [
        {
          id: 'main_menu',
          type: 'options',
          title: 'Menu Principal',
          content: 'Escolha uma opção:',
          options: [
            { text: 'Problemas técnicos', nextStep: 'tech_support' },
            { text: 'Horário de funcionamento', nextStep: 'business_hours' },
            { text: 'Como entrar em contato', nextStep: 'contact_info' },
            { text: 'Falar com atendente', nextStep: 'transfer_human' }
          ]
        },
        {
          id: 'tech_support',
          type: 'options',
          title: 'Suporte Técnico',
          content: 'Qual tipo de problema você está enfrentando?',
          options: [
            { text: 'Não consigo fazer login', nextStep: 'login_help' },
            { text: 'Site está lento', nextStep: 'performance_help' },
            { text: 'Erro no sistema', nextStep: 'error_help' },
            { text: 'Outro problema', nextStep: 'transfer_human' }
          ]
        }
      ]
    }
  },
  {
    id: 'lead-qualification-bot',
    name: 'Qualificação de Leads',
    description: 'Coleta informações de prospects e qualifica leads',
    category: 'chatbot',
    type: 'chatbot',
    difficulty: 'intermediate',
    popular: true,
    tags: ['leads', 'vendas', 'qualificação'],
    preview: 'Coleta: Nome → Email → Empresa → Interesse → Agenda reunião',
    estimatedSetupTime: '10 min',
    useCases: ['Geração de leads', 'Pré-venda', 'Agendamento'],
    icon: Target,
    color: 'bg-indigo-500',
    config: {
      name: 'Assistente Comercial',
      greeting: 'Olá! Vamos conhecer sua empresa e como podemos ajudar?',
      steps: [
        {
          id: 'ask_name',
          type: 'question',
          title: 'Nome',
          content: 'Qual é o seu nome?',
          nextStep: 'ask_company'
        },
        {
          id: 'ask_company',
          type: 'question',
          title: 'Empresa',
          content: 'Qual é o nome da sua empresa?',
          nextStep: 'ask_role'
        },
        {
          id: 'ask_role',
          type: 'question',
          title: 'Cargo',
          content: 'Qual é o seu cargo na empresa?',
          nextStep: 'ask_interest'
        }
      ]
    }
  },
  {
    id: 'appointment-booking-bot',
    name: 'Agendamento de Consultas',
    description: 'Permite agendar consultas e serviços automaticamente',
    category: 'chatbot',
    type: 'chatbot',
    difficulty: 'advanced',
    popular: false,
    tags: ['agendamento', 'consultas', 'calendário'],
    preview: 'Escolhe serviço → Data disponível → Horário → Confirma dados → Agenda',
    estimatedSetupTime: '15 min',
    useCases: ['Clínicas', 'Consultórios', 'Prestadores de serviço'],
    icon: Calendar,
    color: 'bg-teal-500',
    config: {
      name: 'Assistente de Agendamento',
      greeting: 'Olá! Vou ajudar você a agendar sua consulta. Vamos começar?',
      steps: [
        {
          id: 'service_type',
          type: 'options',
          title: 'Tipo de Serviço',
          content: 'Qual serviço você deseja agendar?',
          options: [
            { text: 'Consulta médica', nextStep: 'select_doctor' },
            { text: 'Exame', nextStep: 'select_exam' },
            { text: 'Retorno', nextStep: 'select_return' }
          ]
        }
      ]
    }
  },

  // Workflow Templates
  {
    id: 'complaint-resolution-workflow',
    name: 'Fluxo de Resolução de Reclamações',
    description: 'Processo completo para tratar reclamações de clientes',
    category: 'workflow',
    type: 'sequence',
    difficulty: 'advanced',
    popular: false,
    tags: ['reclamações', 'satisfação', 'processo'],
    preview: 'Detecta reclamação → Reconhece → Investiga → Resolve → Follow-up',
    estimatedSetupTime: '20 min',
    useCases: ['Satisfação do cliente', 'Gestão de crises', 'Qualidade'],
    icon: Shield,
    color: 'bg-orange-500',
    config: {
      steps: [
        { action: 'detect_complaint_keywords' },
        { action: 'acknowledge_immediately' },
        { action: 'create_priority_ticket' },
        { action: 'assign_specialist' },
        { action: 'schedule_followup' }
      ]
    }
  },
  {
    id: 'sales-follow-up-sequence',
    name: 'Sequência de Follow-up Vendas',
    description: 'Acompanha leads através do funil de vendas',
    category: 'workflow',
    type: 'sequence',
    difficulty: 'advanced',
    popular: true,
    tags: ['vendas', 'follow-up', 'funil'],
    preview: 'Lead → Qualifica → Nutre → Proposta → Fechamento → Pós-venda',
    estimatedSetupTime: '25 min',
    useCases: ['Conversão de leads', 'Aumento de vendas', 'Relacionamento'],
    icon: TrendingUp,
    color: 'bg-emerald-500',
    config: {
      steps: [
        { action: 'qualify_lead' },
        { action: 'send_materials' },
        { action: 'schedule_demo' },
        { action: 'send_proposal' },
        { action: 'follow_decision' }
      ]
    }
  }
];

export default function TemplateGallery({ isOpen, onClose, onTemplateSelect }: TemplateGalleryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Install template mutation
  const installTemplateMutation = useMutation({
    mutationFn: (template: Template) =>
      apiRequest('POST', '/api/omnibridge/templates/install', { 
        templateId: template.id, 
        config: template.config 
      }),
    onSuccess: (_, template) => {
      toast({ 
        title: 'Sucesso', 
        description: `Template "${template.name}" instalado com sucesso!` 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/automation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/chatbots'] });
      onTemplateSelect(template);
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao instalar template', variant: 'destructive' });
    }
  });

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
    const matchesPopular = !showPopularOnly || template.popular;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesPopular;
  });

  const handleInstallTemplate = (template: Template) => {
    installTemplateMutation.mutate(template);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'automation': return Zap;
      case 'chatbot': return Bot;
      case 'workflow': return Settings;
      default: return FileText;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0" data-testid="template-gallery">
        <DialogHeader className="sr-only">
          <DialogTitle>Galeria de Templates</DialogTitle>
          <DialogDescription>Escolha templates prontos para acelerar sua configuração</DialogDescription>
        </DialogHeader>
        <div className="flex h-full">
          {/* Sidebar - Filters */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Galeria de Templates
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Escolha templates prontos para acelerar sua configuração
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-templates"
                />
              </div>

              {/* Filters */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Categoria
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="filter-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="automation">Automação</SelectItem>
                      <SelectItem value="chatbot">Chatbot</SelectItem>
                      <SelectItem value="workflow">Fluxo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Dificuldade
                  </label>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger data-testid="filter-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="popular-only"
                    checked={showPopularOnly}
                    onChange={(e) => setShowPopularOnly(e.target.checked)}
                    className="rounded border-gray-300"
                    data-testid="filter-popular"
                  />
                  <label htmlFor="popular-only" className="text-sm text-gray-700 dark:text-gray-300">
                    Apenas populares
                  </label>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Estatísticas
                </h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Total de templates:</span>
                    <span>{templates.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Filtrados:</span>
                    <span>{filteredTemplates.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Populares:</span>
                    <span>{templates.filter(t => t.popular).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Templates Disponíveis
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredTemplates.length} templates encontrados
                  </p>
                </div>
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="flex-1 p-6 overflow-y-auto">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Nenhum template encontrado
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Tente ajustar os filtros ou termo de busca
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template) => {
                    const CategoryIcon = getCategoryIcon(template.category);
                    
                    return (
                      <Card
                        key={template.id}
                        className="hover:shadow-lg transition-all duration-200 cursor-pointer"
                        data-testid={`template-${template.id}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className={`p-2 rounded-lg ${template.color} text-white`}>
                              <template.icon className="h-5 w-5" />
                            </div>
                            <div className="flex items-center gap-2">
                              {template.popular && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                  <Star className="h-3 w-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                              <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
                                {template.difficulty === 'beginner' ? 'Iniciante' :
                                 template.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div>
                            <CardTitle className="text-lg leading-tight">
                              {template.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {template.description}
                            </CardDescription>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Preview */}
                          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                              COMO FUNCIONA:
                            </p>
                            <p className="text-xs text-gray-700 dark:text-gray-300">
                              {template.preview}
                            </p>
                          </div>

                          {/* Meta Info */}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{template.estimatedSetupTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CategoryIcon className="h-3 w-3" />
                              <span className="capitalize">{template.category}</span>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.tags.length - 3}
                              </Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewTemplate(template)}
                              className="flex-1"
                              data-testid={`preview-${template.id}`}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver Detalhes
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleInstallTemplate(template)}
                              disabled={installTemplateMutation.isPending}
                              className="flex-1"
                              data-testid={`install-${template.id}`}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              {installTemplateMutation.isPending ? 'Instalando...' : 'Usar Template'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Template Preview Modal */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="template-preview">
            {previewTemplate && (
              <div className="space-y-6">
                <DialogHeader>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${previewTemplate.color} text-white`}>
                      <previewTemplate.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-xl">
                        {previewTemplate.name}
                      </DialogTitle>
                      <DialogDescription className="mt-1">
                        {previewTemplate.description}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {/* Template Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Clock className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {previewTemplate.estimatedSetupTime}
                      </p>
                      <p className="text-xs text-gray-500">Tempo de setup</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Target className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {previewTemplate.difficulty === 'beginner' ? 'Iniciante' :
                         previewTemplate.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                      </p>
                      <p className="text-xs text-gray-500">Dificuldade</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Settings className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {previewTemplate.category}
                      </p>
                      <p className="text-xs text-gray-500">Categoria</p>
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Casos de Uso:
                    </h4>
                    <ul className="space-y-1">
                      {previewTemplate.useCases.map((useCase, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Preview */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Como Funciona:
                    </h4>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {previewTemplate.preview}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Tags:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {previewTemplate.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setPreviewTemplate(null)}
                      className="flex-1"
                    >
                      Fechar
                    </Button>
                    <Button
                      onClick={() => {
                        handleInstallTemplate(previewTemplate);
                        setPreviewTemplate(null);
                      }}
                      disabled={installTemplateMutation.isPending}
                      className="flex-1"
                      data-testid="install-from-preview"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {installTemplateMutation.isPending ? 'Instalando...' : 'Usar Este Template'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}