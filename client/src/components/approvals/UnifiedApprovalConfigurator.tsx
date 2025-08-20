/**
 * UnifiedApprovalConfigurator - Interface consolidada para configuração completa de aprovações
 * Combina regras, query builder e pipeline designer em uma única experiência UX
 * Seguindo rigorosamente padrões 1qa.md
 */

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
// import { useLocalization } from '@/hooks/useLocalization';
  Plus, Save, Settings, Users, Filter, Workflow, 
  Play, Trash2, Eye, Clock, AlertTriangle, Check,
  ArrowRight, ArrowDown, Move, X 
} from 'lucide-react';
import { CompanySelector } from './CompanySelector';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ApprovalCondition {
  id: string;
  field: string;
  operator: 'EQ' | 'NEQ' | 'IN' | 'NOT_IN' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'CONTAINS' | 'STARTS_WITH' | 'EXISTS' | 'BETWEEN';
  value: any;
  logicalOperator: 'AND' | 'OR';
}

interface ApprovalStep {
  id: string;
  name: string;
  decisionMode: 'ALL' | 'ANY' | 'QUORUM';
  quorumCount?: number;
  slaHours: number;
  approvers: ApprovalApprover[];
  autoApproval: boolean;
  autoApprovalConditions: ApprovalCondition[];
}

interface ApprovalApprover {
  id: string;
  type: 'user' | 'user_group' | 'customer_contact' | 'supplier' | 'manager_chain';
  entityId: string;
  name: string;
  hierarchyLevel?: number;
}

interface ApprovalRule {
  id?: string;
  name: string;
  description: string;
  moduleType: string;
  entityType: string;
  companyId: string | null;
  queryConditions: ApprovalCondition[];
  approvalSteps: ApprovalStep[];
  slaHours: number;
  businessHoursOnly: boolean;
  escalationSettings: any;
  autoApprovalConditions: ApprovalCondition[];
  isActive: boolean;
  priority: number;
}

const moduleTypes = [
  {
  // Localization temporarily disabled
 value: 'tickets', label: '[TRANSLATION_NEEDED]', fields: ['priority', 'category', 'estimatedCost', 'location', 'customerId', 'assignedTo'] },
  { value: 'materials', label: 'Materiais/Serviços', fields: ['itemValue', 'supplierId', 'category', 'stockImpact', 'urgencyLevel'] },
  { value: 'knowledge_base', label: 'Knowledge Base', fields: ['articleType', 'visibilityLevel', 'contentSensitivity', 'authorId'] },
  { value: 'timecard', label: 'Timecard', fields: ['overtimeHours', 'approvalAmount', 'employeeLevel'] },
  { value: 'contracts', label: 'Contratos', fields: ['contractValue', 'duration', 'contractType', 'supplierId'] }
];

const operators = [
  { value: 'EQ', label: 'Igual a (=)' },
  { value: 'NEQ', label: 'Diferente de (≠)' },
  { value: 'GT', label: 'Maior que (>)' },
  { value: 'GTE', label: 'Maior ou igual (≥)' },
  { value: 'LT', label: 'Menor que (<)' },
  { value: 'LTE', label: 'Menor ou igual (≤)' },
  { value: 'IN', label: 'Contém em lista' },
  { value: 'NOT_IN', label: 'Não contém em lista' },
  { value: 'CONTAINS', label: 'Contém texto' },
  { value: 'STARTS_WITH', label: 'Inicia com' },
  { value: 'EXISTS', label: 'Campo existe' },
  { value: 'BETWEEN', label: 'Entre valores' }
];

const decisionModes = [
  { value: 'ALL', label: '[TRANSLATION_NEEDED]' },
  { value: 'ANY', label: 'Qualquer um pode aprovar' },
  { value: 'QUORUM', label: 'Quórum (X de N aprovadores)' }
];

