import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Package, Users, Warehouse, ShoppingCart, Plus, Star, Phone, Mail, MapPin } from 'lucide-react';

export default function PartsServicesSimple() {
  const [searchTerm, setSearchTerm] = useState("");

  // Queries para dados reais das APIs
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/parts-services/dashboard/stats'],
    refetchInterval: 30000
  });

  const { data: parts, isLoading: isLoadingParts } = useQuery({
    queryKey: ['/api/parts-services/parts']
  });

  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['/api/parts-services/suppliers']
  });

  const { data: inventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['/api/parts-services/inventory']
  });

  // Filtro de peças por termo de busca
  const filteredParts = parts?.filter((part: any) => 
    part.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.internal_code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-4 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Sistema Parts & Services</h1>
        <p className="text-gray-600">Gestão completa de peças, estoque e fornecedores com dados reais</p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Peças</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : dashboardStats?.totalParts || 0}
            </div>
            <p className="text-xs text-muted-foreground">Peças ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingSuppliers ? '...' : dashboardStats?.totalSuppliers || 0}
            </div>
            <p className="text-xs text-muted-foreground">Fornecedores ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : dashboardStats?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">Pedidos de compra</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simulações</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : dashboardStats?.totalSimulations || 0}
            </div>
            <p className="text-xs text-muted-foreground">Orçamentos simulados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com dados reais */}
      <Tabs defaultValue="parts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="parts">Gestão de Peças</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="inventory">Estoque</TabsTrigger>
        </TabsList>

        {/* Tab de Peças */}
        <TabsContent value="parts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Catálogo de Peças</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Peça
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Input
              placeholder="Buscar peças..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoadingParts ? (
            <div className="text-center py-8">Carregando peças...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParts.map((part: any) => (
                <Card key={part.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{part.title}</CardTitle>
                        <CardDescription>{part.internal_code}</CardDescription>
                      </div>
                      <Badge variant={part.abc_classification === 'A' ? 'destructive' : 
                                     part.abc_classification === 'B' ? 'default' : 'secondary'}>
                        {part.abc_classification}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{part.description}</p>
                      <div className="flex justify-between text-sm">
                        <span>Custo:</span>
                        <span className="font-medium">R$ {parseFloat(part.cost_price).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Venda:</span>
                        <span className="font-medium text-green-600">R$ {parseFloat(part.sale_price).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Margem:</span>
                        <span className="font-medium">{part.margin_percentage}%</span>
                      </div>
                      {part.voltage && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Voltagem:</strong> {part.voltage}
                        </div>
                      )}
                      {part.power_watts && parseFloat(part.power_watts) > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Potência:</strong> {part.power_watts}W
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab de Fornecedores */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Rede de Fornecedores</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Fornecedor
            </Button>
          </div>

          {isLoadingSuppliers ? (
            <div className="text-center py-8">Carregando fornecedores...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers?.map((supplier: any) => (
                <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{supplier.trade_name}</CardTitle>
                        <CardDescription>{supplier.supplier_code}</CardDescription>
                      </div>
                      <Badge variant={supplier.supplier_type === 'preferred' ? 'default' : 'secondary'}>
                        {supplier.supplier_type === 'preferred' ? 'Preferencial' : 'Regular'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{supplier.name}</p>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="w-3 h-3 mr-1" />
                        {supplier.phone}
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="w-3 h-3 mr-1" />
                        {supplier.email}
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" />
                        {supplier.city}, {supplier.state}
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Prazo de Entrega:</span>
                        <span className="font-medium">{supplier.lead_time_days} dias</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Avaliação Geral:</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="font-medium">{parseFloat(supplier.overall_rating).toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium">{parseFloat(supplier.quality_rating).toFixed(1)}</div>
                          <div className="text-muted-foreground">Qualidade</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{parseFloat(supplier.delivery_rating).toFixed(1)}</div>
                          <div className="text-muted-foreground">Entrega</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{parseFloat(supplier.price_rating).toFixed(1)}</div>
                          <div className="text-muted-foreground">Preço</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab de Estoque */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Controle de Estoque</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajustar Estoque
            </Button>
          </div>

          {isLoadingInventory ? (
            <div className="text-center py-8">Carregando estoque...</div>
          ) : inventory?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Warehouse className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum item em estoque</h3>
                <p className="text-muted-foreground mb-4">
                  Comece adicionando itens ao seu controle de estoque
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory?.map((item: any) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Item: {item.part_id}</CardTitle>
                    <CardDescription>Localização: {item.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Estoque Atual:</span>
                        <span className="font-medium">{item.current_stock}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Estoque Mínimo:</span>
                        <span className="font-medium">{item.minimum_stock}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Estoque Máximo:</span>
                        <span className="font-medium">{item.maximum_stock}</span>
                      </div>
                      <Badge 
                        variant={item.current_stock <= item.minimum_stock ? 'destructive' : 'default'}
                        className="w-full justify-center"
                      >
                        {item.current_stock <= item.minimum_stock ? 'Estoque Baixo' : 'Estoque Normal'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}