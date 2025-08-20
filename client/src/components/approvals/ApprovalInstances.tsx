import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
// import { useLocalization } from '@/hooks/useLocalization';
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye,
  ThumbsUp,
  ThumbsDown,
  Forward,
  Filter
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ApprovalInstance {
  id: string;
  ruleId: string;
  entityType: string;
  entityId: string;
  currentStepIndex: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'escalated';
  slaDeadline: string;
  createdAt: string;
  completedAt?: string;
  entityData?: any;
  rule?: {
    name: string;
    moduleType: string;
  };
}

interface PaginatedResponse {
  data: ApprovalInstance[];
  total: number;
  page: number;
  totalPages: number;
}

export function ApprovalInstances() {
  // Localization temporarily disabled

  const [selectedInstance, setSelectedInstance] = useState<ApprovalInstance | null>(null);
  const [decisionDialog, setDecisionDialog] = useState<ApprovalInstance | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'delegated'>('approved');
  const [comments, setComments] = useState('');
  const [delegateTo, setDelegateTo] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    moduleType: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);

  const queryClient = useQueryClient();

  const { data: instancesData, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['/api/approvals/instances', filters, currentPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.moduleType) params.append('moduleType', filters.moduleType);
      if (filters.search) params.append('search', filters.search);
      params.append('page', currentPage.toString());
      params.append('limit', '20');
      
      return apiRequest(`/api/approvals/instances?${params");
    }
  });

  const processDecisionMutation = useMutation({
    mutationFn: ({ instanceId, data }: { instanceId: string, data: any }) => 
      apiRequest(`/api/approvals/instances/${instanceId}/decision`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/approvals/instances'] });
      setDecisionDialog(null);
      setComments('');
      setDelegateTo('');
    }
  });

  const handleProcessDecision = () => {
    if (!decisionDialog) return;

    const data = {
      decision,
      comments,
      delegateTo: decision === 'delegated' ? delegateTo : undefined
    };

    processDecisionMutation.mutate({
      instanceId: decisionDialog.id,
      data
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20';
      case 'escalated': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'expired': return <AlertTriangle className="h-4 w-4" />;
      case 'escalated': return <Forward className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      case 'expired': return 'Expirado';
      case 'escalated': return 'Escalado';
      default: return status;
    }
  };

  const isOverdue = (slaDeadline: string) => {
    return new Date(slaDeadline) < new Date();
  };

  const formatTimeRemaining = (slaDeadline: string) => {
    const now = new Date();
    const deadline = new Date(slaDeadline);
    const diffMs = deadline.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Atrasado';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    return `${diffHours}h`;
  };

  if (isLoading) {
    return (
      <Card data-testid="instances-loading">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="approval-instances">
      {/* Filters */}
      <Card data-testid="instances-filters">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                data-testid="filter-status"
              >
                <SelectTrigger>
                  <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                  <SelectItem value="escalated">Escalado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Módulo</label>
              <Select
                value={filters.moduleType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, moduleType: value }))}
                data-testid="filter-module"
              >
                <SelectTrigger>
                  <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os módulos</SelectItem>
                  <SelectItem value="tickets">Tickets</SelectItem>
                  <SelectItem value="materials">Materiais</SelectItem>
                  <SelectItem value="knowledge_base">Knowledge Base</SelectItem>
                  <SelectItem value="timecard">Timecard</SelectItem>
                  <SelectItem value="contracts">Contratos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="ID da entidade ou regra..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                data-testid="filter-search"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instances Table */}
      <Card data-testid="instances-table-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Instâncias de Aprovação</CardTitle>
            <Badge variant="secondary" data-testid="instances-count">
              {instancesData?.total || 0} instâncias
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table data-testid="instances-table">
            <TableHeader>
              <TableRow>
                <TableHead>Entidade</TableHead>
                <TableHead>Regra</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instancesData?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500" data-testid="no-instances-message">
                    Nenhuma instância de aprovação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                instancesData?.data?.map((instance) => (
                  <TableRow key={instance.id} data-testid={`instance-row-${instance.id">
                    <TableCell data-testid={`instance-entity-${instance.id">
                      <div>
                        <div className="font-medium">{instance.entityType}</div>
                        <div className="text-sm text-gray-500">{instance.entityId}</div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`instance-rule-${instance.id">
                      <div>
                        <div className="font-medium">{instance.rule?.name || 'N/A'}</div>
                        <Badge variant="outline" className="text-xs">
                          {instance.rule?.moduleType || instance.entityType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`instance-status-${instance.id">
                      <Badge className={getStatusColor(instance.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(instance.status)}
                          {getStatusText(instance.status)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`instance-sla-${instance.id">
                      <div className="text-sm "`}>
                        {formatTimeRemaining(instance.slaDeadline)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(instance.slaDeadline).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`instance-created-${instance.id">
                      {new Date(instance.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2" data-testid={`instance-actions-${instance.id">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInstance(instance)}
                          data-testid={`button-view-${instance.id"}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {instance.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDecisionDialog(instance)}
                              className="text-green-600 hover:text-green-700"
                              data-testid={`button-approve-${instance.id"}
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDecisionDialog(instance);
                                setDecision('rejected');
                              }}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-reject-${instance.id"}
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {instancesData && instancesData.totalPages > 1 && (
        <div className="flex justify-center gap-2" data-testid="pagination">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            data-testid="button-prev-page"
          >
            Anterior
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600" data-testid="page-info">
            Página {currentPage} de {instancesData.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(instancesData.totalPages, prev + 1))}
            disabled={currentPage === instancesData.totalPages}
            data-testid="button-next-page"
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Decision Dialog */}
      {decisionDialog && (
        <Dialog open={!!decisionDialog} onOpenChange={() => setDecisionDialog(null)}>
          <DialogContent data-testid="decision-dialog">
            <DialogHeader>
              <DialogTitle>Processar Aprovação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Decisão</label>
                <Select value={decision} onValueChange={(value: any) => setDecision(value)} data-testid="select-decision">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Aprovar</SelectItem>
                    <SelectItem value="rejected">Rejeitar</SelectItem>
                    <SelectItem value="delegated">Delegar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {decision === 'delegated' && (
                <div>
                  <label className="text-sm font-medium">Delegar para</label>
                  <Input
                    placeholder="ID do usuário para delegação"
                    value={delegateTo}
                    onChange={(e) => setDelegateTo(e.target.value)}
                    data-testid="input-delegate-to"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Comentários</label>
                <Textarea
                  placeholder="Adicione comentários sobre sua decisão..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  data-testid="textarea-comments"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setDecisionDialog(null)}
                  data-testid="button-cancel-decision"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleProcessDecision}
                  disabled={processDecisionMutation.isPending || (decision === 'delegated' && !delegateTo)}
                  data-testid="button-confirm-decision"
                >
                  {processDecisionMutation.isPending ? '[TRANSLATION_NEEDED]' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* View Instance Dialog */}
      {selectedInstance && (
        <Dialog open={!!selectedInstance} onOpenChange={() => setSelectedInstance(null)}>
          <DialogContent className="max-w-2xl" data-testid="view-instance-dialog">
            <DialogHeader>
              <DialogTitle>Detalhes da Instância</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="font-mono text-sm" data-testid="view-instance-id">{selectedInstance.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={getStatusColor(selectedInstance.status)} data-testid="view-instance-status">
                    {getStatusText(selectedInstance.status)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Entidade</label>
                  <p data-testid="view-instance-entity">{selectedInstance.entityType}: {selectedInstance.entityId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">SLA</label>
                  <p className={isOverdue(selectedInstance.slaDeadline) ? 'text-red-600 font-medium' : ''} data-testid="view-instance-sla">
                    {formatTimeRemaining(selectedInstance.slaDeadline)}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Regra</label>
                <p data-testid="view-instance-rule">{selectedInstance.rule?.name || 'N/A'}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}