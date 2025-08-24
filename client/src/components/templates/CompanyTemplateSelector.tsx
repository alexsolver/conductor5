import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { Building2, Globe } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  displayName: string;
  description: string;
  size: string;
  subscriptionTier: string;
}

interface CompanyTemplateSelectorProps {
  selectedCompany: string;
  onCompanyChange: (companyId: string) => void;
  showStats?: boolean;
}

export default function CompanyTemplateSelector({ 
  selectedCompany, 
  onCompanyChange, 
  showStats = true 
}: CompanyTemplateSelectorProps) {
  // Fetch companies
  const { data: companiesResponse, isLoading: companiesLoading } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/companies');
      return response.json();
    },
  });

  const companies: Company[] = Array.isArray(companiesResponse?.data) ? companiesResponse.data : [];

  // Fetch template stats for selected company
  const { data: statsResponse } = useQuery({
    queryKey: ['/api/ticket-templates/company', selectedCompany, 'stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ticket-templates/company/${selectedCompany}/stats`);
      return response.json();
    },
    enabled: showStats
  });

  const stats = statsResponse?.data?.[0] || {};

  const getCompanyInfo = (companyId: string) => {
    if (companyId === 'all') {
      return {
        name: 'Todos os Clientes',
        description: 'Templates globais disponíveis para todos',
        icon: <Globe className="w-4 h-4" />
      };
    }
    
    const company = companies.find(c => c.id === companyId);
    return {
      name: company?.displayName || company?.name || 'Cliente não encontrado',
      description: company?.description || 'Sem descrição',
      icon: <Building2 className="w-4 h-4" />
    };
  };

  const selectedCompanyInfo = getCompanyInfo(selectedCompany);

  const getSubscriptionColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSizeColor = (size: string) => {
    switch (size?.toLowerCase()) {
      case 'large': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'small': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSizeLabel = (size: string) => {
    switch (size?.toLowerCase()) {
      case 'large': return 'Grande';
      case 'medium': return 'Médio';
      case 'small': return 'Pequeno';
      default: return size || 'N/A';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'enterprise': return 'Enterprise';
      case 'professional': return 'Profissional';
      case 'basic': return 'Básico';
      default: return tier || 'N/A';
    }
  };

  if (companiesLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Company Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {selectedCompanyInfo.icon}
            Selecionar Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select value={selectedCompany} onValueChange={onCompanyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>Todos os Clientes (Templates Globais)</span>
                  </div>
                </SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{company.displayName || company.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Selected Company Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{selectedCompanyInfo.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCompanyInfo.description}
                  </p>
                </div>
                
                {selectedCompany !== 'all' && (
                  <div className="flex gap-2 ml-4">
                    {(() => {
                      const company = companies.find(c => c.id === selectedCompany);
                      if (!company) return null;
                      
                      return (
                        <>
                          <Badge className={getSubscriptionColor(company.subscriptionTier)}>
                            {getTierLabel(company.subscriptionTier)}
                          </Badge>
                          <Badge className={getSizeColor(company.size)}>
                            {getSizeLabel(company.size)}
                          </Badge>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Stats for Selected Company */}
      {showStats && stats && Object.keys(stats).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Estatísticas de Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.total_templates || 0}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.active_templates || 0}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{Math.round(stats.avg_usage || 0)}</p>
                <p className="text-sm text-muted-foreground">Uso Médio</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.max_usage || 0}</p>
                <p className="text-sm text-muted-foreground">Mais Usado</p>
              </div>
            </div>

            {stats.templates_by_category && stats.templates_by_category.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Categorias Disponíveis
                </p>
                <div className="flex flex-wrap gap-2">
                  {stats.templates_by_category.map((category: any, index: number) => (
                    <Badge key={category.category} variant="outline">
                      {category.category} ({category.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}