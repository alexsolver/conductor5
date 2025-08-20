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
          <Card key={i} className="animate-pulse" data-testid={`skeleton-card-${i}`}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
      color: 'blue',
      testId: 'metric-active-rules'
    },
    {
      title: 'Pendentes',
      value: metrics?.pendingInstances || 0,
      icon: Clock,
      color: 'yellow',
      testId: 'metric-pending'
    },
    {
      title: 'Aprovadas',
      value: metrics?.approvedInstances || 0,
      icon: CheckCircle,
      color: 'green',
      testId: 'metric-approved'
    },
    {
      title: 'Rejeitadas',
      value: metrics?.rejectedInstances || 0,
      icon: XCircle,
      color: 'red',
      testId: 'metric-rejected'
    },
    {
      title: 'Em Atraso',
      value: metrics?.overdueInstances || 0,
      icon: AlertTriangle,
      color: 'orange',
      testId: 'metric-overdue'
    },
    {
      title: 'Tempo Médio',
      value: `${Math.round((metrics?.averageResponseTime || 0) / 3600)}h`,
      icon: Timer,
      color: 'purple',
      testId: 'metric-avg-time'
    },
    {
      title: 'SLA Compliance',
      value: `${Math.round(metrics?.slaCompliance || 0)}%`,
      icon: TrendingUp,
      color: 'cyan',
      testId: 'metric-sla'
    },
    {
      title: 'Aprovadores',
      value: '12', // This would come from user stats
      icon: Users,
      color: 'indigo',
      testId: 'metric-approvers'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
      green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      red: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
      cyan: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/20',
      indigo: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6" data-testid="approval-dashboard">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="metrics-grid">
        {stats.map((stat, index) => (
          <Card key={index} data-testid={stat.testId}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid={`value-${stat.testId}`}>
                {stat.value}
                {stat.total && (
                  <span className="text-sm text-gray-500 ml-1">/ {stat.total}</span>
                )}
              </div>
              {stat.title === 'Regras Ativas' && stat.total && (
                <Progress 
                  value={(stat.value / stat.total) * 100} 
                  className="mt-2" 
                  data-testid="rules-progress"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SLA Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="performance-section">
        <Card data-testid="sla-performance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center" data-testid="sla-compliance">
                <span className="text-sm text-gray-600 dark:text-gray-400">Compliance Geral</span>
                <Badge variant={metrics?.slaCompliance && metrics.slaCompliance > 90 ? "default" : "destructive"}>
                  {Math.round(metrics?.slaCompliance || 0)}%
                </Badge>
              </div>
              <Progress value={metrics?.slaCompliance || 0} className="h-2" />
              
              <div className="text-xs text-gray-500 dark:text-gray-400" data-testid="sla-details">
                Baseado nas últimas 30 aprovações completadas
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="recent-activity-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="activity-list">
              <div className="flex items-center justify-between text-sm">
                <span>Ticket #TK-2024-001 aprovado</span>
                <Badge variant="secondary">2h atrás</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Material #MT-2024-005 rejeitado</span>
                <Badge variant="destructive">4h atrás</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Regra "Alto Valor" criada</span>
                <Badge variant="secondary">1d atrás</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card data-testid="quick-actions-card">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3" data-testid="quick-actions">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="button-create-rule"
            >
              Nova Regra
            </button>
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              data-testid="button-bulk-approve"
            >
              Aprovação em Lote
            </button>
            <button 
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              data-testid="button-overdue-report"
            >
              Relatório Atrasos
            </button>
            <button 
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              data-testid="button-export-metrics"
            >
              Exportar Métricas
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}