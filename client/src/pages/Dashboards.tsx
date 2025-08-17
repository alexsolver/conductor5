import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, Layout, Grid, Eye, Edit, Trash2, Share2, Star, StarOff, Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Schema for dashboard creation
const dashboardSchema = z.object({
  name: z.string().min(1, "Dashboard name is required"),
  description: z.string().optional(),
  layoutType: z.enum(["grid", "flex", "masonry"]),
  isRealTime: z.boolean().default(false),
  refreshInterval: z.number().min(5).max(300).default(60),
  isPublic: z.boolean().default(false),
  tags: z.string().optional(),
  mobileConfig: z.object({
    enabled: z.boolean().default(true),
    columns: z.number().min(1).max(2).default(1),
  }).optional(),
  tabletConfig: z.object({
    enabled: z.boolean().default(true),
    columns: z.number().min(1).max(3).default(2),
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
  mobileConfig?: {
    enabled: boolean;
    columns: number;
  };
  tabletConfig?: {
    enabled: boolean;
    columns: number;
  };
}

const layoutTypeIcons = {
  grid: Grid,
  flex: Layout,
  masonry: Grid,
};

const layoutTypeLabels = {
  grid: "Grid Layout",
  flex: "Flexible Layout", 
  masonry: "Masonry Layout",
};

function CreateDashboardDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
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
      mobileConfig: {
        enabled: true,
        columns: 1,
      },
      tabletConfig: {
        enabled: true,
        columns: 2,
      },
    },
  });

  const createDashboardMutation = useMutation({
    mutationFn: (data: DashboardFormData) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      };
      return apiRequest("/api/dashboards", "POST", payload);
    },
    onSuccess: () => {
      toast({ title: "Dashboard created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboards"] });
      setOpen(false);
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
    createDashboardMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-dashboard">
          <Plus className="w-4 h-4 mr-2" />
          Create Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Dashboard</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dashboard Name</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-dashboard-name" placeholder="Enter dashboard name..." />
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
                    <Textarea {...field} data-testid="input-dashboard-description" placeholder="Optional description..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="layoutType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Layout Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-layout-type">
                        <SelectValue placeholder="Select layout" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="grid">Grid Layout</SelectItem>
                      <SelectItem value="flex">Flexible Layout</SelectItem>
                      <SelectItem value="masonry">Masonry Layout</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Input {...field} data-testid="input-dashboard-tags" placeholder="Comma-separated tags..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isRealTime"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Real-time Updates</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Auto-refresh dashboard data
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

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Public Dashboard</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Make publicly accessible
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-public-dashboard"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="refreshInterval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refresh Interval (seconds): {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={5}
                      max={300}
                      step={5}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      data-testid="slider-refresh-interval"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mobile Configuration */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center">
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile Configuration
              </h4>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <FormField
                  control={form.control}
                  name="mobileConfig.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Mobile Support</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-mobile-enabled"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobileConfig.columns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Columns</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Tablet Configuration */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center">
                <Tablet className="w-4 h-4 mr-2" />
                Tablet Configuration
              </h4>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <FormField
                  control={form.control}
                  name="tabletConfig.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Tablet Support</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-tablet-enabled"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tabletConfig.columns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tablet Columns</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createDashboardMutation.isPending}
                data-testid="button-submit-dashboard"
              >
                {createDashboardMutation.isPending ? "Creating..." : "Create Dashboard"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DashboardCard({ dashboard, onToggleFavorite }: { dashboard: Dashboard; onToggleFavorite: (id: string) => void }) {
  const { toast } = useToast();
  const LayoutIcon = layoutTypeIcons[dashboard.layoutType as keyof typeof layoutTypeIcons] || Grid;

  const deleteDashboardMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/dashboards/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Dashboard deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboards"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error deleting dashboard", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg" data-testid={`text-dashboard-name-${dashboard.id}`}>
                {dashboard.name}
              </CardTitle>
              {dashboard.isFavorite && (
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
              )}
            </div>
            {dashboard.description && (
              <p className="text-sm text-muted-foreground" data-testid={`text-dashboard-description-${dashboard.id}`}>
                {dashboard.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <LayoutIcon className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2 flex-wrap">
            <Badge variant="outline">
              {layoutTypeLabels[dashboard.layoutType as keyof typeof layoutTypeLabels]}
            </Badge>
            {dashboard.isRealTime && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Real-time
              </Badge>
            )}
            {dashboard.isPublic && <Badge variant="secondary">Public</Badge>}
            {dashboard.tags.length > 0 && (
              dashboard.tags.slice(0, 2).map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <div>Widgets: {dashboard.widgetCount}</div>
            <div>Views: {dashboard.viewCount}</div>
            <div>Created: {new Date(dashboard.createdAt).toLocaleDateString()}</div>
            {dashboard.lastViewedAt && (
              <div>Last viewed: {new Date(dashboard.lastViewedAt).toLocaleDateString()}</div>
            )}
            {dashboard.isRealTime && (
              <div>Refresh: {dashboard.refreshInterval}s</div>
            )}
          </div>

          {/* Responsive configuration indicators */}
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Monitor className="w-3 h-3" />
              <span>Desktop</span>
            </div>
            {dashboard.tabletConfig?.enabled && (
              <div className="flex items-center space-x-1">
                <Tablet className="w-3 h-3" />
                <span>{dashboard.tabletConfig.columns} col</span>
              </div>
            )}
            {dashboard.mobileConfig?.enabled && (
              <div className="flex items-center space-x-1">
                <Smartphone className="w-3 h-3" />
                <span>{dashboard.mobileConfig.columns} col</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              data-testid={`button-view-${dashboard.id}`}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button size="sm" variant="outline" data-testid={`button-edit-${dashboard.id}`}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleFavorite(dashboard.id)}
              data-testid={`button-favorite-${dashboard.id}`}
            >
              {dashboard.isFavorite ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="outline" data-testid={`button-share-${dashboard.id}`}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => deleteDashboardMutation.mutate(dashboard.id)}
              disabled={deleteDashboardMutation.isPending}
              data-testid={`button-delete-${dashboard.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboards() {
  const [searchTerm, setSearchTerm] = useState("");
  const [layoutFilter, setLayoutFilter] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { toast } = useToast();

  const { data: dashboards = [], isLoading } = useQuery({
    queryKey: ["/api/dashboards"],
    queryFn: () => apiRequest("/api/dashboards", "GET"),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/dashboards/${id}/favorite`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboards"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error updating favorite", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const filteredDashboards = dashboards.filter((dashboard: Dashboard) => {
    const matchesSearch = dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (dashboard.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dashboard.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLayout = layoutFilter === "all" || dashboard.layoutType === layoutFilter;
    const matchesFavorites = !showFavoritesOnly || dashboard.isFavorite;
    
    return matchesSearch && matchesLayout && matchesFavorites;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Loading dashboards...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboards</h1>
          <p className="text-muted-foreground">
            Create and manage your business dashboards
          </p>
        </div>
        <CreateDashboardDialog onSuccess={() => {}} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search dashboards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-dashboards"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={layoutFilter} onValueChange={setLayoutFilter}>
                <SelectTrigger className="w-40" data-testid="select-layout-filter">
                  <SelectValue placeholder="Layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Layouts</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="flex">Flexible</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                data-testid="button-favorites-filter"
              >
                <Star className="w-4 h-4 mr-1" />
                Favorites
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboards Grid */}
      {filteredDashboards.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Layout className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No dashboards found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || layoutFilter !== "all" || showFavoritesOnly
                ? "No dashboards match your current filters."
                : "Create your first dashboard to get started."}
            </p>
            {!searchTerm && layoutFilter === "all" && !showFavoritesOnly && (
              <CreateDashboardDialog onSuccess={() => {}} />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDashboards.map((dashboard: Dashboard) => (
            <DashboardCard
              key={dashboard.id}
              dashboard={dashboard}
              onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}