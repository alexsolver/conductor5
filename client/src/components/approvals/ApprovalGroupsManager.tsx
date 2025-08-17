/**
 * ApprovalGroupsManager - Gerenciador de grupos de aprovação
 * Permite criar e configurar grupos para agentes, clientes e beneficiários
 * Seguindo padrões 1qa.md
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Edit, Trash2, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface ApprovalGroup {
  id: string;
  name: string;
  description?: string;
  groupType: 'agents' | 'clients' | 'beneficiaries' | 'mixed';
  isActive: boolean;
  members?: ApprovalGroupMember[];
  createdAt: string;
}

interface ApprovalGroupMember {
  id: string;
  memberType: 'user' | 'customer' | 'beneficiary';
  memberId: string;
  memberName?: string;
  memberEmail?: string;
  role: string;
}

const groupTypeLabels = {
  agents: 'Agentes',
  clients: 'Clientes',
  beneficiaries: 'Beneficiários',
  mixed: 'Misto'
};

const groupTypeBadgeVariants = {
  agents: 'default',
  clients: 'secondary',
  beneficiaries: 'outline',
  mixed: 'destructive'
} as const;

export function ApprovalGroupsManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ApprovalGroup | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    groupType: 'agents' as 'agents' | 'clients' | 'beneficiaries' | 'mixed'
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch approval groups
  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['/api/approvals/groups'],
    queryFn: async () => {
      const response = await fetch('/api/approvals/groups');
      if (!response.ok) throw new Error('Falha ao carregar grupos');
      return response.json();
    }
  });

  const groups = groupsData?.data || [];

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: typeof createForm) => {
      const response = await fetch('/api/approvals/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao criar grupo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/approvals/groups'] });
      setIsCreateDialogOpen(false);
      setCreateForm({ name: '', description: '', groupType: 'agents' });
      toast({
        title: "Sucesso",
        description: "Grupo de aprovação criado com sucesso"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await fetch(`/api/approvals/groups/${groupId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Falha ao excluir grupo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/approvals/groups'] });
      toast({
        title: "Sucesso",
        description: "Grupo excluído com sucesso"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCreateGroup = () => {
    if (!createForm.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório",
        variant: "destructive"
      });
      return;
    }

    createGroupMutation.mutate(createForm);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita.')) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando grupos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Grupos de Aprovação
          </h3>
          <p className="text-sm text-gray-600">
            Configure grupos de aprovadores para diferentes tipos de workflows
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Grupo de Aprovação</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="group-name">Nome do Grupo *</Label>
                <Input
                  id="group-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Supervisores Financeiros"
                />
              </div>
              
              <div>
                <Label htmlFor="group-description">Descrição</Label>
                <Textarea
                  id="group-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o propósito deste grupo..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="group-type">Tipo do Grupo *</Label>
                <Select
                  value={createForm.groupType}
                  onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, groupType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agents">Agentes (Usuários Internos)</SelectItem>
                    <SelectItem value="clients">Clientes</SelectItem>
                    <SelectItem value="beneficiaries">Beneficiários</SelectItem>
                    <SelectItem value="mixed">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateGroup}
                  disabled={createGroupMutation.isPending}
                >
                  {createGroupMutation.isPending ? 'Criando...' : 'Criar Grupo'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum grupo configurado
            </h3>
            <p className="text-gray-600 mb-4">
              Crie grupos de aprovadores para organizar seus workflows
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Grupo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {groups.map((group: ApprovalGroup) => (
            <Card key={group.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  {group.description && (
                    <CardDescription>{group.description}</CardDescription>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={groupTypeBadgeVariants[group.groupType]}>
                    {groupTypeLabels[group.groupType]}
                  </Badge>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedGroup(group);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                      disabled={deleteGroupMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {group.members?.length || 0} membros
                  </span>
                  {' • '}
                  <span>
                    Criado em {new Date(group.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {group.members && group.members.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.members.slice(0, 3).map((member) => (
                      <Badge key={member.id} variant="secondary" className="text-xs">
                        {member.memberName || 'Usuário'}
                      </Badge>
                    ))}
                    {group.members.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{group.members.length - 3} mais
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}