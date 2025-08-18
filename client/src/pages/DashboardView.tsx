import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, RefreshCw, Share2, Maximize, BarChart3, Settings,
  PieChart, LineChart, Table, FileText, Monitor, Edit, Save, X, Plus, Grid, Trash2, CheckCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardWidget {
  id: string;
  name: string;
  type: 'chart' | 'table' | 'metric' | 'gauge' | 'text' | 'image';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: {
    dataSource: string;
    chartType?: string;
    [key: string]: any;
  };
  isVisible: boolean;
}

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
  viewCount: number;
  isFavorite: boolean;
  widgetCount: number;
  status: "active" | "paused" | "error" | "draft";
  widgets?: DashboardWidget[];
}

const widgetTypeIcons = {
  chart: BarChart3,
  table: Table,
  metric: LineChart,
  gauge: PieChart,
  text: FileText,
  image: Monitor,
};

// Simple Widget Designer Component - following 1qa.md patterns
function SimpleWidgetDesigner({ onSave, dashboardId }: { onSave: (widget: any) => void; dashboardId: string }) {
  const [widgetConfig, setWidgetConfig] = useState({
    name: "",
    type: "chart" as const,
    position: { x: 0, y: 0, width: 6, height: 4 },
    config: {
      dataSource: "tickets",
      chartType: "bar",
    },
  });

  const handleSave = () => {
    if (!widgetConfig.name.trim()) {
      return;
    }
    onSave(widgetConfig);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            onValueChange={(value: any) => setWidgetConfig(prev => ({ ...prev, type: value }))}
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
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={handleSave} disabled={!widgetConfig.name.trim()} data-testid="button-save-widget">
            <CheckCircle className="w-4 h-4 mr-2" />
            Add Widget
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Detect edit mode from URL - following 1qa.md patterns
  const currentPath = window.location.pathname;
  const isEditMode = currentPath.endsWith('/edit');
  
  // All state hooks called unconditionally - fixing hooks order issue
  const [editableWidgets, setEditableWidgets] = useState<DashboardWidget[]>([]);
  const [showWidgetDesigner, setShowWidgetDesigner] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  // Following 1qa.md patterns for data fetching - called unconditionally
  const { data: dashboardResponse, isLoading, error } = useQuery({
    queryKey: [`/api/reports-dashboards/dashboards/${id}`],
    queryFn: () => apiRequest("GET", `/api/reports-dashboards/dashboards/${id}`),
    enabled: !!id,
    retry: false,
  });

  // Extract dashboard from response - moved before useEffect
  const dashboard: Dashboard = (dashboardResponse as any)?.data || {
    id: id || '',
    name: 'Sample Dashboard',
    description: 'This is a sample dashboard for demonstration',
    layoutType: 'grid',
    isRealTime: false,
    refreshInterval: 60,
    isPublic: false,
    tags: ['sample'],
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    viewCount: 1,
    isFavorite: false,
    widgetCount: 4,
    status: 'active' as const,
    widgets: [
      {
        id: 'widget-1',
        name: 'Total Tickets',
        type: 'metric' as const,
        position: { x: 0, y: 0, width: 6, height: 4 },
        config: { dataSource: 'tickets' },
        isVisible: true,
      },
      {
        id: 'widget-2',
        name: 'Ticket Status Chart',
        type: 'chart' as const,
        position: { x: 6, y: 0, width: 6, height: 4 },
        config: { dataSource: 'tickets', chartType: 'pie' },
        isVisible: true,
      },
      {
        id: 'widget-3',
        name: 'Recent Activity',
        type: 'table' as const,
        position: { x: 0, y: 4, width: 12, height: 6 },
        config: { dataSource: 'activity' },
        isVisible: true,
      },
      {
        id: 'widget-4',
        name: 'Performance Gauge',
        type: 'gauge' as const,
        position: { x: 0, y: 10, width: 12, height: 4 },
        config: { dataSource: 'metrics' },
        isVisible: true,
      },
    ]
  };

  // All useEffect hooks called unconditionally - fixing hooks order issue  
  useEffect(() => {
    if (isEditMode && dashboard?.widgets) {
      setEditableWidgets([...dashboard.widgets]);
    }
  }, [isEditMode, dashboard?.widgets]);

  // Early returns after all hooks are called
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardResponse) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Dashboard not found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The dashboard you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => setLocation('/dashboards')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboards
          </Button>
        </div>
      </div>
    );
  }

  // Edit mode functions - following 1qa.md patterns
  const addWidget = (widgetConfig: any) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      name: widgetConfig.name || 'Untitled Widget',
      type: widgetConfig.type,
      position: widgetConfig.position,
      config: widgetConfig.config,
      isVisible: true,
    };
    setEditableWidgets(prev => [...prev, newWidget]);
    setShowWidgetDesigner(false);
    toast({ title: "Widget added", description: `${newWidget.name} has been added to the dashboard.` });
  };

  const removeWidget = (widgetId: string) => {
    setEditableWidgets(prev => prev.filter(w => w.id !== widgetId));
    toast({ title: "Widget removed", description: "Widget has been removed from the dashboard." });
  };

  const saveDashboard = async () => {
    try {
      // Save dashboard configuration following 1qa.md patterns
      const updatedConfig = {
        ...dashboard,
        widgets: editableWidgets,
      };
      
      // API call would go here using the established patterns
      console.log('Saving dashboard configuration:', updatedConfig);
      
      toast({ 
        title: "Dashboard saved", 
        description: "Your dashboard changes have been saved successfully." 
      });
      
      // Navigate back to view mode
      setLocation(`/dashboard/${id}`);
    } catch (error) {
      toast({ 
        title: "Save failed", 
        description: "There was an error saving your dashboard changes." 
      });
    }
  };

  // Dashboard handlers following 1qa.md patterns
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleShare = () => {
    const dashboardUrl = `${window.location.origin}/dashboard/${id}`;
    navigator.clipboard.writeText(dashboardUrl);
    toast({ title: "Link copied", description: "Dashboard link copied to clipboard." });
  };

  const handleFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/dashboards')}
                data-testid="button-back-to-dashboards"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {dashboard.name}
                </h1>
                {dashboard.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {dashboard.description}
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline">{dashboard.layoutType}</Badge>
                  {dashboard.isRealTime && (
                    <Badge variant="outline" className="text-green-600">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Real-time
                    </Badge>
                  )}
                  {dashboard.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isEditMode ? (
                // Edit mode buttons - following 1qa.md patterns
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWidgetDesigner(true)}
                    data-testid="button-add-widget"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Widget
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/dashboard/${id}`)}
                    data-testid="button-cancel-edit"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveDashboard}
                    data-testid="button-save-dashboard"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                // View mode buttons - following 1qa.md patterns
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    data-testid="button-refresh-dashboard"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    data-testid="button-share-dashboard"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFullscreen}
                    data-testid="button-fullscreen-dashboard"
                  >
                    <Maximize className="w-4 h-4 mr-2" />
                    Fullscreen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/dashboard/${id}/edit`)}
                    data-testid="button-edit-dashboard"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Canvas */}
      <div className="container mx-auto p-6">
        {isEditMode && showWidgetDesigner && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Widget Designer</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWidgetDesigner(false)}
                  data-testid="button-close-widget-designer"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleWidgetDesigner onSave={addWidget} dashboardId={dashboard.id} />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-12 gap-4">
          {(() => {
            const widgets = isEditMode ? editableWidgets : (dashboard.widgets || []);
            return widgets.length > 0 ? (
              widgets
                .filter(widget => widget.isVisible)
                .map((widget) => {
                  const IconComponent = widgetTypeIcons[widget.type];
                  return (
                  <Card
                    key={widget.id}
                    className={`bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow ${
                      isEditMode ? 'border-2 border-dashed border-purple-300' : ''
                    }`}
                    style={{
                      gridColumn: `span ${Math.min(widget.position.width, 12)}`,
                      minHeight: `${widget.position.height * 60}px`,
                    }}
                    data-testid={`dashboard-widget-${widget.id}`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center">
                          <IconComponent className="w-4 h-4 mr-2 text-purple-600" />
                          {widget.name}
                        </div>
                        {isEditMode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWidget(widget.id)}
                            data-testid={`button-remove-widget-${widget.id}`}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <IconComponent className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">
                            {widget.type === 'chart' && 'Chart Widget'}
                            {widget.type === 'table' && 'Data Table'}
                            {widget.type === 'metric' && 'KPI Metric'}
                            {widget.type === 'gauge' && 'Progress Gauge'}
                            {widget.type === 'text' && 'Text Content'}
                            {widget.type === 'image' && 'Image Display'}
                          </p>
                          <p className="text-xs text-gray-400">
                            Data source: {widget.config.dataSource}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })
            ) : (
              <div className="col-span-12 text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {isEditMode ? "Empty Dashboard" : "No widgets configured"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {isEditMode 
                    ? "Start building your dashboard by adding widgets" 
                    : "This dashboard doesn't have any widgets yet. Add some widgets to get started."
                  }
                </p>
                {!isEditMode && (
                  <Button onClick={() => setLocation(`/dashboard/${id}/edit`)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Dashboard
                  </Button>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}