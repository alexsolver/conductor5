
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Package, TrendingUp, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';

interface StockMovement {
  id: string;
  movementNumber: string;
  movementType: string;
  partId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  status: string;
  requestedDate: string;
  approvedDate?: string;
  executedDate?: string;
  notes?: string;
}

interface ABCAnalysis {
  id: string;
  partId: string;
  abcClassification: string;
  totalValueMoved: number;
  averageMonthlyConsumption: number;
  valuePercentage: number;
}

interface StockAlert {
  id: string;
  partId: string;
  alertType: string;
  severity: string;
  alertTitle: string;
  alertDescription: string;
  currentQuantity: number;
  thresholdQuantity: number;
  status: string;
}

interface DashboardStats {
  pending_movements: number;
  today_movements: number;
  active_alerts: number;
  critical_alerts: number;
  parts_with_abc: number;
  active_forecasts: number;
  avg_forecast_accuracy: number;
  monthly_consumption_value: number;
}

export const RealStockMovementsManager: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [abcAnalysis, setAbcAnalysis] = useState<ABCAnalysis[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateMovement, setShowCreateMovement] = useState(false);
  const [showRunABC, setShowRunABC] = useState(false);
  const { toast } = useToast();

  // Novos movimento form state
  const [newMovement, setNewMovement] = useState({
    movementType: 'OUT',
    partId: '',
    fromLocationId: '',
    toLocationId: '',
    quantity: 0,
    unitCost: 0,
    batchNumber: '',
    notes: ''
  });

  // ABC Analysis form state
  const [abcPeriod, setAbcPeriod] = useState({
    periodStart: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMovements(),
        loadABCAnalysis(),
        loadAlerts(),
        loadStats()
      ]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/parts-services/etapa7/stock-movements-real', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setMovements(data.data || []);
    }
  };

  const loadABCAnalysis = async () => {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/parts-services/etapa7/abc-analysis', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setAbcAnalysis(data.data || []);
    }
  };

  const loadAlerts = async () => {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/parts-services/etapa7/stock-alerts', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setAlerts(data.data || []);
    }
  };

  const loadStats = async () => {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/parts-services/etapa7/dashboard-stats-etapa7', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setStats(data.data);
    }
  };

  const handleCreateMovement = async () => {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/parts-services/etapa7/stock-movements-real', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...newMovement,
        totalCost: newMovement.quantity * newMovement.unitCost
      })
    });

    if (response.ok) {
      toast({
        title: "Sucesso",
        description: "Movimentação criada com sucesso"
      });
      setShowCreateMovement(false);
      setNewMovement({
        movementType: 'OUT',
        partId: '',
        fromLocationId: '',
        toLocationId: '',
        quantity: 0,
        unitCost: 0,
        batchNumber: '',
        notes: ''
      });
      loadMovements();
    } else {
      toast({
        title: "Erro",
        description: "Falha ao criar movimentação",
        variant: "destructive"
      });
    }
  };

  const handleApproveMovement = async (movementId: string) => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`/api/parts-services/etapa7/stock-movements-real/${movementId}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      toast({
        title: "Sucesso",
        description: "Movimentação aprovada"
      });
      loadMovements();
    }
  };

  const handleExecuteMovement = async (movementId: string) => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`/api/parts-services/etapa7/stock-movements-real/${movementId}/execute`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      toast({
        title: "Sucesso",
        description: "Movimentação executada"
      });
      loadMovements();
    }
  };

  const handleRunABCAnalysis = async () => {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/parts-services/etapa7/abc-analysis/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(abcPeriod)
    });

    if (response.ok) {
      toast({
        title: "Sucesso",
        description: "Análise ABC executada com sucesso"
      });
      setShowRunABC(false);
      loadABCAnalysis();
    } else {
      toast({
        title: "Erro",
        description: "Falha ao executar análise ABC",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'executed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getAlertSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Movimentações Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_movements}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Movimentações Hoje</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today_movements}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_alerts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.critical_alerts} críticos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consumo Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {parseFloat(stats.monthly_consumption_value?.toString() || '0').toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="movements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="abc">Análise ABC</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Movimentações de Estoque</h3>
            <Dialog open={showCreateMovement} onOpenChange={setShowCreateMovement}>
              <DialogTrigger asChild>
                <Button>Nova Movimentação</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Movimentação</DialogTitle>
                  <DialogDescription>
                    Criar uma nova movimentação de estoque
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="movementType">Tipo de Movimentação</Label>
                    <Select
                      value={newMovement.movementType}
                      onValueChange={(value) => setNewMovement({...newMovement, movementType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN">Entrada</SelectItem>
                        <SelectItem value="OUT">Saída</SelectItem>
                        <SelectItem value="TRANSFER">Transferência</SelectItem>
                        <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="partId">ID da Peça</Label>
                    <Input
                      id="partId"
                      value={newMovement.partId}
                      onChange={(e) => setNewMovement({...newMovement, partId: e.target.value})}
                      placeholder="ID da peça"
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newMovement.quantity}
                      onChange={(e) => setNewMovement({...newMovement, quantity: parseFloat(e.target.value)})}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="unitCost">Custo Unitário</Label>
                    <Input
                      id="unitCost"
                      type="number"
                      step="0.01"
                      value={newMovement.unitCost}
                      onChange={(e) => setNewMovement({...newMovement, unitCost: parseFloat(e.target.value)})}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="batchNumber">Número do Lote</Label>
                    <Input
                      id="batchNumber"
                      value={newMovement.batchNumber}
                      onChange={(e) => setNewMovement({...newMovement, batchNumber: e.target.value})}
                      placeholder="LOTE-001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={newMovement.notes}
                      onChange={(e) => setNewMovement({...newMovement, notes: e.target.value})}
                      placeholder="Observações sobre a movimentação..."
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateMovement(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateMovement}>
                      Criar Movimentação
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {movements.map((movement) => (
              <Card key={movement.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{movement.movementNumber}</CardTitle>
                      <CardDescription>
                        {movement.movementType} - {movement.quantity} unidades
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(movement.status)}>
                      {movement.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Valor Total:</strong> R$ {movement.totalCost?.toFixed(2)}
                    </div>
                    <div>
                      <strong>Data:</strong> {new Date(movement.requestedDate).toLocaleDateString()}
                    </div>
                  </div>
                  {movement.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{movement.notes}</p>
                  )}
                  {movement.status === 'pending' && (
                    <div className="flex space-x-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => handleApproveMovement(movement.id)}
                      >
                        Aprovar
                      </Button>
                    </div>
                  )}
                  {movement.status === 'approved' && (
                    <div className="flex space-x-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => handleExecuteMovement(movement.id)}
                      >
                        Executar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="abc" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Análise ABC</h3>
            <Dialog open={showRunABC} onOpenChange={setShowRunABC}>
              <DialogTrigger asChild>
                <Button>Executar Análise ABC</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Executar Análise ABC</DialogTitle>
                  <DialogDescription>
                    Definir período para análise ABC
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="periodStart">Data Inicial</Label>
                    <Input
                      id="periodStart"
                      type="date"
                      value={abcPeriod.periodStart}
                      onChange={(e) => setAbcPeriod({...abcPeriod, periodStart: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodEnd">Data Final</Label>
                    <Input
                      id="periodEnd"
                      type="date"
                      value={abcPeriod.periodEnd}
                      onChange={(e) => setAbcPeriod({...abcPeriod, periodEnd: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowRunABC(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleRunABCAnalysis}>
                      Executar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {abcAnalysis.map((analysis) => (
              <Card key={analysis.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">Peça: {analysis.partId}</CardTitle>
                      <CardDescription>
                        Consumo médio mensal: {analysis.averageMonthlyConsumption?.toFixed(2)} unidades
                      </CardDescription>
                    </div>
                    <Badge variant={
                      analysis.abcClassification === 'A' ? 'destructive' :
                      analysis.abcClassification === 'B' ? 'default' : 'secondary'
                    }>
                      Classe {analysis.abcClassification}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Valor Movimentado:</strong> R$ {analysis.totalValueMoved?.toFixed(2)}
                    </div>
                    <div>
                      <strong>% do Valor:</strong> {analysis.valuePercentage?.toFixed(1)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <h3 className="text-lg font-semibold">Alertas de Estoque</h3>
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <Alert key={alert.id} className={
                alert.severity === 'critical' ? 'border-red-500' :
                alert.severity === 'high' ? 'border-orange-500' : ''
              }>
                <AlertTriangle className="h-4 w-4" />
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{alert.alertTitle}</h4>
                    <AlertDescription className="mt-1">
                      {alert.alertDescription}
                    </AlertDescription>
                    <div className="flex space-x-4 mt-2 text-sm">
                      <span>Atual: {alert.currentQuantity}</span>
                      <span>Limite: {alert.thresholdQuantity}</span>
                    </div>
                  </div>
                  <Badge variant={getAlertSeverityVariant(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
