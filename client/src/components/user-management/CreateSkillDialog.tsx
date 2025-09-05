
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Brain } from "lucide-react";

interface CreateSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
}

export function CreateSkillDialog({ open, onOpenChange, categories }: CreateSkillDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    level: "intermediate",
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSkillMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/technical-skills-integration/working/skills", data);
      if (!res.ok) throw new Error("Erro ao criar habilidade");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technical-skills-integration/working/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/technical-skills-integration/working/categories"] });
      toast({
        title: "Habilidade criada",
        description: "A habilidade foi criada com sucesso.",
      });
      onOpenChange(false);
      setFormData({
        name: "",
        description: "",
        category: "",
        level: "intermediate",
        isActive: true
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar habilidade",
        description: error?.message || "Falha ao criar a habilidade.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e categoria são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    createSkillMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Nova Habilidade Técnica
          </DialogTitle>
          <DialogDescription>
            Adicione uma nova habilidade técnica ao sistema.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Habilidade *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: JavaScript, React, Node.js"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
                <SelectItem value="Programming Languages">Programming Languages</SelectItem>
                <SelectItem value="Frontend Frameworks">Frontend Frameworks</SelectItem>
                <SelectItem value="Backend Technologies">Backend Technologies</SelectItem>
                <SelectItem value="DevOps">DevOps</SelectItem>
                <SelectItem value="Databases">Databases</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Nível de Dificuldade</Label>
            <Select
              value={formData.level}
              onValueChange={(value) => setFormData({ ...formData, level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Iniciante</SelectItem>
                <SelectItem value="intermediate">Intermediário</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
                <SelectItem value="expert">Especialista</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a habilidade e seu contexto de uso..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createSkillMutation.isPending}>
              {createSkillMutation.isPending ? "Criando..." : "Criar Habilidade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
