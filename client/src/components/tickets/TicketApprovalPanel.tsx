import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, XCircle, Clock, AlertTriangle, User, Users, 
  Calendar, ChevronDown, ChevronUp, FileCheck, MessageSquare,
  AlertCircle, Shield, Timer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface TicketApprovalPanelProps {
  ticketId: string;
}

interface ApprovalInstance {
  id: string;
  ruleId: string;
  ruleName?: string;
  currentStepIndex: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  requestedById: string;
  requestedByName?: string;
  requestReason?: string;
  urgencyLevel: number;
  slaDeadline?: string;
  completedAt?: string;
  completedById?: string;
  completedByName?: string;
  completionReason?: string;
  slaViolated: boolean;
  createdAt: string;
  steps?: {
    stepIndex: number;
    stepName: string;
    status: 'pending' | 'approved' | 'rejected';
    approvers: Array<{
      type: string;
      name: string;
      id?: string;
    }>;
    decisions?: Array<{
      approverId: string;
      approverName: string;
      decision: 'approved' | 'rejected';
      reason?: string;
      decidedAt: string;
    }>;
  }[];
}

export function TicketApprovalPanel({ ticketId }: TicketApprovalPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedInstance, setExpandedInstance] = useState<string | null>(null);
  const [decisionDialog, setDecisionDialog] = useState<{
    open: boolean;
    instanceId: string | null;
    decision: 'approved' | 'rejected' | null;
  }>({ open: false, instanceId: null, decision: null });
  const [decisionReason, setDecisionReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ['/api/approvals/tickets', ticketId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/approvals/tickets/${ticketId}`);
      return response.json();
    },
    refetchInterval: 30000,
  });

  const decisionMutation = useMutation({
    mutationFn: async ({ instanceId, decision, reason }: { 
      instanceId: string; 
      decision: 'approved' | 'rejected'; 
      reason: string;
    }) => {
      const response = await apiRequest('POST', `/api/approvals/instances/${instanceId}/decision`, {
        decision,
        reason,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Decisão registrada",
        description: "Sua decisão de aprovação foi registrada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/approvals/tickets', ticketId] });
      setDecisionDialog({ open: false, instanceId: null, decision: null });
      setDecisionReason("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível registrar sua decisão. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleDecision = () => {
    if (!decisionDialog.instanceId || !decisionDialog.decision) return;
    
    decisionMutation.mutate({
      instanceId: decisionDialog.instanceId,
      decision: decisionDialog.decision,
      reason: decisionReason,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      approved: { variant: 'default', label: 'Aprovado' },
      rejected: { variant: 'destructive', label: 'Rejeitado' },
      pending: { variant: 'secondary', label: 'Pendente' },
      expired: { variant: 'destructive', label: 'Expirado' },
      cancelled: { variant: 'outline', label: 'Cancelado' },
    };
    
    const config = variants[status] || { variant: 'outline', label: status };
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {config.label}
      </Badge>
    );
  };

  const getUrgencyBadge = (level: number) => {
    const configs = [
      { variant: 'outline', label: 'Baixa', color: 'text-green-600' },
      { variant: 'secondary', label: 'Normal', color: 'text-blue-600' },
      { variant: 'default', label: 'Alta', color: 'text-orange-600' },
      { variant: 'destructive', label: 'Crítica', color: 'text-red-600' },
      { variant: 'destructive', label: 'Urgente', color: 'text-red-700' },
    ];
    
    const config = configs[Math.min(level - 1, 4)] || configs[1];
    
    return (
      <Badge variant={config.variant as any} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getSlaProgress = (instance: ApprovalInstance) => {
    if (!instance.slaDeadline) return null;
    
    const deadline = new Date(instance.slaDeadline);
    const created = new Date(instance.createdAt);
    const now = instance.completedAt ? new Date(instance.completedAt) : new Date();
    
    const total = deadline.getTime() - created.getTime();
    const elapsed = now.getTime() - created.getTime();
    const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
    
    const isOverdue = percentage >= 100;
    const isWarning = percentage >= 75;
    
    return {
      percentage,
      isOverdue,
      isWarning,
      timeRemaining: deadline > now ? formatDistanceToNow(deadline, { locale: ptBR }) : 'Expirado',
    };
  };

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-5 h-5 animate-spin" />
            <span>Carregando aprovações...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const instances: ApprovalInstance[] = data?.data?.instances || [];
  const hasApprovals = instances.length > 0;

  if (!hasApprovals) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Status de aprovação</h3>
      </div>

      {instances.map((instance) => {
        const isExpanded = expandedInstance === instance.id;
        const slaInfo = getSlaProgress(instance);
        
        return (
          <Card 
            key={instance.id} 
            className={`transition-all ${
              instance.status === 'pending' 
                ? 'border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20' 
                : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileCheck className="w-4 h-4" />
                      {instance.ruleName || 'Aprovação necessária'}
                    </CardTitle>
                    {getStatusBadge(instance.status)}
                    {getUrgencyBadge(instance.urgencyLevel)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>Solicitado por {instance.requestedByName || 'Usuário'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(instance.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                  </div>

                  {instance.requestReason && (
                    <p className="text-sm text-muted-foreground italic">
                      "{instance.requestReason}"
                    </p>
                  )}

                  {slaInfo && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Timer className="w-3 h-3" />
                          SLA: {slaInfo.timeRemaining}
                        </span>
                        <span className={`font-medium ${
                          slaInfo.isOverdue ? 'text-red-600' : 
                          slaInfo.isWarning ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {Math.round(slaInfo.percentage)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all ${
                            slaInfo.isOverdue ? 'bg-red-600' : 
                            slaInfo.isWarning ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(slaInfo.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedInstance(isExpanded ? null : instance.id)}
                  data-testid={`button-toggle-approval-${instance.id}`}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0 space-y-4">
                {instance.steps && instance.steps.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Etapas de aprovação
                    </h4>
                    
                    {instance.steps.map((step) => (
                      <div 
                        key={step.stepIndex}
                        className={`p-3 rounded-lg border ${
                          step.stepIndex === instance.currentStepIndex
                            ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              step.status === 'approved' ? 'bg-green-500 text-white' :
                              step.status === 'rejected' ? 'bg-red-500 text-white' :
                              step.stepIndex === instance.currentStepIndex ? 'bg-purple-500 text-white' :
                              'bg-gray-300 text-gray-600'
                            }`}>
                              {step.stepIndex + 1}
                            </div>
                            <span className="font-medium text-sm">{step.stepName}</span>
                          </div>
                          {step.status && step.status !== 'pending' && (
                            <Badge variant={step.status === 'approved' ? 'default' : 'destructive'}>
                              {step.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                            </Badge>
                          )}
                        </div>

                        <div className="ml-8 space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Aprovadores: {step.approvers.map(a => a.name).join(', ')}
                          </p>

                          {step.decisions && step.decisions.length > 0 && (
                            <div className="space-y-1">
                              {step.decisions.map((decision, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  {decision.decision === 'approved' ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-600 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium">{decision.approverName}</p>
                                    {decision.reason && <p className="text-muted-foreground italic">"{decision.reason}"</p>}
                                    <p className="text-muted-foreground">
                                      {format(new Date(decision.decidedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {instance.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setDecisionDialog({ 
                        open: true, 
                        instanceId: instance.id, 
                        decision: 'approved' 
                      })}
                      className="flex-1"
                      data-testid={`button-approve-${instance.id}`}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDecisionDialog({ 
                        open: true, 
                        instanceId: instance.id, 
                        decision: 'rejected' 
                      })}
                      className="flex-1"
                      data-testid={`button-reject-${instance.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                )}

                {instance.completedAt && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-medium">
                        {instance.status === 'approved' ? 'Aprovado' : 'Rejeitado'} por {instance.completedByName || 'Usuário'}
                      </span>
                    </div>
                    <p className="text-muted-foreground ml-6">
                      {format(new Date(instance.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {instance.completionReason && (
                      <p className="text-muted-foreground ml-6 italic mt-1">
                        "{instance.completionReason}"
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      <Dialog open={decisionDialog.open} onOpenChange={(open) => {
        if (!open) {
          setDecisionDialog({ open: false, instanceId: null, decision: null });
          setDecisionReason("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {decisionDialog.decision === 'approved' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              {decisionDialog.decision === 'approved' ? 'Aprovar solicitação' : 'Rejeitar solicitação'}
            </DialogTitle>
            <DialogDescription>
              {decisionDialog.decision === 'approved' 
                ? 'Você está prestes a aprovar esta solicitação. Adicione um comentário se desejar.'
                : 'Por favor, informe o motivo da rejeição.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">
                {decisionDialog.decision === 'approved' ? 'Comentário (opcional)' : 'Motivo da rejeição *'}
              </Label>
              <Textarea
                id="reason"
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder={decisionDialog.decision === 'approved' 
                  ? 'Adicione um comentário sobre sua aprovação...'
                  : 'Descreva o motivo da rejeição...'
                }
                rows={4}
                data-testid="input-decision-reason"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDecisionDialog({ open: false, instanceId: null, decision: null });
                setDecisionReason("");
              }}
              data-testid="button-cancel-decision"
            >
              Cancelar
            </Button>
            <Button
              variant={decisionDialog.decision === 'approved' ? 'default' : 'destructive'}
              onClick={handleDecision}
              disabled={decisionDialog.decision === 'rejected' && !decisionReason.trim()}
              data-testid="button-confirm-decision"
            >
              {decisionDialog.decision === 'approved' ? 'Confirmar aprovação' : 'Confirmar rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
