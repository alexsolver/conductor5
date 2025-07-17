
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Palette, Layout, Sparkles, Building2, Zap, Globe } from "lucide-react";

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
  style: 'modern' | 'classic' | 'minimal' | 'corporate' | 'tech' | 'elegant';
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
  }
];

export function TemplateSelector() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const applyTemplate = (template: Template) => {
    // Aqui você implementará a lógica para aplicar o template
    console.log('Aplicando template:', template);
    
    // Simular aplicação do template
    const root = document.documentElement;
    root.style.setProperty('--primary', template.colors.primary);
    root.style.setProperty('--secondary', template.colors.secondary);
    root.style.setProperty('--accent', template.colors.accent);
    root.style.setProperty('--background', template.colors.background);
    
    setSelectedTemplate(template.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Selecione seu Template
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Escolha um dos templates profissionais abaixo para personalizar a aparência do seu sistema. 
            Cada template inclui esquema de cores, layout e componentes otimizados.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {templates.map((template) => (
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
                <Button 
                  className="w-full mt-4" 
                  variant={selectedTemplate === template.id ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    applyTemplate(template);
                  }}
                >
                  {selectedTemplate === template.id ? 'Template Aplicado' : 'Aplicar Template'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="text-center space-x-4">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={!selectedTemplate}
          >
            Confirmar Seleção
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => setSelectedTemplate(null)}
          >
            Resetar
          </Button>
        </div>

        {/* Template Info */}
        {selectedTemplate && (
          <div className="mt-12 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Template Selecionado</h3>
            {(() => {
              const template = templates.find(t => t.id === selectedTemplate);
              if (!template) return null;
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Informações do Template</h4>
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
