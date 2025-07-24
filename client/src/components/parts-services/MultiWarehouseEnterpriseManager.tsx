
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  Warehouse, Truck, Package, TrendingUp, MapPin, Clock, 
  AlertTriangle, CheckCircle, ArrowUpDown, Navigation,
  BarChart3, PieChart as PieChartIcon, Activity, Target
} from 'lucide-react';

interface WarehouseCapacity {
  id: string;
  location_name: string;
  total_capacity: number;
  used_capacity: number;
  utilization_percentage: number;
  max_weight: number;
  current_weight: number;
  location_type: string;
}

interface TransferOrder {
  id: string;
  transfer_number: string;
  from_location_name: string;
  to_location_name: string;
  status: string;
  priority: string;
  total_items: number;
  total_quantity: number;
  created_at: string;
}

interface ReturnWorkflow {
  id: string;
  return_number: string;
  part_name: string;
  quantity: number;
  return_reason: string;
  status: string;
  item_condition: string;
  created_at: string;
}

interface WarehouseAnalytics {
  id: string;
  location_name: string;
  analytics_date: string;
  total_items: number;
  total_value: number;
  utilization_rate: number;
  items_received: number;
  items_shipped: number;
}

interface MultiWarehouseStats {
  total_locations: number;
  total_transfers: number;
  total_returns: number;
  avg_utilization: number;
  total_inventory_value: number;
  pending_transfers: number;
  pending_returns: number;
}

