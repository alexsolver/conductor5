import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, User, MapPin, Briefcase, FileText, Users } from "lucide-react";

// Schema for form validation
const editMemberSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  cellPhone: z.string().optional(),
  role: z.string().min(1, "Papel é obrigatório"),
  groupIds: z.array(z.string()).default([]),
  // Address fields
  cep: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  streetAddress: z.string().optional(),
  // HR fields
  employeeCode: z.string().optional(),
  cargo: z.string().optional(),
  pis: z.string().optional(),
  admissionDate: z.date().optional(),
});

type EditMemberFormData = z.infer<typeof editMemberSchema>;

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
}

export function EditMemberDialog({ open, onOpenChange, member }: EditMemberDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const form = useForm<EditMemberFormData>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      cellPhone: "",
      role: "agent",
      groupIds: [],
      cep: "",
      state: "",
      city: "",
      streetAddress: "",
      employeeCode: "",
      cargo: "",
      pis: "",
    },
  });

  // Load member data into form when member changes
  useEffect(() => {
    if (member) {
      const memberGroupIds = Array.isArray(member.groupIds) ? member.groupIds : [];
      setSelectedGroups(memberGroupIds);

      form.reset({
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        email: member.email || "",
        phone: member.phone || "",
        cellPhone: member.cellPhone || "",
        role: member.role || "agent",
        groupIds: memberGroupIds,
        cep: member.cep || "",
        state: member.state || "",
        city: member.city || "",
        streetAddress: member.streetAddress || "",
        employeeCode: member.employeeCode || "",
        cargo: member.cargo || "",
        pis: member.pis || "",
        admissionDate: member.admissionDate ? new Date(member.admissionDate) : undefined,
      });
    }
  }, [member, form]);

  // Fetch available roles
  const { data: roles } = useQuery({
    queryKey: ['/api/user-management/roles'],
    enabled: open,
  });

  // Fetch available groups
  const { data: groupsData } = useQuery({
    queryKey: ['/api/user-management/groups'],
    enabled: open,
  });

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (data: EditMemberFormData) => {
      return apiRequest('PUT', `/api/team-management/members/${member.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-management/members'] });
      toast({
        title: "Membro atualizado",
        description: "As informações do membro foram atualizadas com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar membro",
        description: error?.message || "Falha ao atualizar as informações do membro.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditMemberFormData) => {
    updateMemberMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Membro da Equipe</DialogTitle>
          <DialogDescription>
            Atualize as informações do membro selecionado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Dados Básicos</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Endereço</span>
              </TabsTrigger>
              <TabsTrigger value="hr" className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4" />
                <span>Dados RH</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Documentos</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Grupos</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      {...form.register("firstName")}
                      placeholder="Nome do usuário"
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      {...form.register("lastName")}
                      placeholder="Sobrenome do usuário"
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="email@empresa.com"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="role">Papel no Sistema</Label>
                    <Select value={form.watch("role")} onValueChange={(value) => form.setValue("role", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(roles) && roles.map((role: any) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.displayName || role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      {...form.register("phone")}
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cellPhone">Celular</Label>
                    <Input
                      id="cellPhone"
                      {...form.register("cellPhone")}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Address Tab */}
            <TabsContent value="address" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Endereço</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      {...form.register("cep")}
                      placeholder="00000-000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      {...form.register("state")}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      {...form.register("city")}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="streetAddress">Logradouro</Label>
                    <Input
                      id="streetAddress"
                      {...form.register("streetAddress")}
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* HR Data Tab */}
            <TabsContent value="hr" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dados de Recursos Humanos</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeeCode">Código do Funcionário</Label>
                    <Input
                      id="employeeCode"
                      {...form.register("employeeCode")}
                      placeholder="F001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      {...form.register("cargo")}
                      placeholder="Analista de Suporte"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pis">PIS</Label>
                    <Input
                      id="pis"
                      {...form.register("pis")}
                      placeholder="000.00000.00-0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="admissionDate">Data de Admissão</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("admissionDate") ? (
                            format(form.watch("admissionDate")!, "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.watch("admissionDate")}
                          onSelect={(date) => form.setValue("admissionDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documentos e Grupos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Gestão de documentos e grupos será implementada em breve</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Groups Tab */}
            <TabsContent value="groups" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Grupos do Usuário</CardTitle>
                  <CardDescription>
                    Selecione os grupos aos quais este usuário pertence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label>Grupos Disponíveis</Label>
                    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                      {groupsData?.groups?.map((group: any) => (
                        <div key={group.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <input
                            type="checkbox"
                            id={`group-${group.id}`}
                            checked={selectedGroups.includes(group.id)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              const newGroups = isChecked
                                ? [...selectedGroups, group.id]
                                : selectedGroups.filter(id => id !== group.id);
                              setSelectedGroups(newGroups);
                              form.setValue("groupIds", newGroups);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`group-${group.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{group.name}</h4>
                                {group.description && (
                                  <p className="text-sm text-gray-500">{group.description}</p>
                                )}
                              </div>
                              <Badge variant="outline" className="ml-2">
                                {group.userCount || 0} membros
                              </Badge>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>

                    {selectedGroups.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <Label className="text-sm font-medium text-blue-900">
                          Grupos Selecionados ({selectedGroups.length})
                        </Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedGroups.map(groupId => {
                            const group = groupsData?.groups?.find((g: any) => g.id === groupId);
                            return group ? (
                              <Badge key={groupId} variant="default" className="bg-blue-100 text-blue-800">
                                {group.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {(!groupsData?.groups || groupsData.groups.length === 0) && (
                      <div className="text-center text-gray-500 py-8">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Nenhum grupo disponível</p>
                        <p className="text-sm">Crie grupos no painel de administração</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMemberMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateMemberMutation.isPending}
            >
              {updateMemberMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}