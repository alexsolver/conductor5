import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, X, ArrowRight } from "lucide-react";
// import { useLocalization } from '@/hooks/useLocalization';

interface WorkflowConfigurationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'approval' | 'notification' | 'assignment' | 'status_change';
  assigneeType: 'user' | 'role' | 'group';
  assigneeId?: string;
  condition?: string;
  required: boolean;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  steps: WorkflowStep[];
}

export function WorkflowConfigurationDialog({
  // Localization temporarily disabled
 isOpen, onClose }: WorkflowConfigurationDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<WorkflowTemplate>({
    id: '',
    name: '',
    description: '',
    category: 'technical_support',
    enabled: true,
    steps: []
  });

  const [newStep, setNewStep] = useState<Partial<WorkflowStep>>({
    name: '',
    type: 'approval',
    assigneeType: 'user',
    required: true
  });

  const stepTypes = [
    { value: 'approval', label: 'Aprovação' },
    { value: 'notification', label: 'Notificação' },
    { value: 'assignment', label: 'Atribuição' },
    { value: 'status_change', label: 'Mudança de Status' }
  ];

  const assigneeTypes = [
    { value: 'user', label: 'Usuário Específico' },
    { value: 'role', label: 'Função/Cargo' },
    { value: 'group', label: 'Grupo' }
  ];

  const categories = [
    { value: 'technical_support', label: 'Suporte Técnico' },
    { value: 'troubleshooting', label: 'Solução de Problemas' },
    { value: 'user_guide', label: 'Guia do Usuário' },
    { value: 'faq', label: 'FAQ' },
    { value: 'policy', label: 'Política' },
    { value: 'process', label: 'Processo' },
    { value: 'training', label: 'Treinamento' },
    { value: 'announcement', label: 'Anúncio' },
    { value: 'best_practice', label: 'Melhores Práticas' },
    { value: 'other', label: 'Outros' }
  ];

  const addStep = () => {
    if (!newStep.name || !newStep.type) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Por favor, preencha o nome e tipo do passo.",
        variant: "destructive",
      });
      return;
    }

    const step: WorkflowStep = {
      id: crypto.randomUUID(),
      name: newStep.name!,
      type: newStep.type as WorkflowStep['type'],
      assigneeType: newStep.assigneeType as WorkflowStep['assigneeType'],
      assigneeId: newStep.assigneeId,
      condition: newStep.condition,
      required: newStep.required!
    };

    setCurrentTemplate(prev => ({
      ...prev,
      steps: [...prev.steps, step]
    }));

    setNewStep({
      name: '',
      type: 'approval',
      assigneeType: 'user',
      required: true
    });
  };

  const removeStep = (stepId: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentTemplate.name.trim() || !currentTemplate.category) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Por favor, preencha o nome e categoria do workflow.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would make an API call to save the workflow
      console.log('💼 [WORKFLOW] Saving workflow:', currentTemplate);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "O workflow foi salvo e está pronto para uso.",
      });

      // Reset form and close dialog
      setCurrentTemplate({
        id: '',
        name: '',
        description: '',
        category: 'technical_support',
        enabled: true,
        steps: []
      });
      onClose();
    } catch (error) {
      console.error('❌ [WORKFLOW] Error:', error);
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Ocorreu um erro interno. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar Workflow de Aprovação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Workflow Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome do Workflow *</Label>
              <Input
                id="name"
                value={currentTemplate.name}
                onChange={(e) => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Aprovação de Artigos Técnicos"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select 
                value={currentTemplate.category} 
                onValueChange={(value) => setCurrentTemplate(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={currentTemplate.description}
              onChange={(e) => setCurrentTemplate(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva quando e como este workflow deve ser usado..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={currentTemplate.enabled}
              onCheckedChange={(checked) => setCurrentTemplate(prev => ({ ...prev, enabled: checked }))}
            />
            <Label htmlFor="enabled">Workflow ativo</Label>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Passos do Workflow</h3>

            {/* Existing Steps */}
            {currentTemplate.steps.length > 0 && (
              <div className="space-y-2">
                {currentTemplate.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <span className="font-mono text-sm text-gray-500">#{index + 1}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{stepTypes.find(t => t.value === step.type)?.label}</Badge>
                        <span className="font-medium">{step.name}</span>
                        {step.required && <Badge variant="secondary">Obrigatório</Badge>}
                      </div>
                      <div className="text-sm text-gray-600">
                        {assigneeTypes.find(t => t.value === step.assigneeType)?.label}
                        {step.assigneeId && `: ${step.assigneeId}`}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(step.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Step */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Adicionar Novo Passo</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="step-name">Nome do Passo</Label>
                  <Input
                    id="step-name"
                    value={newStep.name || ''}
                    onChange={(e) => setNewStep(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Aprovação do Supervisor"
                  />
                </div>

                <div>
                  <Label htmlFor="step-type">Tipo</Label>
                  <Select 
                    value={newStep.type} 
                    onValueChange={(value) => setNewStep(prev => ({ ...prev, type: value as WorkflowStep['type'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stepTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignee-type">Responsável</Label>
                  <Select 
                    value={newStep.assigneeType} 
                    onValueChange={(value) => setNewStep(prev => ({ ...prev, assigneeType: value as WorkflowStep['assigneeType'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assigneeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="step-required"
                    checked={newStep.required}
                    onCheckedChange={(checked) => setNewStep(prev => ({ ...prev, required: checked }))}
                  />
                  <Label htmlFor="step-required">Passo obrigatório</Label>
                </div>

                <Button type="button" onClick={addStep} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Passo
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : '[TRANSLATION_NEEDED]'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}