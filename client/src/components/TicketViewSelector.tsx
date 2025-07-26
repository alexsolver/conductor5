import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Settings, 
  Plus, 
  Eye, 
  Users, 
  Lock, 
  Star,
  Edit,
  Trash2,
  ChevronDown
} from 'lucide-react';

// Schema para criação de visualização
const createViewSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  columns: z.array(z.object({
    id: z.string(),
    label: z.string(),
    visible: z.boolean(),
    order: z.number(),
    width: z.number().optional(),
  })),
  pageSize: z.number().min(5).max(100).default(25),
});

type CreateViewFormData = z.infer<typeof createViewSchema>;

interface TicketViewSelectorProps {
  currentViewId?: string;
  onViewChange: (viewId: string) => void;
  userRole: string;
}

export function TicketViewSelector({ currentViewId, onViewChange, userRole }: TicketViewSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar visualizações disponíveis
  const { data: viewsData, isLoading } = useQuery({
    queryKey: ['/api/ticket-views'],
    retry: false,
  });

  const views = viewsData?.data || [];

  // Buscar preferências do usuário
  const { data: preferencesData } = useQuery({
    queryKey: ['/api/ticket-views/user/preferences'],
    retry: false,
  });

  const userPreferences = preferencesData?.data;

  // Form para criar/editar visualização
  const form = useForm<CreateViewFormData>({
    resolver: zodResolver(createViewSchema),
    defaultValues: {
      name: '',
      description: '',
      isPublic: false,
      isDefault: false,
      columns: [
        { id: 'ticketNumber', label: 'Número', visible: true, order: 1, width: 120 },
        { id: 'subject', label: 'Assunto', visible: true, order: 2, width: 300 },
        { id: 'status', label: 'Status', visible: true, order: 3, width: 120 },
        { id: 'priority', label: 'Prioridade', visible: true, order: 4, width: 120 },
        { id: 'assignedToName', label: 'Atribuído', visible: true, order: 5, width: 150 },
        { id: 'customerName', label: 'Cliente', visible: true, order: 6, width: 150 },
        { id: 'createdAt', label: 'Criado em', visible: true, order: 7, width: 150 },
        { id: 'category', label: 'Categoria', visible: false, order: 8, width: 120 },
        { id: 'tags', label: 'Tags', visible: false, order: 9, width: 200 },
        { id: 'updatedAt', label: 'Atualizado', visible: false, order: 10, width: 150 }
      ],
      pageSize: 25,
    },
  });

  // Mutation para criar visualização
  const createViewMutation = useMutation({
    mutationFn: (data: CreateViewFormData) => 
      apiRequest('/api/ticket-views', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: (result) => {
      toast({
        title: 'Sucesso',
        description: 'Visualização criada com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-views'] });
      setIsCreateDialogOpen(false);
      form.reset();
      
      // Definir como visualização ativa
      if (result.data) {
        setActiveViewMutation.mutate(result.data.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar visualização',
        variant: 'destructive',
      });
    },
  });

  // Mutation para definir visualização ativa
  const setActiveViewMutation = useMutation({
    mutationFn: (viewId: string) => 
      apiRequest(`/api/ticket-views/${viewId}/set-active`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-views/user/preferences'] });
    },
  });

  // Mutation para deletar visualização
  const deleteViewMutation = useMutation({
    mutationFn: (viewId: string) => 
      apiRequest(`/api/ticket-views/${viewId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Visualização removida com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-views'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover visualização',
        variant: 'destructive',
      });
    },
  });

  const handleViewChange = (viewId: string) => {
    setActiveViewMutation.mutate(viewId);
    onViewChange(viewId);
  };

  const handleDeleteView = (viewId: string, viewName: string) => {
    if (confirm(`Tem certeza que deseja remover a visualização "${viewName}"?`)) {
      deleteViewMutation.mutate(viewId);
    }
  };

  const onSubmit = (data: CreateViewFormData) => {
    createViewMutation.mutate(data);
  };

  const activeView = userPreferences?.activeViewId 
    ? views.find((v: any) => v.id === userPreferences.activeViewId)
    : views.find((v: any) => v.isDefault) || views[0];

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse h-8 w-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Seletor de Visualização */}
      <Select 
        value={currentViewId || activeView?.id || ''} 
        onValueChange={handleViewChange}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Selecione uma visualização">
            {activeView && (
              <div className="flex items-center space-x-2">
                {activeView.isPublic ? (
                  <Users className="h-4 w-4 text-blue-500" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-500" />
                )}
                <span>{activeView.name}</span>
                {activeView.isDefault && (
                  <Star className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {views.map((view: any) => (
            <SelectItem key={view.id} value={view.id}>
              <div className="flex items-center space-x-2">
                {view.isPublic ? (
                  <Users className="h-4 w-4 text-blue-500" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-500" />
                )}
                <span>{view.name}</span>
                {view.isDefault && (
                  <Star className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Botão Nova Visualização */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Vista
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova Visualização</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Visualização *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Meus Tickets" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pageSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Itens por Página</FormLabel>
                      <FormControl>
                        <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição opcional da visualização" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {userRole === 'tenant_admin' && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Pública</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Visível para todos os usuários do tenant
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Padrão</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Visualização padrão para novos usuários
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createViewMutation.isPending}
                >
                  {createViewMutation.isPending ? 'Criando...' : 'Criar Visualização'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Botão Gerenciar Visualizações */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Visualizações</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {views.map((view: any) => (
              <Card key={view.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {view.isPublic ? (
                        <Users className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Lock className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <CardTitle className="text-base flex items-center space-x-2">
                          <span>{view.name}</span>
                          {view.isDefault && (
                            <Star className="h-4 w-4 text-yellow-500" />
                          )}
                        </CardTitle>
                        {view.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {view.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={view.isPublic ? 'default' : 'secondary'}>
                        {view.isPublic ? 'Pública' : 'Privada'}
                      </Badge>
                      {view.isDefault && (
                        <Badge variant="outline">Padrão</Badge>
                      )}
                      
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteView(view.id, view.name)}
                          disabled={deleteViewMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="text-sm text-muted-foreground">
                    Criado por: {view.createdByName || 'Sistema'} • 
                    Páginas: {view.pageSize} itens • 
                    Colunas visíveis: {view.columns?.filter((c: any) => c.visible).length || 0}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {views.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma visualização encontrada
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}