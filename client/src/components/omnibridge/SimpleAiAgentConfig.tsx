import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Loader2, FileText } from 'lucide-react';

interface SimpleAIAgent {
  id: string;
  name: string;
  description?: string;
  configPrompt: string;
  allowedFormIds: string[];
  isActive: boolean;
}

interface InternalForm {
  id: string;
  name: string;
  description?: string;
  category: string;
}

export interface SimpleAiAgentConfig {
  agentId?: string;
  name?: string;
  description?: string;
  configPrompt?: string;
  allowedFormIds?: string[];
}

interface SimpleAiAgentConfigProps {
  config: SimpleAiAgentConfig;
  onChange: (config: SimpleAiAgentConfig) => void;
}

export default function SimpleAiAgentConfig({ config, onChange }: SimpleAiAgentConfigProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(config.agentId || '');

  const { data: agentsResponse, isLoading: loadingAgents } = useQuery<{ success: boolean; data: SimpleAIAgent[] }>({
    queryKey: ['/api/omnibridge/ai-agents/agents'],
  });

  const { data: formsResponse, isLoading: loadingForms } = useQuery<{ success: boolean; data: InternalForm[] }>({
    queryKey: ['/api/omnibridge/ai-agents/forms/available'],
  });

  const { data: selectedAgentResponse } = useQuery<{ success: boolean; data: SimpleAIAgent }>({
    queryKey: ['/api/omnibridge/ai-agents/agents', selectedAgentId],
    enabled: !!selectedAgentId && selectedAgentId !== 'new',
  });

  const agents = agentsResponse?.data ?? [];
  const forms = formsResponse?.data ?? [];
  const selectedAgent = selectedAgentResponse?.data;

  // Track if agent data has been loaded to prevent overwriting user changes
  const [agentLoaded, setAgentLoaded] = useState(false);

  useEffect(() => {
    if (selectedAgentId === 'new') {
      onChange({
        agentId: 'new',
        name: config.name || 'Novo Agente Entrevistador',
        description: config.description || '',
        configPrompt: config.configPrompt || 'Você é um assistente prestativo e cordial. Conduza entrevistas de forma natural e amigável.',
        allowedFormIds: config.allowedFormIds || []
      });
      setAgentLoaded(true);
    } else if (selectedAgent && !agentLoaded) {
      // Only load agent data on first load, not on subsequent re-renders
      onChange({
        agentId: selectedAgent.id,
        name: selectedAgent.name,
        description: selectedAgent.description,
        configPrompt: selectedAgent.configPrompt,
        allowedFormIds: selectedAgent.allowedFormIds
      });
      setAgentLoaded(true);
    }
  }, [selectedAgentId, selectedAgent, agentLoaded]);

  // Reset agentLoaded flag when agent selection changes
  useEffect(() => {
    setAgentLoaded(false);
  }, [selectedAgentId]);

  const handleFormToggle = (formId: string, checked: boolean) => {
    const currentForms = config.allowedFormIds || [];
    const newForms = checked
      ? [...currentForms, formId]
      : currentForms.filter(id => id !== formId);

    onChange({
      ...config,
      allowedFormIds: newForms
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <CardTitle>Configuração do Agente Entrevistador</CardTitle>
          </div>
          <CardDescription>
            Configure um agente para conduzir entrevistas e preencher formulários automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="agent-select">Selecionar Agente</Label>
            <Select
              value={selectedAgentId}
              onValueChange={setSelectedAgentId}
            >
              <SelectTrigger id="agent-select">
                <SelectValue placeholder={loadingAgents ? "Carregando..." : "Selecione ou crie um agente"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">+ Criar Novo Agente</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAgentId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="agent-name">Nome do Agente</Label>
                <Input
                  id="agent-name"
                  value={config.name || ''}
                  onChange={(e) => onChange({ ...config, name: e.target.value })}
                  placeholder="Ex: Assistente de Cadastro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-description">Descrição (Opcional)</Label>
                <Input
                  id="agent-description"
                  value={config.description || ''}
                  onChange={(e) => onChange({ ...config, description: e.target.value })}
                  placeholder="Ex: Agente para cadastro de clientes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="config-prompt">Prompt de Configuração</Label>
                <Textarea
                  id="config-prompt"
                  value={config.configPrompt || ''}
                  onChange={(e) => onChange({ ...config, configPrompt: e.target.value })}
                  placeholder="Descreva como o agente deve se comportar durante a entrevista..."
                  className="min-h-[120px]"
                />
                <p className="text-sm text-muted-foreground">
                  Use linguagem natural para definir o comportamento do agente.
                  Ex: "Seja cordial e paciente. Explique cada campo antes de perguntar."
                </p>
              </div>

              <div className="space-y-2">
                <Label>Formulários Permitidos</Label>
                <Card>
                  <ScrollArea className="h-[200px] w-full">
                    <div className="p-4 space-y-3">
                      {loadingForms ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : forms.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum formulário disponível. Crie formulários em Internal Forms primeiro.
                        </p>
                      ) : (
                        forms.map((form) => (
                          <div key={form.id} className="flex items-start space-x-3">
                            <Checkbox
                              id={`form-${form.id}`}
                              checked={config.allowedFormIds?.includes(form.id) || false}
                              onCheckedChange={(checked) => handleFormToggle(form.id, checked as boolean)}
                            />
                            <div className="space-y-1 leading-none">
                              <label
                                htmlFor={`form-${form.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                              >
                                <FileText className="h-4 w-4 text-blue-500" />
                                {form.name}
                              </label>
                              {form.description && (
                                <p className="text-sm text-muted-foreground">
                                  {form.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Categoria: {form.category}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </Card>
                <p className="text-sm text-muted-foreground">
                  Selecione os formulários que este agente pode preencher durante entrevistas
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
