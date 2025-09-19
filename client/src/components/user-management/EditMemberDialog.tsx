import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, User, MapPin, Briefcase, FileText, Users, Upload } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any; // objeto do usuário a editar (pode ser parcial)
  tenantAdmin?: boolean;
}

interface UserGroup { id: string; name: string; description?: string; }
interface CustomRole { id: string; name: string; description?: string; }
interface UserLite { id: string; email: string; firstName: string; lastName: string; }

type EmploymentType = "clt" | "autonomo";

type DocumentsState = {
  rg: File | null;
  cpf: File | null;
  cnpj: File | null;
  contratoTrabalho: File | null;
  carteiraVacina: File | null;
  outros: File[];
};

type FormDataState = {
  // Básicos
  email: string;
  firstName: string;
  lastName: string;
  integrationCode: string;
  alternativeEmail: string;
  cellPhone: string;
  phone: string;
  ramal: string;
  timeZone: string;
  vehicleType: string;
  cpfCnpj: string;
  supervisorIds: string[];

  // Endereço
  cep: string;
  country: string;
  state: string;
  city: string;
  streetAddress: string;
  houseType: string;
  houseNumber: string;
  complement: string;
  neighborhood: string;

  // RH
  employeeCode: string;
  pis: string;
  cargo: string;
  ctps: string;
  serieNumber: string;
  admissionDate: Date | null;
  costCenter: string;
  employmentType: string;

  // Sistema
  role: string;
  groupIds: string[];
  customRoleIds: string[];
  sendInvitation: boolean;
  isActive: boolean;

  // Documentos (UI only)
  documents: DocumentsState;
};

const emptyDocs: DocumentsState = {
  rg: null,
  cpf: null,
  cnpj: null,
  contratoTrabalho: null,
  carteiraVacina: null,
  outros: [],
};

const defaultFormData: FormDataState = {
  // Básicos
  email: "",
  firstName: "",
  lastName: "",
  integrationCode: "",
  alternativeEmail: "",
  cellPhone: "",
  phone: "",
  ramal: "",
  timeZone: "America/Sao_Paulo",
  vehicleType: "",
  cpfCnpj: "",
  supervisorIds: [],

  // Endereço
  cep: "",
  country: "Brasil",
  state: "",
  city: "",
  streetAddress: "",
  houseType: "",
  houseNumber: "",
  complement: "",
  neighborhood: "",

  // RH
  employeeCode: "",
  pis: "",
  cargo: "",
  ctps: "",
  serieNumber: "",
  admissionDate: null,
  costCenter: "",
  employmentType: "",

  // Sistema
  role: "agent",
  groupIds: [],
  customRoleIds: [],
  sendInvitation: false, // em edição não precisa convite
  isActive: true,

  // Documentos (UI)
  documents: { ...emptyDocs },
};

