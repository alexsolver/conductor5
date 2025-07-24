import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Wrench, Plus, Package, Trash2, Edit, Eye } from 'lucide-react';

interface ServiceKitsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServiceKit {
  id: string;
  name: string;
  description?: string;
  estimatedCost?: string;
  estimatedDuration?: string;
  category?: string;
  items?: ServiceKitItem[];
}

interface ServiceKitItem {
  id: string;
  quantity: string;
  isOptional: boolean;
  notes?: string;
  item: {
    id: string;
    name: string;
    code: string;
    type: string;
    unitOfMeasure?: string;
    unitCost?: string;
  };
}

export function ServiceKitsModal({ isOpen, onClose }: ServiceKitsModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedKit, setSelectedKit] = useState<ServiceKit | null>(null);
  const [isViewingKit, setIsViewingKit] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newKit, setNewKit] = useState({
    name: '',
    description: '',
    estimatedCost: '',
    estimatedDuration: '',
    category: '',
  });
  const [newKitItem, setNewKitItem] = useState({
    itemId: '',
    quantity: '1',
    isOptional: false,
    notes: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar kits de serviço
  const { data: kits = [], isLoading } = useQuery({
    queryKey: ['/api/parts-services-complete/service-kits'],
    queryFn: () => apiRequest('GET', '/api/parts-services-complete/service-kits'),
    enabled: isOpen,
  });

  // Buscar detalhes do kit selecionado
  const { data: kitDetails, isLoading: isLoadingKit } = useQuery({
    queryKey: ['/api/parts-services-complete/service-kits', selectedKit?.id],
    queryFn: () => apiRequest('GET', `/api/parts-services-complete/service-kits/${selectedKit?.id}`),
    enabled: isOpen && !!selectedKit?.id,
  });

  // Buscar itens para adicionar ao kit
  const { data: items = [] } = useQuery({
    queryKey: ['/api/parts-services-complete/items'],
    queryFn: () => apiRequest('GET', '/api/parts-services-complete/items'),
    enabled: isOpen && isAddingItem,
  });

  // Mutation para criar kit
  const createKitMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', '/api/parts-services-complete/service-kits', data),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Kit de serviço criado com sucesso!',
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/parts-services-complete/service-kits'] 
      });
      setNewKit({
        name: '',
        description: '',
        estimatedCost: '',
        estimatedDuration: '',
        category: '',
      });
      setIsCreating(false);
    },
    onError: (error) => {
      console.error('Error creating service kit:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar kit de serviço',
        variant: 'destructive',
      });
    },
  });

  // Mutation para adicionar item ao kit
  const addItemMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', `/api/parts-services-complete/service-kits/${selectedKit?.id}/items`, data),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Item adicionado ao kit com sucesso!',
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/parts-services-complete/service-kits', selectedKit?.id] 
      });
      setNewKitItem({
        itemId: '',
        quantity: '1',
        isOptional: false,
        notes: '',
      });
      setIsAddingItem(false);
    },
    onError: (error) => {
      console.error('Error adding item to kit:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar item ao kit',
        variant: 'destructive',
      });
    },
  });

  const handleCreateKit = () => {
    if (!newKit.name) {
      toast({
        title: 'Erro',
        description: 'Nome do kit é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    createKitMutation.mutate(newKit);
  };

  const handleAddItem = () => {
    if (!newKitItem.itemId || !newKitItem.quantity) {
      toast({
        title: 'Erro',
        description: 'Item e quantidade são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    addItemMutation.mutate({
      itemId: newKitItem.itemId,
      quantity: parseFloat(newKitItem.quantity),
      isOptional: newKitItem.isOptional,
      notes: newKitItem.notes,
    });
  };

  const calculateKitTotalCost = (kitItems: ServiceKitItem[]) => {
    return kitItems?.reduce((total, item) => {
      const itemCost = parseFloat(item.item.unitCost || '0');
      const quantity = parseFloat(item.quantity);
      return total + (itemCost * quantity);
    }, 0) || 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wrench className="h-5 w-5" />
            <span>Kits de Serviço</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!selectedKit ? (
            <>
              {/* Create Kit Section */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Novo Kit de Serviço</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreating(!isCreating)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isCreating ? 'Cancelar' : 'Novo Kit'}
                  </Button>
                </div>

                {isCreating && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="kit-name">Nome do Kit *</Label>
                        <Input
                          id="kit-name"
                          placeholder="Ex: Kit Manutenção Preventiva"
                          value={newKit.name}
                          onChange={(e) => setNewKit(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="kit-category">Categoria</Label>
                        <Select value={newKit.category} onValueChange={(value) => 
                          setNewKit(prev => ({ ...prev, category: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="maintenance">Manutenção</SelectItem>
                            <SelectItem value="installation">Instalação</SelectItem>
                            <SelectItem value="repair">Reparo</SelectItem>
                            <SelectItem value="calibration">Calibração</SelectItem>
                            <SelectItem value="inspection">Inspeção</SelectItem>
                            <SelectItem value="emergency">Emergência</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="estimated-cost">Custo Estimado (R$)</Label>
                        <Input
                          id="estimated-cost"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newKit.estimatedCost}
                          onChange={(e) => setNewKit(prev => ({ ...prev, estimatedCost: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="estimated-duration">Duração Estimada (horas)</Label>
                        <Input
                          id="estimated-duration"
                          type="number"
                          min="0"
                          step="0.5"
                          value={newKit.estimatedDuration}
                          onChange={(e) => setNewKit(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="kit-description">Descrição</Label>
                      <Textarea
                        id="kit-description"
                        placeholder="Descreva o kit de serviço e sua aplicação..."
                        value={newKit.description}
                        onChange={(e) => setNewKit(prev => ({ ...prev, description: e.target.value }))}
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
                        onClick={handleCreateKit}
                        disabled={createKitMutation.isPending}
                      >
                        {createKitMutation.isPending ? 'Criando...' : 'Criar Kit'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Kits List */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Kits Disponíveis ({kits?.kits?.length || 0})
                </h3>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Carregando kits...</p>
                  </div>
                ) : kits?.kits?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Wrench className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2">Nenhum kit de serviço encontrado</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {kits?.kits?.map((kit: ServiceKit) => (
                      <div
                        key={kit.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <Wrench className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="font-medium">{kit.name}</p>
                            <p className="text-sm text-gray-500">
                              {kit.category && `${kit.category} • `}
                              {kit.estimatedCost && `R$ ${parseFloat(kit.estimatedCost).toFixed(2)} • `}
                              {kit.estimatedDuration && `${kit.estimatedDuration}h`}
                            </p>
                            {kit.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {kit.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedKit(kit);
                              setIsViewingKit(true);
                            }}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Visualizar</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedKit(kit);
                              setIsViewingKit(false);
                            }}
                            className="flex items-center space-x-1"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Gerenciar</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Kit Details */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{selectedKit.name}</h3>
                  <p className="text-sm text-gray-500">
                    Gerenciamento de itens do kit
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedKit(null);
                    setIsViewingKit(false);
                    setIsAddingItem(false);
                  }}
                >
                  Voltar
                </Button>
              </div>

              {!isViewingKit && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Adicionar Item ao Kit</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingItem(!isAddingItem)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isAddingItem ? 'Cancelar' : 'Adicionar Item'}
                    </Button>
                  </div>

                  {isAddingItem && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="item-select">Item *</Label>
                          <Select value={newKitItem.itemId} onValueChange={(value) => 
                            setNewKitItem(prev => ({ ...prev, itemId: value }))
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

                        <div>
                          <Label htmlFor="item-quantity">Quantidade *</Label>
                          <Input
                            id="item-quantity"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={newKitItem.quantity}
                            onChange={(e) => setNewKitItem(prev => ({ ...prev, quantity: e.target.value }))}
                          />
                        </div>

                        <div className="flex items-center space-x-2 mt-6">
                          <Checkbox
                            id="is-optional"
                            checked={newKitItem.isOptional}
                            onCheckedChange={(checked) => 
                              setNewKitItem(prev => ({ ...prev, isOptional: checked as boolean }))
                            }
                          />
                          <Label htmlFor="is-optional">Item Opcional</Label>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="item-notes">Observações</Label>
                        <Textarea
                          id="item-notes"
                          placeholder="Instruções específicas para este item..."
                          value={newKitItem.notes}
                          onChange={(e) => setNewKitItem(prev => ({ ...prev, notes: e.target.value }))}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsAddingItem(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleAddItem}
                          disabled={addItemMutation.isPending}
                        >
                          {addItemMutation.isPending ? 'Adicionando...' : 'Adicionar Item'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Kit Items */}
              <div className="space-y-4">
                <h4 className="font-medium">
                  Itens do Kit ({kitDetails?.items?.length || 0})
                  {kitDetails?.items && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      • Custo Total: R$ {calculateKitTotalCost(kitDetails.items).toFixed(2)}
                    </span>
                  )}
                </h4>

                {isLoadingKit ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Carregando itens...</p>
                  </div>
                ) : kitDetails?.items?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2">Nenhum item no kit</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {kitDetails?.items?.map((kitItem: ServiceKitItem) => (
                      <div
                        key={kitItem.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <Package className="h-6 w-6 text-gray-400" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{kitItem.item.name}</p>
                              {kitItem.isOptional && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  Opcional
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {kitItem.item.code} • Qtd: {kitItem.quantity} {kitItem.item.unitOfMeasure}
                              {kitItem.item.unitCost && ` • R$ ${(parseFloat(kitItem.item.unitCost) * parseFloat(kitItem.quantity)).toFixed(2)}`}
                            </p>
                            {kitItem.notes && (
                              <p className="text-sm text-gray-600 mt-1 italic">
                                "{kitItem.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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