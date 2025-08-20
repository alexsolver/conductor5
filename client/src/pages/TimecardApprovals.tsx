
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, XCircle, Clock, User, Calendar, MapPin, MessageSquare, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocalization } from '@/hooks/useLocalization';

interface PendingApproval {
  id: string;
  userId: string;
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  status: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  location?: string;
  notes?: string;
  isManualEntry?: boolean;
}

export default function TimecardApprovals() {
  const { t } = useLocalization();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApprovals, setSelectedApprovals] = useState<string[]>([]);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionComments, setRejectionComments] = useState('');
  const [currentRejectId, setCurrentRejectId] = useState<string | null>(null);

  // Fetch pending approvals
  const { data: pendingData, isLoading, error } = useQuery({
    queryKey: ['/api/timecard/approval/pending'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/approval/pending');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const pendingApprovals: PendingApproval[] = pendingData?.pendingApprovals || [];

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ entryId, comments }: { entryId: string; comments?: string }) => {
      return await apiRequest('POST', `/api/timecard/approval/approve/${entryId}`, { comments });
    },
    onSuccess: () => {
      toast({
        title: "Registro aprovado",
        description: "O registro de ponto foi aprovado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/approval/pending'] });
    },
    onError: (error) => {
      toast({
        title: {t('TimecardApprovals.erro')},
        description: "Falha ao aprovar o registro.",
        variant: "destructive",
      });
      console.error({t('TimecardApprovals.errorApprovingTimecard')}, error);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ entryId, rejectionReason, comments }: { 
      entryId: string; 
      rejectionReason: string; 
      comments?: string;
    }) => {
      return await apiRequest('POST', `/api/timecard/approval/reject/${entryId}`, { 
        rejectionReason, 
        comments 
      });
    },
    onSuccess: () => {
      toast({
        title: "Registro rejeitado",
        description: "O registro de ponto foi rejeitado.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/approval/pending'] });
      setShowRejectDialog(false);
      setRejectionReason('');
      setRejectionComments('');
      setCurrentRejectId(null);
    },
    onError: (error) => {
      toast({
        title: {t('TimecardApprovals.erro')},
        description: "Falha ao rejeitar o registro.",
        variant: "destructive",
      });
      console.error({t('TimecardApprovals.errorRejectingTimecard')}, error);
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async ({ entryIds, comments }: { entryIds: string[]; comments?: string }) => {
      return await apiRequest('POST', '/api/timecard/approval/bulk-approve', { entryIds, comments });
    },
    onSuccess: () => {
      toast({
        title: "Registros aprovados",
        description: `${selectedApprovals.length} registros foram aprovados com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/approval/pending'] });
      setSelectedApprovals([]);
    },
    onError: (error) => {
      toast({
        title: {t('TimecardApprovals.erro')},
        description: "Falha ao aprovar os registros selecionados.",
        variant: "destructive",
      });
      console.error({t('TimecardApprovals.errorBulkApprovingTimecards')}, error);
    },
  });

  const handleApprove = (entryId: string) => {
    approveMutation.mutate({ entryId });
  };

  const handleReject = (entryId: string) => {
    setCurrentRejectId(entryId);
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = () => {
    if (!currentRejectId || !rejectionReason.trim()) {
      toast({
        title: {t('TimecardApprovals.erro')},
        description: "Motivo da rejeição é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    rejectMutation.mutate({
      entryId: currentRejectId,
      rejectionReason: rejectionReason.trim(),
      comments: rejectionComments.trim() || undefined
    });
  };

  const handleBulkApprove = () => {
    if (selectedApprovals.length === 0) {
      toast({
        title: {t('TimecardApprovals.nenhumRegistroSelecionado')},
        description: {t('TimecardApprovals.selecioneAoMenosUmRegistroParaAprovar')},
        variant: "destructive",
      });
      return;
    }

    bulkApproveMutation.mutate({ entryIds: selectedApprovals });
  };

  const toggleSelection = (entryId: string) => {
    setSelectedApprovals(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const selectAll = () => {
    setSelectedApprovals(pendingApprovals.map(approval => approval.id));
  };

  const clearSelection = () => {
    setSelectedApprovals([]);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '--:--';
    try {
      return format(new Date(dateString), 'HH:mm', { locale: ptBR });
    } catch (error) {
      return '--:--';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return '--/--/----';
    }
  };

  const getRecordType = (approval: PendingApproval) => {
    if (approval.checkIn) return 'Entrada';
    if (approval.checkOut) return 'Saída';
    if (approval.breakStart) return 'Início da Pausa';
    if (approval.breakEnd) return 'Fim da Pausa';
    return 'Registro';
  };

  const getRecordTime = (approval: PendingApproval) => {
    return approval.checkIn || approval.checkOut || approval.breakStart || approval.breakEnd || approval.createdAt;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Aprovação de Registros de Ponto</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Aprovação de Registros de Ponto</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar registros</h3>
            <p className="text-muted-foreground text-center">
              Não foi possível carregar os registros pendentes de aprovação.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Aprovação de Registros de Ponto</h1>
        </div>
        <Badge variant="outline" className="text-base px-3 py-1">
          {pendingApprovals.length} pendente{pendingApprovals.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {pendingApprovals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Todos os registros aprovados!</h3>
            <p className="text-muted-foreground text-center">
              Não há registros de ponto pendentes de aprovação no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Ações em lote */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações em Lote</CardTitle>
              <CardDescription>
                Selecione múltiplos registros para aprovar de uma vez
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  onClick={selectAll}
                  disabled={selectedApprovals.length === pendingApprovals.length}
                >
                  Selecionar Todos
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearSelection}
                  disabled={selectedApprovals.length === 0}
                >
                  Limpar Seleção
                </Button>
                <Button 
                  onClick={handleBulkApprove}
                  disabled={selectedApprovals.length === 0 || bulkApproveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar Selecionados ({selectedApprovals.length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de registros pendentes */}
          <div className="space-y-4">
            {pendingApprovals.map((approval) => (
              <Card key={approval.id} className={`transition-all ${
                selectedApprovals.includes(approval.id) ? 'ring-2 ring-primary' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedApprovals.includes(approval.id)}
                        onChange={() => toggleSelection(approval.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {approval.firstName} {approval.lastName}
                            </span>
                          </div>
                          <Badge variant="secondary">{approval.email}</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{getRecordType(approval)}</div>
                              <div className="text-muted-foreground">
                                {formatTime(getRecordTime(approval))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">Data</div>
                              <div className="text-muted-foreground">
                                {formatDate(approval.createdAt)}
                              </div>
                            </div>
                          </div>

                          {approval.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">Localização</div>
                                <div className="text-muted-foreground">Capturada</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {approval.notes && (
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <div className="font-medium text-sm">Observações</div>
                              <div className="text-muted-foreground text-sm">{approval.notes}</div>
                            </div>
                          </div>
                        )}

                        {approval.isManualEntry && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            Entrada Manual
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(approval.id)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(approval.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dialog de rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Registro de Ponto</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição do registro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Motivo da Rejeição *</Label>
              <select 
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Selecione um motivo</option>
                <option value="invalid_time">Horário inválido</option>
                <option value="missing_location">Localização não capturada</option>
                <option value="duplicate_entry">Registro duplicado</option>
                <option value="policy_violation">Violação de política</option>
                <option value="insufficient_data">Dados insuficientes</option>
                <option value="other">Outro motivo</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejectionComments">Comentários (opcional)</Label>
              <Textarea
                id="rejectionComments"
                value={rejectionComments}
                onChange={(e) => setRejectionComments(e.target.value)}
                placeholder="Comentários adicionais sobre a rejeição..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowRejectDialog(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
              >
                {rejectMutation.isPending ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
