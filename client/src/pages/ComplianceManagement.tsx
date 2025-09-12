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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  FileSearch, 
  Award, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Eye,
  Upload,
  Calendar,
  BarChart3,
  Users,
  Star
} from 'lucide-react';

interface ComplianceAudit {
  id: string;
  title: string;
  type: 'internal' | 'external' | 'regulatory';
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  auditor: string;
  scheduledDate?: string;
  completedDate?: string;
  score?: string;
  findings: number;
  createdAt: string;
}

interface ComplianceCertification {
  id: string;
  name: string;
  standard: string;
  status: 'active' | 'expired' | 'pending' | 'suspended';
  issueDate: string;
  expirationDate?: string;
  certifyingBody: string;
  scope: string;
  documentUrl?: string;
}

interface ComplianceAlert {
  id: string;
  type: 'expiration' | 'audit' | 'violation' | 'reminder';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'active' | 'acknowledged' | 'resolved';
  triggerDate: string;
  dueDate?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

interface ComplianceScore {
  id: string;
  entityType: string;
  entityId: string;
  score: string;
  assessedAt: string;
  assessedBy?: string;
  notes?: string;
  breakdown?: any;
}

interface ComplianceStats {
  audits: {
    total: number;
    completed: number;
    planning: number;
    inProgress: number;
    completionRate: number;
  };
  certifications: {
    total: number;
    active: number;
    expired: number;
    expiring: number;
    activeRate: number;
  };
  alerts: {
    total: number;
    active: number;
    critical: number;
  };
  overallScore: number;
  complianceLevel: string;
}

export default function ComplianceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateAuditOpen, setIsCreateAuditOpen] = useState(false);
  const [isCreateCertOpen, setIsCreateCertOpen] = useState(false);
  const [isCreateEvidenceOpen, setIsCreateEvidenceOpen] = useState(false);

  // Fetch compliance stats
  const { data: stats } = useQuery<ComplianceStats>({
    queryKey: ['/api/materials-services/compliance/stats'],
    queryFn: () => apiRequest('GET', '/api/materials-services/compliance/stats')
  });

  // Fetch audits
  const { data: auditsResponse, isLoading: auditsLoading } = useQuery({
    queryKey: ['/api/materials-services/compliance/audits'],
    queryFn: () => apiRequest('GET', '/api/materials-services/compliance/audits')
  });

  const audits = Array.isArray(auditsResponse?.data) ? auditsResponse.data : 
                 Array.isArray(auditsResponse) ? auditsResponse : [];

  // Fetch certifications
  const { data: certificationsResponse } = useQuery({
    queryKey: ['/api/materials-services/compliance/certifications'],
    queryFn: () => apiRequest('GET', '/api/materials-services/compliance/certifications')
  });

  const certifications = Array.isArray(certificationsResponse?.data) ? certificationsResponse.data : 
                         Array.isArray(certificationsResponse) ? certificationsResponse : [];

  // Fetch alerts
  const { data: alertsResponse } = useQuery({
    queryKey: ['/api/materials-services/compliance/alerts'],
    queryFn: () => apiRequest('GET', '/api/materials-services/compliance/alerts')
  });

  const alerts = Array.isArray(alertsResponse?.data) ? alertsResponse.data : 
                 Array.isArray(alertsResponse) ? alertsResponse : [];

  // Fetch compliance scores
  const { data: scoresResponse } = useQuery({
    queryKey: ['/api/materials-services/compliance/scores'],
    queryFn: () => apiRequest('GET', '/api/materials-services/compliance/scores')
  });

  const scores = Array.isArray(scoresResponse?.data) ? scoresResponse.data : 
                 Array.isArray(scoresResponse) ? scoresResponse : [];

  // Create audit mutation
  const createAuditMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/materials-services/compliance/audits', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/compliance/audits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/compliance/stats'] });
      setIsCreateAuditOpen(false);
      toast({ title: 'Auditoria criada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar auditoria', variant: 'destructive' });
    }
  });

  // Create certification mutation
  const createCertificationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/materials-services/compliance/certifications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/compliance/certifications'] });
      setIsCreateCertOpen(false);
      toast({ title: 'Certificação criada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar certificação', variant: 'destructive' });
    }
  });

  // Create evidence mutation
  const createEvidenceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/materials-services/compliance/evidence', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/compliance/evidence'] });
      setIsCreateEvidenceOpen(false);
      toast({ title: 'Evidência criada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar evidência', variant: 'destructive' });
    }
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: string) => apiRequest('POST', `/api/materials-services/compliance/alerts/${alertId}/acknowledge`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/compliance/alerts'] });
      toast({ title: 'Alerta reconhecido!' });
    },
    onError: () => {
      toast({ title: 'Erro ao reconhecer alerta', variant: 'destructive' });
    }
  });

  // Generate expiration alerts mutation
  const generateAlertsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/materials-services/compliance/alerts/generate-expiration'),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/compliance/alerts'] });
      toast({ title: `${result.alerts?.length || 0} alertas de vencimento gerados!` });
    },
    onError: () => {
      toast({ title: 'Erro ao gerar alertas', variant: 'destructive' });
    }
  });

  const getStatusBadge = (status: string, type: 'audit' | 'cert' | 'alert') => {
    if (type === 'audit') {
      const variants = {
        planning: 'outline',
        in_progress: 'secondary',
        completed: 'default',
        cancelled: 'destructive'
      } as const;
      return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
    }
    
    if (type === 'cert') {
      const variants = {
        active: 'default',
        expired: 'destructive',
        pending: 'secondary',
        suspended: 'outline'
      } as const;
      return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
    }
    
    if (type === 'alert') {
      const variants = {
        active: 'destructive',
        acknowledged: 'secondary',
        resolved: 'default'
      } as const;
      return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
    }
    
    return <Badge variant="outline">{status}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'outline',
      medium: 'secondary',
      high: 'destructive',
      critical: 'destructive'
    } as const;
    
    return <Badge variant={variants[severity as keyof typeof variants] || 'outline'}>{severity}</Badge>;
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Compliance</h1>
          <p className="text-muted-foreground">Sistema completo de auditorias, certificações e evidências</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isCreateAuditOpen} onOpenChange={setIsCreateAuditOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Auditoria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Auditoria</DialogTitle>
                <DialogDescription>
                  Configure uma nova auditoria de compliance
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createAuditMutation.mutate({
                  title: formData.get('title'),
                  type: formData.get('type'),
                  auditor: formData.get('auditor'),
                  scheduledDate: formData.get('scheduledDate'),
                  scope: formData.get('scope'),
                  objectives: formData.get('objectives')
                });
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título da Auditoria *</Label>
                    <Input name="title" required placeholder="Ex: Auditoria ISO 9001:2015" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Interna</SelectItem>
                        <SelectItem value="external">Externa</SelectItem>
                        <SelectItem value="regulatory">Regulatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="auditor">Auditor Responsável *</Label>
                    <Input name="auditor" required placeholder="Nome do auditor" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">Data Agendada</Label>
                    <Input name="scheduledDate" type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope">Escopo</Label>
                  <Input name="scope" placeholder="Ex: Processos produtivos e qualidade" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectives">Objetivos</Label>
                  <Textarea name="objectives" placeholder="Descreva os objetivos da auditoria..." />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateAuditOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createAuditMutation.isPending}>
                    {createAuditMutation.isPending ? 'Criando...' : 'Criar Auditoria'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateCertOpen} onOpenChange={setIsCreateCertOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Award className="w-4 h-4 mr-2" />
                Nova Certificação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Certificação</DialogTitle>
                <DialogDescription>
                  Registre uma nova certificação ou norma
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createCertificationMutation.mutate({
                  name: formData.get('name'),
                  standard: formData.get('standard'),
                  certifyingBody: formData.get('certifyingBody'),
                  scope: formData.get('scope'),
                  issueDate: formData.get('issueDate'),
                  expirationDate: formData.get('expirationDate')
                });
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Certificação *</Label>
                  <Input name="name" required placeholder="Ex: ISO 9001:2015" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="standard">Norma/Padrão</Label>
                    <Input name="standard" placeholder="Ex: ISO 9001:2015" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certifyingBody">Órgão Certificador</Label>
                    <Input name="certifyingBody" placeholder="Ex: ABNT" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope">Escopo</Label>
                  <Textarea name="scope" placeholder="Descreva o escopo da certificação..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Data de Emissão</Label>
                    <Input name="issueDate" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expirationDate">Data de Vencimento</Label>
                    <Input name="expirationDate" type="date" />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateCertOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCertificationMutation.isPending}>
                    {createCertificationMutation.isPending ? 'Criando...' : 'Criar Certificação'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline"
            onClick={() => generateAlertsMutation.mutate()}
            disabled={generateAlertsMutation.isPending}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Gerar Alertas
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Geral</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getComplianceColor(stats?.overallScore || 0)}`}>
              {stats?.overallScore || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.complianceLevel || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auditorias</CardTitle>
            <FileSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.audits?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.audits?.completed || 0} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificações</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.certifications?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.certifications?.active || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.alerts?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.alerts?.critical || 0} críticos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.certifications?.expiring || 0}</div>
            <p className="text-xs text-muted-foreground">
              próximos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="audits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audits">Auditorias</TabsTrigger>
          <TabsTrigger value="certifications">Certificações</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="evidence">Evidências</TabsTrigger>
        </TabsList>

        <TabsContent value="audits" className="space-y-4">
          <div className="grid gap-4">
            {auditsLoading ? (
              <div className="text-center py-8">Carregando auditorias...</div>
            ) : audits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma auditoria encontrada
              </div>
            ) : (
              audits.map((audit) => (
                <Card key={audit.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{audit.title}</h3>
                          {getStatusBadge(audit.status, 'audit')}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tipo: {audit.type} | Auditor: {audit.auditor}
                        </p>
                        {audit.scheduledDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4" />
                            {new Date(audit.scheduledDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {audit.score && (
                          <div className="flex items-center gap-2 text-sm">
                            <Star className="w-4 h-4" />
                            Score: {audit.score}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-4">
          <div className="grid gap-4">
            {certifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma certificação encontrada
              </div>
            ) : (
              certifications.map((cert) => (
                <Card key={cert.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{cert.name}</h3>
                          {getStatusBadge(cert.status, 'cert')}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Padrão: {cert.standard} | Órgão: {cert.certifyingBody}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Emitido: {new Date(cert.issueDate).toLocaleDateString('pt-BR')}</span>
                          {cert.expirationDate && (
                            <span>Vence: {new Date(cert.expirationDate).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                        <p className="text-sm">{cert.scope}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        {cert.documentUrl && (
                          <Button variant="outline" size="sm">
                            <Upload className="w-4 h-4 mr-1" />
                            Documento
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum alerta encontrado
              </div>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{alert.title}</h3>
                          {getSeverityBadge(alert.severity)}
                          {getStatusBadge(alert.status, 'alert')}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tipo: {alert.type} | Disparado: {new Date(alert.triggerDate).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm">{alert.description}</p>
                        {alert.dueDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4" />
                            Vencimento: {new Date(alert.dueDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {alert.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                            disabled={acknowledgeAlertMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Reconhecer
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="scores" className="space-y-4">
          <div className="grid gap-4">
            {scores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum score encontrado
              </div>
            ) : (
              scores.map((score) => (
                <Card key={score.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Score de Compliance</h3>
                          <Badge variant="outline">{score.entityType}</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`text-3xl font-bold ${getComplianceColor(parseFloat(score.score))}`}>
                            {parseFloat(score.score).toFixed(1)}
                          </div>
                          <div className="flex-1">
                            <Progress value={parseFloat(score.score)} className="w-full" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Avaliado em: {new Date(score.assessedAt).toLocaleDateString('pt-BR')}
                          {score.assessedBy && ` por ${score.assessedBy}`}
                        </p>
                        {score.notes && <p className="text-sm">{score.notes}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Evidências</CardTitle>
              <CardDescription>
                Documentos, fotos e evidências de conformidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Upload className="w-12 h-12 mx-auto mb-4" />
                <p>Módulo de evidências em desenvolvimento</p>
                <p className="text-sm mt-2">
                  Upload de documentos, fotos e verificação de conformidade
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}