// ✅ 1QA.MD COMPLIANCE: FRONTEND COMPONENT - CLEAN ARCHITECTURE
// Presentation layer component following modern React patterns
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Layers } from "lucide-react";
// import { useLocalization } from '@/hooks/useLocalization';
interface TemplateCreateDialogProps {
  onSuccess?: () => void;
}
export function TemplateCreateDialog({
  // Localization temporarily disabled
 onSuccess }: TemplateCreateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    defaultTags: ""
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/knowledge-base/templates', {
        ...formData,
        defaultTags: formData.defaultTags.split(',').map(tag => tag.trim()).filter(Boolean)
      });
      if (response.ok) {
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: "Template criado com sucesso!",
        });
        setIsOpen(false);
        setFormData({ name: "", description: "", category: "", defaultTags: "" });
        onSuccess?.();
      } else {
        throw new Error('Erro ao criar template');
      }
    } catch (error) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-create-template>
          <Layers className="h-4 w-4" />
          Criar Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md>
        <DialogHeader>
          <DialogTitle>Criar Novo Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4>
          <div>
            <Label htmlFor="name">Nome do Template</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Template FAQ"
              required
              data-testid="input-template-name"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o propósito do template..."
              data-testid="textarea-template-description"
            />
          </div>
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger data-testid="select-template-category>
                <SelectValue placeholder='[TRANSLATION_NEEDED]' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FAQ">FAQ</SelectItem>
                <SelectItem value="Procedimentos">Procedimentos</SelectItem>
                <SelectItem value="Troubleshooting">Resolução de Problemas</SelectItem>
                <SelectItem value="Políticas">Políticas</SelectItem>
                <SelectItem value="Treinamento">Treinamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="defaultTags">Tags Padrão</Label>
            <Input
              id="defaultTags"
              value={formData.defaultTags}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultTags: e.target.value }))}
              placeholder="Ex: faq, ajuda, procedimento (separadas por vírgula)"
              data-testid="input-template-tags"
            />
          </div>
          <div className="flex justify-end gap-2>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-submit-template>
              {isLoading ? "Criando..." : '[TRANSLATION_NEEDED]'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}