
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Settings, Calculator, Percent, Calendar, Target } from "lucide-react";
// import { useLocalization } from '@/hooks/useLocalization';

interface PricingRuleConfigurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: any;
  onSave: (rule: any) => void;
}

export default function PricingRuleConfigurationModal({
  // Localization temporarily disabled

  open,
  onOpenChange,
  rule,
  onSave
}: PricingRuleConfigurationModalProps) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    ruleType: rule?.ruleType || 'percentual',
    priority: rule?.priority || 1,
    isActive: rule?.isActive ?? true,
    conditions: rule?.conditions || {},
    actions: rule?.actions || {},
    validFrom: rule?.validFrom || '',
    validTo: rule?.validTo || ''
  });

  const [tierRules, setTierRules] = useState(
    rule?.actions?.tiers || [{ minQuantity: 1, maxQuantity: 10, discount: 0 }]
  );

  const [dynamicFactors, setDynamicFactors] = useState(
    rule?.actions?.factors || { demandFactor: 1, seasonalFactor: 1, inventoryFactor: 1 }
  );

  const addTierRule = () => {
    setTierRules([...tierRules, { minQuantity: 0, maxQuantity: 0, discount: 0 }]);
  };

  const removeTierRule = (index: number) => {
    setTierRules(tierRules.filter((_, i) => i !== index));
  };

  const updateTierRule = (index: number, field: string, value: number) => {
    const newTiers = [...tierRules];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTierRules(newTiers);
  };

  const handleSave = () => {
    const ruleData = {
      ...formData,
      actions: {
        ...formData.actions,
        ...(formData.ruleType === 'escalonado' && { tiers: tierRules }),
        ...(formData.ruleType === 'dinamico' && { factors: dynamicFactors })
      }
    };
    onSave(ruleData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? '[TRANSLATION_NEEDED]' : 'Nova Regra de Precificação'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="conditions">Condições</TabsTrigger>
            <TabsTrigger value="actions">Ações</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Regra</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Desconto por Volume"
                />
              </div>
              <div>
                <Label htmlFor="ruleType">Tipo de Regra</Label>
                <Select 
                  value={formData.ruleType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, ruleType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentual">Percentual</SelectItem>
                    <SelectItem value="fixo">Valor Fixo</SelectItem>
                    <SelectItem value="escalonado">Escalonada por Quantidade</SelectItem>
                    <SelectItem value="dinamico">Dinâmica (Múltiplos Fatores)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Descrição detalhada da regra..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Prioridade (1-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Regra Ativa</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="conditions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-4 w-4" />
                  Condições de Aplicação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantidade Mínima</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 10"
                      value={formData.conditions.minQuantity || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions, minQuantity: parseFloat(e.target.value) || undefined }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Quantidade Máxima</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 100"
                      value={formData.conditions.maxQuantity || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions, maxQuantity: parseFloat(e.target.value) || undefined }
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preço Mínimo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 100.00"
                      value={formData.conditions.minPrice || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions, minPrice: parseFloat(e.target.value) || undefined }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Preço Máximo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1000.00"
                      value={formData.conditions.maxPrice || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions, maxPrice: parseFloat(e.target.value) || undefined }
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Válido De</Label>
                    <Input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Válido Até</Label>
                    <Input
                      type="date"
                      value={formData.validTo}
                      onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            {formData.ruleType === 'percentual' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Percent className="mr-2 h-4 w-4" />
                    Configuração Percentual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label>Percentual de Ajuste (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 15 (para +15%) ou -10 (para -10%)"
                      value={formData.actions.percentage || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        actions: { ...prev.actions, percentage: parseFloat(e.target.value) }
                      }))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Valores positivos aumentam o preço, negativos diminuem
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.ruleType === 'fixo' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="mr-2 h-4 w-4" />
                    Configuração Valor Fixo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Valor Fixo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 50.00"
                      value={formData.actions.fixedAmount || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        actions: { ...prev.actions, fixedAmount: parseFloat(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Operação</Label>
                    <Select 
                      value={formData.actions.operation || 'add'} 
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        actions: { ...prev.actions, operation: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">Adicionar ao preço</SelectItem>
                        <SelectItem value="set">Definir como preço</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.ruleType === 'escalonado' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Configuração Escalonada
                    </span>
                    <Button onClick={addTierRule} size="sm">
                      <Plus className="mr-1 h-3 w-3" />
                      Adicionar Faixa
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tierRules.map((tier, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <Input
                          type="number"
                          placeholder="Qtd Min"
                          value={tier.minQuantity}
                          onChange={(e) => updateTierRule(index, 'minQuantity', parseInt(e.target.value))}
                          className="w-20"
                        />
                        <span>até</span>
                        <Input
                          type="number"
                          placeholder="Qtd Max"
                          value={tier.maxQuantity}
                          onChange={(e) => updateTierRule(index, 'maxQuantity', parseInt(e.target.value))}
                          className="w-20"
                        />
                        <span>=</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Desconto %"
                          value={tier.discount}
                          onChange={(e) => updateTierRule(index, 'discount', parseFloat(e.target.value))}
                          className="w-24"
                        />
                        <span>%</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTierRule(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.ruleType === 'dinamico' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Fatores Dinâmicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Fator de Demanda</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1.1 (110%)"
                      value={dynamicFactors.demandFactor}
                      onChange={(e) => setDynamicFactors(prev => ({
                        ...prev,
                        demandFactor: parseFloat(e.target.value)
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Fator Sazonal</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 0.9 (90%)"
                      value={dynamicFactors.seasonalFactor}
                      onChange={(e) => setDynamicFactors(prev => ({
                        ...prev,
                        seasonalFactor: parseFloat(e.target.value)
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Fator de Estoque</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1.0 (100%)"
                      value={dynamicFactors.inventoryFactor}
                      onChange={(e) => setDynamicFactors(prev => ({
                        ...prev,
                        inventoryFactor: parseFloat(e.target.value)
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preço Mínimo Garantido (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 10.00"
                      value={formData.actions.minPrice || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        actions: { ...prev.actions, minPrice: parseFloat(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Preço Máximo Limitado (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1000.00"
                      value={formData.actions.maxPrice || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        actions: { ...prev.actions, maxPrice: parseFloat(e.target.value) }
                      }))}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Observações Internas</Label>
                  <Textarea
                    placeholder="Notas para uso interno sobre esta regra..."
                    value={formData.internalNotes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {rule ? 'Atualizar Regra' : '[TRANSLATION_NEEDED]'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
