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
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { useToast } from './use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  Building 
} from 'lucide-react';

// Validation schema
const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['agent', 'tenant_admin', 'customer']),
  tenantId: z.string().uuid('ID do tenant inválido'),
  expiresInHours: z.number().min(1).max(168), // 1 hora a 7 dias
  message: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface Invitation {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  tenantName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: string;
  createdAt: string;
  inviterName: string;
  message?: string;
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
}

export default function MultiTenantInvitations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // Fetch invitations
  const { data: invitations = [], isLoading: isLoadingInvitations } = useQuery<Invitation[]>({
    queryKey: ['/api/multi-tenant/invitations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/multi-tenant/invitations');
      return response.json();
    },
  });

  // Fetch available tenants
  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['/api/multi-tenant/tenants'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/multi-tenant/tenants');
      return response.json();
    },
  });

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'agent',
      expiresInHours: 48,
      message: '',
    },
  });

  // Create invitation mutation
  const createInvitationMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      const response = await apiRequest('POST', '/api/multi-tenant/invite', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Convite enviado com sucesso!',
        description: 'O convite foi enviado para o email especificado.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/multi-tenant/invitations'] });
      setIsInviteDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar convite',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    },
  });

  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiRequest(`/api/multi-tenant/invitations/${invitationId}/resend`, {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Convite reenviado!',
        description: 'O convite foi reenviado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/multi-tenant/invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao reenviar convite',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiRequest(`/api/multi-tenant/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Convite cancelado!',
        description: 'O convite foi cancelado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/multi-tenant/invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cancelar convite',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InviteFormData) => {
    createInvitationMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pendente</Badge>;
      case 'accepted':
        return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Aceito</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejeitado</Badge>;
      case 'expired':
        return <Badge variant="outline"><AlertCircle className="mr-1 h-3 w-3" />Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'tenant_admin':
        return <Badge variant="default"><Building className="mr-1 h-3 w-3" />Admin do Tenant</Badge>;
      case 'agent':
        return <Badge variant="secondary"><Users className="mr-1 h-3 w-3" />Agente</Badge>;
      case 'customer':
        return <Badge variant="outline"><Users className="mr-1 h-3 w-3" />Cliente</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Convites Multi-Tenant</h2>
          <p className="text-muted-foreground">
            Gerencie convites para usuários acessarem diferentes tenants
          </p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Enviar Convite
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enviar Convite Multi-Tenant</DialogTitle>
              <DialogDescription>
                Convide um usuário para acessar um tenant específico com um papel definido.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="usuario@exemplo.com" 
                          type="email" 
                          {...field} 
                        />
                      </FormControl>
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
                  name="expiresInHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiração (horas)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="24">24 horas</SelectItem>
                          <SelectItem value="48">48 horas</SelectItem>
                          <SelectItem value="72">72 horas</SelectItem>
                          <SelectItem value="168">7 dias</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Mensagem personalizada para o convite..." 
                          className="resize-none"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Uma mensagem opcional para incluir no convite
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsInviteDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createInvitationMutation.isPending}
                  >
                    {createInvitationMutation.isPending ? 'Enviando...' : 'Enviar Convite'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Convites Enviados</CardTitle>
          <CardDescription>
            Lista de todos os convites enviados para acesso multi-tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInvitations ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Carregando convites...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Nenhum convite enviado</p>
              <p className="text-sm text-muted-foreground">
                Envie convites para usuários acessarem diferentes tenants
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Enviado por</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>{invitation.tenantName}</TableCell>
                    <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                    <TableCell className={isExpired(invitation.expiresAt) ? 'text-red-500' : ''}>
                      {formatDate(invitation.expiresAt)}
                    </TableCell>
                    <TableCell>{invitation.inviterName}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {invitation.status === 'pending' && !isExpired(invitation.expiresAt) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resendInvitationMutation.mutate(invitation.id)}
                            disabled={resendInvitationMutation.isPending}
                          >
                            Reenviar
                          </Button>
                        )}
                        {invitation.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                            disabled={cancelInvitationMutation.isPending}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}