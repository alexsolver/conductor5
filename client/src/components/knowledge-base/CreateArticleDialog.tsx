import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, X, BookOpen, Save, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RichTextEditor } from "./RichTextEditor";

interface CreateArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  { value: 'Suporte Técnico', label: 'Suporte Técnico' },
  { value: 'Configuração', label: 'Configuração' },
  { value: 'Troubleshooting', label: 'Resolução de Problemas' },
  { value: 'Políticas', label: 'Políticas' },
  { value: 'Procedimentos', label: 'Procedimentos' },
  { value: 'FAQ', label: 'Perguntas Frequentes' },
  { value: 'Treinamento', label: 'Treinamento' },
  { value: 'Integrações', label: 'Integrações' }
];

const accessLevels = [
  { value: 'public', label: 'Público' },
  { value: 'private', label: 'Privado' },
  { value: 'restricted', label: 'Restrito' }
];

export function CreateArticleDialog({ open, onOpenChange }: CreateArticleDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    access_level: 'public',
    published: false,
    tags: [] as string[]
  });
  
  const [newTag, setNewTag] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/knowledge-base/articles', data);
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "✅ Artigo criado com sucesso!",
          description: "O artigo foi salvo na base de conhecimento.",
        });
        
        // Invalidate queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/articles'] });
        
        // Reset form and close dialog
        setFormData({
          title: '',
          content: '',
          category: '',
          access_level: 'public',
          published: false,
          tags: []
        });
        setNewTag('');
        onOpenChange(false);
      } else {
        toast({
          title: "❌ Erro ao criar artigo",
          description: result.message || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('❌ [CREATE-ARTICLE] Error:', error);
      toast({
        title: "❌ Erro ao criar artigo",
        description: "Não foi possível criar o artigo. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      toast({
        title: "⚠️ Campos obrigatórios",
        description: "Preencha título, conteúdo e categoria.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="create-article-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Criar Novo Artigo
          </DialogTitle>
          <DialogDescription>
            Adicione um novo artigo à base de conhecimento para ajudar sua equipe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Título *
            </Label>
            <Input
              id="title"
              placeholder="Digite o título do artigo..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              data-testid="input-article-title"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Categoria *
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger data-testid="select-article-category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Access Level */}
          <div className="space-y-2">
            <Label htmlFor="access_level" className="text-sm font-medium">
              Nível de Acesso
            </Label>
            <Select value={formData.access_level} onValueChange={(value: 'public' | 'private' | 'restricted') => setFormData(prev => ({ ...prev, access_level: value }))}>
              <SelectTrigger data-testid="select-access-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accessLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              Conteúdo *
            </Label>
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              placeholder="Digite o conteúdo do artigo..."
              className="min-h-[300px]"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium">
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                data-testid="input-new-tag"
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline" data-testid="button-add-tag">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1" data-testid={`tag-${tag}`}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-gray-400 rounded-full p-0.5"
                      data-testid={`remove-tag-${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Published */}
          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={formData.published}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
              data-testid="switch-published"
            />
            <Label htmlFor="published" className="text-sm font-medium">
              Publicar imediatamente
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-save-article"
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Artigo
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}