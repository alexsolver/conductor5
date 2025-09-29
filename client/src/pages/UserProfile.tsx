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
  AlertTriangle
} from "lucide-react";
import NotificationPreferencesTab from "@/components/NotificationPreferencesTab";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { UploadResult } from "@uppy/core";

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
  const { data: activity } = useQuery({
    queryKey: ['/api/user/activity'],
    enabled: !!user,
  });

  // Fetch user skills
  const { data: skills } = useQuery({
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

  // Handle photo upload
  const handlePhotoUpload = async () => {
    try {
      const response = await apiRequest('POST', '/api/user/profile/photo/upload');
      if (!response.ok) {
        throw new Error(`Upload URL request failed: ${response.status}`);
      }
      const data = await response.json();
      
      // Validate that we have a proper upload URL
      if (!data.success || !data.uploadURL) {
        throw new Error('Invalid upload URL response');
      }
      
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('[PHOTO-UPLOAD] Error getting upload URL:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível obter URL de upload.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handlePhotoComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    console.log('[PHOTO-UPLOAD] Upload complete:', result);
    
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      
      // For mock environment, use the upload URL as the final avatar URL
      const avatarURL = uploadedFile.uploadURL || uploadedFile.source;
      
      if (avatarURL) {
        uploadPhotoMutation.mutate(avatarURL as string);
      } else {
        console.error('[PHOTO-UPLOAD] No valid URL found in upload result');
        toast({
          title: "Erro no upload",
          description: "Não foi possível processar o upload da foto.",
          variant: "destructive",
        });
      }
    } else {
      console.error('[PHOTO-UPLOAD] Upload failed or no successful uploads');
      toast({
        title: "Erro no upload",
        description: "O upload da foto falhou.",
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
              <Avatar className="h-20 w-20">
                <AvatarImage src={(profile as any)?.avatar || (profile as any)?.avatar_url || ""} />
                <AvatarFallback className="text-lg">
                  {((profile as any)?.firstName || user?.firstName)?.charAt(0)}{((profile as any)?.lastName || user?.lastName)?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5242880} // 5MB
                onGetUploadParameters={handlePhotoUpload}
                onComplete={handlePhotoComplete}
                buttonClassName="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              >
                <Camera className="h-4 w-4" />
              </ObjectUploader>
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="personal" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Pessoal</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Habilidades</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="privacy-gdpr" className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Privacidade & GDPR/LGPD</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Preferências</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Atividade</span>
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
              <CardTitle>Habilidades Técnicas</CardTitle>
              <CardDescription>
                Visualize e gerencie suas habilidades e competências
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Suas habilidades técnicas serão exibidas aqui. Integração com o módulo de habilidades em desenvolvimento.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.isArray(skills) && skills.length > 0 ? (
                    skills.map((skill: any) => (
                      <div key={skill.id} className="p-4 border rounded-lg">
                        <h4 className="font-medium">{skill.name}</h4>
                        <p className="text-sm text-gray-600">{skill.category}</p>
                        <div className="mt-2">
                          <Badge variant={skill.level === 'expert' ? 'default' : 'secondary'}>
                            {skill.level}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Nenhuma habilidade cadastrada</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <NotificationPreferencesTab />
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Histórico das suas atividades no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(activity) && activity.length > 0 ? (
                  activity.map((item: any, index: number) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <Activity className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">Nenhuma atividade recente</p>
                )}
              </div>
            </CardContent>
          </Card>
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