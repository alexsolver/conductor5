import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Shield,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Download,
  Upload,
  Award,
  Building,
  User,
  Activity,
  BarChart3,
  FileText,
  Settings,
  BookOpen,
  Scale,
  Gavel,
  UserCheck,
  Lock,
  ExternalLink,
  Zap,
  TrendingUp,
  Target,
  AlertCircle,
  Info,
  XCircle,
  ThumbsUp
} from "lucide-react";

interface ComplianceRecord {
  id: string;
  title: string;
  type: 'audit' | 'certification' | 'regulation' | 'policy' | 'assessment';
  status: 'compliant' | 'non_compliant' | 'pending' | 'expired' | 'in_review';
  category: 'quality' | 'safety' | 'environmental' | 'financial' | 'data_protection' | 'legal';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  dueDate: string;
  completedDate?: string;
  evidence: Evidence[];
  findings: Finding[];
  requirements: Requirement[];
  score?: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Evidence {
  id: string;
  name: string;
  type: 'document' | 'certificate' | 'report' | 'photo' | 'video';
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  verified: boolean;
}

interface Finding {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  actionPlan: string;
  responsiblePerson: string;
  targetDate: string;
  createdAt: string;
}

interface Requirement {
  id: string;
  title: string;
  description: string;
  standard: string;
  mandatory: boolean;
  status: 'met' | 'not_met' | 'partial' | 'not_applicable';
  lastAssessed: string;
}

interface ComplianceStats {
  totalRecords: number;
  compliantRecords: number;
  pendingRecords: number;
  expiredRecords: number;
  upcomingDueDates: number;
  openFindings: number;
  avgComplianceScore: number;
  certificationsCurrent: number;
}

export function ComplianceManagement() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for development
  const mockStats: ComplianceStats = {
    totalRecords: 156,
    compliantRecords: 128,
    pendingRecords: 18,
    expiredRecords: 6,
    upcomingDueDates: 12,
    openFindings: 24,
    avgComplianceScore: 87.5,
    certificationsCurrent: 15
  };

  const mockRecords: ComplianceRecord[] = [
    {
      id: "1",
      title: "ISO 9001:2015 - Sistema de Gestão da Qualidade",
      type: "certification",
      status: "compliant",
      category: "quality",
      priority: "high",
      assignedTo: "maria.santos@empresa.com",
      dueDate: "2025-06-15T00:00:00Z",
      completedDate: "2024-06-10T00:00:00Z",
      evidence: [],
      findings: [],
      requirements: [],
      score: 95,
      description: "Certificação ISO 9001:2015 para sistema de gestão da qualidade empresarial",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-12-01T14:30:00Z"
    },
    {
      id: "2",
      title: "LGPD - Lei Geral de Proteção de Dados",
      type: "regulation",
      status: "pending",
      category: "data_protection",
      priority: "critical",
      assignedTo: "carlos.oliveira@empresa.com",
      dueDate: "2025-02-28T00:00:00Z",
      evidence: [],
      findings: [
        {
          id: "f1",
          description: "Necessário implementar política de retenção de dados",
          severity: "high",
          status: "in_progress",
          actionPlan: "Definir e implementar políticas de retenção conforme LGPD",
          responsiblePerson: "dpo@empresa.com",
          targetDate: "2025-01-31T00:00:00Z",
          createdAt: "2024-11-15T00:00:00Z"
        }
      ],
      requirements: [],
      score: 72,
      description: "Adequação completa à Lei Geral de Proteção de Dados Pessoais",
      createdAt: "2024-08-01T08:00:00Z",
      updatedAt: "2024-12-20T16:45:00Z"
    },
    {
      id: "3",
      title: "Auditoria Interna de Processos",
      type: "audit",
      status: "in_review",
      category: "quality",
      priority: "medium",
      assignedTo: "ana.costa@empresa.com",
      dueDate: "2025-01-31T00:00:00Z",
      evidence: [],
      findings: [],
      requirements: [],
      score: 88,
      description: "Auditoria interna trimestral dos processos operacionais",
      createdAt: "2024-12-01T09:00:00Z",
      updatedAt: "2024-12-22T11:20:00Z"
    },
    {
      id: "4",
      title: "NR-12 - Segurança no Trabalho em Máquinas",
      type: "regulation",
      status: "expired",
      category: "safety",
      priority: "critical",
      assignedTo: "joao.silva@empresa.com",
      dueDate: "2024-12-01T00:00:00Z",
      evidence: [],
      findings: [],
      requirements: [],
      score: 65,
      description: "Conformidade com Norma Regulamentadora NR-12",
      createdAt: "2024-06-01T07:30:00Z",
      updatedAt: "2024-12-01T18:00:00Z"
    }
  ];

  // Simulated queries
  const { data: records = mockRecords, isLoading } = useQuery({
    queryKey: ["/api/materials-services/compliance"],
    queryFn: () => Promise.resolve(mockRecords),
    enabled: true
  });

  const { data: stats = mockStats } = useQuery({
    queryKey: ["/api/materials-services/compliance/stats"],
    queryFn: () => Promise.resolve(mockStats),
    enabled: true
  });

