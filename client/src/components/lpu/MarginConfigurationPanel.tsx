
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Percent, Target, TrendingUp, Settings } from "lucide-react";

interface MarginConfigurationPanelProps {
  priceListId: string;
  onSave: (margins: any[]) => void;
}

export default function MarginConfigurationPanel({
  priceListId,
  onSave
}: MarginConfigurationPanelProps) {
  const [margins, setMargins] = useState([
    { category: 'materiais', baseMargin: 15, dynamicMargin: true, minMargin: 5, maxMargin: 50 },
    { category: 'servicos', baseMargin: 25, dynamicMargin: true, minMargin: 10, maxMargin: 60 },
    { category: 'equipamentos', baseMargin: 20, dynamicMargin: false, minMargin: 8, maxMargin: 40 }
  ]);

  const [seasonalFactors, setSeasonalFactors] = useState([
    { month: 'Janeiro', factor: 1.0 },
    { month: 'Fevereiro', factor: 1.0 },
    { month: 'Março', factor: 1.05 },
    { month: 'Abril', factor: 1.1 },
    { month: 'Maio', factor: 1.15 },
    { month: 'Junho', factor: 1.2 },
    { month: 'Julho', factor: 1.2 },
    { month: 'Agosto', factor: 1.15 },
    { month: 'Setembro', factor: 1.1 },
    { month: 'Outubro', factor: 1.05 },
    { month: 'Novembro', factor: 1.0 },
    { month: 'Dezembro', factor: 0.95 }
  ]);

  const [demandFactors, setDemandFactors] = useState([
    { level: 'Muito Baixa', factor: 0.8, description: 'Demanda muito baixa - desconto agressivo' },
    { level: 'Baixa', factor: 0.9, description: 'Demanda baixa - desconto moderado' },
    { level: 'Normal', factor: 1.0, description: 'Demanda normal - sem ajuste' },
    { level: 'Alta', factor: 1.1, description: 'Demanda alta - markup moderado' },
    { level: 'Muito Alta', factor: 1.2, description: 'Demanda muito alta - markup premium' }
  ]);

  const addMarginCategory = () => {
    setMargins([...margins, {
      category: '',
      baseMargin: 15,
      dynamicMargin: true,
      minMargin: 5,
      maxMargin: 50
    }]);
  };

  const removeMarginCategory = (index: number) => {
    setMargins(margins.filter((_, i) => i !== index));
  };

  const updateMargin = (index: number, field: string, value: any) => {
    const newMargins = [...margins];
    newMargins[index] = { ...newMargins[index], [field]: value };
    setMargins(newMargins);
  };

  const updateSeasonalFactor = (index: number, factor: number) => {
    const newFactors = [...seasonalFactors];
    newFactors[index] = { ...newFactors[index], factor };
    setSeasonalFactors(newFactors);
  };

  const updateDemandFactor = (index: number, factor: number) => {
    const newFactors = [...demandFactors];
    newFactors[index] = { ...newFactors[index], factor };
    setDemandFactors(newFactors);
  };

  const handleSave = () => {
    const marginConfiguration = {
      priceListId,
      categoryMargins: margins,
      seasonalFactors,
      demandFactors,
      updatedAt: new Date().toISOString()
    };
    onSave(marginConfiguration);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Configuração de Margens</h3>
        <Button onClick={handleSave}>
          <Settings className="mr-2 h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Margens por Categoria</TabsTrigger>
          <TabsTrigger value="seasonal">Fatores Sazonais</TabsTrigger>
          <TabsTrigger value="demand">Fatores de Demanda</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Percent className="mr-2 h-4 w-4" />
                  Margens por Categoria
                </span>
                <Button onClick={addMarginCategory} size="sm">
                  <Plus className="mr-1 h-3 w-3" />
                  Adicionar Categoria
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {margins.map((margin, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Select
                          value={margin.category}
                          onValueChange={(value) => updateMargin(index, 'category', value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="materiais">Materiais</SelectItem>
                            <SelectItem value="servicos">Serviços</SelectItem>
                            <SelectItem value="equipamentos">Equipamentos</SelectItem>
                            <SelectItem value="ferramentas">Ferramentas</SelectItem>
                            <SelectItem value="manutencao">Manutenção</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={margin.dynamicMargin}
                            onCheckedChange={(checked) => updateMargin(index, 'dynamicMargin', checked)}
                          />
                          <Label className="text-sm">Margem Dinâmica</Label>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMarginCategory(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm">Margem Base (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={margin.baseMargin}
                          onChange={(e) => updateMargin(index, 'baseMargin', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Margem Mínima (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={margin.minMargin}
                          onChange={(e) => updateMargin(index, 'minMargin', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Margem Máxima (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={margin.maxMargin}
                          onChange={(e) => updateMargin(index, 'maxMargin', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>

                    {margin.dynamicMargin && (
                      <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                        <p className="text-sm text-blue-700">
                          <TrendingUp className="inline w-4 h-4 mr-1" />
                          Margem dinâmica ativada - será ajustada automaticamente baseada em fatores sazonais e de demanda
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-4 w-4" />
                Fatores Sazonais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {seasonalFactors.map((factor, index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-sm font-medium">{factor.month}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={factor.factor}
                      onChange={(e) => updateSeasonalFactor(index, parseFloat(e.target.value))}
                      className="text-center"
                    />
                    <div className="text-center">
                      <Badge 
                        variant={factor.factor > 1 ? "default" : factor.factor < 1 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {factor.factor > 1 ? '+' : ''}{((factor.factor - 1) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-sm text-muted-foreground">
                <p><strong>Exemplo:</strong> Fator 1.2 = +20% na margem, Fator 0.9 = -10% na margem</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demand" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Fatores de Demanda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demandFactors.map((demand, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{demand.level}</div>
                      <div className="text-sm text-muted-foreground">{demand.description}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={demand.factor}
                        onChange={(e) => updateDemandFactor(index, parseFloat(e.target.value))}
                        className="w-20 text-center"
                      />
                      <Badge 
                        variant={demand.factor > 1 ? "default" : demand.factor < 1 ? "destructive" : "secondary"}
                      >
                        {demand.factor > 1 ? '+' : ''}{((demand.factor - 1) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
