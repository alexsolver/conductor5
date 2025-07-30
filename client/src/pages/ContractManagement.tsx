import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, FileText, Calendar, DollarSign, Users, AlertCircle, Clock } from 'lucide-react';
import { CreateContractDialog } from '@/components/contract-management/CreateContractDialog';

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  contractType: string;
  status: string;
  priority: string;
  totalValue: number;
  currency: string;
  startDate: string;
  endDate: string;
  customerCompanyName?: string;
  managerName?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  totalValue: number;
  expiringThisMonth: number;
  draftContracts: number;
  renewalsNeeded: number;
}

export default function ContractManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Fetch contract statistics
  const { data: stats, isLoading: statsLoading } = useQuery<ContractStats>({
    queryKey: ['/api/contracts/dashboard/stats']
  });

  // Fetch contracts with filters
  const { data: contractsData, isLoading: contractsLoading, error: contractsError, refetch: refetchContracts } = useQuery<any>({
    queryKey: ['/api/contracts/contracts', statusFilter, typeFilter, priorityFilter, searchTerm],
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('401') || error?.message?.includes('autenticação')) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Ensure contracts is always an array
  const contracts = Array.isArray(contractsData) ? contractsData : 
                   contractsData?.contracts ? contractsData.contracts : [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const },
      active: { label: 'Ativo', variant: 'default' as const },
      expired: { label: 'Expirado', variant: 'destructive' as const },
      terminated: { label: 'Rescindido', variant: 'outline' as const },
      renewed: { label: 'Renovado', variant: 'default' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baixa', variant: 'outline' as const },
      medium: { label: 'Média', variant: 'secondary' as const },
      high: { label: 'Alta', variant: 'default' as const },
      critical: { label: 'Crítica', variant: 'destructive' as const },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || { label: priority, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Contratos</h1>
          <p className="text-gray-600">Gerencie contratos, SLAs, serviços e documentos</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Contrato
        </Button>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Contratos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalContracts}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contratos Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeContracts}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vencem Este Mês</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.expiringThisMonth}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Buscar por título, número ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                  <SelectItem value="terminated">Rescindido</SelectItem>
                  <SelectItem value="renewed">Renovado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="service">Serviço</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="support">Suporte</SelectItem>
                  <SelectItem value="consultation">Consultoria</SelectItem>
                  <SelectItem value="license">Licenciamento</SelectItem>
                  <SelectItem value="partnership">Parceria</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setPriorityFilter('all');
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Contratos ({contracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
        {(statsLoading || contractsLoading) ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando contratos...</p>
            </div>
          </div>
        ) : contractsError ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive mb-2">Erro ao carregar contratos</h3>
              <p className="text-muted-foreground mb-4">{contractsError.message}</p>
              <Button onClick={() => refetchContracts()} variant="outline">
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : (
          <>
            {contractsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter || typeFilter || priorityFilter
                    ? 'Nenhum contrato corresponde aos filtros aplicados.'
                    : 'Comece criando seu primeiro contrato.'}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Contrato
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div key={contract.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{contract.title}</h3>
                          {getStatusBadge(contract.status)}
                          {getPriorityBadge(contract.priority)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Número:</span> {contract.contractNumber}
                          </div>
                          <div>
                            <span className="font-medium">Tipo:</span> {contract.contractType}
                          </div>
                          <div>
                            <span className="font-medium">Valor:</span> {formatCurrency(contract.totalValue, contract.currency)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
                          </div>
                        </div>

                        {contract.description && (
                          <p className="text-sm text-gray-600 mt-2 truncate">
                            {contract.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        </CardContent>
      </Card>

      {/* Create Contract Dialog */}
      <CreateContractDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
}