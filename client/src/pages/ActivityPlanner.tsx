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
// import useLocalization from '@/hooks/useLocalization';
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
  // Localization temporarily disabled
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
          title: '[TRANSLATION_NEEDED]', 
          description: error.message,
          variant: "destructive" 
        });
      },
    });
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button data-testid="button-create-asset" className="p-4"
            <Plus className="w-4 h-4 mr-2" />
            Novo Ativo
          </Button>
        </DialogTrigger>
        <DialogContent className="p-4"
          <DialogHeader>
            <DialogTitle>Criar Novo Ativo</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createAssetMutation.mutate(data))} className="p-4"
              <div className="p-4"
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
                          <SelectTrigger data-testid="select-asset-location>
                            <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                          <SelectTrigger data-testid="select-asset-category>
                            <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                          <SelectTrigger data-testid="select-asset-criticality>
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
              <div className="p-4"
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAssetMutation.isPending}
                  data-testid="button-submit-asset"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {createAssetMutation.isPending ? "Criando..." : '[TRANSLATION_NEEDED]'}
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
          title: '[TRANSLATION_NEEDED]', 
          description: error.message,
          variant: "destructive" 
        });
      },
    });
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button data-testid="button-create-plan" className="p-4"
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </DialogTrigger>
        <DialogContent className="p-4"
          <DialogHeader>
            <DialogTitle>Criar Plano de Manutenção</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createPlanMutation.mutate(data))} className="p-4"
              <div className="p-4"
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
                          <SelectTrigger data-testid="select-plan-asset>
                            <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                          <SelectTrigger data-testid="select-plan-trigger>
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
                          <SelectTrigger data-testid="select-plan-priority>
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
                  <FormItem className="p-4"
                    <div className="p-4"
                      <FormLabel className="text-lg">"Plano Ativo</FormLabel>
                      <div className="p-4"
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
              <div className="p-4"
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPlanMutation.isPending}
                  data-testid="button-submit-plan"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {createPlanMutation.isPending ? "Criando..." : '[TRANSLATION_NEEDED]'}
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
          title: '[TRANSLATION_NEEDED]', 
          description: error.message,
          variant: "destructive" 
        });
      },
    });
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button data-testid="button-create-workorder" className="p-4"
            <Plus className="w-4 h-4 mr-2" />
            Nova OS
          </Button>
        </DialogTrigger>
        <DialogContent className="p-4"
          <DialogHeader>
            <DialogTitle>Criar Ordem de Serviço</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createWorkOrderMutation.mutate(data))} className="p-4"
              <div className="p-4"
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
                          <SelectTrigger data-testid="select-wo-asset>
                            <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                          <SelectTrigger data-testid="select-wo-type>
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
                          <SelectTrigger data-testid="select-wo-priority>
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
                          <SelectTrigger data-testid="select-wo-technician>
                            <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                          <SelectTrigger data-testid="select-wo-plan>
                            <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
              <div className="p-4"
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createWorkOrderMutation.isPending}
                  data-testid="button-submit-wo"
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  {createWorkOrderMutation.isPending ? "Criando..." : '[TRANSLATION_NEEDED]'}
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
      <div className="p-4"
        <div className="p-4"
          <h3 className="text-lg">"Alocação de Técnicos</h3>
          <div className="p-4"
            <Input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              data-testid="input-allocation-date"
              className="w-40"
            />
            <Button variant="outline" size="sm" data-testid="button-refresh-allocation>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="p-4"
          {(technicians as any)?.data?.map((tech: Technician) => (
            <Card key={tech.id} className="hover:shadow-md transition-shadow" data-testid={"asset-card-
              <CardHeader className="p-4"
                <div className="p-4"
                  <div>
                    <CardTitle className="text-lg">"{tech.name}</CardTitle>
                    <p className="text-lg">"{tech.email}</p>
                  </div>
                  <Badge variant={tech.availability === 'available' ? 'default' : 'secondary'}>
                    {tech.availability === 'available' ? 'Disponível' : 
                     tech.availability === 'busy' ? 'Ocupado' : 'Offline'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4"
                <div>
                  <p className="text-lg">"Habilidades:</p>
                  <div className="p-4"
                    {tech.skills?.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-lg">"{skill}</Badge>
                    ))}
                  </div>
                </div>
                
                <div className="p-4"
                  <p className="text-lg">"OS do Dia:</p>
                  <div className="p-4"
                    <div className="p-4"
                      <span>OS-001 (09:00-11:00)</span>
                      <Badge variant="outline" className="text-lg">"Em Andamento</Badge>
                    </div>
                    <div className="p-4"
                      <span>OS-002 (14:00-16:00)</span>
                      <Badge variant="secondary" className="text-lg">"Agendada</Badge>
                    </div>
                  </div>
                </div>
                <div className="p-4"
                  <Button size="sm" variant="outline" className="flex-1" data-testid={"asset-card-
                    <Eye className="w-3 h-3 mr-1" />
                    Ver
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" data-testid={"asset-card-
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
      <div className="p-4"
        <div className="p-4"
          <h3 className="text-lg">"Cronograma de Manutenções</h3>
          <div className="p-4"
            <Select value={viewMode} onValueChange={(value: 'calendar' | 'list') => setViewMode(value)}>
              <SelectTrigger className="w-32" data-testid="select-schedule-view>
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
            <Button data-testid="button-schedule-maintenance" className="p-4"
              <CalendarDays className="w-4 h-4 mr-2" />
              Agendar
            </Button>
          </div>
        </div>
        {viewMode === 'calendar' ? (
          <div className="p-4"
            <div className="p-4"
              <div className="text-lg">"Horário</div>
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="text-lg">"{day}</div>
              ))}
            </div>
            
            {Array.from({ length: 12 }, (_, hour) => (
              <div key={hour} className="p-4"
                <div className="text-lg">"{(hour + 8).toString().padStart(2, '0')}:00</div>
                {Array.from({ length: 7 }, (_, day) => (
                  <div 
                    key={day} 
                    className="border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    data-testid={"asset-card-
                  >
                    {/* Sample maintenance blocks */}
                    {(day === 1 && hour === 2) && (
                      <div className="p-4"
                        OS-001
                      </div>
                    )}
                    {(day === 3 && hour === 4) && (
                      <div className="p-4"
                        OS-002
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4"
            {[1, 2, 3].map(i => (
              <Card key={i} className="hover:shadow-md transition-shadow" data-testid={"asset-card-
                <CardContent className="p-4"
                  <div className="p-4"
                    <div className="p-4"
                      <div className="p-4"
                        <Badge className="text-lg">"OS-00{i}</Badge>
                        <span className="text-lg">"Manutenção Preventiva - Equipamento {i}</span>
                      </div>
                      <p className="p-4"
                        📍 Localização: Setor {i} | 👨‍🔧 Técnico: João Silva
                      </p>
                      <p className="p-4"
                        ⏰ {new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString()} às 09:00 - 11:00
                      </p>
                    </div>
                    <div className="p-4"
                      <Button size="sm" variant="outline" data-testid={"asset-card-
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" data-testid={"asset-card-
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
        apiRequest("PATCH", "
      onSuccess: () => {
        toast({ title: "Status atualizado com sucesso" });
        queryClient.invalidateQueries({ queryKey: ["/api/activity-planner/work-orders"] });
      },
      onError: (error) => {
        toast({ 
          title: '[TRANSLATION_NEEDED]', 
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
      <div className="p-4"
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="sm" 
              variant="outline" 
              data-testid={"asset-card-
              disabled={updateWorkOrderMutation.isPending}
            >
              <div className="w-2 h-2 rounded-full " mr-2"></div>
              {workOrder.status === 'draft' ? 'Rascunho' :
               workOrder.status === 'scheduled' ? 'Agendada' :
               workOrder.status === 'in_progress' ? 'Em Andamento' :
               workOrder.status === 'paused' ? 'Pausada' :
               workOrder.status === 'completed' ? 'Concluída' : '[TRANSLATION_NEEDED]'}
              <MoreHorizontal className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end>
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
    <div className="p-4"
      <Card className="p-4"
        <CardHeader className="p-4"
          <CardTitle className="text-lg">"Total de Ativos</CardTitle>
          <Settings className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="p-4"
            {(assetStats as any)?.data?.total || 0}
          </div>
          <p className="p-4"
            {(assetStats as any)?.data?.needingMaintenance || 0} precisam manutenção
          </p>
        </CardContent>
      </Card>
      <Card className="p-4"
        <CardHeader className="p-4"
          <CardTitle className="text-lg">"Planos Ativos</CardTitle>
          <Calendar className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-lg">"0</div>
          <p className="p-4"
            0 aguardando geração
          </p>
        </CardContent>
      </Card>
      <Card className="p-4"
        <CardHeader className="p-4"
          <CardTitle className="text-lg">"OS em Andamento</CardTitle>
          <Wrench className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-lg">"0</div>
          <p className="p-4"
            0 atrasadas
          </p>
        </CardContent>
      </Card>
      <Card className="p-4"
        <CardHeader className="p-4"
          <CardTitle className="text-lg">"Eficiência</CardTitle>
          <CheckCircle className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-lg">"95%</div>
          <p className="p-4"
            SLA cumprido
          </p>
        </CardContent>
      </Card>
    </div>
  );
  const renderAssets = () => (
    <div className="p-4"
      <div className="p-4"
        <div className="p-4"
          <div className="p-4"
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder='[TRANSLATION_NEEDED]'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
              data-testid="input-search-assets"
            />
          </div>
          <Button variant="outline" size="sm" data-testid="button-filter-assets>
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
        <div className="p-4"
          <Button variant="outline" size="sm" data-testid="button-export-assets>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" data-testid="button-create-asset>
            <Plus className="h-4 w-4 mr-2" />
            Novo Ativo
          </Button>
        </div>
      </div>
      <div className="p-4"
        {loadingAssets ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4"
              <CardHeader>
                <div className="text-lg">"</div>
                <div className="text-lg">"</div>
              </CardHeader>
              <CardContent>
                <div className="p-4"
                  <div className="text-lg">"</div>
                  <div className="text-lg">"</div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : assets?.data && Array.isArray(assets.data) && assets.data.length > 0 ? (
          assets.data.map((asset: Asset) => (
            <Card key={asset.id} className="hover:shadow-md transition-shadow" data-testid={"asset-card-
              <CardHeader>
                <div className="p-4"
                  <div>
                    <CardTitle className="text-lg">"{asset.tag}</CardTitle>
                    <CardDescription>{asset.name}</CardDescription>
                  </div>
                  <Badge className={criticalityColors[asset.criticality]}>
                    {asset.criticality}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4"
                  <div className="p-4"
                    <MapPin className="h-4 w-4 mr-2" />
                    Status: {asset.status}
                  </div>
                  {asset.nextMaintenanceDate && (
                    <div className="p-4"
                      <Clock className="h-4 w-4 mr-2" />
                      Próxima manutenção: {new Date(asset.nextMaintenanceDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="p-4"
            <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="p-4"
              Nenhum ativo encontrado
            </h3>
            <p className="p-4"
              Comece criando seu primeiro ativo para gerenciar manutenções.
            </p>
            <Button data-testid="button-create-first-asset>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Ativo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
  const renderMaintenancePlans = () => (
    <div className="p-4"
      <div className="p-4"
        <h2 className="text-lg">"Planos de Manutenção</h2>
        <CreateMaintenancePlanDialog onSuccess={() => {}} />
      </div>
      
      <Card>
        <CardContent className="p-4"
          <div className="p-4"
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="p-4"
              Nenhum plano de manutenção
            </h3>
            <p className="p-4"
              Configure planos preventivos para automatizar a manutenção dos seus ativos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  const renderWorkOrders = () => (
    <div className="p-4"
      <div className="p-4"
        <h2 className="text-lg">"Ordens de Serviço</h2>
        <CreateWorkOrderDialog onSuccess={() => {}} />
      </div>
      <div className="p-4"
        {workOrders?.data && Array.isArray(workOrders.data) && workOrders.data.length > 0 ? (
          workOrders.data.map((workOrder: WorkOrder) => (
            <Card key={workOrder.id} className="hover:shadow-md transition-shadow" data-testid={"asset-card-
              <CardHeader>
                <div className="p-4"
                  <div className="p-4"
                    <div className="p-4"
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
                        "
                      >
                        {workOrder.type === 'preventive' ? 'Preventiva' :
                         workOrder.type === 'corrective' ? 'Corretiva' : 'Emergência'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">"{workOrder.title}</CardTitle>
                    <CardDescription className="p-4"
                      {workOrder.description}
                    </CardDescription>
                  </div>
                  <WorkOrderWorkflow workOrder={workOrder} />
                </div>
              </CardHeader>
              <CardContent className="p-4"
                <div className="p-4"
                  <div className="p-4"
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="text-lg">"Ativo:</span>
                    <span className="text-lg">"Ativo-{workOrder.assetId}</span>
                  </div>
                  
                  <div className="p-4"
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-lg">"Técnico:</span>
                    <span className="p-4"
                      {workOrder.assignedTechnicianId ? 'Atribuído' : 'Não atribuído'}
                    </span>
                  </div>
                  
                  <div className="p-4"
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-lg">"Duração:</span>
                    <span className="text-lg">"{workOrder.estimatedDuration}h</span>
                  </div>
                </div>
                {workOrder.scheduledStart && (
                  <div className="p-4"
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-lg">"Agendado:</span>
                    <span className="p-4"
                      {new Date(workOrder.scheduledStart).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="p-4"
                  <Button size="sm" variant="outline" data-testid={"asset-card-
                    <Eye className="w-3 h-3 mr-1" />
                    Ver Detalhes
                  </Button>
                  <Button size="sm" variant="outline" data-testid={"asset-card-
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-4"
              <div className="p-4"
                <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="p-4"
                  Nenhuma ordem de serviço
                </h3>
                <p className="p-4"
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
    <div className="p-4"
      <div className="p-4"
        <h2 className="text-lg">"Analytics & Relatórios</h2>
        <div className="p-4"
          <Button variant="outline" size="sm" data-testid="button-export-analytics>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" data-testid="button-refresh-analytics>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>
      {/* KPI Cards */}
      <div className="p-4"
        <Card className="p-4"
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"MTBF Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"127h</div>
            <p className="p-4"
              +12% vs mês anterior
            </p>
          </CardContent>
        </Card>
        <Card className="p-4"
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"MTTR Médio</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"2.4h</div>
            <p className="p-4"
              -18% vs mês anterior
            </p>
          </CardContent>
        </Card>
        <Card className="p-4"
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Disponibilidade</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"98.7%</div>
            <p className="p-4"
              +2.1% vs mês anterior
            </p>
          </CardContent>
        </Card>
        <Card className="p-4"
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Custos Total</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"R$ 24.7k</div>
            <p className="p-4"
              -8% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Charts and Reports */}
      <div className="p-4"
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">"Tendência de Manutenções</CardTitle>
            <CardDescription>Preventivas vs Corretivas (últimos 6 meses)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4"
              <div className="p-4"
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg">"Gráfico de tendências</p>
                <p className="text-lg">"Dados simulados para demonstração</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">"Distribuição por Criticidade</CardTitle>
            <CardDescription>Ativos por nível de criticidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4"
              <div className="p-4"
                <div className="p-4"
                  <div className="text-lg">"</div>
                  <span className="text-lg">"Crítica</span>
                </div>
                <span className="text-lg">"24%</span>
              </div>
              <Progress value={24} className="h-2" />
              
              <div className="p-4"
                <div className="p-4"
                  <div className="text-lg">"</div>
                  <span className="text-lg">"Alta</span>
                </div>
                <span className="text-lg">"38%</span>
              </div>
              <Progress value={38} className="h-2" />
              
              <div className="p-4"
                <div className="p-4"
                  <div className="text-lg">"</div>
                  <span className="text-lg">"Média</span>
                </div>
                <span className="text-lg">"26%</span>
              </div>
              <Progress value={26} className="h-2" />
              
              <div className="p-4"
                <div className="p-4"
                  <div className="text-lg">"</div>
                  <span className="text-lg">"Baixa</span>
                </div>
                <span className="text-lg">"12%</span>
              </div>
              <Progress value={12} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">"Performance por Ativo</CardTitle>
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
                <TableCell className="text-lg">"EQ-001 - Compressor Principal</TableCell>
                <TableCell>
                  <div className="p-4"
                    <span>99.2%</span>
                    <Badge variant="outline" className="text-lg">"Excelente</Badge>
                  </div>
                </TableCell>
                <TableCell>145h</TableCell>
                <TableCell>1.8h</TableCell>
                <TableCell>3</TableCell>
                <TableCell>
                  <Badge className="text-lg">"Operacional</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-lg">"EQ-002 - Bomba Hidráulica</TableCell>
                <TableCell>
                  <div className="p-4"
                    <span>97.8%</span>
                    <Badge variant="outline" className="text-lg">"Bom</Badge>
                  </div>
                </TableCell>
                <TableCell>98h</TableCell>
                <TableCell>3.2h</TableCell>
                <TableCell>5</TableCell>
                <TableCell>
                  <Badge className="text-lg">"Manutenção</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-lg">"EQ-003 - Motor Elétrico</TableCell>
                <TableCell>
                  <div className="p-4"
                    <span>94.5%</span>
                    <Badge variant="outline" className="text-lg">"Regular</Badge>
                  </div>
                </TableCell>
                <TableCell>76h</TableCell>
                <TableCell>4.1h</TableCell>
                <TableCell>7</TableCell>
                <TableCell>
                  <Badge className="text-lg">"Atenção</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
  return (
    <div className="p-4"
      <div className="p-4"
        <h1 className="p-4"
          Planejador de Atividades
        </h1>
        <p className="p-4"
          Gerencie ativos, planos de manutenção e ordens de serviço de forma integrada
        </p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="p-4"
          <TabsTrigger value="dashboard" data-testid="tab-dashboard>
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="assets" data-testid="tab-assets>
            Ativos
          </TabsTrigger>
          <TabsTrigger value="plans" data-testid="tab-plans>
            Planos
          </TabsTrigger>
          <TabsTrigger value="workorders" data-testid="tab-workorders>
            OS
          </TabsTrigger>
          <TabsTrigger value="technicians" data-testid="tab-technicians>
            Técnicos
          </TabsTrigger>
          <TabsTrigger value="scheduler" data-testid="tab-scheduler>
            Agenda
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics>
            Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="p-4"
          {renderDashboard()}
        </TabsContent>
        <TabsContent value="assets" className="p-4"
          {renderAssets()}
        </TabsContent>
        <TabsContent value="plans" className="p-4"
          {renderMaintenancePlans()}
        </TabsContent>
        <TabsContent value="workorders" className="p-4"
          {renderWorkOrders()}
        </TabsContent>
        <TabsContent value="technicians" className="p-4"
          <TechnicianAllocationPanel />
        </TabsContent>
        <TabsContent value="scheduler" className="p-4"
          <MaintenanceScheduler />
        </TabsContent>
        <TabsContent value="analytics" className="p-4"
          {renderAnalytics()}
        </TabsContent>
      </Tabs>
    </div>
  );
}