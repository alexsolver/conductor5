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
// import useLocalization from '@/hooks/useLocalization';
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
  // Localization temporarily disabled
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<PriceList | null>(null);
  // Fetch price lists
  const { data: priceLists = [], isLoading: listsLoading } = useQuery({
    queryKey: ['/api/materials-services/price-lists'],
    queryFn: () => apiRequest('GET', '/api/materials-services/price-lists')
  });
  // Fetch LPU stats with error handling
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<LPUStats>({
    queryKey: ['/api/materials-services/lpu/stats'],
    queryFn: () => apiRequest('GET', '/api/materials-services/lpu/stats'),
    retry: 3,
    staleTime: 30000,
    onError: (error) => {
      console.error('[TRANSLATION_NEEDED]', error);
      toast({ 
        title: '[TRANSLATION_NEEDED]', 
        description: 'Verifique sua conexão e tente novamente',
        variant: 'destructive' 
      });
    }
  });
  // Fetch pricing rules
  const { data: pricingRules = [] } = useQuery<PricingRule[]>({
    queryKey: ['/api/materials-services/pricing-rules'],
    queryFn: () => apiRequest('GET', '/api/materials-services/pricing-rules')
  });
  // Fetch versions for selected list
  const { data: versions = [] } = useQuery<PriceListVersion[]>({
    queryKey: ['/api/materials-services/price-lists', selectedList?.id, 'versions'],
    queryFn: () => apiRequest('GET', "/versions`),
    enabled: !!selectedList
  });
  // Create price list mutation
  const createPriceListMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/materials-services/price-lists', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists/stats'] });
      setIsCreateListOpen(false);
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
    mutationFn: (versionId: string) => apiRequest('POST', "/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists'] });
      toast({ title: 'Lista enviada para aprovação!' });
    },
    onError: () => {
      toast({ title: 'Erro ao enviar para aprovação', variant: 'destructive' });
    }
  });
  // Approve price list mutation
  const approveMutation = useMutation({
    mutationFn: (versionId: string) => apiRequest('POST', "/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists'] });
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
  return (
    <div className="p-4"
      <div className="p-4"
        <div>
          <h1 className="text-lg">"LPU - Lista de Preços Unificada</h1>
          <p className="text-lg">"Gestão completa de precificação com workflow de aprovação</p>
        </div>
        <div className="p-4"
          <Dialog open={isCreateListOpen} onOpenChange={setIsCreateListOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Lista
              </Button>
            </DialogTrigger>
            <DialogContent className="p-4"
              <DialogHeader>
                <DialogTitle>Criar Nova Lista de Preços</DialogTitle>
                <DialogDescription>
                  Configure uma nova lista de preços com parâmetros específicos
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createPriceListMutation.mutate({
                  name: formData.get('name'),
                  code: formData.get('code'),
                  version: formData.get('version'),
                  currency: formData.get('currency'),
                  automaticMargin: formData.get('automaticMargin'),
                  validFrom: formData.get('validFrom'),
                  validTo: formData.get('validTo'),
                  notes: formData.get('notes')
                });
              }} className="p-4"
                <div className="p-4"
                  <div className="p-4"
                    <Label htmlFor="name">Nome da Lista *</Label>
                    <Input name="name" required placeholder="Ex: Lista Comercial 2025" />
                  </div>
                  <div className="p-4"
                    <Label htmlFor="code">Código *</Label>
                    <Input name="code" required placeholder="Ex: LC2025" />
                  </div>
                </div>
                <div className="p-4"
                  <div className="p-4"
                    <Label htmlFor="version">Versão</Label>
                    <Input name="version" defaultValue="1.0" placeholder="1.0" />
                  </div>
                  <div className="p-4"
                    <Label htmlFor="currency">Moeda</Label>
                    <Select name="currency" defaultValue="BRL>
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
                  <div className="p-4"
                    <Label htmlFor="automaticMargin">Margem Automática (%)</Label>
                    <Input name="automaticMargin" type="number" step="0.01" placeholder="0.00" />
                  </div>
                </div>
                <div className="p-4"
                  <div className="p-4"
                    <Label htmlFor="validFrom">Válido De *</Label>
                    <Input name="validFrom" type="date" required />
                  </div>
                  <div className="p-4"
                    <Label htmlFor="validTo">Válido Até</Label>
                    <Input name="validTo" type="date" />
                  </div>
                </div>
                <div className="p-4"
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea name="notes" placeholder='[TRANSLATION_NEEDED]' />
                </div>
                <div className="p-4"
                  <Button type="button" variant="outline" onClick={() => setIsCreateListOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createPriceListMutation.isPending}>
                    {createPriceListMutation.isPending ? 'Criando...' : '[TRANSLATION_NEEDED]'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline>
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
              }} className="p-4"
                <div className="p-4"
                  <Label htmlFor="name">Nome da Regra *</Label>
                  <Input name="name" required placeholder="Ex: Desconto por Volume" />
                </div>
                <div className="p-4"
                  <div className="p-4"
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
                  <div className="p-4"
                    <Label htmlFor="priority">Prioridade</Label>
                    <Input name="priority" type="number" defaultValue="0" />
                  </div>
                </div>
                <div className="p-4"
                  <div className="p-4"
                    <Label htmlFor="conditions">Condição</Label>
                    <Input name="conditions" placeholder="Ex: categoria=eletrônicos" />
                  </div>
                  <div className="p-4"
                    <Label htmlFor="action">Percentual (%)</Label>
                    <Input name="action" type="number" step="0.01" placeholder="0.00" />
                  </div>
                </div>
                <div className="p-4"
                  <div className="p-4"
                    <Label htmlFor="validFrom">Válido De</Label>
                    <Input name="validFrom" type="date" />
                  </div>
                  <div className="p-4"
                    <Label htmlFor="validTo">Válido Até</Label>
                    <Input name="validTo" type="date" />
                  </div>
                </div>
                <div className="p-4"
                  <Button type="button" variant="outline" onClick={() => setIsCreateRuleOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createRuleMutation.isPending}>
                    {createRuleMutation.isPending ? 'Criando...' : '[TRANSLATION_NEEDED]'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Statistics Cards */}
      <div className="p-4"
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Total de Listas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"{stats?.totalLists || 0}</div>
            <p className="p-4"
              {stats?.activeLists || 0} listas ativas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Pendente Aprovação</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"{stats?.pendingApproval || 0}</div>
            <p className="p-4"
              aguardando análise
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Taxa de Aprovação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"{stats?.approvalRate || 0}%</div>
            <p className="p-4"
              {stats?.approvedVersions || 0} aprovadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Regras Ativas</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"{stats?.activeRules || 0}</div>
            <p className="p-4"
              regras configuradas
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Main Content Tabs */}
      <Tabs defaultValue="lists" className="p-4"
        <TabsList>
          <TabsTrigger value="lists">Listas de Preços</TabsTrigger>
          <TabsTrigger value="versions">Versionamento</TabsTrigger>
          <TabsTrigger value="rules">Regras de Precificação</TabsTrigger>
          <TabsTrigger value="dynamic">Precificação Dinâmica</TabsTrigger>
        </TabsList>
        <TabsContent value="lists" className="p-4"
          {/* Filters */}
          <div className="p-4"
            <div className="p-4"
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder='[TRANSLATION_NEEDED]'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="p-4"
                <SelectValue placeholder='[TRANSLATION_NEEDED]' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Price Lists */}
          <div className="p-4"
            {listsLoading ? (
              <div className="text-lg">"Carregando listas...</div>
            ) : filteredPriceLists.length === 0 ? (
              <div className="p-4"
                Nenhuma lista encontrada
              </div>
            ) : (
              filteredPriceLists.map((list: PriceList) => (
                <Card key={list.id}>
                  <CardContent className="p-4"
                    <div className="p-4"
                      <div className="p-4"
                        <div className="p-4"
                          <h3 className="text-lg">"{list.name}</h3>
                          <Badge variant={list.isActive ? 'default' : 'outline'}>
                            {list.isActive ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <p className="p-4"
                          Código: {list.code} | Versão: {list.version} | Moeda: {list.currency}
                        </p>
                        <div className="p-4"
                          <span>Válido: {new Date(list.validFrom).toLocaleDateString('pt-BR')}</span>
                          {list.validTo && (
                            <span>até {new Date(list.validTo).toLocaleDateString('pt-BR')}</span>
                          )}
                          {list.automaticMargin && (
                            <span>Margem: {parseFloat(list.automaticMargin).toFixed(2)}%</span>
                          )}
                        </div>
                      </div>
                      <div className="p-4"
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedList(list)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Versões
                        </Button>
                        <Button variant="outline" size="sm>
                          <DollarSign className="w-4 h-4 mr-1" />
                          Itens
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="versions" className="p-4"
          {selectedList ? (
            <Card>
              <CardHeader>
                <CardTitle>Versões - {selectedList.name}</CardTitle>
                <CardDescription>
                  Histórico de versões e workflow de aprovação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {versions.length === 0 ? (
                  <div className="p-4"
                    Nenhuma versão encontrada
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Versão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data Criação</TableHead>
                        <TableHead>Data Aprovação</TableHead>
                        <TableHead>Margem Base</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {versions.map((version) => (
                        <TableRow key={version.id}>
                          <TableCell className="text-lg">"{version.version}</TableCell>
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
                            {version.baseMargin ? "%` : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="p-4"
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
              <CardContent className="p-4"
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="p-4"
                  Selecione uma lista de preços para visualizar suas versões
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="rules" className="p-4"
          <div className="p-4"
            {pricingRules.length === 0 ? (
              <div className="p-4"
                Nenhuma regra configurada
              </div>
            ) : (
              pricingRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="p-4"
                    <div className="p-4"
                      <div className="p-4"
                        <div className="p-4"
                          <h3 className="text-lg">"{rule.name}</h3>
                          {getRuleTypeBadge(rule.type)}
                          <Badge variant={rule.active ? 'default' : 'outline'}>
                            {rule.active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <p className="p-4"
                          Prioridade: {rule.priority} | Tipo: {rule.type}
                        </p>
                        {rule.validFrom && (
                          <div className="p-4"
                            <Calendar className="w-4 h-4" />
                            Válido: {new Date(rule.validFrom).toLocaleDateString('pt-BR')}
                            {rule.validTo && "
                          </div>
                        )}
                      </div>
                      <div className="p-4"
                        <Button variant="outline" size="sm>
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
        <TabsContent value="dynamic" className="p-4"
          <Card>
            <CardHeader>
              <CardTitle>Precificação Dinâmica</CardTitle>
              <CardDescription>
                Sistema de ajuste automático de preços baseado em fatores de mercado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4"
                <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                <p>Módulo de precificação dinâmica em desenvolvimento</p>
                <p className="p-4"
                  Fatores: demanda, sazonalidade, estoque, concorrência
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}