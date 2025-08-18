import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, Search, Filter, BarChart3, PieChart, LineChart, Table, Download, Share2, 
  Eye, Edit, Trash2, Play, Settings, Clock, Users, Star, StarOff, Calendar, 
  Database, Code, Palette, FileText, Grid, Layout, Monitor, Smartphone, Tablet,
  TrendingUp, AlertTriangle, CheckCircle, XCircle, MoreHorizontal, Copy, ExternalLink,
  RefreshCw
} from "lucide-react";
import AdvancedWYSIWYGDesigner from '@/components/reports/AdvancedWYSIWYGDesigner';
import AdvancedQueryBuilder from '@/components/reports/AdvancedQueryBuilder';
import { ResultsViewer } from '@/components/reports/ResultsViewer';
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
import { useLocation } from 'wouter';

// Enhanced schema for comprehensive report creation
const reportSchema = z.object({
  name: z.string().min(1, "Report name is required"),
  description: z.string().optional(),
  dataSource: z.enum(["tickets", "customers", "users", "materials", "services", "timecard", "locations", "omnibridge"]),
  category: z.enum(["operational", "analytical", "compliance", "financial", "hr", "strategic"]),
  chartType: z.enum(["bar", "line", "pie", "table", "gauge", "area", "scatter", "heatmap"]),
  filters: z.string().optional(),
  schedulingEnabled: z.boolean().default(false),
  scheduleType: z.enum(["cron", "interval", "event_driven", "threshold"]).optional(),
  scheduleConfig: z.string().optional(),
  isPublic: z.boolean().default(false),
  accessLevel: z.enum(["private", "team", "company", "public"]).default("private"),
  notifications: z.object({
    enabled: z.boolean().default(false),
    channels: z.array(z.enum(["email", "slack", "webhook", "in_app"])).default([]),
    thresholds: z.string().optional(),
  }).optional(),
  wysiwyg: z.object({
    enabled: z.boolean().default(false),
    template: z.string().optional(),
    styling: z.string().optional(),
  }).optional(),
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
  status: "active" | "paused" | "error" | "scheduled";
  scheduleConfig?: any;
  notifications?: any;
  wysiwyg?: any;
}

// Icons mapping
const chartTypeIcons = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  table: Table,
  gauge: BarChart3,
  area: LineChart,
  scatter: BarChart3,
  heatmap: Grid,
};

const categoryColors = {
  operational: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  analytical: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  compliance: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  financial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  hr: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  strategic: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
};

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};

