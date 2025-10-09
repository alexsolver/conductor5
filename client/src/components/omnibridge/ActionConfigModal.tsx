import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save, X, Plus, Trash2, Upload } from 'lucide-react';
import { UserMultiSelect } from '@/components/ui/UserMultiSelect';
import { UserGroupSelect } from '@/components/ui/UserGroupSelect';
import type { ActionDefinition } from './ActionGrid';
import SimpleAiAgentConfig from './SimpleAiAgentConfig';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ActionConfigModalProps {
  isOpen: boolean;
  action: ActionDefinition | null;
  config: Record<string, any>;
  onClose: () => void;
  onSave: (config: Record<string, any>) => void;
}

export function ActionConfigModal({
  isOpen,
  action,
  config: initialConfig = {},
  onClose,
  onSave
}: ActionConfigModalProps) {
  const [config, setConfig] = useState<Record<string, any>>(initialConfig);
  const { toast } = useToast();

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig, action]);

  // Mutation to create AI agent
  const createAgentMutation = useMutation({
    mutationFn: async (agentData: any) => {
      const response = await apiRequest('POST', '/api/omnibridge/ai-agents/agents', agentData);
      if (!response.ok) {
        throw new Error('Failed to create AI agent');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        // Invalidate agents query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/ai-agents/agents'] });
        
        toast({
          title: 'Agente criado com sucesso!',
          description: `Agente "${data.data.name}" foi criado.`
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar agente',
        description: error.message || 'Tente novamente',
        variant: 'destructive'
      });
    }
  });

  // Mutation to update AI agent
  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, agentData }: { id: string; agentData: any }) => {
      const response = await apiRequest('PUT', `/api/omnibridge/ai-agents/agents/${id}`, agentData);
      if (!response.ok) {
        throw new Error('Failed to update AI agent');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        // Invalidate agents queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/ai-agents/agents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/ai-agents/agents', data.data.id] });
        
        toast({
          title: 'Agente atualizado com sucesso!',
          description: `Agente "${data.data.name}" foi atualizado.`
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar agente',
        description: error.message || 'Tente novamente',
        variant: 'destructive'
      });
    }
  });

  const handleSave = async () => {
    // If AI Agent Interview action
    if (action?.type === 'ai_agent' || action?.type === 'ai_agent_interview') {
      if (config.agentId === 'new') {
        // Create new agent
        try {
          const agentData = {
            name: config.name || 'Novo Agente Entrevistador',
            description: config.description || 'Agente para preencher formulários através de entrevistas',
            configPrompt: config.configPrompt || 'Você é um assistente prestativo e cordial. Conduza entrevistas de forma natural e amigável.',
            allowedFormIds: config.allowedFormIds || [],
            isActive: true
          };

          const result = await createAgentMutation.mutateAsync(agentData);
          
          if (result.success && result.data) {
            // Update config with the new agent ID
            const updatedConfig = { ...config, agentId: result.data.id };
            onSave(updatedConfig);
            onClose();
          }
        } catch (error) {
          // Error is handled by mutation onError
          return;
        }
      } else if (config.agentId) {
        // Update existing agent
        try {
          const agentData = {
            name: config.name || 'Agente Entrevistador',
            description: config.description || 'Agente para preencher formulários através de entrevistas',
            configPrompt: config.configPrompt || 'Você é um assistente prestativo e cordial. Conduza entrevistas de forma natural e amigável.',
            allowedFormIds: config.allowedFormIds || [],
            isActive: true
          };

          await updateAgentMutation.mutateAsync({ id: config.agentId, agentData });
          
          // Save the automation config as well
          onSave(config);
          onClose();
        } catch (error) {
          // Error is handled by mutation onError
          return;
        }
      }
    } else {
      onSave(config);
      onClose();
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const renderEmailConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="recipients">Destinatários *</Label>
        <Input
          id="recipients"
          placeholder="email@example.com, outro@example.com"
          value={config.recipients || ''}
          onChange={(e) => updateConfig('recipients', e.target.value)}
          data-testid="input-recipients"
        />
        <p className="text-xs text-gray-500 mt-1">Separe múltiplos emails com vírgula</p>
      </div>

      <div>
        <Label htmlFor="cc">CC (opcional)</Label>
        <Input
          id="cc"
          placeholder="cc@example.com"
          value={config.cc || ''}
          onChange={(e) => updateConfig('cc', e.target.value)}
          data-testid="input-cc"
        />
      </div>

      <div>
        <Label htmlFor="bcc">BCC (opcional)</Label>
        <Input
          id="bcc"
          placeholder="bcc@example.com"
          value={config.bcc || ''}
          onChange={(e) => updateConfig('bcc', e.target.value)}
          data-testid="input-bcc"
        />
      </div>

      <div>
        <Label htmlFor="subject">Assunto *</Label>
        <Input
          id="subject"
          placeholder="Assunto do email"
          value={config.subject || ''}
          onChange={(e) => updateConfig('subject', e.target.value)}
          data-testid="input-subject"
        />
      </div>

      <div>
        <Label htmlFor="body">Corpo do Email *</Label>
        <Textarea
          id="body"
          placeholder="Digite o conteúdo do email..."
          rows={6}
          value={config.body || ''}
          onChange={(e) => updateConfig('body', e.target.value)}
          data-testid="textarea-body"
        />
        <p className="text-xs text-gray-500 mt-1">
          Variáveis disponíveis: {'{{customer_name}}, {{ticket_id}}, {{message_content}}'}
        </p>
      </div>

      <div>
        <Label htmlFor="template">Template (opcional)</Label>
        <Select value={config.template || ''} onValueChange={(val) => updateConfig('template', val)}>
          <SelectTrigger data-testid="select-template">
            <SelectValue placeholder="Selecione um template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="welcome">Boas-vindas</SelectItem>
            <SelectItem value="followup">Follow-up</SelectItem>
            <SelectItem value="closure">Encerramento</SelectItem>
            <SelectItem value="escalation">Escalação</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderTicketConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Título do Ticket *</Label>
        <Input
          id="title"
          placeholder="Título do ticket"
          value={config.title || ''}
          onChange={(e) => updateConfig('title', e.target.value)}
          data-testid="input-title"
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descrição detalhada..."
          rows={4}
          value={config.description || ''}
          onChange={(e) => updateConfig('description', e.target.value)}
          data-testid="textarea-description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Prioridade</Label>
          <Select value={config.priority || 'medium'} onValueChange={(val) => updateConfig('priority', val)}>
            <SelectTrigger data-testid="select-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select value={config.category || ''} onValueChange={(val) => updateConfig('category', val)}>
            <SelectTrigger data-testid="select-category">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="support">Suporte</SelectItem>
              <SelectItem value="sales">Vendas</SelectItem>
              <SelectItem value="billing">Financeiro</SelectItem>
              <SelectItem value="technical">Técnico</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Atribuir a</Label>
        <UserMultiSelect
          value={config.assignedUsers || []}
          onChange={(users) => updateConfig('assignedUsers', users)}
        />
      </div>
    </div>
  );

  const renderNotificationConfig = () => (
    <div className="space-y-4">
      <div>
        <Label>Notificar Usuários</Label>
        <UserMultiSelect
          value={config.users || []}
          onChange={(users) => updateConfig('users', users)}
        />
      </div>

      <div>
        <Label>Notificar Grupos</Label>
        <UserGroupSelect
          value={config.groups || []}
          onChange={(groups) => updateConfig('groups', groups)}
        />
      </div>

      <div>
        <Label htmlFor="message">Mensagem *</Label>
        <Textarea
          id="message"
          placeholder="Digite a mensagem da notificação..."
          rows={4}
          value={config.message || ''}
          onChange={(e) => updateConfig('message', e.target.value)}
          data-testid="textarea-message"
        />
      </div>

      <div>
        <Label htmlFor="channel">Canal</Label>
        <Select value={config.channel || 'in_app'} onValueChange={(val) => updateConfig('channel', val)}>
          <SelectTrigger data-testid="select-channel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in_app">In-App</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="slack">Slack</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderSchedulingConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="appointmentTitle">Título do Compromisso *</Label>
        <Input
          id="appointmentTitle"
          placeholder="Título"
          value={config.appointmentTitle || ''}
          onChange={(e) => updateConfig('appointmentTitle', e.target.value)}
          data-testid="input-appointment-title"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Data *</Label>
          <Input
            id="date"
            type="date"
            value={config.date || ''}
            onChange={(e) => updateConfig('date', e.target.value)}
            data-testid="input-date"
          />
        </div>

        <div>
          <Label htmlFor="time">Hora *</Label>
          <Input
            id="time"
            type="time"
            value={config.time || ''}
            onChange={(e) => updateConfig('time', e.target.value)}
            data-testid="input-time"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="duration">Duração (minutos)</Label>
        <Input
          id="duration"
          type="number"
          placeholder="60"
          value={config.duration || ''}
          onChange={(e) => updateConfig('duration', e.target.value)}
          data-testid="input-duration"
        />
      </div>

      <div>
        <Label>Participantes</Label>
        <UserMultiSelect
          value={config.participants || []}
          onChange={(users) => updateConfig('participants', users)}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          placeholder="Notas adicionais..."
          rows={3}
          value={config.notes || ''}
          onChange={(e) => updateConfig('notes', e.target.value)}
          data-testid="textarea-notes"
        />
      </div>
    </div>
  );

  const renderAPIConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="url">URL da API *</Label>
        <Input
          id="url"
          placeholder="https://api.example.com/endpoint"
          value={config.url || ''}
          onChange={(e) => updateConfig('url', e.target.value)}
          data-testid="input-url"
        />
      </div>

      <div>
        <Label htmlFor="method">Método HTTP *</Label>
        <Select value={config.method || 'POST'} onValueChange={(val) => updateConfig('method', val)}>
          <SelectTrigger data-testid="select-method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="headers">Headers (JSON)</Label>
        <Textarea
          id="headers"
          placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
          rows={3}
          value={config.headers || ''}
          onChange={(e) => updateConfig('headers', e.target.value)}
          data-testid="textarea-headers"
        />
      </div>

      <div>
        <Label htmlFor="payload">Payload (JSON)</Label>
        <Textarea
          id="payload"
          placeholder='{"key": "value"}'
          rows={4}
          value={config.payload || ''}
          onChange={(e) => updateConfig('payload', e.target.value)}
          data-testid="textarea-payload"
        />
        <p className="text-xs text-gray-500 mt-1">
          Variáveis: {'{{message_id}}, {{customer_email}}, {{ticket_data}}'}
        </p>
      </div>
    </div>
  );

  const renderAIAgentConfig = () => (
    <SimpleAiAgentConfig 
      config={config} 
      onChange={(newConfig) => setConfig(newConfig)}
    />
  );

  const renderConfigForm = () => {
    if (!action) return null;

    switch (action.type) {
      case 'send_email':
      case 'reply_email':
      case 'forward_email':
        return renderEmailConfig();

      case 'create_ticket':
      case 'update_ticket':
        return renderTicketConfig();

      case 'notify_in_app':
      case 'send_sms':
      case 'send_whatsapp':
      case 'send_slack':
      case 'webhook':
        return renderNotificationConfig();

      case 'schedule_appointment':
      case 'reschedule_appointment':
        return renderSchedulingConfig();

      case 'api_request':
      case 'sync_crm':
        return renderAPIConfig();

      case 'ai_agent':
      case 'ai_agent_interview':
        return renderAIAgentConfig();

      default:
        return (
          <div className="py-8 text-center text-gray-500">
            <p>Configurações específicas serão adicionadas em breve para esta ação.</p>
            <p className="text-sm mt-2">Por enquanto, a ação será executada com configurações padrão.</p>
          </div>
        );
    }
  };

  if (!action) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="action-config-modal">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${action.color} rounded-lg text-white`}>
              <action.icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Configurar: {action.name}</DialogTitle>
              <DialogDescription>{action.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {renderConfigForm()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createAgentMutation.isPending || updateAgentMutation.isPending} data-testid="button-cancel">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={createAgentMutation.isPending || updateAgentMutation.isPending} data-testid="button-save">
            <Save className="h-4 w-4 mr-2" />
            {createAgentMutation.isPending ? 'Criando agente...' : updateAgentMutation.isPending ? 'Atualizando agente...' : 'Salvar Configuração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
