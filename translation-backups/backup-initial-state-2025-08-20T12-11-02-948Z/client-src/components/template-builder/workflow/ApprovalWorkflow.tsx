
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, MessageSquare, User, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ApprovalRequest {
  id: string;
  versionId: string;
  templateId: string;
  templateName: string;
  version: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
  changeDescription: string;
}

interface ApprovalWorkflowProps {
  templateId?: string;
  onApprovalComplete?: () => void;
}

export function ApprovalWorkflow({ templateId, onApprovalComplete }: ApprovalWorkflowProps) {
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const queryClient = useQueryClient();

  // Buscar aprovações pendentes
  const { data: pendingApprovals } = useQuery({
    queryKey: ['/api/template-versions/pending-approvals'],
    queryFn: () => apiRequest('GET', '/api/template-versions/pending-approvals')
  });

  // Buscar histórico de aprovações para template específico
  const { data: approvalHistory } = useQuery({
    queryKey: ['/api/template-versions/approvals', templateId],
    queryFn: () => apiRequest('GET', `/api/template-versions/approvals/${templateId}`),
    enabled: !!templateId
  });

  const approveVersionMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/template-versions/approve', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/template-versions/pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/template-versions/approvals'] });
      setSelectedRequest(null);
      setApprovalNotes('');
      onApprovalComplete?.();
    }
  });

  const handleApproval = async () => {
    if (!selectedRequest) return;

    await approveVersionMutation.mutateAsync({
      versionId: selectedRequest.versionId,
      approved: approvalAction === 'approve',
      approvalNotes: approvalNotes.trim() || undefined
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'pending' ? 'Pendente' : status === 'approved' ? 'Aprovado' : 'Rejeitado'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Workflow de Aprovação</h3>
        </div>
        <Badge variant="outline">
          {pendingApprovals?.data?.length || 0} pendentes
        </Badge>
      </div>

      {/* Aprovações Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aprovações Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingApprovals?.data?.length > 0 ? (
            <div className="space-y-4">
              {pendingApprovals.data.map((request: ApprovalRequest) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(request.status)}
                    <div>
                      <p className="font-medium">{request.templateName}</p>
                      <p className="text-sm text-gray-500">
                        Versão {request.version} • {request.changeDescription}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Solicitado por {request.requestedBy}
                        </span>
                        <Calendar className="w-3 h-3 text-gray-400 ml-2" />
                        <span className="text-xs text-gray-500">
                          {format(new Date(request.requestedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    {request.status === 'pending' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedRequest(request)}
                          >
                            Revisar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Aprovar Template</DialogTitle>
                          </DialogHeader>
                          <ApprovalDialog
                            request={request}
                            approvalNotes={approvalNotes}
                            setApprovalNotes={setApprovalNotes}
                            approvalAction={approvalAction}
                            setApprovalAction={setApprovalAction}
                            onApprove={handleApproval}
                            isLoading={approveVersionMutation.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma aprovação pendente</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Aprovações */}
      {templateId && approvalHistory?.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Aprovações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvalHistory.data.map((item: any) => (
                <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(item.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Versão {item.version}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.changeDescription}</p>
                    {item.approvalNotes && (
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        <MessageSquare className="w-3 h-3 inline mr-1" />
                        {item.approvalNotes}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Por: {item.approvedBy || item.requestedBy}</span>
                      <span>
                        {format(new Date(item.approvedAt || item.requestedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ApprovalDialogProps {
  request: ApprovalRequest;
  approvalNotes: string;
  setApprovalNotes: (notes: string) => void;
  approvalAction: 'approve' | 'reject';
  setApprovalAction: (action: 'approve' | 'reject') => void;
  onApprove: () => void;
  isLoading: boolean;
}

function ApprovalDialog({
  request,
  approvalNotes,
  setApprovalNotes,
  approvalAction,
  setApprovalAction,
  onApprove,
  isLoading
}: ApprovalDialogProps) {
  return (
    <div className="space-y-6">
      {/* Informações da Solicitação */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Template</Label>
          <p className="text-sm text-gray-600">{request.templateName}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Versão</Label>
            <p className="text-sm text-gray-600">{request.version}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Solicitado por</Label>
            <p className="text-sm text-gray-600">{request.requestedBy}</p>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Descrição das Mudanças</Label>
          <p className="text-sm text-gray-600">{request.changeDescription}</p>
        </div>
      </div>

      <Separator />

      {/* Ação de Aprovação */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="approval-action">Decisão</Label>
          <Select value={approvalAction} onValueChange={(value: 'approve' | 'reject') => setApprovalAction(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approve">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Aprovar
                </div>
              </SelectItem>
              <SelectItem value="reject">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Rejeitar
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="approval-notes">
            Comentários {approvalAction === 'reject' ? '(obrigatório)' : '(opcional)'}
          </Label>
          <Textarea
            id="approval-notes"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder={
              approvalAction === 'approve' 
                ? 'Adicione comentários sobre a aprovação...'
                : 'Explique o motivo da rejeição...'
            }
            rows={3}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          onClick={onApprove}
          disabled={isLoading || (approvalAction === 'reject' && !approvalNotes.trim())}
          variant={approvalAction === 'approve' ? 'default' : 'destructive'}
        >
          {isLoading ? 'Processando...' : (
            approvalAction === 'approve' ? 'Aprovar' : 'Rejeitar'
          )}
        </Button>
      </div>
    </div>
  );
}
