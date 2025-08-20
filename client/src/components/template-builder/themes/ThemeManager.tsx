
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Palette,
  Eye,
  Download,
  Upload,
  Save,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  Brush,
  Type,
  Layout
} from 'lucide-react';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

interface Typography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  fontWeight: {
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  typography: Typography;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ThemeManagerProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  onThemeUpdate: (theme: Theme) => void;
  onThemeCreate: (theme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const defaultThemes: Theme[] = [
  {
    id: 'default',
    name: 'Padrão',
    description: 'Tema padrão do sistema com cores neutras',
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      accent: '#10b981',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#d1d5db',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem'
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75'
      }
    },
    spacing: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      none: '0',
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    },
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'dark',
    name: 'Escuro',
    description: 'Tema escuro para reduzir fadiga visual',
    colors: {
      primary: '#60a5fa',
      secondary: '#9ca3af',
      accent: '#34d399',
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      textSecondary: '#9ca3af',
      border: '#374151',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem'
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75'
      }
    },
    spacing: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      none: '0',
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.2)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.2)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.2)'
    },
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'corporate',
    name: 'Corporativo',
    description: 'Tema profissional para ambientes corporativos',
    colors: {
      primary: '#1e40af',
      secondary: '#64748b',
      accent: '#0d9488',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#64748b',
      border: '#cbd5e1',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626'
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem'
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75'
      }
    },
    spacing: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.375rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    },
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'medical',
    name: 'Médico',
    description: 'Tema otimizado para ambientes de saúde',
    colors: {
      primary: '#059669',
      secondary: '#6b7280',
      accent: '#3b82f6',
      background: '#ffffff',
      surface: '#f0fdf4',
      text: '#064e3b',
      textSecondary: '#6b7280',
      border: '#bbf7d0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem'
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75'
      }
    },
    spacing: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      none: '0',
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    },
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const ThemeManager: React.FC<ThemeManagerProps> = ({
  currentTheme,
  onThemeChange,
  onThemeUpdate,
  onThemeCreate
}) => {
  const [themes, setThemes] = useState<Theme[]>(defaultThemes);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [newThemeName, setNewThemeName] = useState('');
  const [activeTab, setActiveTab] = useState('themes');

  useEffect(() => {
    // Carregar temas salvos do localStorage
    const savedThemes = localStorage.getItem('customThemes');
    if (savedThemes) {
      const customThemes = JSON.parse(savedThemes);
      setThemes([...defaultThemes, ...customThemes]);
    }
  }, []);

  const handleThemeSelect = (theme: Theme) => {
    onThemeChange(theme);
  };

  const handleCreateCustomTheme = () => {
    if (!newThemeName.trim()) return;

    const newTheme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'> = {
      name: newThemeName,
      description: `Tema personalizado criado por usuário`,
      colors: { ...currentTheme.colors },
      typography: { ...currentTheme.typography },
      spacing: { ...currentTheme.spacing },
      borderRadius: { ...currentTheme.borderRadius },
      shadows: { ...currentTheme.shadows },
      isCustom: true
    };

    onThemeCreate(newTheme);
    setNewThemeName('');
  };

  const handleColorChange = (colorKey: keyof ThemeColors, value: string) => {
    if (!editingTheme) return;

    const updatedTheme = {
      ...editingTheme,
      colors: {
        ...editingTheme.colors,
        [colorKey]: value
      },
      updatedAt: new Date()
    };

    setEditingTheme(updatedTheme);
  };

  const handleSaveTheme = () => {
    if (!editingTheme) return;

    onThemeUpdate(editingTheme);
    setEditingTheme(null);
  };

  const handleExportTheme = (theme: Theme) => {
    const exportData = JSON.stringify(theme, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${theme.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTheme = JSON.parse(e.target?.result as string);
        const newTheme = {
          ...importedTheme,
          id: `imported-${Date.now()}`,
          isCustom: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const updatedThemes = [...themes, newTheme];
        setThemes(updatedThemes);
        
        // Salvar temas customizados
        const customThemes = updatedThemes.filter(t => t.isCustom);
        localStorage.setItem('customThemes', JSON.stringify(customThemes));
      } catch (error) {
        console.error('Erro ao importar tema:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center">
          <Palette className="h-5 w-5 mr-2" />
          Gerenciador de Temas
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Personalize a aparência do seu template
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="themes">Temas</TabsTrigger>
          <TabsTrigger value="customize">Personalizar</TabsTrigger>
          <TabsTrigger value="export">Importar/Exportar</TabsTrigger>
        </TabsList>

        <div className="p-4">
          <TabsContent value="themes" className="space-y-4">
            <div>
              <Label>Temas Disponíveis</Label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {themes.map((theme) => (
                  <Card 
                    key={theme.id}
                    className={`cursor-pointer transition-all ${
                      currentTheme.id === theme.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleThemeSelect(theme)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium flex items-center">
                            {theme.name}
                            {theme.isCustom && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Personalizado
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {theme.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {/* Preview de cores */}
                          <div className="flex space-x-1">
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: theme.colors.primary }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: theme.colors.secondary }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: theme.colors.accent }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTheme(theme);
                              setActiveTab('customize');
                            }}
                          >
                            <Brush className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <Label>Criar Novo Tema</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  placeholder="Nome do tema"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                />
                <Button onClick={handleCreateCustomTheme} disabled={!newThemeName.trim()}>
                  Criar
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customize" className="space-y-4">
            {editingTheme ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Editando: {editingTheme.name}</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingTheme(null)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveTheme}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="colors">
                  <TabsList>
                    <TabsTrigger value="colors">Cores</TabsTrigger>
                    <TabsTrigger value="typography">Tipografia</TabsTrigger>
                    <TabsTrigger value="spacing">Espaçamento</TabsTrigger>
                  </TabsList>

                  <TabsContent value="colors" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(editingTheme.colors).map(([key, value]) => (
                        <div key={key}>
                          <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                          <div className="flex space-x-2 mt-1">
                            <Input
                              type="color"
                              value={value}
                              onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                              className="w-16 h-8"
                            />
                            <Input
                              value={value}
                              onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="typography" className="space-y-4">
                    <div>
                      <Label>Família da Fonte</Label>
                      <Select
                        value={editingTheme.typography.fontFamily}
                        onValueChange={(value) => setEditingTheme({
                          ...editingTheme,
                          typography: { ...editingTheme.typography, fontFamily: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter, system-ui, sans-serif">Inter</SelectItem>
                          <SelectItem value="system-ui, -apple-system, sans-serif">System UI</SelectItem>
                          <SelectItem value="Georgia, serif">Georgia</SelectItem>
                          <SelectItem value="Monaco, monospace">Monaco</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="spacing" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(editingTheme.spacing).map(([key, value]) => (
                        <div key={key}>
                          <Label className="uppercase">{key}</Label>
                          <Input
                            value={value}
                            onChange={(e) => setEditingTheme({
                              ...editingTheme,
                              spacing: { ...editingTheme.spacing, [key]: e.target.value }
                            })}
                            placeholder="1rem"
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brush className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Selecione um tema para personalizar</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div>
              <Label>Exportar Tema Atual</Label>
              <p className="text-sm text-gray-500 mb-2">
                Baixe o tema atual como arquivo JSON
              </p>
              <Button onClick={() => handleExportTheme(currentTheme)}>
                <Download className="h-4 w-4 mr-2" />
                Exportar {currentTheme.name}
              </Button>
            </div>

            <Separator />

            <div>
              <Label>Importar Tema</Label>
              <p className="text-sm text-gray-500 mb-2">
                Carregue um arquivo de tema JSON
              </p>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImportTheme}
                  className="cursor-pointer"
                />
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ThemeManager;
