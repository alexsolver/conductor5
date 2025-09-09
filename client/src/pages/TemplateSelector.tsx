
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, Palette, Layout, Sparkles, Building2, Zap, Globe, Loader2, Settings, Moon, Sun, Sunset, Camera, Brush, Heart } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  features: string[];
  style: 'modern' | 'classic' | 'minimal' | 'corporate' | 'tech' | 'elegant' | 'sunset' | 'ocean' | 'forest';
}

const templates: Template[] = [
  {
    id: 'corporate-blue',
    name: 'Corporate Professional',
    description: 'Layout clássico e profissional com tons de azul corporativo',
    icon: <Building2 className="w-6 h-6" />,
    preview: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
    colors: {
      primary: '#1e40af',
      secondary: '#64748b',
      accent: '#0ea5e9',
      background: '#f8fafc'
    },
    features: ['Sidebar expandível', 'Cards com sombras suaves', 'Tipografia clara', 'Navegação hierárquica'],
    style: 'corporate'
  },
  {
    id: 'modern-gradient',
    name: 'Modern Gradient',
    description: 'Design moderno com gradientes vibrantes e elementos fluidos',
    icon: <Sparkles className="w-6 h-6" />,
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      background: '#fafafa'
    },
    features: ['Gradientes animados', 'Micro-interações', 'Cards flutuantes', 'Efeitos de glassmorphism'],
    style: 'modern'
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Interface minimalista com foco na funcionalidade e clareza',
    icon: <Layout className="w-6 h-6" />,
    preview: 'linear-gradient(135deg, #374151 0%, #6b7280 50%, #9ca3af 100%)',
    colors: {
      primary: '#374151',
      secondary: '#6b7280',
      accent: '#10b981',
      background: '#ffffff'
    },
    features: ['Espaçamento generoso', 'Tipografia minimalista', 'Cores neutras', 'Foco no conteúdo'],
    style: 'minimal'
  },
  {
    id: 'tech-dark',
    name: 'Tech Dark Mode',
    description: 'Tema escuro moderno com acentos tecnológicos em neon',
    icon: <Zap className="w-6 h-6" />,
    preview: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    colors: {
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#00d9ff',
      background: '#020617'
    },
    features: ['Modo escuro completo', 'Acentos neon', 'Efeitos de luz', 'Interface futurística'],
    style: 'tech'
  },
  {
    id: 'elegant-purple',
    name: 'Elegant Purple',
    description: 'Design elegante com paleta roxa sofisticada e dourada',
    icon: <Palette className="w-6 h-6" />,
    preview: 'linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #a855f7 100%)',
    colors: {
      primary: '#581c87',
      secondary: '#7c3aed',
      accent: '#fbbf24',
      background: '#fef7ff'
    },
    features: ['Paleta sofisticada', 'Acentos dourados', 'Sombras elegantes', 'Transições suaves'],
    style: 'elegant'
  },
  {
    id: 'global-teal',
    name: 'Global Business',
    description: 'Layout internacional com verde-azulado e elementos globais',
    icon: <Globe className="w-6 h-6" />,
    preview: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #5eead4 100%)',
    colors: {
      primary: '#0f766e',
      secondary: '#14b8a6',
      accent: '#f59e0b',
      background: '#f0fdfa'
    },
    features: ['Cores internacionais', 'Layout responsivo', 'Ícones globais', 'Acessibilidade aprimorada'],
    style: 'classic'
  },
  {
    id: 'sunset-warm',
    name: 'Sunset Warm',
    description: 'Cores quentes inspiradas no pôr do sol com tons laranja e rosa',
    icon: <Sunset className="w-6 h-6" />,
    preview: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffcd3c 100%)',
    colors: {
      primary: '#ff6b35',
      secondary: '#f7931e',
      accent: '#ff4757',
      background: '#fff8f1'
    },
    features: ['Cores vibrantes', 'Atmosfera acolhedora', 'Contrastes suaves', 'Design energético'],
    style: 'sunset'
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Depths',
    description: 'Profundidade dos oceanos com azuis intensos e toques aquáticos',
    icon: <Camera className="w-6 h-6" />,
    preview: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #38bdf8 100%)',
    colors: {
      primary: '#0c4a6e',
      secondary: '#0284c7',
      accent: '#06d6a0',
      background: '#f0f9ff'
    },
    features: ['Tons oceânicos', 'Sensação de calma', 'Elementos aquáticos', 'Design fluido'],
    style: 'ocean'
  },
  {
    id: 'forest-nature',
    name: 'Forest Nature',
    description: 'Inspirado na natureza com verdes orgânicos e tons terrosos',
    icon: <Heart className="w-6 h-6" />,
    preview: 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #65a30d 100%)',
    colors: {
      primary: '#166534',
      secondary: '#16a34a',
      accent: '#eab308',
      background: '#f7fee7'
    },
    features: ['Cores naturais', 'Sensação orgânica', 'Elementos sustentáveis', 'Design eco-friendly'],
    style: 'forest'
  }
];

