import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { useToast } from './use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Settings, 
  Shield, 
  ShieldCheck, 
  Building, 
  Users, 
  Crown,
  Eye,
  Edit,
  Trash2,
  Clock
} from 'lucide-react';

// Validation schema
const relationshipSchema = z.object({
  userId: z.string().min(1, 'Usuário é obrigatório'),
  tenantId: z.string().uuid('ID do tenant inválido'),
  role: z.enum(['agent', 'tenant_admin', 'customer']),
  isActive: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
});

type RelationshipFormData = z.infer<typeof relationshipSchema>;

interface UserTenantRelationship {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tenantId: string;
  tenantName: string;
  role: string;
  isActive: boolean;
  isPrimary: boolean;
  grantedBy: string;
  grantedByName: string;
  grantedAt: string;
  lastAccessed: string | null;
  notes: string | null;
  permissions: Record<string, any> | null;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
}

export default function UserTenantRelationships() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<UserTenantRelationship | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch relationships
  const { data: relationships = [], isLoading: isLoadingRelationships } = useQuery<UserTenantRelationship[]>({
    queryKey: ['/api/multi-tenant/relationships'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/multi-tenant/relationships');
      return response.json();
    },
  });

  // Fetch users for the dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/multi-tenant/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/multi-tenant/users');
      return response.json();
    },
  });

  // Fetch tenants for the dropdown
  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['/api/multi-tenant/tenants'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/multi-tenant/tenants');
      return response.json();
    },
  });

  const form = useForm<RelationshipFormData>({
    resolver: zodResolver(relationshipSchema),
    defaultValues: {
      userId: '',
      tenantId: '',
      role: 'agent',
      isActive: true,
      isPrimary: false,
      notes: '',
    },
  });

  // Create relationship mutation
  const createRelationshipMutation = useMutation({
    mutationFn: async (data: RelationshipFormData) => {
      const response = await apiRequest('POST', '/api/multi-tenant/relationships', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Relacionamento criado com sucesso!',
        description: 'O usuário foi adicionado ao tenant com o papel especificado.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/multi-tenant/relationships'] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar relacionamento',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    },
  });

  // Update relationship mutation
  const updateRelationshipMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RelationshipFormData> }) => {
      const response = await apiRequest('PUT', `/api/multi-tenant/relationships/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Relacionamento atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/multi-tenant/relationships'] });
      setIsEditDialogOpen(false);
      setSelectedRelationship(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar relacionamento',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    },
  });

  // Delete relationship mutation
  const deleteRelationshipMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/multi-tenant/relationships/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Relacionamento removido!',
        description: 'O acesso do usuário ao tenant foi removido.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/multi-tenant/relationships'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover relacionamento',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: RelationshipFormData) => {
    createRelationshipMutation.mutate(data);
  };

  const handleEdit = (relationship: UserTenantRelationship) => {
    setSelectedRelationship(relationship);
    form.setValue('userId', relationship.userId);
    form.setValue('tenantId', relationship.tenantId);
    form.setValue('role', relationship.role as any);
    form.setValue('isActive', relationship.isActive);
    form.setValue('isPrimary', relationship.isPrimary);
    form.setValue('notes', relationship.notes || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedRelationship) return;
    
    const formData = form.getValues();
    updateRelationshipMutation.mutate({
      id: selectedRelationship.id,
      data: formData,
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'tenant_admin':
        return <Badge variant="default"><Crown className="mr-1 h-3 w-3" />Admin do Tenant</Badge>;
      case 'agent':
        return <Badge variant="secondary"><Users className="mr-1 h-3 w-3" />Agente</Badge>;
      case 'customer':
        return <Badge variant="outline"><Users className="mr-1 h-3 w-3" />Cliente</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean, isPrimary: boolean) => {
    if (isPrimary) {
      return <Badge variant="default"><ShieldCheck className="mr-1 h-3 w-3" />Primário</Badge>;
    }
    return isActive ? 
      <Badge variant="secondary"><Shield className="mr-1 h-3 w-3" />Ativo</Badge> : 
      <Badge variant="outline">Inativo</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relacionamentos Multi-Tenant</h2>
          <p className="text-muted-foreground">
            Gerencie o acesso dos usuários a diferentes tenants
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Relacionamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Relacionamento Multi-Tenant</DialogTitle>
              <DialogDescription>
                Adicione um usuário a um tenant com um papel específico.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o usuário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.fullName} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tenantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tenant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.name} ({tenant.subdomain})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Papel</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o papel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="agent">Agente</SelectItem>
                          <SelectItem value="tenant_admin">Admin do Tenant</SelectItem>
                          <SelectItem value="customer">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativo</FormLabel>
                        <FormDescription>
                          O usuário pode acessar este tenant
                        </FormDescription>
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
                  name="isPrimary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Tenant Primário</FormLabel>
                        <FormDescription>
                          Este é o tenant principal do usuário
                        </FormDescription>
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Observações sobre este relacionamento..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createRelationshipMutation.isPending}
                  >
                    {createRelationshipMutation.isPending ? 'Criando...' : 'Criar Relacionamento'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relacionamentos Ativos</CardTitle>
          <CardDescription>
            Lista de todos os relacionamentos entre usuários e tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRelationships ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Carregando relacionamentos...</p>
            </div>
          ) : relationships.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Nenhum relacionamento encontrado</p>
              <p className="text-sm text-muted-foreground">
                Crie relacionamentos para permitir que usuários acessem diferentes tenants
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Concedido por</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relationships.map((relationship) => (
                  <TableRow key={relationship.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{relationship.userName}</div>
                        <div className="text-sm text-muted-foreground">{relationship.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{relationship.tenantName}</TableCell>
                    <TableCell>{getRoleBadge(relationship.role)}</TableCell>
                    <TableCell>{getStatusBadge(relationship.isActive, relationship.isPrimary)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(relationship.lastAccessed)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{relationship.grantedByName}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(relationship)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRelationshipMutation.mutate(relationship.id)}
                          disabled={deleteRelationshipMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Relacionamento</DialogTitle>
            <DialogDescription>
              Atualize as informações do relacionamento multi-tenant.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Papel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="agent">Agente</SelectItem>
                        <SelectItem value="tenant_admin">Admin do Tenant</SelectItem>
                        <SelectItem value="customer">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ativo</FormLabel>
                      <FormDescription>
                        O usuário pode acessar este tenant
                      </FormDescription>
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
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Tenant Primário</FormLabel>
                      <FormDescription>
                        Este é o tenant principal do usuário
                      </FormDescription>
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Input placeholder="Observações sobre este relacionamento..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateRelationshipMutation.isPending}
                >
                  {updateRelationshipMutation.isPending ? 'Atualizando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}