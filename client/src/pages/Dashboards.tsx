import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, Search, Filter, Grid, Layout, Eye, Edit, Trash2, Share2, Star, StarOff,
  Monitor, Tablet, Smartphone, Settings, Clock, Users, TrendingUp, AlertTriangle,
  CheckCircle, XCircle, MoreHorizontal, Copy, ExternalLink, Maximize, Minimize,
  RefreshCw, Download, Upload, Calendar, BarChart3, PieChart, LineChart, Table, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Enhanced schema for comprehensive dashboard creation
const dashboardSchema = z.object({
  name: z.string().min(1, "Dashboard name is required"),
  description: z.string().optional(),
  layoutType: z.enum(["grid", "flex", "masonry", "custom"]),
  isRealTime: z.boolean().default(false),
  refreshInterval: z.number().min(5).max(300).default(60),
  isPublic: z.boolean().default(false),
  tags: z.string().optional(),
  shareToken: z.string().optional(),
  expiresAt: z.string().optional(),
  allowedRoles: z.array(z.string()).default([]),
  theme: z.object({
    primaryColor: z.string().default("#3b82f6"),
    secondaryColor: z.string().default("#8b5cf6"),
    background: z.string().default("default"),
  }).optional(),
  mobileConfig: z.object({
    enabled: z.boolean().default(true),
    columns: z.number().min(1).max(2).default(1),
    hiddenWidgets: z.array(z.string()).default([]),
  }).optional(),
  tabletConfig: z.object({
    enabled: z.boolean().default(true),
    columns: z.number().min(1).max(3).default(2),
    hiddenWidgets: z.array(z.string()).default([]),
  }).optional(),
});

type DashboardFormData = z.infer<typeof dashboardSchema>;

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layoutType: string;
  isRealTime: boolean;
  refreshInterval: number;
  isPublic: boolean;
  tags: string[];
  createdBy: string;
  createdAt: string;
  lastViewedAt?: string;
  viewCount: number;
  isFavorite: boolean;
  widgetCount: number;
  shareToken?: string;
  expiresAt?: string;
  status: "active" | "paused" | "error" | "draft";
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    background: string;
  };
  mobileConfig?: {
    enabled: boolean;
    columns: number;
    hiddenWidgets: string[];
  };
  tabletConfig?: {
    enabled: boolean;
    columns: number;
    hiddenWidgets: string[];
  };
}

interface Widget {
  id: string;
  dashboardId: string;
  name: string;
  type: "chart" | "table" | "metric" | "gauge" | "text" | "image";
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: {
    dataSource: string;
    chartType?: string;
    fields?: string[];
    filters?: any;
    styling?: any;
  };
  reportId?: string;
  isVisible: boolean;
  createdAt: string;
}

const layoutTypeIcons = {
  grid: Grid,
  flex: Layout,
  masonry: Grid,
  custom: Settings,
};

const layoutTypeLabels = {
  grid: "Grid Layout",
  flex: "Flexible Layout",
  masonry: "Masonry Layout",
  custom: "Custom Layout",
};

const widgetTypeIcons = {
  chart: BarChart3,
  table: Table,
  metric: TrendingUp,
  gauge: PieChart,
  text: FileText,
  image: Monitor,
};

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