// Color Picker Component
function ColorPicker({ color, onChange, label }: { color: string; onChange: (color: string) => void; label: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
        />
        <Input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 text-sm font-mono"
          placeholder="#000000"
        />
        <div 
          className="w-8 h-8 rounded border-2 border-white shadow-md"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// Template Customization Dialog
function TemplateCustomizer({ template, onSave }: { template: Template; onSave: (customTemplate: Template) => void }) {
  const [customColors, setCustomColors] = useState(template.colors);
  const [customName, setCustomName] = useState(`${template.name} (Personalizado)`);

  const updateColor = (colorKey: keyof typeof customColors, value: string) => {
    setCustomColors(prev => ({
      ...prev,
      [colorKey]: value
    }));
  };

  const handleSave = () => {
    const customTemplate: Template = {
      ...template,
      id: `${template.id}-custom-${Date.now()}`,
      name: customName,
      colors: customColors,
      preview: `linear-gradient(135deg, ${customColors.primary} 0%, ${customColors.secondary} 50%, ${customColors.accent} 100%)`
    };
    onSave(customTemplate);
  };

  const presetPalettes = [
    { name: 'Azul Corporativo', colors: { primary: '#1e40af', secondary: '#3b82f6', accent: '#0ea5e9', background: '#f8fafc' } },
    { name: 'Verde Natureza', colors: { primary: '#166534', secondary: '#16a34a', accent: '#65a30d', background: '#f7fee7' } },
    { name: 'Roxo Elegante', colors: { primary: '#581c87', secondary: '#7c3aed', accent: '#a855f7', background: '#fef7ff' } },
    { name: 'Laranja Vibrante', colors: { primary: '#ea580c', secondary: '#fb923c', accent: '#fde047', background: '#fff7ed' } },
    { name: 'Rosa Moderno', colors: { primary: '#be185d', secondary: '#ec4899', accent: '#f472b6', background: '#fdf2f8' } },
    { name: 'Cinza Minimalista', colors: { primary: '#374151', secondary: '#6b7280', accent: '#10b981', background: '#ffffff' } }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Brush className="w-4 h-4 mr-2" />
          Personalizar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Personalizar Tema: {template.name}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="colors">Cores Personalizadas</TabsTrigger>
            <TabsTrigger value="presets">Paletas Prontas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="colors" className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-3 block">Nome do Tema</Label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Nome do seu tema personalizado"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Editar Cores</h4>
                <ColorPicker
                  color={customColors.primary}
                  onChange={(color) => updateColor('primary', color)}
                  label="Cor Primária"
                />
                <ColorPicker
                  color={customColors.secondary}
                  onChange={(color) => updateColor('secondary', color)}
                  label="Cor Secundária"
                />
                <ColorPicker
                  color={customColors.accent}
                  onChange={(color) => updateColor('accent', color)}
                  label="Cor de Destaque"
                />
                <ColorPicker
                  color={customColors.background}
                  onChange={(color) => updateColor('background', color)}
                  label="Cor de Fundo"
                />
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Pré-visualização</h4>
                <div 
                  className="h-32 rounded-lg relative overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, ${customColors.primary} 0%, ${customColors.secondary} 50%, ${customColors.accent} 100%)` 
                  }}
                >
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-4 left-4 text-white">
                    {template.icon}
                  </div>
                  <div className="absolute bottom-4 left-4 text-white text-sm font-medium">
                    {customName}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Paleta de Cores</h5>
                  <div className="flex gap-2">
                    <div 
                      className="w-8 h-8 rounded border-2 border-white shadow-md"
                      style={{ backgroundColor: customColors.primary }}
                      title="Primária"
                    />
                    <div 
                      className="w-8 h-8 rounded border-2 border-white shadow-md"
                      style={{ backgroundColor: customColors.secondary }}
                      title="Secundária"
                    />
                    <div 
                      className="w-8 h-8 rounded border-2 border-white shadow-md"
                      style={{ backgroundColor: customColors.accent }}
                      title="Destaque"
                    />
                    <div 
                      className="w-8 h-8 rounded border-2 border-gray-300 shadow-md"
                      style={{ backgroundColor: customColors.background }}
                      title="Fundo"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setCustomColors(template.colors)}>
                Resetar
              </Button>
              <Button onClick={handleSave}>
                Aplicar Template Personalizado
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="presets" className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Escolha uma paleta de cores pré-definida para aplicar rapidamente ao seu template.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {presetPalettes.map((palette, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setCustomColors(palette.colors)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium">{palette.name}</h5>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <div 
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: palette.colors.primary }}
                      />
                      <div 
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: palette.colors.secondary }}
                      />
                      <div 
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: palette.colors.accent }}
                      />
                      <div 
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: palette.colors.background }}
                      />
                    </div>
                    <div 
                      className="h-12 rounded"
                      style={{ 
                        background: `linear-gradient(135deg, ${palette.colors.primary} 0%, ${palette.colors.secondary} 50%, ${palette.colors.accent} 100%)` 
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setCustomColors(template.colors)}>
                Resetar para Original
              </Button>
              <Button onClick={handleSave}>
                Aplicar Template Personalizado
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function TemplateSelector() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obter template atual
  const { data: currentTemplate } = useQuery({
    queryKey: ['/api/templates/current'],
    retry: false
  });

  // Mutation para aplicar template
  const applyTemplateMutation = useMutation({
    mutationFn: async (template: Template) => {
      const res = await apiRequest('POST', '/api/templates/apply', template);
      return res.json();
    },
    onSuccess: (data, template) => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates/current'] });
      setSelectedTemplate(template.id);
      toast({
        title: "Tema aplicado!",
        description: `O tema "${template.name}" foi aplicado com sucesso.`,
      });
      
      // CSS é aplicado automaticamente pelo HMR do Vite
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aplicar tema",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para resetar template
  const resetTemplateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/templates/reset');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates/current'] });
      setSelectedTemplate(null);
      toast({
        title: "Tema resetado",
        description: "O tema foi resetado para o padrão.",
      });
      
      // CSS é aplicado automaticamente pelo HMR do Vite
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao resetar tema",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Inicializar template selecionado baseado no atual
  useEffect(() => {
    if (currentTemplate && typeof currentTemplate === 'object' && 'selectedTemplate' in currentTemplate && currentTemplate.selectedTemplate) {
      setSelectedTemplate(currentTemplate.selectedTemplate as string);
    }
  }, [currentTemplate]);

  const applyTemplate = (template: Template) => {
    applyTemplateMutation.mutate(template);
  };

  const resetTemplate = () => {
    resetTemplateMutation.mutate();
  };

  const handleCustomTemplate = (customTemplate: Template) => {
    setCustomTemplates(prev => [...prev, customTemplate]);
    applyTemplate(customTemplate);
  };

  // Combine original templates with custom ones
  const allTemplates = [...templates, ...customTemplates];

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Personalizar Aparência
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Escolha um dos temas profissionais abaixo para personalizar a aparência do seu sistema. 
            Cada tema inclui esquema de cores, layout e componentes otimizados.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {allTemplates.map((template) => (
            <Card 
              key={template.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer ${
                selectedTemplate === template.id 
                  ? 'ring-4 ring-blue-500 shadow-2xl' 
                  : 'hover:shadow-xl'
              }`}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              onClick={() => applyTemplate(template)}
            >
              {/* Preview Background */}
              <div 
                className="h-32 relative"
                style={{ background: template.preview }}
              >
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-4 left-4 text-white">
                  {template.icon}
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {template.style}
                  </Badge>
                </div>
                {selectedTemplate === template.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  {template.name}
                  {hoveredTemplate === template.id && (
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {template.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Color Palette */}
                <div className="flex gap-2 mb-4">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: template.colors.primary }}
                    title="Cor primária"
                  ></div>
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: template.colors.secondary }}
                    title="Cor secundária"
                  ></div>
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: template.colors.accent }}
                    title="Cor de destaque"
                  ></div>
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-md"
                    style={{ backgroundColor: template.colors.background }}
                    title="Cor de fundo"
                  ></div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {template.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Apply Button */}
                <div className="flex gap-2 mt-4">
                  <Button 
                    className="flex-1" 
                    variant={selectedTemplate === template.id ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      applyTemplate(template);
                    }}
                    disabled={applyTemplateMutation.isPending}
                  >
                    {applyTemplateMutation.isPending && applyTemplateMutation.variables?.id === template.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aplicando...
                      </>
                    ) : selectedTemplate === template.id ? (
                      'Template Aplicado'
                    ) : (
                      'Aplicar Template'
                    )}
                  </Button>
                  <TemplateCustomizer 
                    template={template} 
                    onSave={handleCustomTemplate}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="text-center space-x-4">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={!selectedTemplate || applyTemplateMutation.isPending}
          >
            {selectedTemplate ? 'Tema Selecionado' : 'Selecione um Tema'}
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={resetTemplate}
            disabled={resetTemplateMutation.isPending}
          >
            {resetTemplateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetando...
              </>
            ) : (
              'Resetar para Padrão'
            )}
          </Button>
        </div>

        {/* Theme Info */}
        {selectedTemplate && (
          <div className="mt-12 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Tema Selecionado</h3>
            {(() => {
              const template = templates.find(t => t.id === selectedTemplate);
              if (!template) return null;
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Informações do Tema</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {template.description}
                    </p>
                    <div className="space-y-2">
                      <div className="text-sm"><strong>Nome:</strong> {template.name}</div>
                      <div className="text-sm"><strong>Estilo:</strong> {template.style}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Paleta de Cores</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: template.colors.primary }}></div>
                        <span>Primária: {template.colors.primary}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: template.colors.secondary }}></div>
                        <span>Secundária: {template.colors.secondary}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: template.colors.accent }}></div>
                        <span>Destaque: {template.colors.accent}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
