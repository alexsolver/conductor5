
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
// import { useLocalization } from '@/hooks/useLocalization';
  Layout,
  Grid,
  Columns,
  Rows,
  Square,
  Eye,
  Plus,
  Trash2,
  Copy,
  Star,
  StarOff
} from 'lucide-react';

interface LayoutStructure {
  sections: Array<{
    id: string;
    title: string;
    columns: number;
    fields: Array<{
      type: string;
      colspan: number;
      required?: boolean;
    }>;
  }>;
}

interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'advanced' | 'specialized' | 'custom';
  structure: LayoutStructure;
  preview: string;
  isDefault?: boolean;
  isFavorite?: boolean;
  usageCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface LayoutSelectorProps {
  currentLayout?: LayoutTemplate;
  onLayoutSelect: (layout: LayoutTemplate) => void;
  onLayoutSave: (layout: Omit<LayoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onLayoutDelete: (layoutId: string) => void;
}

const predefinedLayouts: LayoutTemplate[] = [
  {
  // Localization temporarily disabled

    id: 'simple-form',
    name: 'Formulário Simples',
    description: 'Layout básico com uma coluna para formulários simples',
    category: 'basic',
    structure: {
      sections: [
        {
          id: 'main',
          title: '[TRANSLATION_NEEDED]',
          columns: 1,
          fields: [
            { type: 'text', colspan: 1, required: true },
            { type: 'email', colspan: 1, required: true },
            { type: 'phone', colspan: 1 },
            { type: 'textarea', colspan: 1 },
            { type: 'select', colspan: 1, required: true }
          ]
        }
      ]
    },
    preview: `
      ┌─────────────────────┐
      │ Nome *              │
      ├─────────────────────┤
      │ Email *             │
      ├─────────────────────┤
      │ Telefone            │
      ├─────────────────────┤
      │ Descrição           │
      │ (textarea)          │
      ├─────────────────────┤
      │ Categoria * ▼       │
      └─────────────────────┘
    `,
    isDefault: true,
    usageCount: 45,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'two-column',
    name: 'Duas Colunas',
    description: 'Layout com duas colunas para melhor organização',
    category: 'basic',
    structure: {
      sections: [
        {
          id: 'personal',
          title: 'Dados Pessoais',
          columns: 2,
          fields: [
            { type: 'text', colspan: 1, required: true },
            { type: 'text', colspan: 1, required: true },
            { type: 'email', colspan: 1, required: true },
            { type: 'phone', colspan: 1 },
            { type: 'date', colspan: 1 },
            { type: 'select', colspan: 1 }
          ]
        },
        {
          id: 'details',
          title: 'Detalhes Adicionais',
          columns: 1,
          fields: [
            { type: 'textarea', colspan: 1 }
          ]
        }
      ]
    },
    preview: `
      ┌──────────┬──────────┐
      │ Nome *   │ Sobr. *  │
      ├──────────┼──────────┤
      │ Email *  │ Telefone │
      ├──────────┼──────────┤
      │ Data Nasc│ Status ▼ │
      ├──────────┴──────────┤
      │ Observações          │
      │ (textarea)           │
      └─────────────────────┘
    `,
    isDefault: true,
    usageCount: 32,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'multi-section',
    name: 'Multi-seção',
    description: 'Layout organizado em múltiplas seções temáticas',
    category: 'advanced',
    structure: {
      sections: [
        {
          id: 'basic-info',
          title: '[TRANSLATION_NEEDED]',
          columns: 2,
          fields: [
            { type: 'text', colspan: 1, required: true },
            { type: 'email', colspan: 1, required: true },
            { type: 'phone', colspan: 1 },
            { type: 'select', colspan: 1 }
          ]
        },
        {
          id: 'address',
          title: 'Endereço',
          columns: 2,
          fields: [
            { type: 'text', colspan: 2, required: true },
            { type: 'text', colspan: 1 },
            { type: 'text', colspan: 1 },
            { type: 'text', colspan: 1 },
            { type: 'text', colspan: 1 }
          ]
        },
        {
          id: 'additional',
          title: '[TRANSLATION_NEEDED]',
          columns: 1,
          fields: [
            { type: 'textarea', colspan: 1 },
            { type: 'checkbox', colspan: 1 }
          ]
        }
      ]
    },
    preview: `
      ═══ Informações Básicas ═══
      ┌──────────┬──────────┐
      │ Nome *   │ Email *  │
      ├──────────┼──────────┤
      │ Telefone │ Tipo ▼   │
      └──────────┴──────────┘
      
      ═══ Endereço ═══
      ┌─────────────────────┐
      │ Logradouro *        │
      ├──────────┬──────────┤
      │ Número   │ Compl.   │
      ├──────────┼──────────┤
      │ Cidade   │ Estado   │
      └──────────┴──────────┘
    `,
    usageCount: 18,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'ticket-support',
    name: 'Suporte Técnico',
    description: 'Layout especializado para tickets de suporte',
    category: 'specialized',
    structure: {
      sections: [
        {
          id: 'issue',
          title: 'Descrição do Problema',
          columns: 1,
          fields: [
            { type: 'select', colspan: 1, required: true },
            { type: 'select', colspan: 1, required: true },
            { type: 'text', colspan: 1, required: true },
            { type: 'textarea', colspan: 1, required: true }
          ]
        },
        {
          id: 'environment',
          title: 'Ambiente',
          columns: 2,
          fields: [
            { type: 'select', colspan: 1 },
            { type: 'text', colspan: 1 },
            { type: 'text', colspan: 1 },
            { type: 'text', colspan: 1 }
          ]
        },
        {
          id: 'attachments',
          title: 'Anexos',
          columns: 1,
          fields: [
            { type: 'file', colspan: 1 }
          ]
        }
      ]
    },
    preview: `
      ═══ Descrição do Problema ═══
      ┌─────────────────────┐
      │ Categoria * ▼       │
      ├─────────────────────┤
      │ Prioridade * ▼      │
      ├─────────────────────┤
      │ Título *            │
      ├─────────────────────┤
      │ Descrição *         │
      │ (textarea)          │
      └─────────────────────┘
      
      ═══ Ambiente ═══
      ┌──────────┬──────────┐
      │ SO ▼     │ Browser  │
      ├──────────┼──────────┤
      │ Versão   │ Módulo   │
      └──────────┴──────────┘
    `,
    usageCount: 27,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'customer-onboarding',
    name: 'Onboarding Cliente',
    description: 'Layout para cadastro inicial de clientes',
    category: 'specialized',
    structure: {
      sections: [
        {
          id: 'company',
          title: 'Dados da Empresa',
          columns: 2,
          fields: [
            { type: 'text', colspan: 2, required: true },
            { type: 'text', colspan: 1, required: true },
            { type: 'text', colspan: 1 },
            { type: 'email', colspan: 1, required: true },
            { type: 'phone', colspan: 1, required: true }
          ]
        },
        {
          id: 'contact',
          title: 'Contato Principal',
          columns: 2,
          fields: [
            { type: 'text', colspan: 1, required: true },
            { type: 'text', colspan: 1 },
            { type: 'email', colspan: 1, required: true },
            { type: 'phone', colspan: 1 }
          ]
        },
        {
          id: 'services',
          title: 'Serviços de Interesse',
          columns: 1,
          fields: [
            { type: 'multiselect', colspan: 1, required: true },
            { type: 'textarea', colspan: 1 }
          ]
        }
      ]
    },
    preview: `
      ═══ Dados da Empresa ═══
      ┌─────────────────────┐
      │ Razão Social *      │
      ├──────────┬──────────┤
      │ CNPJ *   │ I.E.     │
      ├──────────┼──────────┤
      │ Email *  │ Telefone*│
      └──────────┴──────────┘
      
      ═══ Contato Principal ═══
      ┌──────────┬──────────┐
      │ Nome *   │ Cargo    │
      ├──────────┼──────────┤
      │ Email *  │ Telefone │
      └──────────┴──────────┘
    `,
    usageCount: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  currentLayout,
  onLayoutSelect,
  onLayoutSave,
  onLayoutDelete
}) => {
  const [layouts, setLayouts] = useState<LayoutTemplate[]>(predefinedLayouts);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [newLayoutDescription, setNewLayoutDescription] = useState('');

  const filteredLayouts = layouts.filter(layout => {
    const matchesSearch = layout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         layout.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || layout.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryLabels = {
    all: '[TRANSLATION_NEEDED]',
    basic: 'Básicos',
    advanced: 'Avançados',
    specialized: 'Especializados',
    custom: 'Personalizados'
  };

  const handleToggleFavorite = (layoutId: string) => {
    setLayouts(layouts.map(layout => 
      layout.id === layoutId 
        ? { ...layout, isFavorite: !layout.isFavorite }
        : layout
    ));
  };

  const handleCreateLayout = () => {
    if (!newLayoutName.trim()) return;

    const newLayout: Omit<LayoutTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name: newLayoutName,
      description: newLayoutDescription,
      category: 'custom',
      structure: {
        sections: [
          {
            id: 'main',
            title: 'Seção Principal',
            columns: 1,
            fields: []
          }
        ]
      },
      preview: 'Layout personalizado',
      usageCount: 0
    };

    onLayoutSave(newLayout);
    setNewLayoutName('');
    setNewLayoutDescription('');
    setShowCreateDialog(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basic': return <Square className="h-4 w-4" />;
      case 'advanced': return <Grid className="h-4 w-4" />;
      case 'specialized': return <Columns className="h-4 w-4" />;
      case 'custom': return <Plus className="h-4 w-4" />;
      default: return <Layout className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center">
              <Layout className="h-5 w-5 mr-2" />
              Layouts de Template
            </h2>
            <p className="text-sm text-gray-500">
              Escolha um layout base para seu template
            </p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Layout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Layout</DialogTitle>
                <DialogDescription>
                  Crie um layout personalizado baseado no layout atual
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="layoutName">Nome do Layout</Label>
                  <Input
                    id="layoutName"
                    value={newLayoutName}
                    onChange={(e) => setNewLayoutName(e.target.value)}
                    placeholder="Ex: Atendimento Médico"
                  />
                </div>
                <div>
                  <Label htmlFor="layoutDescription">Descrição</Label>
                  <Textarea
                    id="layoutDescription"
                    value={newLayoutDescription}
                    onChange={(e) => setNewLayoutDescription(e.target.value)}
                    placeholder="Descreva o uso deste layout..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateLayout}
                    disabled={!newLayoutName.trim()}
                  >
                    Criar Layout
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <Input
              placeholder='[TRANSLATION_NEEDED]'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            {Object.entries(categoryLabels).map(([value, label]) => (
              <Button
                key={value}
                variant={selectedCategory === value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(value)}
              >
                {getCategoryIcon(value)}
                <span className="ml-1 hidden sm:inline">{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredLayouts.map((layout) => (
            <Card 
              key={layout.id}
              className={`cursor-pointer transition-all ${
                currentLayout?.id === layout.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-lg'
              "}
              onClick={() => onLayoutSelect(layout)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(layout.category)}
                    <CardTitle className="text-base">{layout.name}</CardTitle>
                    {layout.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Padrão
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(layout.id);
                      }}
                    >
                      {layout.isFavorite ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    {layout.category === 'custom' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayoutDelete(layout.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {layout.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Preview visual */}
                  <div className="bg-gray-50 p-3 rounded border">
                    <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap">
                      {layout.preview}
                    </pre>
                  </div>

                  {/* Estatísticas */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {layout.structure.sections.length} seção(ões)
                    </span>
                    {layout.usageCount && (
                      <span>
                        {layout.usageCount} uso(s)
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLayouts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum layout encontrado</p>
            <p className="text-sm">
              Tente ajustar os filtros ou criar um novo layout personalizado
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutSelector;
