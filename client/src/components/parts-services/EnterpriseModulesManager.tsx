
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Building, Shield, Smartphone, TrendingUp, AlertTriangle, CheckCircle,
  DollarSign, FileText, Settings, Users, Clock, MapPin, Wrench,
  Award, Eye, Database, Wifi, WifiOff, Sync, Activity
} from 'lucide-react';

interface AssetEnterprise {
  id: string;
  assetNumber: string;
  name: string;
  category: string;
  status: string;
  conditionRating: string;
  acquisitionCost?: number;
  currentValue?: number;
  assignedTo?: string;
  nextMaintenanceDate?: string;
  createdAt: string;
}

interface PriceListEnterprise {
  id: string;
  code: string;
  name: string;
  version: string;
  status: string;
  validFrom: string;
  validTo?: string;
  isCurrentVersion: boolean;
  createdAt: string;
}

interface ComplianceAlert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  dueDate?: string;
  createdAt: string;
}

interface DashboardStatsEtapa6 {
  total_assets: number;
  assets_in_maintenance: number;
  active_price_lists: number;
  open_compliance_alerts: number;
  active_certifications: number;
  registered_devices: number;
  pending_sync_items: number;
  avg_asset_condition: number;
}

export const EnterpriseModulesManager: React.FC = () => {
  // Estados
  const [assetsEnterprise, setAssetsEnterprise] = useState<AssetEnterprise[]>([]);
  const [priceListsEnterprise, setPriceListsEnterprise] = useState<PriceListEnterprise[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsEtapa6 | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const [assetsRes, priceListsRes, alertsRes, statsRes] = await Promise.all([
        fetch('/api/parts-services/etapa6/assets-enterprise', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/parts-services/etapa6/price-lists-enterprise', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/parts-services/etapa6/compliance-alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/parts-services/etapa6/dashboard-stats-etapa6', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [assets, priceLists, alerts, stats] = await Promise.all([
        assetsRes.json(),
        priceListsRes.json(),
        alertsRes.json(),
        statsRes.json()
      ]);

      setAssetsEnterprise(assets.data || []);
      setPriceListsEnterprise(priceLists.data || []);
      setComplianceAlerts(alerts.data || []);
      setDashboardStats(stats.data);
    } catch (error) {
      console.error('Error loading enterprise modules data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'green',
      medium: 'yellow',
      high: 'orange',
      critical: 'red'
    };
    return colors[severity as keyof typeof colors] || 'gray';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'green',
      maintenance: 'yellow',
      disposed: 'red',
      draft: 'gray',
      approved: 'blue',
      open: 'red',
      resolved: 'green'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando módulos enterprise...</p>
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
            Módulos Enterprise Avançados
          </h2>
          <p className="text-gray-600">
            Controle de Ativos, LPU Enterprise, Compliance e Mobile
          </p>
        </div>
        <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700">
          <Activity className="h-4 w-4 mr-2" />
          Atualizar Dados
        </Button>
      </div>

      {/* KPIs Enterprise */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Ativos Totais</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardStats.total_assets}
                  </p>
                  <p className="text-xs text-yellow-600">
                    {dashboardStats.assets_in_maintenance} em manutenção
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Listas de Preços</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardStats.active_price_lists}
                  </p>
                  <p className="text-xs text-green-600">Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Compliance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardStats.open_compliance_alerts}
                  </p>
                  <p className="text-xs text-red-600">Alertas abertos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Smartphone className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Dispositivos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardStats.registered_devices}
                  </p>
                  <p className="text-xs text-purple-600">
                    {dashboardStats.pending_sync_items} pendentes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="assets">Ativos</TabsTrigger>
          <TabsTrigger value="pricing">LPU Enterprise</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Dashboard Executive */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Condição Média dos Ativos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Condição Média dos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {dashboardStats?.avg_asset_condition?.toFixed(1) || '0'}/5.0
                  </div>
                  <Progress 
                    value={(dashboardStats?.avg_asset_condition || 0) * 20} 
                    className="w-full mb-4" 
                  />
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div className="text-center">
                      <div className="w-3 h-3 bg-red-500 rounded mx-auto mb-1"></div>
                      <span>Crítico</span>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-orange-500 rounded mx-auto mb-1"></div>
                      <span>Ruim</span>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded mx-auto mb-1"></div>
                      <span>Regular</span>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-blue-500 rounded mx-auto mb-1"></div>
                      <span>Bom</span>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-green-500 rounded mx-auto mb-1"></div>
                      <span>Excelente</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distribuição de Alertas de Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Alertas de Compliance por Severidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        complianceAlerts.reduce((acc, alert) => {
                          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([severity, count]) => ({ severity, count }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ severity, count }) => `${severity}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {Object.entries(
                        complianceAlerts.reduce((acc, alert) => {
                          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry[0] === 'critical' ? '#ef4444' :
                          entry[0] === 'high' ? '#f97316' :
                          entry[0] === 'medium' ? '#eab308' : '#22c55e'
                        } />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Resumo Executivo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Ativos Operacionais:</span>
                    <span className="font-medium">
                      {dashboardStats ? 
                        Math.round(((dashboardStats.total_assets - dashboardStats.assets_in_maintenance) / dashboardStats.total_assets) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Compliance Score:</span>
                    <span className="font-medium text-green-600">
                      {dashboardStats?.active_certifications || 0} certificações ativas
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Conectividade Mobile:</span>
                    <span className="font-medium text-blue-600">
                      {dashboardStats?.registered_devices || 0} dispositivos
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximas Ações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {complianceAlerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="flex items-center space-x-2">
                      <Badge color={getSeverityColor(alert.severity)} size="sm">
                        {alert.severity}
                      </Badge>
                      <span className="text-sm truncate">{alert.title}</span>
                    </div>
                  ))}
                  {complianceAlerts.length === 0 && (
                    <p className="text-sm text-gray-500">Nenhum alerta pendente</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardStats?.active_price_lists || 0}
                    </div>
                    <div className="text-sm text-gray-600">Listas de Preços Ativas</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardStats?.pending_sync_items || 0}
                    </div>
                    <div className="text-sm text-gray-600">Itens para Sincronizar</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Controle de Ativos */}
        <TabsContent value="assets" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Controle de Ativos Enterprise</h3>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Building className="h-4 w-4 mr-2" />
              Novo Ativo
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Ativos */}
            <Card>
              <CardHeader>
                <CardTitle>Ativos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assetsEnterprise.slice(0, 5).map((asset) => (
                    <div key={asset.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{asset.name}</h4>
                          <p className="text-sm text-gray-600">{asset.assetNumber}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge color={getStatusColor(asset.status)}>
                            {asset.status}
                          </Badge>
                          <Badge variant="outline">
                            {asset.conditionRating}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Categoria:</span> {asset.category}
                        </div>
                        <div>
                          <span className="font-medium">Valor:</span> 
                          {asset.currentValue ? ` R$ ${asset.currentValue.toLocaleString()}` : ' N/A'}
                        </div>
                      </div>
                      
                      {asset.nextMaintenanceDate && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Próxima manutenção: {new Date(asset.nextMaintenanceDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribuição por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={Object.entries(
                      assetsEnterprise.reduce((acc, asset) => {
                        acc[asset.category] = (acc[asset.category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([category, count]) => ({ category, count }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LPU Enterprise */}
        <TabsContent value="pricing" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Lista de Preços Unitários Enterprise</h3>
            <Button className="bg-green-600 hover:bg-green-700">
              <DollarSign className="h-4 w-4 mr-2" />
              Nova Lista de Preços
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Listas de Preços Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priceListsEnterprise.map((priceList) => (
                  <div key={priceList.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{priceList.name}</h4>
                        <p className="text-sm text-gray-600">
                          Código: {priceList.code} | Versão: {priceList.version}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge color={getStatusColor(priceList.status)}>
                          {priceList.status}
                        </Badge>
                        {priceList.isCurrentVersion && (
                          <Badge color="green">
                            Atual
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Válido de:</span> {
                          new Date(priceList.validFrom).toLocaleDateString()
                        }
                      </div>
                      <div>
                        <span className="font-medium">Válido até:</span> {
                          priceList.validTo ? new Date(priceList.validTo).toLocaleDateString() : 'Indefinido'
                        }
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-3 space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar Itens
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        Exportar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance e Auditoria */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Compliance e Auditoria</h3>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Database className="h-4 w-4 mr-2" />
                Trilha de Auditoria
              </Button>
              <Button className="bg-red-600 hover:bg-red-700">
                <Shield className="h-4 w-4 mr-2" />
                Novo Alerta
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alertas de Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceAlerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{alert.title}</h4>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge color={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge color={getStatusColor(alert.status)}>
                          {alert.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Tipo:</span> {alert.alertType}
                      </div>
                      <div>
                        <span className="font-medium">Criado em:</span> {
                          new Date(alert.createdAt).toLocaleDateString()
                        }
                      </div>
                    </div>
                    
                    {alert.dueDate && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                        <AlertTriangle className="h-4 w-4 inline mr-1 text-red-600" />
                        Prazo: {new Date(alert.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-3 space-x-2">
                      {alert.status === 'open' && (
                        <>
                          <Button variant="outline" size="sm" className="text-blue-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Reconhecer
                          </Button>
                          <Button variant="outline" size="sm" className="text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolver
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

        {/* Mobile e Offline */}
        <TabsContent value="mobile" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Mobile e Sincronização Offline</h3>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Smartphone className="h-4 w-4 mr-2" />
              Registrar Dispositivo
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status de Conectividade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wifi className="h-5 w-5 mr-2" />
                  Status de Conectividade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span>Dispositivos Online</span>
                    </div>
                    <span className="font-bold">{dashboardStats?.registered_devices || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <span>Sincronização Pendente</span>
                    </div>
                    <span className="font-bold">{dashboardStats?.pending_sync_items || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <div className="flex items-center">
                      <WifiOff className="h-4 w-4 text-red-500 mr-2" />
                      <span>Dispositivos Offline</span>
                    </div>
                    <span className="font-bold">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fila de Sincronização */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sync className="h-5 w-5 mr-2" />
                  Fila de Sincronização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {dashboardStats?.pending_sync_items || 0}
                    </div>
                    <p className="text-sm text-gray-600">Itens pendentes de sincronização</p>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <Sync className="h-4 w-4 mr-2" />
                    Forçar Sincronização
                  </Button>
                  
                  <Button className="w-full" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar Fila Completa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Avançados */}
        <TabsContent value="analytics" className="space-y-4">
          <h3 className="text-lg font-semibold">Analytics Enterprise</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance dos Ativos */}
            <Card>
              <CardHeader>
                <CardTitle>Performance dos Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={[
                    { month: 'Jan', operacional: 95, manutencao: 5 },
                    { month: 'Fev', operacional: 92, manutencao: 8 },
                    { month: 'Mar', operacional: 97, manutencao: 3 },
                    { month: 'Abr', operacional: 94, manutencao: 6 },
                    { month: 'Mai', operacional: 96, manutencao: 4 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="operacional" stackId="1" stroke="#22c55e" fill="#22c55e" />
                    <Area type="monotone" dataKey="manutencao" stackId="1" stroke="#eab308" fill="#eab308" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Evolução de Compliance */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', alertas: 12, resolvidos: 8 },
                    { month: 'Fev', alertas: 15, resolvidos: 12 },
                    { month: 'Mar', alertas: 8, resolvidos: 8 },
                    { month: 'Abr', alertas: 10, resolvidos: 7 },
                    { month: 'Mai', alertas: 6, resolvidos: 6 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="alertas" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="resolvidos" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Métricas de ROI */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas de ROI e Eficiência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">32%</div>
                  <div className="text-sm text-gray-600">Redução de Custos</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">98.5%</div>
                  <div className="text-sm text-gray-600">Disponibilidade</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded">
                  <div className="text-2xl font-bold text-yellow-600">24h</div>
                  <div className="text-sm text-gray-600">Tempo Médio de Reparo</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">99.2%</div>
                  <div className="text-sm text-gray-600">Precisão de Preços</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnterpriseModulesManager;
