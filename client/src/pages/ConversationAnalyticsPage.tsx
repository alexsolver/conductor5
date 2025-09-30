import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  TrendingUp, 
  MessageSquare, 
  Zap, 
  AlertCircle, 
  BarChart3,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

interface AnalyticsData {
  conversations: {
    total: number;
    totalMessages: number;
    totalActions: number;
    escalationRate: number;
    avgMessagesPerConversation: number;
    avgActionsPerConversation: number;
  };
  actions: Array<{
    actionName: string;
    total: number;
    success: number;
    failed: number;
    successRate: number;
    avgExecutionTime: number;
  }>;
  feedback: {
    total: number;
    byRating: {
      excellent: number;
      good: number;
      neutral: number;
      poor: number;
      terrible: number;
    };
    resolved: number;
    unresolved: number;
  };
}

export default function ConversationAnalyticsPage() {
  const { t } = useTranslation();
  const [agentId, setAgentId] = useState<string>('1');

  const { data, isLoading } = useQuery<{ success: boolean; data: AnalyticsData }>({
    queryKey: ['/api/omnibridge/conversation-logs/analytics', agentId],
    queryFn: async () => {
      const response = await fetch(`/api/omnibridge/conversation-logs/analytics/${agentId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  const analytics = data?.data;

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'neutral': return 'bg-gray-500';
      case 'poor': return 'bg-orange-500';
      case 'terrible': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRatingPercentage = (count: number, total: number) => {
    return total > 0 ? (count / total) * 100 : 0;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/omnibridge/conversation-logs">
            <Button variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {t('omnibridge.analytics.title', 'Analytics de Conversas IA')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('omnibridge.analytics.description', 'Métricas de performance e aprendizado dos agentes')}
            </p>
          </div>
        </div>
        <Select value={agentId} onValueChange={setAgentId}>
          <SelectTrigger className="w-48" data-testid="select-agent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Agente Suporte Técnico</SelectItem>
            <SelectItem value="2">Agente Vendas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('omnibridge.analytics.totalConversations', 'Total de Conversas')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="text-total-conversations">{analytics.conversations.total}</p>
                <p className="text-xs opacity-90 mt-1">
                  {analytics.conversations.totalMessages} {t('omnibridge.analytics.messages', 'mensagens')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  {t('omnibridge.analytics.totalActions', 'Total de Ações')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="text-total-actions">{analytics.conversations.totalActions}</p>
                <p className="text-xs opacity-90 mt-1">
                  {analytics.conversations.avgActionsPerConversation.toFixed(1)} {t('omnibridge.analytics.perConversation', 'por conversa')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {t('omnibridge.analytics.escalationRate', 'Taxa de Escalação')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="text-escalation-rate">
                  {analytics.conversations.escalationRate.toFixed(1)}%
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {t('omnibridge.analytics.escalatedToHuman', 'escaladas para humano')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('omnibridge.analytics.avgMessages', 'Média de Mensagens')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="text-avg-messages">
                  {analytics.conversations.avgMessagesPerConversation.toFixed(1)}
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {t('omnibridge.analytics.messagesPerConversation', 'mensagens por conversa')}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t('omnibridge.analytics.actionPerformance', 'Performance das Ações')}
                </CardTitle>
                <CardDescription>
                  {t('omnibridge.analytics.actionDescription', 'Taxa de sucesso e tempo médio de execução')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.actions.map((action) => (
                    <div key={action.actionName} className="space-y-2" data-testid={`action-stats-${action.actionName}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{action.actionName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {action.avgExecutionTime.toFixed(0)}ms
                          </span>
                          <Badge 
                            variant={action.successRate >= 90 ? 'default' : action.successRate >= 70 ? 'secondary' : 'destructive'}
                            className="gap-1"
                          >
                            {action.successRate >= 90 ? <CheckCircle className="h-3 w-3" /> : <Target className="h-3 w-3" />}
                            {action.successRate.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
                        <div 
                          className="bg-green-500" 
                          style={{ width: `${action.successRate}%` }}
                        />
                        <div 
                          className="bg-red-500" 
                          style={{ width: `${100 - action.successRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{action.success} {t('omnibridge.analytics.successful', 'sucesso')}</span>
                        <span>{action.failed} {t('omnibridge.analytics.failed', 'falha')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('omnibridge.analytics.feedbackDistribution', 'Distribuição de Feedback')}
                </CardTitle>
                <CardDescription>
                  {t('omnibridge.analytics.feedbackDescription', 'Avaliações dos usuários sobre o agente')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center pb-4">
                    <p className="text-4xl font-bold" data-testid="text-total-feedback">{analytics.feedback.total}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('omnibridge.analytics.totalFeedbacks', 'avaliações totais')}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(analytics.feedback.byRating).map(([rating, count]) => (
                      <div key={rating} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize">{t(`omnibridge.feedback.${rating}`, rating)}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div 
                            className={`h-full ${getRatingColor(rating)}`}
                            style={{ width: `${getRatingPercentage(count, analytics.feedback.total)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {t('omnibridge.analytics.resolved', 'Resolvidos')}
                      </span>
                      <span className="font-semibold text-green-600">
                        {analytics.feedback.resolved} / {analytics.feedback.total}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-muted-foreground">
                        {t('omnibridge.analytics.unresolved', 'Pendentes')}
                      </span>
                      <span className="font-semibold text-orange-600">
                        {analytics.feedback.unresolved}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('omnibridge.analytics.insights', 'Insights e Recomendações')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.conversations.escalationRate > 20 && (
                  <div className="flex gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-200">
                        {t('omnibridge.analytics.highEscalation', 'Taxa de escalação elevada')}
                      </p>
                      <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                        {t('omnibridge.analytics.highEscalationText', 'Considere revisar o contexto do agente e adicionar mais exemplos de resolução.')}
                      </p>
                    </div>
                  </div>
                )}

                {analytics.actions.some(a => a.successRate < 80) && (
                  <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <Target className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-200">
                        {t('omnibridge.analytics.lowSuccessRate', 'Ações com baixa taxa de sucesso')}
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                        {t('omnibridge.analytics.lowSuccessRateText', 'Algumas ações estão falhando frequentemente. Revise os feedbacks anotados para identificar melhorias.')}
                      </p>
                    </div>
                  </div>
                )}

                {analytics.feedback.unresolved > 5 && (
                  <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-200">
                        {t('omnibridge.analytics.pendingFeedback', 'Feedbacks pendentes de revisão')}
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                        {t('omnibridge.analytics.pendingFeedbackText', 'Existem {count} feedbacks aguardando revisão. Utilize-os para melhorar o agente.', { count: analytics.feedback.unresolved })}
                      </p>
                    </div>
                  </div>
                )}

                {analytics.conversations.avgMessagesPerConversation > 15 && (
                  <div className="flex gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-900 dark:text-purple-200">
                        {t('omnibridge.analytics.longConversations', 'Conversas muito longas')}
                      </p>
                      <p className="text-sm text-purple-800 dark:text-purple-300 mt-1">
                        {t('omnibridge.analytics.longConversationsText', 'A média de mensagens está alta. Considere otimizar respostas para serem mais diretas e objetivas.')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {t('omnibridge.analytics.noData', 'Nenhum dado disponível para este agente')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Badge({ children, variant = 'default', className = '' }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary' | 'destructive'; 
  className?: string 
}) {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
  };
  
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
