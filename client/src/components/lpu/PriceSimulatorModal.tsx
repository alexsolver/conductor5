
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, Info, CheckCircle } from "lucide-react";

interface PriceSimulatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceLists: any[];
  pricingRules: any[];
}

export default function PriceSimulatorModal({
  open,
  onOpenChange,
  priceLists,
  pricingRules
}: PriceSimulatorModalProps) {
  const [simulation, setSimulation] = useState({
    priceListId: '',
    basePrice: 0,
    quantity: 1,
    customerId: '',
    itemCategory: ''
  });

  const [simulationResult, setSimulationResult] = useState<any>(null);

  const runSimulation = () => {
    // Simular aplicação de regras
    const activeRules = pricingRules.filter(rule => rule.isActive);
    const sortedRules = activeRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    let currentPrice = simulation.basePrice;
    const appliedRules: any[] = [];

    sortedRules.forEach(rule => {
      let ruleApplied = false;
      let adjustmentValue = 0;
      let newPrice = currentPrice;

      // Verificar condições
      const conditions = rule.conditions || {};
      if (conditions.minQuantity && simulation.quantity < conditions.minQuantity) return;
      if (conditions.maxQuantity && simulation.quantity > conditions.maxQuantity) return;
      if (conditions.minPrice && simulation.basePrice < conditions.minPrice) return;
      if (conditions.maxPrice && simulation.basePrice > conditions.maxPrice) return;

      // Aplicar ações
      const actions = rule.actions || {};
      
      switch (rule.ruleType) {
        case 'percentual':
          if (actions.percentage !== undefined) {
            adjustmentValue = actions.percentage;
            newPrice = currentPrice * (1 + actions.percentage / 100);
            ruleApplied = true;
          }
          break;

        case 'fixo':
          if (actions.fixedAmount !== undefined) {
            adjustmentValue = actions.fixedAmount;
            newPrice = actions.operation === 'set' ? actions.fixedAmount : currentPrice + actions.fixedAmount;
            ruleApplied = true;
          }
          break;

        case 'escalonado':
          if (actions.tiers) {
            const tier = actions.tiers.find((t: any) => 
              simulation.quantity >= t.minQuantity && 
              (!t.maxQuantity || simulation.quantity <= t.maxQuantity)
            );
            if (tier) {
              adjustmentValue = tier.discount || 0;
              newPrice = currentPrice * (1 + adjustmentValue / 100);
              ruleApplied = true;
            }
          }
          break;

        case 'dinamico':
          if (actions.factors) {
            let multiplier = 1;
            Object.values(actions.factors).forEach((factor: any) => {
              multiplier *= factor || 1;
            });
            adjustmentValue = (multiplier - 1) * 100;
            newPrice = currentPrice * multiplier;
            ruleApplied = true;
          }
          break;
      }

      if (ruleApplied) {
        // Aplicar limites
        if (actions.minPrice && newPrice < actions.minPrice) {
          newPrice = actions.minPrice;
        }
        if (actions.maxPrice && newPrice > actions.maxPrice) {
          newPrice = actions.maxPrice;
        }

        currentPrice = Math.round(newPrice * 100) / 100;
        appliedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.ruleType,
          adjustment: adjustmentValue,
          adjustmentType: rule.ruleType === 'percentual' ? 'percentage' : 
                         rule.ruleType === 'fixo' ? 'fixed' : 'other'
        });
      }
    });

    const totalAdjustment = currentPrice - simulation.basePrice;
    const adjustmentPercentage = simulation.basePrice > 0 ? (totalAdjustment / simulation.basePrice) * 100 : 0;

    setSimulationResult({
      originalPrice: simulation.basePrice,
      finalPrice: currentPrice,
      appliedRules,
      totalAdjustment,
      adjustmentPercentage,
      totalValue: currentPrice * simulation.quantity
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Simulador de Preços
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuração da Simulação */}
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros da Simulação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Lista de Preços</Label>
                <Select 
                  value={simulation.priceListId} 
                  onValueChange={(value) => setSimulation(prev => ({ ...prev, priceListId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma lista" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceLists.map(list => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name} (v{list.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Preço Base (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={simulation.basePrice}
                  onChange={(e) => setSimulation(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                  placeholder="Ex: 100.00"
                />
              </div>

              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={simulation.quantity}
                  onChange={(e) => setSimulation(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  placeholder="Ex: 10"
                />
              </div>

              <div>
                <Label>Categoria do Item</Label>
                <Select 
                  value={simulation.itemCategory} 
                  onValueChange={(value) => setSimulation(prev => ({ ...prev, itemCategory: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="materiais">Materiais</SelectItem>
                    <SelectItem value="servicos">Serviços</SelectItem>
                    <SelectItem value="equipamentos">Equipamentos</SelectItem>
                    <SelectItem value="ferramentas">Ferramentas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={runSimulation} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Simular Preço
              </Button>
            </CardContent>
          </Card>

          {/* Resultado da Simulação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Resultado da Simulação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {simulationResult ? (
                <div className="space-y-4">
                  {/* Resumo dos Preços */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Preço Original</div>
                      <div className="text-lg font-bold">R$ {simulationResult.originalPrice.toFixed(2)}</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Preço Final</div>
                      <div className="text-lg font-bold text-blue-600">R$ {simulationResult.finalPrice.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Ajuste Total */}
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Ajuste Total</div>
                    <div className={`text-lg font-bold ${simulationResult.totalAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {simulationResult.totalAdjustment >= 0 ? '+' : ''}R$ {simulationResult.totalAdjustment.toFixed(2)}
                      <span className="text-sm ml-2">
                        ({simulationResult.adjustmentPercentage >= 0 ? '+' : ''}{simulationResult.adjustmentPercentage.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* Valor Total */}
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Valor Total ({simulation.quantity} unidades)</div>
                    <div className="text-xl font-bold text-green-600">R$ {simulationResult.totalValue.toFixed(2)}</div>
                  </div>

                  <Separator />

                  {/* Regras Aplicadas */}
                  <div>
                    <h4 className="font-medium mb-3">Regras Aplicadas</h4>
                    {simulationResult.appliedRules.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <Info className="w-8 h-8 mx-auto mb-2" />
                        Nenhuma regra foi aplicada
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {simulationResult.appliedRules.map((rule: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                              <span className="text-sm font-medium">{rule.ruleName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{rule.ruleType}</Badge>
                              <span className={`text-sm font-medium ${rule.adjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {rule.adjustmentType === 'percentage' ? 
                                  `${rule.adjustment >= 0 ? '+' : ''}${rule.adjustment.toFixed(2)}%` :
                                  `${rule.adjustment >= 0 ? '+' : ''}R$ ${rule.adjustment.toFixed(2)}`
                                }
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="w-12 h-12 mx-auto mb-4" />
                  <p>Configure os parâmetros e clique em "Simular Preço" para ver o resultado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
