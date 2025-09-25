
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Star,
  Clock,
  Users,
  MessageSquare,
  Bot,
  Zap,
  Bell,
  FileText,
  AlertCircle,
  CheckCircle,
  Settings,
  Target,
  Mail,
  Phone,
  Archive,
  Tag,
  Forward,
  Reply,
  Lightbulb
} from 'lucide-react';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: any) => void;
}

const automationTemplates = [
  {
    id: 'auto-reply-basic',
    name: 'Resposta Automática Básica',
    description: 'Responde automaticamente para mensagens com palavras-chave específicas',
    category: 'Atendimento',
    popularity: 5,
    setup_time: '2 min',
    icon: Reply,
    color: 'bg-blue-500',
    preview: 'Quando receber mensagem com "ajuda" → Responder "Olá! Como posso ajudar?"',
    config: {
      trigger: { type: 'keyword', keywords: ['ajuda', 'help', 'suporte'] },
      action: { type: 'auto_reply', message: 'Olá! Como posso ajudar você hoje?' }
    }
  },
  {
    id: 'urgent-escalation',
    name: 'Escalação de Urgência',
    description: 'Escala automaticamente mensagens urgentes para supervisores',
    category: 'Escalação',
    popularity: 4,
    setup_time: '3 min',
    icon: AlertCircle,
    color: 'bg-red-500',
    preview: 'Quando prioridade = urgente → Notificar supervisor + Criar ticket',
    config: {
      trigger: { type: 'priority', level: 'urgent' },
      action: { type: 'escalate', notify_supervisor: true, create_ticket: true }
    }
  },
  {
    id: 'create-ticket-keywords',
    name: 'Criação Automática de Tickets',
    description: 'Cria tickets automaticamente para problemas específicos',
    category: 'Tickets',
    popularity: 5,
    setup_time: '2 min',
    icon: FileText,
    color: 'bg-green-500',
    preview: 'Quando receber "problema", "bug", "erro" → Criar ticket automaticamente',
    config: {
      trigger: { type: 'keyword', keywords: ['problema', 'bug', 'erro', 'defeito'] },
      action: { type: 'create_ticket', priority: 'high', category: 'technical' }
    }
  },
  {
    id: 'out-of-hours',
    name: 'Resposta Fora do Horário',
    description: 'Informa sobre horário de funcionamento fora do expediente',
    category: 'Horário',
    popularity: 4,
    setup_time: '1 min',
    icon: Clock,
    color: 'bg-purple-500',
    preview: 'Fora do horário → Informar horário de funcionamento',
    config: {
      trigger: { type: 'time_based', outside_hours: true },
      action: { type: 'auto_reply', message: 'Estamos fora do horário. Funcionamos de 8h às 18h.' }
    }
  },
  {
    id: 'email-to-whatsapp',
    name: 'Notificação Cross-Channel',
    description: 'Notifica no WhatsApp quando recebe email importante',
    category: 'Integração',
    popularity: 3,
    setup_time: '4 min',
    icon: Mail,
    color: 'bg-indigo-500',
    preview: 'Email importante → Notificar no WhatsApp',
    config: {
      trigger: { type: 'channel', channel: 'email', priority: 'high' },
      action: { type: 'send_notification', channel: 'whatsapp' }
    }
  },
  {
    id: 'ai-categorization',
    name: 'Categorização Inteligente',
    description: 'Usa IA para categorizar mensagens automaticamente',
    category: 'IA',
    popularity: 4,
    setup_time: '3 min',
    icon: Bot,
    color: 'bg-pink-500',
    preview: 'Toda mensagem → Analisar com IA + Categorizar + Rotear',
    config: {
      trigger: { type: 'new_message' },
      action: { type: 'ai_categorize', auto_route: true }
    }
  },
  {
    id: 'follow-up-reminder',
    name: 'Lembrete de Follow-up',
    description: 'Agenda lembretes automáticos para follow-up de clientes',
    category: 'Follow-up',
    popularity: 3,
    setup_time: '3 min',
    icon: Bell,
    color: 'bg-yellow-500',
    preview: 'Mensagem sem resposta 24h → Criar lembrete de follow-up',
    config: {
      trigger: { type: 'time_based', no_response_hours: 24 },
      action: { type: 'create_followup_task', assign_to: 'original_agent' }
    }
  },
  {
    id: 'spam-filter',
    name: 'Filtro Anti-Spam',
    description: 'Detecta e arquiva mensagens de spam automaticamente',
    category: 'Segurança',
    popularity: 4,
    setup_time: '2 min',
    icon: Archive,
    color: 'bg-gray-500',
    preview: 'Detectar spam → Arquivar + Adicionar tag "spam"',
    config: {
      trigger: { type: 'content_pattern', pattern: 'spam_keywords' },
      action: { type: 'archive', add_tags: ['spam', 'auto-filtered'] }
    }
  }
];

export default function TemplateGallery({ isOpen, onClose, onSelectTemplate }: TemplateGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const categories = ['all', 'Atendimento', 'Escalação', 'Tickets', 'Horário', 'Integração', 'IA', 'Follow-up', 'Segurança'];

  const filteredTemplates = automationTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: any) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">Galeria de Templates de Automação</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Escolha um template pronto e personalize conforme sua necessidade
          </p>
        </DialogHeader>

        <div className="flex h-full">
          {/* Sidebar with filters */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <div className="space-y-1">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === 'all' ? 'Todas' : category}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>Popularidade</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span>Tempo de configuração</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex">
            {/* Templates grid */}
            <div className="flex-1 p-4 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map(template => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`${template.color} p-2 rounded-lg text-white`}>
                            <template.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm">{template.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs">{template.popularity}/5</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.setup_time}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {template.description}
                      </p>
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs">
                        <span className="font-medium">Preview: </span>
                        <span className="text-gray-600 dark:text-gray-400">{template.preview}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tente ajustar sua busca ou escolher outra categoria
                  </p>
                </div>
              )}
            </div>

            {/* Template preview */}
            {selectedTemplate && (
              <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`${selectedTemplate.color} p-3 rounded-lg text-white`}>
                      <selectedTemplate.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedTemplate.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedTemplate.category}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm">{selectedTemplate.description}</p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium block mb-1">Como funciona:</label>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                        {selectedTemplate.preview}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{selectedTemplate.popularity}/5 estrelas</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>{selectedTemplate.setup_time}</span>
                      </div>
                    </div>

                    <div className="pt-4 space-y-2">
                      <Button 
                        className="w-full" 
                        onClick={() => handleUseTemplate(selectedTemplate)}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Usar este Template
                      </Button>
                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Detalhado
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Dicas de Configuração</span>
                    </div>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Teste em ambiente controlado primeiro</li>
                      <li>• Personalize as mensagens para seu negócio</li>
                      <li>• Configure horários de funcionamento</li>
                      <li>• Monitore os resultados regularmente</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
