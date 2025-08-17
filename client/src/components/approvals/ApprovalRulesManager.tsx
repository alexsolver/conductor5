import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Play, Pause } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ApprovalRule {
  id: string;
  name: string;
  moduleType: string;
  entityType: string;
  isActive: boolean;
  priority: number;
  queryConditions: any;
  approvalSteps: any[];
  createdAt: string;
  updatedAt: string;
}

export function ApprovalRulesManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ApprovalRule | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    moduleType: 'tickets',
    entityType: 'ticket',
    isActive: true,
    priority: 1,
    queryConditions: {},
    approvalSteps: []
  });

  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery<{ data: ApprovalRule[] }>({
    queryKey: ['/api/approvals/rules']
  });

  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      const response = await apiRequest('POST', '/api/approvals/rules', ruleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/approvals/rules'] });
      setIsCreateDialogOpen(false);
      setNewRule({
        name: '',
        moduleType: 'tickets',
        entityType: 'ticket',
        isActive: true,
        priority: 1,
        queryConditions: {},
        approvalSteps: []
      });
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await apiRequest('PUT', `/api/approvals/rules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/approvals/rules'] });
      setEditingRule(null);
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/approvals/rules/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/approvals/rules'] });
    }
  });

  const toggleRuleStatus = (rule: ApprovalRule) => {
    updateRuleMutation.mutate({
      id: rule.id,
      data: { ...rule, isActive: !rule.isActive }
    });
  };

  const handleCreateRule = () => {
    createRuleMutation.mutate(newRule);
  };

  const handleEditRule = (rule: ApprovalRule) => {
    setEditingRule(rule);
  };

  const handleUpdateRule = () => {
    if (editingRule) {
      updateRuleMutation.mutate({
        id: editingRule.id,
        data: editingRule
      });
    }
  };

  const handleDeleteRule = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta regra?')) {
      deleteRuleMutation.mutate(id);
    }
  };

  const moduleTypes = [
    { value: 'tickets', label: 'Tickets' },
    { value: 'materials', label: 'Materiais/Serviços' },
    { value: 'knowledge_base', label: 'Knowledge Base' },
    { value: 'timecard', label: 'Timecard' },
    { value: 'contracts', label: 'Contratos' }
  ];

  if (isLoading) {
    return (
      <Card data-testid="rules-loading">
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
    <div className="space-y-6" data-testid="approval-rules-manager">
      <Card data-testid="rules-header">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Regras de Aprovação</CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" data-testid="button-create-rule">
                  <Plus className="h-4 w-4" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" data-testid="create-rule-dialog">
                <DialogHeader>
                  <DialogTitle>Criar Nova Regra de Aprovação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome da Regra</label>
                      <Input
                        value={newRule.name}
                        onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Aprovação Alto Valor"
                        data-testid="input-rule-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Módulo</label>
                      <Select
                        value={newRule.moduleType}
                        onValueChange={(value) => setNewRule(prev => ({ ...prev, moduleType: value }))}
                        data-testid="select-module-type"
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {moduleTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Prioridade</label>
                      <Input
                        type="number"
                        value={newRule.priority}
                        onChange={(e) => setNewRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                        min="1"
                        data-testid="input-priority"
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-6">
                      <Switch
                        checked={newRule.isActive}
                        onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, isActive: checked }))}
                        data-testid="switch-active"
                      />
                      <label className="text-sm font-medium">Regra Ativa</label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      data-testid="button-cancel-create"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateRule}
                      disabled={createRuleMutation.isPending || !newRule.name}
                      data-testid="button-confirm-create"
                    >
                      {createRuleMutation.isPending ? 'Criando...' : 'Criar Regra'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Card data-testid="rules-table-card">
        <CardContent className="p-0">
          <Table data-testid="rules-table">
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500" data-testid="no-rules-message">
                    Nenhuma regra de aprovação encontrada. Crie sua primeira regra!
                  </TableCell>
                </TableRow>
              ) : (
                rules?.data?.map((rule) => (
                  <TableRow key={rule.id} data-testid={`rule-row-${rule.id}`}>
                    <TableCell className="font-medium" data-testid={`rule-name-${rule.id}`}>
                      {rule.name}
                    </TableCell>
                    <TableCell data-testid={`rule-module-${rule.id}`}>
                      <Badge variant="secondary">
                        {moduleTypes.find(t => t.value === rule.moduleType)?.label || rule.moduleType}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`rule-status-${rule.id}`}>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`rule-priority-${rule.id}`}>
                      {rule.priority}
                    </TableCell>
                    <TableCell data-testid={`rule-created-${rule.id}`}>
                      {new Date(rule.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2" data-testid={`rule-actions-${rule.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRuleStatus(rule)}
                          data-testid={`button-toggle-${rule.id}`}
                        >
                          {rule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                          data-testid={`button-edit-${rule.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                          data-testid={`button-delete-${rule.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingRule && (
        <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
          <DialogContent className="max-w-2xl" data-testid="edit-rule-dialog">
            <DialogHeader>
              <DialogTitle>Editar Regra de Aprovação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome da Regra</label>
                  <Input
                    value={editingRule.name}
                    onChange={(e) => setEditingRule(prev => prev ? { ...prev, name: e.target.value } : null)}
                    data-testid="edit-input-rule-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <Input
                    type="number"
                    value={editingRule.priority}
                    onChange={(e) => setEditingRule(prev => prev ? { ...prev, priority: parseInt(e.target.value) || 1 } : null)}
                    min="1"
                    data-testid="edit-input-priority"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingRule.isActive}
                  onCheckedChange={(checked) => setEditingRule(prev => prev ? { ...prev, isActive: checked } : null)}
                  data-testid="edit-switch-active"
                />
                <label className="text-sm font-medium">Regra Ativa</label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingRule(null)}
                  data-testid="button-cancel-edit"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdateRule}
                  disabled={updateRuleMutation.isPending}
                  data-testid="button-confirm-edit"
                >
                  {updateRuleMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}