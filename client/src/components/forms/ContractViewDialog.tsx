// ✅ 1QA.MD COMPLIANCE: VIEW CONTRACT DIALOG
// Clean Architecture - Frontend View Component for Contract Details

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Calendar, DollarSign, FileText, Users, MapPin, Clock } from 'lucide-react';
import {
// import { useLocalization } from '@/hooks/useLocalization';
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Status and types mapping
const contractStatuses = [
  {
  // Localization temporarily disabled
 value: 'draft', label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  { value: 'analysis', label: 'Análise', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
  { value: 'active', label: 'Ativo', color: 'bg-green-100 text-green-800' },
  { value: 'finished', label: 'Finalizado', color: 'bg-gray-100 text-gray-800' },
  { value: 'canceled', label: '[TRANSLATION_NEEDED]', color: 'bg-red-100 text-red-800' },
];

const contractTypes = [
  { value: 'service', label: 'Serviço' },
  { value: 'supply', label: 'Fornecimento' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'rental', label: 'Locação' },
  { value: 'sla', label: 'SLA' },
];

const priorities = [
  { value: 'low', label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Média', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Crítica', color: 'bg-red-100 text-red-800' },
  { value: 'emergency', label: 'Emergencial', color: 'bg-purple-100 text-purple-800' },
];

interface ContractViewDialogProps {
  contractId: string;
  children?: React.ReactNode;
}

export function ContractViewDialog({ contractId, children }: ContractViewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // ✅ 1QA.MD COMPLIANCE: FETCH CONTRACT DATA
  const { data: contractData, isLoading } = useQuery({
    queryKey: ['/api/contracts', contractId],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${contractId");
      const data = await response.json();
      return data?.contract || data?.data || data;
    },
    enabled: isOpen && !!contractId,
  });

  const formatCurrency = (value: number, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = contractStatuses.find(s => s.value === status);
    return (
      <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = priorities.find(p => p.value === priority);
    return (
      <Badge className={priorityConfig?.color || 'bg-gray-100 text-gray-800'}>
        {priorityConfig?.label || priority}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = contractTypes.find(t => t.value === type);
    return (
      <Badge variant="secondary">
        {typeConfig?.label || type}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild data-testid={`button-view-contract-${contractId">
        {children || (
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" data-testid="dialog-view-contract">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="title-view-contract">
            <FileText className="h-5 w-5" />
            Detalhes do Contrato
          </DialogTitle>
          <DialogDescription>
            Visualização completa das informações do contrato
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Carregando dados do contrato...</div>
          </div>
        ) : contractData ? (
          <div className="space-y-6">
            {/* Header Information */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl" data-testid="contract-title">
                      {contractData.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1" data-testid="contract-number">
                      Número: {contractData.contractNumber}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(contractData.status)}
                    {getPriorityBadge(contractData.priority)}
                    {getTypeBadge(contractData.contractType)}
                  </div>
                </div>
              </CardHeader>
              {contractData.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground" data-testid="contract-description">
                    {contractData.description}
                  </p>
                </CardContent>
              )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Informações Financeiras
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Valor Total</p>
                      <p className="text-lg font-bold text-blue-600" data-testid="contract-total-value">
                        {formatCurrency(contractData.totalValue, contractData.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Valor Mensal</p>
                      <p className="text-lg font-bold text-green-600" data-testid="contract-monthly-value">
                        {formatCurrency(contractData.monthlyValue, contractData.currency)}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Moeda</p>
                      <p data-testid="contract-currency">{contractData.currency}</p>
                    </div>
                    {contractData.paymentTerms && (
                      <div>
                        <p className="text-sm font-medium">Prazo de Pagamento</p>
                        <p data-testid="contract-payment-terms">{contractData.paymentTerms} dias</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Cronograma
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Data de Início</p>
                      <p data-testid="contract-start-date">{formatDate(contractData.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Data de Término</p>
                      <p data-testid="contract-end-date">{formatDate(contractData.endDate)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Renovação Automática:</span>
                      <Badge variant={contractData.autoRenewal ? "default" : "secondary">
                        {contractData.autoRenewal ? "Sim" : "Não"}
                      </Badge>
                    </div>
                    {contractData.autoRenewal && contractData.renewalPeriodMonths && (
                      <p className="text-sm text-muted-foreground ml-6">
                        Período: {contractData.renewalPeriodMonths} meses
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Management Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Gestão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contractData.managerId && (
                    <div>
                      <p className="text-sm font-medium">Gerente Responsável</p>
                      <p data-testid="contract-manager">{contractData.managerId}</p>
                    </div>
                  )}
                  {contractData.technicalManagerId && (
                    <div>
                      <p className="text-sm font-medium">Gerente Técnico</p>
                      <p data-testid="contract-technical-manager">{contractData.technicalManagerId}</p>
                    </div>
                  )}
                  {contractData.customerCompanyId && (
                    <div>
                      <p className="text-sm font-medium">Empresa Cliente</p>
                      <p data-testid="contract-customer">{contractData.customerCompanyId}</p>
                    </div>
                  )}
                  {contractData.locationId && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">Localização</p>
                        <p data-testid="contract-location">{contractData.locationId}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Terms and Conditions */}
              {contractData.termsConditions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Termos e Condições
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap" data-testid="contract-terms">
                        {contractData.termsConditions}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Audit Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações de Auditoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Criado em:</p>
                    <p data-testid="contract-created-at">
                      {contractData.createdAt ? formatDate(contractData.createdAt) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Última atualização:</p>
                    <p data-testid="contract-updated-at">
                      {contractData.updatedAt ? formatDate(contractData.updatedAt) : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Contrato não encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}