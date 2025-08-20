
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code,
  Play,
  Settings,
  Plus,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

interface ValidationRule {
  id: string;
  name: string;
  type: 'required' | 'length' | 'pattern' | 'custom' | 'range' | 'email' | 'phone' | 'date' | 'dependency';
  config: {
    min?: number;
    max?: number;
    pattern?: string;
    customCode?: string;
    message: string;
    dependsOn?: string;
    dependsValue?: any;
    severity: 'error' | 'warning' | 'info';
  };
  enabled: boolean;
}

interface ValidationTest {
  id: string;
  name: string;
  fieldValues: Record<string, any>;
  expectedResult: 'valid' | 'invalid';
  description: string;
}

interface ValidationEngineProps {
  fieldId: string;
  fieldType: string;
  currentRules: ValidationRule[];
  onRulesChange: (rules: ValidationRule[]) => void;
  onTestValidation: (fieldId: string, value: any) => ValidationResult;
}

interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    rule: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    rule: string;
    message: string;
  }>;
}

const validationRuleTemplates = [
  {
    type: 'required',
    name: 'Campo Obrigatório',
    description: 'Verifica se o campo foi preenchido',
    defaultConfig: {
      message: 'Este campo é obrigatório',
      severity: 'error' as const
    }
  },
  {
    type: 'length',
    name: 'Tamanho do Texto',
    description: 'Valida o comprimento mínimo e máximo',
    defaultConfig: {
      min: 1,
      max: 255,
      message: 'Tamanho inválido',
      severity: 'error' as const
    }
  },
  {
    type: 'pattern',
    name: 'Expressão Regular',
    description: 'Valida usando regex personalizada',
    defaultConfig: {
      pattern: '^[A-Za-z0-9]+$',
      message: 'Formato inválido',
      severity: 'error' as const
    }
  },
  {
    type: 'email',
    name: 'E-mail Válido',
    description: 'Verifica se é um e-mail válido',
    defaultConfig: {
      message: 'E-mail inválido',
      severity: 'error' as const
    }
  },
  {
    type: 'phone',
    name: 'Telefone Válido',
    description: 'Valida números de telefone brasileiros',
    defaultConfig: {
      message: 'Telefone inválido',
      severity: 'error' as const
    }
  },
  {
    type: 'date',
    name: 'Data Válida',
    description: 'Valida datas e períodos',
    defaultConfig: {
      message: 'Data inválida',
      severity: 'error' as const
    }
  },
  {
    type: 'range',
    name: 'Faixa Numérica',
    description: 'Valida números dentro de uma faixa',
    defaultConfig: {
      min: 0,
      max: 100,
      message: 'Valor fora da faixa permitida',
      severity: 'error' as const
    }
  },
  {
    type: 'dependency',
    name: 'Dependência de Campo',
    description: 'Obrigatório baseado em outro campo',
    defaultConfig: {
      dependsOn: '',
      dependsValue: '',
      message: 'Campo obrigatório quando {dependsOn} = {dependsValue}',
      severity: 'error' as const
    }
  },
  {
    type: 'custom',
    name: 'Validação Customizada',
    description: 'JavaScript personalizado',
    defaultConfig: {
      customCode: 'return value && value.length > 0;',
      message: 'Validação customizada falhou',
      severity: 'error' as const
    }
  }
];

