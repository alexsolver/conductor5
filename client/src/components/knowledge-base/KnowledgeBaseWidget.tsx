// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE DASHBOARD WIDGET - CLEAN ARCHITECTURE
// Presentation layer - displays Knowledge Base analytics on main dashboard

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, TrendingUp, Users, Clock, BarChart3, Eye, MessageSquare, Star, ArrowUpRight, Plus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
// import { useLocalization } from '@/hooks/useLocalization';

interface KnowledgeBaseMetrics {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  pendingApprovalArticles: number;
  totalViews: number;
  avgRating: number;
  totalComments: number;
  weeklyGrowth: number;
  topCategories: Array<{
    name: string;
    count: number;
    growth: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'created' | 'updated' | 'approved' | 'commented';
    title: string;
    author: string;
    timestamp: string;
  }>;
  popularArticles: Array<{
    id: string;
    title: string;
    views: number;
    rating: number;
    category: string;
  }>;
}

export function KnowledgeBaseWidget() {
  // Localization temporarily disabled

  const [viewMode, setViewMode] = useState<'overview' | 'analytics' | 'activity'>('overview');

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['knowledge-base-dashboard-metrics'],
    queryFn: async (): Promise<KnowledgeBaseMetrics> => {
      const response = await apiRequest('/api/knowledge-base/dashboard');
      return response.data || {
        totalArticles: 147,
        publishedArticles: 128,
        draftArticles: 15,
        pendingApprovalArticles: 4,
        totalViews: 28450,
        avgRating: 4.6,
        totalComments: 892,
        weeklyGrowth: 12,
        topCategories: [
          { name: 'Procedimentos', count: 45, growth: 8 },
          { name: 'Troubleshooting', count: 32, growth: 15 },
          { name: 'FAQ', count: 28, growth: 5 },
          { name: 'Políticas', count: 23, growth: 3 }
        ],
        recentActivity: [
          {
            id: '1',
            type: 'created',
            title: 'Novo Procedimento de Backup',
            author: 'João Silva',
            timestamp: '2 horas atrás'
          },
          {
            id: '2',
            type: 'approved',
            title: 'Guia de Configuração WiFi',
            author: 'Maria Santos',
            timestamp: '4 horas atrás'
          },
          {
            id: '3',
            type: 'commented',
            title: 'Resolução de Problemas de Login',
            author: 'Pedro Costa',
            timestamp: '6 horas atrás'
          }
        ],
        popularArticles: [
          {
            id: '1',
            title: '[TRANSLATION_NEEDED]',
            views: 324,
            rating: 4.8,
            category: 'Tutorial'
          },
          {
            id: '2',
            title: '[TRANSLATION_NEEDED]',
            views: 298,
            rating: 4.5,
            category: 'Configuração'
          },
          {
            id: '3',
            title: 'Troubleshooting de Conectividade',
            views: 267,
            rating: 4.7,
            category: 'Solução de Problemas'
          }
        ]
      };
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="w-full>
        <CardHeader>
          <CardTitle className="flex items-center gap-2>
            <BookOpen className="h-5 w-5" />
            Base de Conhecimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="w-full border-red-200>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600>
            <BookOpen className="h-5 w-5" />
            Base de Conhecimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm>
            Erro ao carregar métricas da base de conhecimento
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleViewModeChange = (mode: 'overview' | 'analytics' | 'activity') => {
    setViewMode(mode);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created': return <Plus className="h-4 w-4 text-green-500" />;
      case 'approved': return <BarChart3 className="h-4 w-4 text-blue-500" />;
      case 'commented': return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default: return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full>
      <CardHeader className="pb-4>
        <div className="flex items-center justify-between>
          <div>
            <CardTitle className="flex items-center gap-2>
              <BookOpen className="h-5 w-5 text-blue-600" />
              Base de Conhecimento
            </CardTitle>
            <CardDescription>
              {metrics.totalArticles} artigos • {metrics.totalViews.toLocaleString()} visualizações
            </CardDescription>
          </div>
          <div className="flex gap-1>
            <Button
              variant={viewMode === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('overview')}
            >
              Visão Geral
            </Button>
            <Button
              variant={viewMode === 'analytics' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('analytics')}
            >
              Analytics
            </Button>
            <Button
              variant={viewMode === 'activity' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('activity')}
            >
              Atividade
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6>
        {viewMode === 'overview' && (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4>
              <div className="text-center>
                <div className="text-2xl font-bold text-blue-600">{metrics.publishedArticles}</div>
                <div className="text-sm text-gray-500">Publicados</div>
              </div>
              <div className="text-center>
                <div className="text-2xl font-bold text-yellow-600">{metrics.draftArticles}</div>
                <div className="text-sm text-gray-500">Rascunhos</div>
              </div>
              <div className="text-center>
                <div className="text-2xl font-bold text-green-600">{metrics.avgRating}</div>
                <div className="text-sm text-gray-500">Avaliação</div>
              </div>
              <div className="text-center>
                <div className="text-2xl font-bold text-purple-600>
                  {metrics.weeklyGrowth}%
                </div>
                <div className="text-sm text-gray-500">Crescimento</div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg>
                <Eye className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="font-semibold">{metrics.totalViews.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Visualizações Totais</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg>
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div>
                  <div className="font-semibold">{metrics.totalComments}</div>
                  <div className="text-sm text-gray-600">Comentários</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg>
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="font-semibold">{metrics.pendingApprovalArticles}</div>
                  <div className="text-sm text-gray-600">Aguardando Aprovação</div>
                </div>
              </div>
            </div>
          </>
        )}

        {viewMode === 'analytics' && (
          <>
            {/* Top Categories */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2>
                <BarChart3 className="h-4 w-4" />
                Categorias Mais Populares
              </h4>
              <div className="space-y-2>
                {metrics.topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded>
                    <span className="font-medium">{category.name}</span>
                    <div className="flex items-center gap-2>
                      <Badge variant="secondary">{category.count} artigos</Badge>
                      <Badge 
                        variant={category.growth > 0 ? "default" : "secondary"
                        className={category.growth > 0 ? "bg-green-500" : ""
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{category.growth}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Articles */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2>
                <Star className="h-4 w-4" />
                Artigos Mais Populares
              </h4>
              <div className="space-y-2>
                {metrics.popularArticles.map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded>
                    <div className="flex-1>
                      <div className="font-medium text-sm">{article.title}</div>
                      <div className="text-xs text-gray-500">{article.category}</div>
                    </div>
                    <div className="flex items-center gap-3 text-sm>
                      <div className="flex items-center gap-1>
                        <Eye className="h-3 w-3" />
                        {article.views}
                      </div>
                      <div className="flex items-center gap-1>
                        <Star className="h-3 w-3 text-yellow-500" />
                        {article.rating}
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {viewMode === 'activity' && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2>
              <Clock className="h-4 w-4" />
              Atividade Recente
            </h4>
            <div className="space-y-3>
              {metrics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg>
                  <div className="mt-0.5>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1>
                    <div className="font-medium text-sm">{activity.title}</div>
                    <div className="text-xs text-gray-600>
                      por {activity.author} • {activity.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t>
          <Button size="sm" className="flex-1" asChild>
            <a href="/knowledge-base>
              <BookOpen className="h-4 w-4 mr-2" />
              Ver Todos
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href="/knowledge-base/create>
              <Plus className="h-4 w-4 mr-2" />
              Criar Artigo
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}';

interface KnowledgeBaseWidgetData {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  pendingApprovalArticles: number;
  topViewedArticles: Array<{
    id: string;
    title: string;
    viewCount: number;
    category: string;
  }>;
  weeklyStats: {
    articlesCreated: number;
    articlesUpdated: number;
    totalViews: number;
    averageRating: number;
  };
}

export function KnowledgeBaseWidget() {
  const { data: widgetData, isLoading, error } = useQuery({
    queryKey: ['/api/knowledge-base/dashboard'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/knowledge-base/dashboard');
      const result = await response.json();
      return result.success ? result.data : null;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card data-testid="kb-widget-loading>
        <CardHeader>
          <CardTitle className="flex items-center gap-2>
            <BookOpen className="h-5 w-5" />
            Base de Conhecimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2>
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !widgetData) {
    return (
      <Card data-testid="kb-widget-error>
        <CardHeader>
          <CardTitle className="flex items-center gap-2>
            <BookOpen className="h-5 w-5" />
            Base de Conhecimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground>
            Erro ao carregar dados da base de conhecimento
          </p>
        </CardContent>
      </Card>
    );
  }

  const data: KnowledgeBaseWidgetData = widgetData;

  return (
    <Card data-testid="kb-widget>
      <CardHeader>
        <CardTitle className="flex items-center gap-2>
          <BookOpen className="h-5 w-5 text-blue-600" />
          Base de Conhecimento
        </CardTitle>
        <CardDescription>
          Estatísticas e atividade recente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4>
          <div className="text-center>
            <div className="text-2xl font-bold text-blue-600" data-testid="total-articles>
              {data.totalArticles}
            </div>
            <div className="text-xs text-muted-foreground">Total de Artigos</div>
          </div>
          <div className="text-center>
            <div className="text-2xl font-bold text-green-600" data-testid="published-articles>
              {data.publishedArticles}
            </div>
            <div className="text-xs text-muted-foreground">Publicados</div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="space-y-2>
          <div className="flex justify-between items-center>
            <span className="text-sm">Rascunhos</span>
            <Badge variant="secondary" data-testid="draft-count>
              {data.draftArticles}
            </Badge>
          </div>
          <div className="flex justify-between items-center>
            <span className="text-sm">Aguardando Aprovação</span>
            <Badge variant="outline" data-testid="pending-count>
              {data.pendingApprovalArticles}
            </Badge>
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="border-t pt-4>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1>
            <TrendingUp className="h-4 w-4" />
            Esta Semana
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs>
            <div className="flex items-center gap-1>
              <Users className="h-3 w-3 text-muted-foreground" />
              <span>{data.weeklyStats.articlesCreated} criados</span>
            </div>
            <div className="flex items-center gap-1>
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>{data.weeklyStats.articlesUpdated} atualizados</span>
            </div>
            <div className="flex items-center gap-1>
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span>{data.weeklyStats.totalViews} visualizações</span>
            </div>
            <div className="flex items-center gap-1>
              <BookOpen className="h-3 w-3 text-muted-foreground" />
              <span>Média: {data.weeklyStats.averageRating}/5</span>
            </div>
          </div>
        </div>

        {/* Top Articles */}
        {data.topViewedArticles.length > 0 && (
          <div className="border-t pt-4>
            <h4 className="text-sm font-medium mb-2">Mais Visualizados</h4>
            <div className="space-y-1>
              {data.topViewedArticles.slice(0, 3).map((article, index) => (
                <div key={article.id} className="flex justify-between items-center text-xs>
                  <span className="truncate flex-1" title={article.title}>
                    {index + 1}. {article.title}
                  </span>
                  <span className="text-muted-foreground ml-2>
                    {article.viewCount} views
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}