// Template Library Component - Biblioteca de Relatórios Prontos
function TemplateLibrary({ onClose }: { onClose: () => void }) {
  const templateCategories = [
    { id: "sla", name: "SLA & Performance", icon: TrendingUp, templates: [
      { id: "sla-dashboard", name: "SLA Performance Dashboard", description: "Monitor ticket SLA compliance and response times" },
      { id: "response-time", name: "Response Time Analysis", description: "Track average response times by priority and category" },
      { id: "resolution-trends", name: "Resolution Trends", description: "Analyze ticket resolution patterns over time" },
    ]},
    { id: "tickets", name: "Tickets & Support", icon: AlertTriangle, templates: [
      { id: "ticket-volume", name: "Ticket Volume Report", description: "Daily, weekly, and monthly ticket creation trends" },
      { id: "agent-performance", name: "Agent Performance", description: "Individual agent productivity and quality metrics" },
      { id: "customer-satisfaction", name: "Customer Satisfaction", description: "CSAT scores and feedback analysis" },
    ]},
    { id: "contracts", name: "Contratos", icon: FileText, templates: [
      { id: "contract-overview", name: "Contract Overview", description: "Active contracts, renewals, and revenue tracking" },
      { id: "billing-summary", name: "Billing Summary", description: "Monthly billing cycles and payment status" },
      { id: "sla-compliance", name: "Contract SLA Compliance", description: "SLA metrics by contract and customer" },
    ]},
    { id: "financial", name: "Financeiro", icon: BarChart3, templates: [
      { id: "revenue-report", name: "Revenue Analysis", description: "Monthly and quarterly revenue breakdown" },
      { id: "cost-analysis", name: "Cost Analysis", description: "Operational costs and profitability metrics" },
      { id: "expense-tracking", name: "Expense Tracking", description: "Corporate expense management and approval workflows" },
    ]},
    { id: "consumption", name: "Consumo", icon: PieChart, templates: [
      { id: "resource-usage", name: "Resource Usage", description: "System resource consumption and optimization" },
      { id: "api-consumption", name: "API Consumption", description: "API usage patterns and rate limiting" },
      { id: "storage-analytics", name: "Storage Analytics", description: "Data storage trends and capacity planning" },
    ]},
    { id: "attendance", name: "Atendimento", icon: Users, templates: [
      { id: "channel-performance", name: "Channel Performance", description: "Omnichannel performance across email, chat, phone" },
      { id: "first-contact", name: "First Contact Resolution", description: "FCR rates and improvement opportunities" },
      { id: "escalation-analysis", name: "Escalation Analysis", description: "Ticket escalation patterns and resolution paths" },
    ]},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Choose from 20+ Professional Templates</h3>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templateCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <category.icon className="w-5 h-5 mr-2" />
                {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.templates.map((template) => (
                  <div key={template.id} className="border rounded p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Button size="sm" variant="outline">Use Template</Button>
                      <Button size="sm" variant="ghost">Preview</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Drag-Drop Visual Builder Component - Construtor Visual
function DragDropReportBuilder({ onClose }: { onClose: () => void }) {
  const [selectedFields, setSelectedFields] = useState<any[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState([
    { id: "ticket_count", name: "Ticket Count", type: "numeric" },
    { id: "avg_response_time", name: "Average Response Time", type: "duration" },
    { id: "customer_satisfaction", name: "Customer Satisfaction", type: "percentage" },
    { id: "resolution_time", name: "Resolution Time", type: "duration" },
    { id: "agent_workload", name: "Agent Workload", type: "numeric" },
  ]);

  const [chartConfig, setChartConfig] = useState({
    type: "bar",
    groupBy: "",
    aggregation: "sum",
    timeRange: "last_30_days",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Visual Report Builder - No SQL Required</h3>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Available Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className="p-2 border rounded cursor-move hover:bg-blue-50 dark:hover:bg-blue-900"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", metric.id)}
                >
                  <div className="font-medium text-sm">{metric.name}</div>
                  <div className="text-xs text-gray-500">{metric.type}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Canvas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Report Canvas</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-64 text-center"
              onDrop={(e) => {
                e.preventDefault();
                const fieldId = e.dataTransfer.getData("text/plain");
                const field = availableMetrics.find(m => m.id === fieldId);
                if (field) {
                  setSelectedFields([...selectedFields, field]);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              {selectedFields.length === 0 ? (
                <div className="text-gray-500 mt-8">
                  <Grid className="w-12 h-12 mx-auto mb-4" />
                  <p>Drag metrics here to build your report</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedFields.map((field, index) => (
                    <div key={index} className="bg-blue-100 dark:bg-blue-900 p-2 rounded flex items-center justify-between">
                      <span className="text-sm">{field.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedFields(selectedFields.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chart Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Visualization Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Chart Type</label>
              <Select value={chartConfig.type} onValueChange={(value) => setChartConfig({...chartConfig, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="heatmap">Heatmap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Time Range</label>
              <Select value={chartConfig.timeRange} onValueChange={(value) => setChartConfig({...chartConfig, timeRange: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Advanced Filters Manager Component - Filtros Avançados
function AdvancedFiltersManager({ savedFilters, onSaveFilter, onClose }: { 
  savedFilters: any[], 
  onSaveFilter: (filter: any) => void, 
  onClose: () => void 
}) {
  const [currentFilter, setCurrentFilter] = useState({
    name: "",
    conditions: [],
    period: { start: "", end: "" },
    customer: "",
    location: "",
    sla: "",
    agent: "",
    category: "",
    priority: "",
  });

  const filterOptions = {
    customers: ["All Customers", "Customer A", "Customer B", "Customer C"],
    locations: ["All Locations", "São Paulo", "Rio de Janeiro", "Belo Horizonte"],
    slaLevels: ["All SLAs", "Bronze", "Silver", "Gold", "Platinum"],
    agents: ["All Agents", "Agent 1", "Agent 2", "Agent 3"],
    categories: ["All Categories", "Technical", "Billing", "General"],
    priorities: ["All Priorities", "Low", "Medium", "High", "Critical"],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Advanced Filters & Saved Presets</h3>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Filter Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Build Custom Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Filter Name</label>
              <Input
                value={currentFilter.name}
                onChange={(e) => setCurrentFilter({...currentFilter, name: e.target.value})}
                placeholder="e.g., High Priority Last Week"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={currentFilter.period.start}
                  onChange={(e) => setCurrentFilter({
                    ...currentFilter,
                    period: {...currentFilter.period, start: e.target.value}
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={currentFilter.period.end}
                  onChange={(e) => setCurrentFilter({
                    ...currentFilter,
                    period: {...currentFilter.period, end: e.target.value}
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Customer</label>
                <Select value={currentFilter.customer} onValueChange={(value) => setCurrentFilter({...currentFilter, customer: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.customers.map(customer => (
                      <SelectItem key={customer} value={customer}>{customer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Select value={currentFilter.location} onValueChange={(value) => setCurrentFilter({...currentFilter, location: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.locations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">SLA Level</label>
                <Select value={currentFilter.sla} onValueChange={(value) => setCurrentFilter({...currentFilter, sla: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="SLA" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.slaLevels.map(sla => (
                      <SelectItem key={sla} value={sla}>{sla}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={currentFilter.category} onValueChange={(value) => setCurrentFilter({...currentFilter, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select value={currentFilter.priority} onValueChange={(value) => setCurrentFilter({...currentFilter, priority: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.priorities.map(priority => (
                      <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              className="w-full"
              onClick={() => {
                if (currentFilter.name) {
                  onSaveFilter({...currentFilter, id: Date.now()});
                  setCurrentFilter({
                    name: "",
                    conditions: [],
                    period: { start: "", end: "" },
                    customer: "",
                    location: "",
                    sla: "",
                    agent: "",
                    category: "",
                    priority: "",
                  });
                }
              }}
            >
              <Star className="w-4 h-4 mr-2" />
              Save Filter
            </Button>
          </CardContent>
        </Card>

        {/* Saved Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Saved Filters ({savedFilters.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedFilters.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Filter className="w-8 h-8 mx-auto mb-2" />
                  <p>No saved filters yet</p>
                </div>
              ) : (
                savedFilters.map((filter) => (
                  <div key={filter.id} className="p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{filter.name}</h4>
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="outline">Apply</Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {filter.period.start} to {filter.period.end} | {filter.customer} | {filter.priority}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Execution Queue Manager Component - Fila de Execução Inteligente
function ExecutionQueueManager({ queue, onClose }: { queue: any[], onClose: () => void }) {
  const [queueItems, setQueueItems] = useState([
    {
      id: 1,
      reportName: "SLA Performance Dashboard",
      status: "running",
      priority: "high",
      estimatedTime: "2 min",
      progress: 65,
      startedAt: "2025-08-18T00:45:00Z",
      queuePosition: 1,
    },
    {
      id: 2,
      reportName: "Customer Satisfaction Trends",
      status: "queued",
      priority: "medium",
      estimatedTime: "5 min",
      progress: 0,
      queuePosition: 2,
    },
    {
      id: 3,
      reportName: "CLT Compliance Report",
      status: "scheduled",
      priority: "low",
      estimatedTime: "8 min",
      progress: 0,
      scheduledFor: "2025-08-18T02:00:00Z",
      queuePosition: 3,
    },
  ]);

  const statusColors = {
    running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    queued: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    scheduled: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Intelligent Execution Queue</h3>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Running</p>
                <p className="text-2xl font-bold">{queueItems.filter(item => item.status === 'running').length}</p>
              </div>
              <Play className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Queued</p>
                <p className="text-2xl font-bold">{queueItems.filter(item => item.status === 'queued').length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold">{queueItems.filter(item => item.status === 'scheduled').length}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Queue Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {queueItems.map((item) => (
              <div key={item.id} className="border rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{item.reportName}</h4>
                    <p className="text-sm text-gray-500">Position #{item.queuePosition} | Est. {item.estimatedTime}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                      {item.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {item.status === 'running' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {item.scheduledFor && (
                  <p className="text-sm text-gray-500 mt-2">
                    Scheduled for: {new Date(item.scheduledFor).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Security Profiles Manager Component - Segurança e Perfis de Acesso
function SecurityProfilesManager({ onClose }: { onClose: () => void }) {
  const [profiles, setProfiles] = useState([
    {
      id: 1,
      name: "Customer Self-Service",
      description: "Customers can only view reports related to their own data",
      rules: ["own_data_only", "no_aggregated_metrics", "limited_export"],
      reportsVisible: 5,
      usersCount: 150,
    },
    {
      id: 2,
      name: "Team Manager",
      description: "Managers can view team performance and department metrics",
      rules: ["team_data", "department_metrics", "export_allowed"],
      reportsVisible: 25,
      usersCount: 12,
    },
    {
      id: 3,
      name: "Executive Dashboard",
      description: "C-level access to all metrics and strategic reports",
      rules: ["all_data", "financial_reports", "strategic_metrics"],
      reportsVisible: 47,
      usersCount: 5,
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Security Profiles & Access Control</h3>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profiles.map((profile) => (
          <Card key={profile.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{profile.name}</span>
                <Badge variant="outline">{profile.usersCount} users</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">{profile.description}</p>

              <div>
                <label className="text-sm font-medium">Access Rules</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.rules.map((rule) => (
                    <Badge key={rule} variant="secondary" className="text-xs">
                      {rule.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Reports Visible:</span>
                <span className="font-medium">{profile.reportsVisible}/47</span>
              </div>

              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline">
                  <Settings className="w-3 h-3 mr-1" />
                  Configure
                </Button>
                <Button size="sm" variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  Manage Users
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Access Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { user: "customer@example.com", report: "SLA Dashboard", action: "viewed", time: "2 min ago" },
              { user: "manager@company.com", report: "Team Performance", action: "exported", time: "15 min ago" },
              { user: "exec@company.com", report: "Financial Overview", action: "downloaded", time: "1 hour ago" },
            ].map((log, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{log.user}</span>
                  <span className="text-gray-500 ml-2">{log.action}</span>
                  <span className="text-blue-600 ml-1">"{log.report}"</span>
                </div>
                <span className="text-gray-400">{log.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Version History Manager Component - Versões & Histórico
function VersionHistoryManager({ versions, onClose }: { versions: any[], onClose: () => void }) {
  const [mockVersions] = useState([
    {
      id: 1,
      reportName: "SLA Performance Dashboard",
      version: "v2.3",
      author: "admin@company.com",
      changes: "Added new SLA threshold indicators and response time breakdown",
      createdAt: "2025-08-18T00:30:00Z",
      status: "current",
    },
    {
      id: 2,
      reportName: "SLA Performance Dashboard",
      version: "v2.2",
      author: "manager@company.com",
      changes: "Updated color scheme and added customer satisfaction metrics",
      createdAt: "2025-08-15T14:20:00Z",
      status: "archived",
    },
    {
      id: 3,
      reportName: "SLA Performance Dashboard",
      version: "v2.1",
      author: "admin@company.com",
      changes: "Initial template with basic SLA tracking",
      createdAt: "2025-08-10T09:15:00Z",
      status: "archived",
    },
  ]);

  const statusColors = {
    current: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Report Versions & History</h3>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>

      <div className="space-y-4">
        {mockVersions.map((version) => (
          <Card key={version.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium">{version.reportName}</h4>
                  <p className="text-sm text-gray-500">
                    {version.version} by {version.author}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={statusColors[version.status as keyof typeof statusColors]}>
                    {version.status}
                  </Badge>
                  <span className="text-sm text-gray-400">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {version.changes}
              </p>

              <div className="flex items-center space-x-2">
                {version.status === 'current' ? (
                  <Button size="sm" variant="outline" disabled>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Current Version
                  </Button>
                ) : (
                  <Button size="sm" variant="outline">
                    <Copy className="w-3 h-3 mr-1" />
                    Restore
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                {version.status !== 'current' && (
                  <Button size="sm" variant="ghost">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Compare Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Version A</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="v2.3">v2.3 (current)</SelectItem>
                  <SelectItem value="v2.2">v2.2</SelectItem>
                  <SelectItem value="v2.1">v2.1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Version B</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="v2.3">v2.3 (current)</SelectItem>
                  <SelectItem value="v2.2">v2.2</SelectItem>
                  <SelectItem value="v2.1">v2.1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full mt-4">
            <BarChart3 className="w-4 h-4 mr-2" />
            Compare Side by Side
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// WYSIWYG Report Designer Component - Using Advanced Canvas
function WYSIWYGDesigner({ onSave, initialData }: { onSave: (config: any) => void; initialData?: any }) {
  // Use the advanced WYSIWYG designer with A4 canvas
  return <AdvancedWYSIWYGDesigner onSave={onSave} initialDesign={initialData} />;
}

// Legacy WYSIWYG Designer - Kept for reference
function LegacyWYSIWYGDesigner({ onSave, initialData }: { onSave: (config: any) => void; initialData?: any }) {
  const [designConfig, setDesignConfig] = useState(initialData || {
    layout: "grid",
    styling: {
      primaryColor: "#3b82f6",
      secondaryColor: "#8b5cf6",
      fontSize: 12,
      fontFamily: "Inter",
    },
    components: [],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">WYSIWYG Report Designer</h3>
        <Button onClick={() => onSave(designConfig)} data-testid="button-save-design">
          <CheckCircle className="w-4 h-4 mr-2" />
          Save Design
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Design Controls */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Layout Type</label>
            <Select value={designConfig.layout} onValueChange={(value) => setDesignConfig((prev: any) => ({ ...prev, layout: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid Layout</SelectItem>
                <SelectItem value="flex">Flexible Layout</SelectItem>
                <SelectItem value="custom">Custom Layout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Primary Color</label>
            <input 
              type="color" 
              value={designConfig.styling.primaryColor}
              onChange={(e) => setDesignConfig((prev: any) => ({
                ...prev,
                styling: { ...prev.styling, primaryColor: e.target.value }
              }))}
              className="w-full h-10 rounded border"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Font Size</label>
            <Slider
              value={[designConfig.styling.fontSize]}
              onValueChange={([value]) => setDesignConfig((prev: any) => ({
                ...prev,
                styling: { ...prev.styling, fontSize: value }
              }))}
              min={8}
              max={24}
              step={1}
              className="mt-2"
            />
            <span className="text-sm text-gray-500">{designConfig.styling.fontSize}px</span>
          </div>
        </div>

        {/* Component Library */}
        <div className="space-y-4">
          <h4 className="font-medium">Available Components</h4>
          <div className="grid grid-cols-2 gap-2">
            {["Header", "Chart", "Table", "KPI", "Text", "Image"].map((component) => (
              <Button
                key={component}
                variant="outline"
                size="sm"
                onClick={() => setDesignConfig((prev: any) => ({
                  ...prev,
                  components: [...prev.components, { type: component, id: Date.now() }]
                }))}
                data-testid={`button-add-${component.toLowerCase()}`}
              >
                <Plus className="w-3 h-3 mr-1" />
                {component}
              </Button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          <h4 className="font-medium mb-3">Preview</h4>
          <div className="space-y-2">
            {designConfig.components.map((component: any) => (
              <div
                key={component.id}
                className="p-2 bg-white dark:bg-gray-800 rounded border"
                style={{ fontSize: `${designConfig.styling.fontSize}px` }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: designConfig.styling.primaryColor }}>
                    {component.type} Component
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDesignConfig((prev: any) => ({
                      ...prev,
                      components: prev.components.filter((c: any) => c.id !== component.id)
                    }))}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Visual Query Builder Component - Using Advanced Builder
function QueryBuilder({ onSave, initialQuery }: { onSave: (query: any) => void; initialQuery?: any }) {
  // Use the advanced query builder with intuitive interface
  return (
    <AdvancedQueryBuilder 
      onQueryChange={onSave}
      onExecute={onSave}
      initialQuery={initialQuery}
    />
  );
}

// Legacy Query Builder - Kept for reference
function LegacyQueryBuilder({ onSave, initialQuery }: { onSave: (query: any) => void; initialQuery?: any }) {
  const [query, setQuery] = useState(initialQuery || {
    dataSource: "",
    fields: [],
    filters: [],
    groupBy: [],
    orderBy: [],
    limit: 100,
  });

  const addFilter = () => {
    setQuery((prev: any) => ({
      ...prev,
      filters: [...prev.filters, { field: "", operator: "equals", value: "" }]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Visual Query Builder</h3>
        <Button onClick={() => onSave(query)} data-testid="button-save-query">
          <Database className="w-4 h-4 mr-2" />
          Save Query
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Data Source</label>
            <Select value={query.dataSource} onValueChange={(value) => setQuery((prev: any) => ({ ...prev, dataSource: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select data source" />
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

          <div>
            <label className="text-sm font-medium">Filters</label>
            <div className="space-y-2">
              {query.filters.map((filter: any, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Field"
                    value={filter.field}
                    onChange={(e) => {
                      const newFilters = [...query.filters];
                      newFilters[index].field = e.target.value;
                      setQuery((prev: any) => ({ ...prev, filters: newFilters }));
                    }}
                  />
                  <Select
                    value={filter.operator}
                    onValueChange={(value) => {
                      const newFilters = [...query.filters];
                      newFilters[index].operator = value;
                      setQuery((prev: any) => ({ ...prev, filters: newFilters }));
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greater">Greater than</SelectItem>
                      <SelectItem value="less">Less than</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Value"
                    value={filter.value}
                    onChange={(e) => {
                      const newFilters = [...query.filters];
                      newFilters[index].value = e.target.value;
                      setQuery((prev: any) => ({ ...prev, filters: newFilters }));
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newFilters = query.filters.filter((_: any, i: number) => i !== index);
                      setQuery((prev: any) => ({ ...prev, filters: newFilters }));
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addFilter} data-testid="button-add-filter">
                <Plus className="w-4 h-4 mr-2" />
                Add Filter
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Query Preview</label>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded font-mono text-sm">
              <pre>{JSON.stringify(query, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Advanced Report Creation Dialog
function CreateReportDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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
      schedulingEnabled: false,
      isPublic: false,
      accessLevel: "private",
      notifications: {
        enabled: false,
        channels: [],
      },
      wysiwyg: {
        enabled: false,
      },
    },
  });

  const createReportMutation = useMutation({
    mutationFn: (data: ReportFormData) => apiRequest("POST", "/api/reports-dashboards/reports", data),
    onSuccess: () => {
      toast({ title: "Report created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-dashboards/reports"] });
      setOpen(false);
      setCurrentStep(0);
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
    if (currentStep === steps.length - 1) {
      createReportMutation.mutate(data);
    }
  };

  const steps = [
    { title: "Basic Info", icon: FileText },
    { title: "Data Source", icon: Database },
    { title: "Visualization", icon: BarChart3 },
    { title: "Scheduling", icon: Clock },
    { title: "Sharing", icon: Share2 },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-report" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Advanced Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Advanced Report</DialogTitle>
        </DialogHeader>

        {/* Step Progress */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <step.icon className="w-4 h-4" />
              </div>
              <span className={`ml-2 text-sm ${index <= currentStep ? 'text-blue-600' : 'text-gray-500'}`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-8 h-px mx-2 ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
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
                      <FormLabel>Report Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter report name..." data-testid="input-report-name" />
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
                        <Textarea {...field} placeholder="Describe your report..." data-testid="input-report-description" />
                      </FormControl>
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
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="operational">Operational</SelectItem>
                          <SelectItem value="analytical">Analytical</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="hr">HR</SelectItem>
                          <SelectItem value="strategic">Strategic</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 1: Data Source */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="dataSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Source</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-data-source">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tickets">Tickets & Support</SelectItem>
                          <SelectItem value="customers">Customers & Beneficiaries</SelectItem>
                          <SelectItem value="users">Users & Teams</SelectItem>
                          <SelectItem value="materials">Materials & Inventory</SelectItem>
                          <SelectItem value="services">Services & LPU</SelectItem>
                          <SelectItem value="timecard">Timecard & CLT</SelectItem>
                          <SelectItem value="locations">Locations & Geography</SelectItem>
                          <SelectItem value="omnibridge">OmniBridge & Communication</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mt-6">
                  <QueryBuilder onSave={(query) => form.setValue("filters", JSON.stringify(query))} />
                </div>
              </div>
            )}

            {/* Step 2: Visualization */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="chartType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chart Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-chart-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                          <SelectItem value="table">Data Table</SelectItem>
                          <SelectItem value="gauge">Gauge/KPI</SelectItem>
                          <SelectItem value="area">Area Chart</SelectItem>
                          <SelectItem value="scatter">Scatter Plot</SelectItem>
                          <SelectItem value="heatmap">Heat Map</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wysiwyg.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">WYSIWYG Designer</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Use visual editor for custom report layouts
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-wysiwyg"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("wysiwyg.enabled") && (
                  <div className="mt-6">
                    <WYSIWYGDesigner onSave={(config) => form.setValue("wysiwyg.template", JSON.stringify(config))} />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Scheduling */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="schedulingEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Intelligent Scheduling</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Automatically execute this report on schedule
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-scheduling"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("schedulingEnabled") && (
                  <>
                    <FormField
                      control={form.control}
                      name="scheduleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schedule Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-schedule-type">
                                <SelectValue placeholder="Select schedule type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cron">Cron Expression</SelectItem>
                              <SelectItem value="interval">Fixed Interval</SelectItem>
                              <SelectItem value="event_driven">Event Driven</SelectItem>
                              <SelectItem value="threshold">Threshold Based</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="scheduleConfig"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schedule Configuration</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 0 9 * * MON-FRI" data-testid="input-schedule-config" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="notifications.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Smart Notifications</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Get notified when report completes or thresholds are met
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-notifications"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 4: Sharing */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="accessLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-access-level">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="private">Private (Only Me)</SelectItem>
                          <SelectItem value="team">Team Access</SelectItem>
                          <SelectItem value="company">Company Wide</SelectItem>
                          <SelectItem value="public">Public Access</SelectItem>
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Public Sharing</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Allow public access via shareable link
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-public"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                data-testid="button-previous"
              >
                Previous
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  data-testid="button-next"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createReportMutation.isPending}
                  data-testid="button-create-final"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {createReportMutation.isPending ? "Creating..." : "Create Report"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Report Card Component
function ReportCard({ report }: { report: Report }) {
  const { toast } = useToast();
  const ChartIcon = chartTypeIcons[report.chartType as keyof typeof chartTypeIcons];
  const [, setLocation] = useLocation(); // Use wouter's useLocation hook

  // Execute Report Mutation
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const executeReport = useMutation({
    mutationFn: () => apiRequest("POST", `/api/reports-dashboards/reports/${report.id}/execute`),
    onSuccess: (result) => {
      console.log('✅ [REPORT-EXECUTION] Success:', result);

      // ✅ 1QA.MD COMPLIANCE: Show execution results instead of just success message
      if (result?.data?.results) {
        setExecutionResult(result.data);
        setShowResultDialog(true);
        toast({ title: "Report executed successfully" });
      } else {
        toast({ title: "Report executed but no data returned" });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/reports-dashboards/reports"] });
    },
    onError: (error) => {
      console.error('❌ [REPORT-EXECUTION] Error:', error);
      toast({ title: "Error executing report", description: error.message, variant: "destructive" });
    },
  });

  // Toggle Favorite Mutation
  const toggleFavorite = useMutation({
    mutationFn: () => apiRequest("POST", `/api/reports-dashboards/reports/${report.id}/favorite`),
    onSuccess: () => {
      toast({ title: report.isFavorite ? "Removed from favorites" : "Added to favorites" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-dashboards/reports"] });
    },
    onError: (error) => {
      toast({ title: "Error updating favorite status", description: error.message, variant: "destructive" });
    },
  });

  // Delete Report Mutation
  const deleteReport = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/reports-dashboards/reports/${report.id}`),
    onSuccess: () => {
      toast({ title: "Report deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-dashboards/reports"] });
    },
    onError: (error) => {
      toast({ title: "Error deleting report", description: error.message, variant: "destructive" });
    },
  });

  // Duplicate Report Mutation
  const duplicateReport = useMutation({
    mutationFn: () => apiRequest("POST", `/api/reports-dashboards/reports/${report.id}/duplicate`),
    onSuccess: () => {
      toast({ title: "Report duplicated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-dashboards/reports"] });
    },
    onError: (error) => {
      toast({ title: "Error duplicating report", description: error.message, variant: "destructive" });
    },
  });

  // Handler Functions following 1qa.md patterns
  const handleViewReport = () => {
    // Navigate to report view or open modal - implementing placeholder for now
    toast({ title: "Opening report view", description: `Viewing ${report.name}` });
    // TODO: Implement navigation to report details page
  };

  const handleViewDetails = () => {
    // Show detailed report information
    toast({ title: "Showing report details", description: `Details for ${report.name}` });
    // TODO: Implement details modal or navigation
  };

  const handleEditReport = () => {
    // Navigate to edit mode
    // TODO: Implement navigation to edit page: navigate(`/reports/${report.id}/edit`);
    toast({ title: "Opening report editor", description: `Editing ${report.name}` });
    setLocation(`/reports/${report.id}/edit`); // Navigate to the edit page
  };

  const handleShareReport = () => {
    // Open share dialog
    toast({ title: "Opening share options", description: `Sharing ${report.name}` });
    // TODO: Implement share functionality
  };

  const handleExportReport = () => {
    // Export report in various formats
    toast({ title: "Exporting report", description: `Exporting ${report.name}` });
    // TODO: Implement export functionality
  };

  const handleDeleteReport = () => {
    // Confirm deletion before executing
    if (window.confirm(`Are you sure you want to delete "${report.name}"? This action cannot be undone.`)) {
      deleteReport.mutate();
    }
  };

  return (
    <>
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ChartIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                {report.name}
              </CardTitle>
              {report.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {report.description}
                </p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={categoryColors[report.category as keyof typeof categoryColors]}>
                  {report.category}
                </Badge>
                <Badge className={statusColors[report.status as keyof typeof statusColors]}>
                  {report.status}
                </Badge>
                {report.scheduleConfig && (
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    Scheduled
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid={`button-menu-${report.id}`}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => executeReport.mutate()}
                disabled={executeReport.isPending}
                data-testid={`menu-execute-${report.id}`}
              >
                <Play className="w-4 h-4 mr-2" />
                {executeReport.isPending ? "Executing..." : "Execute Now"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleViewDetails}
                data-testid={`menu-view-details-${report.id}`}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleEditReport}
                data-testid={`menu-edit-${report.id}`}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Report
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => duplicateReport.mutate()}
                disabled={duplicateReport.isPending}
                data-testid={`menu-duplicate-${report.id}`}
              >
                <Copy className="w-4 h-4 mr-2" />
                {duplicateReport.isPending ? "Duplicating..." : "Duplicate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleShareReport}
                data-testid={`menu-share-${report.id}`}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportReport}
                data-testid={`menu-export-${report.id}`}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => toggleFavorite.mutate()}
                disabled={toggleFavorite.isPending}
                data-testid={`menu-favorite-${report.id}`}
              >
                {report.isFavorite ? (
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
                onClick={handleDeleteReport}
                disabled={deleteReport.isPending}
                data-testid={`menu-delete-${report.id}`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteReport.isPending ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Data Source:</span>
            <span className="ml-2 font-medium">{report.dataSource}</span>
          </div>
          <div>
            <span className="text-gray-500">Chart Type:</span>
            <span className="ml-2 font-medium">{report.chartType}</span>
          </div>
          <div>
            <span className="text-gray-500">Executions:</span>
            <span className="ml-2 font-medium">{report.executionCount}</span>
          </div>
          <div>
            <span className="text-gray-500">Last Run:</span>
            <span className="ml-2 font-medium">
              {report.lastExecutedAt ? new Date(report.lastExecutedAt).toLocaleDateString() : "Never"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => executeReport.mutate()}
              disabled={executeReport.isPending}
              data-testid={`button-execute-${report.id}`}
            >
              <Play className="w-3 h-3 mr-1" />
              {executeReport.isPending ? "Running..." : "Execute"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleViewReport}
              data-testid={`button-view-${report.id}`}
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFavorite.mutate()}
            data-testid={`button-favorite-${report.id}`}
          >
            {report.isFavorite ? (
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            ) : (
              <Star className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* ✅ 1QA.MD COMPLIANCE: Report Results Dialog - Show execution results */}
    <ResultsViewer 
      open={showResultDialog} 
      onOpenChange={setShowResultDialog}
      report={report}
      executionResult={executionResult}
    />
    </>
  );
}

// Main Reports Page Component
export default function Reports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Enhanced state management for advanced features
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showDragDropBuilder, setShowDragDropBuilder] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSecurityProfiles, setShowSecurityProfiles] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showExecutionQueue, setShowExecutionQueue] = useState(false);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [reportVersions, setReportVersions] = useState<any[]>([]);
  const [executionQueue, setExecutionQueue] = useState<any[]>([]);

  // Fetch reports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["/api/reports-dashboards/reports"],
    queryFn: () => apiRequest("GET", "/api/reports-dashboards/reports"),
  });

  // Mock data for now since backend returns empty
  const mockReports: Report[] = [
    {
      id: "1",
      name: "SLA Performance Dashboard",
      description: "Monitor ticket SLA compliance and response times",
      dataSource: "tickets",
      category: "operational",
      chartType: "bar",
      isPublic: false,
      accessLevel: "team",
      createdBy: "user1",
      createdAt: "2025-08-15T10:00:00Z",
      lastExecutedAt: "2025-08-18T08:30:00Z",
      executionCount: 42,
      isFavorite: true,
      status: "active",
      scheduleConfig: { type: "cron", expression: "0 9 * * *" },
    },
    {
      id: "2",
      name: "Customer Satisfaction Trends",
      description: "Track customer satisfaction scores over time",
      dataSource: "customers",
      category: "analytical",
      chartType: "line",
      isPublic: true,
      accessLevel: "public",
      createdBy: "user2",
      createdAt: "2025-08-14T15:30:00Z",
      executionCount: 28,
      isFavorite: false,
      status: "active",
    },
    {
      id: "3",
      name: "CLT Compliance Report",
      description: "Monitor working hours and CLT compliance",
      dataSource: "timecard",
      category: "compliance",
      chartType: "gauge",
      isPublic: false,
      accessLevel: "private",
      createdBy: "user1",
      createdAt: "2025-08-12T09:15:00Z",
      lastExecutedAt: "2025-08-17T17:00:00Z",
      executionCount: 15,
      isFavorite: true,
      status: "scheduled",
      scheduleConfig: { type: "interval", minutes: 360 },
    },
  ];

  const reports = (reportsData as any)?.data || mockReports;

  const filteredReports = reports.filter((report: Report) => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || report.category === categoryFilter;
    const matchesTab = activeTab === "all" || 
                      (activeTab === "favorites" && report.isFavorite) ||
                      (activeTab === "scheduled" && report.scheduleConfig) ||
                      (activeTab === "public" && report.isPublic);

    return matchesSearch && matchesCategory && matchesTab;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create, manage, and analyze comprehensive reports across all system modules
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowTemplateLibrary(true)} data-testid="button-template-library">
            <FileText className="w-4 h-4 mr-2" />
            Template Library
          </Button>
          <Button variant="outline" onClick={() => setShowDragDropBuilder(true)} data-testid="button-visual-builder">
            <Grid className="w-4 h-4 mr-2" />
            Visual Builder
          </Button>
          <Button variant="outline" onClick={() => setShowAdvancedFilters(true)} data-testid="button-advanced-filters">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
          <Button variant="outline" onClick={() => setShowExecutionQueue(true)} data-testid="button-execution-queue">
            <Clock className="w-4 h-4 mr-2" />
            Execution Queue
          </Button>
          <Button variant="outline" onClick={() => setShowSecurityProfiles(true)} data-testid="button-security-profiles">
            <Users className="w-4 h-4 mr-2" />
            Security
          </Button>
          <Button variant="outline" onClick={() => setShowVersionHistory(true)} data-testid="button-version-history">
            <Calendar className="w-4 h-4 mr-2" />
            Versions
          </Button>
          <CreateReportDialog onSuccess={() => {}} />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold">{reports.filter((r: Report) => r.scheduleConfig).length}</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favorites</p>
                <p className="text-2xl font-bold">{reports.filter((r: Report) => r.isFavorite).length}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Executions</p>
                <p className="text-2xl font-bold">{reports.reduce((acc: number, r: Report) => acc + r.executionCount, 0)}</p>
              </div>
              <Play className="w-8 h-8 text-purple-600" />
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
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-reports"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48" data-testid="select-category-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="analytical">Analytical</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
            <SelectItem value="strategic">Strategic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Features Dialogs */}
      {showTemplateLibrary && (
        <Dialog open={showTemplateLibrary} onOpenChange={setShowTemplateLibrary}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Template Library</DialogTitle>
            </DialogHeader>
            <TemplateLibrary onClose={() => setShowTemplateLibrary(false)} />
          </DialogContent>
        </Dialog>
      )}

      {showDragDropBuilder && (
        <Dialog open={showDragDropBuilder} onOpenChange={setShowDragDropBuilder}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Visual Report Builder</DialogTitle>
            </DialogHeader>
            <DragDropReportBuilder onClose={() => setShowDragDropBuilder(false)} />
          </DialogContent>
        </Dialog>
      )}

      {showAdvancedFilters && (
        <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Advanced Filters</DialogTitle>
            </DialogHeader>
            <AdvancedFiltersManager
              savedFilters={savedFilters}
              onSaveFilter={(filter) => setSavedFilters([...savedFilters, filter])}
              onClose={() => setShowAdvancedFilters(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {showExecutionQueue && (
        <Dialog open={showExecutionQueue} onOpenChange={setShowExecutionQueue}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Intelligent Execution Queue</DialogTitle>
            </DialogHeader>
            <ExecutionQueueManager
              queue={executionQueue}
              onClose={() => setShowExecutionQueue(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {showSecurityProfiles && (
        <Dialog open={showSecurityProfiles} onOpenChange={setShowSecurityProfiles}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Security Profiles & Access Control</DialogTitle>
            </DialogHeader>
            <SecurityProfilesManager onClose={() => setShowSecurityProfiles(false)} />
          </DialogContent>
        </Dialog>
      )}

      {showVersionHistory && (
        <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report Versions & History</DialogTitle>
            </DialogHeader>
            <VersionHistoryManager 
              versions={reportVersions}
              onClose={() => setShowVersionHistory(false)} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" data-testid="tab-all">All Reports</TabsTrigger>
          <TabsTrigger value="favorites" data-testid="tab-favorites">Favorites</TabsTrigger>
          <TabsTrigger value="scheduled" data-testid="tab-scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="public" data-testid="tab-public">Public</TabsTrigger>
          <TabsTrigger value="recent" data-testid="tab-recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report: Report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No reports found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || categoryFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first report"
                }
              </p>
              {!searchTerm && categoryFilter === "all" && (
                <CreateReportDialog onSuccess={() => {}} />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}