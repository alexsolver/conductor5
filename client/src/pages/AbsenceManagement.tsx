
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Calendar, Clock, User, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// import useLocalization from '@/hooks/useLocalization';

const absenceFormSchema = z.object({
  // Localization temporarily disabled

  userId: z.string().min(1, 'Usuário é obrigatório'),
  absenceType: z.enum(['vacation', 'sick_leave', 'maternity', 'paternity', 'bereavement', 'personal', 'justified_absence', 'unjustified_absence']),
  startDate: z.string().min(1, 'Data inicial é obrigatória'),
  endDate: z.string().min(1, 'Data final é obrigatória'),
  reason: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres'),
  medicalCertificate: z.string().optional(),
  coverUserId: z.string().optional(),
});

type AbsenceFormData = z.infer<typeof absenceFormSchema>;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AbsenceRequest {
  id: string;
  userId: string;
  absenceType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  medicalCertificate?: string;
  coverUserId?: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
}

const absenceTypeLabels = {
  vacation: 'Férias',
  sick_leave: 'Atestado Médico',
  maternity: 'Licença Maternidade',
  paternity: 'Licença Paternidade', 
  bereavement: 'Luto',
  personal: 'Licença Pessoal',
  justified_absence: 'Falta Justificada',
  unjustified_absence: 'Falta Injustificada'
};

const statusLabels = {
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  cancelled: '[TRANSLATION_NEEDED]'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

export default function AbsenceManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AbsenceFormData>({
    resolver: zodResolver(absenceFormSchema),
    defaultValues: {
      userId: '',
      absenceType: 'vacation',
      startDate: '',
      endDate: '',
      reason: '',
      medicalCertificate: '',
      coverUserId: '',
    },
  });

  // Buscar solicitações pendentes
  const { data: pendingRequestsData, isLoading } = useQuery({
    queryKey: ['/api/timecard/absence-requests/pending'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/absence-requests/pending');
      return response;
    },
  });

  // Buscar usuários
  const { data: usersData } = useQuery({
    queryKey: ['/api/tenant-admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tenant-admin/users');
      return response;
    },
  });

  // Criar solicitação de ausência
  const createAbsenceRequestMutation = useMutation({
    mutationFn: async (data: AbsenceFormData) => {
      return await apiRequest('POST', '/api/timecard/absence-requests', data);
    },
    onSuccess: () => {
      toast({
        title: 'Solicitação de Ausência Criada',
        description: 'A solicitação foi enviada para aprovação.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/absence-requests/pending'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || '[TRANSLATION_NEEDED]',
        variant: 'destructive',
      });
    },
  });

  // Aprovar solicitação
  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest('PUT', "/approve`);
    },
    onSuccess: () => {
      toast({
        title: 'Solicitação Aprovada',
        description: 'A solicitação de ausência foi aprovada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/absence-requests/pending'] });
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || '[TRANSLATION_NEEDED]',
        variant: 'destructive',
      });
    },
  });

  // Rejeitar solicitação
  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      return await apiRequest('PUT', "/reject`, { reason });
    },
    onSuccess: () => {
      toast({
        title: 'Solicitação Rejeitada',
        description: 'A solicitação de ausência foi rejeitada.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/absence-requests/pending'] });
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || '[TRANSLATION_NEEDED]',
        variant: 'destructive',
      });
    },
  });

  const pendingRequests = (pendingRequestsData as any)?.requests || [];
  const users = (usersData as any)?.users || [];

  const handleSubmit = (data: AbsenceFormData) => {
    createAbsenceRequestMutation.mutate(data);
  };

  const handleApprove = (requestId: string) => {
    if (confirm('Tem certeza que deseja aprovar esta solicitação?')) {
      approveRequestMutation.mutate(requestId);
    }
  };

  const handleReject = (requestId: string) => {
    const reason = prompt('Motivo da rejeição:');
    if (reason && reason.trim()) {
      rejectRequestMutation.mutate({ requestId, reason: reason.trim() });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando solicitações de ausência...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Ausências</h1>
          <p className="text-gray-600">Gerencie solicitações de férias, licenças e faltas</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Solicitação de Ausência</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar uma nova solicitação de ausência
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funcionário</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user: User) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
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
                    name="absenceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Ausência</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(absenceTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Inicial</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Final</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva o motivo da ausência..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medicalCertificate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atestado Médico (URL)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://exemplo.com/atestado.pdf"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Substituto (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum substituto</SelectItem>
                          {users.map((user: User) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createAbsenceRequestMutation.isPending}>
                    {createAbsenceRequestMutation.isPending ? 'Criando...' : '[TRANSLATION_NEEDED]'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Solicitações Pendentes de Aprovação
            </CardTitle>
            <CardDescription>
              {pendingRequests.length} solicitação(ões) aguardando aprovação
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma solicitação pendente
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request: AbsenceRequest) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <h3 className="font-medium">{request.userName || 'Usuário'}</h3>
                          <p className="text-sm text-gray-600">
                            {absenceTypeLabels[request.absenceType as keyof typeof absenceTypeLabels]}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                        {statusLabels[request.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {formatDate(request.startDate)} a {formatDate(request.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {calculateDays(request.startDate, request.endDate)} dia(s)
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                        <p className="text-sm text-gray-700">{request.reason}</p>
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(request.id)}
                          disabled={rejectRequestMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={approveRequestMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
