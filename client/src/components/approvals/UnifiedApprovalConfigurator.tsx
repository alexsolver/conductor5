/**
 * UnifiedApprovalConfigurator - Interface consolidada para configuração completa de aprovações
 * Combina regras, query builder e pipeline designer em uma única experiência UX
 * Seguindo rigorosamente padrões 1qa.md
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  Plus, Save, Settings, Users, Filter, Workflow, 
  Play, Trash2, Eye, Clock, AlertTriangle, Check,
  ArrowRight, ArrowDown, Move, X, Sparkles
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

interface FieldDefinition {
  value: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'date';
  options?: { value: string; label: string; }[];
}

const moduleTypes = [
  { 
    value: 'tickets', 
    label: 'Tickets', 
    fields: [
      { value: 'priority', label: 'Prioridade', type: 'select' as const, options: [
        { value: 'low', label: 'Baixa' },
        { value: 'medium', label: 'Média' },
        { value: 'high', label: 'Alta' },
        { value: 'critical', label: 'Crítica' }
      ]},
      { value: 'status', label: 'Status', type: 'select' as const, options: [
        { value: 'open', label: 'Aberto' },
        { value: 'in_progress', label: 'Em Andamento' },
        { value: 'resolved', label: 'Resolvido' },
        { value: 'closed', label: 'Fechado' }
      ]},
      { value: 'category', label: 'Categoria', type: 'text' as const },
      { value: 'estimatedCost', label: 'Custo Estimado', type: 'number' as const },
      { value: 'location', label: 'Localização', type: 'text' as const },
      { value: 'customerId', label: 'ID do Cliente', type: 'text' as const },
      { value: 'assignedTo', label: 'Atribuído a', type: 'text' as const }
    ] 
  },
  { 
    value: 'materials', 
    label: 'Materiais/Serviços', 
    fields: [
      { value: 'itemValue', label: 'Valor do Item', type: 'number' as const },
      { value: 'supplierId', label: 'ID do Fornecedor', type: 'text' as const },
      { value: 'category', label: 'Categoria', type: 'text' as const },
      { value: 'stockImpact', label: 'Impacto no Estoque', type: 'select' as const, options: [
        { value: 'positive', label: 'Positivo' },
        { value: 'negative', label: 'Negativo' },
        { value: 'neutral', label: 'Neutro' }
      ]},
      { value: 'urgencyLevel', label: 'Nível de Urgência', type: 'select' as const, options: [
        { value: 'low', label: 'Baixa' },
        { value: 'medium', label: 'Média' },
        { value: 'high', label: 'Alta' }
      ]}
    ] 
  },
  { 
    value: 'knowledge_base', 
    label: 'Knowledge Base', 
    fields: [
      { value: 'articleType', label: 'Tipo de Artigo', type: 'select' as const, options: [
        { value: 'faq', label: 'FAQ' },
        { value: 'tutorial', label: 'Tutorial' },
        { value: 'guide', label: 'Guia' },
        { value: 'troubleshooting', label: 'Troubleshooting' }
      ]},
      { value: 'visibilityLevel', label: 'Nível de Visibilidade', type: 'select' as const, options: [
        { value: 'public', label: 'Público' },
        { value: 'internal', label: 'Interno' },
        { value: 'restricted', label: 'Restrito' }
      ]},
      { value: 'contentSensitivity', label: 'Sensibilidade', type: 'select' as const, options: [
        { value: 'low', label: 'Baixa' },
        { value: 'medium', label: 'Média' },
        { value: 'high', label: 'Alta' }
      ]},
      { value: 'authorId', label: 'ID do Autor', type: 'text' as const }
    ] 
  },
  { 
    value: 'timecard', 
    label: 'Timecard', 
    fields: [
      { value: 'overtimeHours', label: 'Horas Extras', type: 'number' as const },
      { value: 'approvalAmount', label: 'Valor para Aprovação', type: 'number' as const },
      { value: 'employeeLevel', label: 'Nível do Funcionário', type: 'select' as const, options: [
        { value: 'junior', label: 'Júnior' },
        { value: 'pleno', label: 'Pleno' },
        { value: 'senior', label: 'Sênior' },
        { value: 'manager', label: 'Gerente' }
      ]}
    ] 
  },
  { 
    value: 'contracts', 
    label: 'Contratos', 
    fields: [
      { value: 'contractValue', label: 'Valor do Contrato', type: 'number' as const },
      { value: 'duration', label: 'Duração (meses)', type: 'number' as const },
      { value: 'contractType', label: 'Tipo de Contrato', type: 'select' as const, options: [
        { value: 'service', label: 'Serviço' },
        { value: 'purchase', label: 'Compra' },
        { value: 'lease', label: 'Aluguel' },
        { value: 'maintenance', label: 'Manutenção' }
      ]},
      { value: 'supplierId', label: 'ID do Fornecedor', type: 'text' as const }
    ] 
  }
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
  { value: 'ALL', label: 'Todos devem aprovar' },
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

  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['/api/approvals/rules'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/approvals/rules', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Falha ao carregar regras');
      return response.json();
    }
  });

  const saveRuleMutation = useMutation({
    mutationFn: async (ruleData: ApprovalRule) => {
      console.log('🚀 [SAVE-MUTATION] Enviando dados:', ruleData);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/approvals/rules', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
        title: "Regra salva com sucesso",
        description: "A regra de aprovação foi criada e está ativa."
      });
      resetRule();
    },
    onError: (error: any) => {
      console.log('❌ [SAVE-ERROR] Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar regra",
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
      id: `condition_${Date.now()}`,
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
      id: `step_${Date.now()}`,
      name: `Etapa ${currentRule.approvalSteps.length + 1}`,
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

  const selectedModuleType = useMemo(() => 
    moduleTypes.find(m => m.value === currentRule.moduleType),
    [currentRule.moduleType]
  );

  const getFieldDefinition = useCallback((fieldValue: string): FieldDefinition | null => {
    return selectedModuleType?.fields.find(f => f.value === fieldValue) || null;
  }, [selectedModuleType]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" data-testid="unified-approval-configurator">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
            className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30"
            data-testid="button-preview-toggle"
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? 'Editar' : 'Preview'}
          </Button>
          <Button
            onClick={() => {
              console.log('🔧 [RESET-RULE] Nova regra solicitada');
              resetRule();
            }}
            variant="outline"
            className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/30 dark:hover:to-pink-950/30"
            data-testid="button-reset"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveRuleMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            data-testid="button-save-rule"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveRuleMutation.isPending ? 'Salvando...' : 'Salvar Regra'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Existing Rules */}
        <div className="lg:col-span-1">
          <Card className="border-none bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                Regras Existentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rulesData?.data?.map((rule: any) => (
                      <div
                        key={`rule-${rule.id}`}
                        className="p-3 border rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/30 dark:hover:to-pink-950/30 cursor-pointer transition-all duration-200 hover:shadow-md"
                        onClick={() => setCurrentRule(rule)}
                      >
                        <div className="font-medium truncate text-gray-900 dark:text-gray-100">{rule.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {moduleTypes.find(m => m.value === rule.moduleType)?.label}
                          </Badge>
                          <Badge 
                            variant={rule.isActive ? "default" : "secondary"} 
                            className={rule.isActive ? "text-xs bg-gradient-to-r from-green-500 to-emerald-500" : "text-xs"}
                          >
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
          <Card className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                  <TabsTrigger value="basic" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                    <Settings className="h-4 w-4 mr-2" />
                    Básico
                  </TabsTrigger>
                  <TabsTrigger value="conditions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    Condições
                  </TabsTrigger>
                  <TabsTrigger value="workflow" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white">
                    <Workflow className="h-4 w-4 mr-2" />
                    Fluxo
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Avançado
                  </TabsTrigger>
                </TabsList>

                {/* Basic Configuration */}
                <TabsContent value="basic" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rule-name" className="text-gray-700 dark:text-gray-300">Nome da Regra</Label>
                        <Input
                          id="rule-name"
                          value={currentRule.name}
                          onChange={(e) => setCurrentRule(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Aprovação Alto Valor Tickets"
                          className="mt-1.5 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          data-testid="input-rule-name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="rule-description" className="text-gray-700 dark:text-gray-300">Descrição</Label>
                        <Textarea
                          id="rule-description"
                          value={currentRule.description}
                          onChange={(e) => setCurrentRule(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descreva o propósito desta regra..."
                          rows={3}
                          className="mt-1.5 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          data-testid="textarea-rule-description"
                        />
                      </div>

                      <div>
                        <Label htmlFor="module-type" className="text-gray-700 dark:text-gray-300">Módulo</Label>
                        <Select
                          value={currentRule.moduleType}
                          onValueChange={(value) => setCurrentRule(prev => ({ ...prev, moduleType: value }))}
                        >
                          <SelectTrigger className="mt-1.5">
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
                          <Label htmlFor="priority" className="text-gray-700 dark:text-gray-300">Prioridade</Label>
                          <Input
                            id="priority"
                            type="number"
                            value={currentRule.priority}
                            onChange={(e) => setCurrentRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 100 }))}
                            min="1"
                            max="999"
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sla-hours" className="text-gray-700 dark:text-gray-300">SLA (horas)</Label>
                          <Input
                            id="sla-hours"
                            type="number"
                            value={currentRule.slaHours}
                            onChange={(e) => setCurrentRule(prev => ({ ...prev, slaHours: parseInt(e.target.value) || 24 }))}
                            min="1"
                            className="mt-1.5"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                        <Switch
                          checked={currentRule.businessHoursOnly}
                          onCheckedChange={(checked) => setCurrentRule(prev => ({ ...prev, businessHoursOnly: checked }))}
                        />
                        <Label className="cursor-pointer text-gray-700 dark:text-gray-300">Apenas horário comercial</Label>
                      </div>

                      <div className="flex items-center space-x-2 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                        <Switch
                          checked={currentRule.isActive}
                          onCheckedChange={(checked) => setCurrentRule(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label className="cursor-pointer text-gray-700 dark:text-gray-300">Regra ativa</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Query Conditions - IMPROVED */}
                <TabsContent value="conditions" className="space-y-6 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        Query Builder - Condições de Ativação
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Defina quando esta regra deve ser ativada
                      </p>
                    </div>
                    <Button 
                      onClick={addCondition} 
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Condição
                    </Button>
                  </div>

                  {selectedModuleType && (
                    <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-gray-700 dark:text-gray-300">
                        <strong>Módulo {selectedModuleType.label}:</strong> {selectedModuleType.fields.length} campos disponíveis
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    {currentRule.queryConditions.map((condition, index) => {
                      const fieldDef = getFieldDefinition(condition.field);
                      
                      return (
                        <Card 
                          key={condition.id} 
                          className="p-4 border-none bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            {index > 0 && (
                              <Select
                                value={condition.logicalOperator}
                                onValueChange={(value: 'AND' | 'OR') => updateCondition(condition.id, { logicalOperator: value })}
                              >
                                <SelectTrigger className="bg-white dark:bg-gray-950">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AND">E (AND)</SelectItem>
                                  <SelectItem value="OR">OU (OR)</SelectItem>
                                </SelectContent>
                              </Select>
                            )}

                            <div className={index === 0 ? "col-span-1" : ""}>
                              <Label className="text-gray-700 dark:text-gray-300">Campo</Label>
                              <Select
                                value={condition.field}
                                onValueChange={(value) => updateCondition(condition.id, { field: value, value: '' })}
                              >
                                <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-950">
                                  <SelectValue placeholder="Selecionar campo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedModuleType?.fields.map(field => (
                                    <SelectItem key={field.value} value={field.value}>
                                      {field.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-gray-700 dark:text-gray-300">Operador</Label>
                              <Select
                                value={condition.operator}
                                onValueChange={(value: any) => updateCondition(condition.id, { operator: value })}
                              >
                                <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-950">
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
                              <Label className="text-gray-700 dark:text-gray-300">Valor</Label>
                              {fieldDef?.options ? (
                                <Select
                                  value={condition.value}
                                  onValueChange={(value) => updateCondition(condition.id, { value })}
                                >
                                  <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-950">
                                    <SelectValue placeholder="Selecionar valor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fieldDef.options.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  type={fieldDef?.type === 'number' ? 'number' : 'text'}
                                  value={condition.value}
                                  onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                                  placeholder="Valor da condição"
                                  className="mt-1.5 bg-white dark:bg-gray-950"
                                />
                              )}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeCondition(condition.id)}
                              className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950/30"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      );
                    })}

                    {currentRule.queryConditions.length === 0 && (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border-2 border-dashed">
                        <Filter className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="font-medium">Nenhuma condição definida</p>
                        <p className="text-sm mt-1">Adicione condições para ativar a regra</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Workflow Pipeline */}
                <TabsContent value="workflow" className="space-y-6 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        Pipeline Designer - Fluxo de Aprovação
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Configure as etapas sequenciais de aprovação
                      </p>
                    </div>
                    <Button 
                      onClick={addApprovalStep} 
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Etapa
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {currentRule.approvalSteps.map((step, index) => (
                      <Card key={step.id} className="p-6 border-none bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                              {index + 1}
                            </div>
                            <Input
                              value={step.name}
                              onChange={(e) => updateApprovalStep(step.id, { name: e.target.value })}
                              placeholder="Nome da etapa"
                              className="font-medium bg-white dark:bg-gray-950"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeApprovalStep(step.id)}
                            className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-gray-700 dark:text-gray-300">Modo de Decisão</Label>
                            <Select
                              value={step.decisionMode}
                              onValueChange={(value: any) => updateApprovalStep(step.id, { decisionMode: value })}
                            >
                              <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-950">
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
                              <Label className="text-gray-700 dark:text-gray-300">Quórum (quantos aprovadores)</Label>
                              <Input
                                type="number"
                                value={step.quorumCount || 1}
                                onChange={(e) => updateApprovalStep(step.id, { quorumCount: parseInt(e.target.value) || 1 })}
                                min="1"
                                className="mt-1.5 bg-white dark:bg-gray-950"
                              />
                            </div>
                          )}

                          <div>
                            <Label className="text-gray-700 dark:text-gray-300">SLA da Etapa (horas)</Label>
                            <Input
                              type="number"
                              value={step.slaHours}
                              onChange={(e) => updateApprovalStep(step.id, { slaHours: parseInt(e.target.value) || 24 })}
                              min="1"
                              className="mt-1.5 bg-white dark:bg-gray-950"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center space-x-2 mb-2 p-3 rounded-lg bg-white/50 dark:bg-gray-900/50">
                            <Switch
                              checked={step.autoApproval}
                              onCheckedChange={(checked) => updateApprovalStep(step.id, { autoApproval: checked })}
                            />
                            <Label className="cursor-pointer text-gray-700 dark:text-gray-300">Auto-aprovação habilitada</Label>
                          </div>

                          {step.autoApproval && (
                            <Alert className="mt-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                              <Check className="h-4 w-4 text-green-600" />
                              <AlertDescription className="text-gray-700 dark:text-gray-300">
                                Esta etapa será aprovada automaticamente quando as condições forem atendidas
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        {index < currentRule.approvalSteps.length - 1 && (
                          <div className="flex justify-center mt-4">
                            <div className="p-2 rounded-full bg-gradient-to-br from-emerald-200 to-green-200 dark:from-emerald-800 dark:to-green-800">
                              <ArrowDown className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}

                    {currentRule.approvalSteps.length === 0 && (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border-2 border-dashed">
                        <Workflow className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="font-medium">Nenhuma etapa de aprovação definida</p>
                        <p className="text-sm mt-1">Adicione etapas para criar o fluxo</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Advanced Settings */}
                <TabsContent value="advanced" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4 border-none bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
                      <h4 className="font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        Configurações de Escalação
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                          <Switch />
                          <Label className="cursor-pointer text-gray-700 dark:text-gray-300">Escalação automática por timeout</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                          <Switch />
                          <Label className="cursor-pointer text-gray-700 dark:text-gray-300">Lembretes automáticos</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                          <Switch />
                          <Label className="cursor-pointer text-gray-700 dark:text-gray-300">Delegação automática</Label>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 border-none bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                      <h4 className="font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        Notificações
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                          <Switch defaultChecked />
                          <Label className="cursor-pointer text-gray-700 dark:text-gray-300">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                          <Switch defaultChecked />
                          <Label className="cursor-pointer text-gray-700 dark:text-gray-300">In-app</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                          <Switch />
                          <Label className="cursor-pointer text-gray-700 dark:text-gray-300">WhatsApp</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                          <Switch />
                          <Label className="cursor-pointer text-gray-700 dark:text-gray-300">Slack</Label>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
