/**
 * ActivityPlanner - Página principal do módulo de planejamento de atividades
 * Interface unificada para gestão de ativos, planos e ordens de serviço
 * Seguindo padrões de design system e 1qa.md
 */

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Settings, 
  Wrench, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  MapPin,
  Search,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  Users,
  BarChart3,
  CalendarDays,
  User,
  PlayCircle,
  PauseCircle,
  StopCircle,
  MoreHorizontal,
  CheckSquare
} from 'lucide-react';

// Form Schemas following 1qa.md patterns
const assetSchema = z.object({
  tag: z.string().min(1, 'Tag é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  locationId: z.string().min(1, 'Localização é obrigatória'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  criticality: z.enum(['low', 'medium', 'high', 'critical']),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  installationDate: z.string().optional(),
});

const maintenancePlanSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  assetId: z.string().min(1, 'Ativo é obrigatório'),
  triggerType: z.enum(['time', 'meter', 'condition']),
  triggerValue: z.string().min(1, 'Valor do gatilho é obrigatório'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  estimatedDuration: z.number().min(1, 'Duração estimada é obrigatória'),
  instructions: z.string().optional(),
  requiredSkills: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

const workOrderSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  assetId: z.string().min(1, 'Ativo é obrigatório'),
  maintenancePlanId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical', 'emergency']),
  type: z.enum(['preventive', 'corrective', 'emergency']),
  scheduledStart: z.string().min(1, 'Data de início é obrigatória'),
  estimatedDuration: z.number().min(1, 'Duração estimada é obrigatória'),
  assignedTechnicianId: z.string().optional(),
  instructions: z.string().optional(),
  requiredParts: z.array(z.string()).optional(),
});

type AssetFormData = z.infer<typeof assetSchema>;
type MaintenancePlanFormData = z.infer<typeof maintenancePlanSchema>;
type WorkOrderFormData = z.infer<typeof workOrderSchema>;

interface Asset {
  id: string;
  tag: string;
  name: string;
  description?: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
  locationId: string;
  categoryId: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  location?: { name: string };
  category?: { name: string };
}

interface MaintenancePlan {
  id: string;
  name: string;
  description?: string;
  assetId: string;
  triggerType: 'time' | 'meter' | 'condition';
  triggerValue: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;
  instructions?: string;
  requiredSkills?: string[];
  isActive: boolean;
  nextScheduledAt?: string;
  asset?: { tag: string; name: string };
}

interface WorkOrder {
  id: string;
  title: string;
  description?: string;
  assetId: string;
  maintenancePlanId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  type: 'preventive' | 'corrective' | 'emergency';
  status: 'draft' | 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  scheduledStart: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  estimatedDuration: number;
  assignedTechnicianId?: string;
  instructions?: string;
  requiredParts?: string[];
  completionPercentage: number;
  asset?: { tag: string; name: string };
  assignedTechnician?: { name: string };
}

interface Technician {
  id: string;
  name: string;
  email: string;
  skills: string[];
  availability: 'available' | 'busy' | 'offline';
}

interface Location {
  id: string;
  name: string;
}

interface AssetCategory {
  id: string;
  name: string;
}

const criticalityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  medium: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  emergency: 'bg-red-500 text-white dark:bg-red-600'
};

export default function ActivityPlanner() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Queries para dados
  const { data: assetStats, isLoading: loadingAssetStats } = useQuery({
    queryKey: ['/api/activity-planner/stats/assets'],
    enabled: activeTab === 'dashboard'
  });

  const { data: assets, isLoading: loadingAssets } = useQuery({
    queryKey: ['/api/activity-planner/assets'],
    enabled: activeTab === 'assets'
  });

  const { data: maintenancePlans, isLoading: loadingPlans } = useQuery({
    queryKey: ['/api/activity-planner/maintenance-plans'],
    enabled: activeTab === 'plans'
  });

  const { data: workOrders, isLoading: loadingWorkOrders } = useQuery({
    queryKey: ['/api/activity-planner/work-orders'],
    enabled: activeTab === 'workorders'
  });

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
          <Settings className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {assetStats?.data?.total || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {assetStats?.data?.needingMaintenance || 0} precisam manutenção
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
          <Calendar className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">0</div>
          <p className="text-xs text-muted-foreground">
            0 aguardando geração
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">OS em Andamento</CardTitle>
          <Wrench className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">0</div>
          <p className="text-xs text-muted-foreground">
            0 atrasadas
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
          <CheckCircle className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">95%</div>
          <p className="text-xs text-muted-foreground">
            SLA cumprido
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderAssets = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar ativos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
              data-testid="input-search-assets"
            />
          </div>
          <Button variant="outline" size="sm" data-testid="button-filter-assets">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" data-testid="button-export-assets">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" data-testid="button-create-asset">
            <Plus className="h-4 w-4 mr-2" />
            Novo Ativo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loadingAssets ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : assets?.data?.length > 0 ? (
          assets.data.map((asset: Asset) => (
            <Card key={asset.id} className="hover:shadow-md transition-shadow" data-testid={`card-asset-${asset.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{asset.tag}</CardTitle>
                    <CardDescription>{asset.name}</CardDescription>
                  </div>
                  <Badge className={criticalityColors[asset.criticality]}>
                    {asset.criticality}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    Status: {asset.status}
                  </div>
                  {asset.nextMaintenanceDate && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      Próxima manutenção: {new Date(asset.nextMaintenanceDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhum ativo encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Comece criando seu primeiro ativo para gerenciar manutenções.
            </p>
            <Button data-testid="button-create-first-asset">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Ativo
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderMaintenancePlans = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Planos de Manutenção</h2>
        <Button data-testid="button-create-plan">
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhum plano de manutenção
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Configure planos preventivos para automatizar a manutenção dos seus ativos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWorkOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ordens de Serviço</h2>
        <Button data-testid="button-create-workorder">
          <Plus className="h-4 w-4 mr-2" />
          Nova OS
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhuma ordem de serviço
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Crie ordens de serviço para gerenciar trabalhos de manutenção.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Planejador de Atividades
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie ativos, planos de manutenção e ordens de serviço de forma integrada
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="assets" data-testid="tab-assets">
            Ativos
          </TabsTrigger>
          <TabsTrigger value="plans" data-testid="tab-plans">
            Planos
          </TabsTrigger>
          <TabsTrigger value="workorders" data-testid="tab-workorders">
            Ordens de Serviço
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="assets" className="mt-6">
          {renderAssets()}
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          {renderMaintenancePlans()}
        </TabsContent>

        <TabsContent value="workorders" className="mt-6">
          {renderWorkOrders()}
        </TabsContent>
      </Tabs>
    </div>
  );
}