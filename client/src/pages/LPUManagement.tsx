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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  FileText, 
  TrendingUp, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Settings,
  BarChart3,
  Percent,
  Calendar,
  Users
} from 'lucide-react';

interface PriceList {
  id: string;
  name: string;
  code: string;
  version: string;
  isActive: boolean;
  validFrom: string;
  validTo?: string;
  currency: string;
  automaticMargin?: string;
  createdAt: string;
}

interface PriceListVersion {
  id: string;
  priceListId: string;
  version: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'active' | 'archived';
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  baseMargin?: string;
  effectiveDate?: string;
  createdAt: string;
}

interface PricingRule {
  id: string;
  name: string;
  type: 'markup' | 'markdown' | 'fixed' | 'tier';
  active: boolean;
  priority: number;
  conditions: any;
  action: any;
  validFrom?: string;
  validTo?: string;
}

interface LPUStats {
  totalLists: number;
  activeLists: number;
  draftLists: number;
  pendingApproval: number;
  approvedVersions: number;
  activeRules: number;
  approvalRate: number;
}

export default function LPUManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<PriceList | null>(null);
  const [newPriceList, setNewPriceList] = useState({
    name: '',
    code: '',
    version: '1.0',
    currency: 'BRL',
    automaticMargin: '',
    validFrom: '',
    validTo: '',
    notes: ''
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch price lists
  const { data: priceLists = [], isLoading: listsLoading, error: listsError } = useQuery<PriceList[]>({
    queryKey: ['/api/materials-services/price-lists'],
    queryFn: () => apiRequest('GET', '/api/materials-services/price-lists'),
    onError: (error) => {
      console.error('Error fetching price lists:', error);
      toast({ 
        title: 'Erro ao carregar listas de preços', 
        description: 'Verifique sua conexão e tente novamente',
        variant: 'destructive' 
      });
    }
  });

  // Fetch LPU stats with error handling
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<LPUStats>({
    queryKey: ['/api/materials-services/lpu/stats'],
    queryFn: () => apiRequest('GET', '/api/materials-services/lpu/stats'),
    retry: 3,
    staleTime: 30000,
    onError: (error) => {
      console.error('Error fetching LPU stats:', error);
      toast({ 
        title: 'Erro ao carregar estatísticas', 
        description: 'Verifique sua conexão e tente novamente',
        variant: 'destructive' 
      });
    }
  });

  // Fetch pricing rules
  const { data: pricingRules = [], isLoading: rulesLoading, error: rulesError } = useQuery<PricingRule[]>({
    queryKey: ['/api/materials-services/pricing-rules'],
    queryFn: () => apiRequest('GET', '/api/materials-services/pricing-rules'),
    onError: (error) => {
      console.error('Error fetching pricing rules:', error);
      toast({ 
        title: 'Erro ao carregar regras de precificação', 
        description: 'Verifique sua conexão e tente novamente',
        variant: 'destructive' 
      });
    }
  });

  // Fetch versions for selected list
  const { data: versions = [], isLoading: versionsLoading, error: versionsError } = useQuery<PriceListVersion[]>({
    queryKey: ['/api/materials-services/price-lists', selectedList?.id, 'versions'],
    queryFn: () => apiRequest('GET', `/api/materials-services/price-lists/${selectedList?.id}/versions`),
    enabled: !!selectedList,
    onError: (error) => {
      console.error('Error fetching versions:', error);
      toast({ 
        title: 'Erro ao carregar versões da lista', 
        description: 'Verifique sua conexão e tente novamente',
        variant: 'destructive' 
      });
    }
  });

  // Create price list mutation
  const createPriceListMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/materials-services/price-lists', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/lpu/stats'] });
      setIsCreateDialogOpen(false);
      setNewPriceList({
        name: '', code: '', version: '1.0', currency: 'BRL', automaticMargin: '', validFrom: '', validTo: '', notes: ''
      });
      toast({ title: 'Lista de preços criada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar lista de preços', variant: 'destructive' });
    }
  });

  // Create pricing rule mutation
  const createRuleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/materials-services/pricing-rules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/pricing-rules'] });
      setIsCreateRuleOpen(false);
      toast({ title: 'Regra de precificação criada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar regra de precificação', variant: 'destructive' });
    }
  });

  // Submit for approval mutation
  const submitApprovalMutation = useMutation({
    mutationFn: (versionId: string) => apiRequest('POST', `/api/materials-services/price-lists/versions/${versionId}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists', selectedList?.id, 'versions'] });
      toast({ title: 'Lista enviada para aprovação!' });
    },
    onError: () => {
      toast({ title: 'Erro ao enviar para aprovação', variant: 'destructive' });
    }
  });

  // Approve price list mutation
  const approveMutation = useMutation({
    mutationFn: (versionId: string) => apiRequest('POST', `/api/materials-services/price-lists/versions/${versionId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists', selectedList?.id, 'versions'] });
      toast({ title: 'Lista aprovada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao aprovar lista', variant: 'destructive' });
    }
  });

  // Filter price lists
  const filteredPriceLists = priceLists.filter((list: PriceList) => {
    const matchesSearch = list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         list.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && list.isActive) ||
                         (statusFilter === 'inactive' && !list.isActive);
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'outline',
      pending_approval: 'secondary',
      approved: 'default',
      active: 'default',
      archived: 'outline'
    } as const;

    const labels = {
      draft: 'Rascunho',
      pending_approval: 'Pendente',
      approved: 'Aprovado',
      active: 'Ativo',
      archived: 'Arquivado'
    };

    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
      {labels[status as keyof typeof labels] || status}
    </Badge>;
  };

  const getRuleTypeBadge = (type: string) => {
    const labels = {
      markup: 'Markup',
      markdown: 'Desconto',
      fixed: 'Fixo',
      tier: 'Escalonado'
    };

    return <Badge variant="outline">{labels[type as keyof typeof labels] || type}</Badge>;
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriceList.name || !newPriceList.validFrom) {
      toast({ title: 'Por favor, preencha os campos obrigatórios.', variant: 'destructive' });
      return;
    }
    createPriceListMutation.mutate({
      ...newPriceList,
      automaticMargin: newPriceList.automaticMargin ? parseFloat(newPriceList.automaticMargin) : undefined,
      validFrom: newPriceList.validFrom || undefined,
      validTo: newPriceList.validTo || undefined,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">LPU - Lista de Preços Unificada</h1>
          <p className="text-muted-foreground">Gestão completa de precificação com workflow de aprovação</p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="default" 
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                <Plus className="h-4 w-4" />
                Nova Lista de Preços
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Lista de Preços</DialogTitle>
                <DialogDescription>
                  Configure uma nova lista de preços com parâmetros específicos
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateList} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Nome da Lista <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={newPriceList.name}
                      onChange={(e) => setNewPriceList(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Lista Comercial 2025"
                      className={newPriceList.name.length === 0 ? "border-red-300 focus:border-red-500" : ""}
                      required
                    />
                    {newPriceList.name.length === 0 && (
                      <p className="text-xs text-red-600">Nome é obrigatório</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Código</Label>
                    <Input name="code" value={newPriceList.code} onChange={(e) => setNewPriceList(prev => ({ ...prev, code: e.target.value }))} placeholder="Ex: LC2025" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="version">Versão</Label>
                    <Input name="version" value={newPriceList.version} onChange={(e) => setNewPriceList(prev => ({ ...prev, version: e.target.value }))} placeholder="1.0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moeda</Label>
                    <Select name="currency" value={newPriceList.currency} onValueChange={(value) => setNewPriceList(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">Real (BRL)</SelectItem>
                        <SelectItem value="USD">Dólar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="automaticMargin">Margem Automática (%)</Label>
                    <Input name="automaticMargin" value={newPriceList.automaticMargin} onChange={(e) => setNewPriceList(prev => ({ ...prev, automaticMargin: e.target.value }))} type="number" step="0.01" placeholder="0.00" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom" className="text-sm font-medium">
                      Válido De <span className="text-red-500">*</span>
                    </Label>
                    <Input name="validFrom" value={newPriceList.validFrom} onChange={(e) => setNewPriceList(prev => ({ ...prev, validFrom: e.target.value }))} type="date" required />
                    {newPriceList.validFrom.length === 0 && (
                      <p className="text-xs text-red-600">Data de início é obrigatória</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validTo">Válido Até</Label>
                    <Input name="validTo" value={newPriceList.validTo} onChange={(e) => setNewPriceList(prev => ({ ...prev, validTo: e.target.value }))} type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea name="notes" value={newPriceList.notes} onChange={(e) => setNewPriceList(prev => ({ ...prev, notes: e.target.value }))} placeholder="Informações adicionais sobre esta lista..." />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createPriceListMutation.isPending}>
                    {createPriceListMutation.isPending ? 'Criando...' : 'Criar Lista'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Regra de Precificação</DialogTitle>
                <DialogDescription>
                  Configure uma nova regra para cálculo automático de preços
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createRuleMutation.mutate({
                  name: formData.get('name'),
                  type: formData.get('type'),
                  priority: parseInt(formData.get('priority') as string),
                  conditions: { category: formData.get('conditions') },
                  action: { percentage: parseFloat(formData.get('action') as string) },
                  validFrom: formData.get('validFrom'),
                  validTo: formData.get('validTo')
                });
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Regra *</Label>
                  <Input name="name" required placeholder="Ex: Desconto por Volume" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Regra</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="markup">Markup</SelectItem>
                        <SelectItem value="markdown">Desconto</SelectItem>
                        <SelectItem value="fixed">Preço Fixo</SelectItem>
                        <SelectItem value="tier">Escalonado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Input name="priority" type="number" defaultValue="0" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="conditions">Condição</Label>
                    <Input name="conditions" placeholder="Ex: categoria=eletrônicos" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="action">Percentual (%)</Label>
                    <Input name="action" type="number" step="0.01" placeholder="0.00" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">Válido De</Label>
                    <Input name="validFrom" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validTo">Válido Até</Label>
                    <Input name="validTo" type="date" />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateRuleOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createRuleMutation.isPending}>
                    {createRuleMutation.isPending ? 'Criando...' : 'Criar Regra'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="px-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Listas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalLists || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeLists || 0} listas ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendente Aprovação</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendingApproval || 0}</div>
                <p className="text-xs text-muted-foreground">
                  aguardando análise
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.approvalRate?.toFixed(2) || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.approvedVersions || 0} aprovadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Regras Ativas</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeRules || 0}</div>
                <p className="text-xs text-muted-foreground">
                  regras configuradas
                </p>
              </CardContent>
            </Card>
          </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="price-lists" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger value="price-lists" className="data-[state=active]:bg-white">Listas de Preços</TabsTrigger>
          <TabsTrigger value="rules">Regras de Precificação</TabsTrigger>
          <TabsTrigger value="versions">Versionamento</TabsTrigger>
          <TabsTrigger value="dynamic-pricing">Precificação Dinâmica</TabsTrigger>
        </TabsList>

        <TabsContent value="price-lists" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar listas de preços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Lists */}
          <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Nome</TableHead>
                        <TableHead className="font-semibold">Código</TableHead>
                        <TableHead className="font-semibold">Versão</TableHead>
                        <TableHead className="font-semibold">Moeda</TableHead>
                        <TableHead className="font-semibold">Válido De</TableHead>
                        <TableHead className="font-semibold">Válido Até</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listsLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <div className="flex items-center justify-center py-12">
                              <div className="flex flex-col items-center space-y-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="text-gray-600 text-sm">Carregando listas de preços...</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : listsError ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <div className="flex items-center justify-center py-12">
                              <div className="flex flex-col items-center space-y-4 text-center">
                                <div className="p-3 bg-red-100 rounded-full">
                                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-red-700 font-medium">Erro ao carregar dados</p>
                                  <p className="text-red-600 text-sm mt-1">Verifique sua conexão e tente novamente</p>
                                </div>
                                <button 
                                  onClick={() => window.location.reload()} 
                                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                >
                                  Tentar Novamente
                                </button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredPriceLists.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center space-y-4">
                              <div className="p-3 bg-gray-100 rounded-full">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="text-center">
                                <p className="text-gray-700 font-medium">Nenhuma lista de preços criada</p>
                                <p className="text-gray-500 text-sm mt-1">Crie sua primeira lista de preços para começar</p>
                              </div>
                              <Button 
                                variant="outline" 
                                onClick={() => setIsCreateDialogOpen(true)}
                                className="mt-2"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Criar Lista
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPriceLists.map((list) => (
                          <TableRow key={list.id}>
                            <TableCell className="font-medium">{list.name}</TableCell>
                            <TableCell>{list.code}</TableCell>
                            <TableCell>{list.version}</TableCell>
                            <TableCell>{list.currency}</TableCell>
                            <TableCell>{new Date(list.validFrom).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{list.validTo ? new Date(list.validTo).toLocaleDateString('pt-BR') : '-'}</TableCell>
                            <TableCell>{getStatusBadge(list.isActive ? 'active' : 'inactive')}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedList(list)}
                                >
                                  <FileText className="w-4 h-4 mr-1" />
                                  Versões
                                </Button>

                                <Button variant="outline" size="sm">
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  Itens
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          {selectedList ? (
            <Card>
              <CardHeader>
                <CardTitle>Versões - {selectedList.name}</CardTitle>
                <CardDescription>
                  Histórico de versões e workflow de aprovação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {versionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-gray-600 text-sm">Carregando versões...</p>
                    </div>
                  </div>
                ) : versionsError ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center space-y-4 text-center">
                      <div className="p-3 bg-red-100 rounded-full">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-red-700 font-medium">Erro ao carregar versões</p>
                        <p className="text-red-600 text-sm mt-1">Verifique sua conexão e tente novamente</p>
                      </div>
                      <button 
                        onClick={() => window.location.reload()} 
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma versão encontrada
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Versão</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Data Criação</TableHead>
                        <TableHead className="font-semibold">Data Aprovação</TableHead>
                        <TableHead className="font-semibold">Margem Base</TableHead>
                        <TableHead className="font-semibold text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {versions.map((version) => (
                        <TableRow key={version.id}>
                          <TableCell className="font-medium">{version.version}</TableCell>
                          <TableCell>{getStatusBadge(version.status)}</TableCell>
                          <TableCell>
                            {new Date(version.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {version.approvedAt ? 
                              new Date(version.approvedAt).toLocaleDateString('pt-BR') : 
                              '-'
                            }
                          </TableCell>
                          <TableCell>
                            {version.baseMargin ? `${version.baseMargin}%` : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              {version.status === 'draft' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => submitApprovalMutation.mutate(version.id)}
                                  disabled={submitApprovalMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Enviar
                                </Button>
                              )}
                              {version.status === 'pending_approval' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => approveMutation.mutate(version.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Aprovar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Selecione uma lista de preços para visualizar suas versões
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={() => setIsCreateRuleOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </div>
          <div className="grid gap-4">
            {rulesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 text-sm">Carregando regras...</p>
                </div>
              </div>
            ) : rulesError ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4 text-center">
                  <div className="p-3 bg-red-100 rounded-full">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-red-700 font-medium">Erro ao carregar regras</p>
                    <p className="text-red-600 text-sm mt-1">Verifique sua conexão e tente novamente</p>
                  </div>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            ) : pricingRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma regra configurada
              </div>
            ) : (
              pricingRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{rule.name}</h3>
                          {getRuleTypeBadge(rule.type)}
                          <Badge variant={rule.active ? 'default' : 'outline'}>
                            {rule.active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Prioridade: {rule.priority} | Tipo: {rule.type}
                        </p>
                        {rule.validFrom && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4" />
                            Válido: {new Date(rule.validFrom).toLocaleDateString('pt-BR')}
                            {rule.validTo && ` até ${new Date(rule.validTo).toLocaleDateString('pt-BR')}`}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-1" />
                          Configurar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="dynamic-pricing" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Precificação Dinâmica</h3>
                  <p className="text-sm text-gray-600">Configure regras automáticas de precificação baseadas em critérios dinâmicos</p>
                </div>
                <Button 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nova Regra
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 bg-blue-50 rounded-full">
                        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="text-center max-w-md">
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Precificação Inteligente</h4>
                        <p className="text-gray-600 text-sm mb-4">
                          Configure regras automáticas que ajustam preços baseados em fatores como demanda, 
                          sazonalidade, margem de lucro e competitividade.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button variant="default">
                            Configurar Regras
                          </Button>
                          <Button variant="outline">
                            Ver Exemplos
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
      </Tabs>
    </div>
  );
}