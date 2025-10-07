import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp,
  Users,
  FileText,
  Timer
} from 'lucide-react';

interface DashboardMetrics {
  totalRules: number;
  activeRules: number;
  pendingInstances: number;
  approvedInstances: number;
  rejectedInstances: number;
  overdueInstances: number;
  averageResponseTime: number;
  slaCompliance: number;
}

export function ApprovalDashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/approvals/dashboard']
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="dashboard-loading">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse border-none bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" data-testid={`skeleton-card-${i}`}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: 'Regras Ativas',
      value: metrics?.activeRules || 0,
      total: metrics?.totalRules || 0,
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      testId: 'metric-active-rules'
    },
    {
      title: 'Pendentes',
      value: metrics?.pendingInstances || 0,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
      testId: 'metric-pending'
    },
    {
      title: 'Aprovadas',
      value: metrics?.approvedInstances || 0,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-green-500',
      bgGradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-green-500',
      testId: 'metric-approved'
    },
    {
      title: 'Rejeitadas',
      value: metrics?.rejectedInstances || 0,
      icon: XCircle,
      gradient: 'from-rose-500 to-red-500',
      bgGradient: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30',
      iconBg: 'bg-gradient-to-br from-rose-500 to-red-500',
      testId: 'metric-rejected'
    },
    {
      title: 'Em Atraso',
      value: metrics?.overdueInstances || 0,
      icon: AlertTriangle,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30',
      iconBg: 'bg-gradient-to-br from-orange-500 to-red-500',
      testId: 'metric-overdue'
    },
    {
      title: 'Tempo Médio',
      value: `${Math.round((metrics?.averageResponseTime || 0) / 3600)}h`,
      icon: Timer,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
      iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
      testId: 'metric-avg-time'
    },
    {
      title: 'SLA Compliance',
      value: `${Math.round(metrics?.slaCompliance || 0)}%`,
      icon: TrendingUp,
      gradient: 'from-cyan-500 to-blue-500',
      bgGradient: 'from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30',
      iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-500',
      testId: 'metric-sla'
    },
    {
      title: 'Aprovadores',
      value: '12',
      icon: Users,
      gradient: 'from-indigo-500 to-purple-500',
      bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-500',
      testId: 'metric-approvers'
    }
  ];

  return (
    <div className="space-y-6" data-testid="approval-dashboard">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="metrics-grid">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className={`border-none bg-gradient-to-br ${stat.bgGradient} hover:shadow-lg transition-all duration-300 hover:scale-105`}
            data-testid={stat.testId}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.iconBg} shadow-md`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`} data-testid={`value-${stat.testId}`}>
                {stat.value}
                {stat.total && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/ {stat.total}</span>
                )}
              </div>
              {stat.title === 'Regras Ativas' && stat.total && (
                <Progress 
                  value={(stat.value / stat.total) * 100} 
                  className="mt-3 h-2" 
                  data-testid="rules-progress"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SLA Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="performance-section">
        <Card className="border-none bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30" data-testid="sla-performance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Performance SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center" data-testid="sla-compliance">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Compliance Geral</span>
                <Badge 
                  variant={metrics?.slaCompliance && metrics.slaCompliance > 90 ? "default" : "destructive"}
                  className="text-sm px-3 py-1"
                >
                  {Math.round(metrics?.slaCompliance || 0)}%
                </Badge>
              </div>
              <Progress value={metrics?.slaCompliance || 0} className="h-3" />
              
              <div className="pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Meta de Compliance</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">95%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tempo Médio de Resposta</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {Math.round((metrics?.averageResponseTime || 0) / 3600)}h
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30" data-testid="recent-activity-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                <Clock className="h-5 w-5 text-white" />
              </div>
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-full bg-green-500">
                    <CheckCircle className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Aprovação concedida</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">há 5min</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-full bg-amber-500">
                    <Clock className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Aguardando aprovação</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">há 15min</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-full bg-red-500">
                    <XCircle className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Aprovação rejeitada</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">há 1h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
