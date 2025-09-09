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
  Star
} from "lucide-react";

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

export default function TechnicalSkillsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [scaleOptions, setScaleOptions] = useState(DEFAULT_SCALE_OPTIONS);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: skillsResponse, isLoading } = useQuery<SkillsResponse>({
    queryKey: ["/api/technical-skills/skills"],
  });

  const { data: categoriesResponse } = useQuery<CategoriesResponse>({
    queryKey: ["/api/technical-skills/skills/categories"],
  });

  const { data: expiredCertsResponse } = useQuery<CertificationsResponse>({
    queryKey: ["/api/technical-skills/certifications/expired"],
  });

  const { data: expiringCertsResponse } = useQuery<CertificationsResponse>({
    queryKey: ["/api/technical-skills/certifications/expiring"],
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
    mutationFn: (data: SkillFormData) => 
      apiRequest("POST", "/api/technical-skills/skills", data),
    onSuccess: () => {
      toast({ title: "Habilidade criada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/technical-skills/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/technical-skills/skills/categories"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({ title: "Erro ao criar habilidade", variant: "destructive" });
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

  // Event handlers
  const onCreateSubmit = (data: SkillFormData) => {
    const submitData = {
      ...data,
      scaleOptions: scaleOptions
    };
    createSkillMutation.mutate(submitData);
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
                          {categories?.data?.filter((category: string) => 
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
            <div className="text-2xl font-bold text-red-600" data-testid="text-expired-certs">{expiredCerts?.data?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo em 30 dias</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-expiring-certs">{expiringCerts?.data?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Certificações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-categories-count">{categories?.data?.length || 0}</div>
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
            {categories?.data?.map((category) => (
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
          filteredSkills.map((skill) => (
            <Card key={skill.id} className="hover:shadow-md transition-shadow" data-testid={`card-skill-${skill.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg" data-testid={`text-skill-name-${skill.id}`}>{skill.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" data-testid={`badge-skill-category-${skill.id}`}>{skill.category}</Badge>
                      {renderStars(skill.scaleOptions)}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(skill)}
                      data-testid={`button-edit-skill-${skill.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSkillMutation.mutate(skill.id)}
                      data-testid={`button-delete-skill-${skill.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {skill.description && (
                  <p className="text-sm text-gray-600 mb-3" data-testid={`text-skill-description-${skill.id}`}>{skill.description}</p>
                )}
                {skill.suggestedCertification && (
                  <div className="text-xs text-blue-600" data-testid={`text-skill-certification-${skill.id}`}>
                    <Award className="h-3 w-3 inline mr-1" />
                    {skill.suggestedCertification}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Habilidade</DialogTitle>
            <DialogDescription>
              Modifique os dados da habilidade técnica selecionada.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-skill-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-skill-category">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEFAULT_CATEGORIES.map((category: string) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        {categories?.data?.filter((category: string) => 
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

              {/* Editor de Opções da Escala para Edit */}
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
                        data-testid={`input-edit-scale-label-${index}`}
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
                        data-testid={`input-edit-scale-description-${index}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="textarea-edit-skill-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="suggestedCertification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificação Sugerida (Opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-skill-certification" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="certificationValidityMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validade da Certificação (meses)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        data-testid="input-edit-certification-validity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="textarea-edit-skill-observations" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit">
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateSkillMutation.isPending} data-testid="button-submit-edit">
                  {updateSkillMutation.isPending ? "Atualizando..." : "Atualizar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}