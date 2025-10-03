import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Server, 
  Users, 
  Database, 
  Activity, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  Globe,
  Shield,
  HardDrive,
  Cpu,
  BarChart3,
  UserCheck,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: string;
  createdAt: string;
  lastActivity: string;
  userCount: number;
  dbSize: string;
  monthlyUsage: number;
  contactEmail: string;
}

interface SystemStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalTickets: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: string;
}

interface PlatformUser {
  id: string;
  email: string;
  role: 'saas_admin' | 'platform_admin' | 'support';
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
  tenantAccess: string[];
}

// Define the structure for newNotification to match the creation logic
interface NewNotification {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  channels: string[];
}

const SaasAdmin: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateNotification, setShowCreateNotification] = useState(false); // State for notification dialog

  // New tenant form
  const [newTenant, setNewTenant] = useState({
    name: '',
    subdomain: '',
    plan: 'basic',
    contactEmail: '',
    adminEmail: '',
    adminPassword: ''
  });

  // New user form
  const [newUser, setNewUser] = useState({
    email: '',
    role: 'support' as const,
    password: '',
    tenantAccess: [] as string[]
  });

  // New notification form
  const [newNotification, setNewNotification] = useState<NewNotification>({
    type: 'system_notification',
    severity: 'medium',
    title: '',
    message: '',
    channels: ['in_app']
  });

  // Load system overview data
  const loadSystemStats = async () => {
    try {
      console.log('🔍 [SAAS-ADMIN-CLIENT] Loading system stats...');
      const response = await fetch('/api/saas-admin/overview', {
        credentials: 'include'
      });

      console.log('📡 [SAAS-ADMIN-CLIENT] Overview response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SAAS-ADMIN-CLIENT] System stats loaded:', data);
        setSystemStats(data);
      } else {
        const errorText = await response.text();
        console.error('❌ [SAAS-ADMIN-CLIENT] Failed to load system stats:', response.status, errorText);
        toast({
          title: "Erro ao carregar estatísticas",
          description: `Falha ao carregar dados do sistema: ${response.status}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ [SAAS-ADMIN-CLIENT] Error loading system stats:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive"
      });
    }
  };

  // Load all tenants
  const loadTenants = async () => {
    try {
      console.log('🔍 [SAAS-ADMIN-CLIENT] Loading tenants...');
      const response = await fetch('/api/saas-admin/tenants', {
        credentials: 'include'
      });

      console.log('📡 [SAAS-ADMIN-CLIENT] Tenants response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SAAS-ADMIN-CLIENT] Tenants loaded:', data);
        setTenants(data);
      } else {
        const errorText = await response.text();
        console.error('❌ [SAAS-ADMIN-CLIENT] Failed to load tenants:', response.status, errorText);
        toast({
          title: "Erro ao carregar tenants",
          description: `Falha ao carregar lista de tenants: ${response.status}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ [SAAS-ADMIN-CLIENT] Error loading tenants:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive"
      });
    }
  };

  // Load platform users
  const loadPlatformUsers = async () => {
    try {
      console.log('🔍 [SAAS-ADMIN-CLIENT] Loading platform users...');
      const response = await fetch('/api/saas-admin/platform-users', {
        credentials: 'include'
      });

      console.log('📡 [SAAS-ADMIN-CLIENT] Platform users response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SAAS-ADMIN-CLIENT] Platform users loaded:', data);
        setPlatformUsers(data);
      } else {
        const errorText = await response.text();
        console.error('❌ [SAAS-ADMIN-CLIENT] Failed to load platform users:', response.status, errorText);
        toast({
          title: "Erro ao carregar usuários",
          description: `Falha ao carregar usuários da plataforma: ${response.status}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ [SAAS-ADMIN-CLIENT] Error loading platform users:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive"
      });
    }
  };

  // Create new tenant
  const createTenant = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tenant-provisioning/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newTenant)
      });

      if (response.ok) {
        toast({
          title: "Tenant criado com sucesso",
          description: "O novo tenant foi criado e configurado automaticamente.",
        });
        setShowCreateTenant(false);
        setNewTenant({
          name: '',
          subdomain: '',
          plan: 'basic',
          contactEmail: '',
          adminEmail: '',
          adminPassword: ''
        });
        loadTenants();
      } else {
        throw new Error('Failed to create tenant');
      }
    } catch (error) {
      toast({
        title: "Erro ao criar tenant",
        description: "Ocorreu um erro ao criar o tenant. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create platform user
  const createPlatformUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/saas-admin/platform-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        toast({
          title: "Usuário criado com sucesso",
          description: "O novo usuário da plataforma foi criado.",
        });
        setShowCreateUser(false);
        setNewUser({
          email: '',
          role: 'support',
          password: '',
          tenantAccess: []
        });
        loadPlatformUsers();
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      toast({
        title: "Erro ao criar usuário",
        description: "Ocorreu um erro ao criar o usuário. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new notification
  const createNotification = async () => {
    setLoading(true);
    try {
      console.log('[SAAS-ADMIN] Creating notification with data:', newNotification);

      // Get current user from auth context
      const user = (window as any).__currentUser;

      if (!user?.id || !user?.tenantId) {
        toast({
          title: "Erro de autenticação",
          description: "Usuário não autenticado corretamente.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Prepare notification data following 1qa.md patterns
      const notificationData = {
        tenantId: user.tenantId,
        userId: user.id, // Notification creator
        type: newNotification.type,
        severity: newNotification.severity || 'medium',
        title: newNotification.title,
        message: newNotification.message,
        channels: newNotification.channels || ['in_app'],
        priority: newNotification.severity === 'critical' ? 'critical' : 'medium'
      };

      console.log('[SAAS-ADMIN] Sending notification data:', notificationData);

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(notificationData)
      });

      const result = await response.json();
      console.log('[SAAS-ADMIN] Notification creation response:', result);

      if (response.ok) {
        toast({
          title: "Notificação criada com sucesso",
          description: "A notificação foi enviada para os destinatários.",
        });
        setShowCreateNotification(false);
        setNewNotification({
          type: 'system_notification',
          severity: 'medium',
          title: '',
          message: '',
          channels: ['in_app']
        });
      } else {
        throw new Error(result.message || 'Failed to create notification');
      }
    } catch (error) {
      console.error('[SAAS-ADMIN] Error creating notification:', error);
      toast({
        title: "Erro ao criar notificação",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar a notificação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle tenant status
  const toggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const response = await fetch(`/api/saas-admin/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast({
          title: "Status atualizado",
          description: `Tenant ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso.`,
        });
        loadTenants();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do tenant.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadSystemStats();
    loadTenants();
    loadPlatformUsers();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive'
    };
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      saas_admin: 'default',
      platform_admin: 'secondary',
      support: 'outline'
    };
    return <Badge variant={variants[role as keyof typeof variants] || 'outline'}>{role}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SaaS Admin</h1>
          <p className="text-muted-foreground">
            Gerencie todos os aspectos da plataforma SaaS
          </p>
        </div>
        <Button onClick={() => {
          loadSystemStats();
          loadTenants();
          loadPlatformUsers();
        }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5"> {/* Increased cols for notification tab */}
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="tenants">Gestão de Tenant</TabsTrigger>
          <TabsTrigger value="provisioning">Provisionamento</TabsTrigger>
          <TabsTrigger value="users">Usuários da Plataforma</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger> {/* New tab for notifications */}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Tenants</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.totalTenants || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {systemStats?.activeTenants || 0} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Todos os tenants
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.totalTickets || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Sistema inteiro
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.uptime || '0d'}</div>
                <p className="text-xs text-muted-foreground">
                  Sistema online
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Carga do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>CPU</span>
                    <span>{systemStats?.systemLoad || 0}%</span>
                  </div>
                  <Progress value={systemStats?.systemLoad || 0} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uso de Memória</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>RAM</span>
                    <span>{systemStats?.memoryUsage || 0}%</span>
                  </div>
                  <Progress value={systemStats?.memoryUsage || 0} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uso de Disco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Storage</span>
                    <span>{systemStats?.diskUsage || 0}%</span>
                  </div>
                  <Progress value={systemStats?.diskUsage || 0} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tenants Management Tab */}
        <TabsContent value="tenants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Tenants</CardTitle>
              <CardDescription>
                Gerencie todos os tenants do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Subdomínio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{tenant.subdomain}</TableCell>
                      <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                      <TableCell>{tenant.plan}</TableCell>
                      <TableCell>{tenant.userCount}</TableCell>
                      <TableCell>{new Date(tenant.lastActivity).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTenant(tenant)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTenantStatus(tenant.id, tenant.status)}
                          >
                            {tenant.status === 'active' ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Provisioning Tab */}
        <TabsContent value="provisioning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Provisionamento de Tenants</CardTitle>
              <CardDescription>
                Crie e configure novos tenants automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowCreateTenant(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Novo Tenant
              </Button>
            </CardContent>
          </Card>

          <Dialog open={showCreateTenant} onOpenChange={setShowCreateTenant}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Tenant</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar um novo tenant no sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subdomain" className="text-right">
                    Subdomínio
                  </Label>
                  <Input
                    id="subdomain"
                    value={newTenant.subdomain}
                    onChange={(e) => setNewTenant({...newTenant, subdomain: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="plan" className="text-right">
                    Plano
                  </Label>
                  <Select value={newTenant.plan} onValueChange={(value) => setNewTenant({...newTenant, plan: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contactEmail" className="text-right">
                    Email Contato
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={newTenant.contactEmail}
                    onChange={(e) => setNewTenant({...newTenant, contactEmail: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="adminEmail" className="text-right">
                    Email Admin
                  </Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={newTenant.adminEmail}
                    onChange={(e) => setNewTenant({...newTenant, adminEmail: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="adminPassword" className="text-right">
                    Senha Admin
                  </Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={newTenant.adminPassword}
                    onChange={(e) => setNewTenant({...newTenant, adminPassword: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={createTenant} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Criar Tenant
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Platform Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuários da Plataforma</CardTitle>
                <CardDescription>
                  Gerencie usuários com acesso à plataforma SaaS
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateUser(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platformUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{new Date(user.lastLogin).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Criar Usuário da Plataforma</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário com acesso à plataforma SaaS.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="userEmail" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="userRole" className="text-right">
                    Função
                  </Label>
                  <Select value={newUser.role} onValueChange={(value: any) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support">Suporte</SelectItem>
                      <SelectItem value="platform_admin">Admin Plataforma</SelectItem>
                      <SelectItem value="saas_admin">SaaS Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="userPassword" className="text-right">
                    Senha
                  </Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={createPlatformUser} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Criar Usuário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciar Notificações</CardTitle>
                <CardDescription>
                  Crie e gerencie notificações para os tenants
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateNotification(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Nova Notificação
              </Button>
            </CardHeader>
            <CardContent>
              {/* Placeholder for notification table or list */}
              <p className="text-muted-foreground">Lista de notificações será exibida aqui.</p>
            </CardContent>
          </Card>

          <Dialog open={showCreateNotification} onOpenChange={setShowCreateNotification}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Notificação</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes para criar uma nova notificação.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notificationType" className="text-right">
                    Tipo
                  </Label>
                  <Select value={newNotification.type} onValueChange={(value) => setNewNotification({...newNotification, type: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system_notification">Notificação do Sistema</SelectItem>
                      <SelectItem value="maintenance_alert">Alerta de Manutenção</SelectItem>
                      <SelectItem value="marketing_message">Mensagem de Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notificationSeverity" className="text-right">
                    Severidade
                  </Label>
                  <Select value={newNotification.severity} onValueChange={(value: any) => setNewNotification({...newNotification, severity: value})}>
                    <SelectTrigger className="col-span-3">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notificationTitle" className="text-right">
                    Título
                  </Label>
                  <Input
                    id="notificationTitle"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notificationMessage" className="text-right">
                    Mensagem
                  </Label>
                  <Textarea
                    id="notificationMessage"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notificationChannels" className="text-right">
                    Canais
                  </Label>
                  <Select value={newNotification.channels[0]} onValueChange={(value) => setNewNotification({...newNotification, channels: [value]})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_app">In App</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={createNotification} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Criar Notificação
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* Tenant Details Modal */}
      {selectedTenant && (
        <Dialog open={!!selectedTenant} onOpenChange={() => setSelectedTenant(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Tenant</DialogTitle>
              <DialogDescription>
                Informações detalhadas sobre {selectedTenant.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nome</Label>
                  <p className="text-sm">{selectedTenant.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Subdomínio</Label>
                  <p className="text-sm">{selectedTenant.subdomain}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm">{getStatusBadge(selectedTenant.status)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Plano</Label>
                  <p className="text-sm">{selectedTenant.plan}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Usuários</Label>
                  <p className="text-sm">{selectedTenant.userCount}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tamanho BD</Label>
                  <p className="text-sm">{selectedTenant.dbSize}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Uso Mensal</Label>
                  <p className="text-sm">{selectedTenant.monthlyUsage}%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email Contato</Label>
                  <p className="text-sm">{selectedTenant.contactEmail}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SaasAdmin;