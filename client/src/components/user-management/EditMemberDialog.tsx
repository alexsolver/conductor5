import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

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
  X,
  Users
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

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
  const { user } = useAuth();

  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // ✅ Verificar se usuário é tenant_admin para editar emails seguindo 1qa.md
  const canEditEmail = user?.role === 'tenant_admin' || user?.role === 'saas_admin';

  const form = useForm({
    defaultValues: {
      // Dados Básicos
      firstName: '',
      lastName: '',
      email: '',
      integrationCode: '',
      alternativeEmail: '',
      cellPhone: '',
      phone: '',
      ramal: '',
      timeZone: 'America/Sao_Paulo',
      vehicleType: 'nenhum',
      cpfCnpj: '',

      // Endereço
      cep: '',
      country: 'Brasil',
      state: '',
      city: '',
      streetAddress: '',
      houseType: '',
      houseNumber: '',
      complement: '',
      neighborhood: '',

      // Dados RH
      employeeCode: '',
      pis: '',
      cargo: '',
      ctps: '',
      serieNumber: '',
      admissionDate: '',
      costCenter: '',
      employmentType: 'clt',

      // Sistema
      role: '',
      groupIds: []
    }
  });

  // Fetch available groups
  const { data: groupsData } = useQuery({
    queryKey: ['/api/user-management/groups'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user-management/groups');
      if (!res.ok) throw new Error('Erro ao buscar grupos');
      return res.json();
    },
    enabled: open,
  });

  // Fetch complete member details when modal opens
  const { data: memberDetails, isLoading: memberLoading } = useQuery({
    queryKey: ['/api/team-management/members', member?.id],
    queryFn: async () => {
      if (!member?.id) return null;
      console.log('EditMemberDialog - Fetching complete member details for:', member.id);

      // Try multiple endpoints to get complete user data
      try {
        const response = await apiRequest('GET', `/api/user-management/users/${member.id}`);
        console.log('EditMemberDialog - Got complete member details:', response);

        // If the response is empty object or doesn't have essential fields, use member data
        if (!response || Object.keys(response).length === 0 || !response.email) {
          console.log('EditMemberDialog - API returned empty/invalid data, using member data:', member);
          return member;
        }

        return response;
      } catch (error) {
        console.log('EditMemberDialog - API error, fallback to basic member data:', member);
        return member;
      }
    },
    enabled: open && !!member?.id,
  });

  // Fetch member's current groups
  const { data: memberGroupsData } = useQuery({
    queryKey: ['/api/user-management/users', member?.id, 'groups'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/user-management/users/${member.id}/groups`);
      if (!res.ok) throw new Error('Erro ao buscar grupos do usuário');
      return res.json();
    },
    enabled: open && !!member?.id,
  });

  // Update selected groups when member groups data changes
  useEffect(() => {
    if (memberGroupsData?.groups) {
      setSelectedGroups(memberGroupsData.groups.map((g: any) => g.id));
    }
  }, [memberGroupsData]);


  // Reset form when member details are loaded
  useEffect(() => {
    if (open && member && !memberLoading) {
      // Use member data as source since API returns empty object
      const sourceData = member;

      console.log('EditMemberDialog - Setting form data for member:', sourceData);
      console.log('EditMemberDialog - Available data keys:', Object.keys(sourceData));

      // Handle different data structures with more comprehensive mapping
      const firstName = sourceData.firstName || sourceData.first_name || (sourceData.name ? sourceData.name.split(' ')[0] : '');
      const lastName = sourceData.lastName || sourceData.last_name || (sourceData.name ? sourceData.name.split(' ').slice(1).join(' ') : '');

      const formDataToSet = {
        // Dados Básicos
        firstName,
        lastName,
        email: sourceData.email || '',
        integrationCode: sourceData.integrationCode || sourceData.integration_code || '',
        alternativeEmail: sourceData.alternativeEmail || sourceData.alternative_email || '',
        cellPhone: sourceData.cellPhone || sourceData.cell_phone || '',
        phone: sourceData.phone || '',
        ramal: sourceData.ramal || '',
        timeZone: sourceData.timeZone || sourceData.time_zone || 'America/Sao_Paulo',
        vehicleType: sourceData.vehicleType || sourceData.vehicle_type || 'nenhum',
        cpfCnpj: sourceData.cpfCnpj || sourceData.cpf_cnpj || '',

        // Endereço
        cep: sourceData.cep || '',
        country: sourceData.country || 'Brasil',
        state: sourceData.state || '',
        city: sourceData.city || '',
        streetAddress: sourceData.streetAddress || sourceData.street_address || sourceData.address || '',
        houseType: sourceData.houseType || sourceData.house_type || '',
        houseNumber: sourceData.houseNumber || sourceData.house_number || '',
        complement: sourceData.complement || '',
        neighborhood: sourceData.neighborhood || '',

        // Dados RH
        employeeCode: sourceData.employeeCode || sourceData.employee_code || '',
        pis: sourceData.pis || '',
        cargo: sourceData.position || sourceData.cargo || '',
        ctps: sourceData.ctps || '',
        serieNumber: sourceData.serieNumber || sourceData.serie_number || '',
        admissionDate: sourceData.admissionDate || sourceData.admission_date ? 
          new Date(sourceData.admissionDate || sourceData.admission_date).toISOString().split('T')[0] : '',
        costCenter: sourceData.costCenter || sourceData.cost_center || '',
        employmentType: sourceData.employmentType || sourceData.employment_type || 'clt',

        // Sistema
        role: sourceData.role || '',
        groupIds: sourceData.groupIds || sourceData.group_ids || []
      };

      console.log('EditMemberDialog - Final form data:', formDataToSet);
      form.reset(formDataToSet);
    }
  }, [member, open, memberLoading, form]);

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('EditMemberDialog - Updating member with data:', data);
      const response = await apiRequest('PUT', `/api/user-management/users/${member.id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-management/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-management/members'] });
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

  const updateGroupsMutation = useMutation({
    mutationFn: async (groupIds: string[]) => {
      return apiRequest("PUT", `/api/user-management/users/${member.id}/groups`, { groupIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-management/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-management/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-management/members"] });
      toast({
        title: "Grupos atualizados",
        description: "Os grupos do membro foram atualizados com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar grupos",
        description: error?.message || "Falha ao atualizar os grupos do membro.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: any) => {
    console.log('EditMemberDialog - Form submitted with data:', data);
    setIsSubmitting(true);

    try {
      await updateMemberMutation.mutateAsync(data);

      // Also update group memberships if they changed
      const currentGroupIds = memberGroupsData?.groups?.map((g: any) => g.id) || [];
      if (JSON.stringify(selectedGroups.sort()) !== JSON.stringify(currentGroupIds.sort())) {
        await updateGroupsMutation.mutateAsync(selectedGroups);
      }
      
      onOpenChange(false); // Close dialog only after both mutations succeed
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

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
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

        {memberLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-2"></div>
            <span>Carregando dados do membro...</span>
          </div>
        ) : (
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
                    disabled={!canEditEmail}
                  />
                </div>
                {!canEditEmail && (
                  <p className="text-xs text-gray-500 mt-1">
                    Apenas administradores podem alterar emails de usuários
                  </p>
                )}
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
              <div>
                <Label htmlFor="alternativeEmail">E-mail Alternativo</Label>
                <Input
                  id="alternativeEmail"
                  type="email"
                  {...form.register('alternativeEmail')}
                  placeholder="email.alternativo@empresa.com"
                />
              </div>
              <div>
                <Label htmlFor="ramal">Ramal</Label>
                <Input
                  id="ramal"
                  {...form.register('ramal')}
                  placeholder="123"
                />
              </div>
              <div>
                <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  {...form.register('cpfCnpj')}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label htmlFor="integrationCode">Código de Integração</Label>
                <Input
                  id="integrationCode"
                  {...form.register('integrationCode')}
                  placeholder="COD_INT_123"
                />
              </div>
              <div>
                <Label htmlFor="vehicleType">Tipo de Veículo</Label>
                <Select 
                  value={form.watch('vehicleType')} 
                  onValueChange={(value) => form.setValue('vehicleType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Nenhum</SelectItem>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="empresarial">Empresarial</SelectItem>
                  </SelectContent>
                </Select>
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
              {/* TIPO DE EMPREGO - Campo Fundamental */}
              <div className="col-span-full">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                  <Label htmlFor="employmentType" className="flex items-center gap-2 font-semibold text-purple-700 dark:text-purple-300">
                    <Briefcase className="w-4 h-4" />
                    Tipo de Emprego
                  </Label>
                  <Select 
                    value={form.watch('employmentType')} 
                    onValueChange={(value) => form.setValue('employmentType', value)}
                  >
                    <SelectTrigger className="mt-2 border-purple-300 dark:border-purple-600">
                      <SelectValue placeholder="Selecione o tipo de emprego" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clt">CLT (Consolidação das Leis do Trabalho)</SelectItem>
                      <SelectItem value="autonomo">Autônomo/Prestador de Serviços</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                    {form.watch('employmentType') === 'clt' 
                      ? "🕒 CLT: Sistema de Ponto Eletrônico com controle de jornada completo"
                      : "📋 Autônomo: Registro de Jornada para atividades e projetos"
                    }
                  </p>
                </div>
              </div>

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
              <div>
                <Label htmlFor="ctps">CTPS</Label>
                <Input
                  id="ctps"
                  {...form.register('ctps')}
                  placeholder="1234567890"
                />
              </div>
              <div>
                <Label htmlFor="serieNumber">Série CTPS</Label>
                <Input
                  id="serieNumber"
                  {...form.register('serieNumber')}
                  placeholder="001"
                />
              </div>
              <div>
                <Label htmlFor="costCenter">Centro de Custo</Label>
                <Input
                  id="costCenter"
                  {...form.register('costCenter')}
                  placeholder="CC001"
                />
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
              <div>
                <Label htmlFor="houseType">Tipo de Residência</Label>
                <Input
                  id="houseType"
                  {...form.register('houseType')}
                  placeholder="Casa, Apartamento, etc."
                />
              </div>
              <div>
                <Label htmlFor="houseNumber">Número</Label>
                <Input
                  id="houseNumber"
                  {...form.register('houseNumber')}
                  placeholder="123"
                />
              </div>
              <div>
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  {...form.register('complement')}
                  placeholder="Apto 45, Bloco B"
                />
              </div>
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  {...form.register('neighborhood')}
                  placeholder="Centro"
                />
              </div>
              <div>
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  {...form.register('country')}
                  placeholder="Brasil"
                />
              </div>
            </CardContent>
          </Card>

          {/* Groups */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Grupos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Grupos Associados</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                {(groupsData?.groups || []).filter(Boolean).map((group: any) => {
                  const isSelected = selectedGroups.includes(group.id);
                  return (
                    <div
                      key={group.id}
                      className={`p-2 border rounded cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => {
                        handleGroupToggle(group.id);
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
              {(!groupsData?.groups || groupsData.groups.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum grupo disponível</p>
              )}
            </CardContent>
          </Card>


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
              disabled={isSubmitting || updateMemberMutation.isPending || updateGroupsMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isSubmitting || updateMemberMutation.isPending || updateGroupsMutation.isPending ? (
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
        )}
      </DialogContent>
    </Dialog>
  );
}