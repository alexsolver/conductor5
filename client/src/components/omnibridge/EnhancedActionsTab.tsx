import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActionCatalog, ActionCatalogData, ActionDefinition } from './ActionCatalog';
import { ConversationalFormBuilder } from './ConversationalFormBuilder';
import ActionFieldMapper, { ActionFieldConfig } from './ActionFieldMapper';
import { Sparkles, Settings, CheckCircle2, Eye } from 'lucide-react';

interface EnhancedActionsTabProps {
  availableActions: Record<string, boolean>;
  actionConfigs: Record<string, any>;
  onActionToggle: (actionId: string, enabled: boolean) => void;
  onActionConfigChange: (actionId: string, config: any) => void;
}

export function EnhancedActionsTab({
  availableActions,
  actionConfigs,
  onActionToggle,
  onActionConfigChange
}: EnhancedActionsTabProps) {
  const [configuringAction, setConfiguringAction] = useState<ActionDefinition | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // Get selected action IDs
  const selectedActionIds = Object.keys(availableActions).filter(key => availableActions[key]);
  
  // Get count of configured actions
  const configuredCount = selectedActionIds.filter(id => actionConfigs[id]).length;

  const handleActionConfigure = (actionId: string) => {
    const action = ActionCatalogData.find(a => a.id === actionId);
    if (action) {
      setConfiguringAction(action);
      setConfigDialogOpen(true);
    }
  };

  const handleConfigSave = (config: any) => {
    if (configuringAction) {
      onActionConfigChange(configuringAction.name, config);
      setConfigDialogOpen(false);
      setConfiguringAction(null);
    }
  };

  // Map action IDs to their internal names
  const actionIdToName: Record<string, string> = {
    'create_ticket': 'createTicket',
    'create_client': 'createClient',
    'create_location': 'createLocation',
    'create_beneficiary': 'createBeneficiary',
    'send_email': 'sendEmail',
    'reply_email': 'replyEmail',
    'send_sms': 'sendSms',
    'webhook': 'webhook',
    'api_call': 'apiCall',
    'query_knowledge_base': 'queryKnowledgeBase',
    'search_tickets': 'searchTickets',
    'escalate': 'escalate',
    'schedule_appointment': 'scheduleAppointment',
    'generate_report': 'generateReport'
  };

  const handleToggle = (actionId: string, enabled: boolean) => {
    const internalName = actionIdToName[actionId] || actionId;
    onActionToggle(internalName, enabled);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Ações do AI Agent
              </CardTitle>
              <CardDescription className="mt-1">
                Selecione e configure as ações que a IA pode executar
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{selectedActionIds.length}</p>
              <p className="text-xs text-muted-foreground">ações ativas</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-muted-foreground">
                {configuredCount} configuradas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-500" />
              <span className="text-muted-foreground">
                {selectedActionIds.length - configuredCount} pendentes
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Catalog */}
      <ActionCatalog
        selectedActions={Object.keys(availableActions)
          .filter(key => availableActions[key])
          .map(key => {
            // Reverse mapping: find action ID from internal name
            const actionId = Object.keys(actionIdToName).find(id => actionIdToName[id] === key) || key;
            return actionId;
          })}
        onActionToggle={handleToggle}
        onActionConfigure={handleActionConfigure}
      />

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              {configuringAction && (
                <>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${configuringAction.color}`}>
                    <configuringAction.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">
                      Configurar: {configuringAction.label}
                    </DialogTitle>
                    <DialogDescription>
                      {configuringAction.longDescription}
                    </DialogDescription>
                  </div>
                </>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {configuringAction && (
              <ActionConfigContent
                action={configuringAction}
                currentConfig={actionConfigs[configuringAction.name]}
                onConfigChange={handleConfigSave}
                onCancel={() => setConfigDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ActionConfigContentProps {
  action: ActionDefinition;
  currentConfig: any;
  onConfigChange: (config: any) => void;
  onCancel: () => void;
}

function ActionConfigContent({ action, currentConfig, onConfigChange, onCancel }: ActionConfigContentProps) {
  const [config, setConfig] = useState(currentConfig || {});

  // Determine which entity this action creates
  const entityMap: Record<string, string> = {
    'create_ticket': 'ticket',
    'create_client': 'client',
    'create_location': 'location',
    'create_beneficiary': 'beneficiary'
  };

  const entityId = entityMap[action.id];

  // For entity creation actions, use ConversationalFormBuilder
  if (entityId) {
    return (
      <div className="space-y-6">
        <ConversationalFormBuilder
          entityId={entityId}
          initialFields={config.fieldsToMap || []}
          onChange={(fields) => {
            setConfig({
              ...config,
              actionType: action.name,
              fieldsToMap: fields,
              conversationMode: config.conversationMode || 'natural',
              feedbackMessage: config.feedbackMessage || `✅ ${action.label} criado com sucesso!`,
              showResultDetails: config.showResultDetails !== false
            });
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configurações Avançadas</CardTitle>
            <CardDescription>Modo de conversa e feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <ActionFieldMapper
              actionType={action.name as any}
              config={config}
              onChange={(updatedConfig: ActionFieldConfig) => setConfig(updatedConfig)}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} data-testid="button-cancel-config">
            Cancelar
          </Button>
          <Button onClick={() => onConfigChange(config)} data-testid="button-save-config">
            Salvar Configuração
          </Button>
        </div>
      </div>
    );
  }

  // For other actions, use ActionFieldMapper
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurar Ação</CardTitle>
          <CardDescription>
            Configure como a IA deve executar esta ação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionFieldMapper
            actionType={action.name as any}
            config={currentConfig || {
              actionType: action.name as any,
              fieldsToMap: [],
              conversationMode: 'natural',
              feedbackMessage: `✅ ${action.label} executado com sucesso!`,
              showResultDetails: true
            }}
            onChange={(updatedConfig: ActionFieldConfig) => setConfig(updatedConfig)}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} data-testid="button-cancel-config">
          Cancelar
        </Button>
        <Button onClick={() => onConfigChange(config)} data-testid="button-save-config">
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
}
