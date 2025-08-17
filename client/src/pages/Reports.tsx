import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, BarChart3, PieChart, LineChart, Table, Download, Share2, Eye, Edit, Trash2, Play } from "lucide-react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Schema for report creation
const reportSchema = z.object({
  name: z.string().min(1, "Report name is required"),
  description: z.string().optional(),
  dataSource: z.enum(["tickets", "customers", "users", "materials", "services", "timecard"]),
  category: z.enum(["operational", "analytical", "compliance", "financial", "hr"]),
  chartType: z.enum(["bar", "line", "pie", "table", "gauge", "area"]),
  filters: z.string().optional(),
  isPublic: z.boolean().default(false),
  accessLevel: z.enum(["private", "team", "company", "public"]).default("private"),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface Report {
  id: string;
  name: string;
  description?: string;
  dataSource: string;
  category: string;
  chartType: string;
  isPublic: boolean;
  accessLevel: string;
  createdBy: string;
  createdAt: string;
  lastExecutedAt?: string;
  executionCount: number;
  isFavorite: boolean;
}

const chartTypeIcons = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  table: Table,
  gauge: BarChart3,
  area: LineChart,
};

const categoryColors = {
  operational: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  analytical: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  compliance: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  financial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  hr: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

function CreateReportDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      name: "",
      description: "",
      dataSource: "tickets",
      category: "operational",
      chartType: "bar",
      filters: "",
      isPublic: false,
      accessLevel: "private",
    },
  });

  const createReportMutation = useMutation({
    mutationFn: (data: ReportFormData) => apiRequest("POST", "/api/reports", data),
    onSuccess: () => {
      toast({ title: "Report created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setOpen(false);
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({ 
        title: "Error creating report", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: ReportFormData) => {
    createReportMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-report">
          <Plus className="w-4 h-4 mr-2" />
          Create Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Report</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Name</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-report-name" placeholder="Enter report name..." />
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
                    <Textarea {...field} data-testid="input-report-description" placeholder="Optional description..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-data-source">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tickets">Tickets</SelectItem>
                        <SelectItem value="customers">Customers</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
                        <SelectItem value="materials">Materials</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="timecard">Timecard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="analytical">Analytical</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="chartType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chart Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-chart-type">
                        <SelectValue placeholder="Select chart type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="table">Table</SelectItem>
                      <SelectItem value="gauge">Gauge</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-access-level">
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Public Report</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Make this report publicly accessible
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-public-report"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createReportMutation.isPending}
                data-testid="button-submit-report"
              >
                {createReportMutation.isPending ? "Creating..." : "Create Report"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ReportCard({ report, onExecute }: { report: Report; onExecute: (id: string) => void }) {
  const { toast } = useToast();
  const ChartIcon = chartTypeIcons[report.chartType as keyof typeof chartTypeIcons] || BarChart3;

  const deleteReportMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/reports/${id}`),
    onSuccess: () => {
      toast({ title: "Report deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error deleting report", 
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
            <CardTitle className="text-lg" data-testid={`text-report-name-${report.id}`}>
              {report.name}
            </CardTitle>
            {report.description && (
              <p className="text-sm text-muted-foreground" data-testid={`text-report-description-${report.id}`}>
                {report.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <ChartIcon className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Badge className={categoryColors[report.category as keyof typeof categoryColors]}>
              {report.category}
            </Badge>
            <Badge variant="outline">{report.dataSource}</Badge>
            {report.isPublic && <Badge variant="secondary">Public</Badge>}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <div>Created: {new Date(report.createdAt).toLocaleDateString()}</div>
            {report.lastExecutedAt && (
              <div>Last run: {new Date(report.lastExecutedAt).toLocaleDateString()}</div>
            )}
            <div>Executions: {report.executionCount}</div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => onExecute(report.id)}
              data-testid={`button-execute-${report.id}`}
            >
              <Play className="w-4 h-4 mr-1" />
              Run
            </Button>
            <Button size="sm" variant="outline" data-testid={`button-view-${report.id}`}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" data-testid={`button-edit-${report.id}`}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" data-testid={`button-share-${report.id}`}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" data-testid={`button-download-${report.id}`}>
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => deleteReportMutation.mutate(report.id)}
              disabled={deleteReportMutation.isPending}
              data-testid={`button-delete-${report.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dataSourceFilter, setDataSourceFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["/api/reports"],
    queryFn: () => apiRequest("/api/reports", "GET"),
  });

  const executeReportMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/reports/${id}/execute`, "POST"),
    onSuccess: () => {
      toast({ title: "Report executed successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error executing report", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const filteredReports = reports.filter((report: Report) => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (report.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || report.category === categoryFilter;
    const matchesDataSource = dataSourceFilter === "all" || report.dataSource === dataSourceFilter;
    
    return matchesSearch && matchesCategory && matchesDataSource;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Loading reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Create and manage your business reports
          </p>
        </div>
        <CreateReportDialog onSuccess={() => {}} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-reports"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40" data-testid="select-category-filter">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="analytical">Analytical</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dataSourceFilter} onValueChange={setDataSourceFilter}>
                <SelectTrigger className="w-40" data-testid="select-datasource-filter">
                  <SelectValue placeholder="Data Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="tickets">Tickets</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="timecard">Timecard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || categoryFilter !== "all" || dataSourceFilter !== "all"
                ? "No reports match your current filters."
                : "Create your first report to get started."}
            </p>
            {!searchTerm && categoryFilter === "all" && dataSourceFilter === "all" && (
              <CreateReportDialog onSuccess={() => {}} />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report: Report) => (
            <ReportCard
              key={report.id}
              report={report}
              onExecute={(id) => executeReportMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}