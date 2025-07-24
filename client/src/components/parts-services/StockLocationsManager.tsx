
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Warehouse, Store, Truck, User, Plus, Edit, Trash2, Search } from "lucide-react";

interface StockLocation {
  id: string;
  location_code: string;
  location_name: string;
  location_type: 'warehouse' | 'store' | 'truck' | 'customer';
  address?: string;
  city?: string;
  state?: string;
  is_main_warehouse: boolean;
  allows_negative_stock: boolean;
  is_active: boolean;
}

export function StockLocationsManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StockLocation | null>(null);
  const [newLocation, setNewLocation] = useState({
    location_code: "",
    location_name: "",
    location_type: "warehouse" as const,
    address: "",
    city: "",
    state: "",
    allows_negative_stock: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['/api/parts-services/etapa1/stock-locations']
  });

  // Mutations
  const createLocationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/parts-services/etapa1/stock-locations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa1/stock-locations'] });
      setIsCreateModalOpen(false);
      setNewLocation({
        location_code: "", location_name: "", location_type: "warehouse",
        address: "", city: "", state: "", allows_negative_stock: false
      });
      toast({ title: "Localização criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar localização", 
        description: error?.message || "Erro desconhecido",
        variant: "destructive" 
      });
    }
  });

  const updateLocationMutation = useMutation({
    mutationFn: (data: {id: string, updates: any}) => 
      apiRequest('PUT', `/api/parts-services/etapa1/stock-locations/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa1/stock-locations'] });
      setIsEditModalOpen(false);
      setEditingLocation(null);
      toast({ title: "Localização atualizada com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao atualizar localização", variant: "destructive" })
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/parts-services/etapa1/stock-locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa1/stock-locations'] });
      toast({ title: "Localização excluída com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao excluir localização", variant: "destructive" })
  });

  // Filtros
  const filteredLocations = locations.filter((location: StockLocation) =>
    location.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.location_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ícones por tipo
  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'warehouse': return <Warehouse className="h-5 w-5" />;
      case 'store': return <Store className="h-5 w-5" />;
      case 'truck': return <Truck className="h-5 w-5" />;
      case 'customer': return <User className="h-5 w-5" />;
      default: return <MapPin className="h-5 w-5" />;
    }
  };

  const getLocationTypeLabel = (type: string) => {
    switch (type) {
      case 'warehouse': return 'Armazém';
      case 'store': return 'Loja';
      case 'truck': return 'Veículo';
      case 'customer': return 'Cliente';
      default: return type;
    }
  };

  const handleEdit = (location: StockLocation) => {
    setEditingLocation(location);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Localizações de Estoque</h2>
          <p className="text-muted-foreground">Gerencie armazéns, lojas e pontos de estoque</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nova Localização</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Localização</DialogTitle>
              <DialogDescription>Adicione uma nova localização de estoque</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="loc-code" className="text-right">Código <span className="text-red-500">*</span></Label>
                <Input 
                  id="loc-code" 
                  value={newLocation.location_code} 
                  onChange={(e) => setNewLocation({...newLocation, location_code: e.target.value})} 
                  className="col-span-3" 
                  placeholder="Ex: WH001"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="loc-name" className="text-right">Nome <span className="text-red-500">*</span></Label>
                <Input 
                  id="loc-name" 
                  value={newLocation.location_name} 
                  onChange={(e) => setNewLocation({...newLocation, location_name: e.target.value})} 
                  className="col-span-3" 
                  placeholder="Nome da localização"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="loc-type" className="text-right">Tipo <span className="text-red-500">*</span></Label>
                <Select 
                  value={newLocation.location_type} 
                  onValueChange={(value: any) => setNewLocation({...newLocation, location_type: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse">Armazém</SelectItem>
                    <SelectItem value="store">Loja</SelectItem>
                    <SelectItem value="truck">Veículo</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="loc-address" className="text-right">Endereço</Label>
                <Textarea 
                  id="loc-address" 
                  value={newLocation.address} 
                  onChange={(e) => setNewLocation({...newLocation, address: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="loc-city" className="text-right">Cidade</Label>
                <Input 
                  id="loc-city" 
                  value={newLocation.city} 
                  onChange={(e) => setNewLocation({...newLocation, city: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => {
                  if (!newLocation.location_code || !newLocation.location_name) {
                    toast({
                      title: "Campos obrigatórios não preenchidos",
                      description: "Preencha: Código e Nome",
                      variant: "destructive"
                    });
                    return;
                  }
                  createLocationMutation.mutate(newLocation);
                }} 
                disabled={createLocationMutation.isPending}
              >
                {createLocationMutation.isPending ? 'Criando...' : 'Criar Localização'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar localizações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 max-w-sm"
          />
        </div>
      </div>

      {/* Cards de Localizações */}
      {isLoading ? (
        <div className="text-center py-8">Carregando localizações...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location: StockLocation) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <div className="text-blue-600">
                      {getLocationIcon(location.location_type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{location.location_name}</CardTitle>
                      <CardDescription>{location.location_code}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Badge variant="outline">
                      {getLocationTypeLabel(location.location_type)}
                    </Badge>
                    {location.is_main_warehouse && (
                      <Badge variant="default">Principal</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {location.address && (
                    <p className="text-sm text-muted-foreground">{location.address}</p>
                  )}
                  {location.city && location.state && (
                    <p className="text-sm text-muted-foreground">{location.city} - {location.state}</p>
                  )}
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(location)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja excluir esta localização?')) {
                          deleteLocationMutation.mutate(location.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Localização</DialogTitle>
            <DialogDescription>Atualize as informações da localização</DialogDescription>
          </DialogHeader>
          {editingLocation && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Nome</Label>
                <Input 
                  id="edit-name" 
                  value={editingLocation.location_name} 
                  onChange={(e) => setEditingLocation({...editingLocation, location_name: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-address" className="text-right">Endereço</Label>
                <Textarea 
                  id="edit-address" 
                  value={editingLocation.address || ''} 
                  onChange={(e) => setEditingLocation({...editingLocation, address: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-city" className="text-right">Cidade</Label>
                <Input 
                  id="edit-city" 
                  value={editingLocation.city || ''} 
                  onChange={(e) => setEditingLocation({...editingLocation, city: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              onClick={() => updateLocationMutation.mutate({id: editingLocation?.id!, updates: editingLocation})} 
              disabled={updateLocationMutation.isPending}
            >
              {updateLocationMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
