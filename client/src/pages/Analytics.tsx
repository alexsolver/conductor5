import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  MessageCircle, 
  Star, 
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import type { DashboardStats } from "@/types";

// Mock data for analytics - in real app this would come from API
const channelData = [
  { name: "Email", value: 45, color: "bg-blue-500" },
  { name: "Chat", value: 30, color: "bg-green-500" },
  { name: "Phone", value: 15, color: "bg-yellow-500" },
  { name: "Social", value: 10, color: "bg-purple-500" },
];

const satisfactionTrends = [
  { month: "Jan", score: 92 },
  { month: "Feb", score: 89 },
  { month: "Mar", score: 94 },
  { month: "Apr", score: 91 },
  { month: "May", score: 96 },
  { month: "Jun", score: 94 },
];

const agentPerformance = [
  { name: "Sarah Adams", resolved: 156, avgTime: "2.3h", satisfaction: 97 },
  { name: "Mike Johnson", resolved: 142, avgTime: "3.1h", satisfaction: 94 },
  { name: "Emma Martinez", resolved: 138, avgTime: "2.8h", satisfaction: 95 },
  { name: "David Lee", resolved: 124, avgTime: "3.5h", satisfaction: 92 },
  { name: "Lisa Chen", resolved: 119, avgTime: "3.2h", satisfaction: 93 },
];

const topIssues = [
  { issue: "Login Problems", count: 89, trend: "up" },
  { issue: "Payment Issues", count: 67, trend: "down" },
  { issue: "Feature Requests", count: 56, trend: "up" },
  { issue: "Bug Reports", count: 45, trend: "down" },
  { issue: "Account Setup", count: 34, trend: "up" },
];

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <Card className="gradient-card mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Analytics
                  </h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Detailed insights into your support performance and trends
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                  <Select defaultValue="30days">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 days</SelectItem>
                      <SelectItem value="30days">Last 30 days</SelectItem>
                      <SelectItem value="90days">Last 90 days</SelectItem>
                      <SelectItem value="1year">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button className="gradient-primary text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="metric-card">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
                        <div className="flex items-baseline">
                          <p className="text-2xl font-semibold text-gray-900 dark:text-white">1,247</p>
                          <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            8.2%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="metric-card">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 gradient-success rounded-lg flex items-center justify-center">
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
                        <div className="flex items-baseline">
                          <p className="text-2xl font-semibold text-gray-900 dark:text-white">2.3h</p>
                          <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            12%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="metric-card">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 gradient-warning rounded-lg flex items-center justify-center">
                          <Star className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CSAT Score</p>
                        <div className="flex items-baseline">
                          <p className="text-2xl font-semibold text-gray-900 dark:text-white">94%</p>
                          <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            2.1%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="metric-card">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 gradient-secondary rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolution Rate</p>
                        <div className="flex items-baseline">
                          <p className="text-2xl font-semibold text-gray-900 dark:text-white">87%</p>
                          <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            3.5%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Ticket Volume Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 chart-gradient rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Activity className="h-16 w-16 text-purple-400 mb-4 mx-auto" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Volume trend visualization</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Monthly ticket volume over time</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="w-5 h-5 mr-2" />
                      Channel Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {channelData.map((channel) => (
                        <div key={channel.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${channel.color}`} />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {channel.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Progress value={channel.value} className="w-20 h-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right">
                              {channel.value}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle>Agent Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {agentPerformance.map((agent, index) => (
                        <div key={agent.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {agent.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {agent.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {agent.resolved} resolved • {agent.avgTime} avg time
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={agent.satisfaction > 95 ? "default" : "secondary"}>
                              {agent.satisfaction}% CSAT
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle>Top Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topIssues.map((issue, index) => (
                        <div key={issue.issue} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {index + 1}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {issue.issue}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {issue.count}
                            </span>
                            {issue.trend === "up" ? (
                              <TrendingUp className="w-4 h-4 text-red-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Channels Tab */}
            <TabsContent value="channels" className="space-y-6">
              <Card className="gradient-card">
                <CardHeader>
                  <CardTitle>Channel Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {channelData.map((channel) => (
                      <div key={channel.name} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{channel.name}</h4>
                          <div className={`w-3 h-3 rounded-full ${channel.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                          {channel.value}%
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          of total volume
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card className="gradient-card">
                <CardHeader>
                  <CardTitle>Satisfaction Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 chart-gradient rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-16 w-16 text-purple-400 mb-4 mx-auto" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Satisfaction trend chart</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Customer satisfaction over time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
