import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { Search, Star, Clock, Users, Filter } from 'lucide-react';

interface TemplatePreview {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: string;
  urgency: string;
  impact: string;
  usage_count: number;
  estimated_hours: number;
  requires_approval: boolean;
  auto_assign: boolean;
  is_popular: boolean;
  default_title: string;
  default_description: string;
}

interface TemplateSelectorProps {
  companyId?: string;
  onSelectTemplate: (template: TemplatePreview) => void;
  onCancel: () => void;
}

export default function TemplateSelector({ 
  companyId = 'all', 
  onSelectTemplate, 
  onCancel 
}: TemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPopularOnly, setShowPopularOnly] = useState(false);

  // Fetch templates
  const { data: templatesResponse, isLoading } = useQuery({
    queryKey: ['template-selector-templates', companyId],
    queryFn: async () => {
      console.log('🔍 [TEMPLATE-SELECTOR] Fetching templates for company:', companyId);
      const endpoint = companyId === 'all' 
        ? '/api/ticket-templates' 
        : `/api/ticket-templates/company/${companyId}`;
      const response = await apiRequest('GET', endpoint);
      const data = await response.json();
      console.log('✅ [TEMPLATE-SELECTOR] Response:', data);
      return data;
    },
    enabled: !!companyId,
  });

  const templates = React.useMemo(() => {
    console.log('🔄 [TEMPLATE-SELECTOR-PROCESSING] Processing templates response:', templatesResponse);
    
    if (!templatesResponse) {
      console.log('❌ [TEMPLATE-SELECTOR-PROCESSING] No response data');
      return [];
    }

    // Handle different response formats
    if (templatesResponse.success && templatesResponse.data) {
      if (Array.isArray(templatesResponse.data.templates)) {
        console.log('✅ [TEMPLATE-SELECTOR-PROCESSING] Found templates array in data.templates:', templatesResponse.data.templates.length);
        return templatesResponse.data.templates;
      }
      if (Array.isArray(templatesResponse.data)) {
        console.log('✅ [TEMPLATE-SELECTOR-PROCESSING] Found templates array in data:', templatesResponse.data.length);
        return templatesResponse.data;
      }
    }

    if (Array.isArray(templatesResponse.data)) {
      console.log('✅ [TEMPLATE-SELECTOR-PROCESSING] Found templates array:', templatesResponse.data.length);
      return templatesResponse.data;
    }

    if (Array.isArray(templatesResponse)) {
      console.log('✅ [TEMPLATE-SELECTOR-PROCESSING] Found templates array in response:', templatesResponse.length);
      return templatesResponse;
    }

    console.log('❌ [TEMPLATE-SELECTOR-PROCESSING] No valid templates found, returning empty array');
    return [];
  }, [templatesResponse]);

  // Fetch categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['/api/ticket-templates/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ticket-templates/categories');
      return response.json();
    },
  });

  const categories = Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : [];

  // Fetch popular templates
  const { data: popularResponse } = useQuery({
    queryKey: ['/api/ticket-templates/company', companyId, 'popular'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ticket-templates/company/${companyId}/popular?limit=5`);
      return response.json();
    },
  });

  const popularTemplates = Array.isArray(popularResponse?.data) ? popularResponse.data : [];

  // Filter templates
  const filteredTemplates = templates.filter((template: TemplatePreview) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesPopular = !showPopularOnly || popularTemplates.some((p: TemplatePreview) => p.id === template.id);
    
    return matchesSearch && matchesCategory && matchesPopular;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baixa';
      case 'medium': return 'Média';
      case 'high': return 'Alta';
      case 'critical': return 'Crítica';
      default: return priority;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Selecionar Template</h2>
          <p className="text-muted-foreground">
            Escolha um template para acelerar a criação do ticket
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      {/* Popular Templates Quick Selection */}
      {popularTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Templates Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {popularTemplates.slice(0, 6).map((template: TemplatePreview) => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="h-auto p-3 text-left justify-start"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="space-y-1">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {template.category} • Usado {template.usage_count} vezes
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar templates por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showPopularOnly ? "default" : "outline"}
              onClick={() => setShowPopularOnly(!showPopularOnly)}
              className="w-full sm:w-auto"
            >
              <Star className="w-4 h-4 mr-2" />
              Só populares
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm || selectedCategory !== 'all' || showPopularOnly ? 
              'Nenhum template encontrado com os filtros aplicados.' :
              'Nenhum template disponível.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template: TemplatePreview) => (
            <Card 
              key={template.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {popularTemplates.some((p: TemplatePreview) => p.id === template.id) && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                </div>
                <Badge variant="secondary" className="w-fit">
                  {template.category}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={getPriorityColor(template.priority)}>
                      {getPriorityLabel(template.priority)}
                    </Badge>
                    {template.requires_approval && (
                      <Badge variant="outline" className="text-orange-600">
                        Requer aprovação
                      </Badge>
                    )}
                    {template.auto_assign && (
                      <Badge variant="outline" className="text-blue-600">
                        Auto-atribuição
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>Estimativa: {template.estimated_hours}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      <span>Usado: {template.usage_count || 0} vezes</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground font-medium">
                      Preview: {template.default_title || 'Título será preenchido automaticamente'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}