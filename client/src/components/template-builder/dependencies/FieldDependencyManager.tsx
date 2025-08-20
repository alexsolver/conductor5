import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
// import { useLocalization } from '@/hooks/useLocalization';
  GitBranch,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Network
} from 'lucide-react';
interface FieldDependency {
  id: string;
  name: string;
  sourceFieldId: string;
  targetFieldId: string;
  condition: {
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty' | 'in' | 'not_in';
    value: any;
    values?: any[]; // Para operadores 'in' e 'not_in'
  };
  action: {
    type: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'unrequire' | 'set_value' | 'clear_value' | 'set_options' | 'filter_options';
    value?: any;
    options?: Array<{ label: string; value: any }>;
  };
  enabled: boolean;
  priority: number;
}
interface Field {
  id: string;
  name: string;
  type: string;
  required: boolean;
  visible: boolean;
  enabled: boolean;
}
interface FieldDependencyManagerProps {
  fields: Field[];
  dependencies: FieldDependency[];
  onDependenciesChange: (dependencies: FieldDependency[]) => void;
  onTestDependencies: (dependencies: FieldDependency[]) => void;
}
const conditionOperators = [
  {
  // Localization temporarily disabled
 value: 'equals', label: 'É igual a', description: 'Valor exato' },
  { value: 'not_equals', label: 'É diferente de', description: 'Valor diferente' },
  { value: 'contains', label: 'Contém', description: 'Para textos' },
  { value: 'not_contains', label: 'Não contém', description: 'Para textos' },
  { value: 'greater_than', label: 'Maior que', description: 'Para números' },
  { value: 'less_than', label: 'Menor que', description: 'Para números' },
  { value: 'is_empty', label: 'Está vazio', description: 'Campo sem valor' },
  { value: 'is_not_empty', label: 'Não está vazio', description: 'Campo com valor' },
  { value: 'in', label: 'Está em', description: 'Lista de valores' },
  { value: 'not_in', label: 'Não está em', description: 'Fora da lista' }
];
const actionTypes = [
  { value: 'show', label: 'Mostrar Campo', description: 'Torna o campo visível' },
  { value: 'hide', label: 'Ocultar Campo', description: 'Torna o campo invisível' },
  { value: 'enable', label: 'Habilitar Campo', description: 'Permite edição' },
  { value: 'disable', label: 'Desabilitar Campo', description: 'Impede edição' },
  { value: 'require', label: 'Tornar Obrigatório', description: 'Campo obrigatório' },
  { value: 'unrequire', label: 'Tornar Opcional', description: 'Campo opcional' },
  { value: 'set_value', label: 'Definir Valor', description: 'Define valor específico' },
  { value: 'clear_value', label: 'Limpar Valor', description: 'Remove o valor' },
  { value: 'set_options', label: 'Definir Opções', description: 'Para campos select' },
  { value: 'filter_options', label: '[TRANSLATION_NEEDED]', description: 'Filtra opções existentes' }
];
export const FieldDependencyManager: React.FC<FieldDependencyManagerProps> = ({
  fields,
  dependencies,
  onDependenciesChange,
  onTestDependencies
}) => {
  const [activeTab, setActiveTab] = useState('dependencies');
  const [editingDependency, setEditingDependency] = useState<FieldDependency | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);
  const handleAddDependency = () => {
    const newDependency: FieldDependency = {
      id: "
      name: "
      sourceFieldId: '',
      targetFieldId: '',
      condition: {
        operator: 'equals',
        value: ''
      },
      action: {
        type: 'show'
      },
      enabled: true,
      priority: dependencies.length
    };
    setEditingDependency(newDependency);
  };
  const handleSaveDependency = (dependency: FieldDependency) => {
    if (dependency.id.includes('new-')) {
      // Nova dependência
      const newDep = { ...dependency, id: "
      onDependenciesChange([...dependencies, newDep]);
    } else {
      // Editar existente
      const updated = dependencies.map(dep => 
        dep.id === dependency.id ? dependency : dep
      );
      onDependenciesChange(updated);
    }
    setEditingDependency(null);
  };
  const handleDeleteDependency = (dependencyId: string) => {
    const filtered = dependencies.filter(dep => dep.id !== dependencyId);
    onDependenciesChange(filtered);
  };
  const handleToggleDependency = (dependencyId: string) => {
    const updated = dependencies.map(dep => 
      dep.id === dependencyId ? { ...dep, enabled: !dep.enabled } : dep
    );
    onDependenciesChange(updated);
  };
  const getFieldName = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : fieldId;
  };
  const getDependencyIcon = (action: string) => {
    switch (action) {
      case 'show': return <Eye className="h-4 w-4" />;
      case 'hide': return <EyeOff className="h-4 w-4" />;
      case 'enable': return <CheckCircle className="h-4 w-4" />;
      case 'disable': return <AlertTriangle className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };
  const validateDependency = (dependency: FieldDependency): string[] => {
    const errors: string[] = [];
    
    if (!dependency.sourceFieldId) {
      errors.push('Campo de origem não selecionado');
    }
    
    if (!dependency.targetFieldId) {
      errors.push('Campo de destino não selecionado');
    }
    
    if (dependency.sourceFieldId === dependency.targetFieldId) {
      errors.push('Campo de origem não pode ser igual ao de destino');
    }
    
    if (!dependency.condition.value && !['is_empty', 'is_not_empty'].includes(dependency.condition.operator)) {
      errors.push('Valor da condição é obrigatório');
    }
    
    return errors;
  };
  const renderDependencyGraph = () => {
    // Simplified dependency visualization
    const nodes = fields.map(field => ({
      id: field.id,
      name: field.name,
      type: field.type
    }));
    const edges = dependencies.filter(dep => dep.enabled).map(dep => ({
      source: dep.sourceFieldId,
      target: dep.targetFieldId,
      label: dep.name
    }));
    return (
      <div className="p-4 bg-gray-50 rounded-lg>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4>
          {nodes.map(node => (
            <Card key={node.id} className="p-3>
              <div className="text-lg">"{node.name}</div>
              <Badge variant="outline" className="text-xs mt-1>
                {node.type}
              </Badge>
              
              {/* Incoming dependencies */}
              {edges.filter(e => e.target === node.id).map(edge => (
                <div key={"
                  <ArrowRight className="h-3 w-3 inline mr-1" />
                  Depende de: {getFieldName(edge.source)}
                </div>
              ))}
            </Card>
          ))}
        </div>
      </div>
    );
  };
  return (
    <div className="w-full h-full>
      <div className="p-4 border-b>
        <div className="flex items-center justify-between>
          <div>
            <h2 className="text-lg font-semibold flex items-center>
              <GitBranch className="h-5 w-5 mr-2" />
              Dependências de Campos
            </h2>
            <p className="text-sm text-gray-500 mt-1>
              Configure quando campos devem aparecer, desaparecer ou mudar comportamento
            </p>
          </div>
          
          <div className="flex items-center space-x-2>
            <Button
              variant="outline"
              onClick={() => setShowVisualization(!showVisualization)}
            >
              <Network className="h-4 w-4 mr-2" />
              {showVisualization ? 'Ocultar' : 'Visualizar'} Grafo
            </Button>
            
            <Button onClick={handleAddDependency}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Dependência
            </Button>
          </div>
        </div>
      </div>
      {showVisualization && (
        <div className="p-4 border-b>
          <h3 className="text-lg">"Mapa de Dependências</h3>
          {renderDependencyGraph()}
        </div>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full>
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4>
          <TabsTrigger value="dependencies>
            Dependências ({dependencies.length})
          </TabsTrigger>
          <TabsTrigger value="test>
            Testar Dependências
          </TabsTrigger>
        </TabsList>
        <div className="p-4>
          <TabsContent value="dependencies" className="space-y-4>
            {/* Lista de Dependências */}
            <div className="space-y-3>
              {dependencies.map((dependency) => {
                const errors = validateDependency(dependency);
                
                return (
                  <Card key={dependency.id} className="text-lg">"
                    <CardContent className="p-4>
                      <div className="flex items-center justify-between>
                        <div className="flex items-center space-x-3>
                          <Switch
                            checked={dependency.enabled}
                            onCheckedChange={() => handleToggleDependency(dependency.id)}
                          />
                          
                          <div className="flex items-center space-x-2>
                            {getDependencyIcon(dependency.action.type)}
                            <div>
                              <h4 className="text-lg">"{dependency.name}</h4>
                              <p className="text-sm text-gray-500>
                                Se <strong>{getFieldName(dependency.sourceFieldId)}</strong> {' '}
                                {conditionOperators.find(op => op.value === dependency.condition.operator)?.label.toLowerCase()} {' '}
                                <strong>{dependency.condition.value}</strong>, então {' '}
                                {actionTypes.find(act => act.value === dependency.action.type)?.label.toLowerCase()} {' '}
                                <strong>{getFieldName(dependency.targetFieldId)}</strong>
                              </p>
                            </div>
                          </div>
                          {errors.length > 0 && (
                            <Badge variant="destructive>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {errors.length} erro(s)
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2>
                          <Badge variant="outline>
                            Prioridade: {dependency.priority}
                          </Badge>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingDependency(dependency)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDependency(dependency.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {dependencies.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma dependência configurada. Clique em "Nova Dependência" para começar.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            {/* Editor de Dependência */}
            {editingDependency && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base>
                    {editingDependency.id.includes('new-') ? 'Nova' : '[TRANSLATION_NEEDED]'} Dependência
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4>
                  <div>
                    <Label>Nome da Dependência</Label>
                    <Input
                      value={editingDependency.name}
                      onChange={(e) => setEditingDependency({
                        ...editingDependency,
                        name: e.target.value
                      })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4>
                    <div>
                      <Label>Campo de Origem (SE)</Label>
                      <Select
                        value={editingDependency.sourceFieldId}
                        onValueChange={(value) => setEditingDependency({
                          ...editingDependency,
                          sourceFieldId: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.map(field => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.name} ({field.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Campo de Destino (ENTÃO)</Label>
                      <Select
                        value={editingDependency.targetFieldId}
                        onValueChange={(value) => setEditingDependency({
                          ...editingDependency,
                          targetFieldId: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                        </SelectTrigger>
                        <SelectContent>
                          {fields
                            .filter(field => field.id !== editingDependency.sourceFieldId)
                            .map(field => (
                              <SelectItem key={field.id} value={field.id}>
                                {field.name} ({field.type})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4>
                    <div>
                      <Label>Condição</Label>
                      <Select
                        value={editingDependency.condition.operator}
                        onValueChange={(value) => setEditingDependency({
                          ...editingDependency,
                          condition: {
                            ...editingDependency.condition,
                            operator: value as any
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionOperators.map(op => (
                            <SelectItem key={op.value} value={op.value}>
                              <div>
                                <div>{op.label}</div>
                                <div className="text-lg">"{op.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Valor da Condição</Label>
                      <Input
                        value={editingDependency.condition.value}
                        onChange={(e) => setEditingDependency({
                          ...editingDependency,
                          condition: {
                            ...editingDependency.condition,
                            value: e.target.value
                          }
                        })}
                        disabled={['is_empty', 'is_not_empty'].includes(editingDependency.condition.operator)}
                        placeholder={['is_empty', 'is_not_empty'].includes(editingDependency.condition.operator) ? 'Não aplicável' : 'Digite o valor...'}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Ação</Label>
                    <Select
                      value={editingDependency.action.type}
                      onValueChange={(value) => setEditingDependency({
                        ...editingDependency,
                        action: {
                          ...editingDependency.action,
                          type: value as any
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map(action => (
                          <SelectItem key={action.value} value={action.value}>
                            <div>
                              <div>{action.label}</div>
                              <div className="text-lg">"{action.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {['set_value'].includes(editingDependency.action.type) && (
                    <div>
                      <Label>Valor da Ação</Label>
                      <Input
                        value={editingDependency.action.value || ''}
                        onChange={(e) => setEditingDependency({
                          ...editingDependency,
                          action: {
                            ...editingDependency.action,
                            value: e.target.value
                          }
                        })}
                      />
                    </div>
                  )}
                  <div>
                    <Label>Prioridade de Execução</Label>
                    <Input
                      type="number"
                      value={editingDependency.priority}
                      onChange={(e) => setEditingDependency({
                        ...editingDependency,
                        priority: parseInt(e.target.value) || 0
                      })}
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1>
                      Menor número = maior prioridade
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2>
                    <Button
                      variant="outline"
                      onClick={() => setEditingDependency(null)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={() => handleSaveDependency(editingDependency)}>
                      Salvar Dependência
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="test" className="space-y-4>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">"Testar Dependências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4>
                  <p className="text-sm text-gray-600>
                    Simule valores para os campos e veja como as dependências afetam o formulário.
                  </p>
                  
                  <Button onClick={() => onTestDependencies(dependencies)}>
                    Executar Teste de Dependências
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
export default FieldDependencyManager;
