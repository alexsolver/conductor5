import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
// import useLocalization from '@/hooks/useLocalization';
  Palette, 
  Upload, 
  Eye, 
  Save, 
  RotateCcw, 
  Paintbrush,
  Image,
  Type,
  Monitor,
  Smartphone,
  Mail,
  Globe,
  Settings
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
interface BrandingSettings {
  logo: {
    url: string;
    darkUrl: string;
    favicon: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    headingFont: string;
  };
  layout: {
    sidebarStyle: string;
    headerStyle: string;
    borderRadius: string;
    spacing: string;
  };
  customization: {
    companyName: string;
    welcomeMessage: string;
    footerText: string;
    supportEmail: string;
    helpUrl: string;
    showPoweredBy: boolean;
  };
  themes: {
    defaultTheme: string;
    allowUserThemeSwitch: boolean;
    customCss: string;
  };
}
const defaultSettings: BrandingSettings = {
  // Localization temporarily disabled
  logo: {
    url: "",
    darkUrl: "",
    favicon: ""
  },
  colors: {
    primary: "#8B5CF6",
    secondary: "#EC4899",
    accent: "#F59E0B",
    background: "#FFFFFF",
    surface: "#F8FAFC",
    text: "#1E293B",
    muted: "#64748B"
  },
  typography: {
    fontFamily: "Inter",
    fontSize: "14px",
    headingFont: "Inter"
  },
  layout: {
    sidebarStyle: "modern",
    headerStyle: "clean",
    borderRadius: "8px",
    spacing: "normal"
  },
  customization: {
    companyName: "",
    welcomeMessage: "Bem-vindo ao nosso sistema de suporte",
    footerText: "",
    supportEmail: "",
    helpUrl: "",
    showPoweredBy: true
  },
  themes: {
    defaultTheme: "light",
    allowUserThemeSwitch: true,
    customCss: ""
  }
};
export default function TenantAdminBranding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<BrandingSettings>(defaultSettings);
  const [previewMode, setPreviewMode] = useState(false);
  // Verificar se usuário é tenant admin ou superior
  if (!user || !['tenant_admin', 'saas_admin'].includes(user.role)) {
    return (
      <div className="p-4"
        <Palette className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="p-4"
          Acesso Negado
        </h1>
        <p className="p-4"
          Esta página é restrita para administradores de workspace.
        </p>
      </div>
    );
  }
  // Query para configurações de branding
  const { data: brandingData, isLoading } = useQuery({
    queryKey: ['/api/tenant-admin/branding'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/tenant-admin/branding');
        return response.json();
      } catch (error) {
        return { settings: defaultSettings };
      }
    },
    staleTime: 5 * 60 * 1000,
    onSuccess: (data) => {
      if (data?.settings) {
        setSettings({ ...defaultSettings, ...data.settings });
      }
    }
  });
  // Mutation para salvar configurações
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: BrandingSettings) => {
      const response = await apiRequest('PUT', '/api/tenant-admin/branding', { settings: newSettings });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/branding'] });
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "As configurações de branding foram atualizadas com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message,
        variant: "destructive",
      });
    }
  });
  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };
  const handleReset = () => {
    setSettings(defaultSettings);
  };
  const updateSetting = (path: string, value: any) => {
    const keys = path.split('.');
    setSettings(prev => {
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newSettings;
    });
  };
  const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
    <div className="p-4"
      <Label>{label}</Label>
      <div className="p-4"
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="font-mono"
        />
      </div>
    </div>
  );
  return (
    <div className="p-4"
      {/* Header */}
      <div className="p-4"
        <div>
          <h1 className="p-4"
            Branding & Personalização
          </h1>
          <p className="p-4"
            Configure a aparência visual e identidade do seu workspace
          </p>
        </div>
        
        <div className="p-4"
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Sair do Preview' : 'Preview'}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            className="gradient-primary text-white hover:opacity-90"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveSettingsMutation.isPending ? 'Salvando...' : '[TRANSLATION_NEEDED]'}
          </Button>
        </div>
      </div>
      {/* Preview Banner */}
      {previewMode && (
        <Card className="p-4"
          <CardContent className="p-4"
            <div className="p-4"
              <Monitor className="w-5 h-5 text-yellow-600" />
              <span className="p-4"
                Modo Preview Ativo
              </span>
              <Badge variant="outline" className="p-4"
                As alterações não foram salvas
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
      <Tabs defaultValue="visual" className="p-4"
        <TabsList className="p-4"
          <TabsTrigger value="visual>
            <Paintbrush className="w-4 h-4 mr-2" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="logos>
            <Image className="w-4 h-4 mr-2" />
            Logos
          </TabsTrigger>
          <TabsTrigger value="typography>
            <Type className="w-4 h-4 mr-2" />
            Tipografia
          </TabsTrigger>
          <TabsTrigger value="customization>
            <Settings className="w-4 h-4 mr-2" />
            Personalização
          </TabsTrigger>
          <TabsTrigger value="advanced>
            <Globe className="w-4 h-4 mr-2" />
            Avançado
          </TabsTrigger>
        </TabsList>
        {/* Visual Tab */}
        <TabsContent value="visual" className="p-4"
          <div className="p-4"
            {/* Paleta de Cores */}
            <Card>
              <CardHeader>
                <CardTitle className="p-4"
                  <Palette className="w-5 h-5 mr-2" />
                  Paleta de Cores
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4"
                <ColorPicker
                  label="Cor Primária"
                  value={settings.colors.primary}
                  onChange={(value) => updateSetting('colors.primary', value)}
                />
                <ColorPicker
                  label="Cor Secundária"
                  value={settings.colors.secondary}
                  onChange={(value) => updateSetting('colors.secondary', value)}
                />
                <ColorPicker
                  label="Cor de Destaque"
                  value={settings.colors.accent}
                  onChange={(value) => updateSetting('colors.accent', value)}
                />
                <ColorPicker
                  label="Fundo"
                  value={settings.colors.background}
                  onChange={(value) => updateSetting('colors.background', value)}
                />
                <ColorPicker
                  label="Superfície"
                  value={settings.colors.surface}
                  onChange={(value) => updateSetting('colors.surface', value)}
                />
                <ColorPicker
                  label="Texto"
                  value={settings.colors.text}
                  onChange={(value) => updateSetting('colors.text', value)}
                />
              </CardContent>
            </Card>
            {/* Layout e Estilo */}
            <Card>
              <CardHeader>
                <CardTitle className="p-4"
                  <Monitor className="w-5 h-5 mr-2" />
                  Layout e Estilo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4"
                <div className="p-4"
                  <Label>Estilo da Sidebar</Label>
                  <select
                    value={settings.layout.sidebarStyle}
                    onChange={(e) => updateSetting('layout.sidebarStyle', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="modern">Moderno</option>
                    <option value="classic">Clássico</option>
                    <option value="minimal">Minimalista</option>
                    <option value="compact">Compacto</option>
                  </select>
                </div>
                <div className="p-4"
                  <Label>Estilo do Cabeçalho</Label>
                  <select
                    value={settings.layout.headerStyle}
                    onChange={(e) => updateSetting('layout.headerStyle', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="clean">Limpo</option>
                    <option value="elevated">Elevado</option>
                    <option value="bordered">Com Borda</option>
                    <option value="gradient">Gradiente</option>
                  </select>
                </div>
                <div className="p-4"
                  <Label>Raio de Borda</Label>
                  <select
                    value={settings.layout.borderRadius}
                    onChange={(e) => updateSetting('layout.borderRadius', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="0px">Nenhum</option>
                    <option value="4px">Pequeno</option>
                    <option value="8px">Médio</option>
                    <option value="12px">Grande</option>
                    <option value="16px">Extra Grande</option>
                  </select>
                </div>
                <div className="p-4"
                  <Label>Espaçamento</Label>
                  <select
                    value={settings.layout.spacing}
                    onChange={(e) => updateSetting('layout.spacing', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="compact">Compacto</option>
                    <option value="normal">Normal</option>
                    <option value="relaxed">Relaxado</option>
                    <option value="spacious">Espaçoso</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Preview da Paleta */}
          <Card>
            <CardHeader>
              <CardTitle>Preview da Paleta de Cores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4"
                {Object.entries(settings.colors).map(([key, color]) => (
                  <div key={key} className="p-4"
                    <div
                      className="w-16 h-16 rounded-lg border mx-auto mb-2"
                      style={{ backgroundColor: color }}
                    />
                    <Label className="text-lg">"{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <p className="text-lg">"{color}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Logos Tab */}
        <TabsContent value="logos" className="p-4"
          <div className="p-4"
            <Card>
              <CardHeader>
                <CardTitle>Logo Principal</CardTitle>
              </CardHeader>
              <CardContent className="p-4"
                <div className="p-4"
                  <Label>URL do Logo (Tema Claro)</Label>
                  <Input
                    value={settings.logo.url}
                    onChange={(e) => updateSetting('logo.url', e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                <div className="p-4"
                  <Label>URL do Logo (Tema Escuro)</Label>
                  <Input
                    value={settings.logo.darkUrl}
                    onChange={(e) => updateSetting('logo.darkUrl', e.target.value)}
                    placeholder="https://exemplo.com/logo-dark.png"
                  />
                </div>
                <div className="p-4"
                  <Label>Favicon</Label>
                  <Input
                    value={settings.logo.favicon}
                    onChange={(e) => updateSetting('logo.favicon', e.target.value)}
                    placeholder="https://exemplo.com/favicon.ico"
                  />
                </div>
                <Button variant="outline" className="p-4"
                  <Upload className="w-4 h-4 mr-2" />
                  Upload de Imagem
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Preview dos Logos</CardTitle>
              </CardHeader>
              <CardContent className="p-4"
                {settings.logo.url && (
                  <div className="p-4"
                    <p className="text-lg">"Tema Claro:</p>
                    <img 
                      src={settings.logo.url} 
                      alt="Logo claro" 
                      className="max-h-16 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {settings.logo.darkUrl && (
                  <div className="p-4"
                    <p className="text-lg">"Tema Escuro:</p>
                    <img 
                      src={settings.logo.darkUrl} 
                      alt="Logo escuro" 
                      className="max-h-16 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {!settings.logo.url && !settings.logo.darkUrl && (
                  <div className="p-4"
                    <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum logo configurado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* Typography Tab */}
        <TabsContent value="typography" className="p-4"
          <Card>
            <CardHeader>
              <CardTitle className="p-4"
                <Type className="w-5 h-5 mr-2" />
                Configurações de Tipografia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4"
              <div className="p-4"
                <div className="p-4"
                  <Label>Fonte Principal</Label>
                  <select
                    value={settings.typography.fontFamily}
                    onChange={(e) => updateSetting('typography.fontFamily', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Poppins">Poppins</option>
                  </select>
                </div>
                <div className="p-4"
                  <Label>Fonte dos Títulos</Label>
                  <select
                    value={settings.typography.headingFont}
                    onChange={(e) => updateSetting('typography.headingFont', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Poppins">Poppins</option>
                  </select>
                </div>
                <div className="p-4"
                  <Label>Tamanho Base</Label>
                  <select
                    value={settings.typography.fontSize}
                    onChange={(e) => updateSetting('typography.fontSize', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="12px">12px (Pequeno)</option>
                    <option value="14px">14px (Padrão)</option>
                    <option value="16px">16px (Médio)</option>
                    <option value="18px">18px (Grande)</option>
                  </select>
                </div>
              </div>
              <Separator />
              <div className="p-4"
                <h3 className="text-lg">"Preview da Tipografia</h3>
                <div 
                  className="p-6 border rounded-lg"
                  style={{ 
                    fontFamily: settings.typography.fontFamily,
                    fontSize: settings.typography.fontSize 
                  }}
                >
                  <h1 
                    className="text-3xl font-bold mb-4"
                    style={{ fontFamily: settings.typography.headingFont }}
                  >
                    Título Principal
                  </h1>
                  <h2 
                    className="text-xl font-semibold mb-3"
                    style={{ fontFamily: settings.typography.headingFont }}
                  >
                    Subtítulo
                  </h2>
                  <p className="p-4"
                    Este é um exemplo de texto normal usando as configurações de tipografia selecionadas. 
                    Você pode ver como ficará a aparência geral do texto na interface.
                  </p>
                  <p className="p-4"
                    Texto menor para labels e descrições secundárias.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Customization Tab */}
        <TabsContent value="customization" className="p-4"
          <div className="p-4"
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
              </CardHeader>
              <CardContent className="p-4"
                <div className="p-4"
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={settings.customization.companyName}
                    onChange={(e) => updateSetting('customization.companyName', e.target.value)}
                    placeholder="Minha Empresa"
                  />
                </div>
                <div className="p-4"
                  <Label>Mensagem de Boas-vindas</Label>
                  <Textarea
                    value={settings.customization.welcomeMessage}
                    onChange={(e) => updateSetting('customization.welcomeMessage', e.target.value)}
                    placeholder="Bem-vindo ao nosso sistema de suporte"
                    rows={3}
                  />
                </div>
                <div className="p-4"
                  <Label>Texto do Rodapé</Label>
                  <Input
                    value={settings.customization.footerText}
                    onChange={(e) => updateSetting('customization.footerText', e.target.value)}
                    placeholder='[TRANSLATION_NEEDED]'
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Contato e Suporte</CardTitle>
              </CardHeader>
              <CardContent className="p-4"
                <div className="p-4"
                  <Label>Email de Suporte</Label>
                  <Input
                    type="email"
                    value={settings.customization.supportEmail}
                    onChange={(e) => updateSetting('customization.supportEmail', e.target.value)}
                    placeholder="suporte@minhaempresa.com"
                  />
                </div>
                <div className="p-4"
                  <Label>URL de Ajuda</Label>
                  <Input
                    value={settings.customization.helpUrl}
                    onChange={(e) => updateSetting('customization.helpUrl', e.target.value)}
                    placeholder="https://ajuda.minhaempresa.com"
                  />
                </div>
                <div className="p-4"
                  <Switch
                    checked={settings.customization.showPoweredBy}
                    onCheckedChange={(checked) => updateSetting('customization.showPoweredBy', checked)}
                  />
                  <Label>Mostrar "Powered by Conductor"</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* Advanced Tab */}
        <TabsContent value="advanced" className="p-4"
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Tema</CardTitle>
            </CardHeader>
            <CardContent className="p-4"
              <div className="p-4"
                <div className="p-4"
                  <Label>Tema Padrão</Label>
                  <select
                    value={settings.themes.defaultTheme}
                    onChange={(e) => updateSetting('themes.defaultTheme', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                    <option value="system">Sistema</option>
                  </select>
                </div>
                <div className="p-4"
                  <Switch
                    checked={settings.themes.allowUserThemeSwitch}
                    onCheckedChange={(checked) => updateSetting('themes.allowUserThemeSwitch', checked)}
                  />
                  <Label>Permitir que usuários alterem o tema</Label>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>CSS Customizado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4"
                <Label>CSS Personalizado</Label>
                <Textarea
                  value={settings.themes.customCss}
                  onChange={(e) => updateSetting('themes.customCss', e.target.value)}
                  placeholder="/* Adicione seu CSS personalizado aqui */
.custom-class {
  color: #your-color;
}"
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="p-4"
                  Adicione CSS personalizado para customizações avançadas. Use com cuidado.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}