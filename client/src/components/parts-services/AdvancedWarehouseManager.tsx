
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  Truck, 
  BarChart3, 
  Settings, 
  Zap,
  Eye,
  CheckCircle,
  Clock,
  Target,
  Warehouse,
  Route
} from 'lucide-react';

interface Alert {
  id: string;
  alert_type: string;
  alert_priority: string;
  part_title: string;
  part_code: string;
  location_name: string;
  current_quantity: number;
  minimum_stock: number;
  maximum_stock: number;
  message: string;
  status: string;
  created_at: string;
}

interface TransferRule {
  id: string;
  rule_name: string;
  source_location_name: string;
  destination_location_name: string;
  trigger_type: string;
  transfer_quantity: number;
  is_active: boolean;
  created_at: string;
}

interface DemandForecast {
  id: string;
  part_title: string;
  part_code: string;
  location_name: string;
  predicted_demand: number;
  confidence_level: number;
  forecast_date: string;
  historical_average: number;
}

interface TransitItem {
  id: string;
  movement_number: string;
  part_title: string;
  quantity: number;
  source_location_name: string;
  destination_location_name: string;
  status: string;
  carrier_name: string;
  tracking_number: string;
  estimated_arrival: string;
}

interface AbcItem {
  part_title: string;
  part_code: string;
  abc_classification: string;
  total_value_consumed: number;
  percentage_of_total_value: number;
  total_consumption: number;
  current_quantity: number;
}

