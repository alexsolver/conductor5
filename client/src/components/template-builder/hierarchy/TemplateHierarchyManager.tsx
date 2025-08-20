
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tree, Plus, Link, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/utils';
// import { useLocalization } from '@/hooks/useLocalization';

interface TemplateHierarchy {
  templateId: string;
  parents: Array<{
    template: any;
    inheritanceRules: any;
  }>;
  children: Array<{
    template: any;
    inheritanceRules: any;
  }>;
  level: number;
}

interface TemplateHierarchyManagerProps {
  templateId?: string;
  onTemplateSelect?: (templateId: string) => void;
}

export function TemplateHierarchyManager({
  // Localization temporarily disabled
 templateId, onTemplateSelect }: TemplateHierarchyManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Buscar hierarquia do template atual
  const { data: hierarchy } = useQuery({
    queryKey: ['/api/template-hierarchy', templateId],
    queryFn: () => apiRequest('GET', `/api/template-hierarchy/${templateId}`),
    enabled: !!templateId
  });

  // Buscar categorias disponíveis
  const { data: categories } = useQuery({
    queryKey: ['/api/ticket-templates/categories'],
    queryFn: () => apiRequest('GET', '/api/ticket-templates/categories')
  });

  // Buscar templates por categoria
  const { data: categoryTemplates } = useQuery({
    queryKey: ['/api/template-hierarchy/category', selectedCategory],
    queryFn: () => apiRequest('GET', `/api/template-hierarchy/category/${selectedCategory}`),
    enabled: !!selectedCategory
  });

  const createHierarchicalTemplate = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/template-hierarchy', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/template-hierarchy'] });
      setIsCreateDialogOpen(false);
    }
  });

  const renderHierarchyTree = (hierarchy: TemplateHierarchy) => {
    return (
      <div className="space-y-4">
        {/* Pais */}
        {hierarchy.parents.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-600 mb-2">Templates Pai</h4>
            <div className="space-y-2">
              {hierarchy.parents.map((parent, index) => (
                <div key={parent.template.id} className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-gray-300"></div>
                  <Card className="flex-1 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{parent.template.name}</p>
                        <p className="text-sm text-gray-500">Nível {index + 1}</p>
                      </div>
                      <Badge variant="outline">
                        {parent.inheritanceRules.overrideMode}
                      </Badge>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Template Atual */}
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-2">Template Atual</h4>
          <Card className="p-4 border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2">
              <Tree className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Template Selecionado</span>
              <Badge>Nível {hierarchy.level}</Badge>
            </div>
          </Card>
        </div>

        {/* Filhos */}
        {hierarchy.children.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-600 mb-2">Templates Filhos</h4>
            <div className="space-y-2">
              {hierarchy.children.map((child) => (
                <div key={child.template.id} className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-gray-300"></div>
                  <Card 
                    className="flex-1 p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => onTemplateSelect?.(child.template.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{child.template.name}</p>
                        <p className="text-sm text-gray-500">
                          Herda de: {child.template.parentName}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {child.inheritanceRules.overrideMode}
                      </Badge>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tree className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Hierarquia de Templates</h3>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Criar Template Hierárquico
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Template Hierárquico</DialogTitle>
            </DialogHeader>
            <CreateHierarchicalTemplateForm
              onSubmit={(data) => createHierarchicalTemplate.mutate(data)}
              categories={categories?.data || []}
              parentTemplates={categoryTemplates?.data || []}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Seletor de Categoria */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
            </SelectTrigger>
            <SelectContent>
              {categories?.data?.map((category: any) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates por Categoria */}
      {selectedCategory && categoryTemplates?.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Templates da Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {categoryTemplates.data.map((template: any) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => onTemplateSelect?.(template.id)}
                >
                  <div className="flex items-center gap-3">
                    <Link className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {template.metadata?.isHierarchical && (
                      <Badge variant="outline">Hierárquico</Badge>
                    )}
                    {template.companyId && (
                      <Badge variant="secondary">Empresa</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Árvore de Hierarquia */}
      {hierarchy?.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Árvore de Herança</CardTitle>
          </CardHeader>
          <CardContent>
            {renderHierarchyTree(hierarchy.data)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CreateHierarchicalTemplateFormProps {
  onSubmit: (data: any) => void;
  categories: any[];
  parentTemplates: any[];
}

function CreateHierarchicalTemplateForm({ onSubmit, categories, parentTemplates }: CreateHierarchicalTemplateFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    parentTemplateId: '',
    inheritanceRules: {
      inheritFields: true,
      inheritValidations: true,
      inheritStyles: false,
      overrideMode: 'merge' as const
    }
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do Template</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Nome do template hierárquico"
        />
      </div>

      <div>
        <Label htmlFor="category">Categoria</Label>
        <Select 
          value={formData.category} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder='[TRANSLATION_NEEDED]' />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="parent">Template Pai (Opcional)</Label>
        <Select 
          value={formData.parentTemplateId} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, parentTemplateId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder='[TRANSLATION_NEEDED]' />
          </SelectTrigger>
          <SelectContent>
            {parentTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Modo de Herança</Label>
        <Select 
          value={formData.inheritanceRules.overrideMode} 
          onValueChange={(value: any) => setFormData(prev => ({ 
            ...prev, 
            inheritanceRules: { ...prev.inheritanceRules, overrideMode: value }
          }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="merge">Mesclar</SelectItem>
            <SelectItem value="replace">Substituir</SelectItem>
            <SelectItem value="extend">Estender</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Criar Template Hierárquico
      </Button>
    </form>
  );
}
