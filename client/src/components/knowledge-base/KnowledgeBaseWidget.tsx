// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE DASHBOARD WIDGET - CLEAN ARCHITECTURE
// Presentation layer - displays Knowledge Base analytics on main dashboard

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, TrendingUp, Users, Clock, BarChart3 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

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
      <Card data-testid="kb-widget-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Base de Conhecimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
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
      <Card data-testid="kb-widget-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Base de Conhecimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Erro ao carregar dados da base de conhecimento
          </p>
        </CardContent>
      </Card>
    );
  }

  const data: KnowledgeBaseWidgetData = widgetData;

  return (
    <Card data-testid="kb-widget">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          Base de Conhecimento
        </CardTitle>
        <CardDescription>
          Estatísticas e atividade recente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600" data-testid="total-articles">
              {data.totalArticles}
            </div>
            <div className="text-xs text-muted-foreground">Total de Artigos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600" data-testid="published-articles">
              {data.publishedArticles}
            </div>
            <div className="text-xs text-muted-foreground">Publicados</div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Rascunhos</span>
            <Badge variant="secondary" data-testid="draft-count">
              {data.draftArticles}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Aguardando Aprovação</span>
            <Badge variant="outline" data-testid="pending-count">
              {data.pendingApprovalArticles}
            </Badge>
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Esta Semana
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span>{data.weeklyStats.articlesCreated} criados</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>{data.weeklyStats.articlesUpdated} atualizados</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span>{data.weeklyStats.totalViews} visualizações</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-muted-foreground" />
              <span>Média: {data.weeklyStats.averageRating}/5</span>
            </div>
          </div>
        </div>

        {/* Top Articles */}
        {data.topViewedArticles.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Mais Visualizados</h4>
            <div className="space-y-1">
              {data.topViewedArticles.slice(0, 3).map((article, index) => (
                <div key={article.id} className="flex justify-between items-center text-xs">
                  <span className="truncate flex-1" title={article.title}>
                    {index + 1}. {article.title}
                  </span>
                  <span className="text-muted-foreground ml-2">
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