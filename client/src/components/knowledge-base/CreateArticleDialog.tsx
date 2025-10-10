import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, X, BookOpen, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ModernRichTextEditor } from "./ModernRichTextEditor";

interface CreateArticleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  articleId?: string; // Prop to identify if we are editing an existing article
  initialData?: any; // Prop to hold initial data for editing
}

const categories = [
  { value: 'technical_support', label: 'Suporte Técnico' },
  { value: 'configuration', label: 'Configuração' },
  { value: 'troubleshooting', label: 'Resolução de Problemas' },
  { value: 'policies', label: 'Políticas' },
  { value: 'procedures', label: 'Procedimentos' },
  { value: 'faq', label: 'Perguntas Frequentes' },
  { value: 'training', label: 'Treinamento' },
  { value: 'integrations', label: 'Integrações' }
];

const accessLevels = [
  { value: 'public', label: 'Público' },
  { value: 'private', label: 'Privado' },
  { value: 'restricted', label: 'Restrito' }
];

export function CreateArticleDialog({ isOpen, onClose, articleId, initialData }: CreateArticleDialogProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [access_level, setAccessLevel] = useState(initialData?.access_level || 'public');
  const [published, setPublished] = useState(initialData?.published || false);
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
  const [newTag, setNewTag] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string; access_level: string; published: boolean; tags: string[]; status: string }) => {
      const method = articleId ? 'PUT' : 'POST';
      const url = articleId ? `/api/knowledge-base/articles/${articleId}` : '/api/knowledge-base/articles';
      const response = await apiRequest(method, url, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar artigo');
      }
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: `✅ Artigo ${articleId ? 'atualizado' : 'criado'} com sucesso!`,
          description: "O artigo foi salvo na base de conhecimento.",
        });

        queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/articles'] });

        // Reset form and close dialog
        setTitle('');
        setContent('');
        setCategory('');
        setAccessLevel('public');
        setPublished(false);
        setTags('');
        setNewTag('');
        onClose();
      } else {
        toast({
          title: `❌ Erro ao ${articleId ? 'atualizar' : 'criar'} artigo`,
          description: result.message || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error(`❌ [${articleId ? 'UPDATE' : 'CREATE'}-ARTICLE] Error:`, error);
      toast({
        title: `❌ Erro ao ${articleId ? 'atualizar' : 'criar'} artigo`,
        description: error instanceof Error ? error.message : "Não foi possível salvar o artigo. Tente novamente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const addTag = () => {
    if (newTag.trim() && !tags.split(',').map(t => t.trim()).filter(Boolean).includes(newTag.trim())) {
      setTags(prev => prev ? `${prev}, ${newTag.trim()}` : newTag.trim());
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.split(',').map(t => t.trim()).filter(t => t !== tagToRemove).join(', '));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !category) {
      toast({
        title: "⚠️ Campos obrigatórios",
        description: "Preencha título, conteúdo e categoria.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const articleData = {
        title: title.trim(),
        content: content.trim(),
        category,
        access_level: access_level || 'public',
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        status: published ? 'published' : 'draft'
      };

      console.log(`📝 [${articleId ? 'UPDATE' : 'CREATE'}-ARTICLE] Submitting:`, articleData);

      mutation.mutate(articleData);

    } catch (error) {
      console.error(`❌ [${articleId ? 'UPDATE' : 'CREATE'}-ARTICLE] Error:`, error);

      if (error instanceof Error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          toast({
            title: "❌ Erro de configuração do banco de dados",
            description: 'Erro de configuração do banco de dados. Contacte o suporte.',
            variant: "destructive",
          });
        } else {
          toast({
            title: `❌ Erro ao ${articleId ? 'atualizar' : 'criar'} artigo`,
            description: error.message || 'Erro interno do servidor',
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "❌ Erro interno do servidor",
          description: 'Erro interno do servidor',
          variant: "destructive",
        });
      }
      setIsSubmitting(false); // Ensure submitting state is reset on error
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="create-article-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            {articleId ? 'Editar Artigo' : 'Criar Novo Artigo'}
          </DialogTitle>
          <DialogDescription>
            {articleId ? 'Edite o artigo existente na base de conhecimento.' : 'Adicione um novo artigo à base de conhecimento para ajudar sua equipe.'}
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-article-title"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Categoria *
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger data-testid="select-article-category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
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
            <Select value={access_level} onValueChange={(value: 'public' | 'private' | 'restricted') => setAccessLevel(value)}>
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
            <ModernRichTextEditor
              value={content}
              onChange={setContent}
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
            {tags && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.split(',').map((tag) => (
                  <Badge key={tag.trim()} variant="secondary" className="flex items-center gap-1" data-testid={`tag-${tag.trim()}`}>
                    {tag.trim()}
                    <button
                      type="button"
                      onClick={() => removeTag(tag.trim())}
                      className="ml-1 hover:bg-gray-400 rounded-full p-0.5"
                      data-testid={`remove-tag-${tag.trim()}`}
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
              checked={published}
              onCheckedChange={setPublished}
              data-testid="switch-published"
            />
            <Label htmlFor="published" className="text-sm font-medium">
              Publicar imediatamente
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="submit-article"
            >
              <Save className="h-4 w-4 mr-2" />
              {mutation.isPending ? 'Salvando...' : (articleId ? 'Atualizar Artigo' : 'Salvar Artigo')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}