  // Mutations
  const createRecordMutation = useMutation({
    mutationFn: async (data: Partial<ComplianceRecord>) => {
      return Promise.resolve({ success: true, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/compliance"] });
      toast({ title: "Sucesso", description: "Registro de compliance criado com sucesso!" });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar registro",
        variant: "destructive"
      });
    }
  });

  // Filter records
  const filteredRecords = records.filter((record: ComplianceRecord) => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesType = typeFilter === "all" || record.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || record.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4" />;
      case 'non_compliant': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'expired': return <AlertTriangle className="h-4 w-4" />;
      case 'in_review': return <Eye className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'compliant': return 'Conforme';
      case 'non_compliant': return 'Não Conforme';
      case 'pending': return 'Pendente';
      case 'expired': return 'Expirado';
      case 'in_review': return 'Em Análise';
      default: return 'Indefinido';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'audit': return <FileCheck className="h-4 w-4" />;
      case 'certification': return <Award className="h-4 w-4" />;
      case 'regulation': return <Scale className="h-4 w-4" />;
      case 'policy': return <FileText className="h-4 w-4" />;
      case 'assessment': return <BarChart3 className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const isExpiringSoon = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 30 && daysUntilDue > 0;
  };

  const handleCreateRecord = (formData: FormData) => {
    const recordData = {
      title: formData.get('title') as string,
      type: formData.get('type') as ComplianceRecord['type'],
      category: formData.get('category') as ComplianceRecord['category'],
      priority: formData.get('priority') as ComplianceRecord['priority'],
      assignedTo: formData.get('assignedTo') as string,
      dueDate: formData.get('dueDate') as string,
      description: formData.get('description') as string,
      status: 'pending' as const,
      evidence: [],
      findings: [],
      requirements: []
    };

    createRecordMutation.mutate(recordData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando compliance...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Compliance</h1>
          <p className="text-muted-foreground">
            Acompanhe conformidades, auditorias e certificações
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Registro
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conformes</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.compliantRecords}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalRecords} registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgComplianceScore}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.certificationsCurrent} certificações ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRecords}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingDueDates} vencendo em breve
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Conformidades</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openFindings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.expiredRecords} expirados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar registros de compliance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="compliant">Conforme</SelectItem>
            <SelectItem value="non_compliant">Não Conforme</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="expired">Expirado</SelectItem>
            <SelectItem value="in_review">Em Análise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="audit">Auditoria</SelectItem>
            <SelectItem value="certification">Certificação</SelectItem>
            <SelectItem value="regulation">Regulamentação</SelectItem>
            <SelectItem value="policy">Política</SelectItem>
            <SelectItem value="assessment">Avaliação</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            <SelectItem value="quality">Qualidade</SelectItem>
            <SelectItem value="safety">Segurança</SelectItem>
            <SelectItem value="environmental">Ambiental</SelectItem>
            <SelectItem value="financial">Financeiro</SelectItem>
            <SelectItem value="data_protection">Proteção de Dados</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Compliance</CardTitle>
          <CardDescription>
            {filteredRecords.length} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRecords.map((record) => {
              const expiringSoon = isExpiringSoon(record.dueDate);
              
              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      {getTypeIcon(record.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{record.title}</h3>
                        {expiringSoon && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Vencendo
                          </Badge>
                        )}
                        {record.score && (
                          <Badge variant="outline">
                            Score: {record.score}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{record.description}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {record.assignedTo}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Vence: {new Date(record.dueDate).toLocaleDateString()}
                        </span>
                        {record.findings.length > 0 && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {record.findings.length} achado(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex gap-2 mb-1">
                        <Badge className={getStatusColor(record.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(record.status)}
                            {getStatusLabel(record.status)}
                          </span>
                        </Badge>
                        <Badge className={getPriorityColor(record.priority)}>
                          {record.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        Categoria: {record.category}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(record);
                          // View record details logic
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(record);
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRecords.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum registro de compliance encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Compliance Record Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Registro de Compliance</DialogTitle>
            <DialogDescription>
              Crie um novo registro para acompanhar conformidades
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleCreateRecord(formData);
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input id="title" name="title" placeholder="Ex: ISO 9001:2015" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audit">Auditoria</SelectItem>
                    <SelectItem value="certification">Certificação</SelectItem>
                    <SelectItem value="regulation">Regulamentação</SelectItem>
                    <SelectItem value="policy">Política</SelectItem>
                    <SelectItem value="assessment">Avaliação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quality">Qualidade</SelectItem>
                    <SelectItem value="safety">Segurança</SelectItem>
                    <SelectItem value="environmental">Ambiental</SelectItem>
                    <SelectItem value="financial">Financeiro</SelectItem>
                    <SelectItem value="data_protection">Proteção de Dados</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade *</Label>
                <Select name="priority" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Responsável *</Label>
                <Input id="assignedTo" name="assignedTo" type="email" placeholder="email@empresa.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Vencimento *</Label>
                <Input id="dueDate" name="dueDate" type="date" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea id="description" name="description" rows={3} required />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createRecordMutation.isPending}>
                {createRecordMutation.isPending ? 'Criando...' : 'Criar Registro'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}