import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link, Plus, Trash2, Search, Package } from 'lucide-react';

interface ItemLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
}

interface ItemLink {
  id: string;
  type: string;
  quantity: string;
  direction: 'parent' | 'child';
  linkedItem: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
}

interface Item {
  id: string;
  name: string;
  code: string;
  type: string;
}

export function ItemLinksModal({ isOpen, onClose, itemId, itemName }: ItemLinksModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newLink, setNewLink] = useState({
    childItemId: '',
    linkType: 'related',
    quantity: '1',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar links do item
  const { data: links = [], isLoading } = useQuery({
    queryKey: ['/api/parts-services-complete/items', itemId, 'links'],
    queryFn: () => apiRequest('GET', `/api/parts-services-complete/items/${itemId}/links`),
    enabled: isOpen && !!itemId,
  });

  // Buscar todos os itens para seleção
  const { data: allItems = [] } = useQuery({
    queryKey: ['/api/parts-services-complete/items'],
    queryFn: () => apiRequest('GET', '/api/parts-services-complete/items'),
    enabled: isOpen,
  });

  // Mutation para criar link
  const createMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', `/api/parts-services-complete/items/${itemId}/links`, data),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Vínculo criado com sucesso!',
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/parts-services-complete/items', itemId, 'links'] 
      });
      setNewLink({ childItemId: '', linkType: 'related', quantity: '1' });
      setIsCreating(false);
    },
    onError: (error) => {
      console.error('Error creating link:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar vínculo',
        variant: 'destructive',
      });
    },
  });

  // Mutation para deletar link
  const deleteMutation = useMutation({
    mutationFn: (linkId: string) => 
      apiRequest('DELETE', `/api/parts-services-complete/item-links/${linkId}`),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Vínculo removido com sucesso!',
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/parts-services-complete/items', itemId, 'links'] 
      });
    },
    onError: (error) => {
      console.error('Error deleting link:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover vínculo',
        variant: 'destructive',
      });
    },
  });

  const handleCreateLink = () => {
    if (!newLink.childItemId) {
      toast({
        title: 'Erro',
        description: 'Selecione um item para vincular',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(newLink);
  };

  const handleDeleteLink = (linkId: string) => {
    if (window.confirm('Tem certeza que deseja remover este vínculo?')) {
      deleteMutation.mutate(linkId);
    }
  };

  const filteredItems = allItems?.items?.filter((item: Item) => 
    item.id !== itemId && // Não mostrar o próprio item
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.code?.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const getLinkTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'related': 'Relacionado',
      'component': 'Componente',
      'accessory': 'Acessório',
      'alternative': 'Alternativo',
      'substitute': 'Substituto',
      'kit': 'Kit',
    };
    return types[type] || type;
  };

  const getLinkTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'related': 'bg-blue-100 text-blue-800',
      'component': 'bg-green-100 text-green-800',
      'accessory': 'bg-purple-100 text-purple-800',
      'alternative': 'bg-yellow-100 text-yellow-800',
      'substitute': 'bg-orange-100 text-orange-800',
      'kit': 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getDirectionLabel = (direction: string) => {
    return direction === 'parent' ? 'Contém' : 'Parte de';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5" />
            <span>Vínculos do Item: {itemName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Link Section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Criar Novo Vínculo</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(!isCreating)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isCreating ? 'Cancelar' : 'Novo Vínculo'}
              </Button>
            </div>

            {isCreating && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="search-item">Buscar Item</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search-item"
                        placeholder="Digite nome ou código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="link-type">Tipo de Vínculo</Label>
                    <Select value={newLink.linkType} onValueChange={(value) => 
                      setNewLink(prev => ({ ...prev, linkType: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="related">Relacionado</SelectItem>
                        <SelectItem value="component">Componente</SelectItem>
                        <SelectItem value="accessory">Acessório</SelectItem>
                        <SelectItem value="alternative">Alternativo</SelectItem>
                        <SelectItem value="substitute">Substituto</SelectItem>
                        <SelectItem value="kit">Kit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={newLink.quantity}
                      onChange={(e) => setNewLink(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Items Selection */}
                {searchTerm && (
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    {filteredItems.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Nenhum item encontrado
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredItems.map((item: Item) => (
                          <div
                            key={item.id}
                            className={`p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                              newLink.childItemId === item.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => setNewLink(prev => ({ ...prev, childItemId: item.id }))}
                          >
                            <div className="flex items-center space-x-3">
                              <Package className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-gray-500">
                                  {item.code} • {item.type}
                                </p>
                              </div>
                            </div>
                            {newLink.childItemId === item.id && (
                              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateLink}
                    disabled={createMutation.isPending || !newLink.childItemId}
                  >
                    {createMutation.isPending ? 'Criando...' : 'Criar Vínculo'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Links List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Vínculos Existentes ({links?.links?.length || 0})
            </h3>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Carregando vínculos...</p>
              </div>
            ) : links?.links?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Link className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">Nenhum vínculo encontrado</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {links?.links?.map((link: ItemLink) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <Package className="h-8 w-8 text-gray-400" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{link.linkedItem.name}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLinkTypeColor(link.type)}`}>
                            {getLinkTypeLabel(link.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {link.linkedItem.code} • {link.linkedItem.type} • 
                          Qtd: {link.quantity} • {getDirectionLabel(link.direction)}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLink(link.id)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remover</span>
                    </Button>
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