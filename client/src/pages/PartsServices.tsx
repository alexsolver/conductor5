import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Wrench, 
  Search, 
  Plus, 
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function PartsServices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Buscar dados básicos - por enquanto retornará vazio pois não há dados
  const { data: partsData, isLoading: partsLoading } = useQuery({
    queryKey: ['/api/parts-services/parts'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/parts-services/parts');
        return response.json();
      } catch (error) {
        return { parts: [] };
      }
    },
  });

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/parts-services/services'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/parts-services/services');
        return response.json();
      } catch (error) {
        return { services: [] };
      }
    },
  });

  const parts = partsData?.parts || [];
  const services = servicesData?.services || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Peças e Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie peças, serviços e inventário
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar peças e serviços..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="parts">Peças</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="inventory">Inventário</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Peças</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{parts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {parts.length === 0 ? 'Nenhuma peça cadastrada' : 'peças ativas'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{services.length}</div>
                <p className="text-xs text-muted-foreground">
                  {services.length === 0 ? 'Nenhum serviço cadastrado' : 'serviços ativos'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  itens com estoque baixo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">OK</div>
                <p className="text-xs text-muted-foreground">
                  sistema operacional
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Module Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status do Módulo</CardTitle>
              <CardDescription>
                Módulo Peças e Serviços - Configuração Inicial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Módulo Limpo e Pronto</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    O módulo foi completamente removido e está pronto para implementação incremental.
                    Solicite as funcionalidades específicas que deseja implementar primeiro.
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Badge variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Base Criada
                  </Badge>
                  <Badge variant="secondary">
                    Aguardando Especificações
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Peças</CardTitle>
              <CardDescription>
                Módulo de peças em desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Módulo de Peças</h3>
                <p className="text-muted-foreground">
                  Este módulo será implementado de forma incremental.
                  Solicite as funcionalidades específicas que precisa.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Serviços</CardTitle>
              <CardDescription>
                Módulo de serviços em desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Módulo de Serviços</h3>
                <p className="text-muted-foreground">
                  Este módulo será implementado de forma incremental.
                  Solicite as funcionalidades específicas que precisa.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Inventário</CardTitle>
              <CardDescription>
                Módulo de inventário em desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Controle de Inventário</h3>
                <p className="text-muted-foreground">
                  Este módulo será implementado de forma incremental.
                  Solicite as funcionalidades específicas que precisa.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}