// Widget Designer Component
function WidgetDesigner({ onSave, dashboardId }: { onSave: (widget: any) => void; dashboardId: string }) {
  const [widgetConfig, setWidgetConfig] = useState({
    name: "",
    type: "chart",
    position: { x: 0, y: 0, width: 6, height: 4 },
    config: {
      dataSource: "tickets",
      chartType: "bar",
      fields: [],
      filters: {},
      styling: {
        colors: ["#3b82f6", "#8b5cf6", "#10b981"],
        showLegend: true,
        showGrid: true,
      },
    },
    isVisible: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Widget Designer</h3>
        <Button onClick={() => onSave(widgetConfig)} data-testid="button-save-widget">
          <CheckCircle className="w-4 h-4 mr-2" />
          Add Widget
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Widget Configuration */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Widget Name</label>
            <Input
              value={widgetConfig.name}
              onChange={(e) => setWidgetConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter widget name..."
              data-testid="input-widget-name"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Widget Type</label>
            <Select 
              value={widgetConfig.type} 
              onValueChange={(value) => setWidgetConfig(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger data-testid="select-widget-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chart">Chart</SelectItem>
                <SelectItem value="table">Data Table</SelectItem>
                <SelectItem value="metric">KPI Metric</SelectItem>
                <SelectItem value="gauge">Gauge</SelectItem>
                <SelectItem value="text">Text Block</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Data Source</label>
            <Select 
              value={widgetConfig.config.dataSource} 
              onValueChange={(value) => setWidgetConfig(prev => ({
                ...prev,
                config: { ...prev.config, dataSource: value }
              }))}
            >
              <SelectTrigger data-testid="select-widget-datasource">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tickets">Tickets</SelectItem>
                <SelectItem value="customers">Customers</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="materials">Materials</SelectItem>
                <SelectItem value="timecard">Timecard</SelectItem>
                <SelectItem value="omnibridge">OmniBridge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {widgetConfig.type === "chart" && (
            <div>
              <label className="text-sm font-medium">Chart Type</label>
              <Select 
                value={widgetConfig.config.chartType} 
                onValueChange={(value) => setWidgetConfig(prev => ({
                  ...prev,
                  config: { ...prev.config, chartType: value }
                }))}
              >
                <SelectTrigger data-testid="select-chart-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Position & Size</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="X"
                value={widgetConfig.position.x}
                onChange={(e) => setWidgetConfig(prev => ({
                  ...prev,
                  position: { ...prev.position, x: parseInt(e.target.value) || 0 }
                }))}
              />
              <Input
                type="number"
                placeholder="Y"
                value={widgetConfig.position.y}
                onChange={(e) => setWidgetConfig(prev => ({
                  ...prev,
                  position: { ...prev.position, y: parseInt(e.target.value) || 0 }
                }))}
              />
              <Input
                type="number"
                placeholder="Width"
                value={widgetConfig.position.width}
                onChange={(e) => setWidgetConfig(prev => ({
                  ...prev,
                  position: { ...prev.position, width: parseInt(e.target.value) || 6 }
                }))}
              />
              <Input
                type="number"
                placeholder="Height"
                value={widgetConfig.position.height}
                onChange={(e) => setWidgetConfig(prev => ({
                  ...prev,
                  position: { ...prev.position, height: parseInt(e.target.value) || 4 }
                }))}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          <h4 className="font-medium mb-3">Widget Preview</h4>
          <div 
            className="bg-white dark:bg-gray-800 rounded border p-4"
            style={{
              minHeight: `${widgetConfig.position.height * 20}px`,
              aspectRatio: `${widgetConfig.position.width} / ${widgetConfig.position.height}`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium">{widgetConfig.name || "Untitled Widget"}</h5>
              <Badge variant="outline">{widgetConfig.type}</Badge>
            </div>
            
            <div className="h-full flex items-center justify-center text-gray-500">
              {widgetConfig.type === "chart" && <BarChart3 className="w-12 h-12" />}
              {widgetConfig.type === "table" && <Table className="w-12 h-12" />}
              {widgetConfig.type === "metric" && <TrendingUp className="w-12 h-12" />}
              {widgetConfig.type === "gauge" && <PieChart className="w-12 h-12" />}
              <div className="ml-2">
                <p className="text-sm">Preview of {widgetConfig.type} widget</p>
                <p className="text-xs">Data source: {widgetConfig.config.dataSource}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Builder Component
function DashboardBuilder({ dashboard, onSave }: { dashboard: Dashboard; onSave: (config: any) => void }) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [showWidgetDesigner, setShowWidgetDesigner] = useState(false);

  const addWidget = (widgetConfig: any) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      dashboardId: dashboard.id,
      ...widgetConfig,
      createdAt: new Date().toISOString(),
    };
    setWidgets(prev => [...prev, newWidget]);
    setShowWidgetDesigner(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dashboard Builder</h3>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={() => setShowWidgetDesigner(true)}
            data-testid="button-add-widget"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Widget
          </Button>
          <Button onClick={() => onSave({ widgets })} data-testid="button-save-dashboard">
            <CheckCircle className="w-4 h-4 mr-2" />
            Save Dashboard
          </Button>
        </div>
      </div>

      {showWidgetDesigner && (
        <Card>
          <CardContent className="p-6">
            <WidgetDesigner onSave={addWidget} dashboardId={dashboard.id} />
          </CardContent>
        </Card>
      )}

      {/* Dashboard Canvas */}
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 min-h-96">
        <div className="grid grid-cols-12 gap-4 h-full">
          {widgets.length === 0 ? (
            <div className="col-span-12 flex items-center justify-center">
              <div className="text-center">
                <Grid className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Empty Dashboard</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Start building your dashboard by adding widgets
                </p>
                <Button 
                  onClick={() => setShowWidgetDesigner(true)}
                  data-testid="button-add-first-widget"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Widget
                </Button>
              </div>
            </div>
          ) : (
            widgets.map((widget) => (
              <div
                key={widget.id}
                className={`bg-white dark:bg-gray-800 rounded border p-4 cursor-pointer transition-all ${
                  selectedWidget === widget.id ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{
                  gridColumn: `span ${Math.min(widget.position.width, 12)}`,
                  minHeight: `${widget.position.height * 60}px`,
                }}
                onClick={() => setSelectedWidget(widget.id)}
                data-testid={`widget-${widget.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm">{widget.name}</h5>
                  <div className="flex items-center space-x-1">
                    <Badge variant="outline" className="text-xs">{widget.type}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWidgets(prev => prev.filter(w => w.id !== widget.id));
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="h-full flex items-center justify-center text-gray-500">
                  {widget.type === "chart" && <BarChart3 className="w-8 h-8" />}
                  {widget.type === "table" && <Table className="w-8 h-8" />}
                  {widget.type === "metric" && <TrendingUp className="w-8 h-8" />}
                  {widget.type === "gauge" && <PieChart className="w-8 h-8" />}
                  {widget.type === "text" && <FileText className="w-8 h-8" />}
                  {widget.type === "image" && <Monitor className="w-8 h-8" />}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Widget Properties Panel */}
      {selectedWidget && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Widget Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Selected: {widgets.find(w => w.id === selectedWidget)?.name}
              </p>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  <Copy className="w-3 h-3 mr-1" />
                  Duplicate
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setWidgets(prev => prev.filter(w => w.id !== selectedWidget))}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Create Dashboard Dialog
function CreateDashboardDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  
  const form = useForm<DashboardFormData>({
    resolver: zodResolver(dashboardSchema),
    defaultValues: {
      name: "",
      description: "",
      layoutType: "grid",
      isRealTime: false,
      refreshInterval: 60,
      isPublic: false,
      tags: "",
      allowedRoles: [],
      theme: {
        primaryColor: "#3b82f6",
        secondaryColor: "#8b5cf6",
        background: "default",
      },
      mobileConfig: {
        enabled: true,
        columns: 1,
        hiddenWidgets: [],
      },
      tabletConfig: {
        enabled: true,
        columns: 2,
        hiddenWidgets: [],
      },
    },
  });

  const createDashboardMutation = useMutation({
    mutationFn: (data: DashboardFormData) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      };
      return apiRequest("POST", "/api/reports-dashboards/dashboards", payload);
    },
    onSuccess: () => {
      toast({ title: "Dashboard created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-dashboards/dashboards"] });
      setOpen(false);
      setCurrentStep(0);
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({ 
        title: "Error creating dashboard", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: DashboardFormData) => {
    if (currentStep === steps.length - 1) {
      createDashboardMutation.mutate(data);
    }
  };

  const steps = [
    { title: "Basic Info", icon: FileText },
    { title: "Layout", icon: Grid },
    { title: "Real-time", icon: Clock },
    { title: "Responsive", icon: Monitor },
    { title: "Sharing", icon: Share2 },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-dashboard" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Advanced Dashboard</DialogTitle>
        </DialogHeader>

        {/* Step Progress */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                index <= currentStep ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <step.icon className="w-4 h-4" />
              </div>
              <span className={`ml-2 text-sm ${index <= currentStep ? 'text-purple-600' : 'text-gray-500'}`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-8 h-px mx-2 ${index < currentStep ? 'bg-purple-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form 
            onSubmit={(e) => {
              if (currentStep !== steps.length - 1) {
                e.preventDefault();
                return;
              }
              form.handleSubmit(onSubmit)(e);
            }} 
            className="space-y-6"
          >
            
            {/* Step 0: Basic Info */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dashboard Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter dashboard name..." data-testid="input-dashboard-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe your dashboard..." data-testid="input-dashboard-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="operations, monitoring, analytics..." data-testid="input-dashboard-tags" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 1: Layout */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="layoutType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Layout Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-layout-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="grid">Grid Layout</SelectItem>
                          <SelectItem value="flex">Flexible Layout</SelectItem>
                          <SelectItem value="masonry">Masonry Layout</SelectItem>
                          <SelectItem value="custom">Custom Layout</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <label className="text-sm font-medium">Theme Colors</label>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="theme.primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <FormControl>
                            <input 
                              type="color" 
                              {...field}
                              className="w-full h-10 rounded border"
                              data-testid="input-primary-color"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="theme.secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Color</FormLabel>
                          <FormControl>
                            <input 
                              type="color" 
                              {...field}
                              className="w-full h-10 rounded border"
                              data-testid="input-secondary-color"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Real-time */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isRealTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Real-time Updates</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable automatic data refresh with WebSocket/SSE
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-realtime"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("isRealTime") && (
                  <FormField
                    control={form.control}
                    name="refreshInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refresh Interval (seconds)</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Slider
                              value={[field.value]}
                              onValueChange={([value]) => field.onChange(value)}
                              min={5}
                              max={300}
                              step={5}
                              data-testid="slider-refresh-interval"
                            />
                            <div className="text-sm text-gray-500">
                              {field.value} seconds
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* Step 3: Responsive */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="mobileConfig.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center">
                          <Smartphone className="w-4 h-4 mr-2" />
                          Mobile Optimization
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Optimize dashboard for mobile devices
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-mobile"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tabletConfig.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center">
                          <Tablet className="w-4 h-4 mr-2" />
                          Tablet Optimization
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Optimize dashboard for tablet devices
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-tablet"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  {form.watch("mobileConfig.enabled") && (
                    <FormField
                      control={form.control}
                      name="mobileConfig.columns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Columns</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger data-testid="select-mobile-columns">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 Column</SelectItem>
                              <SelectItem value="2">2 Columns</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("tabletConfig.enabled") && (
                    <FormField
                      control={form.control}
                      name="tabletConfig.columns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tablet Columns</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger data-testid="select-tablet-columns">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 Column</SelectItem>
                              <SelectItem value="2">2 Columns</SelectItem>
                              <SelectItem value="3">3 Columns</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Sharing */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Public Sharing</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Allow public access via shareable link with optional expiration
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-public-sharing"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("isPublic") && (
                  <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field}
                            data-testid="input-expiration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                data-testid="button-previous-dashboard"
              >
                Previous
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  data-testid="button-next-dashboard"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createDashboardMutation.isPending}
                  data-testid="button-create-final-dashboard"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {createDashboardMutation.isPending ? "Creating..." : "Create Dashboard"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Dashboard Card Component
function DashboardCard({ dashboard }: { dashboard: Dashboard }) {
  const { toast } = useToast();
  const LayoutIcon = layoutTypeIcons[dashboard.layoutType as keyof typeof layoutTypeIcons];

  const toggleFavorite = useMutation({
    mutationFn: () => apiRequest("POST", `/api/reports-dashboards/dashboards/${dashboard.id}/favorite`),
    onSuccess: () => {
      toast({ title: dashboard.isFavorite ? "Removed from favorites" : "Added to favorites" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-dashboards/dashboards"] });
    },
  });

  const duplicateDashboard = useMutation({
    mutationFn: () => apiRequest("POST", `/api/reports-dashboards/dashboards/${dashboard.id}/duplicate`),
    onSuccess: () => {
      toast({ title: "Dashboard duplicated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-dashboards/dashboards"] });
    },
    onError: (error) => {
      toast({ title: "Error duplicating dashboard", description: error.message, variant: "destructive" });
    },
  });

  // Delete Dashboard Mutation following 1qa.md patterns
  const deleteDashboard = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/reports-dashboards/dashboards/${dashboard.id}`),
    onSuccess: () => {
      toast({ title: "Dashboard deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-dashboards/dashboards"] });
    },
    onError: (error) => {
      toast({ title: "Error deleting dashboard", description: error.message, variant: "destructive" });
    },
  });

  // Handler Functions following 1qa.md patterns
  const handleOpenDashboard = () => {
    try {
      // Following 1qa.md patterns for navigation
      const dashboardUrl = `/dashboard/${dashboard.id}`;
      window.open(dashboardUrl, '_blank');
      
      toast({ 
        title: "Dashboard opened", 
        description: `Opening ${dashboard.name} in new tab` 
      });
      
      // Update view count via API (following 1qa.md async patterns)
      fetch(`/api/reports-dashboards/dashboards/${dashboard.id}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      }).catch(error => {
        console.error('Failed to update view count:', error);
      });
      
    } catch (error) {
      console.error('Error opening dashboard:', error);
      toast({ 
        title: "Error opening dashboard", 
        description: "Failed to open dashboard. Please try again.",
        variant: "destructive" 
      });
    }
  };

  const handleEditDashboard = () => {
    // Navigate to dashboard edit mode
    toast({ title: "Opening dashboard editor", description: `Editing ${dashboard.name}` });
    // TODO: Implement navigation to dashboard edit page
  };

  const handleViewDetails = () => {
    // Show detailed dashboard information
    toast({ title: "Showing dashboard details", description: `Details for ${dashboard.name}` });
    // TODO: Implement details modal or navigation
  };

  const handleWidgetManager = () => {
    // Open widget management interface
    toast({ title: "Opening widget manager", description: `Managing widgets for ${dashboard.name}` });
    // TODO: Implement widget manager functionality
  };

  const handleShareDashboard = () => {
    // Open share dialog
    toast({ title: "Opening share options", description: `Sharing ${dashboard.name}` });
    // TODO: Implement share functionality
  };

  const handleExportDashboard = () => {
    // Export dashboard in various formats
    toast({ title: "Exporting dashboard", description: `Exporting ${dashboard.name}` });
    // TODO: Implement export functionality
  };

  const handleDeleteDashboard = () => {
    // Confirm deletion before executing
    if (window.confirm(`Are you sure you want to delete "${dashboard.name}"? This action cannot be undone.`)) {
      deleteDashboard.mutate();
    }
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <LayoutIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                {dashboard.name}
              </CardTitle>
              {dashboard.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {dashboard.description}
                </p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={statusColors[dashboard.status as keyof typeof statusColors]}>
                  {dashboard.status}
                </Badge>
                <Badge variant="outline">
                  {layoutTypeLabels[dashboard.layoutType as keyof typeof layoutTypeLabels]}
                </Badge>
                {dashboard.isRealTime && (
                  <Badge variant="outline" className="text-green-600">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Real-time
                  </Badge>
                )}
                {dashboard.isPublic && (
                  <Badge variant="outline" className="text-blue-600">
                    <Share2 className="w-3 h-3 mr-1" />
                    Public
                  </Badge>
                )}
              </div>
              
              {dashboard.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {dashboard.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {dashboard.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{dashboard.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid={`button-menu-dashboard-${dashboard.id}`}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={handleViewDetails}
                data-testid={`menu-view-details-${dashboard.id}`}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleEditDashboard}
                data-testid={`menu-edit-dashboard-${dashboard.id}`}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleWidgetManager}
                data-testid={`menu-widget-manager-${dashboard.id}`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Widget Manager
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => duplicateDashboard.mutate()}
                disabled={duplicateDashboard.isPending}
                data-testid={`menu-duplicate-${dashboard.id}`}
              >
                <Copy className="w-4 h-4 mr-2" />
                {duplicateDashboard.isPending ? "Duplicating..." : "Duplicate"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportDashboard}
                data-testid={`menu-export-${dashboard.id}`}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleShareDashboard}
                data-testid={`menu-share-${dashboard.id}`}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => toggleFavorite.mutate()}
                disabled={toggleFavorite.isPending}
                data-testid={`menu-favorite-${dashboard.id}`}
              >
                {dashboard.isFavorite ? (
                  <>
                    <StarOff className="w-4 h-4 mr-2" />
                    {toggleFavorite.isPending ? "Removing..." : "Remove Favorite"}
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    {toggleFavorite.isPending ? "Adding..." : "Add Favorite"}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={handleDeleteDashboard}
                disabled={deleteDashboard.isPending}
                data-testid={`menu-delete-${dashboard.id}`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteDashboard.isPending ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Widgets:</span>
            <span className="ml-2 font-medium">{dashboard.widgetCount}</span>
          </div>
          <div>
            <span className="text-gray-500">Views:</span>
            <span className="ml-2 font-medium">{dashboard.viewCount}</span>
          </div>
          <div>
            <span className="text-gray-500">Refresh:</span>
            <span className="ml-2 font-medium">
              {dashboard.isRealTime ? `${dashboard.refreshInterval}s` : "Manual"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Last Viewed:</span>
            <span className="ml-2 font-medium">
              {dashboard.lastViewedAt ? new Date(dashboard.lastViewedAt).toLocaleDateString() : "Never"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              onClick={handleOpenDashboard}
              data-testid={`button-open-dashboard-${dashboard.id}`}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Open
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEditDashboard}
              data-testid={`button-edit-dashboard-${dashboard.id}`}
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {dashboard.mobileConfig?.enabled && <Smartphone className="w-4 h-4 text-green-600" />}
            {dashboard.tabletConfig?.enabled && <Tablet className="w-4 h-4 text-blue-600" />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite.mutate()}
              disabled={toggleFavorite.isPending}
              data-testid={`button-favorite-dashboard-${dashboard.id}`}
            >
              {dashboard.isFavorite ? (
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
              ) : (
                <Star className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Dashboards Page Component
export default function Dashboards() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [layoutFilter, setLayoutFilter] = useState("all");

  // Fetch dashboards
  const { data: dashboardsData, isLoading } = useQuery({
    queryKey: ["/api/reports-dashboards/dashboards"],
    queryFn: () => apiRequest("GET", "/api/reports-dashboards/dashboards"),
  });

  // Mock data for comprehensive demonstration
  const mockDashboards: Dashboard[] = [
    {
      id: "1",
      name: "Operations Control Center",
      description: "Real-time overview of all operational metrics and KPIs",
      layoutType: "grid",
      isRealTime: true,
      refreshInterval: 30,
      isPublic: false,
      tags: ["operations", "realtime", "kpi"],
      createdBy: "user1",
      createdAt: "2025-08-15T10:00:00Z",
      lastViewedAt: "2025-08-18T08:30:00Z",
      viewCount: 156,
      isFavorite: true,
      widgetCount: 8,
      status: "active",
      theme: {
        primaryColor: "#3b82f6",
        secondaryColor: "#8b5cf6",
        background: "default",
      },
      mobileConfig: { enabled: true, columns: 1, hiddenWidgets: [] },
      tabletConfig: { enabled: true, columns: 2, hiddenWidgets: [] },
    },
    {
      id: "2",
      name: "Executive Summary",
      description: "High-level metrics and trends for executive review",
      layoutType: "flex",
      isRealTime: false,
      refreshInterval: 300,
      isPublic: true,
      tags: ["executive", "summary", "strategic"],
      createdBy: "user2",
      createdAt: "2025-08-14T15:30:00Z",
      viewCount: 89,
      isFavorite: false,
      widgetCount: 6,
      status: "active",
      shareToken: "abc123xyz",
      expiresAt: "2025-12-31T23:59:59Z",
    },
    {
      id: "3",
      name: "Customer Success Dashboard",
      description: "Track customer satisfaction, retention, and success metrics",
      layoutType: "masonry",
      isRealTime: true,
      refreshInterval: 60,
      isPublic: false,
      tags: ["customer", "success", "satisfaction"],
      createdBy: "user1",
      createdAt: "2025-08-12T09:15:00Z",
      lastViewedAt: "2025-08-17T17:00:00Z",
      viewCount: 234,
      isFavorite: true,
      widgetCount: 12,
      status: "active",
    },
    {
      id: "4",
      name: "CLT Compliance Monitor",
      description: "Monitor working hours, overtime, and CLT compliance in real-time",
      layoutType: "grid",
      isRealTime: true,
      refreshInterval: 120,
      isPublic: false,
      tags: ["clt", "compliance", "hr"],
      createdBy: "user3",
      createdAt: "2025-08-10T14:20:00Z",
      viewCount: 67,
      isFavorite: false,
      widgetCount: 5,
      status: "active",
    },
  ];

  const dashboards = (dashboardsData as any)?.data || mockDashboards;

  const filteredDashboards = dashboards.filter((dashboard: Dashboard) => {
    const matchesSearch = dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dashboard.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dashboard.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLayout = layoutFilter === "all" || dashboard.layoutType === layoutFilter;
    const matchesTab = activeTab === "all" || 
                      (activeTab === "favorites" && dashboard.isFavorite) ||
                      (activeTab === "realtime" && dashboard.isRealTime) ||
                      (activeTab === "public" && dashboard.isPublic) ||
                      (activeTab === "mobile" && dashboard.mobileConfig?.enabled);
    
    return matchesSearch && matchesLayout && matchesTab;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Interactive Dashboards
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage real-time dashboards with drag-and-drop widgets
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" data-testid="button-dashboard-templates">
            <Layout className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button variant="outline" data-testid="button-widget-library">
            <Grid className="w-4 h-4 mr-2" />
            Widget Library
          </Button>
          <CreateDashboardDialog onSuccess={() => {}} />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Dashboards</p>
                <p className="text-2xl font-bold">{dashboards.length}</p>
              </div>
              <Layout className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Real-time</p>
                <p className="text-2xl font-bold">{dashboards.filter((d: Dashboard) => d.isRealTime).length}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Public</p>
                <p className="text-2xl font-bold">{dashboards.filter((d: Dashboard) => d.isPublic).length}</p>
              </div>
              <Share2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Widgets</p>
                <p className="text-2xl font-bold">{dashboards.reduce((acc: number, d: Dashboard) => acc + d.widgetCount, 0)}</p>
              </div>
              <Grid className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">{dashboards.reduce((acc: number, d: Dashboard) => acc + d.viewCount, 0)}</p>
              </div>
              <Eye className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search dashboards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-dashboards"
            />
          </div>
        </div>
        <Select value={layoutFilter} onValueChange={setLayoutFilter}>
          <SelectTrigger className="w-48" data-testid="select-layout-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Layouts</SelectItem>
            <SelectItem value="grid">Grid Layout</SelectItem>
            <SelectItem value="flex">Flexible Layout</SelectItem>
            <SelectItem value="masonry">Masonry Layout</SelectItem>
            <SelectItem value="custom">Custom Layout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all" data-testid="tab-all-dashboards">All</TabsTrigger>
          <TabsTrigger value="favorites" data-testid="tab-favorites-dashboards">Favorites</TabsTrigger>
          <TabsTrigger value="realtime" data-testid="tab-realtime-dashboards">Real-time</TabsTrigger>
          <TabsTrigger value="public" data-testid="tab-public-dashboards">Public</TabsTrigger>
          <TabsTrigger value="mobile" data-testid="tab-mobile-dashboards">Mobile</TabsTrigger>
          <TabsTrigger value="recent" data-testid="tab-recent-dashboards">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredDashboards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDashboards.map((dashboard: Dashboard) => (
                <DashboardCard key={dashboard.id} dashboard={dashboard} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Layout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No dashboards found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || layoutFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first dashboard"
                }
              </p>
              {!searchTerm && layoutFilter === "all" && (
                <CreateDashboardDialog onSuccess={() => {}} />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}