export function EditMemberDialog({ open, onOpenChange, member, tenantAdmin = false }: EditUserDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [formData, setFormData] = useState<FormDataState>(defaultFormData);
  const [initialGroupIds, setInitialGroupIds] = useState<string[]>([]);
  const memberId = member?.id;

  // === Queries iguais às do create ===
  const { data: groupsData } = useQuery<{ groups: UserGroup[] }>({
    queryKey: ["/api/user-management/groups"],
    enabled: open,
  });

  const { data: rolesData } = useQuery<{ roles: CustomRole[] }>({
    queryKey: ["/api/user-management/roles"],
    enabled: open,
  });

  const { data: usersData } = useQuery<{ users: UserLite[] }>({
    queryKey: ["/api/tenant-admin/users"],
    enabled: open,
  });

  // Detalhes completos do usuário
  const { data: memberDetails } = useQuery({
    queryKey: ["/api/user-management/users", memberId],
    enabled: open && !!memberId,
    queryFn: async () => {
      const resp = await apiRequest("GET", `/api/user-management/users/${memberId}`);
      let respJson = await resp.json?.();
      console.log("RESP JSON: ", respJson);
      return respJson;
    }
  });



  // Grupos atuais do usuário (para saber o delta)
  const { data: memberGroupsData } = useQuery({
    queryKey: ["/api/user-management/users", memberId, "groups"],
    enabled: open && !!memberId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/user-management/users/${memberId}/groups`);
      return res?.groups ? res : await res.json?.();
    },
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  // === Mutations (update user + update groups) ===
  const updateUserMutation = useMutation({
    mutationFn: async (body: any) => {
      return apiRequest("PUT", `/api/user-management/users/${memberId}`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/user-management/users"] });
      qc.invalidateQueries({ queryKey: ["/api/team-management/members"] });
      qc.invalidateQueries({ queryKey: ["/api/team-management/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/tenant-admin/users"] });
      qc.invalidateQueries({ queryKey: ["/api/user-management/stats"] });
    },
  });

  const updateGroupsMutation = useMutation({
    mutationFn: async (groupIds: string[]) => {
      return apiRequest("PUT", `/api/user-management/users/${memberId}/groups`, { groupIds });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/user-management/users", memberId, "groups"] });
    },
  });

  // === Helpers iguais aos do create ===
  const handleGroupToggle = (groupId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      groupIds: checked
        ? [...prev.groupIds, groupId]
        : prev.groupIds.filter((id) => id !== groupId),
    }));
  };

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      customRoleIds: checked
        ? [...prev.customRoleIds, roleId]
        : prev.customRoleIds.filter((id) => id !== roleId),
    }));
  };

  const handleSupervisorToggle = (supervisorId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      supervisorIds: checked
        ? [...prev.supervisorIds, supervisorId]
        : prev.supervisorIds.filter((id) => id !== supervisorId),
    }));
  };

  // === Mapear memberDetails -> formData do create ===
  useEffect(() => {
    if (!open) return;
    const src = memberDetails;
    if (!src) return;

    const nz = (v: any, fallback = "") => (v == null ? fallback : v);
    const nza = (v: any) => (Array.isArray(v) ? v : []);
    const dt = (v: any) => (v ? new Date(v) : null);

    const firstName =
      nz(src.firstName) ||
      nz(src.first_name) ||
      (src.name ? String(src.name).split(" ")[0] : "");

    const lastName =
      nz(src.lastName) ||
      nz(src.last_name) ||
      (src.name ? String(src.name).split(" ").slice(1).join(" ") : "");
      const normEmployment = (v: any): "clt" | "autonomo" | "" => {
        const s = String(v ?? "").toLowerCase().trim();
        if (["pj", "autonomo", "autônomo", "contractor", "terceiro", "third_party"].includes(s)) {
          return "autonomo";
        }
        if (["clt", "employee", "empregado"].includes(s)) {
          return "clt";
        }
        // se vier vazio/desconhecido, mantém vazio (mostra placeholder)
        return "";
      };

    const mapped = {
      // Básicos
      email: nz(src.email),
      firstName,
      lastName,
      integrationCode: nz(src.integrationCode ?? src.integration_code),
      alternativeEmail: nz(src.alternativeEmail ?? src.alternative_email),
      cellPhone: nz(src.cellPhone ?? src.cell_phone ?? src.phoneNumber),
      phone: nz(src.phone ?? src.phoneNumber),
      ramal: nz(src.ramal),
      timeZone: nz(src.timeZone ?? src.time_zone ?? src.timezone, "America/Sao_Paulo"),
      vehicleType: nz(src.vehicleType ?? src.vehicle_type),
      cpfCnpj: nz(src.cpfCnpj ?? src.cpf_cnpj),
      supervisorIds: nza(src.supervisorIds ?? src.supervisor_ids),

      // Endereço
      cep: nz(src.cep),
      country: nz(src.country, "Brasil"),
      state: nz(src.state),
      city: nz(src.city),
      streetAddress: nz(src.streetAddress ?? src.street_address ?? src.address),
      houseType: nz(src.houseType ?? src.house_type),
      houseNumber: nz(src.houseNumber ?? src.house_number),
      complement: nz(src.complement),
      neighborhood: nz(src.neighborhood),

      // RH
      employeeCode: nz(src.employeeCode ?? src.employee_code),
      pis: nz(src.pis),
      cargo: nz(src.cargo ?? src.position),
      ctps: nz(src.ctps),
      serieNumber: nz(src.serieNumber ?? src.serie_number),
      admissionDate: dt(src.admissionDate ?? src.admission_date),
      costCenter: nz(src.costCenter ?? src.cost_center),
      employmentType: normEmployment(src.employmentType ?? src.employment_type),

      // Sistema
      role: nz(src.role, "agent"),
      groupIds: nza(src.groupIds ?? src.group_ids),         // será atualizado pelo efeito dos grupos abaixo
      customRoleIds: nza(src.customRoleIds ?? src.custom_role_ids),
      sendInvitation: false, // edição não envia convite
      isActive: typeof src.isActive === "boolean" ? src.isActive : true,

      // Documentos (UI only)
      documents: { ...emptyDocs },
    };
    console.log("mapped", mapped);
    console.log("src: ", src)
    setFormData(mapped);
  }, [open, memberDetails]);


  // Carrega grupos atuais (baseline para comparar mudanças)
  useEffect(() => {
    const currentGroupIds = (memberGroupsData?.groups || []).map((g: any) => g.id);
    setInitialGroupIds(currentGroupIds);

    // injeta no form se ainda não setado ou se lista veio vazia no usuário
    if (open && currentGroupIds.length) {
      setFormData(prev => ({
        ...prev,
        groupIds: prev.groupIds?.length ? prev.groupIds : currentGroupIds,
      }));
    }
  }, [memberGroupsData, open]);


  // === Submit ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) return;

    // Monta payload JSON (sem arquivos)
    const {
      documents, // não enviado aqui
      ...payload
    } = formData;

    try {
      await updateUserMutation.mutateAsync(payload);

      // Se grupos mudaram, envia update específico
      const changed =
        JSON.stringify([...formData.groupIds].sort()) !==
        JSON.stringify([...initialGroupIds].sort());
      if (changed) {
        await updateGroupsMutation.mutateAsync(formData.groupIds);
      }

      toast({
        title: t("userManagement.success", "Sucesso"),
        description: t("userManagement.userUpdated", "Usuário atualizado com sucesso"),
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t("userManagement.error", "Erro"),
        description: error?.message || t("userManagement.userUpdateError", "Erro ao atualizar usuário"),
        variant: "destructive",
      });
    }
  };

  // === UI (copiado do CreateUserDialog com os mesmos blocos/abas) ===
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" aria-describedby="edit-user-description">
        <div id="edit-user-description" className="sr-only">
          Formulário para editar usuário no sistema
        </div>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Editar Usuário
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário, organizadas por categoria
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="py-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Dados Básicos
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço
              </TabsTrigger>
              <TabsTrigger value="hr" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Dados RH
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Grupos/Funções
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Documentos
              </TabsTrigger>
            </TabsList>

            {/* Aba 1: Dados Básicos */}
            <TabsContent value="basic">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="João"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Sobrenome *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Silva"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="joao.silva@empresa.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="integrationCode">Código de Integração</Label>
                    <Input
                      id="integrationCode"
                      value={formData.integrationCode}
                      onChange={(e) => setFormData({ ...formData, integrationCode: e.target.value })}
                      placeholder="INT001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alternativeEmail">Email Alternativo</Label>
                    <Input
                      id="alternativeEmail"
                      type="email"
                      value={formData.alternativeEmail}
                      onChange={(e) => setFormData({ ...formData, alternativeEmail: e.target.value })}
                      placeholder="joao.silva@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cellPhone">Celular</Label>
                      <Input
                        id="cellPhone"
                        value={formData.cellPhone}
                        onChange={(e) => setFormData({ ...formData, cellPhone: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(11) 3333-3333"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ramal">Ramal</Label>
                      <Input
                        id="ramal"
                        value={formData.ramal}
                        onChange={(e) => setFormData({ ...formData, ramal: e.target.value })}
                        placeholder="1234"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeZone">Fuso Horário</Label>
                      <Select
                        value={formData.timeZone}
                        onValueChange={(value) => setFormData({ ...formData, timeZone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Sao_Paulo">América/São Paulo (GMT-3)</SelectItem>
                          <SelectItem value="America/Manaus">América/Manaus (GMT-4)</SelectItem>
                          <SelectItem value="America/Rio_Branco">América/Rio Branco (GMT-5)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicleType">Tipo de Veículo</Label>
                      <Select
                        value={formData.vehicleType}
                        onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          <SelectItem value="personal">Particular</SelectItem>
                          <SelectItem value="company">Empresarial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                    <Input
                      id="cpfCnpj"
                      value={formData.cpfCnpj}
                      onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Supervisores</Label>
                    <ScrollArea className="h-32 border rounded-md p-3">
                      {usersData?.users?.length ? (
                        <div className="space-y-2">
                          {usersData.users.map((u) => (
                            <div key={u.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`supervisor-${u.id}`}
                                checked={formData.supervisorIds.includes(u.id)}
                                onCheckedChange={(checked) => handleSupervisorToggle(u.id, !!checked)}
                              />
                              <Label htmlFor={`supervisor-${u.id}`} className="text-sm cursor-pointer">
                                {u.firstName} {u.lastName} ({u.email})
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          Nenhum usuário disponível
                        </p>
                      )}
                    </ScrollArea>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Papel do Sistema *</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Cliente</SelectItem>
                        <SelectItem value="agent">Agente</SelectItem>
                        <SelectItem value="tenant_admin">Admin do Workspace</SelectItem>
                        {!tenantAdmin && <SelectItem value="saas_admin">SaaS Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                      />
                      <Label htmlFor="isActive">Conta ativa</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sendInvitation"
                        checked={formData.sendInvitation}
                        onCheckedChange={(checked) => setFormData({ ...formData, sendInvitation: !!checked })}
                      />
                      <Label htmlFor="sendInvitation">Enviar email de convite</Label>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Aba 2: Endereço */}
            <TabsContent value="address">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">País</Label>
                      <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Brasil">Brasil</SelectItem>
                          <SelectItem value="Argentina">Argentina</SelectItem>
                          <SelectItem value="Chile">Chile</SelectItem>
                          <SelectItem value="Colombia">Colômbia</SelectItem>
                          <SelectItem value="Peru">Peru</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="São Paulo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="São Paulo"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="streetAddress">Logradouro</Label>
                    <Input
                      id="streetAddress"
                      value={formData.streetAddress}
                      onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                      placeholder="Rua das Flores"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="houseType">Tipo</Label>
                      <Select value={formData.houseType} onValueChange={(value) => setFormData({ ...formData, houseType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="casa">Casa</SelectItem>
                          <SelectItem value="apartamento">Apartamento</SelectItem>
                          <SelectItem value="comercial">Comercial</SelectItem>
                          <SelectItem value="sala">Sala</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="houseNumber">Número</Label>
                      <Input
                        id="houseNumber"
                        value={formData.houseNumber}
                        onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                      placeholder="Apto 45, Bloco B"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      placeholder="Centro"
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Aba 3: Dados RH */}
            <TabsContent value="hr">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                    <div className="space-y-2">
                      <Label htmlFor="employmentType" className="flex items-center gap-2 font-semibold text-purple-700 dark:text-purple-300">
                        <Briefcase className="w-4 h-4" />
                        Tipo de Emprego
                      </Label>
                      <Select
                        value={formData.employmentType} 
                        onValueChange={(value: "clt" | "autonomo") =>
                          setFormData(prev => ({ ...prev, employmentType: value }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione o tipo de emprego" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clt">CLT (carteira assinada)</SelectItem>
                          <SelectItem value="autonomo">PJ (Autônomo/Prestador)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        {formData.employmentType === "clt"
                          ? "🕒 CLT: Sistema de Ponto Eletrônico com controle de jornada completo"
                          : "📋 Autônomo: Registro de Jornada para atividades e projetos"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeCode">Código do Funcionário</Label>
                      <Input
                        id="employeeCode"
                        value={formData.employeeCode}
                        onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                        placeholder="FUNC001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pis">PIS</Label>
                      <Input
                        id="pis"
                        value={formData.pis}
                        onChange={(e) => setFormData({ ...formData, pis: e.target.value })}
                        placeholder="000.00000.00-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      placeholder="Analista de Sistemas"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ctps">CTPS</Label>
                      <Input
                        id="ctps"
                        value={formData.ctps}
                        onChange={(e) => setFormData({ ...formData, ctps: e.target.value })}
                        placeholder="1234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serieNumber">Série</Label>
                      <Input
                        id="serieNumber"
                        value={formData.serieNumber}
                        onChange={(e) => setFormData({ ...formData, serieNumber: e.target.value })}
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Admissão</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.admissionDate
                            ? format(formData.admissionDate, "dd/MM/yyyy", { locale: ptBR })
                            : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.admissionDate || undefined}
                          onSelect={(date) => setFormData({ ...formData, admissionDate: date || null })}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="costCenter">Centro de Custo</Label>
                    <Input
                      id="costCenter"
                      value={formData.costCenter}
                      onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                      placeholder="CC001 - TI"
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Aba 4: Grupos/Funções */}
            <TabsContent value="groups">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {/* Papéis customizados */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Papéis Customizados
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Selecione papéis customizados adicionais para este usuário
                    </p>

                    <ScrollArea className="h-32 border rounded-md p-3">
                      {rolesData?.roles?.length ? (
                        <div className="space-y-2">
                          {rolesData.roles.map((role) => (
                            <div key={role.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`role-${role.id}`}
                                checked={formData.customRoleIds.includes(role.id)}
                                onCheckedChange={(checked) => handleRoleToggle(role.id, !!checked)}
                              />
                              <Label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer text-sm">
                                <div className="font-medium">{role.name}</div>
                                {role.description && (
                                  <div className="text-xs text-muted-foreground">{role.description}</div>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          Nenhum papel customizado disponível
                        </p>
                      )}
                    </ScrollArea>

                    {formData.customRoleIds.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-2">Papéis selecionados:</p>
                        <div className="flex flex-wrap gap-1">
                          {formData.customRoleIds.map((roleId) => {
                            const role = rolesData?.roles?.find((r) => r.id === roleId);
                            return role ? (
                              <Badge key={roleId} variant="secondary" className="text-xs">
                                {role.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grupos */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Grupos de Usuários
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Adicione este usuário a grupos da organização
                    </p>

                    <ScrollArea className="h-32 border rounded-md p-3">
                      {groupsData?.groups?.length ? (
                        <div className="space-y-2">
                          {(groupsData?.groups || []).filter(Boolean).map((group) => (
                            <div key={group.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`group-${group.id}`}
                                checked={formData.groupIds.includes(group.id)}
                                onCheckedChange={(checked) => handleGroupToggle(group.id, !!checked)}
                              />
                              <Label htmlFor={`group-${group.id}`} className="flex-1 cursor-pointer text-sm">
                                <div className="font-medium">{group.name}</div>
                                {group.description && (
                                  <div className="text-xs text-muted-foreground">{group.description}</div>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          Nenhum grupo disponível
                        </p>
                      )}
                    </ScrollArea>

                    {formData.groupIds.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-2">Grupos selecionados:</p>
                        <div className="flex flex-wrap gap-1">
                          {formData.groupIds.map((groupId) => {
                            const group = (groupsData?.groups || []).find((g) => g?.id === groupId);
                            return group ? (
                              <Badge key={groupId} variant="secondary" className="text-xs">
                                {group.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Aba 5: Documentos (UI idêntica; não envia arquivos no PUT) */}
            <TabsContent value="documents">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h4 className="font-medium mb-2 flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5" />
                      Upload de Documentos
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Anexe os documentos necessários (envio real pode exigir endpoint multipart)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* RG */}
                    <UploadBox
                      id="rg-upload"
                      label="RG (Identidade)"
                      file={formData.documents.rg}
                      onFile={(file) =>
                        setFormData((p) => ({ ...p, documents: { ...p.documents, rg: file } }))
                      }
                    />
                    {/* CPF */}
                    <UploadBox
                      id="cpf-upload"
                      label="CPF"
                      file={formData.documents.cpf}
                      onFile={(file) =>
                        setFormData((p) => ({ ...p, documents: { ...p.documents, cpf: file } }))
                      }
                    />
                    {/* CNPJ */}
                    <UploadBox
                      id="cnpj-upload"
                      label="CNPJ (se aplicável)"
                      file={formData.documents.cnpj}
                      onFile={(file) =>
                        setFormData((p) => ({ ...p, documents: { ...p.documents, cnpj: file } }))
                      }
                    />
                    {/* Contrato */}
                    <UploadBox
                      id="contrato-upload"
                      label="Contrato de Trabalho"
                      file={formData.documents.contratoTrabalho}
                      onFile={(file) =>
                        setFormData((p) => ({ ...p, documents: { ...p.documents, contratoTrabalho: file } }))
                      }
                    />
                    {/* Vacinação */}
                    <UploadBox
                      id="vacina-upload"
                      label="Carteira de Vacinação"
                      file={formData.documents.carteiraVacina}
                      onFile={(file) =>
                        setFormData((p) => ({ ...p, documents: { ...p.documents, carteiraVacina: file } }))
                      }
                    />
                    {/* Outros (múltiplos) */}
                    <UploadMultiBox
                      id="outros-upload"
                      label="Outros Documentos"
                      files={formData.documents.outros}
                      onFiles={(files) =>
                        setFormData((p) => ({
                          ...p,
                          documents: { ...p.documents, outros: [...p.documents.outros, ...files] },
                        }))
                      }
                    />
                  </div>

                  {/* Resumo documentos */}
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h5 className="font-medium mb-2 text-sm">Resumo dos Documentos:</h5>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>RG: {formData.documents.rg ? "✓ Enviado" : "○ Pendente"}</p>
                      <p>CPF: {formData.documents.cpf ? "✓ Enviado" : "○ Pendente"}</p>
                      <p>CNPJ: {formData.documents.cnpj ? "✓ Enviado" : "○ Opcional"}</p>
                      <p>Contrato: {formData.documents.contratoTrabalho ? "✓ Enviado" : "○ Pendente"}</p>
                      <p>Vacinação: {formData.documents.carteiraVacina ? "✓ Enviado" : "○ Pendente"}</p>
                      <p>
                        Outros:{" "}
                        {formData.documents.outros.length > 0
                          ? `✓ ${formData.documents.outros.length} arquivo(s)`
                          : "○ Nenhum"}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              type="submit"
              disabled={updateUserMutation.isPending || !formData.email.trim() || updateGroupsMutation.isPending}
            >
              {updateUserMutation.isPending || updateGroupsMutation.isPending
                ? t("common.saving", "Salvando...")
                : t("common.saveChanges", "Salvar Alterações")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Pequenos componentes de upload usados nas duas UIs */
function UploadBox({
  id, label, file, onFile,
}: { id: string; label: string; file: File | null; onFile: (f: File | null) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        <FileText className="w-4 h-4" />
        {label}
      </Label>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
        <input
          id={id}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
        <Label htmlFor={id} className="cursor-pointer">
          {file ? (
            <div className="text-green-600 dark:text-green-400">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="text-muted-foreground">
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Clique para enviar</p>
              <p className="text-xs">PDF, JPG, PNG até 10MB</p>
            </div>
          )}
        </Label>
      </div>
    </div>
  );
}

function UploadMultiBox({
  id, label, files, onFiles,
}: { id: string; label: string; files: File[]; onFiles: (files: File[]) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        <FileText className="w-4 h-4" />
        {label}
      </Label>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
        <input
          id={id}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={(e) => onFiles(Array.from(e.target.files || []))}
        />
        <Label htmlFor={id} className="cursor-pointer">
          {files.length > 0 ? (
            <div className="text-green-600 dark:text-green-400">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">{files.length} arquivo(s) selecionado(s)</p>
              <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                {files.map((f, i) => (
                  <div key={i} className="truncate">
                    {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Clique para enviar outros documentos</p>
              <p className="text-xs">Múltiplos arquivos: PDF, JPG, PNG até 10MB cada</p>
            </div>
          )}
        </Label>
      </div>
    </div>
  );
}
