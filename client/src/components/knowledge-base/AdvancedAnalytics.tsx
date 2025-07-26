/**
 * Advanced Analytics Component for Knowledge Base
 * Enterprise analytics with charts and performance metrics
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { 
  TrendingUp,
  Eye,
  MessageCircle,
  Star,
  Users,
  Clock,
  Calendar,
  BarChart3,
  Download,
  Filter
} from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AnalyticsData {
  views: { date: string; count: number; unique: number }[]
  engagement: { date: string; comments: number; ratings: number; shares: number }[]
  topArticles: { id: string; title: string; views: number; rating: number; category: string }[]
  categoryPerformance: { category: string; articles: number; views: number; engagement: number }[]
  userBehavior: { timeSpent: number; bounceRate: number; returnVisitors: number }
  searchTerms: { term: string; count: number; clickThrough: number }[]
}

interface AdvancedAnalyticsProps {
  data: AnalyticsData
  timeRange: string
  onTimeRangeChange: (range: string) => void
  onExportReport: (format: 'pdf' | 'excel') => void
}

export function AdvancedAnalytics({ 
  data, 
  timeRange, 
  onTimeRangeChange,
  onExportReport 
}: AdvancedAnalyticsProps) {
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'engagement'>('views')
  const [showFilters, setShowFilters] = useState(false)

  const colors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6'
  }

  const pieColors = [colors.primary, colors.secondary, colors.accent, colors.danger, colors.purple]

  // Calculate total metrics
  const totalViews = data.views.reduce((sum, item) => sum + item.count, 0)
  const totalUniqueViews = data.views.reduce((sum, item) => sum + item.unique, 0)
  const totalComments = data.engagement.reduce((sum, item) => sum + item.comments, 0)
  const totalRatings = data.engagement.reduce((sum, item) => sum + item.ratings, 0)
  const avgRating = data.topArticles.length > 0 
    ? data.topArticles.reduce((sum, article) => sum + article.rating, 0) / data.topArticles.length 
    : 0

  // Growth calculations
  const viewsGrowth = data.views.length > 1 ? 
    ((data.views[data.views.length - 1].count - data.views[0].count) / data.views[0].count) * 100 : 0

  const engagementGrowth = data.engagement.length > 1 ? 
    ((data.engagement[data.engagement.length - 1].comments - data.engagement[0].comments) / data.engagement[0].comments) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Avançados</h2>
          <p className="text-gray-600">Métricas detalhadas de performance da base de conhecimento</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 3 meses</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onExportReport('excel')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Visualizações</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className={`h-4 w-4 ${viewsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className={viewsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(viewsGrowth).toFixed(1)}%
                </span>
                <span className="text-gray-500">vs período anterior</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Únicos</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{totalUniqueViews.toLocaleString()}</div>
              <div className="text-sm text-gray-500">
                {((totalUniqueViews / totalViews) * 100).toFixed(1)}% do total
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">Comentários</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{totalComments}</div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className={`h-4 w-4 ${engagementGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className={engagementGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(engagementGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium">Avaliações</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{totalRatings}</div>
              <div className="text-sm text-gray-500">
                {avgRating.toFixed(1)} média
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Tempo Médio</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{data.userBehavior.timeSpent}min</div>
              <div className="text-sm text-gray-500">
                {data.userBehavior.bounceRate}% bounce rate
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {selectedMetric === 'views' ? 'Visualizações ao Longo do Tempo' : 'Engajamento ao Longo do Tempo'}
            </CardTitle>
            <CardDescription>
              <Select value={selectedMetric} onValueChange={(value: 'views' | 'engagement') => setSelectedMetric(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="views">Visualizações</SelectItem>
                  <SelectItem value="engagement">Engajamento</SelectItem>
                </SelectContent>
              </Select>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {selectedMetric === 'views' ? (
                <AreaChart data={data.views}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={colors.primary} 
                    fill={colors.primary}
                    fillOpacity={0.3}
                    name="Total"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="unique" 
                    stroke={colors.secondary} 
                    fill={colors.secondary}
                    fillOpacity={0.3}
                    name="Únicos"
                  />
                </AreaChart>
              ) : (
                <LineChart data={data.engagement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="comments" 
                    stroke={colors.accent} 
                    name="Comentários"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ratings" 
                    stroke={colors.purple} 
                    name="Avaliações"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="shares" 
                    stroke={colors.secondary} 
                    name="Compartilhamentos"
                    strokeWidth={2}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Categoria</CardTitle>
            <CardDescription>Distribuição de visualizações por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.categoryPerformance}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="views"
                  label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                >
                  {data.categoryPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Articles & Search Terms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Articles */}
        <Card>
          <CardHeader>
            <CardTitle>Artigos Mais Visualizados</CardTitle>
            <CardDescription>Top 10 artigos do período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topArticles.slice(0, 10).map((article, index) => (
                <div key={article.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <Badge variant="outline" className="w-8 text-center">
                    {index + 1}
                  </Badge>
                  
                  <div className="flex-1">
                    <p className="font-medium text-sm">{article.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{article.views.toLocaleString()} visualizações</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span>{article.rating.toFixed(1)}</span>
                      </div>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs">
                        {article.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Termos de Busca Populares</CardTitle>
            <CardDescription>Principais pesquisas realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.searchTerms.slice(0, 10).map((term, index) => (
                <div key={term.term} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 text-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{term.term}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{term.count} buscas</span>
                    <Badge 
                      variant={term.clickThrough > 80 ? "default" : term.clickThrough > 50 ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {term.clickThrough}% CTR
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Category Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada por Categoria</CardTitle>
          <CardDescription>Performance completa de cada categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.categoryPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="articles" fill={colors.primary} name="Artigos" />
              <Bar dataKey="views" fill={colors.secondary} name="Visualizações" />
              <Bar dataKey="engagement" fill={colors.accent} name="Engajamento" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}