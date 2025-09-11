import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  Award,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Eye,
  Edit,
  Trash2,
  Star,
  UserPlus,
  Users
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Schema para criação de habilidades
const skillFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  category: z.string().min(1, "Categoria é obrigatória"),
  suggestedCertification: z.string().optional(),
  certificationValidityMonths: z.number().positive().optional(),
  description: z.string().optional(),
  observations: z.string().optional(),
  scaleOptions: z.array(z.object({
    level: z.number(),
    label: z.string(),
    description: z.string()
  })).optional(),
});

type SkillFormData = z.infer<typeof skillFormSchema>;

// Categorias agora são carregadas dinamicamente do backend
const DEFAULT_CATEGORIES = ["Técnica", "Operacional", "Administrativa"];

// Opções padrão da escala
const DEFAULT_SCALE_OPTIONS = [
  { level: 1, label: "Básico", description: "Conhecimento introdutório, precisa de supervisão" },
  { level: 2, label: "Intermediário", description: "Executa tarefas com alguma autonomia" },
  { level: 3, label: "Avançado", description: "Executa com autonomia, lida com situações variadas" },
  { level: 4, label: "Especialista", description: "Referência técnica interna, resolve problemas críticos" },
  { level: 5, label: "Excelência", description: "Comprovada por resultados e avaliações de clientes" }
];

interface Skill {
  id: string;
  name: string;
  category: string;
  suggestedCertification?: string;
  certificationValidityMonths?: number;
  description?: string;
  observations?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  scaleOptions?: Array<{
    level: number;
    label: string;
    description: string;
  }>;
}

interface SkillsResponse {
  success: boolean;
  data: Skill[];
  count: number;
}

interface CategoriesResponse {
  success: boolean;
  data: string[];
}

interface CertificationData {
  userId: string;
  userName: string;
  skillName: string;
  skillId: string;
  expiresAt: string;
  daysSinceExpiry?: number;
}

interface CertificationsResponse {
  success: boolean;
  data: CertificationData[];
  count: number;
}

