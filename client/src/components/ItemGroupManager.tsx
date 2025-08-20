
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/utils';
import { 
// import { useLocalization } from '@/hooks/useLocalization';
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { Checkbox } from './ui/checkbox';
import { 
  Folder, 
  Plus, 
  Users, 
  Layers,
  FolderOpen
} from 'lucide-react';

interface Item {
  id: string;
  name: string;
  type: string;
  hasChildren?: boolean;
  childrenCount?: number;
}

interface ItemGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  item_count: number;
}

interface ItemGroupManagerProps {
  selectedItems: Item[];
  onItemsUpdated: () => void;
}

export const ItemGroupManager: React.FC<ItemGroupManagerProps> = ({
  // Localization temporarily disabled

  selectedItems,
  onItemsUpdated
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAssignGroupOpen, setIsAssignGroupOpen] = useState(false);
  const [isCreateHierarchyOpen, setIsCreateHierarchyOpen] = useState(false);
  const [selectedParentItem, setSelectedParentItem] = useState<Item | null>(null);
  const [selectedChildItems, setSelectedChildItems] = useState<string[]>([]);
  
  // Form states
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupColor, setGroupColor] = useState('#3B82F6');

  // Query for item groups
  const { data: itemGroups } = useQuery({
    queryKey: ['/api/materials-services/item-groups'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/materials-services/item-groups');
      return response.json();
    }
  });

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      const response = await apiRequest('POST', '/api/materials-services/item-groups', groupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/item-groups'] });
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "O novo grupo foi criado e está disponível para uso.",
      });
      setIsCreateGroupOpen(false);
      setGroupName('');
      setGroupDescription('');
      setGroupColor('#3B82F6');
    },
    onError: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Ocorreu um erro ao criar o grupo. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const assignToGroupMutation = useMutation({
    mutationFn: async ({ groupId, itemIds }: { groupId: string, itemIds: string[] }) => {
      const response = await apiRequest('POST', `/api/materials-services/item-groups/${groupId}/assign-items`, {
        itemIds
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/item-groups'] });
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Os itens foram atribuídos ao grupo selecionado.",
      });
      setIsAssignGroupOpen(false);
      onItemsUpdated();
    },
    onError: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Ocorreu um erro ao atribuir os itens ao grupo.",
        variant: "destructive",
      });
    }
  });

  const createHierarchyMutation = useMutation({
    mutationFn: async ({ parentItemId, childItemIds }: { parentItemId: string, childItemIds: string[] }) => {
      const response = await apiRequest('POST', '/api/materials-services/item-hierarchy', {
        parentItemId,
        childItemIds
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "A relação pai/filho foi estabelecida entre os itens.",
      });
      setIsCreateHierarchyOpen(false);
      setSelectedParentItem(null);
      setSelectedChildItems([]);
      onItemsUpdated();
    },
    onError: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Ocorreu um erro ao estabelecer a relação pai/filho.",
        variant: "destructive",
      });
    }
  });

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;
    
    createGroupMutation.mutate({
      name: groupName,
      description: groupDescription,
      color: groupColor,
      icon: 'folder'
    });
  };

  const handleAssignToGroup = (groupId: string) => {
    const itemIds = selectedItems.map(item => item.id);
    assignToGroupMutation.mutate({ groupId, itemIds });
  };

  const handleCreateHierarchy = () => {
    if (!selectedParentItem || selectedChildItems.length === 0) return;
    
    createHierarchyMutation.mutate({
      parentItemId: selectedParentItem.id,
      childItemIds: selectedChildItems
    });
  };

  const availableChildItems = selectedItems.filter(item => 
    item.id !== selectedParentItem?.id && !selectedChildItems.includes(item.id)
  );

  return (
    <div className="flex gap-2">
      {/* Create Group Dialog */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            Criar Grupo
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Grupo</DialogTitle>
            <DialogDescription>
              Crie um grupo para organizar seus itens por categoria, tipo ou função.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nome do Grupo</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex: Ferramentas Elétricas"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Descrição</label>
              <Textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Descrição opcional do grupo"
                rows={3}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Cor</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={groupColor}
                  onChange={(e) => setGroupColor(e.target.value)}
                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600">{groupColor}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateGroup} disabled={!groupName.trim()}>
              Criar Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to Group Dialog */}
      {selectedItems.length > 0 && (
        <Dialog open={isAssignGroupOpen} onOpenChange={setIsAssignGroupOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Atribuir ao Grupo ({selectedItems.length})
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atribuir Itens ao Grupo</DialogTitle>
              <DialogDescription>
                Selecione um grupo para atribuir os {selectedItems.length} itens selecionados.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {itemGroups?.data?.map((group: ItemGroup) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAssignToGroup(group.id)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <div>
                      <div className="font-medium">{group.name}</div>
                      {group.description && (
                        <div className="text-xs text-gray-500">{group.description}</div>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {group.item_count} itens
                  </Badge>
                </div>
              ))}
              
              {!itemGroups?.data?.length && (
                <div className="text-center py-6 text-gray-500">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Nenhum grupo encontrado. Crie um grupo primeiro.
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignGroupOpen(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Hierarchy Dialog */}
      {selectedItems.length >= 2 && (
        <Dialog open={isCreateHierarchyOpen} onOpenChange={setIsCreateHierarchyOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Criar Hierarquia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Hierarquia Pai/Filho</DialogTitle>
              <DialogDescription>
                Estabeleça uma relação hierárquica onde um item pai pode ter múltiplos itens filhos.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Selecione o Item Pai (Kit/Conjunto)
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                        selectedParentItem?.id === item.id
                          ? 'bg-blue-100 border border-blue-300'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedParentItem(item)}
                    >
                      <input
                        type="radio"
                        checked={selectedParentItem?.id === item.id}
                        readOnly
                        className="text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          {item.hasChildren && (
                            <span className="text-xs text-amber-600 font-semibold">
                              (Já possui {item.childrenCount} filhos)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedParentItem && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Selecione os Itens Filhos
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {availableChildItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={selectedChildItems.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedChildItems(prev => [...prev, item.id]);
                            } else {
                              setSelectedChildItems(prev => prev.filter(id => id !== item.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {selectedChildItems.length} itens selecionados como filhos
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateHierarchyOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateHierarchy}
                disabled={!selectedParentItem || selectedChildItems.length === 0}
              >
                Criar Hierarquia
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
