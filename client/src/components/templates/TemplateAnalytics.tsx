import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { BarChart3, TrendingUp, Clock, Users, Star, Calendar } from 'lucide-react';

interface TemplateStats {
  total_templates: number;
  active_templates: number;
  avg_usage: number;
  max_usage: number;
  templates_by_category: { category: string; count: number }[];
  most_used_templates: {
    id: string;
    name: string;
    category: string;
    usage_count: number;
    last_used: string;
  }[];
  usage_trends: {
    date: string;
    usage_count: number;
  }[];
  performance_metrics: {
    avg_creation_time: number;
    avg_completion_time: number;
    success_rate: number;
  };
}

interface TemplateAnalyticsProps {
  companyId?: string;
}

export default function TemplateAnalytics({ companyId = 'all' }: TemplateAnalyticsProps) {
  // Fetch comprehensive stats
  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['/api/ticket-templates/company', companyId, 'stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', "/api/templates/stats");
      return response.json();
    },
  });

  const stats: TemplateStats = statsResponse?.data?.[0] || {};

  // Fetch popular templates
  const { data: popularResponse } = useQuery({
    queryKey: ['/api/ticket-templates/company', companyId, 'popular'],
    queryFn: async () => {
      const response = await apiRequest('GET', "/popular?limit=10`);
      return response.json();
    },
  });

  const popularTemplates = Array.isArray(popularResponse?.data) ? popularResponse.data : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6>
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse>
            <CardContent className="p-6>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6>
        <Card>
          <CardContent className="p-6>
            <div className="flex items-center justify-between>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Templates</p>
                <p className="text-2xl font-bold">{stats.total_templates || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6>
            <div className="flex items-center justify-between>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Templates Ativos</p>
                <p className="text-2xl font-bold">{stats.active_templates || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6>
            <div className="flex items-center justify-between>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uso Médio</p>
                <p className="text-2xl font-bold">{Math.round(stats.avg_usage || 0)}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6>
            <div className="flex items-center justify-between>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mais Usado</p>
                <p className="text-2xl font-bold">{stats.max_usage || 0}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      {stats.performance_metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2>
              <Clock className="w-5 h-5" />
              Métricas de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2>
                  Taxa de Sucesso
                </p>
                <div className="space-y-2>
                  <Progress value={stats.performance_metrics.success_rate || 0} className="h-2" />
                  <p className="text-lg font-semibold>
                    {(stats.performance_metrics.success_rate || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2>
                  Tempo Médio de Criação
                </p>
                <p className="text-lg font-semibold>
                  {(stats.performance_metrics.avg_creation_time || 0).toFixed(1)} min
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2>
                  Tempo Médio de Conclusão
                </p>
                <p className="text-lg font-semibold>
                  {(stats.performance_metrics.avg_completion_time || 0).toFixed(1)} h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6>
        {/* Templates por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Templates por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.templates_by_category && stats.templates_by_category.length > 0 ? (
              <div className="space-y-3>
                {stats.templates_by_category.map((item, index) => (
                  <div key={item.category} className="flex items-center justify-between>
                    <div className="flex items-center gap-3>
                      <Badge className={getCategoryColor(index)}>
                        {item.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2>
                      <span className="text-sm font-medium">{item.count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2>
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: "%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum dado de categoria disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Templates Mais Usados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2>
              <Star className="w-5 h-5 text-yellow-500" />
              Templates Mais Utilizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularTemplates.length > 0 ? (
              <div className="space-y-3>
                {popularTemplates.slice(0, 5).map((template: any, index: number) => (
                  <div key={template.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50>
                    <div className="flex items-center gap-3>
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.category}</p>
                      </div>
                    </div>
                    <div className="text-right>
                      <p className="font-semibold">{template.usage_count}</p>
                      <p className="text-xs text-muted-foreground>
                        {formatDate(template.last_used)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum template foi usado ainda</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends */}
      {stats.usage_trends && stats.usage_trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2>
              <Calendar className="w-5 h-5" />
              Tendências de Uso (Últimos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4>
              <div className="flex justify-between text-sm text-muted-foreground>
                <span>Data</span>
                <span>Uso</span>
              </div>
              {stats.usage_trends.slice(-7).map((trend) => (
                <div key={trend.date} className="flex items-center justify-between>
                  <span className="text-sm">{formatDate(trend.date)}</span>
                  <div className="flex items-center gap-2>
                    <div className="w-32 bg-gray-200 rounded-full h-2>
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ 
                          width: "%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{trend.usage_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}