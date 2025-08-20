import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
import { useLocalization } from '@/hooks/useLocalization';
  Package2, 
  MapPin, 
  Wrench, 
  QrCode, 
  BarChart3, 
  Plus, 
  Search, 
  Filter,
  Gauge,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  code: string;
  serialNumber?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'disposed';
  assetLevel: 'machine' | 'component' | 'item';
  qrCode?: string;
  currentLocationId?: string;
  parentAssetId?: string;
  acquisitionDate?: string;
  acquisitionCost?: string;
  warrantyExpiry?: string;
  createdAt: string;
}

interface AssetMaintenance {
  id: string;
  assetId: string;
  type: 'preventive' | 'corrective' | 'emergency';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate?: string;
  completedDate?: string;
  description: string;
  cost?: string;
}

interface AssetStats {
  totalAssets: number;
  activeAssets: number;
  maintenanceAssets: number;
  inactiveAssets: number;
  scheduledMaintenance: number;
  completedMaintenance: number;
  maintenanceCompletionRate: number;
}

export default function AssetManagement() {
  const { t } = useLocalization();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Fetch assets
  const { data: assetsResponse, isLoading: assetsLoading } = useQuery({
    queryKey: ['/api/materials-services/assets']
  });

  const assets = Array.isArray(assetsResponse) ? assetsResponse : [];

  // Fetch asset stats
  const { data: stats } = useQuery<AssetStats>({
    queryKey: ['/api/materials-services/assets/stats']
  });

  // Fetch asset hierarchy
  const { data: hierarchyResponse } = useQuery({
    queryKey: ['/api/materials-services/assets/hierarchy']
  });

  const hierarchy = Array.isArray(hierarchyResponse) ? hierarchyResponse : [];

  // Fetch maintenance records
  const { data: maintenanceResponse } = useQuery<AssetMaintenance[]>({
    queryKey: ['/api/materials-services/assets/maintenance']
  });

  const maintenance = Array.isArray(maintenanceResponse) ? maintenanceResponse : [];

  // Create asset mutation
  const createAssetMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/materials-services/assets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/assets/stats'] });
      setIsCreateAssetOpen(false);
      toast({ title: 'Ativo criado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar ativo', variant: 'destructive' });
    }
  });

  // Create maintenance mutation
  const createMaintenanceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/materials-services/assets/maintenance', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/assets/maintenance'] });
      setIsMaintenanceOpen(false);
      toast({ title: 'Manutenção agendada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao agendar manutenção', variant: 'destructive' });
    }
  });

  // Generate QR Code mutation
  const generateQRMutation = useMutation({
    mutationFn: (assetId: string) => apiRequest('POST', `/api/materials-services/assets/${assetId}/qr-code`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/assets'] });
      toast({ title: 'QR Code gerado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao gerar QR Code', variant: 'destructive' });
    }
  });

  // Filter assets
  const filteredAssets = assets.filter((asset: Asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      maintenance: 'destructive',
      disposed: 'outline'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'outline',
      medium: 'secondary',
      high: 'destructive',
      critical: 'destructive'
    } as const;
    
    return <Badge variant={variants[priority as keyof typeof variants] || 'outline'}>{priority}</Badge>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Controle de Ativos</h1>
          <p className="text-muted-foreground">Gestão completa de ativos com geolocalização e QR codes</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isCreateAssetOpen} onOpenChange={setIsCreateAssetOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Ativo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Ativo</DialogTitle>
                <DialogDescription>
                  Cadastre um novo ativo no sistema com informações completas
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createAssetMutation.mutate({
                  name: formData.get('name'),
                  code: formData.get('code'),
                  serialNumber: formData.get('serialNumber'),
                  status: formData.get('status'),
                  assetLevel: formData.get('assetLevel'),
                  acquisitionCost: formData.get('acquisitionCost'),
                  warrantyExpiry: formData.get('warrantyExpiry')
                });
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Ativo *</Label>
                    <Input name="name" required placeholder="Ex: Compressor Industrial" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Código *</Label>
                    <Input name="code" required placeholder="Ex: COMP-001" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Número de Série</Label>
                    <Input name="serialNumber" placeholder="Ex: SN123456789" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="active">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="maintenance">Em Manutenção</SelectItem>
                        <SelectItem value="disposed">Descartado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetLevel">Nível do Ativo</Label>
                    <Select name="assetLevel" defaultValue="machine">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="machine">Máquina</SelectItem>
                        <SelectItem value="component">Componente</SelectItem>
                        <SelectItem value="item">Item</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acquisitionCost">Custo de Aquisição</Label>
                    <Input name="acquisitionCost" type="number" step="0.01" placeholder="0.00" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warrantyExpiry">Data de Vencimento da Garantia</Label>
                  <Input name="warrantyExpiry" type="date" />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateAssetOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createAssetMutation.isPending}>
                    {createAssetMutation.isPending ? 'Criando...' : {t('AssetManagement.criarAtivo')}}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Wrench className="w-4 h-4 mr-2" />
                Agendar Manutenção
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agendar Manutenção</DialogTitle>
                <DialogDescription>
                  Crie um novo agendamento de manutenção para um ativo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createMaintenanceMutation.mutate({
                  assetId: formData.get('assetId'),
                  type: formData.get('type'),
                  priority: formData.get('priority'),
                  scheduledDate: formData.get('scheduledDate'),
                  description: formData.get('description')
                });
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assetId">Ativo</Label>
                  <Select name="assetId" required>
                    <SelectTrigger>
                      <SelectValue placeholder={t('AssetManagement.selecioneOAtivo')} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAssets.map((asset: Asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name} ({asset.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Manutenção</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventive">Preventiva</SelectItem>
                        <SelectItem value="corrective">Corretiva</SelectItem>
                        <SelectItem value="emergency">Emergencial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select name="priority" defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Data Agendada</Label>
                  <Input name="scheduledDate" type="datetime-local" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea name="description" required placeholder="Descreva os trabalhos a serem realizados..." />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsMaintenanceOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMaintenanceMutation.isPending}>
                    {createMaintenanceMutation.isPending ? 'Agendando...' : 'Agendar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAssets || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeAssets || 0} ativos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.maintenanceAssets || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.scheduledMaintenance || 0} agendadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.maintenanceCompletionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedMaintenance || 0} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assets.filter((a: Asset) => a.qrCode).length}
            </div>
            <p className="text-xs text-muted-foreground">
              ativos com QR Code
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">Ativos</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarquia</TabsTrigger>
          <TabsTrigger value="meters">Medidores</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('AssetManagement.buscarAtivos')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('AssetManagement.filtrarPorStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="maintenance">Em Manutenção</SelectItem>
                <SelectItem value="disposed">Descartado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assets List */}
          <div className="grid gap-4">
            {assetsLoading ? (
              <div className="text-center py-8">Carregando ativos...</div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum ativo encontrado
              </div>
            ) : (
              filteredAssets.map((asset: Asset) => (
                <Card key={asset.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{asset.name}</h3>
                          {getStatusBadge(asset.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Código: {asset.code} | Série: {asset.serialNumber || 'N/A'}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Nível: {asset.assetLevel}</span>
                          {asset.acquisitionCost && (
                            <span>Custo: R$ {parseFloat(asset.acquisitionCost).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {!asset.qrCode && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateQRMutation.mutate(asset.id)}
                            disabled={generateQRMutation.isPending}
                          >
                            <QrCode className="w-4 h-4 mr-1" />
                            Gerar QR
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setIsMaintenanceOpen(true);
                          }}
                        >
                          <Wrench className="w-4 h-4 mr-1" />
                          Manutenção
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid gap-4">
            {maintenance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma manutenção agendada
              </div>
            ) : (
              maintenance.map((m) => (
                <Card key={m.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{m.description}</h3>
                          {getPriorityBadge(m.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tipo: {m.type} | Status: {m.status}
                        </p>
                        {m.scheduledDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4" />
                            {new Date(m.scheduledDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-1" />
                          Gerenciar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hierarquia de Ativos</CardTitle>
              <CardDescription>
                Visualização em árvore da estrutura hierárquica dos ativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hierarchy.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma hierarquia configurada
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Tree view would be implemented here */}
                  <p className="text-sm text-muted-foreground">
                    Hierarquia carregada com {hierarchy.length} nós raiz
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medidores de Ativos</CardTitle>
              <CardDescription>
                Leituras de medidores como horas, quilômetros, ciclos, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Gauge className="w-12 h-12 mx-auto mb-4" />
                <p>Módulo de medidores em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}