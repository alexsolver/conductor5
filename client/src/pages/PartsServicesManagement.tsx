import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package, Wrench, Users, ClipboardList, Settings } from "lucide-react";

export default function PartsServicesManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar estatísticas gerais
  const { data: partsStats } = useQuery({
    queryKey: ['/api/parts-services/parts/stats'],
  });

  // Buscar tipos de atividade
  const { data: activityTypes } = useQuery({
    queryKey: ['/api/parts-services/activity-types'],
  });

  // Buscar peças
  const { data: parts } = useQuery({
    queryKey: ['/api/parts-services/parts'],
  });

  // Buscar fornecedores
  const { data: suppliers } = useQuery({
    queryKey: ['/api/parts-services/suppliers'],
  });

  // Buscar inventário
  const { data: inventory } = useQuery({
    queryKey: ['/api/parts-services/inventory'],
  });

  // Buscar kits de serviço
  const { data: serviceKits } = useQuery({
    queryKey: ['/api/parts-services/service-kits'],
  });

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Peças e Serviços</h1>
          <p className="text-gray-600">Controle completo de estoque, fornecedores e kits de serviço</p>
        </div>
        <div className="flex space-x-2">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Peça
          </Button>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Peças</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(partsStats as any)?.totalParts || 0}</div>
            <p className="text-xs text-muted-foreground">Peças cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(suppliers) ? suppliers.length : 0}</div>
            <p className="text-xs text-muted-foreground">Fornecedores ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kits de Serviço</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(serviceKits) ? serviceKits.length : 0}</div>
            <p className="text-xs text-muted-foreground">Kits configurados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Atividade</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(activityTypes) ? activityTypes.length : 0}</div>
            <p className="text-xs text-muted-foreground">Tipos cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Busca */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar peças, fornecedores ou kits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="parts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="parts">Peças</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="inventory">Inventário</TabsTrigger>
          <TabsTrigger value="service-kits">Kits de Serviço</TabsTrigger>
          <TabsTrigger value="activity-types">Tipos de Atividade</TabsTrigger>
        </TabsList>

        {/* Aba de Peças */}
        <TabsContent value="parts" className="space-y-4">
          <div className="grid gap-4">
            {Array.isArray(parts) && parts.map((part: any) => (
              <Card key={part.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{part.name}</h3>
                        <Badge variant={part.isActive ? "default" : "secondary"}>
                          {part.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{part.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Código: {part.partNumber}</span>
                        <span>Categoria: {part.category}</span>
                        <span>Preço: R$ {part.unitPrice?.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="outline" size="sm">Ver Detalhes</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba de Fornecedores */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid gap-4">
            {Array.isArray(suppliers) && suppliers.map((supplier: any) => (
              <Card key={supplier.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{supplier.name}</h3>
                        <Badge variant={supplier.isActive ? "default" : "secondary"}>
                          {supplier.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>CNPJ: {supplier.taxId}</span>
                        <span>Email: {supplier.email}</span>
                        <span>Telefone: {supplier.phone}</span>
                      </div>
                      <p className="text-sm text-gray-600">{supplier.address}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="outline" size="sm">Ver Detalhes</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba de Inventário */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4">
            {Array.isArray(inventory) && inventory.map((item: any) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Peça: {item.partId}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Localização: {item.location}</span>
                        <span>Quantidade: {item.quantity}</span>
                        <span>Mínimo: {item.minimumQuantity}</span>
                        <span>Máximo: {item.maximumQuantity}</span>
                      </div>
                      <Badge 
                        variant={item.quantity <= item.minimumQuantity ? "destructive" : "default"}
                      >
                        {item.quantity <= item.minimumQuantity ? "Estoque Baixo" : "Estoque OK"}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Ajustar Estoque</Button>
                      <Button variant="outline" size="sm">Ver Histórico</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba de Kits de Serviço */}
        <TabsContent value="service-kits" className="space-y-4">
          <div className="grid gap-4">
            {Array.isArray(serviceKits) && serviceKits.map((kit: any) => (
              <Card key={kit.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{kit.name}</h3>
                        <Badge variant={kit.isActive ? "default" : "secondary"}>
                          {kit.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{kit.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Preço Total: R$ {kit.totalPrice?.toFixed(2)}</span>
                        <span>Tempo Estimado: {kit.estimatedDuration}h</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="outline" size="sm">Ver Itens</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba de Tipos de Atividade */}
        <TabsContent value="activity-types" className="space-y-4">
          <div className="grid gap-4">
            {Array.isArray(activityTypes) && activityTypes.map((type: any) => (
              <Card key={type.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{type.name}</h3>
                        <Badge variant={type.isActive ? "default" : "secondary"}>
                          {type.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Preço Base: R$ {type.basePrice?.toFixed(2)}</span>
                        <span>Duração Padrão: {type.defaultDuration}h</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="outline" size="sm">Ver Detalhes</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}