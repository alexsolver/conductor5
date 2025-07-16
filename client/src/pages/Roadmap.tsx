
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, Star } from "lucide-react";

interface FeatureCategory {
  name: string;
  description: string;
  features: Feature[];
  progress: number;
}

interface Feature {
  name: string;
  status: "completed" | "in-progress" | "planned" | "priority";
  description?: string;
}

const roadmapData: FeatureCategory[] = [
  {
    name: "Atendimento ao Cliente (Customer Support)",
    description: "Core customer support functionality",
    progress: 85,
    features: [
      { name: "Sistema de tickets centralizado", status: "completed" },
      { name: "Gestão de conversas omnichanais", status: "in-progress" },
      { name: "Respostas automáticas e templates", status: "planned" },
      { name: "Escalação automática de tickets", status: "planned" },
      { name: "SLA (Service Level Agreement) management", status: "planned" },
      { name: "Base de conhecimento integrada", status: "planned" },
      { name: "Formulários personalizáveis", status: "planned" },
      { name: "Pesquisas de satisfação", status: "planned" },
      { name: "Relatórios e analytics de atendimento", status: "completed" },
    ]
  },
  {
    name: "Canais de Comunicação",
    description: "Multi-channel communication support",
    progress: 25,
    features: [
      { name: "Email integrado", status: "in-progress" },
      { name: "Chat ao vivo (web widget)", status: "planned" },
      { name: "WhatsApp Business", status: "planned" },
      { name: "Facebook Messenger", status: "planned" },
      { name: "Instagram Direct", status: "planned" },
      { name: "Twitter/X", status: "planned" },
      { name: "Telefone/VoIP", status: "planned" },
      { name: "SMS", status: "planned" },
      { name: "Slack integration", status: "planned" },
      { name: "Microsoft Teams", status: "planned" },
    ]
  },
  {
    name: "Automação e Fluxos de Trabalho",
    description: "Workflow automation and triggers",
    progress: 15,
    features: [
      { name: "Triggers automáticos", status: "planned" },
      { name: "Automações baseadas em tempo", status: "planned" },
      { name: "Macros para respostas rápidas", status: "planned" },
      { name: "Roteamento inteligente de tickets", status: "planned" },
      { name: "Classificação automática", status: "planned" },
      { name: "Priorização dinâmica", status: "planned" },
      { name: "Workflows personalizados", status: "planned" },
    ]
  },
  {
    name: "Gestão de Agentes e Equipes",
    description: "Agent and team management tools",
    progress: 70,
    features: [
      { name: "Perfis de agentes com permissões", status: "completed" },
      { name: "Grupos e organizações", status: "completed" },
      { name: "Distribuição de carga de trabalho", status: "in-progress" },
      { name: "Controle de capacidade", status: "planned" },
      { name: "Horários de trabalho", status: "planned" },
      { name: "Gestão de ausências", status: "planned" },
      { name: "Performance tracking", status: "in-progress" },
    ]
  },
  {
    name: "Inteligência Artificial",
    description: "AI-powered features and automation",
    progress: 5,
    features: [
      { name: "Answer Bot (chatbot com IA)", status: "planned", description: "AI-powered customer support bot" },
      { name: "Sugestões de respostas automáticas", status: "planned" },
      { name: "Classificação inteligente de tickets", status: "planned" },
      { name: "Análise de sentimento", status: "planned" },
      { name: "Tradução automática", status: "planned" },
      { name: "Detecção de intenção do cliente", status: "planned" },
      { name: "Previsão de satisfação", status: "planned" },
    ]
  },
  {
    name: "Analytics e Relatórios",
    description: "Comprehensive reporting and analytics",
    progress: 60,
    features: [
      { name: "Dashboards personalizáveis", status: "completed" },
      { name: "Relatórios de performance", status: "completed" },
      { name: "Métricas de SLA", status: "planned" },
      { name: "Análise de tendências", status: "in-progress" },
      { name: "Relatórios de satisfação", status: "planned" },
      { name: "Insights de produtividade", status: "in-progress" },
      { name: "Forecasting", status: "planned" },
      { name: "Explore (análise avançada de dados)", status: "planned" },
    ]
  },
  {
    name: "Base de Conhecimento",
    description: "Knowledge management system",
    progress: 10,
    features: [
      { name: "Artigos de ajuda", status: "planned" },
      { name: "FAQs organizadas", status: "planned" },
      { name: "Busca inteligente", status: "planned" },
      { name: "Versionamento de conteúdo", status: "planned" },
      { name: "Aprovação de conteúdo", status: "planned" },
      { name: "Analytics de artigos", status: "planned" },
      { name: "Portal do cliente", status: "planned" },
      { name: "Comunidade/fórum", status: "planned" },
    ]
  },
  {
    name: "Integrações",
    description: "Third-party integrations",
    progress: 20,
    features: [
      { name: "Salesforce", status: "planned" },
      { name: "HubSpot", status: "planned" },
      { name: "Shopify", status: "planned" },
      { name: "Jira", status: "planned" },
      { name: "Confluence", status: "planned" },
      { name: "Office 365", status: "planned" },
      { name: "Google Workspace", status: "planned" },
      { name: "Slack", status: "in-progress" },
      { name: "Microsoft Teams", status: "planned" },
      { name: "APIs RESTful", status: "completed" },
      { name: "Webhooks", status: "planned" },
      { name: "Zapier", status: "planned" },
    ]
  },
  {
    name: "Customização",
    description: "Platform customization options",
    progress: 45,
    features: [
      { name: "Campos personalizados", status: "planned" },
      { name: "Layouts customizáveis", status: "in-progress" },
      { name: "Branding personalizado", status: "completed" },
      { name: "Apps do marketplace", status: "planned" },
      { name: "Desenvolvimento de apps próprios", status: "planned" },
      { name: "Triggers e automações personalizadas", status: "planned" },
      { name: "Views personalizadas", status: "in-progress" },
    ]
  },
  {
    name: "Segurança e Compliance",
    description: "Security and compliance features",
    progress: 80,
    features: [
      { name: "Criptografia de dados", status: "completed" },
      { name: "SSO (Single Sign-On)", status: "completed" },
      { name: "SAML integration", status: "completed" },
      { name: "Compliance GDPR", status: "in-progress" },
      { name: "Auditoria de logs", status: "planned" },
      { name: "Controle de acesso baseado em funções", status: "completed" },
      { name: "Backup de dados", status: "completed" },
      { name: "Certificações de segurança", status: "planned" },
    ]
  },
  {
    name: "Mobile e Acessibilidade",
    description: "Mobile and accessibility features",
    progress: 30,
    features: [
      { name: "Apps móveis para agentes", status: "planned" },
      { name: "Portal móvel para clientes", status: "planned" },
      { name: "Interface responsiva", status: "completed" },
      { name: "Acessibilidade WCAG", status: "in-progress" },
      { name: "Suporte offline", status: "planned" },
    ]
  },
  {
    name: "Gestão de Clientes (CRM)",
    description: "Customer relationship management",
    progress: 75,
    features: [
      { name: "Perfis detalhados de clientes", status: "completed" },
      { name: "Histórico completo de interações", status: "completed" },
      { name: "Organizações e usuários finais", status: "completed" },
      { name: "Tags e segmentação", status: "in-progress" },
      { name: "Campos personalizados", status: "planned" },
      { name: "Notas e contexto", status: "in-progress" },
    ]
  },
  {
    name: "Telefonia e Call Center",
    description: "Voice communication features",
    progress: 5,
    features: [
      { name: "Talk (sistema de telefonia integrado)", status: "planned" },
      { name: "Gravação de chamadas", status: "planned" },
      { name: "IVR (Interactive Voice Response)", status: "planned" },
      { name: "Distribuição automática de chamadas", status: "planned" },
      { name: "Filas de atendimento", status: "planned" },
      { name: "Analytics de chamadas", status: "planned" },
      { name: "Click-to-call", status: "planned" },
    ]
  },
  {
    name: "Gestão de Problemas",
    description: "Problem and incident management",
    progress: 15,
    features: [
      { name: "Problem management", status: "planned" },
      { name: "Incident management", status: "in-progress" },
      { name: "Change management", status: "planned" },
      { name: "Asset management", status: "planned" },
      { name: "Service catalog", status: "planned" },
      { name: "ITIL compliance", status: "planned" },
    ]
  },
  {
    name: "Colaboração",
    description: "Team collaboration features",
    progress: 40,
    features: [
      { name: "Notas internas nos tickets", status: "completed" },
      { name: "@mentions", status: "planned" },
      { name: "Compartilhamento de tickets", status: "in-progress" },
      { name: "Colaboração entre equipes", status: "in-progress" },
      { name: "Side conversations", status: "planned" },
      { name: "Approval workflows", status: "planned" },
    ]
  },
  {
    name: "Marketplace e Extensões",
    description: "Extension and marketplace ecosystem",
    progress: 10,
    features: [
      { name: "App marketplace", status: "planned" },
      { name: "Integrações de terceiros", status: "planned" },
      { name: "Widgets personalizados", status: "planned" },
      { name: "Extensions framework", status: "planned" },
      { name: "API developer tools", status: "in-progress" },
    ]
  },
  {
    name: "Planos e Escalabilidade",
    description: "Platform scalability and plans",
    progress: 90,
    features: [
      { name: "Team, Professional, Enterprise, Elite", status: "completed" },
      { name: "Support para múltiplas marcas", status: "completed" },
      { name: "Multi-tenancy", status: "completed" },
    ]
  }
];