export const MultiWarehouseEnterpriseManager: React.FC = () => {
  // Estados
  const [warehouseCapacities, setWarehouseCapacities] = useState<WarehouseCapacity[]>([]);
  const [transferOrders, setTransferOrders] = useState<TransferOrder[]>([]);
  const [returnWorkflows, setReturnWorkflows] = useState<ReturnWorkflow[]>([]);
  const [warehouseAnalytics, setWarehouseAnalytics] = useState<WarehouseAnalytics[]>([]);
  const [multiWarehouseStats, setMultiWarehouseStats] = useState<MultiWarehouseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Cores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const [capacitiesRes, transfersRes, returnsRes, analyticsRes, statsRes] = await Promise.all([
        fetch('/api/parts-services/etapa5/warehouse-capacities', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/parts-services/etapa5/transfer-orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/parts-services/etapa5/return-workflows', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/parts-services/etapa5/warehouse-analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/parts-services/etapa5/multi-warehouse-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [capacities, transfers, returns, analytics, stats] = await Promise.all([
        capacitiesRes.json(),
        transfersRes.json(),
        returnsRes.json(),
        analyticsRes.json(),
        statsRes.json()
      ]);

      setWarehouseCapacities(capacities);
      setTransferOrders(transfers);
      setReturnWorkflows(returns);
      setWarehouseAnalytics(analytics);
      setMultiWarehouseStats(stats);
    } catch (error) {
      console.error('Error loading multi-warehouse data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'yellow',
      approved: 'blue',
      in_transit: 'purple',
      delivered: 'green',
      cancelled: 'red',
      completed: 'green'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'green',
      normal: 'blue',
      high: 'yellow',
      urgent: 'red'
    };
    return colors[priority as keyof typeof colors] || 'gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando sistema multi-armazém...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Sistema Multi-Armazém Enterprise
          </h2>
          <p className="text-gray-600">
            Gestão avançada de múltiplos armazéns com analytics em tempo real
          </p>
        </div>
        <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700">
          <Activity className="h-4 w-4 mr-2" />
          Atualizar Dados
        </Button>
      </div>

      {/* KPIs Gerais */}
      {multiWarehouseStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Warehouse className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Localizações</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {multiWarehouseStats.total_locations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Truck className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Transferências</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {multiWarehouseStats.total_transfers}
                  </p>
                  <p className="text-xs text-red-600">
                    {multiWarehouseStats.pending_transfers} pendentes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Devoluções</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {multiWarehouseStats.total_returns}
                  </p>
                  <p className="text-xs text-red-600">
                    {multiWarehouseStats.pending_returns} pendentes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Utilização Média</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {multiWarehouseStats.avg_utilization?.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600">
                    Valor: R$ {multiWarehouseStats.total_inventory_value?.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="capacities">Capacidades</TabsTrigger>
          <TabsTrigger value="transfers">Transferências</TabsTrigger>
          <TabsTrigger value="returns">Devoluções</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Utilização de Armazéns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Utilização de Armazéns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={warehouseCapacities}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="location_name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="utilization_percentage" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição de Status de Transferências */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2" />
                  Status das Transferências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        transferOrders.reduce((acc, order) => {
                          acc[order.status] = (acc[order.status] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([status, count]) => ({ status, count }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {Object.entries(
                        transferOrders.reduce((acc, order) => {
                          acc[order.status] = (acc[order.status] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Capacidades de Armazém */}
        <TabsContent value="capacities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capacidades dos Armazéns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {warehouseCapacities.map((capacity) => (
                  <div key={capacity.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{capacity.location_name}</h3>
                        <p className="text-sm text-gray-600">{capacity.location_type}</p>
                      </div>
                      <Badge variant={capacity.utilization_percentage > 90 ? "destructive" : 
                                   capacity.utilization_percentage > 70 ? "default" : "secondary"}>
                        {capacity.utilization_percentage.toFixed(1)}% utilizado
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Capacidade Volumétrica:</span>
                        <span>{capacity.used_capacity} / {capacity.total_capacity} m³</span>
                      </div>
                      <Progress value={capacity.utilization_percentage} className="w-full" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Peso:</span>
                        <span>{capacity.current_weight} / {capacity.max_weight} kg</span>
                      </div>
                      <Progress 
                        value={(capacity.current_weight / capacity.max_weight) * 100} 
                        className="w-full" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ordens de Transferência */}
        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Ordens de Transferência</CardTitle>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Truck className="h-4 w-4 mr-2" />
                  Nova Transferência
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transferOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{order.transfer_number}</h3>
                        <p className="text-sm text-gray-600">
                          {order.from_location_name} → {order.to_location_name}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge color={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                        <Badge color={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Itens:</span> {order.total_items}
                      </div>
                      <div>
                        <span className="font-medium">Quantidade:</span> {order.total_quantity}
                      </div>
                      <div>
                        <span className="font-medium">Criado em:</span> {
                          new Date(order.created_at).toLocaleDateString()
                        }
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-3 space-x-2">
                      <Button variant="outline" size="sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        Rastrear
                      </Button>
                      <Button variant="outline" size="sm">
                        <ArrowUpDown className="h-4 w-4 mr-1" />
                        Atualizar Status
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow de Devoluções */}
        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Workflow de Devoluções</CardTitle>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Package className="h-4 w-4 mr-2" />
                  Nova Devolução
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {returnWorkflows.map((returnItem) => (
                  <div key={returnItem.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{returnItem.return_number}</h3>
                        <p className="text-sm text-gray-600">{returnItem.part_name}</p>
                      </div>
                      <Badge color={getStatusColor(returnItem.status)}>
                        {returnItem.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Quantidade:</span> {returnItem.quantity}
                      </div>
                      <div>
                        <span className="font-medium">Condição:</span> {returnItem.item_condition}
                      </div>
                      <div>
                        <span className="font-medium">Motivo:</span> {returnItem.return_reason}
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-3 space-x-2">
                      {returnItem.status === 'pending' && (
                        <>
                          <Button variant="outline" size="sm" className="text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Avançados */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tendência de Movimentação */}
            <Card>
              <CardHeader>
                <CardTitle>Movimentação por Local</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={warehouseAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="location_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="items_received" stroke="#10B981" name="Recebidos" />
                    <Line type="monotone" dataKey="items_shipped" stroke="#EF4444" name="Enviados" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Valor do Inventário */}
            <Card>
              <CardHeader>
                <CardTitle>Valor do Inventário por Local</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={warehouseAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="location_name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString()}`, 'Valor']} />
                    <Bar dataKey="total_value" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Métricas Detalhadas */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas Detalhadas por Armazém</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Local
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Itens Totais
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilização
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recebidos/Enviados
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {warehouseAnalytics.map((analytics) => (
                      <tr key={analytics.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {analytics.location_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {analytics.total_items}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          R$ {Number(analytics.total_value).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 mr-2">
                              <Progress value={analytics.utilization_rate} />
                            </div>
                            <span className="text-sm text-gray-500">
                              {analytics.utilization_rate?.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="text-green-600">+{analytics.items_received}</span>
                          {' / '}
                          <span className="text-red-600">-{analytics.items_shipped}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiWarehouseEnterpriseManager;
