import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
// import useLocalization from '@/hooks/useLocalization';
  Users, 
  TrendingUp, 
  Ticket, 
  Settings, 
  Building, 
  Palette,
  Globe,
  Mail,
  Phone,
  MapPin,
  Upload,
  Save,
  Loader2
} from "lucide-react";
// Schema para configurações de branding
const brandingSchema = z.object({
  // Localization temporarily disabled
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().min(1, "Cor primária é obrigatória"),
  secondaryColor: z.string().min(1, "Cor secundária é obrigatória"),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  supportEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  supportPhone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  timezone: z.string().min(1, "Fuso horário é obrigatório"),
  language: z.string().min(1, "Idioma é obrigatório"),
});
type BrandingFormData = z.infer<typeof brandingSchema>;
export default function TenantAdminGeral() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  // Queries para dados do dashboard
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/tenant-admin/analytics"],
  });
  const { data: teamStats, isLoading: teamStatsLoading } = useQuery({
    queryKey: ["/api/tenant-admin/team/stats"],
  });
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/tenant-admin/users"],
  });
  // Query para configurações de branding
  const { data: brandingData, isLoading: brandingLoading } = useQuery({
    queryKey: ["/api/tenant-admin/branding"],
  });
  // Form para branding
  const form = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      companyName: "",
      logoUrl: "",
      primaryColor: "#3b82f6",
      secondaryColor: "#64748b",
      websiteUrl: "",
      supportEmail: "",
      supportPhone: "",
      address: "",
      description: "",
      timezone: "America/Sao_Paulo",
      language: "pt-BR",
    },
  });
  // Atualizar valores do formulário quando os dados chegarem
  React.useEffect(() => {
    if (brandingData?.settings) {
      const settings = brandingData.settings;
      form.reset({
        companyName: settings.customization?.companyName || "",
        logoUrl: settings.logo?.url || "",
        primaryColor: settings.colors?.primary || "#3b82f6",
        secondaryColor: settings.colors?.secondary || "#64748b",
        websiteUrl: settings.customization?.helpUrl || "",
        supportEmail: settings.customization?.supportEmail || "",
        supportPhone: settings.customization?.supportPhone || "",
        address: settings.customization?.address || "",
        description: settings.customization?.welcomeMessage || "",
        timezone: settings.localization?.timezone || "America/Sao_Paulo",
        language: settings.localization?.language || "pt-BR",
      });
    }
  }, [brandingData, form]);
  // Mutation para salvar branding
  const updateBrandingMutation = useMutation({
    mutationFn: (data: BrandingFormData) => {
      // Transformar os dados do formulário para a estrutura esperada pelo backend
      const brandingSettings = {
        logo: {
          url: data.logoUrl,
          displayName: data.companyName,
          width: "120px",
          height: "40px"
        },
        colors: {
          primary: data.primaryColor,
          secondary: data.secondaryColor,
          accent: "#8B5CF6",
          background: "#FFFFFF",
          surface: "#F8FAFC",
          text: "#1E293B",
          muted: "#64748B"
        },
        customization: {
          companyName: data.companyName,
          welcomeMessage: data.description,
          footerText: "",
          supportEmail: data.supportEmail,
          supportPhone: data.supportPhone,
          address: data.address,
          helpUrl: data.websiteUrl,
          showPoweredBy: true
        },
        localization: {
          timezone: data.timezone,
          language: data.language,
          dateFormat: "dd/MM/yyyy",
          timeFormat: "24h",
          currency: "BRL"
        }
      };
      
      return apiRequest("PUT", "/api/tenant-admin/branding", { settings: brandingSettings });
    },
    onSuccess: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "As configurações de branding foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-admin/branding"] });
    },
    onError: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    },
  });
  const onSubmit = (data: BrandingFormData) => {
    updateBrandingMutation.mutate(data);
  };
  // Cards de estatísticas do dashboard
  const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <Card>
      <CardContent className=""
        <div className=""
          <div>
            <p className="text-lg">"{title}</p>
            <p className="text-lg">"{value}</p>
            {trend && (
              <p className=""
                <span className="text-lg">"+{trend}%</span> vs mês anterior
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
  if (analyticsLoading || teamStatsLoading || usersLoading || brandingLoading) {
    return (
      <div className=""
        <div className=""
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }
  return (
    <div className=""
      <div className=""
        <div>
          <h1 className="text-lg">"Geral</h1>
          <p className=""
            Dashboard e configurações gerais do workspace
          </p>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className=""
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="branding">Branding & Personalização</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className=""
          {/* Estatísticas principais */}
          <div className=""
            <StatCard
              title='[TRANSLATION_NEEDED]'
              value={(analytics as any)?.totalCustomers || 0}
              icon={Users}
              trend={12}
            />
            <StatCard
              title='[TRANSLATION_NEEDED]'
              value={(analytics as any)?.totalTickets || 0}
              icon={Ticket}
              trend={8}
            />
            <StatCard
              title="Membros da Equipe"
              value={(teamStats as any)?.totalMembers || 0}
              icon={Building}
              trend={5}
            />
            <StatCard
              title="Taxa de Resolução"
              value={"%"
              icon={TrendingUp}
              trend={3}
            />
          </div>
          {/* Seção de atividade recente */}
          <div className=""
            <Card>
              <CardHeader>
                <CardTitle>Atividade da Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=""
                  <div className=""
                    <span className="text-lg">"Membros ativos hoje</span>
                    <Badge variant="secondary">{(teamStats as any)?.activeToday || 0}</Badge>
                  </div>
                  <div className=""
                    <span className="text-lg">"Performance média</span>
                    <Badge variant="outline">{(teamStats as any)?.averagePerformance || 0}%</Badge>
                  </div>
                  <div className=""
                    <span className="text-lg">"Novos membros (mês)</span>
                    <Badge variant="default">{(teamStats as any)?.newMembersThisMonth || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=""
                  <div className=""
                    <span className="text-lg">"Abertos</span>
                    <Badge variant="destructive">{(analytics as any)?.openTickets || 0}</Badge>
                  </div>
                  <div className=""
                    <span className="text-lg">"Em progresso</span>
                    <Badge variant="default">{(analytics as any)?.inProgressTickets || 0}</Badge>
                  </div>
                  <div className=""
                    <span className="text-lg">"Resolvidos (mês)</span>
                    <Badge variant="secondary">{(analytics as any)?.resolvedThisMonth || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="branding" className=""
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className=""
              <div className=""
                {/* Informações da Empresa */}
                <Card>
                  <CardHeader>
                    <CardTitle className=""
                      <Building className="h-5 w-5" />
                      Informações da Empresa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className=""
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="Minha Empresa Ltda" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descrição da empresa..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="websiteUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site da Empresa</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://minhaempresa.com.br"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                {/* Configurações Visuais */}
                <Card>
                  <CardHeader>
                    <CardTitle className=""
                      <Palette className="h-5 w-5" />
                      Configurações Visuais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className=""
                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL do Logo</FormLabel>
                          <FormControl>
                            <div className=""
                              <Input 
                                placeholder="https://exemplo.com/logo.png"
                                {...field}
                              />
                              <Button type="button" variant="outline" size="icon>
                                <Upload className="h-4 w-4" />
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className=""
                      <FormField
                        control={form.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cor Primária</FormLabel>
                            <FormControl>
                              <div className=""
                                <Input type="color" {...field} className="w-16 h-10" />
                                <Input {...field} placeholder="#3b82f6" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cor Secundária</FormLabel>
                            <FormControl>
                              <div className=""
                                <Input type="color" {...field} className="w-16 h-10" />
                                <Input {...field} placeholder="#64748b" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                {/* Informações de Contato */}
                <Card>
                  <CardHeader>
                    <CardTitle className=""
                      <Mail className="h-5 w-5" />
                      Informações de Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className=""
                    <FormField
                      control={form.control}
                      name="supportEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email de Suporte</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="suporte@minhaempresa.com.br"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supportPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone de Suporte</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                {/* Configurações Regionais */}
                <Card>
                  <CardHeader>
                    <CardTitle className=""
                      <Globe className="h-5 w-5" />
                      Configurações Regionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className=""
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuso Horário</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="America/Sao_Paulo">América/São Paulo (BRT)</SelectItem>
                              <SelectItem value="America/New_York">América/Nova York (EST)</SelectItem>
                              <SelectItem value="Europe/London">Europa/Londres (GMT)</SelectItem>
                              <SelectItem value="Asia/Tokyo">Ásia/Tóquio (JST)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Idioma</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                              <SelectItem value="en-US">English (US)</SelectItem>
                              <SelectItem value="es-ES">Español</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
              <div className=""
                <Button
                  type="submit"
                  disabled={updateBrandingMutation.isPending}
                  className="min-w-[120px]"
                >
                  {updateBrandingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}