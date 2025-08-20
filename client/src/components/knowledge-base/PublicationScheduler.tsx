// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE FRONTEND - PUBLICATION SCHEDULER
// React component for scheduling article publications
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
// import { useLocalization } from '@/hooks/useLocalization';
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
interface PublicationSchedulerProps {
  articleId: string;
  currentStatus: string;
  onScheduled?: () => void;
}
export function PublicationScheduler({
  // Localization temporarily disabled
 articleId, currentStatus, onScheduled }: PublicationSchedulerProps) {
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [autoPublish, setAutoPublish] = useState(true);
  const [notifyUsers, setNotifyUsers] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const schedulePublicationMutation = useMutation({
    mutationFn: async (scheduleData: {
      articleId: string;
      scheduledFor: string;
      autoPublish: boolean;
      notifyUsers: boolean;
    }) => {
      return await apiRequest("/schedule`, 'POST', scheduleData);
    },
    onSuccess: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Publicação agendada com sucesso"
      });
      setSchedulerOpen(false);
      setScheduledDate('');
      setScheduledTime('');
      onScheduled?.();
      queryClient.invalidateQueries({ 
        queryKey: ['/api/knowledge-base/articles'] 
      });
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || '[TRANSLATION_NEEDED]',
        variant: "destructive"
      });
    }
  });
  const handleSchedule = () => {
    if (!scheduledDate || !scheduledTime) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Data e hora são obrigatórias",
        variant: "destructive"
      });
      return;
    }
    const scheduledFor = new Date("
    
    if (scheduledFor <= new Date()) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "A data deve ser no futuro",
        variant: "destructive"
      });
      return;
    }
    schedulePublicationMutation.mutate({
      articleId,
      scheduledFor: scheduledFor.toISOString(),
      autoPublish,
      notifyUsers
    });
  };
  // Só mostrar se o artigo não estiver publicado
  if (currentStatus === 'published') {
    return null;
  }
  const getMinDateTime = () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return format(tomorrow, 'yyyy-MM-dd');
  };
  const getMinTime = () => {
    const now = new Date();
    if (scheduledDate === format(now, 'yyyy-MM-dd')) {
      return format(new Date(now.getTime() + 60 * 60 * 1000), 'HH:mm');
    }
    return '00:00';
  };
  return (
    <Dialog open={schedulerOpen} onOpenChange={setSchedulerOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-schedule-publication>
          <Calendar className="h-4 w-4 mr-2" />
          Agendar Publicação
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]>
        <DialogHeader>
          <DialogTitle>Agendar Publicação</DialogTitle>
          <DialogDescription>
            Configure quando este artigo deve ser publicado automaticamente
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6>
          {/* Data e Hora */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center>
                <Clock className="h-4 w-4 mr-2" />
                Data e Hora
              </CardTitle>
              <CardDescription>
                Quando o artigo deve ser publicado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4>
              <div className="grid grid-cols-2 gap-4>
                <div>
                  <Label htmlFor="schedule-date">Data</Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={getMinDateTime()}
                    data-testid="input-schedule-date"
                  />
                </div>
                <div>
                  <Label htmlFor="schedule-time">Hora</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={getMinTime()}
                    data-testid="input-schedule-time"
                  />
                </div>
              </div>
              
              {scheduledDate && scheduledTime && (
                <div className="p-2 bg-muted rounded text-sm>
                  <strong>Publicação agendada para:</strong><br />
                  {format(
                    new Date("
                    "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                    { locale: ptBR }
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">"Configurações</CardTitle>
              <CardDescription>
                Opções para a publicação agendada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4>
              <div className="flex items-center justify-between>
                <div className="space-y-0.5>
                  <Label>Publicar automaticamente</Label>
                  <p className="text-sm text-muted-foreground>
                    O artigo será publicado automaticamente na data agendada
                  </p>
                </div>
                <Switch
                  checked={autoPublish}
                  onCheckedChange={setAutoPublish}
                  data-testid="switch-auto-publish"
                />
              </div>
              
              <div className="flex items-center justify-between>
                <div className="space-y-0.5>
                  <Label>Notificar usuários</Label>
                  <p className="text-sm text-muted-foreground>
                    Enviar notificação quando o artigo for publicado
                  </p>
                </div>
                <Switch
                  checked={notifyUsers}
                  onCheckedChange={setNotifyUsers}
                  data-testid="switch-notify-users"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setSchedulerOpen(false)}
            data-testid="button-cancel-schedule"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSchedule}
            disabled={schedulePublicationMutation.isPending || !scheduledDate || !scheduledTime}
            data-testid="button-confirm-schedule"
          >
            <Send className="h-4 w-4 mr-2" />
            {schedulePublicationMutation.isPending ? 'Agendando...' : 'Agendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}