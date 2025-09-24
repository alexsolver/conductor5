import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import FlowEditor from './FlowEditor';
import {
  Bot, MessageSquare, Plus, Save, Play, Trash2, Settings, Eye, Copy, Download, Upload,
  Edit, Pause, Workflow, Users, Calendar, Mail, Phone, Globe, Database, Brain, 
  GitBranch, CheckCircle, AlertCircle, Target, Tag, Hash, FileText, Image,
  Video, Mic, Camera, Map, ShoppingCart, CreditCard, Webhook, Network,
  Timer, Flag, Repeat, Shuffle, MousePointer2, Layers, Filter, Search,
  ArrowRight, Plug, HelpCircle, Info, AlertTriangle, MoreHorizontal
} from 'lucide-react';

interface ChatbotBot {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  configuration: Record<string, any>;
  metadata: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

interface ChatbotFlow {
  id: string;
  botId: string;
  name: string;
  description?: string;
  isActive: boolean;
  isMain: boolean;
  version: number;
  metadata: Record<string, any>;
}

export default function ChatbotManager() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [selectedView, setSelectedView] = useState<'list' | 'create' | 'edit' | 'flow-editor'>('list');
  const [selectedBot, setSelectedBot] = useState<ChatbotBot | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [botConfig, setBotConfig] = useState<Partial<ChatbotBot>>({
    name: '',
    description: '',
    isActive: true,
    configuration: {
      greeting: 'Olá! Como posso ajudar você hoje?',
      fallbackMessage: 'Desculpe, não entendi. Pode reformular sua pergunta?',
      maxRetries: 3,
      transferToHuman: true,
      aiEnabled: false,
      channels: [],
      metadata: {}
    },
    metadata: {}
  });

  // Load chatbots
  const { data: chatbots, isLoading: loadingBots, refetch: refetchBots } = useQuery<{data: ChatbotBot[]}>({
    queryKey: ['/api/omnibridge/chatbots'],
    queryFn: () => apiRequest('/api/omnibridge/chatbots', { method: 'GET' }),
    retry: 1
  });

