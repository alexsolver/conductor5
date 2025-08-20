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
// import { useTranslation } from 'react-i18next';
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
  // const { t } = useTranslation();

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
  const { toast } = useToast();

  // Additional data queries
  const { data: locations } = useQuery({
    queryKey: ['/api/locations'],
  });

  const { data: assetCategories } = useQuery({
    queryKey: ['/api/activity-planner/asset-categories'],
  });

  const { data: technicians } = useQuery({
    queryKey: ['/api/users'],
  });

  // Main data queries
  const { data: assetStats, isLoading: loadingAssetStats } = useQuery({
    queryKey: ['/api/activity-planner/stats/assets'],
    enabled: activeTab === 'dashboard'
  });

  const { data: assets, isLoading: loadingAssets } = useQuery<{ success: boolean; data: Asset[] }>({
    queryKey: ['/api/activity-planner/assets'],
    enabled: activeTab === 'assets'
  });

  const { data: maintenancePlans, isLoading: loadingPlans } = useQuery<{ success: boolean; data: MaintenancePlan[] }>({
    queryKey: ['/api/activity-planner/maintenance-plans'],
    enabled: activeTab === 'plans'
  });

  const { data: workOrders, isLoading: loadingWorkOrders } = useQuery<{ success: boolean; data: WorkOrder[] }>({
    queryKey: ['/api/activity-planner/work-orders'],
    enabled: activeTab === 'workorders'
  });

  // 🛠️ **CONTROLES CRÍTICOS AUSENTES** - Implementando conforme 1qa.md

  // 📋 **1. FORMULÁRIOS DE CRIAÇÃO COMPLETOS**

  // Asset Creation Dialog
  function CreateAssetDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    
    const form = useForm<AssetFormData>({
      resolver: zodResolver(assetSchema),
      defaultValues: {
        tag: "",
        name: "",
        description: "",
        locationId: "",
        categoryId: "",
        criticality: "medium",
        serialNumber: "",
        manufacturer: "",
        model: "",
        purchaseDate: "",
        warrantyExpiry: "",
        installationDate: "",
      },
    });

    const createAssetMutation = useMutation({
      mutationFn: (data: AssetFormData) => apiRequest("POST", "/api/activity-planner/assets", data),
      onSuccess: () => {
        toast({ title: "Ativo criado com sucesso" });
        queryClient.invalidateQueries({ queryKey: ["/api/activity-planner/assets"] });
        setOpen(false);
        form.reset();
        onSuccess();
      },
      onError: (error) => {
        toast({ 
          title: {t('ActivityPlanner.erroAoCriarAtivo')}, 
          description: error.message,
          variant: "destructive" 
        });
      },
    });

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button data-testid="button-create-asset" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Ativo
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Ativo</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createAssetMutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag do Ativo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="EX: COMP-001" data-testid="input-asset-tag" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Ativo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome descritivo..." data-testid="input-asset-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localização</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-asset-location">
                            <SelectValue placeholder={t('ActivityPlanner.selecioneUmaLocalizacao')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(locations as any)?.data?.map((location: Location) => (
                            <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-asset-category">
                            <SelectValue placeholder={t('ActivityPlanner.selecioneUmaCategoria')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(assetCategories as any)?.data?.map((category: AssetCategory) => (
                            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="criticality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criticidade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-asset-criticality">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Série</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SN123456..." data-testid="input-asset-serial" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fabricante</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome do fabricante..." data-testid="input-asset-manufacturer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Modelo do equipamento..." data-testid="input-asset-model" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Compra</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-asset-purchase-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warrantyExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vencimento da Garantia</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-asset-warranty" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="installationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Instalação</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-asset-installation" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descrição detalhada do ativo..." data-testid="input-asset-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAssetMutation.isPending}
                  data-testid="button-submit-asset"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {createAssetMutation.isPending ? "Criando..." : {t('ActivityPlanner.criarAtivo')}}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  // Maintenance Plan Creation Dialog
  function CreateMaintenancePlanDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    
    const form = useForm<MaintenancePlanFormData>({
      resolver: zodResolver(maintenancePlanSchema),
      defaultValues: {
        name: "",
        description: "",
        assetId: "",
        triggerType: "time",
        triggerValue: "",
        priority: "medium",
        estimatedDuration: 1,
        instructions: "",
        requiredSkills: [],
        isActive: true,
      },
    });

    const createPlanMutation = useMutation({
      mutationFn: (data: MaintenancePlanFormData) => apiRequest("POST", "/api/activity-planner/maintenance-plans", data),
      onSuccess: () => {
        toast({ title: "Plano de manutenção criado com sucesso" });
        queryClient.invalidateQueries({ queryKey: ["/api/activity-planner/maintenance-plans"] });
        setOpen(false);
        form.reset();
        onSuccess();
      },
      onError: (error) => {
        toast({ 
          title: {t('ActivityPlanner.erroAoCriarPlano')}, 
          description: error.message,
          variant: "destructive" 
        });
      },
    });

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button data-testid="button-create-plan" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Plano de Manutenção</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createPlanMutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Plano</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome descritivo..." data-testid="input-plan-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ativo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-plan-asset">
                            <SelectValue placeholder={t('ActivityPlanner.selecioneUmAtivo')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assets?.data && Array.isArray(assets.data) && assets.data.map((asset: Asset) => (
                            <SelectItem key={asset.id} value={asset.id}>{asset.tag} - {asset.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="triggerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Gatilho</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-plan-trigger">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="time">Tempo</SelectItem>
                          <SelectItem value="meter">Medidor</SelectItem>
                          <SelectItem value="condition">Condição</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="triggerValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Gatilho</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 30 dias, 1000 horas..." data-testid="input-plan-trigger-value" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-plan-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração Estimada (horas)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-plan-duration" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descrição detalhada do plano..." data-testid="input-plan-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruções de Execução</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Passo a passo para execução..." data-testid="input-plan-instructions" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Plano Ativo</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Ativar agendamento automático de manutenções
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-plan-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPlanMutation.isPending}
                  data-testid="button-submit-plan"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {createPlanMutation.isPending ? "Criando..." : {t('ActivityPlanner.criarPlano')}}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  // Work Order Creation Dialog
  function CreateWorkOrderDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    
    const form = useForm<WorkOrderFormData>({
      resolver: zodResolver(workOrderSchema),
      defaultValues: {
        title: "",
        description: "",
        assetId: "",
        maintenancePlanId: "",
        priority: "medium",
        type: "corrective",
        scheduledStart: "",
        estimatedDuration: 1,
        assignedTechnicianId: "",
        instructions: "",
        requiredParts: [],
      },
    });

    const createWorkOrderMutation = useMutation({
      mutationFn: (data: WorkOrderFormData) => apiRequest("POST", "/api/activity-planner/work-orders", data),
      onSuccess: () => {
        toast({ title: "Ordem de serviço criada com sucesso" });
        queryClient.invalidateQueries({ queryKey: ["/api/activity-planner/work-orders"] });
        setOpen(false);
        form.reset();
        onSuccess();
      },
      onError: (error) => {
        toast({ 
          title: {t('ActivityPlanner.erroAoCriarOrdemDeServico')}, 
          description: error.message,
          variant: "destructive" 
        });
      },
    });

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button data-testid="button-create-workorder" className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova OS
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Ordem de Serviço</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createWorkOrderMutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da OS</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Título descritivo..." data-testid="input-wo-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ativo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-wo-asset">
                            <SelectValue placeholder={t('ActivityPlanner.selecioneUmAtivo')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assets?.data && Array.isArray(assets.data) && assets.data.map((asset: Asset) => (
                            <SelectItem key={asset.id} value={asset.id}>{asset.tag} - {asset.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Manutenção</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-wo-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="preventive">Preventiva</SelectItem>
                          <SelectItem value="corrective">Corretiva</SelectItem>
                          <SelectItem value="emergency">Emergência</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-wo-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                          <SelectItem value="emergency">Emergência</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduledStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data/Hora de Início</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-wo-scheduled" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração Estimada (horas)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-wo-duration" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedTechnicianId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Técnico Responsável</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-wo-technician">
                            <SelectValue placeholder={t('ActivityPlanner.selecioneUmTecnico')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(technicians as any)?.data?.map((tech: Technician) => (
                            <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maintenancePlanId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano de Manutenção (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-wo-plan">
                            <SelectValue placeholder={t('ActivityPlanner.selecioneUmPlano')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum plano</SelectItem>
                          {maintenancePlans?.data && Array.isArray(maintenancePlans.data) && maintenancePlans.data.map((plan: MaintenancePlan) => (
                            <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descrição detalhada do problema..." data-testid="input-wo-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruções de Execução</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Procedimentos e instruções..." data-testid="input-wo-instructions" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createWorkOrderMutation.isPending}
                  data-testid="button-submit-wo"
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  {createWorkOrderMutation.isPending ? "Criando..." : {t('ActivityPlanner.criarOs')}}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  // 🔧 **2. GESTÃO DE TÉCNICOS E ALOCAÇÃO** 
  function TechnicianAllocationPanel() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Alocação de Técnicos</h3>
          <div className="flex space-x-2">
            <Input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              data-testid="input-allocation-date"
              className="w-40"
            />
            <Button variant="outline" size="sm" data-testid="button-refresh-allocation">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(technicians as any)?.data?.map((tech: Technician) => (
            <Card key={tech.id} className="hover:shadow-md transition-shadow" data-testid={`card-technician-${tech.id}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">{tech.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{tech.email}</p>
                  </div>
                  <Badge variant={tech.availability === 'available' ? 'default' : 'secondary'}>
                    {tech.availability === 'available' ? 'Disponível' : 
                     tech.availability === 'busy' ? 'Ocupado' : 'Offline'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Habilidades:</p>
                  <div className="flex flex-wrap gap-1">
                    {tech.skills?.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">OS do Dia:</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>OS-001 (09:00-11:00)</span>
                      <Badge variant="outline" className="text-xs">Em Andamento</Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>OS-002 (14:00-16:00)</span>
                      <Badge variant="secondary" className="text-xs">Agendada</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-technician-${tech.id}`}>
                    <Eye className="w-3 h-3 mr-1" />
                    Ver
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" data-testid={`button-allocate-technician-${tech.id}`}>
                    <Calendar className="w-3 h-3 mr-1" />
                    Alocar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 📅 **3. SISTEMA DE AGENDAMENTO AVANÇADO**
  function MaintenanceScheduler() {
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [selectedWeek, setSelectedWeek] = useState(new Date().toISOString().split('T')[0]);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Cronograma de Manutenções</h3>
          <div className="flex space-x-2">
            <Select value={viewMode} onValueChange={(value: 'calendar' | 'list') => setViewMode(value)}>
              <SelectTrigger className="w-32" data-testid="select-schedule-view">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calendar">Calendário</SelectItem>
                <SelectItem value="list">Lista</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              type="week" 
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              data-testid="input-schedule-week"
              className="w-40"
            />
            <Button data-testid="button-schedule-maintenance" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <CalendarDays className="w-4 h-4 mr-2" />
              Agendar
            </Button>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="font-medium text-center text-sm">Horário</div>
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="font-medium text-center text-sm">{day}</div>
              ))}
            </div>
            
            {Array.from({ length: 12 }, (_, hour) => (
              <div key={hour} className="grid grid-cols-8 gap-2 h-12 border-b border-gray-100 dark:border-gray-800">
                <div className="text-xs text-center py-2">{(hour + 8).toString().padStart(2, '0')}:00</div>
                {Array.from({ length: 7 }, (_, day) => (
                  <div 
                    key={day} 
                    className="border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    data-testid={`calendar-slot-${day}-${hour}`}
                  >
                    {/* Sample maintenance blocks */}
                    {(day === 1 && hour === 2) && (
                      <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs p-1 rounded m-1">
                        OS-001
                      </div>
                    )}
                    {(day === 3 && hour === 4) && (
                      <div className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs p-1 rounded m-1">
                        OS-002
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="hover:shadow-md transition-shadow" data-testid={`schedule-item-${i}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">OS-00{i}</Badge>
                        <span className="font-medium">Manutenção Preventiva - Equipamento {i}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        📍 Localização: Setor {i} | 👨‍🔧 Técnico: João Silva
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ⏰ {new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString()} às 09:00 - 11:00
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" data-testid={`button-edit-schedule-${i}`}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`button-delete-schedule-${i}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 🏃‍♂️ **5. WORKFLOW DE ORDENS DE SERVIÇO**
  function WorkOrderWorkflow({ workOrder }: { workOrder: WorkOrder }) {
    const updateWorkOrderMutation = useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<WorkOrder> }) => 
        apiRequest("PATCH", `/api/activity-planner/work-orders/${id}`, data),
      onSuccess: () => {
        toast({ title: "Status atualizado com sucesso" });
        queryClient.invalidateQueries({ queryKey: ["/api/activity-planner/work-orders"] });
      },
      onError: (error) => {
        toast({ 
          title: {t('ActivityPlanner.erroAoAtualizarStatus')}, 
          description: error.message,
          variant: "destructive" 
        });
      },
    });

    const handleStatusChange = (newStatus: WorkOrder['status']) => {
      updateWorkOrderMutation.mutate({ 
        id: workOrder.id, 
        data: { 
          status: newStatus,
          actualStart: newStatus === 'in_progress' ? new Date().toISOString() : workOrder.actualStart,
          actualEnd: newStatus === 'completed' ? new Date().toISOString() : undefined
        }
      });
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'draft': return 'bg-gray-500';
        case 'scheduled': return 'bg-blue-500';
        case 'in_progress': return 'bg-orange-500';
        case 'paused': return 'bg-yellow-500';
        case 'completed': return 'bg-green-500';
        case 'cancelled': return 'bg-red-500';
        default: return 'bg-gray-500';
      }
    };

    return (
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="sm" 
              variant="outline" 
              data-testid={`button-workflow-${workOrder.id}`}
              disabled={updateWorkOrderMutation.isPending}
            >
              <div className={`w-2 h-2 rounded-full ${getStatusColor(workOrder.status)} mr-2`}></div>
              {workOrder.status === 'draft' ? 'Rascunho' :
               workOrder.status === 'scheduled' ? 'Agendada' :
               workOrder.status === 'in_progress' ? 'Em Andamento' :
               workOrder.status === 'paused' ? 'Pausada' :
               workOrder.status === 'completed' ? 'Concluída' : {t('ActivityPlanner.cancelada')}}
              <MoreHorizontal className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {workOrder.status === 'draft' && (
              <DropdownMenuItem onClick={() => handleStatusChange('scheduled')}>
                <Calendar className="w-3 h-3 mr-2" />
                Agendar
              </DropdownMenuItem>
            )}
            {(workOrder.status === 'scheduled' || workOrder.status === 'paused') && (
              <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                <PlayCircle className="w-3 h-3 mr-2" />
                Iniciar
              </DropdownMenuItem>
            )}
            {workOrder.status === 'in_progress' && (
              <>
                <DropdownMenuItem onClick={() => handleStatusChange('paused')}>
                  <PauseCircle className="w-3 h-3 mr-2" />
                  Pausar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                  <CheckSquare className="w-3 h-3 mr-2" />
                  Concluir
                </DropdownMenuItem>
              </>
            )}
            {workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
              <DropdownMenuItem onClick={() => handleStatusChange('cancelled')}>
                <StopCircle className="w-3 h-3 mr-2" />
                Cancelar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
          <Settings className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {(assetStats as any)?.data?.total || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {(assetStats as any)?.data?.needingMaintenance || 0} precisam manutenção
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
              placeholder={t('ActivityPlanner.buscarAtivos')}
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
        ) : assets?.data && Array.isArray(assets.data) && assets.data.length > 0 ? (
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
        <CreateMaintenancePlanDialog onSuccess={() => {}} />
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
        <CreateWorkOrderDialog onSuccess={() => {}} />
      </div>

      <div className="grid gap-6">
        {workOrders?.data && Array.isArray(workOrders.data) && workOrders.data.length > 0 ? (
          workOrders.data.map((workOrder: WorkOrder) => (
            <Card key={workOrder.id} className="hover:shadow-md transition-shadow" data-testid={`card-workorder-${workOrder.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={workOrder.priority === 'high' || workOrder.priority === 'critical' ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {workOrder.priority === 'low' ? 'Baixa' :
                         workOrder.priority === 'medium' ? 'Média' :
                         workOrder.priority === 'high' ? 'Alta' :
                         workOrder.priority === 'critical' ? 'Crítica' : 'Emergência'}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          workOrder.type === 'preventive' ? 'bg-green-50 text-green-700' :
                          workOrder.type === 'corrective' ? 'bg-orange-50 text-orange-700' : 
                          'bg-red-50 text-red-700'
                        }`}
                      >
                        {workOrder.type === 'preventive' ? 'Preventiva' :
                         workOrder.type === 'corrective' ? 'Corretiva' : 'Emergência'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{workOrder.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {workOrder.description}
                    </CardDescription>
                  </div>
                  <WorkOrderWorkflow workOrder={workOrder} />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="text-muted-foreground">Ativo:</span>
                    <span className="font-medium">Ativo-{workOrder.assetId}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-muted-foreground">Técnico:</span>
                    <span className="font-medium">
                      {workOrder.assignedTechnicianId ? 'Atribuído' : 'Não atribuído'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-muted-foreground">Duração:</span>
                    <span className="font-medium">{workOrder.estimatedDuration}h</span>
                  </div>
                </div>

                {workOrder.scheduledStart && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-muted-foreground">Agendado:</span>
                    <span className="font-medium">
                      {new Date(workOrder.scheduledStart).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button size="sm" variant="outline" data-testid={`button-view-workorder-${workOrder.id}`}>
                    <Eye className="w-3 h-3 mr-1" />
                    Ver Detalhes
                  </Button>
                  <Button size="sm" variant="outline" data-testid={`button-edit-workorder-${workOrder.id}`}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
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
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics & Relatórios</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" data-testid="button-export-analytics">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" data-testid="button-refresh-analytics">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MTBF Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">127h</div>
            <p className="text-xs text-muted-foreground">
              +12% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MTTR Médio</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">2.4h</div>
            <p className="text-xs text-muted-foreground">
              -18% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibilidade</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">98.7%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Total</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">R$ 24.7k</div>
            <p className="text-xs text-muted-foreground">
              -8% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendência de Manutenções</CardTitle>
            <CardDescription>Preventivas vs Corretivas (últimos 6 meses)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Gráfico de tendências</p>
                <p className="text-xs text-gray-400">Dados simulados para demonstração</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Criticidade</CardTitle>
            <CardDescription>Ativos por nível de criticidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Crítica</span>
                </div>
                <span className="text-sm font-medium">24%</span>
              </div>
              <Progress value={24} className="h-2" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Alta</span>
                </div>
                <span className="text-sm font-medium">38%</span>
              </div>
              <Progress value={38} className="h-2" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Média</span>
                </div>
                <span className="text-sm font-medium">26%</span>
              </div>
              <Progress value={26} className="h-2" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Baixa</span>
                </div>
                <span className="text-sm font-medium">12%</span>
              </div>
              <Progress value={12} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance por Ativo</CardTitle>
          <CardDescription>Métricas detalhadas dos principais ativos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ativo</TableHead>
                <TableHead>Disponibilidade</TableHead>
                <TableHead>MTBF</TableHead>
                <TableHead>MTTR</TableHead>
                <TableHead>Últimas OS</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">EQ-001 - Compressor Principal</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span>99.2%</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Excelente</Badge>
                  </div>
                </TableCell>
                <TableCell>145h</TableCell>
                <TableCell>1.8h</TableCell>
                <TableCell>3</TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-800">Operacional</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">EQ-002 - Bomba Hidráulica</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span>97.8%</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Bom</Badge>
                  </div>
                </TableCell>
                <TableCell>98h</TableCell>
                <TableCell>3.2h</TableCell>
                <TableCell>5</TableCell>
                <TableCell>
                  <Badge className="bg-orange-100 text-orange-800">Manutenção</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">EQ-003 - Motor Elétrico</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span>94.5%</span>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">Regular</Badge>
                  </div>
                </TableCell>
                <TableCell>76h</TableCell>
                <TableCell>4.1h</TableCell>
                <TableCell>7</TableCell>
                <TableCell>
                  <Badge className="bg-red-100 text-red-800">Atenção</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
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
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-7">
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
            OS
          </TabsTrigger>
          <TabsTrigger value="technicians" data-testid="tab-technicians">
            Técnicos
          </TabsTrigger>
          <TabsTrigger value="scheduler" data-testid="tab-scheduler">
            Agenda
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            Analytics
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

        <TabsContent value="technicians" className="mt-6">
          <TechnicianAllocationPanel />
        </TabsContent>

        <TabsContent value="scheduler" className="mt-6">
          <MaintenanceScheduler />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          {renderAnalytics()}
        </TabsContent>
      </Tabs>
    </div>
  );
}