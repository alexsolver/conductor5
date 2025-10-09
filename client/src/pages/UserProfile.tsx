import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Settings, 
  Activity, 
  Award, 
  Bell, 
  Globe, 
  Lock,
  Camera,
  Edit,
  Save,
  X,
  Download,
  Trash2,
  FileText,
  AlertTriangle,
  Trophy,
  Star,
  BookOpen,
  LogIn,
  LogOut,
  Plus
} from "lucide-react";
import NotificationPreferencesTab from '@/components/NotificationPreferencesTab';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const profileSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // Fetch user profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: !!user,
  });

  // Fetch user activity
  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/user/activity'],
    enabled: !!user,
  });

  // Fetch user skills
  const { data: skills, isLoading: skillsLoading } = useQuery({
    queryKey: ['/api/user/skills'],
    enabled: !!user,
  });

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: ['/api/user/preferences'],
    enabled: !!user,
  });

  // Fetch security sessions
  const { data: sessions } = useQuery({
    queryKey: ['/api/user/security/sessions'],
    enabled: !!user,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      bio: "",
      location: "",
      timezone: "",
      dateOfBirth: "",
      address: "",
    },
  });

  // Update form when profile data loads following 1qa.md patterns
  useEffect(() => {
    if (profile && typeof profile === 'object') {
      console.log('[PROFILE-FORM] Updating form with profile data:', profile);
      const profileData = profile as any; // Type assertion para evitar erros
      form.reset({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        department: profileData.department || "",
        position: profileData.position || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
        timezone: profileData.timezone || "",
        dateOfBirth: profileData.dateOfBirth || "",
        address: profileData.address || "",
      });
    }
  }, [profile, form]);

  // Update profile mutation following 1qa.md patterns
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      console.log('[PROFILE-UPDATE] Starting profile update mutation');
      const response = await apiRequest('PUT', '/api/user/profile', data);
      if (!response.ok) {
        throw new Error(`Profile update failed: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (updatedData) => {
      console.log('[PROFILE-UPDATE] Success with data:', updatedData);
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      setIsEditing(false);
      // ✅ CORRETO - Refetch profile data and user auth to update header, seguindo 1qa.md
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: any) => {
      console.error('[PROFILE-UPDATE] Error details:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    console.log('[PROFILE-FORM] Submitting form data:', data);
    updateProfileMutation.mutate(data);
  };

  // Profile photo upload mutation following 1qa.md patterns
  const uploadPhotoMutation = useMutation({
    mutationFn: async (avatarURL: string) => {
      console.log('[PHOTO-UPLOAD] Starting photo upload mutation');
      const response = await apiRequest('PUT', '/api/user/profile/photo', { avatarURL });
      if (!response.ok) {
        throw new Error(`Photo upload failed: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('[PHOTO-UPLOAD] Success:', data);
      const newAvatarUrl = data.data?.avatarURL || data.data?.avatar_url;

      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });

      // ✅ CRITICAL FIX: Update both profile and header queries - seguindo 1qa.md
      queryClient.invalidateQueries({ 
        queryKey: ['/api/user/profile'],
        exact: true
      });

      // ✅ Use setQueryData for immediate update without triggering auth refetch
      queryClient.setQueryData(['/api/user/profile'], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            avatar: newAvatarUrl,
            avatar_url: newAvatarUrl,
            updatedAt: new Date().toISOString()
          };
        }
        return oldData;
      });

      // ✅ Force header to refetch profile data for avatar update
      queryClient.refetchQueries({ 
        queryKey: ['/api/user/profile'],
        exact: true
      });
    },
    onError: (error: any) => {
      console.error('[PHOTO-UPLOAD] Error details:', error);
      toast({
        title: "Erro ao atualizar foto",
        description: "Não foi possível atualizar sua foto de perfil.",
        variant: "destructive",
      });
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await apiRequest('PUT', '/api/user/security/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      });
      setShowPasswordDialog(false);
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    },
  });

  // Preferences mutations
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', '/api/user/preferences', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferências atualizadas",
        description: "Suas preferências foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as preferências.",
        variant: "destructive",
      });
    },
  });

  // Handle direct photo upload
  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A foto deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload file directly to backend
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/profile/photo/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'x-tenant-id': user?.tenantId || '',
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      // Update profile with the object path
      if (data.objectPath) {
        uploadPhotoMutation.mutate(data.objectPath);
      }
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload da foto.",
        variant: "destructive",
      });
    }
  };

  // Handle password submit
  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  // Handle preference changes
  const handlePreferenceChange = (key: string, value: any) => {
    const preferencesData = preferences && typeof preferences === 'object' ? (preferences as any).data : {};
    updatePreferencesMutation.mutate({
      ...preferencesData,
      [key]: value,
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const userSkills = (skills as any)?.data || [];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie suas informações pessoais e preferências</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-52 w-52">
                <AvatarImage src={(profile as any)?.avatar || (profile as any)?.avatar_url || ""} />
                <AvatarFallback className="text-3xl">
                  {((profile as any)?.firstName || user?.firstName)?.charAt(0)}{((profile as any)?.lastName || user?.lastName)?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="photo-upload" 
                className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full p-0 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center cursor-pointer"
                data-testid="button-upload-photo"
              >
                <Camera className="h-2.5 w-2.5" />
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                  data-testid="input-photo-file"
                />
              </label>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{(profile as any)?.firstName || user?.firstName} {(profile as any)?.lastName || user?.lastName}</h2>
              <p className="text-gray-600 dark:text-gray-400">{(profile as any)?.email || user?.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline">{(profile as any)?.role || user?.role}</Badge>
                {(profile as any)?.department && <Badge variant="secondary">{(profile as any).department}</Badge>}
              </div>
            </div>
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={() => setIsEditing(!isEditing)}
              className="ml-auto"
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Perfil
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="personal" className="text-xs md:text-sm">
            <User className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Pessoal</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="text-xs md:text-sm">
            <Award className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Habilidades</span>
            <span className="sm:hidden">Skills</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs md:text-sm">
            <Shield className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Segurança</span>
            <span className="sm:hidden">Sec</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs md:text-sm">
            <Settings className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Preferências</span>
            <span className="sm:hidden">Pref</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs md:text-sm">
            <Activity className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Atividade</span>
            <span className="sm:hidden">Ativ</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs md:text-sm">
            <Bell className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Notificações</span>
            <span className="sm:hidden">Not</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e de contato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobrenome</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing || user?.role !== 'saas_admin'} type="email" />
                          </FormControl>
                          <FormDescription>
                            {user?.role !== 'saas_admin' 
                              ? "Apenas administradores podem alterar o email" 
                              : (!isEditing ? "Clique em 'Editar Perfil' para alterar o email" : "Digite seu email")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departamento</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio / Descrição</FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={!isEditing} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Localização</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuso Horário</FormLabel>
                          <Select disabled={!isEditing} value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o fuso horário" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                              <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                              <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        )}
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Minhas Habilidades Técnicas
              </CardTitle>
              <CardDescription>
                Visualize suas habilidades técnicas configuradas e níveis de proficiência
              </CardDescription>
            </CardHeader>
            <CardContent>
              {skillsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Carregando habilidades...</span>
                </div>
              ) : userSkills.length > 0 ? (
                <div className="space-y-4">
                  {/* Skills Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Trophy className="h-6 w-6 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total de Habilidades</p>
                          <p className="text-2xl font-bold text-blue-600">{userSkills.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Star className="h-6 w-6 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Nível Médio</p>
                          <p className="text-2xl font-bold text-green-600">
                            {userSkills.length > 0 
                              ? (userSkills.reduce((sum, skill) => sum + (skill.level || skill.proficiencyLevel || 1), 0) / userSkills.length).toFixed(1)
                              : '0'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="flex items-center">
                        <BookOpen className="h-6 w-6 text-purple-600 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Categorias</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {new Set(userSkills.map(skill => skill.skill?.category || skill.skillCategory)).size}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills List */}
                  <div className="space-y-3">
                    {userSkills.map((userSkill) => {
                      const skill = userSkill.skill || {};
                      const skillName = skill.name || userSkill.skillName || 'Habilidade sem nome';
                      const skillCategory = skill.category || userSkill.skillCategory || 'Categoria não definida';
                      const proficiencyLevel = userSkill.level || userSkill.proficiencyLevel || 1;
                      const yearsOfExperience = userSkill.yearsOfExperience || 0;

                      // ✅ 1QA.MD: Proficiency level mapping following established patterns
                      const getProficiencyInfo = (level) => {
                        const levels = {
                          1: { name: 'Básico', color: 'bg-gray-500', description: 'Conhecimento introdutório' },
                          2: { name: 'Intermediário', color: 'bg-blue-500', description: 'Alguma autonomia' },
                          3: { name: 'Avançado', color: 'bg-green-500', description: 'Executa com autonomia' },
                          4: { name: 'Especialista', color: 'bg-yellow-500', description: 'Referência técnica' },
                          5: { name: 'Excelência', color: 'bg-purple-500', description: 'Comprovada por resultados' },
                          'beginner': { name: 'Iniciante', color: 'bg-gray-500', description: 'Conhecimento básico' },
                          'intermediate': { name: 'Intermediário', color: 'bg-blue-500', description: 'Conhecimento moderado' },
                          'advanced': { name: 'Avançado', color: 'bg-green-500', description: 'Conhecimento avançado' },
                          'expert': { name: 'Especialista', color: 'bg-purple-500', description: 'Conhecimento especializado' }
                        };
                        return levels[level] || levels[1];
                      };

                      const proficiencyInfo = getProficiencyInfo(proficiencyLevel);

                      return (
                        <div key={userSkill.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{skillName}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {skillCategory}
                                </Badge>
                              </div>

                              <div className="mt-2 flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Nível:</span>
                                  <Badge className={`text-xs text-white ${proficiencyInfo.color}`}>
                                    {proficiencyInfo.name}
                                  </Badge>
                                </div>

                                {yearsOfExperience > 0 && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Experiência:</span>
                                    <span className="text-sm font-medium">{yearsOfExperience} anos</span>
                                  </div>
                                )}
                              </div>

                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {proficiencyInfo.description}
                              </p>

                              {userSkill.notes && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">
                                  "{userSkill.notes}"
                                </p>
                              )}
                            </div>

                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= (typeof proficiencyLevel === 'number' ? proficiencyLevel : 1)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Nenhuma habilidade configurada
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Você ainda não possui habilidades técnicas configuradas no sistema.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Entre em contato com seu administrador para configurar suas habilidades.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Configurações de Notificação</h3>
                <Badge variant="outline">Beta</Badge>
              </div>
              <NotificationPreferencesTab />
            </div>
          </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Gerencie a segurança da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Alterar Senha</h4>
                    <p className="text-sm text-gray-600">Atualize sua senha de acesso</p>
                  </div>
                  <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Lock className="h-4 w-4 mr-2" />
                        Alterar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Alterar Senha</DialogTitle>
                        <DialogDescription>
                          Digite sua senha atual e a nova senha para alterar.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha Atual</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nova Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmar Nova Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={changePasswordMutation.isPending}>
                              {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Sessões Ativas</h4>
                    <p className="text-sm text-gray-600">Gerencie dispositivos conectados</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Ver Sessões</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                      <DialogHeader>
                        <DialogTitle>Sessões Ativas</DialogTitle>
                        <DialogDescription>
                          Dispositivos conectados à sua conta
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        {Array.isArray((sessions as any)?.data) && (sessions as any).data.length > 0 ? (
                          (sessions as any).data.map((session: any) => (
                            <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{session.device}</p>
                                <p className="text-sm text-gray-600">{session.location}</p>
                                <p className="text-xs text-gray-500">
                                  Última atividade: {new Date(session.lastActivity).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              {session.current && (
                                <Badge variant="default">Atual</Badge>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-4">Nenhuma sessão ativa encontrada</p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Logs de Segurança</h4>
                    <p className="text-sm text-gray-600">Histórico de atividades de segurança</p>
                  </div>
                  <Button variant="outline">Ver Logs</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
              <CardDescription>
                Configure suas preferências de sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="language">Idioma</Label>
                    <p className="text-sm text-gray-600">Selecione seu idioma preferido</p>
                  </div>
                  <Select 
                    value={(preferences as any)?.data?.language || "pt-BR"}
                    onValueChange={(value) => handlePreferenceChange('language', value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (BR)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Notificações por Email</Label>
                    <p className="text-sm text-gray-600">Receber notificações por email</p>
                  </div>
                  <Switch 
                    id="notifications" 
                    checked={(preferences as any)?.data?.emailNotifications ?? true}
                    onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Notificações Push</Label>
                    <p className="text-sm text-gray-600">Receber notificações no navegador</p>
                  </div>
                  <Switch 
                    id="push-notifications" 
                    checked={(preferences as any)?.data?.pushNotifications ?? true}
                    onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode">Modo Escuro</Label>
                    <p className="text-sm text-gray-600">Usar tema escuro na interface</p>
                  </div>
                  <Switch 
                    id="dark-mode" 
                    checked={(preferences as any)?.data?.darkMode ?? false}
                    onCheckedChange={(checked) => handlePreferenceChange('darkMode', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="email-signature">Assinatura de E-mail</Label>
                  <p className="text-sm text-gray-600">Configure sua assinatura padrão para envio de e-mails</p>
                  <Textarea
                    id="email-signature"
                    data-testid="input-email-signature"
                    placeholder={`Atenciosamente,\n${(profile as any)?.firstName || user?.firstName} ${(profile as any)?.lastName || user?.lastName}\n${(profile as any)?.position || (profile as any)?.cargo || ''}\n${(profile as any)?.email || user?.email}\n${(profile as any)?.phone || (profile as any)?.cellPhone || ''}`}
                    value={(profile as any)?.emailSignature || ''}
                    onChange={(e) => updateProfileMutation.mutate({ emailSignature: e.target.value })}
                    className="min-h-[150px] font-mono text-sm"
                    data-testid="textarea-email-signature"
                  />
                  <p className="text-xs text-gray-500">
                    Esta assinatura será inserida automaticamente ao enviar e-mails a partir dos tickets
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                  <CardDescription>Histórico de ações realizadas no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  {activityLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border animate-pulse">
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activity?.data?.length > 0 || activity?.length > 0 ? (
                        (activity?.data || activity || []).map((item: any, index: number) => (
                          <div key={item.id || index} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex-shrink-0">
                              {item.action?.includes('login') ? (
                                <LogIn className="h-4 w-4 text-green-600" />
                              ) : item.action?.includes('logout') ? (
                                <LogOut className="h-4 w-4 text-red-600" />
                              ) : item.action?.includes('update') || item.action?.includes('edit') ? (
                                <Edit className="h-4 w-4 text-blue-600" />
                              ) : item.action?.includes('create') ? (
                                <Plus className="h-4 w-4 text-green-600" />
                              ) : item.action?.includes('delete') ? (
                                <Trash2 className="h-4 w-4 text-red-600" />
                              ) : (
                                <Activity className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.action || item.description || 'Ação realizada no sistema'}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {item.timestamp ? 
                                    new Date(item.timestamp).toLocaleString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit', 
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) :
                                    item.createdAt ? 
                                      new Date(item.createdAt).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit', 
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) :
                                      item.performedAt ?
                                        new Date(item.performedAt).toLocaleString('pt-BR', {
                                          day: '2-digit',
                                          month: '2-digit', 
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        }) :
                                        'Data não disponível'
                                  }
                                </span>
                                {item.ipAddress && (
                                  <>
                                    <span>•</span>
                                    <span>IP: {item.ipAddress}</span>
                                  </>
                                )}
                                {item.resource && (
                                  <>
                                    <span>•</span>
                                    <span>{item.resource}</span>
                                  </>
                                )}
                              </div>
                              {item.details && typeof item.details === 'object' && (
                                <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                  {Object.entries(item.details).slice(0, 2).map(([key, value]) => (
                                    <span key={key} className="inline-block mr-2">
                                      {key}: {String(value)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {item.success !== undefined && (
                              <div className="flex-shrink-0">
                                <Badge variant={item.success ? "default" : "destructive"} className="text-xs">
                                  {item.success ? "Sucesso" : "Falha"}
                                </Badge>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Activity className="h-12 w-12 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Nenhuma atividade registrada
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            Suas atividades recentes no sistema aparecerão aqui quando você realizar ações como login, edição de perfil, etc.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity Statistics - following 1qa.md patterns */}
              {activity?.data?.length > 0 || activity?.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">
                        {activity?.data?.length || activity?.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total de Atividades
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">
                        {activity?.data?.filter((a: any) => a.success !== false).length || 
                         activity?.filter((a: any) => a.success !== false).length || 
                         activity?.data?.length || activity?.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ações Bem-sucedidas
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-orange-600">
                        {activity?.data?.filter((a: any) => a.action?.includes('login')).length || 
                         activity?.filter((a: any) => a.action?.includes('login')).length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total de Logins
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </TabsContent>

        {/* Privacy & GDPR/LGPD Tab - Seguindo 1qa.md */}
        <TabsContent value="privacy-gdpr">
          <PrivacyGdprTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ✅ Componente Privacidade & GDPR/LGPD - Seguindo especificações rigorosas do 1qa.md
function PrivacyGdprTab() {
  const { toast } = useToast();
  const [showPolicyDialog, setShowPolicyDialog] = useState(false); // ✅ Estado para modal seguindo 1qa.md

  // ✅ Fetch GDPR user preferences
  const { data: gdprPreferences, refetch: refetchPreferences } = useQuery({
    queryKey: ['/api/gdpr-compliance/user-preferences'],
    enabled: true,
  });

  // ✅ Fetch data subject requests
  const { data: dataRequests } = useQuery({
    queryKey: ['/api/gdpr-compliance/data-subject-requests'],
    enabled: true,
  });

  // ✅ Fetch current privacy policy version
  const { data: privacyPolicy } = useQuery({
    queryKey: ['/api/gdpr-compliance/current-privacy-policy'],
    enabled: true,
  });

  // ✅ Fetch admin privacy policies (ativa) - Seguindo 1qa.md
  const { data: adminPolicies } = useQuery({
    queryKey: ['/api/gdpr-compliance/admin/privacy-policies'],
    enabled: true,
  });

  // ✅ Mutations for user actions
  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences: any) => apiRequest('PUT', '/api/gdpr-compliance/user-preferences', preferences),
    onSuccess: () => {
      toast({ title: "Preferências atualizadas com sucesso" });
      refetchPreferences();
    }
  });

  const exportDataMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/gdpr-compliance/export-my-data', { format: 'json' }),
    onSuccess: () => {
      toast({ title: "Solicitação de exportação criada", description: "Você receberá um e-mail com seus dados" });
    }
  });

  const deleteDataMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/gdpr-compliance/request-data-deletion', { requestType: 'erasure', requestDetails: 'Direito ao esquecimento' }),
    onSuccess: () => {
      toast({ title: "Solicitação de exclusão criada", description: "Processaremos sua solicitação em até 30 dias" });
    }
  });

  const correctDataMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/gdpr-compliance/request-data-correction', { requestType: 'rectification', requestDetails: 'Correção de dados pessoais' }),
    onSuccess: () => {
      toast({ title: "Solicitação de correção criada", description: "Analisaremos sua solicitação" });
    }
  });

  const limitUsageMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/gdpr-compliance/limit-data-usage', { requestType: 'restriction', requestDetails: 'Limitação de uso de dados' }),
    onSuccess: () => {
      toast({ title: "Limitação de uso ativada", description: "Dados serão usados apenas para contratos essenciais" });
    }
  });

  const preferences = (gdprPreferences as any)?.data || {};
  const policyData = (privacyPolicy as any)?.data || {};

  // ✅ Buscar política ativa do admin - Seguindo 1qa.md
  const activePolicyFromAdmin = (adminPolicies as any)?.data?.find((policy: any) => policy.isActive) || 
                                (adminPolicies as any)?.data?.[0] || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lock className="h-5 w-5" />
          <span>Privacidade & GDPR/LGPD</span>
        </CardTitle>
        <CardDescription>
          Gerencie suas preferências de privacidade e direitos de proteção de dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* ✅ Política de Privacidade Atual */}
        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Política de Privacidade</span>
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Versão ativa: {activePolicyFromAdmin.version || policyData.version || "1.0"} - {activePolicyFromAdmin.effectiveDate ? new Date(activePolicyFromAdmin.effectiveDate).toLocaleDateString('pt-BR') : (policyData.acceptedAt ? new Date(policyData.acceptedAt).toLocaleDateString('pt-BR') : "Primeira vez")}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPolicyDialog(true)} // ✅ Handler seguindo 1qa.md
              data-testid="button-view-full-policy"
            >
              <FileText className="h-4 w-4 mr-2" />
              Ver Política Completa
            </Button>
          </div>
        </div>

        <Separator />

        {/* ✅ Gerenciar Consentimento */}
        <div className="space-y-4">
          <h4 className="font-medium">Gerenciar Consentimento</h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="font-medium">Cookies de Marketing</Label>
                <p className="text-sm text-gray-600">Permitir cookies para personalização de anúncios</p>
              </div>
              <Switch
                checked={preferences.emailMarketing || false}
                onCheckedChange={(checked) => 
                  updatePreferencesMutation.mutate({ ...preferences, emailMarketing: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="font-medium">Comunicação por SMS</Label>
                <p className="text-sm text-gray-600">Receber comunicações de marketing por SMS</p>
              </div>
              <Switch
                checked={preferences.smsMarketing || false}
                onCheckedChange={(checked) => 
                  updatePreferencesMutation.mutate({ ...preferences, smsMarketing: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="font-medium">Análise de Dados</Label>
                <p className="text-sm text-gray-600">Permitir análise para melhoria de serviços</p>
              </div>
              <Switch
                checked={preferences.dataProcessingForAnalytics || false}
                onCheckedChange={(checked) => 
                  updatePreferencesMutation.mutate({ ...preferences, dataProcessingForAnalytics: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="font-medium">Visibilidade do Perfil</Label>
                <p className="text-sm text-gray-600">Controlar visibilidade das informações do perfil</p>
              </div>
              <Select
                value={preferences.profileVisibility || 'private'}
                onValueChange={(value) => 
                  updatePreferencesMutation.mutate({ ...preferences, profileVisibility: value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Privado</SelectItem>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="restricted">Restrito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* ✅ Direitos do Usuário */}
        <div className="space-y-4">
          <h4 className="font-medium">Seus Direitos de Proteção de Dados</h4>
          <p className="text-sm text-gray-600">
            Conforme GDPR/LGPD, você tem os seguintes direitos sobre seus dados pessoais:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baixar Meus Dados */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium">Baixar Meus Dados</h5>
                  <p className="text-sm text-gray-600">Exportar todos os seus dados (JSON/CSV/PDF)</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportDataMutation.mutate()}
                  disabled={exportDataMutation.isPending}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Corrigir Dados */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium">Corrigir Dados</h5>
                  <p className="text-sm text-gray-600">Solicitar correção de informações incorretas</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => correctDataMutation.mutate()}
                  disabled={correctDataMutation.isPending}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Limitar Uso */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium">Limitar Uso</h5>
                  <p className="text-sm text-gray-600">Suspender marketing, manter contratos essenciais</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => limitUsageMutation.mutate()}
                  disabled={limitUsageMutation.isPending}
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Excluir Meus Dados */}
            <div className="p-4 border rounded-lg border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-red-600 dark:text-red-400">Excluir Meus Dados</h5>
                  <p className="text-sm text-gray-600">Direito ao esquecimento (ação irreversível)</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Tem certeza? Esta ação é irreversível.")) {
                      deleteDataMutation.mutate();
                    }
                  }}
                  disabled={deleteDataMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Histórico de Solicitações */}
        <Separator />
        <div className="space-y-4">
          <h4 className="font-medium">Histórico de Solicitações</h4>

          {(dataRequests as any)?.data && (dataRequests as any).data.length > 0 ? (
            <div className="space-y-2">
              {(dataRequests as any).data.map((request: any) => (
                <div key={request.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">{request.requestType}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                    {request.status === 'pending' ? 'Pendente' : 
                     request.status === 'processing' ? 'Processando' : 'Concluído'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhuma solicitação encontrada</p>
          )}
        </div>

        {/* ✅ Dialog para exibir política completa - Seguindo 1qa.md */}
        <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {activePolicyFromAdmin.title || "Política de Privacidade"} - Versão {activePolicyFromAdmin.version || policyData.version || "1.0"}
              </DialogTitle>
              <DialogDescription>
                Efetiva desde: {activePolicyFromAdmin.effectiveDate ? 
                  new Date(activePolicyFromAdmin.effectiveDate).toLocaleDateString('pt-BR') : 
                  (policyData.effectiveDate ? 
                    new Date(policyData.effectiveDate).toLocaleDateString('pt-BR') : 
                    new Date().toLocaleDateString('pt-BR')
                  )
                }
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ 
                  __html: activePolicyFromAdmin.content || policyData.content || 
                    `<h2>Política de Privacidade</h2>
                     <p>Esta política descreve como coletamos, usamos e protegemos seus dados pessoais conforme GDPR/LGPD.</p>
                     <h3>1. Dados Coletados</h3>
                     <p>Coletamos informações que você fornece diretamente, como nome, email e dados de perfil.</p>
                     <h3>2. Uso dos Dados</h3>
                     <p>Utilizamos seus dados para fornecer nossos serviços e melhorar sua experiência.</p>
                     <h3>3. Seus Direitos</h3>
                     <p>Você tem direito ao acesso, correção, exclusão e portabilidade de seus dados.</p>` 
                }}
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowPolicyDialog(false)}
                data-testid="button-close-policy-dialog"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
}