function getStatusIcon(status: Feature["status"]) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "in-progress":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "priority":
      return <Star className="h-4 w-4 text-orange-500" />;
    default:
      return <Circle className="h-4 w-4 text-gray-400" />;
  }
}

function getStatusBadge(status: Feature["status"]) {
  const variants = {
    completed: "default",
    "in-progress": "secondary",
    planned: "outline",
    priority: "destructive"
  } as const;

  const labels = {
    completed: "Completo",
    "in-progress": "Em Andamento",
    planned: "Planejado",
    priority: "Prioridade"
  };

  return (
    <Badge variant={variants[status]} className="text-xs">
      {labels[status]}
    </Badge>
  );
}

function getProgressColor(progress: number) {
  if (progress >= 80) return "bg-green-500";
  if (progress >= 50) return "bg-blue-500";
  if (progress >= 20) return "bg-orange-500";
  return "bg-gray-400";
}

export default function Roadmap() {
  const overallProgress = Math.round(
    roadmapData.reduce((sum, category) => sum + category.progress, 0) / roadmapData.length
  );

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Roadmap de Desenvolvimento
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Acompanhe o progresso do desenvolvimento da plataforma Conductor
            </p>
          </div>
          
          {/* Overall Progress */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Progresso Geral</span>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {overallProgress}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={overallProgress} className="h-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {roadmapData.filter(cat => cat.progress >= 80).length} de {roadmapData.length} categorias principais concluídas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roadmapData.map((category, index) => (
            <Card key={index} className="h-fit hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold line-clamp-2">
                    {category.name}
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {category.progress}%
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {category.description}
                </CardDescription>
                <Progress 
                  value={category.progress} 
                  className="h-2"
                />
              </CardHeader>
              <CardContent className="space-y-2">
                {category.features.map((feature, featureIndex) => (
                  <div 
                    key={featureIndex}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getStatusIcon(feature.status)}
                      <span className="text-sm font-medium line-clamp-1" title={feature.name}>
                        {feature.name}
                      </span>
                    </div>
                    {getStatusBadge(feature.status)}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Legenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Completo</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Em Andamento</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Planejado</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Prioridade</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}