export const ValidationEngine: React.FC<ValidationEngineProps> = ({
  fieldId,
  fieldType,
  currentRules,
  onRulesChange,
  onTestValidation
}) => {
  const [activeTab, setActiveTab] = useState('rules');
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);
  const [testValue, setTestValue] = useState('');
  const [testResult, setTestResult] = useState<ValidationResult | null>(null);
  const [validationTests, setValidationTests] = useState<ValidationTest[]>([]);

  const handleAddRule = (type: string) => {
    const template = validationRuleTemplates.find(t => t.type === type);
    if (!template) return;

    const newRule: ValidationRule = {
      id: `rule-${Date.now()}`,
      name: template.name,
      type: type as any,
      config: { ...template.defaultConfig },
      enabled: true
    };

    onRulesChange([...currentRules, newRule]);
    setEditingRule(newRule);
  };

  const handleUpdateRule = (updatedRule: ValidationRule) => {
    const updatedRules = currentRules.map(rule => 
      rule.id === updatedRule.id ? updatedRule : rule
    );
    onRulesChange(updatedRules);
    setEditingRule(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    const filteredRules = currentRules.filter(rule => rule.id !== ruleId);
    onRulesChange(filteredRules);
  };

  const handleToggleRule = (ruleId: string) => {
    const updatedRules = currentRules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    );
    onRulesChange(updatedRules);
  };

  const handleTestValidation = () => {
    const result = onTestValidation(fieldId, testValue);
    setTestResult(result);
  };

  const handleRunAllTests = () => {
    // Implementar execução de todos os testes
    console.log('Running all validation tests...');
  };

  const createValidationTest = () => {
    const newTest: ValidationTest = {
      id: `test-${Date.now()}`,
      name: `Teste ${validationTests.length + 1}`,
      fieldValues: { [fieldId]: testValue },
      expectedResult: testResult?.isValid ? 'valid' : 'invalid',
      description: `Teste com valor: "${testValue}"`
    };

    setValidationTests([...validationTests, newTest]);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <CheckCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Sistema de Validação
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure validações para o campo: <strong>{fieldId}</strong>
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="rules">Regras ({currentRules.length})</TabsTrigger>
          <TabsTrigger value="test">Testar</TabsTrigger>
          <TabsTrigger value="suites">Suítes de Teste</TabsTrigger>
        </TabsList>

        <div className="p-4">
          <TabsContent value="rules" className="space-y-4">
            {/* Lista de Regras Existentes */}
            <div className="space-y-3">
              {currentRules.map((rule) => (
                <Card key={rule.id} className={`${!rule.enabled ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                        />
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-gray-500">
                            {rule.config.message}
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={getSeverityColor(rule.config.severity)}
                        >
                          {getSeverityIcon(rule.config.severity)}
                          <span className="ml-1 capitalize">{rule.config.severity}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRule(rule)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {currentRules.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma regra de validação configurada. Adicione regras para validar este campo.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Adicionar Nova Regra */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adicionar Nova Regra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {validationRuleTemplates
                    .filter(template => {
                      // Filtrar regras baseadas no tipo de campo
                      if (fieldType === 'email' && template.type === 'email') return true;
                      if (fieldType === 'phone' && template.type === 'phone') return true;
                      if (fieldType === 'number' && template.type === 'range') return true;
                      if (fieldType === 'date' && template.type === 'date') return true;
                      return ['required', 'length', 'pattern', 'custom', 'dependency'].includes(template.type);
                    })
                    .map((template) => (
                      <Button
                        key={template.type}
                        variant="outline"
                        onClick={() => handleAddRule(template.type)}
                        className="justify-start h-auto p-3"
                      >
                        <div className="text-left">
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-gray-500">{template.description}</div>
                        </div>
                      </Button>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Editor de Regra */}
            {editingRule && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Editar Regra: {editingRule.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nome da Regra</Label>
                    <Input
                      value={editingRule.name}
                      onChange={(e) => setEditingRule({
                        ...editingRule,
                        name: e.target.value
                      })}
                    />
                  </div>

                  <div>
                    <Label>Mensagem de Erro</Label>
                    <Input
                      value={editingRule.config.message}
                      onChange={(e) => setEditingRule({
                        ...editingRule,
                        config: { ...editingRule.config, message: e.target.value }
                      })}
                    />
                  </div>

                  <div>
                    <Label>Severidade</Label>
                    <Select
                      value={editingRule.config.severity}
                      onValueChange={(value) => setEditingRule({
                        ...editingRule,
                        config: { ...editingRule.config, severity: value as any }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="error">Erro (Bloqueia)</SelectItem>
                        <SelectItem value="warning">Aviso</SelectItem>
                        <SelectItem value="info">Informação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Configurações específicas por tipo */}
                  {editingRule.type === 'length' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Mínimo</Label>
                        <Input
                          type="number"
                          value={editingRule.config.min || 0}
                          onChange={(e) => setEditingRule({
                            ...editingRule,
                            config: { ...editingRule.config, min: parseInt(e.target.value) }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Máximo</Label>
                        <Input
                          type="number"
                          value={editingRule.config.max || 255}
                          onChange={(e) => setEditingRule({
                            ...editingRule,
                            config: { ...editingRule.config, max: parseInt(e.target.value) }
                          })}
                        />
                      </div>
                    </div>
                  )}

                  {editingRule.type === 'pattern' && (
                    <div>
                      <Label>Expressão Regular</Label>
                      <Input
                        value={editingRule.config.pattern || ''}
                        onChange={(e) => setEditingRule({
                          ...editingRule,
                          config: { ...editingRule.config, pattern: e.target.value }
                        })}
                        placeholder="^[A-Za-z0-9]+$"
                      />
                    </div>
                  )}

                  {editingRule.type === 'custom' && (
                    <div>
                      <Label>Código JavaScript</Label>
                      <Textarea
                        value={editingRule.config.customCode || ''}
                        onChange={(e) => setEditingRule({
                          ...editingRule,
                          config: { ...editingRule.config, customCode: e.target.value }
                        })}
                        placeholder="return value && value.length > 0;"
                        rows={4}
                      />
                    </div>
                  )}

                  {editingRule.type === 'dependency' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Campo Dependente</Label>
                        <Input
                          value={editingRule.config.dependsOn || ''}
                          onChange={(e) => setEditingRule({
                            ...editingRule,
                            config: { ...editingRule.config, dependsOn: e.target.value }
                          })}
                          placeholder="campo_id"
                        />
                      </div>
                      <div>
                        <Label>Valor de Ativação</Label>
                        <Input
                          value={editingRule.config.dependsValue || ''}
                          onChange={(e) => setEditingRule({
                            ...editingRule,
                            config: { ...editingRule.config, dependsValue: e.target.value }
                          })}
                          placeholder="valor"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingRule(null)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={() => handleUpdateRule(editingRule)}>
                      Salvar Regra
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Testar Validações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Valor de Teste</Label>
                  <Input
                    value={testValue}
                    onChange={(e) => setTestValue(e.target.value)}
                    placeholder="Digite um valor para testar..."
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleTestValidation}>
                    <Play className="h-4 w-4 mr-2" />
                    Executar Teste
                  </Button>
                  {testResult && (
                    <Button
                      variant="outline"
                      onClick={createValidationTest}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Salvar como Teste
                    </Button>
                  )}
                </div>

                {testResult && (
                  <Alert className={`${testResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center">
                      {testResult.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className="ml-2">
                        <strong>
                          {testResult.isValid ? 'Validação Passou' : 'Validação Falhou'}
                        </strong>
                      </AlertDescription>
                    </div>

                    {testResult.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-red-800">Erros:</p>
                        <ul className="list-disc list-inside text-sm text-red-700">
                          {testResult.errors.map((error, index) => (
                            <li key={index}>{error.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {testResult.warnings.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-yellow-800">Avisos:</p>
                        <ul className="list-disc list-inside text-sm text-yellow-700">
                          {testResult.warnings.map((warning, index) => (
                            <li key={index}>{warning.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suites" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Suítes de Teste</h3>
              <Button onClick={handleRunAllTests}>
                <Play className="h-4 w-4 mr-2" />
                Executar Todos
              </Button>
            </div>

            <div className="space-y-3">
              {validationTests.map((test) => (
                <Card key={test.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-gray-500">{test.description}</p>
                        <Badge 
                          variant={test.expectedResult === 'valid' ? 'default' : 'destructive'}
                          className="mt-1"
                        >
                          Esperado: {test.expectedResult === 'valid' ? 'Válido' : 'Inválido'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {validationTests.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma suíte de teste criada. Use a aba "Testar" para criar testes automáticos.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ValidationEngine;
