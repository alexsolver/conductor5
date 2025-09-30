import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { ArrowLeft, MessageSquare, Bot, User, Check, X, AlertTriangle, Star, ThumbsUp, ThumbsDown, ChevronRight } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ActionExecution {
  id: number;
  actionName: string;
  success: boolean;
  executedAt: string;
  executionTimeMs: number;
  errorMessage?: string;
}

interface FeedbackAnnotation {
  id: number;
  messageId?: number;
  actionExecutionId?: number;
  rating?: string;
  category?: string;
  notes?: string;
  correctiveAction?: string;
  expectedBehavior?: string;
  severity?: string;
  resolved: boolean;
}

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: '',
    category: '',
    notes: '',
    correctiveAction: '',
    expectedBehavior: '',
    severity: 'medium',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['/api/omnibridge/conversation-logs', id],
    queryFn: async () => {
      const response = await fetch(`/api/omnibridge/conversation-logs/${id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch conversation');
      return response.json();
    },
  });

  const addFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      return apiRequest('POST', `/api/omnibridge/conversation-logs/${id}/feedback`, feedbackData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/conversation-logs', id] });
      toast({
        title: t('common.success', 'Sucesso'),
        description: t('omnibridge.feedback.added', 'Feedback adicionado com sucesso'),
      });
      setFeedbackOpen(false);
      setFeedbackForm({
        rating: '',
        category: '',
        notes: '',
        correctiveAction: '',
        expectedBehavior: '',
        severity: 'medium',
      });
    },
  });

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'pt-BR': return ptBR;
      case 'es': return es;
      default: return enUS;
    }
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm:ss', { locale: getDateLocale() });
  };

  const handleAddFeedback = () => {
    const feedbackData = {
      ...feedbackForm,
      messageId: selectedMessageId,
      actionExecutionId: selectedActionId,
    };
    addFeedbackMutation.mutate(feedbackData);
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'excellent': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'good': return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'poor': return <ThumbsDown className="h-4 w-4 text-orange-500" />;
      case 'terrible': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  const { conversation, messages, actions, feedback } = data?.data || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/omnibridge/conversation-logs')} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {t('omnibridge.conversationDetail.title', 'Detalhes da Conversa')}
          </h1>
          <p className="text-muted-foreground">
            {conversation?.agentName} • {format(new Date(conversation?.startedAt), 'PPp', { locale: getDateLocale() })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t('omnibridge.conversationDetail.timeline', 'Timeline da Conversa')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {messages?.map((msg: Message) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedMessageId === msg.id ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedMessageId(msg.id)}
                  data-testid={`message-${msg.id}`}
                >
                  <div className="flex-shrink-0">
                    {msg.role === 'assistant' ? (
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-purple-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">
                        {msg.role === 'assistant' ? t('omnibridge.agent', 'Agente') : t('omnibridge.user', 'Usuário')}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                    {feedback?.find((f: FeedbackAnnotation) => f.messageId === msg.id) && (
                      <Badge variant="secondary" className="mt-2">
                        {t('omnibridge.feedback.hasAnnotation', 'Com anotação')}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {actions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChevronRight className="h-5 w-5" />
                  {t('omnibridge.conversationDetail.actions', 'Ações Executadas')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {actions.map((action: ActionExecution) => (
                  <div
                    key={action.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedActionId === action.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedActionId(action.id)}
                    data-testid={`action-${action.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {action.success ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">{action.actionName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(action.executedAt)} • {action.executionTimeMs}ms
                        </p>
                        {action.errorMessage && (
                          <p className="text-xs text-red-600 mt-1">{action.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    {feedback?.find((f: FeedbackAnnotation) => f.actionExecutionId === action.id) && (
                      <Badge variant="secondary">
                        {t('omnibridge.feedback.hasAnnotation', 'Com anotação')}
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('omnibridge.conversationDetail.info', 'Informações')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">{t('omnibridge.conversationLogs.channel', 'Canal')}</p>
                <p className="font-medium capitalize">{conversation?.channel}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">{t('omnibridge.conversationLogs.messages', 'Mensagens')}</p>
                <p className="font-medium">{conversation?.totalMessages}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">{t('omnibridge.conversationLogs.actions', 'Ações')}</p>
                <p className="font-medium">{conversation?.totalActions}</p>
              </div>
              {conversation?.escalatedToHuman && (
                <>
                  <Separator />
                  <div>
                    <Badge variant="destructive" className="w-full justify-center">
                      {t('omnibridge.conversationLogs.escalated', 'Escalada para Humano')}
                    </Badge>
                    {conversation?.escalationReason && (
                      <p className="text-sm mt-2 text-muted-foreground">{conversation.escalationReason}</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full" 
                variant="default"
                disabled={!selectedMessageId && !selectedActionId}
                data-testid="button-add-feedback"
              >
                {t('omnibridge.feedback.add', 'Adicionar Feedback')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('omnibridge.feedback.title', 'Anotar Feedback')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t('omnibridge.feedback.rating', 'Avaliação')}</Label>
                  <Select value={feedbackForm.rating} onValueChange={(v) => setFeedbackForm({...feedbackForm, rating: v})}>
                    <SelectTrigger data-testid="select-rating">
                      <SelectValue placeholder={t('omnibridge.feedback.selectRating', 'Selecione uma avaliação')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">⭐ {t('omnibridge.feedback.excellent', 'Excelente')}</SelectItem>
                      <SelectItem value="good">👍 {t('omnibridge.feedback.good', 'Bom')}</SelectItem>
                      <SelectItem value="neutral">😐 {t('omnibridge.feedback.neutral', 'Neutro')}</SelectItem>
                      <SelectItem value="poor">👎 {t('omnibridge.feedback.poor', 'Ruim')}</SelectItem>
                      <SelectItem value="terrible">⚠️ {t('omnibridge.feedback.terrible', 'Péssimo')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t('omnibridge.feedback.severity', 'Severidade')}</Label>
                  <Select value={feedbackForm.severity} onValueChange={(v) => setFeedbackForm({...feedbackForm, severity: v})}>
                    <SelectTrigger data-testid="select-severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('omnibridge.feedback.low', 'Baixa')}</SelectItem>
                      <SelectItem value="medium">{t('omnibridge.feedback.medium', 'Média')}</SelectItem>
                      <SelectItem value="high">{t('omnibridge.feedback.high', 'Alta')}</SelectItem>
                      <SelectItem value="critical">{t('omnibridge.feedback.critical', 'Crítica')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t('omnibridge.feedback.notes', 'Observações')}</Label>
                  <Textarea
                    value={feedbackForm.notes}
                    onChange={(e) => setFeedbackForm({...feedbackForm, notes: e.target.value})}
                    placeholder={t('omnibridge.feedback.notesPlaceholder', 'Descreva o que observou...')}
                    data-testid="textarea-notes"
                  />
                </div>

                <div>
                  <Label>{t('omnibridge.feedback.expectedBehavior', 'Comportamento Esperado')}</Label>
                  <Textarea
                    value={feedbackForm.expectedBehavior}
                    onChange={(e) => setFeedbackForm({...feedbackForm, expectedBehavior: e.target.value})}
                    placeholder={t('omnibridge.feedback.expectedPlaceholder', 'O que deveria ter acontecido...')}
                    data-testid="textarea-expected"
                  />
                </div>

                <div>
                  <Label>{t('omnibridge.feedback.correctiveAction', 'Ação Corretiva')}</Label>
                  <Textarea
                    value={feedbackForm.correctiveAction}
                    onChange={(e) => setFeedbackForm({...feedbackForm, correctiveAction: e.target.value})}
                    placeholder={t('omnibridge.feedback.correctivePlaceholder', 'Como o agente deve agir...')}
                    data-testid="textarea-corrective"
                  />
                </div>

                <Button 
                  onClick={handleAddFeedback} 
                  className="w-full"
                  disabled={addFeedbackMutation.isPending}
                  data-testid="button-submit-feedback"
                >
                  {addFeedbackMutation.isPending 
                    ? t('common.saving', 'Salvando...') 
                    : t('common.save', 'Salvar Feedback')
                  }
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {feedback?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('omnibridge.feedback.annotations', 'Anotações')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {feedback.map((f: FeedbackAnnotation) => (
                  <div key={f.id} className="p-3 bg-muted rounded-lg space-y-2" data-testid={`feedback-${f.id}`}>
                    {f.rating && (
                      <div className="flex items-center gap-2">
                        {getRatingIcon(f.rating)}
                        <Badge variant="outline" className="capitalize">{f.rating}</Badge>
                      </div>
                    )}
                    {f.notes && <p className="text-sm">{f.notes}</p>}
                    {f.severity && (
                      <Badge variant={f.severity === 'critical' || f.severity === 'high' ? 'destructive' : 'secondary'}>
                        {f.severity}
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
