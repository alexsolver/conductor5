// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE FRONTEND - TEMPLATE SELECTOR COMPONENT
// React component for template selection following design patterns
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
// import { useLocalization } from '@/hooks/useLocalization';
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus } from 'lucide-react';
interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  category: string;
  createdAt: string;
}
interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
  selectedTemplate?: string;
}
export function TemplateSelector({
  // Localization temporarily disabled
 onSelectTemplate, selectedTemplate }: TemplateSelectorProps) {
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('');
  const { toast } = useToast();
  // Buscar templates disponíveis
  const { 
    data: templates = [], 
    isLoading, 
    refetch 
  } = useQuery<Template[]>({
    queryKey: ['/api/knowledge-base/templates'],
    queryFn: async () => {
      const response = await fetch('/api/knowledge-base/templates', {
        headers: {
          'x-tenant-id': localStorage.getItem('tenantId') || '',
          'x-user-id': localStorage.getItem('userId') || '',
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const result = await response.json();
      return result.data || [];
    }
  });
  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Nome e conteúdo são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    try {
      const response = await apiRequest('/api/knowledge-base/templates', 'POST', {
        name: newTemplateName,
        description: newTemplateDescription,
        content: newTemplateContent,
        category: newTemplateCategory || 'general'
      });
      if (response.success) {
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: "Template criado com sucesso"
        });
        setNewTemplateOpen(false);
        setNewTemplateName('');
        setNewTemplateDescription('');
        setNewTemplateContent('');
        setNewTemplateCategory('');
        refetch();
      }
    } catch (error) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
        variant: "destructive"
      });
    }
  };
  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      onSelectTemplate(template);
    }
  };
  return (
    <div className="space-y-4" data-testid="template-selector>
      <div className="flex items-center justify-between>
        <Label className="text-lg">"Templates</Label>
        
        <Dialog open={newTemplateOpen} onOpenChange={setNewTemplateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-create-template>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px]>
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
              <DialogDescription>
                Crie um template reutilizável para artigos da base de conhecimento
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4>
              <div>
                <Label htmlFor="template-name">Nome *</Label>
                <Input
                  id="template-name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Ex: Template de FAQ"
                  data-testid="input-template-name"
                />
              </div>
              
              <div>
                <Label htmlFor="template-description">Descrição</Label>
                <Input
                  id="template-description"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Descrição opcional do template"
                  data-testid="input-template-description"
                />
              </div>
              
              <div>
                <Label htmlFor="template-category">Categoria</Label>
                <Select value={newTemplateCategory} onValueChange={setNewTemplateCategory}>
                  <SelectTrigger data-testid="select-template-category>
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="troubleshooting">Solução de Problemas</SelectItem>
                    <SelectItem value="policy">Políticas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="template-content">Conteúdo *</Label>
                <Textarea
                  id="template-content"
                  value={newTemplateContent}
                  onChange={(e) => setNewTemplateContent(e.target.value)}
                  placeholder="Conteúdo do template..."
                  rows={6}
                  data-testid="input-template-content"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setNewTemplateOpen(false)}
                data-testid="button-cancel-template"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateTemplate}
                data-testid="button-save-template"
              >
                Criar Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <div className="text-lg">"Carregando templates...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6>
            <div className="text-center text-muted-foreground>
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-lg">"Nenhum template disponível</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Select value={selectedTemplate} onValueChange={handleSelectTemplate}>
            <SelectTrigger data-testid="select-template>
              <SelectValue placeholder="Selecionar template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                  {template.description && (
                    <span className="text-muted-foreground ml-2>
                      - {template.description}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">"Preview do Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto>
                  {templates.find(t => t.id === selectedTemplate)?.content}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}