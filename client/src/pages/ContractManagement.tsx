/**
 * ContractManagement - Página principal de gestão de contratos
 * Seguindo 1qa.md compliance e Clean Architecture patterns
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, FileText, DollarSign, Calendar, Users, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CreateContractDialog } from '@/components/forms/CreateContractDialog';
import { EditContractDialog } from '@/components/forms/EditContractDialog';
import { ContractViewDialog } from '@/components/forms/ContractViewDialog';

// Tipos de contrato
const contractTypes = [
  { value: 'service', label: 'Serviço' },
  { value: 'supply', label: 'Fornecimento' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'rental', label: 'Locação' },
  { value: 'sla', label: 'SLA' },
];

const contractStatuses = [
  { value: 'draft', label: 'Rascunho', color: 'gray' },
  { value: 'analysis', label: 'Análise', color: 'yellow' },
  { value: 'approved', label: 'Aprovado', color: 'blue' },
  { value: 'active', label: 'Ativo', color: 'green' },
  { value: 'terminated', label: 'Encerrado', color: 'red' },
];

const priorities = [
  { value: 'low', label: 'Baixa', color: 'gray' },
  { value: 'medium', label: 'Média', color: 'blue' },
  { value: 'high', label: 'Alta', color: 'orange' },
  { value: 'critical', label: 'Crítica', color: 'red' },
  { value: 'emergency', label: 'Emergencial', color: 'purple' },
];

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  contractType: string;
  status: string;
  priority: string;
  managerId: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  monthlyValue: number;
  currency: string;
  description?: string;
  createdAt: string;
}

interface ContractFilters {
  search?: string;
  status?: string;
  contractType?: string;
  priority?: string;
}

export default function ContractManagement() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ContractFilters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar métricas do dashboard
  const { data: dashboardMetrics } = useQuery({
    queryKey: ['/api/contracts/dashboard-metrics'],
  });

  // Buscar contratos
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['/api/contracts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });
      const response = await fetch(`/api/contracts?${params.toString()}`);
      return response.json();
    },
  });

  const contracts = contractsData?.contracts || contractsData?.data?.contracts || [];
  const total = contractsData?.total || contractsData?.data?.total || 0;

  // Mutation para deletar contrato
  const deleteContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      const response = await fetch(`/api/contracts/${contractId}`, { method: 'DELETE' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/dashboard-metrics'] });
      toast({
        title: "Sucesso",
        description: "Contrato excluído com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir contrato",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (value: number, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = contractStatuses.find(s => s.value === status);
    return (
      <Badge 
        variant="outline" 
        className={`border-${statusConfig?.color}-500 text-${statusConfig?.color}-700`}
        data-testid={`badge-status-${status}`}
      >
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = priorities.find(p => p.value === priority);
    return (
      <Badge 
        variant="outline" 
        className={`border-${priorityConfig?.color}-500 text-${priorityConfig?.color}-700`}
        data-testid={`badge-priority-${priority}`}
      >
        {priorityConfig?.label || priority}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = contractTypes.find(t => t.value === type);
    return (
      <Badge variant="secondary" data-testid={`badge-type-${type}`}>
        {typeConfig?.label || type}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
              Gestão de Contratos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todo o ciclo de vida dos contratos empresariais
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            data-testid="button-create-contract"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </div>

        {/* Dialog para criar novo contrato */}
        <CreateContractDialog 
          open={isCreateDialogOpen} 
          onOpenChange={setIsCreateDialogOpen}
        >
          <Button 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            data-testid="button-create-contract-trigger"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </CreateContractDialog>

        {/* Métricas do Dashboard */}
        {dashboardMetrics?.data && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
                <FileText className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="metric-active-contracts">
                  {(dashboardMetrics as any)?.data?.totalActive || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
                <FileText className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600" data-testid="metric-draft-contracts">
                  {(dashboardMetrics as any)?.data?.totalDraft || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencendo em 30 dias</CardTitle>
                <Calendar className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="metric-expiring-contracts">
                  {(dashboardMetrics as any)?.data?.totalExpiringSoon || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="metric-monthly-revenue">
                  {formatCurrency((dashboardMetrics as any)?.data?.monthlyRevenue || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600" data-testid="metric-total-revenue">
                  {formatCurrency((dashboardMetrics as any)?.data?.totalRevenue || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar contratos..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                  data-testid="input-search-contracts"
                />
              </div>

              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
              >
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder={t("common.status") || "Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {contractStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.contractType || 'all'} 
                onValueChange={(value) => setFilters({ ...filters, contractType: value === 'all' ? undefined : value })}
              >
                <SelectTrigger data-testid="select-type-filter">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {contractTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.priority || 'all'} 
                onValueChange={(value) => setFilters({ ...filters, priority: value === 'all' ? undefined : value })}
              >
                <SelectTrigger data-testid="select-priority-filter">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Prioridades</SelectItem>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Contratos */}
        <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Contratos ({total})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum contrato encontrado
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((contract: Contract) => (
                  <div 
                    key={contract.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    data-testid={`contract-item-${contract.id}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg" data-testid={`contract-title-${contract.id}`}>
                            {contract.title}
                          </h3>
                          <span className="text-sm text-muted-foreground" data-testid={`contract-number-${contract.id}`}>
                            {contract.contractNumber}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {getStatusBadge(contract.status)}
                          {getTypeBadge(contract.contractType)}
                          {getPriorityBadge(contract.priority)}
                        </div>

                        <p className="text-sm text-muted-foreground mb-2" data-testid={`contract-description-${contract.id}`}>
                          {contract.description || 'Sem descrição'}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span data-testid={`contract-period-${contract.id}`}>
                            {new Date(contract.startDate).toLocaleDateString('pt-BR')} - {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                          </span>
                          <span data-testid={`contract-total-value-${contract.id}`}>
                            Valor Total: {formatCurrency(contract.totalValue, contract.currency)}
                          </span>
                          {contract.monthlyValue > 0 && (
                            <span data-testid={`contract-monthly-value-${contract.id}`}>
                              Mensal: {formatCurrency(contract.monthlyValue, contract.currency)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <ContractViewDialog contractId={contract.id}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            data-testid={`button-view-${contract.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </ContractViewDialog>
                        <EditContractDialog contractId={contract.id}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            data-testid={`button-edit-${contract.id}`}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </EditContractDialog>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteContractMutation.mutate(contract.id)}
                          disabled={deleteContractMutation.isPending}
                          data-testid={`button-delete-${contract.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}