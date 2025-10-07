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
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye,
  ThumbsUp,
  ThumbsDown,
  Forward,
  Filter,
  ArrowRight
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const { data: instancesData, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['/api/approvals/instances', filters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.moduleType) params.append('moduleType', filters.moduleType);
      if (filters.search) params.append('search', filters.search);
      params.append('page', currentPage.toString());
      params.append('limit', '20');
      
      const response = await apiRequest('GET', `/api/approvals/instances?${params}`);
      return response.json();
    }
  });

  const processDecisionMutation = useMutation({
    mutationFn: async ({ instanceId, data }: { instanceId: string, data: any }) => {
      const response = await apiRequest('POST', `/api/approvals/instances/${instanceId}/decision`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/approvals/instances'] });
      setDecisionDialog(null);
      setComments('');
      setDelegateTo('');
      toast({
        title: "Decisão processada",
        description: "A decisão de aprovação foi registrada com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro ao processar decisão",
        description: "Não foi possível processar a decisão. Tente novamente.",
        variant: "destructive"
      });
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

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { 
        gradient: 'from-amber-500 to-orange-500',
        bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
        icon: Clock,
        text: 'Pendente'
      },
      approved: { 
        gradient: 'from-emerald-500 to-green-500',
        bgGradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
        icon: CheckCircle,
        text: 'Aprovado'
      },
      rejected: { 
        gradient: 'from-rose-500 to-red-500',
        bgGradient: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30',
        icon: XCircle,
        text: 'Rejeitado'
      },
      expired: { 
        gradient: 'from-gray-500 to-slate-500',
        bgGradient: 'from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30',
        icon: AlertTriangle,
        text: 'Expirado'
      },
      escalated: { 
        gradient: 'from-purple-500 to-pink-500',
        bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
        icon: Forward,
        text: 'Escalado'
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
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
      <Card className="border-none bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900" data-testid="instances-loading">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="approval-instances">
      {/* Filters */}
      <Card className="border-none bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30" data-testid="instances-filters">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Filter className="h-5 w-5 text-white" />
            </div>
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                data-testid="filter-status"
              >
                <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-950">
                  <SelectValue placeholder="Todos os status" />
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
              <Label className="text-gray-700 dark:text-gray-300">Módulo</Label>
              <Select
                value={filters.moduleType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, moduleType: value }))}
                data-testid="filter-module"
              >
                <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-950">
                  <SelectValue placeholder="Todos os módulos" />
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
              <Label className="text-gray-700 dark:text-gray-300">Pesquisar</Label>
              <Input
                placeholder="Buscar instâncias..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="mt-1.5 bg-white dark:bg-gray-950"
                data-testid="filter-search"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instances Table */}
      <Card className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950" data-testid="instances-table">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-700 dark:text-gray-300">Regra</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Módulo</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">SLA</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Criado em</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instancesData?.data?.map((instance) => {
                const statusConfig = getStatusConfig(instance.status);
                const Icon = statusConfig.icon;
                
                return (
                  <TableRow key={instance.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-900">
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                      {instance.rule?.name || 'Regra não especificada'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {instance.rule?.moduleType || instance.entityType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`bg-gradient-to-r ${statusConfig.gradient} text-white border-none`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {statusConfig.text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isOverdue(instance.slaDeadline) ? (
                          <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-rose-500">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {formatTimeRemaining(instance.slaDeadline)}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeRemaining(instance.slaDeadline)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {new Date(instance.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInstance(instance)}
                          className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {instance.status === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDecisionDialog(instance)}
                                className="hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                  Processar Decisão
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-gray-700 dark:text-gray-300">Decisão</Label>
                                  <Select value={decision} onValueChange={(value: any) => setDecision(value)}>
                                    <SelectTrigger className="mt-1.5">
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
                                    <Label className="text-gray-700 dark:text-gray-300">Delegar para</Label>
                                    <Input
                                      placeholder="ID do aprovador"
                                      value={delegateTo}
                                      onChange={(e) => setDelegateTo(e.target.value)}
                                      className="mt-1.5"
                                    />
                                  </div>
                                )}

                                <div>
                                  <Label className="text-gray-700 dark:text-gray-300">Comentários</Label>
                                  <Textarea
                                    placeholder="Adicione observações sobre esta decisão..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={4}
                                    className="mt-1.5"
                                  />
                                </div>

                                <Button
                                  onClick={handleProcessDecision}
                                  disabled={processDecisionMutation.isPending}
                                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                  {processDecisionMutation.isPending ? 'Processando...' : 'Confirmar Decisão'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {instancesData?.data?.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">Nenhuma instância encontrada</p>
              <p className="text-sm mt-1">Ajuste os filtros ou aguarde novas aprovações</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