interface UserSkill {
  id: string;
  tenantId: string;
  userId: string;
  skillId: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
  certifications: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  skill: Skill;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TechnicalSkillsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [scaleOptions, setScaleOptions] = useState(DEFAULT_SCALE_OPTIONS);
  const [showCreateUserSkill, setShowCreateUserSkill] = useState(false);
  const [showAssignMembers, setShowAssignMembers] = useState(false);
  const [selectedSkillForAssignment, setSelectedSkillForAssignment] = useState<Skill | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: skillsResponse, isLoading } = useQuery<SkillsResponse>({
    queryKey: ["/api/technical-skills/skills"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/technical-skills/skills");
      if (!res.ok) throw new Error("Erro ao buscar habilidades");
      return res.json();
    },
  });

  const { data: categoriesResponse } = useQuery<CategoriesResponse>({
    queryKey: ["/api/technical-skills/skills/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/technical-skills/skills/categories");
      if (!res.ok) throw new Error("Erro ao buscar categorias");
      return res.json();
    },
  });

  const { data: expiredCertsResponse } = useQuery<CertificationsResponse>({
    queryKey: ["/api/technical-skills/certifications/expired"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/technical-skills/certifications/expired");
      if (!res.ok) throw new Error("Erro ao buscar certificações expiradas");
      return res.json();
    },
  });

  const { data: expiringCertsResponse } = useQuery<CertificationsResponse>({
    queryKey: ["/api/technical-skills/certifications/expiring"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/technical-skills/certifications/expiring");
      if (!res.ok) throw new Error("Erro ao buscar certificações expirando");
      return res.json();
    },
  });

  // Fetch user skills
  const { data: userSkills, isLoading: userSkillsLoading } = useQuery<UserSkill[]>({
    queryKey: ['/api/technical-skills/user-skills'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/technical-skills/user-skills');
      if (!res.ok) throw new Error('Erro ao buscar habilidades dos usuários');
      return res.json();
    },
  });

  // Fetch team members
  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ['/api/team/members'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/team/members');
      if (!res.ok) throw new Error('Erro ao buscar membros da equipe');
      const data = await res.json();
      return data.members || [];
    },
  });

  // Extract data from responses
  const skills = skillsResponse?.data || [];
  const categories = categoriesResponse?.data || [];
  const expiredCerts = expiredCertsResponse?.data || [];
  const expiringCerts = expiringCertsResponse?.data || [];

  // Forms
  const createForm = useForm<SkillFormData>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      name: "",
      category: "",
      suggestedCertification: "",
      certificationValidityMonths: undefined,
      description: "",
      observations: "",
      scaleOptions: DEFAULT_SCALE_OPTIONS,
    },
  });

  const editForm = useForm<SkillFormData>({
    resolver: zodResolver(skillFormSchema),
  });

  // Mutations
  const createSkillMutation = useMutation({
    mutationFn: async (skillData: SkillFormData) => {
      const res = await apiRequest("POST", "/api/technical-skills/skills", skillData);
      if (!res.ok) throw new Error("Erro ao criar habilidade");
      return res.json();
    },
    onSuccess: async () => {
      // Invalidate and refetch queries immediately
      await queryClient.invalidateQueries({ queryKey: ["/api/technical-skills/skills"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/technical-skills/skills/categories"] });

      // Force immediate refetch
      await queryClient.refetchQueries({ 
        queryKey: ["/api/technical-skills/skills"],
        type: 'active'
      });

      toast({
        title: "Sucesso",
        description: "Habilidade criada com sucesso",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar habilidade",
        variant: "destructive",
      });
    },
  });

  const updateSkillMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SkillFormData }) =>
      apiRequest("PUT", `/api/technical-skills/skills/${id}`, data),
    onSuccess: () => {
      toast({ title: "Habilidade atualizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/technical-skills/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/technical-skills/skills/categories"] });
      setIsEditDialogOpen(false);
      setEditingSkill(null);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar habilidade", variant: "destructive" });
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/technical-skills/skills/${id}`),
    onSuccess: () => {
      toast({ title: "Habilidade desativada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/technical-skills/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/technical-skills/skills/categories"] });
    },
    onError: () => {
      toast({ title: "Erro ao desativar habilidade", variant: "destructive" });
    },
  });

  // Create user skill mutation
  const createUserSkillMutation = useMutation({
    mutationFn: ({ skillId, userId, proficiencyLevel, yearsOfExperience, certifications, notes }: UserSkill) => 
      apiRequest('POST', '/api/technical-skills/user-skills', { skillId, userId, proficiencyLevel, yearsOfExperience, certifications, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technical-skills/user-skills'] });
      setShowCreateUserSkill(false);
      setNewUserSkill({
        skillId: '',
        userId: '',
        proficiencyLevel: 'beginner',
        yearsOfExperience: 0,
        certifications: [],
        notes: ''
      });
      toast({
        title: 'Sucesso',
        description: 'Habilidade atribuída ao usuário com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete user skill mutation
  const deleteUserSkillMutation = useMutation({
    mutationFn: async (userSkillId: string) => {
      const res = await apiRequest('DELETE', `/api/technical-skills/user-skills/${userSkillId}`);
      if (!res.ok) throw new Error('Erro ao excluir habilidade do usuário');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technical-skills/user-skills'] });
      toast({
        title: 'Sucesso',
        description: 'Habilidade do usuário excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Assign members to skill mutation
  const assignMembersToSkillMutation = useMutation({
    mutationFn: async ({ skillId, memberIds }: { skillId: string; memberIds: string[] }) => {
      const res = await apiRequest('POST', `/api/technical-skills/skills/${skillId}/assign-members`, {
        memberIds,
        defaultProficiencyLevel: 'beginner'
      });

      if (!res.ok) {
        throw new Error('Erro ao atribuir membros à habilidade');
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/technical-skills/user-skills'] });
      setShowAssignMembers(false);
      setSelectedMembers([]);
      setSelectedSkillForAssignment(null);

      const { successCount, errorCount } = data.data;

      if (errorCount > 0) {
        toast({
          title: 'Atribuição Parcial',
          description: `${successCount} membro(s) atribuído(s) com sucesso. ${errorCount} erro(s) encontrado(s).`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Sucesso',
          description: `${successCount} membro(s) atribuído(s) à habilidade com sucesso.`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Event handlers
  const onCreateSubmit = (data: SkillFormData) => {
    createSkillMutation.mutate(data);
  };

  const onEditSubmit = (data: SkillFormData) => {
    if (editingSkill) {
      const submitData = {
        ...data,
        scaleOptions: scaleOptions
      };
      updateSkillMutation.mutate({ id: editingSkill.id, data: submitData });
    }
  };

  const openEditDialog = (skill: Skill) => {
    setEditingSkill(skill);
    const skillScaleOptions = skill.scaleOptions || DEFAULT_SCALE_OPTIONS;
    setScaleOptions(skillScaleOptions);
    editForm.reset({
      name: skill.name,
      category: skill.category,
      suggestedCertification: skill.suggestedCertification || "",
      certificationValidityMonths: skill.certificationValidityMonths || undefined,
      description: skill.description || "",
      observations: skill.observations || "",
      scaleOptions: skillScaleOptions,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteSkill = (skillId: string) => {
    if (confirm('Tem certeza de que deseja desativar esta habilidade?')) {
      deleteSkillMutation.mutate(skillId);
    }
  };

  const handleCreateUserSkill = () => {
    if (newUserSkill.skillId && newUserSkill.userId) {
      createUserSkillMutation.mutate(newUserSkill as UserSkill);
    }
  };

  const handleDeleteUserSkill = (userSkillId: string) => {
    if (confirm('Tem certeza de que deseja excluir esta habilidade do usuário?')) {
      deleteUserSkillMutation.mutate(userSkillId);
    }
  };

  const handleOpenAssignMembers = (skill: Skill) => {
    setSelectedSkillForAssignment(skill);
    setSelectedMembers([]);
    setShowAssignMembers(true);
  };

  const handleMemberSelection = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleAssignMembers = () => {
    if (selectedSkillForAssignment && selectedMembers.length > 0) {
      assignMembersToSkillMutation.mutate({
        skillId: selectedSkillForAssignment.id,
        memberIds: selectedMembers
      });
    }
  };

  // Get members already assigned to a skill
  const getMembersWithSkill = (skillId: string) => {
    if (!userSkills) return [];
    return userSkills.filter((us: UserSkill) => us.skillId === skillId);
  };

  // Get available members for assignment (not already assigned to the skill)
  const getAvailableMembers = (skillId: string) => {
    if (!teamMembers) return [];
    const assignedUserIds = getMembersWithSkill(skillId).map((us: UserSkill) => us.userId);
    return teamMembers.filter((member: TeamMember) => !assignedUserIds.includes(member.id));
  };

  const renderStars = (skillScaleOptions?: typeof DEFAULT_SCALE_OPTIONS) => {
    const options = skillScaleOptions || DEFAULT_SCALE_OPTIONS;
    const maxLevel = Math.max(...options.map(opt => opt.level));

    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: maxLevel }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 fill-yellow-400 text-yellow-400`}
          />
        ))}
        <span className="ml-1 text-xs text-gray-500">
          {options.length} níveis
        </span>
      </div>
    );
  };

  const filteredSkills = skills?.filter(skill => {
    const matchesSearch = !searchTerm || 
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || skill.category === selectedCategory;
    return matchesSearch && matchesCategory && skill.isActive;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Habilidades Técnicas</h2>
          <p className="text-gray-600 dark:text-gray-400">Gerencie habilidades técnicas e certificações dos usuários</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-skill">
              <Plus className="h-4 w-4 mr-2" />
              Nova Habilidade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Habilidade</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para criar uma nova habilidade técnica.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Instalação de fibra óptica" {...field} data-testid="input-skill-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-skill-category">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEFAULT_CATEGORIES.map((category: string) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                          {categories?.filter((category: string) => 
                            !DEFAULT_CATEGORIES.includes(category)
                          ).map((category: string) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Editor de Opções da Escala */}
                <div className="space-y-4">
                  <FormLabel>Opções da Escala</FormLabel>
                  {scaleOptions.map((option, index) => (
                    <div key={option.level} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1">
                        <span className="text-sm font-medium">{option.level}</span>
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Nome da escala"
                          value={option.label}
                          onChange={(e) => {
                            const newOptions = [...scaleOptions];
                            newOptions[index].label = e.target.value;
                            setScaleOptions(newOptions);
                          }}
                          data-testid={`input-scale-label-${index}`}
                        />
                      </div>
                      <div className="col-span-8">
                        <Input
                          placeholder="Descrição da escala"
                          value={option.description}
                          onChange={(e) => {
                            const newOptions = [...scaleOptions];
                            newOptions[index].description = e.target.value;
                            setScaleOptions(newOptions);
                          }}
                          data-testid={`input-scale-description-${index}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva a habilidade..." {...field} data-testid="textarea-skill-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="suggestedCertification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificação Sugerida (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CCNA, ITIL Foundation..." {...field} data-testid="input-skill-certification" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="certificationValidityMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validade da Certificação (meses)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 24, 36..." 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          data-testid="input-certification-validity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observações adicionais sobre a habilidade..." {...field} data-testid="textarea-skill-observations" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-create">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createSkillMutation.isPending} data-testid="button-submit-create">
                    {createSkillMutation.isPending ? "Criando..." : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Habilidades</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-skills">{filteredSkills.length}</div>
            <p className="text-xs text-muted-foreground">Habilidades ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificações Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-expired-certs">{expiredCerts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo em 30 dias</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-expiring-certs">{expiringCerts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Certificações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-categories-count">{categories?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Diferentes áreas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar habilidades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-skills"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48" data-testid="select-filter-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="text-gray-500" data-testid="text-loading">Carregando habilidades...</div>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <div className="text-gray-500" data-testid="text-no-skills">Nenhuma habilidade encontrada</div>
          </div>
        ) : (
          filteredSkills.map((skill) => {
            const assignedMembers = getMembersWithSkill(skill.id);

            return (
              <Card key={skill.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{skill.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {skill.description || 'Sem descrição'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{skill.category}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAssignMembers(skill)}
                        title="Atribuir Membros"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(skill)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSkill(skill.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Membros Atribuídos ({assignedMembers.length})
                      </span>
                      {assignedMembers.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAssignMembers(skill)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Gerenciar
                        </Button>
                      )}
                    </div>

                    {assignedMembers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {assignedMembers.slice(0, 5).map((userSkill: UserSkill) => (
                          <Badge key={userSkill.id} variant="secondary" className="text-xs">
                            {userSkill.user.firstName} {userSkill.user.lastName}
                            <span className="ml-1 opacity-70">
                              ({userSkill.proficiencyLevel === 'beginner' ? 'Iniciante' :
                                userSkill.proficiencyLevel === 'intermediate' ? 'Intermediário' :
                                userSkill.proficiencyLevel === 'advanced' ? 'Avançado' : 'Especialista'})
                            </span>
                          </Badge>
                        ))}
                        {assignedMembers.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{assignedMembers.length - 5} mais
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Nenhum membro atribuído ainda
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAssignMembers(skill)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Atribuir Membros
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create User Skill Dialog */}
      <Dialog open={showCreateUserSkill} onOpenChange={setShowCreateUserSkill}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Atribuir Habilidade a Usuário</DialogTitle>
            <DialogDescription>
              Atribua uma habilidade específica a um usuário da equipe.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="skill-select">Habilidade</Label>
                <Select
                  value={newUserSkill.skillId}
                  onValueChange={(value) => setNewUserSkill(prev => ({ ...prev, skillId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma habilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {skills?.map((skill: Skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name} ({skill.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="user-select">Usuário</Label>
                <Select
                  value={newUserSkill.userId}
                  onValueChange={(value) => setNewUserSkill(prev => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers?.map((member: TeamMember) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proficiency">Nível de Proficiência</Label>
                <Select
                  value={newUserSkill.proficiencyLevel}
                  onValueChange={(value: any) => setNewUserSkill(prev => ({ ...prev, proficiencyLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Iniciante</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                    <SelectItem value="expert">Especialista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="experience">Anos de Experiência</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={newUserSkill.yearsOfExperience}
                  onChange={(e) => setNewUserSkill(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações sobre esta habilidade..."
                value={newUserSkill.notes}
                onChange={(e) => setNewUserSkill(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUserSkill(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateUserSkill}
              disabled={createUserSkillMutation.isPending || !newUserSkill.skillId || !newUserSkill.userId}
            >
              {createUserSkillMutation.isPending ? 'Criando...' : 'Atribuir Habilidade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Members to Skill Dialog */}
      <Dialog open={showAssignMembers} onOpenChange={setShowAssignMembers}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Atribuir Membros à Habilidade</DialogTitle>
            <DialogDescription>
              Selecione os membros da equipe para atribuir à habilidade "{selectedSkillForAssignment?.name}".
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Membros já atribuídos:</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedSkillForAssignment && getMembersWithSkill(selectedSkillForAssignment.id).map((userSkill: UserSkill) => (
                  <Badge key={userSkill.id} variant="secondary">
                    {userSkill.user.firstName} {userSkill.user.lastName}
                    <span className="ml-1 text-xs">({userSkill.proficiencyLevel === 'beginner' ? 'Iniciante' :
                      userSkill.proficiencyLevel === 'intermediate' ? 'Intermediário' :
                      userSkill.proficiencyLevel === 'advanced' ? 'Avançado' : 'Especialista'})</span>
                  </Badge>
                ))}
                {selectedSkillForAssignment && getMembersWithSkill(selectedSkillForAssignment.id).length === 0 && (
                  <span className="text-sm text-muted-foreground">Nenhum membro atribuído ainda</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Selecionar novos membros:</h4>
              <div className="max-h-60 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Selecionar</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSkillForAssignment && getAvailableMembers(selectedSkillForAssignment.id).map((member: TeamMember) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedMembers.includes(member.id)}
                            onCheckedChange={(checked) => handleMemberSelection(member.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.role}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {selectedSkillForAssignment && getAvailableMembers(selectedSkillForAssignment.id).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Todos os membros já foram atribuídos a esta habilidade
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignMembers(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignMembers}
              disabled={assignMembersToSkillMutation.isPending || selectedMembers.length === 0}
            >
              {assignMembersToSkillMutation.isPending ? 'Atribuindo...' : `Atribuir ${selectedMembers.length} Membro(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}