
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Plus, Edit, Trash2, Play, MessageSquare, Settings, Save } from 'lucide-react';

interface ConversationFlow {
  id: string;
  name: string;
  description: string;
  triggerKeywords: string[];
  enabled: boolean;
  steps: ConversationStep[];
  finalActions: any[];
}

interface ConversationStep {
  id: string;
  type: 'menu' | 'text_input' | 'confirmation' | 'action_execution';
  prompt: string;
  options?: Array<{
    id: string;
    label: string;
    value: any;
    nextStepId?: string;
  }>;
  inputType?: string;
  validation?: any;
  nextStepId?: string;
}

export default function ConversationalAIManager() {
  const [flows, setFlows] = useState<ConversationFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<ConversationFlow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      const response = await fetch('/api/omnibridge/conversational-flows');
      const data = await response.json();
      if (data.success) {
        setFlows(data.flows);
      }
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error);
    }
  };

  const saveFlow = async (flow: ConversationFlow) => {
    try {
      const method = flow.id ? 'PUT' : 'POST';
      const url = flow.id ? `/api/omnibridge/conversational-flows/${flow.id}` : '/api/omnibridge/conversational-flows';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flow)
      });
      
      const data = await response.json();
      if (data.success) {
        loadFlows();
        setIsEditing(false);
        setSelectedFlow(null);
      }
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error);
    }
  };

  const testFlow = async () => {
    if (!testMessage) return;
    
    try {
      const response = await fetch('/api/omnibridge/conversational-ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          tenantId: 'test'
        })
      });
      
      const data = await response.json();
      setTestResult(data.response || 'Nenhum fluxo encontrado para esta mensagem');
    } catch (error) {
      setTestResult('Erro ao testar: ' + error);
    }
  };

  const toggleFlow = async (flowId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/omnibridge/conversational-flows/${flowId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      if (response.ok) {
        loadFlows();
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            IA Conversacional
          </h2>
          <p className="text-muted-foreground">
            Configure fluxos de conversação automatizados para diferentes cenários
          </p>
        </div>
        
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedFlow(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Fluxo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedFlow ? 'Editar Fluxo' : 'Criar Novo Fluxo'}
              </DialogTitle>
              <DialogDescription>
                Configure um fluxo de conversação automatizado
              </DialogDescription>
            </DialogHeader>
            <FlowEditor flow={selectedFlow} onSave={saveFlow} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="flows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flows">Fluxos Ativos</TabsTrigger>
          <TabsTrigger value="test">Testar IA</TabsTrigger>
          <TabsTrigger value="analytics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="flows" className="space-y-4">
          <div className="grid gap-4">
            {flows.map((flow) => (
              <Card key={flow.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      {flow.name}
                      <Badge variant={flow.enabled ? 'default' : 'secondary'}>
                        {flow.enabled ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{flow.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={flow.enabled}
                      onCheckedChange={(enabled) => toggleFlow(flow.id, enabled)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFlow(flow);
                        setIsEditing(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {flow.triggerKeywords.map((keyword, index) => (
                      <Badge key={index} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {flow.steps.length} etapas configuradas
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testar IA Conversacional</CardTitle>
              <CardDescription>
                Digite uma mensagem para testar qual fluxo será ativado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma mensagem de teste..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && testFlow()}
                />
                <Button onClick={testFlow}>
                  <Play className="h-4 w-4 mr-2" />
                  Testar
                </Button>
              </div>
              
              {testResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Resposta da IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Métricas dos Fluxos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Métricas em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FlowEditor({ flow, onSave }: { flow: ConversationFlow | null; onSave: (flow: ConversationFlow) => void }) {
  const [editingFlow, setEditingFlow] = useState<ConversationFlow>(
    flow || {
      id: '',
      name: '',
      description: '',
      triggerKeywords: [],
      enabled: true,
      steps: [],
      finalActions: []
    }
  );

  const [keywordInput, setKeywordInput] = useState('');

  const addKeyword = () => {
    if (keywordInput.trim()) {
      setEditingFlow(prev => ({
        ...prev,
        triggerKeywords: [...prev.triggerKeywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    setEditingFlow(prev => ({
      ...prev,
      triggerKeywords: prev.triggerKeywords.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="name">Nome do Fluxo</Label>
          <Input
            id="name"
            value={editingFlow.name}
            onChange={(e) => setEditingFlow(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Suporte Técnico"
          />
        </div>
        
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={editingFlow.description}
            onChange={(e) => setEditingFlow(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descreva o propósito deste fluxo"
          />
        </div>

        <div>
          <Label>Palavras-chave de Ativação</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Digite uma palavra-chave"
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            />
            <Button type="button" onClick={addKeyword}>Adicionar</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {editingFlow.triggerKeywords.map((keyword, index) => (
              <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeKeyword(index)}>
                {keyword} ×
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setEditingFlow(flow || {
          id: '',
          name: '',
          description: '',
          triggerKeywords: [],
          enabled: true,
          steps: [],
          finalActions: []
        })}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(editingFlow)}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Fluxo
        </Button>
      </div>
    </div>
  );
}