  // Create chatbot mutation
  const createBotMutation = useMutation({
    mutationFn: async (botData: Partial<ChatbotBot>) => {
      return apiRequest('/api/omnibridge/chatbots', {
        method: 'POST',
        body: JSON.stringify(botData)
      });
    },
    onSuccess: () => {
      toast({
        title: 'Chatbot Criado',
        description: 'Chatbot criado com sucesso!'
      });
      setShowCreateModal(false);
      setBotConfig({
        name: '',
        description: '',
        isActive: true,
        configuration: {
          greeting: 'Olá! Como posso ajudar você hoje?',
          fallbackMessage: 'Desculpe, não entendi. Pode reformular sua pergunta?',
          maxRetries: 3,
          transferToHuman: true,
          aiEnabled: false,
          channels: [],
          metadata: {}
        },
        metadata: {}
      });
      refetchBots();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar chatbot',
        variant: 'destructive'
      });
    }
  });

  // Update chatbot mutation
  const updateBotMutation = useMutation({
    mutationFn: async ({ id, botData }: { id: string; botData: Partial<ChatbotBot> }) => {
      return apiRequest(`/api/omnibridge/chatbots/${id}`, {
        method: 'PUT',
        body: JSON.stringify(botData)
      });
    },
    onSuccess: () => {
      toast({
        title: 'Chatbot Atualizado',
        description: 'Chatbot atualizado com sucesso!'
      });
      setShowEditModal(false);
      setSelectedBot(null);
      refetchBots();
    }
  });

  // Delete chatbot mutation
  const deleteBotMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/omnibridge/chatbots/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Chatbot Removido',
        description: 'Chatbot removido com sucesso!'
      });
      refetchBots();
    }
  });

  const handleCreateBot = () => {
    createBotMutation.mutate(botConfig);
  };

  const handleUpdateBot = () => {
    if (selectedBot) {
      updateBotMutation.mutate({ id: selectedBot.id, botData: botConfig });
    }
  };

  const handleDeleteBot = (bot: ChatbotBot) => {
    if (window.confirm(`Tem certeza que deseja excluir o chatbot "${bot.name}"?`)) {
      deleteBotMutation.mutate(bot.id);
    }
  };

  const handleEditBot = (bot: ChatbotBot) => {
    setSelectedBot(bot);
    setBotConfig({
      name: bot.name,
      description: bot.description,
      isActive: bot.isActive,
      configuration: bot.configuration,
      metadata: bot.metadata
    });
    setShowEditModal(true);
  };

  const handleOpenFlowEditor = (bot: ChatbotBot) => {
    setSelectedBot(bot);
    setSelectedView('flow-editor');
  };

  const handleBackToList = () => {
    setSelectedView('list');
    setSelectedBot(null);
  };

  if (selectedView === 'flow-editor' && selectedBot) {
    return (
      <FlowEditor 
        botId={selectedBot.id} 
        onClose={handleBackToList}
      />
    );
  }

  return (
    <div className="h-full bg-gray-50" data-testid="chatbot-manager">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Bot className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900" data-testid="page-title">
              Gerenciamento de Chatbots
            </h1>
            <p className="text-sm text-gray-500">
              Crie e gerencie seus chatbots inteligentes
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => setShowCreateModal(true)}
            disabled={createBotMutation.isPending}
            data-testid="button-create-bot"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Chatbot
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {loadingBots ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Chatbots</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="text-total-bots">
                        {chatbots?.data?.length || 0}
                      </p>
                    </div>
                    <Bot className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ativos</p>
                      <p className="text-2xl font-bold text-green-600" data-testid="text-active-bots">
                        {chatbots?.data?.filter(bot => bot.isActive).length || 0}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Inativos</p>
                      <p className="text-2xl font-bold text-red-600" data-testid="text-inactive-bots">
                        {chatbots?.data?.filter(bot => !bot.isActive).length || 0}
                      </p>
                    </div>
                    <Pause className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Com IA</p>
                      <p className="text-2xl font-bold text-purple-600" data-testid="text-ai-bots">
                        {chatbots?.data?.filter(bot => bot.configuration?.aiEnabled).length || 0}
                      </p>
                    </div>
                    <Brain className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chatbots List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Seus Chatbots</span>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => refetchBots()}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Gerencie e configure seus chatbots inteligentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!chatbots?.data?.length ? (
                  <div className="text-center py-12">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum chatbot encontrado
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Crie seu primeiro chatbot para começar
                    </p>
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Chatbot
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chatbots.data.map((bot) => (
                      <Card key={bot.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Bot className="h-5 w-5 text-blue-600" />
                              <span className="font-medium truncate" data-testid={`bot-name-${bot.id}`}>
                                {bot.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Badge variant={bot.isActive ? 'default' : 'secondary'}>
                                {bot.isActive ? 'Ativo' : 'Inativo'}
                              </Badge>
                              {bot.configuration?.aiEnabled && (
                                <Badge variant="outline">
                                  <Brain className="h-3 w-3 mr-1" />
                                  IA
                                </Badge>
                              )}
                            </div>
                          </div>
                          {bot.description && (
                            <p className="text-sm text-gray-600 truncate">
                              {bot.description}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleOpenFlowEditor(bot)}
                                data-testid={`button-edit-flow-${bot.id}`}
                              >
                                <Workflow className="h-4 w-4 mr-1" />
                                Editar Flow
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditBot(bot)}
                                data-testid={`button-edit-bot-${bot.id}`}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Config
                              </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleDeleteBot(bot)}
                                data-testid={`button-delete-bot-${bot.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Create Chatbot Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl" data-testid="create-bot-modal">
          <DialogHeader>
            <DialogTitle>Criar Novo Chatbot</DialogTitle>
            <DialogDescription>
              Configure as informações básicas do seu chatbot
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bot-name">Nome do Chatbot</Label>
              <Input
                id="bot-name"
                placeholder="Ex: Atendimento Geral"
                value={botConfig.name}
                onChange={(e) => setBotConfig(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-bot-name"
              />
            </div>

            <div>
              <Label htmlFor="bot-description">Descrição (opcional)</Label>
              <Textarea
                id="bot-description"
                placeholder="Descreva brevemente o propósito deste chatbot"
                value={botConfig.description}
                onChange={(e) => setBotConfig(prev => ({ ...prev, description: e.target.value }))}
                data-testid="textarea-bot-description"
              />
            </div>

            <div>
              <Label htmlFor="bot-greeting">Mensagem de Saudação</Label>
              <Textarea
                id="bot-greeting"
                placeholder="Olá! Como posso ajudar você hoje?"
                value={botConfig.configuration?.greeting || ''}
                onChange={(e) => setBotConfig(prev => ({ 
                  ...prev, 
                  configuration: { ...prev.configuration, greeting: e.target.value }
                }))}
                data-testid="textarea-bot-greeting"
              />
            </div>

            <div>
              <Label htmlFor="bot-fallback">Mensagem de Fallback</Label>
              <Textarea
                id="bot-fallback"
                placeholder="Desculpe, não entendi. Pode reformular sua pergunta?"
                value={botConfig.configuration?.fallbackMessage || ''}
                onChange={(e) => setBotConfig(prev => ({ 
                  ...prev, 
                  configuration: { ...prev.configuration, fallbackMessage: e.target.value }
                }))}
                data-testid="textarea-bot-fallback"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="bot-active"
                  checked={botConfig.isActive}
                  onCheckedChange={(checked) => setBotConfig(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="bot-active">Ativar chatbot</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="bot-ai"
                  checked={botConfig.configuration?.aiEnabled || false}
                  onCheckedChange={(checked) => setBotConfig(prev => ({ 
                    ...prev, 
                    configuration: { ...prev.configuration, aiEnabled: checked }
                  }))}
                />
                <Label htmlFor="bot-ai">Habilitar IA</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateBot}
                disabled={!botConfig.name || createBotMutation.isPending}
                data-testid="button-save-bot"
              >
                {createBotMutation.isPending ? 'Criando...' : 'Criar Chatbot'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Chatbot Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl" data-testid="edit-bot-modal">
          <DialogHeader>
            <DialogTitle>Editar Chatbot</DialogTitle>
            <DialogDescription>
              Modifique as configurações do chatbot
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-bot-name">Nome do Chatbot</Label>
              <Input
                id="edit-bot-name"
                value={botConfig.name}
                onChange={(e) => setBotConfig(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-edit-bot-name"
              />
            </div>

            <div>
              <Label htmlFor="edit-bot-description">Descrição</Label>
              <Textarea
                id="edit-bot-description"
                value={botConfig.description}
                onChange={(e) => setBotConfig(prev => ({ ...prev, description: e.target.value }))}
                data-testid="textarea-edit-bot-description"
              />
            </div>

            <div>
              <Label htmlFor="edit-bot-greeting">Mensagem de Saudação</Label>
              <Textarea
                id="edit-bot-greeting"
                value={botConfig.configuration?.greeting || ''}
                onChange={(e) => setBotConfig(prev => ({ 
                  ...prev, 
                  configuration: { ...prev.configuration, greeting: e.target.value }
                }))}
                data-testid="textarea-edit-bot-greeting"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-bot-active"
                  checked={botConfig.isActive}
                  onCheckedChange={(checked) => setBotConfig(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="edit-bot-active">Ativar chatbot</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-bot-ai"
                  checked={botConfig.configuration?.aiEnabled || false}
                  onCheckedChange={(checked) => setBotConfig(prev => ({ 
                    ...prev, 
                    configuration: { ...prev.configuration, aiEnabled: checked }
                  }))}
                />
                <Label htmlFor="edit-bot-ai">Habilitar IA</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateBot}
                disabled={!botConfig.name || updateBotMutation.isPending}
                data-testid="button-update-bot"
              >
                {updateBotMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}