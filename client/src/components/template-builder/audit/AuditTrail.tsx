
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, User, FileText, GitBranch, Eye, Clock, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocalization } from '@/hooks/useLocalization';

interface AuditEntry {
  id: string;
  templateId: string;
  templateName: string;
  action: 'created' | 'updated' | 'deleted' | 'published' | 'approved' | 'rejected' | 'rolled_back';
  userId: string;
  userName: string;
  timestamp: string;
  details: {
    version?: string;
    changes?: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      type: 'added' | 'modified' | 'removed';
    }>;
    metadata?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
}

interface AuditTrailProps {
  templateId?: string;
  showFilters?: boolean;
}

export function AuditTrail({
  const { t } = useLocalization();
 templateId, showFilters = true }: AuditTrailProps) {
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  // Buscar trilha de auditoria
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['/api/template-audit', templateId, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (templateId) params.append('templateId', templateId);
      if (filters.action) params.append('action', filters.action);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
      return apiRequest('GET', `/api/template-audit?${params.toString()}`);
    }
  });

  const getActionIcon = (action: string) => {
    const icons = {
      created: <FileText className="w-4 h-4 text-green-600" />,
      updated: <GitBranch className="w-4 h-4 text-blue-600" />,
      deleted: <FileText className="w-4 h-4 text-red-600" />,
      published: <Eye className="w-4 h-4 text-purple-600" />,
      approved: <Clock className="w-4 h-4 text-green-600" />,
      rejected: <Clock className="w-4 h-4 text-red-600" />,
      rolled_back: <GitBranch className="w-4 h-4 text-orange-600" />
    };
    return icons[action as keyof typeof icons] || <FileText className="w-4 h-4" />;
  };

  const getActionLabel = (action: string) => {
    const labels = {
      created: 'Criado',
      updated: 'Atualizado',
      deleted: 'Excluído',
      published: 'Publicado',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      rolled_back: 'Rollback'
    };
    return labels[action as keyof typeof labels] || action;
  };

  const getActionColor = (action: string) => {
    const colors = {
      created: 'default',
      updated: 'secondary',
      deleted: 'destructive',
      published: 'outline',
      approved: 'default',
      rejected: 'destructive',
      rolled_back: 'secondary'
    };
    return colors[action as keyof typeof colors] || 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Trilha de Auditoria</h3>
        </div>
        <Badge variant="outline">
          {auditData?.data?.length || 0} registros
        </Badge>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="action-filter">Ação</Label>
                <Select 
                  value={filters.action} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('template-builder.todasAsAcoes')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    <SelectItem value="created">Criado</SelectItem>
                    <SelectItem value="updated">Atualizado</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date-from">Data Inicial</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="date-to">Data Final</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline"
                  onClick={() => setFilters({ action: '', userId: '', dateFrom: '', dateTo: '' })}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline de Auditoria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Mudanças</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : auditData?.data?.length > 0 ? (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {auditData.data.map((entry: AuditEntry, index: number) => (
                  <div key={entry.id} className="relative">
                    {/* Linha de conexão */}
                    {index < auditData.data.length - 1 && (
                      <div className="absolute left-4 top-8 w-0.5 h-6 bg-gray-200"></div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                        {getActionIcon(entry.action)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={getActionColor(entry.action) as any}>
                              {getActionLabel(entry.action)}
                            </Badge>
                            {entry.details.version && (
                              <Badge variant="outline">v{entry.details.version}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {entry.userName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{entry.templateName}</p>
                            {entry.details.changes && (
                              <p className="text-xs text-gray-500">
                                {entry.details.changes.length} campo(s) alterado(s)
                              </p>
                            )}
                          </div>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedEntry(entry)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes da Auditoria</DialogTitle>
                              </DialogHeader>
                              <AuditDetailView entry={entry} />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum registro de auditoria encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface AuditDetailViewProps {
  entry: AuditEntry;
}

function AuditDetailView({ entry }: AuditDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Informações Gerais */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Template</Label>
          <p className="text-sm text-gray-600">{entry.templateName}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Ação</Label>
          <Badge variant={getActionColor(entry.action) as any}>
            {getActionLabel(entry.action)}
          </Badge>
        </div>
        <div>
          <Label className="text-sm font-medium">Usuário</Label>
          <p className="text-sm text-gray-600">{entry.userName}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Data/Hora</Label>
          <p className="text-sm text-gray-600">
            {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
          </p>
        </div>
      </div>

      <Separator />

      {/* Detalhes das Mudanças */}
      {entry.details.changes && entry.details.changes.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-3 block">Mudanças Realizadas</Label>
          <ScrollArea className="h-64 border rounded-lg p-4">
            <div className="space-y-3">
              {entry.details.changes.map((change, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {change.field}
                    </Badge>
                    <Badge 
                      variant={
                        change.type === 'added' ? 'default' : 
                        change.type === 'modified' ? 'secondary' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {change.type === 'added' ? 'Adicionado' : 
                       change.type === 'modified' ? 'Modificado' : 'Removido'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {change.oldValue !== undefined && (
                      <div>
                        <span className="text-red-600 font-medium">- Anterior:</span>
                        <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(change.oldValue, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {change.newValue !== undefined && (
                      <div>
                        <span className="text-green-600 font-medium">+ Novo:</span>
                        <pre className="text-xs bg-green-50 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(change.newValue, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Metadados Técnicos */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Metadados Técnicos</Label>
        <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
          {entry.ipAddress && (
            <div className="flex justify-between">
              <span className="font-medium">IP Address:</span>
              <span className="font-mono">{entry.ipAddress}</span>
            </div>
          )}
          {entry.userAgent && (
            <div className="flex justify-between">
              <span className="font-medium">User Agent:</span>
              <span className="font-mono text-xs truncate">{entry.userAgent}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-medium">ID da Auditoria:</span>
            <span className="font-mono">{entry.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Função auxiliar para cores das ações (caso não esteja definida)
function getActionColor(action: string) {
  const colors = {
    created: 'default',
    updated: 'secondary',
    deleted: 'destructive',
    published: 'outline',
    approved: 'default',
    rejected: 'destructive',
    rolled_back: 'secondary'
  };
  return colors[action as keyof typeof colors] || 'secondary';
}

// Função auxiliar para labels das ações (caso não esteja definida)
function getActionLabel(action: string) {
  const labels = {
    created: 'Criado',
    updated: 'Atualizado',
    deleted: 'Excluído',
    published: 'Publicado',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    rolled_back: 'Rollback'
  };
  return labels[action as keyof typeof labels] || action;
}