export const AdvancedWarehouseManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('alerts');
  
  // Estados para formulários
  const [transferRuleForm, setTransferRuleForm] = useState({
    rule_name: '',
    source_location_id: '',
    destination_location_id: '',
    trigger_type: 'LOW_STOCK',
    transfer_quantity: '',
    transfer_quantity_type: 'FIXED'
  });

  const [forecastForm, setForecastForm] = useState({
    part_id: '',
    location_id: '',
    forecast_date: new Date().toISOString().split('T')[0]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // QUERIES
  const { data: alerts = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['/api/parts-services/etapa3/stock-alerts']
  });

  const { data: transferRules = [] } = useQuery({
    queryKey: ['/api/parts-services/etapa3/automated-transfers']
  });

  const { data: forecasts = [] } = useQuery({
    queryKey: ['/api/parts-services/etapa3/demand-forecasts']
  });

  const { data: transitItems = [] } = useQuery({
    queryKey: ['/api/parts-services/etapa3/transit-trackings']
  });

  const { data: abcAnalysis = [] } = useQuery({
    queryKey: ['/api/parts-services/etapa3/abc-analysis']
  });

  const { data: analytics = {} } = useQuery({
    queryKey: ['/api/parts-services/etapa3/analytics/advanced']
  });

  const { data: parts = [] } = useQuery({
    queryKey: ['/api/parts-services/parts']
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['/api/parts-services/etapa1/stock-locations']
  });

  // MUTATIONS
  const createTransferRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/parts-services/etapa3/automated-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao criar regra de transferência');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa3/automated-transfers'] });
      toast({ title: 'Regra de transferência criada com sucesso!' });
      setTransferRuleForm({
        rule_name: '', source_location_id: '', destination_location_id: '',
        trigger_type: 'LOW_STOCK', transfer_quantity: '', transfer_quantity_type: 'FIXED'
      });
    }
  });

  const generateForecastMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/parts-services/etapa3/demand-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: data.part_id,
          locationId: data.location_id,
          forecastDate: data.forecast_date
        })
      });
      if (!response.ok) throw new Error('Erro ao gerar previsão');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa3/demand-forecasts'] });
      toast({ title: 'Previsão de demanda gerada com sucesso!' });
    }
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/parts-services/etapa3/stock-alerts/${alertId}/acknowledge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Erro ao reconhecer alerta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa3/stock-alerts'] });
      toast({ title: 'Alerta reconhecido com sucesso!' });
    }
  });

  const executeTransfersMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/parts-services/etapa3/automated-transfers/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Erro ao executar transferências');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa3/automated-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa2/movements'] });
      toast({ 
        title: 'Transferências executadas!', 
        description: `${data.data?.length || 0} transferências realizadas`
      });
    }
  });

  const generateAbcMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/parts-services/etapa3/abc-analysis/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Erro ao gerar análise ABC');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa3/abc-analysis'] });
      toast({ 
        title: 'Análise ABC gerada!', 
        description: `${data.data?.length || 0} itens analisados`
      });
    }
  });

  // HANDLERS
  const handleCreateTransferRule = () => {
    if (!transferRuleForm.rule_name || !transferRuleForm.source_location_id || !transferRuleForm.destination_location_id) {
      toast({ 
        title: 'Erro de validação', 
        description: 'Nome da regra, origem e destino são obrigatórios',
        variant: 'destructive' 
      });
      return;
    }

    createTransferRuleMutation.mutate({
      ...transferRuleForm,
      transfer_quantity: parseInt(transferRuleForm.transfer_quantity) || 10
    });
  };

  const handleGenerateForecast = () => {
    if (!forecastForm.part_id || !forecastForm.location_id) {
      toast({ 
        title: 'Erro de validação', 
        description: 'Peça e localização são obrigatórios',
        variant: 'destructive' 
      });
      return;
    }

    generateForecastMutation.mutate(forecastForm);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'LOW_STOCK': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'OVERSTOCK': return <Package className="h-4 w-4 text-orange-500" />;
      case 'EXPIRING': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      'CRITICAL': 'destructive',
      'HIGH': 'destructive',
      'MEDIUM': 'secondary',
      'LOW': 'outline'
    } as const;
    
    return <Badge variant={variants[priority as keyof typeof variants] || 'outline'}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { variant: 'destructive' as const, icon: AlertTriangle },
      'ACKNOWLEDGED': { variant: 'secondary' as const, icon: Eye },
      'RESOLVED': { variant: 'default' as const, icon: CheckCircle },
      'IN_TRANSIT': { variant: 'secondary' as const, icon: Truck },
      'DELIVERED': { variant: 'default' as const, icon: CheckCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, icon: AlertTriangle };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sistema Multi-Armazém Avançado</h2>
        <div className="flex items-center gap-2">
          <Warehouse className="h-6 w-6" />
          <span className="text-sm text-muted-foreground">Etapa 3 - Analytics & Automação</span>
        </div>
      </div>

      {/* Dashboard Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertas Ativos</p>
                <p className="text-2xl font-bold">{analytics.active_alerts || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Itens em Trânsito</p>
                <p className="text-2xl font-bold">{analytics.items_in_transit || 0}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Regras Ativas</p>
                <p className="text-2xl font-bold">{analytics.active_transfer_rules || 0}</p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilização Média</p>
                <p className="text-2xl font-bold">{(analytics.avg_capacity_utilization || 0).toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="transfers">
            <Route className="h-4 w-4 mr-2" />
            Transferências
          </TabsTrigger>
          <TabsTrigger value="forecasts">
            <TrendingUp className="h-4 w-4 mr-2" />
            Previsões
          </TabsTrigger>
          <TabsTrigger value="transit">
            <Truck className="h-4 w-4 mr-2" />
            Trânsito
          </TabsTrigger>
          <TabsTrigger value="abc">
            <Target className="h-4 w-4 mr-2" />
            Análise ABC
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Settings className="h-4 w-4 mr-2" />
            Automação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Estoque Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4">Tipo</th>
                      <th className="text-left p-4">Prioridade</th>
                      <th className="text-left p-4">Peça</th>
                      <th className="text-left p-4">Local</th>
                      <th className="text-center p-4">Atual</th>
                      <th className="text-center p-4">Mín/Máx</th>
                      <th className="text-left p-4">Mensagem</th>
                      <th className="text-center p-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingAlerts ? (
                      <tr>
                        <td colSpan={8} className="text-center p-8">
                          Carregando alertas...
                        </td>
                      </tr>
                    ) : alerts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center p-8 text-muted-foreground">
                          Nenhum alerta ativo
                        </td>
                      </tr>
                    ) : (
                      alerts.map((alert: Alert) => (
                        <tr key={alert.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {getAlertIcon(alert.alert_type)}
                              <span className="capitalize">{alert.alert_type.replace('_', ' ').toLowerCase()}</span>
                            </div>
                          </td>
                          <td className="p-4">{getPriorityBadge(alert.alert_priority)}</td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{alert.part_code}</div>
                              <div className="text-xs text-muted-foreground">{alert.part_title}</div>
                            </div>
                          </td>
                          <td className="p-4">{alert.location_name}</td>
                          <td className="p-4 text-center font-mono">{alert.current_quantity}</td>
                          <td className="p-4 text-center font-mono text-xs">
                            {alert.minimum_stock && alert.maximum_stock ? 
                              `${alert.minimum_stock} / ${alert.maximum_stock}` : '-'
                            }
                          </td>
                          <td className="p-4 text-xs">{alert.message}</td>
                          <td className="p-4 text-center">
                            {alert.status === 'ACTIVE' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                                disabled={acknowledgeAlertMutation.isPending}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Reconhecer
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Criar Regra de Transferência Automática
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome da Regra *</label>
                  <Input
                    value={transferRuleForm.rule_name}
                    onChange={(e) => setTransferRuleForm(f => ({ ...f, rule_name: e.target.value }))}
                    placeholder="Ex: Rebalanceamento Automático"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Tipo de Gatilho</label>
                  <Select value={transferRuleForm.trigger_type} onValueChange={(value) => setTransferRuleForm(f => ({ ...f, trigger_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW_STOCK">Estoque Baixo</SelectItem>
                      <SelectItem value="OVERSTOCK">Estoque Alto</SelectItem>
                      <SelectItem value="SCHEDULED">Agendado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Local de Origem *</label>
                  <Select value={transferRuleForm.source_location_id} onValueChange={(value) => setTransferRuleForm(f => ({ ...f, source_location_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location: any) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.location_code} - {location.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Local de Destino *</label>
                  <Select value={transferRuleForm.destination_location_id} onValueChange={(value) => setTransferRuleForm(f => ({ ...f, destination_location_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.filter(loc => loc.id !== transferRuleForm.source_location_id).map((location: any) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.location_code} - {location.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Quantidade a Transferir</label>
                  <Input
                    type="number"
                    value={transferRuleForm.transfer_quantity}
                    onChange={(e) => setTransferRuleForm(f => ({ ...f, transfer_quantity: e.target.value }))}
                    placeholder="Ex: 20"
                  />
                </div>
              </div>

              <Button 
                onClick={handleCreateTransferRule}
                disabled={createTransferRuleMutation.isPending}
                className="w-full"
              >
                {createTransferRuleMutation.isPending ? 'Criando...' : 'Criar Regra de Transferência'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Regras de Transferência Configuradas</CardTitle>
                <Button 
                  onClick={() => executeTransfersMutation.mutate()}
                  disabled={executeTransfersMutation.isPending}
                  variant="outline"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {executeTransfersMutation.isPending ? 'Executando...' : 'Executar Transferências'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4">Nome da Regra</th>
                      <th className="text-left p-4">Origem → Destino</th>
                      <th className="text-left p-4">Gatilho</th>
                      <th className="text-center p-4">Quantidade</th>
                      <th className="text-center p-4">Status</th>
                      <th className="text-left p-4">Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferRules.map((rule: TransferRule) => (
                      <tr key={rule.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{rule.rule_name}</td>
                        <td className="p-4 text-xs">
                          {rule.source_location_name} → {rule.destination_location_name}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">
                            {rule.trigger_type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-4 text-center font-mono">{rule.transfer_quantity}</td>
                        <td className="p-4 text-center">
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {new Date(rule.created_at).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Gerar Previsão de Demanda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Peça *</label>
                  <Select value={forecastForm.part_id} onValueChange={(value) => setForecastForm(f => ({ ...f, part_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a peça" />
                    </SelectTrigger>
                    <SelectContent>
                      {parts.map((part: any) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.internal_code} - {part.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Localização *</label>
                  <Select value={forecastForm.location_id} onValueChange={(value) => setForecastForm(f => ({ ...f, location_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a localização" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location: any) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.location_code} - {location.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Data da Previsão</label>
                  <Input
                    type="date"
                    value={forecastForm.forecast_date}
                    onChange={(e) => setForecastForm(f => ({ ...f, forecast_date: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleGenerateForecast}
                disabled={generateForecastMutation.isPending}
                className="w-full"
              >
                {generateForecastMutation.isPending ? 'Gerando...' : 'Gerar Previsão de Demanda'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Previsões de Demanda Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4">Peça</th>
                      <th className="text-left p-4">Local</th>
                      <th className="text-center p-4">Demanda Prevista</th>
                      <th className="text-center p-4">Confiança</th>
                      <th className="text-center p-4">Média Histórica</th>
                      <th className="text-left p-4">Data da Previsão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecasts.map((forecast: DemandForecast) => (
                      <tr key={forecast.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{forecast.part_code}</div>
                            <div className="text-xs text-muted-foreground">{forecast.part_title}</div>
                          </div>
                        </td>
                        <td className="p-4">{forecast.location_name}</td>
                        <td className="p-4 text-center font-mono text-lg font-bold text-blue-600">
                          {forecast.predicted_demand}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant={forecast.confidence_level >= 80 ? 'default' : forecast.confidence_level >= 60 ? 'secondary' : 'outline'}>
                            {forecast.confidence_level.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-4 text-center font-mono">
                          {forecast.historical_average.toFixed(1)}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {new Date(forecast.forecast_date).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Itens em Trânsito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4">Movimento</th>
                      <th className="text-left p-4">Peça</th>
                      <th className="text-center p-4">Qtd</th>
                      <th className="text-left p-4">Rota</th>
                      <th className="text-left p-4">Transportadora</th>
                      <th className="text-left p-4">Rastreamento</th>
                      <th className="text-center p-4">Status</th>
                      <th className="text-left p-4">Chegada Prevista</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transitItems.map((item: TransitItem) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-mono text-xs">{item.movement_number}</td>
                        <td className="p-4">
                          <div className="text-xs text-muted-foreground">{item.part_title}</div>
                        </td>
                        <td className="p-4 text-center font-mono">{item.quantity}</td>
                        <td className="p-4 text-xs">
                          {item.source_location_name} → {item.destination_location_name}
                        </td>
                        <td className="p-4">{item.carrier_name || '-'}</td>
                        <td className="p-4 font-mono text-xs">{item.tracking_number || '-'}</td>
                        <td className="p-4 text-center">{getStatusBadge(item.status)}</td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {item.estimated_arrival ? new Date(item.estimated_arrival).toLocaleString('pt-BR') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abc" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Análise ABC Automatizada
                </CardTitle>
                <Button 
                  onClick={() => generateAbcMutation.mutate()}
                  disabled={generateAbcMutation.isPending}
                  variant="outline"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {generateAbcMutation.isPending ? 'Gerando...' : 'Gerar Análise ABC'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">A</div>
                      <div className="text-sm text-muted-foreground">Alto Valor</div>
                      <div className="text-lg font-medium">{analytics.class_a_items || 0} itens</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">B</div>
                      <div className="text-sm text-muted-foreground">Médio Valor</div>
                      <div className="text-lg font-medium">{analytics.class_b_items || 0} itens</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">C</div>
                      <div className="text-sm text-muted-foreground">Baixo Valor</div>
                      <div className="text-lg font-medium">{analytics.class_c_items || 0} itens</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4">Peça</th>
                      <th className="text-center p-4">Classificação</th>
                      <th className="text-right p-4">Valor Consumido</th>
                      <th className="text-center p-4">% do Total</th>
                      <th className="text-center p-4">Consumo Total</th>
                      <th className="text-center p-4">Estoque Atual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abcAnalysis.map((item: AbcItem, index: number) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{item.part_code}</div>
                            <div className="text-xs text-muted-foreground">{item.part_title}</div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant={
                            item.abc_classification === 'A' ? 'destructive' : 
                            item.abc_classification === 'B' ? 'secondary' : 'outline'
                          }>
                            Classe {item.abc_classification}
                          </Badge>
                        </td>
                        <td className="p-4 text-right font-mono">
                          {formatCurrency(item.total_value_consumed)}
                        </td>
                        <td className="p-4 text-center font-mono">
                          {item.percentage_of_total_value.toFixed(1)}%
                        </td>
                        <td className="p-4 text-center font-mono">{item.total_consumption}</td>
                        <td className="p-4 text-center font-mono">{item.current_quantity || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Central de Automação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => executeTransfersMutation.mutate()}
                  disabled={executeTransfersMutation.isPending}
                  size="lg"
                  className="h-20"
                >
                  <div className="flex flex-col items-center">
                    <Zap className="h-6 w-6 mb-2" />
                    <span>Executar Transferências Automáticas</span>
                  </div>
                </Button>

                <Button 
                  onClick={() => generateAbcMutation.mutate()}
                  disabled={generateAbcMutation.isPending}
                  variant="outline"
                  size="lg"
                  className="h-20"
                >
                  <div className="flex flex-col items-center">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span>Gerar Análise ABC</span>
                  </div>
                </Button>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Status da Automação</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Regras de transferência ativas:</span>
                    <Badge variant="outline">{analytics.active_transfer_rules || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Alertas gerados hoje:</span>
                    <Badge variant="outline">{analytics.forecasts_today || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Utilização média de capacidade:</span>
                    <Badge variant="outline">{(analytics.avg_capacity_utilization || 0).toFixed(1)}%</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
