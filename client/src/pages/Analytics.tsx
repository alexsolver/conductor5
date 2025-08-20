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
    <div className="p-4"
      <div className="p-4"
        <div className="p-4"
          {/* Page Header */}
          <Card className="p-4"
            <CardContent className="p-4"
              <div className="p-4"
                <div>
                  <h1 className="p-4"
                    Analytics
                  </h1>
                  <p className="p-4"
                    Detailed insights into your support performance and trends
                  </p>
                </div>
                <div className="p-4"
                  <Select defaultValue="30days>
                    <SelectTrigger className="p-4"
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 days</SelectItem>
                      <SelectItem value="30days">Last 30 days</SelectItem>
                      <SelectItem value="90days">Last 90 days</SelectItem>
                      <SelectItem value="1year">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline>
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button className="p-4"
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Analytics Tabs */}
          <Tabs defaultValue="overview" className="p-4"
            <TabsList className="p-4"
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
            {/* Overview Tab */}
            <TabsContent value="overview" className="p-4"
              {/* Key Metrics */}
              <div className="p-4"
                <Card className="p-4"
                  <CardContent className="p-4"
                    <div className="p-4"
                      <div className="p-4"
                        <div className="p-4"
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="p-4"
                        <p className="text-lg">"Total Tickets</p>
                        <div className="p-4"
                          <p className="text-lg">"1,247</p>
                          <p className="p-4"
                            <TrendingUp className="w-3 h-3 mr-1" />
                            8.2%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-4"
                  <CardContent className="p-4"
                    <div className="p-4"
                      <div className="p-4"
                        <div className="p-4"
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="p-4"
                        <p className="text-lg">"Avg Response Time</p>
                        <div className="p-4"
                          <p className="text-lg">"2.3h</p>
                          <p className="p-4"
                            <TrendingDown className="w-3 h-3 mr-1" />
                            12%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-4"
                  <CardContent className="p-4"
                    <div className="p-4"
                      <div className="p-4"
                        <div className="p-4"
                          <Star className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="p-4"
                        <p className="text-lg">"CSAT Score</p>
                        <div className="p-4"
                          <p className="text-lg">"94%</p>
                          <p className="p-4"
                            <TrendingUp className="w-3 h-3 mr-1" />
                            2.1%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-4"
                  <CardContent className="p-4"
                    <div className="p-4"
                      <div className="p-4"
                        <div className="p-4"
                          <Users className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="p-4"
                        <p className="text-lg">"Resolution Rate</p>
                        <div className="p-4"
                          <p className="text-lg">"87%</p>
                          <p className="p-4"
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
              <div className="p-4"
                <Card className="p-4"
                  <CardHeader>
                    <CardTitle className="p-4"
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Ticket Volume Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4"
                      <div className="p-4"
                        <Activity className="h-16 w-16 text-purple-400 mb-4 mx-auto" />
                        <p className="text-lg">"Volume trend visualization</p>
                        <p className="text-lg">"Monthly ticket volume over time</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-4"
                  <CardHeader>
                    <CardTitle className="p-4"
                      <PieChart className="w-5 h-5 mr-2" />
                      Channel Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4"
                      {channelData.map((channel) => (
                        <div key={channel.name} className="p-4"
                          <div className="p-4"
                            <div className="w-3 h-3 rounded-full" />
                            <span className="p-4"
                              {channel.name}
                            </span>
                          </div>
                          <div className="p-4"
                            <Progress value={channel.value} className="w-20 h-2" />
                            <span className="p-4"
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
            <TabsContent value="performance" className="p-4"
              <div className="p-4"
                <Card className="p-4"
                  <CardHeader>
                    <CardTitle>Agent Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4"
                      {agentPerformance.map((agent, index) => (
                        <div key={agent.name} className="p-4"
                          <div className="p-4"
                            <div className="p-4"
                              <span className="p-4"
                                {agent.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="p-4"
                                {agent.name}
                              </p>
                              <p className="p-4"
                                {agent.resolved} resolved • {agent.avgTime} avg time
                              </p>
                            </div>
                          </div>
                          <div className="p-4"
                            <Badge variant={agent.satisfaction > 95 ? "default" : "secondary>
                              {agent.satisfaction}% CSAT
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-4"
                  <CardHeader>
                    <CardTitle>Top Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4"
                      {topIssues.map((issue, index) => (
                        <div key={issue.issue} className="p-4"
                          <div className="p-4"
                            <div className="p-4"
                              <span className="p-4"
                                {index + 1}
                              </span>
                            </div>
                            <span className="p-4"
                              {issue.issue}
                            </span>
                          </div>
                          <div className="p-4"
                            <span className="p-4"
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
            <TabsContent value="channels" className="p-4"
              <Card className="p-4"
                <CardHeader>
                  <CardTitle>Channel Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4"
                    {channelData.map((channel) => (
                      <div key={channel.name} className="p-4"
                        <div className="p-4"
                          <h4 className="text-lg">"{channel.name}</h4>
                          <div className="w-3 h-3 rounded-full" />
                        </div>
                        <p className="p-4"
                          {channel.value}%
                        </p>
                        <p className="p-4"
                          of total volume
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Trends Tab */}
            <TabsContent value="trends" className="p-4"
              <Card className="p-4"
                <CardHeader>
                  <CardTitle>Satisfaction Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4"
                    <div className="p-4"
                      <TrendingUp className="h-16 w-16 text-purple-400 mb-4 mx-auto" />
                      <p className="text-lg">"Satisfaction trend chart</p>
                      <p className="text-lg">"Customer satisfaction over time</p>
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
