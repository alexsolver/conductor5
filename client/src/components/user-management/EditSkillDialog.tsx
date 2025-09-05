
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Edit } from "lucide-react";

interface EditSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: any;
  categories: string[];
}

export function EditSkillDialog({ open, onOpenChange, skill, categories }: EditSkillDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    level: "intermediate",
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (skill) {
      setFormData({
        name: skill.name || "",
        description: skill.description || "",
        category: skill.category || "",
        level: skill.level || "intermediate",
        isActive: skill.isActive !== undefined ? skill.isActive : true
      });
    }
  }, [skill]);

  const updateSkillMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/technical-skills-integration/working/skills/${skill.id}`, data);
      if (!res.ok) throw new Error("Erro ao atualizar habilidade");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technical-skills-integration/working/skills"] });
      toast({
        title: "Habilidade atualizada",
        description: "A habilidade foi atualizada com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar habilidade",
        description: error?.message || "Falha ao atualizar a habilidade.",
        variant: "destructive",
      });
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/technical-skills-integration/working/skills/${skill.id}`);
      if (!res.ok) throw new Error("Erro ao excluir habilidade");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technical-skills-integration/working/skills"] });
      toast({
        title: "Habilidade excluída",
        description: "A habilidade foi excluída com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir habilidade",
        description: error?.message || "Falha ao excluir a habilidade.",
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
    updateSkillMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm("Tem certeza que deseja excluir esta habilidade? Esta ação não pode ser desfeita.")) {
      deleteSkillMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Habilidade Técnica
          </DialogTitle>
          <DialogDescription>
            Modifique as informações da habilidade técnica.
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

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Habilidade ativa</Label>
          </div>

          <DialogFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteSkillMutation.isPending}
            >
              {deleteSkillMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateSkillMutation.isPending}>
                {updateSkillMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
