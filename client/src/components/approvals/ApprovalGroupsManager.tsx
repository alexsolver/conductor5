/**
 * ApprovalGroupsManager - Gerenciador de grupos de aprovação
 * Permite criar e configurar grupos para agentes, clientes e beneficiários
 * Seguindo padrões 1qa.md
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Edit, Trash2, UserPlus, X, Sparkles } from 'lucide-react';
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
import { apiRequest } from '@/lib/queryClient';

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

const groupTypeConfig = {
  agents: {
    label: 'Agentes',
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30'
  },
  clients: {
    label: 'Clientes',
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30'
  },
  beneficiaries: {
    label: 'Beneficiários',
    gradient: 'from-emerald-500 to-green-500',
    bgGradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30'
  },
  mixed: {
    label: 'Misto',
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30'
  }
};

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

  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['/api/approvals/groups'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/approvals/groups');
      return response.json();
    }
  });

  const groups = groupsData?.data || [];

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: typeof createForm) => {
      console.log('🔧 [CREATE-GROUP] Tentando criar grupo:', groupData);
      const response = await apiRequest('POST', '/api/approvals/groups', groupData);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [CREATE-GROUP] Erro na resposta:', errorText);
        throw new Error(errorText || 'Erro ao criar grupo');
      }
      
      const result = await response.json();
      console.log('✅ [CREATE-GROUP] Grupo criado com sucesso:', result);
      return result;
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

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      console.log('🗑️ [DELETE-GROUP] Tentando excluir grupo:', groupId);
      const response = await apiRequest('DELETE', `/api/approvals/groups/${groupId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [DELETE-GROUP] Erro na resposta:', errorText);
        throw new Error(errorText || 'Erro ao excluir grupo');
      }
      
      const result = await response.json();
      console.log('✅ [DELETE-GROUP] Grupo excluído:', result);
      return result;
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
    console.log('🔧 [HANDLE-CREATE-GROUP] Formulário atual:', createForm);
    if (!createForm.name.trim()) {
      console.log('❌ [HANDLE-CREATE-GROUP] Nome vazio');
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ [HANDLE-CREATE-GROUP] Iniciando criação do grupo');
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gradient-to-r from-purple-600 to-pink-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando grupos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Grupos de Aprovação
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure grupos de aprovadores para diferentes tipos de workflows
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="w-4 h-4" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Criar Grupo de Aprovação
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="group-name" className="text-gray-700 dark:text-gray-300">Nome do Grupo *</Label>
                <Input
                  id="group-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Aprovadores Financeiros"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="group-description" className="text-gray-700 dark:text-gray-300">Descrição</Label>
                <Textarea
                  id="group-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o propósito deste grupo..."
                  rows={3}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="group-type" className="text-gray-700 dark:text-gray-300">Tipo de Grupo *</Label>
                <Select
                  value={createForm.groupType}
                  onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, groupType: value }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCreateGroup}
                disabled={createGroupMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {createGroupMutation.isPending ? 'Criando...' : 'Criar Grupo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group: ApprovalGroup) => {
          const config = groupTypeConfig[group.groupType];
          
          return (
            <Card 
              key={group.id} 
              className={`border-none bg-gradient-to-br ${config.bgGradient} hover:shadow-lg transition-all duration-300 hover:scale-105`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient}`}>
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                        {group.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                        {group.description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`bg-gradient-to-r ${config.gradient} text-white border-none`}>
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Membros</span>
                    <Badge variant="outline">{group.members?.length || 0}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <Badge variant={group.isActive ? "default" : "secondary"}>
                      {group.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedGroup(group);
                        setIsEditDialogOpen(true);
                      }}
                      className="flex-1 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="flex-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {groups.length === 0 && (
        <Card className="border-none bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-12">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="font-medium text-lg">Nenhum grupo criado</p>
              <p className="text-sm mt-2">Crie seu primeiro grupo de aprovação para começar</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
