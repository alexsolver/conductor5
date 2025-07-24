import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { TrendingUp, TrendingDown, ArrowLeftRight, RotateCcw, Settings, Plus } from 'lucide-react';

interface StockMovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId?: string;
  itemName?: string;
}

interface StockMovement {
  id: string;
  movementType: 'in' | 'out' | 'transfer' | 'return' | 'adjustment';
  quantity: string;
  unitCost?: string;
  totalCost?: string;
  reference?: string;
  referenceType?: string;
  notes?: string;
  createdAt: string;
  item: {
    id: string;
    name: string;
    code: string;
  };
  location: {
    id: string;
    name: string;
    code: string;
  };
}

interface StockLocation {
  id: string;
  name: string;
  code: string;
  type: string;
}

export function StockMovementsModal({ isOpen, onClose, itemId, itemName }: StockMovementsModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newMovement, setNewMovement] = useState({
    itemId: itemId || '',
    locationId: '',
    movementType: 'in' as const,
    quantity: '',
    unitCost: '',
    reference: '',
    referenceType: '',
    notes: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar movimentações
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['/api/parts-services-complete/stock-movements', itemId ? { itemId } : {}],
    queryFn: () => {
      const params = itemId ? `?itemId=${itemId}` : '?limit=50';
      return apiRequest('GET', `/api/parts-services-complete/stock-movements${params}`);
    },
    enabled: isOpen,
  });

  // Buscar localizações de estoque
  const { data: locations = [] } = useQuery({
    queryKey: ['/api/parts-services-complete/stock-locations'],
    queryFn: () => apiRequest('GET', '/api/parts-services-complete/stock-locations'),
    enabled: isOpen,
  });

  // Buscar itens (se não foi especificado um item)
  const { data: items = [] } = useQuery({
    queryKey: ['/api/parts-services-complete/items'],
    queryFn: () => apiRequest('GET', '/api/parts-services-complete/items'),
    enabled: isOpen && !itemId,
  });

  // Mutation para criar movimentação
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const totalCost = data.unitCost && data.quantity 
        ? (parseFloat(data.unitCost) * parseFloat(data.quantity)).toString()
        : undefined;
      
      return apiRequest('POST', '/api/parts-services-complete/stock-movements', {
        ...data,
        totalCost,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Movimentação registrada com sucesso!',
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/parts-services-complete/stock-movements'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/parts-services-complete/stock-levels'] 
      });
      setNewMovement({
        itemId: itemId || '',
        locationId: '',
        movementType: 'in',
        quantity: '',
        unitCost: '',
        reference: '',
        referenceType: '',
        notes: '',
      });
      setIsCreating(false);
    },
    onError: (error) => {
      console.error('Error creating movement:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao registrar movimentação',
        variant: 'destructive',
      });
    },
  });

  const handleCreateMovement = () => {
    if (!newMovement.itemId || !newMovement.locationId || !newMovement.quantity) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(newMovement);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'out':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'transfer':
        return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;
      case 'return':
        return <RotateCcw className="h-4 w-4 text-purple-600" />;
      case 'adjustment':
        return <Settings className="h-4 w-4 text-orange-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMovementTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'in': 'Entrada',
      'out': 'Saída',
      'transfer': 'Transferência',
      'return': 'Devolução',
      'adjustment': 'Ajuste',
    };
    return types[type] || type;
  };

  const getMovementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'in': 'bg-green-100 text-green-800',
      'out': 'bg-red-100 text-red-800',
      'transfer': 'bg-blue-100 text-blue-800',
      'return': 'bg-purple-100 text-purple-800',
      'adjustment': 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>
              Movimentações de Estoque
              {itemName && ` - ${itemName}`}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Movement Section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Nova Movimentação</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(!isCreating)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isCreating ? 'Cancelar' : 'Nova Movimentação'}
              </Button>
            </div>

            {isCreating && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {!itemId && (
                    <div>
                      <Label htmlFor="item">Item *</Label>
                      <Select value={newMovement.itemId} onValueChange={(value) => 
                        setNewMovement(prev => ({ ...prev, itemId: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items?.items?.map((item: any) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} ({item.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="location">Localização *</Label>
                    <Select value={newMovement.locationId} onValueChange={(value) => 
                      setNewMovement(prev => ({ ...prev, locationId: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma localização" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations?.locations?.map((location: StockLocation) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name} ({location.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="movement-type">Tipo de Movimentação *</Label>
                    <Select value={newMovement.movementType} onValueChange={(value: any) => 
                      setNewMovement(prev => ({ ...prev, movementType: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Entrada</SelectItem>
                        <SelectItem value="out">Saída</SelectItem>
                        <SelectItem value="transfer">Transferência</SelectItem>
                        <SelectItem value="return">Devolução</SelectItem>
                        <SelectItem value="adjustment">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantidade *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={newMovement.quantity}
                      onChange={(e) => setNewMovement(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit-cost">Custo Unitário</Label>
                    <Input
                      id="unit-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newMovement.unitCost}
                      onChange={(e) => setNewMovement(prev => ({ ...prev, unitCost: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="reference">Referência</Label>
                    <Input
                      id="reference"
                      placeholder="Ex: OS-123, PO-456"
                      value={newMovement.reference}
                      onChange={(e) => setNewMovement(prev => ({ ...prev, reference: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="reference-type">Tipo de Referência</Label>
                    <Select value={newMovement.referenceType} onValueChange={(value) => 
                      setNewMovement(prev => ({ ...prev, referenceType: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Ordem de Serviço</SelectItem>
                        <SelectItem value="purchase">Pedido de Compra</SelectItem>
                        <SelectItem value="service">Serviço</SelectItem>
                        <SelectItem value="maintenance">Manutenção</SelectItem>
                        <SelectItem value="inventory">Inventário</SelectItem>
                        <SelectItem value="other">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais sobre a movimentação..."
                    value={newMovement.notes}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, notes: e.target.value }))}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateMovement}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Registrando...' : 'Registrar Movimentação'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Movements List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Histórico de Movimentações ({movements?.movements?.length || 0})
            </h3>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Carregando movimentações...</p>
              </div>
            ) : movements?.movements?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">Nenhuma movimentação encontrada</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {movements?.movements?.map((movement: StockMovement) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      {getMovementIcon(movement.movementType)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">
                            {movement.item.name} ({movement.item.code})
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMovementTypeColor(movement.movementType)}`}>
                            {getMovementTypeLabel(movement.movementType)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {movement.location.name} • Qtd: {movement.quantity}
                          {movement.unitCost && ` • Custo: R$ ${parseFloat(movement.unitCost).toFixed(2)}`}
                          {movement.reference && ` • Ref: ${movement.reference}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(movement.createdAt).toLocaleString('pt-BR')}
                        </p>
                        {movement.notes && (
                          <p className="text-sm text-gray-600 mt-1 italic">
                            "{movement.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {movement.totalCost && (
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          R$ {parseFloat(movement.totalCost).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">Valor Total</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}