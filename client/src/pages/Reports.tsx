import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from 'wouter';
import { 
// import useLocalization from '@/hooks/useLocalization';
  Plus, Search, Filter, MoreVertical, Play, Share, Download, 
  Eye, Edit, Trash2, Copy, Star, Clock, Users, BarChart3,
  LineChart, PieChart, Table, TrendingUp, Zap, Database,
  FolderOpen, BookOpen, Settings, Grid, List, Calendar,
  ChevronRight, ChevronDown, Sparkles, Target, AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Zendesk-style Quick Start Templates
const ZENDESK_QUICK_TEMPLATES = [
  {
  // Localization temporarily disabled

    id: "ticket-volume",
    name: "Ticket Volume",
    description: "Track ticket creation trends over time",
    icon: BarChart3,
    category: "Performance",
    color: "bg-blue-500",
    estimatedTime: "2 min"
  },
  {
    id: "agent-performance", 
    name: "Agent Performance",
    description: "Monitor agent productivity and resolution rates",
    icon: Users,
    category: "Team",
    color: "bg-green-500",
    estimatedTime: "3 min"
  },
  {
    id: "sla-compliance",
    name: "SLA Compliance",
    description: "Track SLA breaches and response times",
    icon: Target,
    category: "Performance", 
    color: "bg-orange-500",
    estimatedTime: "2 min"
  },
  {
    id: "customer-satisfaction",
    name: "Customer Satisfaction",
    description: "Analyze CSAT scores and feedback trends",
    icon: Star,
    category: "Customer",
    color: "bg-purple-500",
    estimatedTime: "4 min"
  }
];

// Zendesk-style Data Sources
const ZENDESK_DATA_SOURCES = [
  {
    id: "tickets",
    name: '[TRANSLATION_NEEDED]',
    description: "Support tickets and related data",
    icon: Grid,
    tables: 45,
    color: "text-blue-600"
  },
  {
    id: "users",
    name: '[TRANSLATION_NEEDED]', 
    description: "Customer and agent information",
    icon: Users,
    tables: 12,
    color: "text-green-600"
  },
  {
    id: "organizations",
    name: "Organizations",
    description: "Company and group data",
    icon: FolderOpen,
    tables: 8,
    color: "text-purple-600"
  },
  {
    id: "chat",
    name: "Chat",
    description: "Live chat conversations",
    icon: Database,
    tables: 15,
    color: "text-orange-600"
  }
];

// Main Explore Page Component
export default function Reports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState("explore"); // explore, reports, dashboards
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid, list
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(true);

  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch existing reports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["/api/reports-dashboards/reports"],
    queryFn: () => apiRequest("GET", "/api/reports-dashboards/reports")
  });

  const reports = reportsData?.data?.reports || [];

  // Zendesk-style Categories
  const categories = [
    { id: "all", name: '[TRANSLATION_NEEDED]', count: reports.length },
    { id: "performance", name: "Performance", count: reports.filter(r => r.category === 'operational').length },
    { id: "team", name: "Team Analytics", count: reports.filter(r => r.category === 'hr').length },
    { id: "customer", name: "Customer Insights", count: reports.filter(r => r.category === 'analytical').length },
    { id: "compliance", name: "Compliance", count: reports.filter(r => r.category === 'compliance').length }
  ];

  // Filter reports based on search and category
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'performance' && report.category === 'operational') ||
                           (selectedCategory === 'team' && report.category === 'hr') ||
                           (selectedCategory === 'customer' && report.category === 'analytical') ||
                           (selectedCategory === 'compliance' && report.category === 'compliance');
    return matchesSearch && matchesCategory;
  });

  const handleCreateFromTemplate = (templateId: string) => {
    setLocation("
  };

  const handleEditReport = (reportId: string) => {
    setLocation("
  };

  const handleViewReport = (reportId: string) => {
    setLocation("
  };

  // Zendesk-style Explore Landing
  if (activeView === "explore") {
    return (
      <div className=""
        {/* Zendesk-style Header */}
        <div className=""
          <div className=""
            <div className=""
              <div className=""
                <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
                <Badge variant="secondary" className=""
                  Data Analytics
                </Badge>
              </div>
              <div className=""
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveView("reports")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
                <Button onClick={() => setLocation('/reports/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className=""
          {/* Quick Start Section - Zendesk Style */}
          {showQuickStart && (
            <div className=""
              <div className=""
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Quick start</h2>
                  <p className="text-gray-600 mt-1">Get insights in minutes with pre-built reports</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowQuickStart(false)}
                >
                  Hide
                </Button>
              </div>

              <div className=""
                {ZENDESK_QUICK_TEMPLATES.map((template) => (
                  <Card 
                    key={template.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200"
                    onClick={() => handleCreateFromTemplate(template.id)}
                  >
                    <CardContent className=""
                      <div className=""
                        <div className="p-3 rounded-lg " text-white mb-4>
                          <template.icon className="h-6 w-6" />
                        </div>
                        <Badge variant="secondary" className=""
                          {template.estimatedTime}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <Badge variant="outline" className=""
                        {template.category}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Data Sources Section - Zendesk Style */}
          <div className=""
            <div className=""
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Data sources</h2>
                <p className="text-gray-600 mt-1">Choose your data to start building</p>
              </div>
              <Button variant="outline" size="sm>
                <Settings className="h-4 w-4 mr-2" />
                Manage Sources
              </Button>
            </div>

            <div className=""
              {ZENDESK_DATA_SOURCES.map((source) => (
                <Card 
                  key={source.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setLocation("
                >
                  <CardContent className=""
                    <div className=""
                      <source.icon className="h-8 w-8 " mr-3" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{source.name}</h3>
                        <p className="text-sm text-gray-500">{source.tables} tables</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{source.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity - Zendesk Style */}
          <div>
            <div className=""
              <h2 className="text-xl font-semibold text-gray-900">Recent activity</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveView("reports")}
              >
                View All Reports
              </Button>
            </div>

            <div className=""
              <div className=""
                {filteredReports.slice(0, 5).map((report, index) => (
                  <div key={report.id} className=""
                    <div className=""
                      <div className=""
                        {report.chartType === 'bar' && <BarChart3 className="h-4 w-4" />}
                        {report.chartType === 'line' && <LineChart className="h-4 w-4" />}
                        {report.chartType === 'pie' && <PieChart className="h-4 w-4" />}
                        {report.chartType === 'table' && <Table className="h-4 w-4" />}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{report.name}</h3>
                        <p className="text-sm text-gray-500">{report.description}</p>
                      </div>
                    </div>
                    <div className=""
                      <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                        {report.status}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewReport(report.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredReports.length === 0 && (
                  <div className=""
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
                    <p className="text-gray-600 mb-4">Create your first report to get started</p>
                    <Button onClick={() => setLocation('/reports/create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Report
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reports Library View - Zendesk Style
  return (
    <div className=""
      {/* Header with Zendesk-style navigation */}
      <div className=""
        <div className=""
          <div className=""
            <div className=""
              <Button 
                variant="ghost" 
                onClick={() => setActiveView("explore")}
                className="text-blue-600 hover:bg-blue-50"
              >
                <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                Back to Explore
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Tabs value={activeView} onValueChange={setActiveView}>
                <TabsList className=""
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                  <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className=""
              <div className=""
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setLocation('/reports/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className=""
        {/* Filters and Search - Zendesk Style */}
        <div className=""
          <div className=""
            <div className=""
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder='[TRANSLATION_NEEDED]'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className=""
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className=""
                <SelectValue placeholder='[TRANSLATION_NEEDED]' />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Reports Grid/List - Zendesk Style */}
        {viewMode === 'grid' ? (
          <div className=""
            {filteredReports.map((report) => (
              <ReportCardZendeskStyle 
                key={report.id} 
                report={report}
                onView={() => handleViewReport(report.id)}
                onEdit={() => handleEditReport(report.id)}
              />
            ))}
          </div>
        ) : (
          <div className=""
            <div className=""
              {filteredReports.map((report) => (
                <ReportListItemZendeskStyle 
                  key={report.id} 
                  report={report}
                  onView={() => handleViewReport(report.id)}
                  onEdit={() => handleEditReport(report.id)}
                />
              ))}
            </div>
          </div>
        )}

        {filteredReports.length === 0 && (
          <div className=""
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or create a new report</p>
            <Button onClick={() => setLocation('/reports/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Zendesk-style Report Card Component
function ReportCardZendeskStyle({ report, onView, onEdit }) {
  const getChartIcon = (chartType) => {
    switch (chartType) {
      case 'bar': return BarChart3;
      case 'line': return LineChart;
      case 'pie': return PieChart;
      case 'table': return Table;
      default: return BarChart3;
    }
  };

  const ChartIcon = getChartIcon(report.chartType);

  return (
    <Card className=""
      <CardHeader className=""
        <div className=""
          <div className=""
            <div className=""
              <ChartIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className=""
              <h3 className="font-semibold text-gray-900 truncate">{report.name}</h3>
              <p className="text-sm text-gray-500 truncate">{report.description}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className=""
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end>
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className=""
        <div className=""
          <div className=""
            <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
              {report.status}
            </Badge>
            {report.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
          </div>
          <div className=""
            <Button variant="ghost" size="sm" onClick={onView}>
              <Play className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {report.lastExecutedAt && (
          <p className=""
            Last run: {new Date(report.lastExecutedAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Zendesk-style Report List Item Component
function ReportListItemZendeskStyle({ report, onView, onEdit }) {
  const getChartIcon = (chartType) => {
    switch (chartType) {
      case 'bar': return BarChart3;
      case 'line': return LineChart;
      case 'pie': return PieChart;
      case 'table': return Table;
      default: return BarChart3;
    }
  };

  const ChartIcon = getChartIcon(report.chartType);

  return (
    <div className=""
      <div className=""
        <div className=""
          <ChartIcon className="h-5 w-5 text-blue-600" />
        </div>
        <div className=""
          <h3 className="font-medium text-gray-900 truncate">{report.name}</h3>
          <p className="text-sm text-gray-500 truncate">{report.description}</p>
          <div className=""
            <Badge variant={report.status === 'active' ? 'default' : 'secondary'} className=""
              {report.status}
            </Badge>
            {report.lastExecutedAt && (
              <span className=""
                Last run: {new Date(report.lastExecutedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className=""
        {report.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
        <Button variant="ghost" size="sm" onClick={onView}>
          <Play className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end>
            <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}