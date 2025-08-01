import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar,
  Hash,
  CreditCard,
  Building,
  Save,
  X
} from 'lucide-react';

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
}

export function EditMemberDialog({ open, onOpenChange, member }: EditMemberDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      cellPhone: '',
      role: '',
      cargo: '',
      cep: '',
      state: '',
      city: '',
      streetAddress: '',
      employeeCode: '',
      pis: '',
      admissionDate: '',
      groupIds: []
    }
  });

  // Fetch available groups
  const { data: groupsData } = useQuery({
    queryKey: ['/api/user-management/groups'],
    enabled: open,
  });

  // Fetch available roles
  const { data: rolesData } = useQuery({
    queryKey: ['/api/team-management/roles'],
    enabled: open,
  });

  // Reset form when member changes
  useEffect(() => {
    if (member && open) {
      console.log('EditMemberDialog - Setting form data for member:', member);

      const nameParts = member.name ? member.name.split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      form.reset({
        firstName,
        lastName,
        email: member.email || '',
        phone: member.phone || '',
        cellPhone: member.cellPhone || '',
        role: member.role || '',
        cargo: member.position || member.cargo || '',
        cep: member.cep || '',
        state: member.state || '',
        city: member.city || '',
        streetAddress: member.streetAddress || member.address || '',
        employeeCode: member.employeeCode || '',
        pis: member.pis || '',
        admissionDate: member.admissionDate ? new Date(member.admissionDate).toISOString().split('T')[0] : '',
        groupIds: member.groupIds || []
      });
    }
  }, [member, open, form]);

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('EditMemberDialog - Updating member with data:', data);
      const response = await apiRequest('PUT', `/api/team-management/members/${member.id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-management/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/team/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-management/stats'] });

      toast({
        title: "Membro atualizado",
        description: "Os dados do membro foram atualizados com sucesso.",
      });

      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('EditMemberDialog - Error updating member:', error);
      toast({
        title: "Erro ao atualizar",
        description: error?.message || "Falha ao atualizar os dados do membro.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: any) => {
    console.log('EditMemberDialog - Form submitted with data:', data);
    setIsSubmitting(true);

    try {
      await updateMemberMutation.mutateAsync(data);
    } catch (error) {
      console.error('EditMemberDialog - Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!member) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Editar Dados do Membro</span>
          </DialogTitle>
          <DialogDescription>
            Atualize as informações pessoais e profissionais do membro da equipe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Informações Pessoais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  {...form.register('firstName')}
                  placeholder="Digite o nome"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  {...form.register('lastName')}
                  placeholder="Digite o sobrenome"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    className="pl-10"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    {...form.register('phone')}
                    className="pl-10"
                    placeholder="(11) 1234-5678"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cellPhone">Celular</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="cellPhone"
                    {...form.register('cellPhone')}
                    className="pl-10"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Briefcase className="h-4 w-4" />
                <span>Informações Profissionais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Papel no Sistema</Label>
                <Select 
                  value={form.watch('role')} 
                  onValueChange={(value) => form.setValue('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agente</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="tenant_admin">Administrador</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    {Array.isArray(rolesData?.roles) && rolesData.roles.map((role: any) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cargo">Cargo/Posição</Label>
                <Input
                  id="cargo"
                  {...form.register('cargo')}
                  placeholder="Ex: Analista, Técnico, etc."
                />
              </div>
              <div>
                <Label htmlFor="employeeCode">Código do Funcionário</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="employeeCode"
                    {...form.register('employeeCode')}
                    className="pl-10"
                    placeholder="COD123"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="pis">PIS</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="pis"
                    {...form.register('pis')}
                    className="pl-10"
                    placeholder="000.00000.00-0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="admissionDate">Data de Admissão</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="admissionDate"
                    type="date"
                    {...form.register('admissionDate')}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Endereço</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  {...form.register('cep')}
                  placeholder="00000-000"
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  {...form.register('state')}
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  {...form.register('city')}
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <Label htmlFor="streetAddress">Endereço</Label>
                <Input
                  id="streetAddress"
                  {...form.register('streetAddress')}
                  placeholder="Rua das Flores, 123"
                />
              </div>
            </CardContent>
          </Card>

          {/* Groups */}
          {Array.isArray(groupsData?.groups) && groupsData.groups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>Grupos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label>Grupos Associados</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                  {groupsData.groups.map((group: any) => {
                    const isSelected = form.watch('groupIds')?.includes(group.id);
                    return (
                      <div
                        key={group.id}
                        className={`p-2 border rounded cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => {
                          const currentGroups = form.watch('groupIds') || [];
                          const newGroups = isSelected 
                            ? currentGroups.filter(id => id !== group.id)
                            : [...currentGroups, group.id];
                          form.setValue('groupIds', newGroups);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{group.name}</span>
                          {isSelected && (
                            <Badge variant="default" className="text-xs">
                              Selecionado
                            </Badge>
                          )}
                        </div>
                        {group.description && (
                          <p className="text-xs text-gray-500 mt-1">{group.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || updateMemberMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isSubmitting || updateMemberMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}