export function UnifiedApprovalConfigurator() {
  const [currentRule, setCurrentRule] = useState<ApprovalRule>({
    name: '',
    description: '',
    moduleType: 'tickets',
    entityType: 'ticket',
    companyId: null,
    queryConditions: [],
    approvalSteps: [],
    slaHours: 24,
    businessHoursOnly: true,
    escalationSettings: {},
    autoApprovalConditions: [],
    isActive: true,
    priority: 100
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch existing rules
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['/api/approvals/rules'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/approvals/rules', {
        headers: {
          'Authorization': `Bearer ${token",
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Falha ao carregar regras');
      return response.json();
    }
  });

  // Save rule mutation
  const saveRuleMutation = useMutation({
    mutationFn: async (ruleData: ApprovalRule) => {
      console.log('🚀 [SAVE-MUTATION] Enviando dados:', ruleData);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/approvals/rules', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token",
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ruleData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ [SAVE-MUTATION] Erro na API:', errorData);
        throw new Error(errorData.message || 'Erro ao salvar regra');
      }
      
      const result = await response.json();
      console.log('✅ [SAVE-MUTATION] Sucesso:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ [SAVE-SUCCESS] Regra salva com sucesso:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/approvals/rules'] });
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "A regra de aprovação foi criada e está ativa."
      });
      resetRule();
    },
    onError: (error: any) => {
      console.log('❌ [SAVE-ERROR] Erro ao salvar:', error);
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || "Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    }
  });

  const resetRule = useCallback(() => {
    console.log('🔧 [RESET-RULE] Resetando regra para nova configuração');
    const newRule = {
      name: '',
      description: '',
      moduleType: 'tickets',
      entityType: 'ticket',
      companyId: null,
      queryConditions: [],
      approvalSteps: [],
      slaHours: 24,
      businessHoursOnly: true,
      escalationSettings: {},
      autoApprovalConditions: [],
      isActive: true,
      priority: 100
    };
    setCurrentRule(newRule);
    setActiveTab('basic');
    console.log('✅ [RESET-RULE] Regra resetada:', newRule);
  }, []);

  const addCondition = useCallback(() => {
    const newCondition: ApprovalCondition = {
      id: `condition_${Date.now()",
      field: '',
      operator: 'EQ',
      value: '',
      logicalOperator: 'AND'
    };
    setCurrentRule(prev => ({
      ...prev,
      queryConditions: [...prev.queryConditions, newCondition]
    }));
  }, []);

  const updateCondition = useCallback((id: string, updates: Partial<ApprovalCondition>) => {
    setCurrentRule(prev => ({
      ...prev,
      queryConditions: prev.queryConditions.map(cond => 
        cond.id === id ? { ...cond, ...updates } : cond
      )
    }));
  }, []);

  const removeCondition = useCallback((id: string) => {
    setCurrentRule(prev => ({
      ...prev,
      queryConditions: prev.queryConditions.filter(cond => cond.id !== id)
    }));
  }, []);

  const addApprovalStep = useCallback(() => {
    const newStep: ApprovalStep = {
      id: `step_${Date.now()",
      name: `Etapa ${currentRule.approvalSteps.length + 1",
      decisionMode: 'ALL',
      slaHours: 24,
      approvers: [],
      autoApproval: false,
      autoApprovalConditions: []
    };
    setCurrentRule(prev => ({
      ...prev,
      approvalSteps: [...prev.approvalSteps, newStep]
    }));
  }, [currentRule.approvalSteps.length]);

  const updateApprovalStep = useCallback((id: string, updates: Partial<ApprovalStep>) => {
    setCurrentRule(prev => ({
      ...prev,
      approvalSteps: prev.approvalSteps.map(step => 
        step.id === id ? { ...step, ...updates } : step
      )
    }));
  }, []);

  const removeApprovalStep = useCallback((id: string) => {
    setCurrentRule(prev => ({
      ...prev,
      approvalSteps: prev.approvalSteps.filter(step => step.id !== id)
    }));
  }, []);

  const validateRule = useCallback(() => {
    const errors = [];
    if (!currentRule.name.trim()) errors.push('Nome é obrigatório');
    if (!currentRule.moduleType) errors.push('Tipo de módulo é obrigatório');
    if (currentRule.queryConditions.length === 0) errors.push('Pelo menos uma condição é necessária');
    if (currentRule.approvalSteps.length === 0) errors.push('Pelo menos uma etapa de aprovação é necessária');
    
    return errors;
  }, [currentRule]);

  const handleSave = useCallback(() => {
    console.log('💾 [SAVE-RULE] Tentando salvar regra:', currentRule);
    const errors = validateRule();
    if (errors.length > 0) {
      console.log('❌ [SAVE-RULE] Validação falhou:', errors);
      toast({
        title: "Validação falhou",
        description: errors.join(', '),
        variant: "destructive"
      });
      return;
    }
    console.log('✅ [SAVE-RULE] Validação passou, salvando...');
    saveRuleMutation.mutate(currentRule);
  }, [currentRule, validateRule, saveRuleMutation, toast]);

  const selectedModuleType = moduleTypes.find(m => m.value === currentRule.moduleType);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" data-testid="unified-approval-configurator">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Configurador Universal de Aprovações
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure regras, condições e fluxos de aprovação em uma única interface
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            data-testid="button-preview-toggle"
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? '[TRANSLATION_NEEDED]' : 'Preview'}
          </Button>
          <Button
            onClick={() => {
              console.log('🔧 [RESET-RULE] Nova regra solicitada');
              resetRule();
            }}
            variant="outline"
            data-testid="button-reset"
          >
            Nova Regra
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveRuleMutation.isPending}
            data-testid="button-save-rule"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveRuleMutation.isPending ? 'Salvando...' : '[TRANSLATION_NEEDED]'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Existing Rules */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Regras Existentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rulesData?.data?.map((rule: any) => (
                      <div
                        key={`rule-${rule.id"}
                        className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() => setCurrentRule(rule)}
                      >
                        <div className="font-medium truncate">{rule.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {moduleTypes.find(m => m.value === rule.moduleType)?.label}
                          </Badge>
                          <Badge variant={rule.isActive ? "default" : "secondary"} className="text-xs">
                            {rule.isActive ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Configuration Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">
                    <Settings className="h-4 w-4 mr-2" />
                    Básico
                  </TabsTrigger>
                  <TabsTrigger value="conditions">
                    <Filter className="h-4 w-4 mr-2" />
                    Condições
                  </TabsTrigger>
                  <TabsTrigger value="workflow">
                    <Workflow className="h-4 w-4 mr-2" />
                    Fluxo
                  </TabsTrigger>
                  <TabsTrigger value="advanced">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Avançado
                  </TabsTrigger>
                </TabsList>

                {/* Basic Configuration */}
                <TabsContent value="basic" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rule-name">Nome da Regra</Label>
                        <Input
                          id="rule-name"
                          value={currentRule.name}
                          onChange={(e) => setCurrentRule(prev => ({ ...prev, name: e.target.value }))}
                          placeholder='[TRANSLATION_NEEDED]'
                          data-testid="input-rule-name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="rule-description">Descrição</Label>
                        <Textarea
                          id="rule-description"
                          value={currentRule.description}
                          onChange={(e) => setCurrentRule(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descreva o propósito desta regra..."
                          rows={3}
                          data-testid="textarea-rule-description"
                        />
                      </div>

                      <div>
                        <Label htmlFor="module-type">Módulo</Label>
                        <Select
                          value={currentRule.moduleType}
                          onValueChange={(value) => setCurrentRule(prev => ({ ...prev, moduleType: value }))}
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

                      <CompanySelector
                        value={currentRule.companyId}
                        onValueChange={(companyId) => setCurrentRule(prev => ({ ...prev, companyId }))}
                        placeholder="Selecionar empresa (opcional para regra global)"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="priority">Prioridade</Label>
                          <Input
                            id="priority"
                            type="number"
                            value={currentRule.priority}
                            onChange={(e) => setCurrentRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 100 }))}
                            min="1"
                            max="999"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sla-hours">SLA (horas)</Label>
                          <Input
                            id="sla-hours"
                            type="number"
                            value={currentRule.slaHours}
                            onChange={(e) => setCurrentRule(prev => ({ ...prev, slaHours: parseInt(e.target.value) || 24 }))}
                            min="1"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={currentRule.businessHoursOnly}
                          onCheckedChange={(checked) => setCurrentRule(prev => ({ ...prev, businessHoursOnly: checked }))}
                        />
                        <Label>Apenas horário comercial</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={currentRule.isActive}
                          onCheckedChange={(checked) => setCurrentRule(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label>Regra ativa</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Query Conditions */}
                <TabsContent value="conditions" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Query Builder - Condições de Ativação</h3>
                    <Button onClick={addCondition} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Condição
                    </Button>
                  </div>

                  {selectedModuleType && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Campos disponíveis para {selectedModuleType.label}: {selectedModuleType.fields.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    {currentRule.queryConditions.map((condition, index) => (
                      <Card key={condition.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                          {index > 0 && (
                            <Select
                              value={condition.logicalOperator}
                              onValueChange={(value: 'AND' | 'OR') => updateCondition(condition.id, { logicalOperator: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AND">E (AND)</SelectItem>
                                <SelectItem value="OR">OU (OR)</SelectItem>
                              </SelectContent>
                            </Select>
                          )}

                          <div className={index === 0 ? "col-span-1" : ""}>
                            <Label>Campo</Label>
                            <Select
                              value={condition.field}
                              onValueChange={(value) => updateCondition(condition.id, { field: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar campo" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedModuleType?.fields.map(field => (
                                  <SelectItem key={field} value={field}>
                                    {field}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Operador</Label>
                            <Select
                              value={condition.operator}
                              onValueChange={(value: any) => updateCondition(condition.id, { operator: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {operators.map(op => (
                                  <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Valor</Label>
                            <Input
                              value={condition.value}
                              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                              placeholder="Valor da condição"
                            />
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeCondition(condition.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}

                    {currentRule.queryConditions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhuma condição definida. Adicione condições para ativar a regra.
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Workflow Pipeline */}
                <TabsContent value="workflow" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Pipeline Designer - Fluxo de Aprovação</h3>
                    <Button onClick={addApprovalStep} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Etapa
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {currentRule.approvalSteps.map((step, index) => (
                      <Card key={step.id} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <Input
                              value={step.name}
                              onChange={(e) => updateApprovalStep(step.id, { name: e.target.value })}
                              placeholder="Nome da etapa"
                              className="font-medium"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeApprovalStep(step.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Modo de Decisão</Label>
                            <Select
                              value={step.decisionMode}
                              onValueChange={(value: any) => updateApprovalStep(step.id, { decisionMode: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {decisionModes.map(mode => (
                                  <SelectItem key={mode.value} value={mode.value}>
                                    {mode.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {step.decisionMode === 'QUORUM' && (
                            <div>
                              <Label>Quórum (quantos aprovadores)</Label>
                              <Input
                                type="number"
                                value={step.quorumCount || 1}
                                onChange={(e) => updateApprovalStep(step.id, { quorumCount: parseInt(e.target.value) || 1 })}
                                min="1"
                              />
                            </div>
                          )}

                          <div>
                            <Label>SLA da Etapa (horas)</Label>
                            <Input
                              type="number"
                              value={step.slaHours}
                              onChange={(e) => updateApprovalStep(step.id, { slaHours: parseInt(e.target.value) || 24 })}
                              min="1"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Switch
                              checked={step.autoApproval}
                              onCheckedChange={(checked) => updateApprovalStep(step.id, { autoApproval: checked })}
                            />
                            <Label>Auto-aprovação habilitada</Label>
                          </div>

                          {step.autoApproval && (
                            <Alert className="mt-2">
                              <Check className="h-4 w-4" />
                              <AlertDescription>
                                Esta etapa será aprovada automaticamente quando as condições forem atendidas
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        {index < currentRule.approvalSteps.length - 1 && (
                          <div className="flex justify-center mt-4">
                            <ArrowDown className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </Card>
                    ))}

                    {currentRule.approvalSteps.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhuma etapa de aprovação definida. Adicione etapas para criar o fluxo.
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Advanced Settings */}
                <TabsContent value="advanced" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4">
                      <h4 className="font-medium mb-4">Configurações de Escalação</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch />
                          <Label>Escalação automática por timeout</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch />
                          <Label>Lembretes automáticos</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch />
                          <Label>Delegação automática</Label>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-medium mb-4">Notificações</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch defaultChecked />
                          <Label>Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch defaultChecked />
                          <Label>In-app</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch />
                          <Label>WhatsApp</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch />
                          <Label>Slack</Label>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4">
                    <h4 className="font-medium mb-4">Auditoria e Compliance</h4>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Todas as aprovações serão automaticamente registradas no sistema de auditoria global conforme 1qa.md.
                        Incluindo snapshots completos, timestamps e rastreabilidade completa.
                      </AlertDescription>
                    </Alert>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Mode */}
      {isPreviewMode && (
        <Card>
          <CardHeader>
            <CardTitle>Preview da Regra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-lg">{currentRule.name || 'Nome da Regra'}</h4>
                <p className="text-gray-600 dark:text-gray-400">{currentRule.description || 'Descrição não informada'}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Módulo:</span>
                  <div className="mt-1">
                    <Badge>{moduleTypes.find(m => m.value === currentRule.moduleType)?.label}</Badge>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Prioridade:</span>
                  <div className="mt-1">{currentRule.priority}</div>
                </div>
                <div>
                  <span className="font-medium">SLA:</span>
                  <div className="mt-1">{currentRule.slaHours}h</div>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <div className="mt-1">
                    <Badge variant={currentRule.isActive ? "default" : "secondary"}>
                      {currentRule.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h5 className="font-medium mb-2">Condições ({currentRule.queryConditions.length})</h5>
                {currentRule.queryConditions.length > 0 ? (
                  <div className="space-y-1 text-sm font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    {currentRule.queryConditions.map((cond, index) => (
                      <div key={cond.id}>
                        {index > 0 && <span className="text-blue-600 dark:text-blue-400">{cond.logicalOperator} </span>}
                        <span className="text-green-600 dark:text-green-400">{cond.field}</span>
                        <span className="mx-2 text-orange-600 dark:text-orange-400">{cond.operator}</span>
                        <span className="text-purple-600 dark:text-purple-400">"{cond.value}"</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Nenhuma condição definida</div>
                )}
              </div>

              <div>
                <h5 className="font-medium mb-2">Fluxo de Aprovação ({currentRule.approvalSteps.length} etapas)</h5>
                {currentRule.approvalSteps.length > 0 ? (
                  <div className="space-y-2">
                    {currentRule.approvalSteps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">{step.name}</span>
                          <div className="text-gray-500">
                            {decisionModes.find(m => m.value === step.decisionMode)?.label} • SLA: {step.slaHours}h
                            {step.autoApproval && ' • Auto-aprovação'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Nenhuma etapa definida</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}