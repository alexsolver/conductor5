import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  TestTube, 
  Settings, 
  Eye,
  Send,
  Filter,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  Play
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Form schemas
const emailRuleSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  priority: z.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
  fromEmailPattern: z.string().optional(),
  subjectPattern: z.string().optional(),
  bodyPattern: z.string().optional(),
  attachmentRequired: z.boolean().default(false),
  actionType: z.string().default('create_ticket'),
  defaultCategory: z.string().optional(),
  defaultPriority: z.string().default('medium'),
  defaultUrgency: z.string().default('medium'),
  defaultStatus: z.string().default('open'),
  defaultAssigneeId: z.string().optional(),
  defaultAssignmentGroup: z.string().optional(),
  autoResponseEnabled: z.boolean().default(false),
  autoResponseTemplateId: z.string().optional(),
  autoResponseDelay: z.number().min(0).default(0),
  extractTicketNumber: z.boolean().default(true),
  createDuplicateTickets: z.boolean().default(false),
  notifyAssignee: z.boolean().default(true),
});

const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  templateType: z.string().default('auto_response'),
  subject: z.string().min(1, 'Assunto é obrigatório'),
  bodyHtml: z.string().optional(),
  bodyText: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
  sendDelay: z.number().min(0).default(0),
  businessHoursOnly: z.boolean().default(false),
  trackOpens: z.boolean().default(false),
  trackClicks: z.boolean().default(false),
});

const emailSignatureSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  supportGroup: z.string().min(1, 'Grupo de atendimento é obrigatório'),
  signatureHtml: z.string().optional(),
  signatureText: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  contactName: z.string().optional(),
  contactTitle: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  companyName: z.string().optional(),
  companyWebsite: z.string().optional(),
  companyAddress: z.string().optional(),
  logoUrl: z.string().optional(),
});

interface EmailRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  fromEmailPattern?: string;
  subjectPattern?: string;
  bodyPattern?: string;
  attachmentRequired: boolean;
  actionType: string;
  defaultCategory?: string;
  defaultPriority: string;
  defaultUrgency: string;
  defaultStatus: string;
  autoResponseEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  templateType: string;
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  isDefault: boolean;
  isActive: boolean;
  requiresApproval: boolean;
  sendDelay: number;
  businessHoursOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InboxMessage {
  id: string;
  tenantId: string;
  messageId: string;
  threadId?: string;
  fromEmail: string;
  fromName?: string;
  toEmail: string;
  ccEmails?: string;
  bccEmails?: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  hasAttachments: boolean;
  attachmentCount: number;
  attachmentDetails: any[];
  emailHeaders: Record<string, any>;
  priority: string;
  isRead: boolean;
  isProcessed: boolean;
  ruleMatched?: string;
  ticketCreated?: string;
  emailDate: string;
  receivedAt: string;
  processedAt?: string;
}

interface ProcessingLog {
  id: string;
  tenantId: string;
  messageId?: string;
  emailFrom?: string;
  emailSubject?: string;
  processedAt?: string;
  ruleId?: string;
  actionTaken?: string;
  ticketId?: string;
  processingStatus: string;
  errorMessage?: string;
  processingTimeMs?: number;
  metadata: Record<string, any>;
}

interface EmailSignature {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  supportGroup: string;
  signatureHtml?: string;
  signatureText?: string;
  isDefault: boolean;
  isActive: boolean;
  contactName?: string;
  contactTitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  companyName?: string;
  companyWebsite?: string;
  companyAddress?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmailConfiguration() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedRule, setSelectedRule] = useState<EmailRule | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedInboxMessage, setSelectedInboxMessage] = useState<InboxMessage | null>(null);
  const [selectedSignature, setSelectedSignature] = useState<EmailSignature | null>(null);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isCreateRuleFromMessageDialogOpen, setIsCreateRuleFromMessageDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState({
    from: '',
    subject: '',
    body: '',
    hasAttachment: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const ruleForm = useForm({
    resolver: zodResolver(emailRuleSchema),
    defaultValues: {
      name: '',
      description: '',
      priority: 0,
      isActive: true,
      fromEmailPattern: '',
      subjectPattern: '',
      bodyPattern: '',
      attachmentRequired: false,
      actionType: 'create_ticket',
      defaultCategory: '',
      defaultPriority: 'medium',
      defaultUrgency: 'medium',
      defaultStatus: 'open',
      autoResponseEnabled: false,
      autoResponseDelay: 0,
      extractTicketNumber: true,
      createDuplicateTickets: false,
      notifyAssignee: true,
    }
  });

  const templateForm = useForm({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      templateType: 'auto_response',
      subject: '',
      bodyHtml: '',
      bodyText: '',
      isDefault: false,
      isActive: true,
      requiresApproval: false,
      sendDelay: 0,
      businessHoursOnly: false,
      trackOpens: false,
      trackClicks: false,
    }
  });

  const signatureForm = useForm({
    resolver: zodResolver(emailSignatureSchema),
    defaultValues: {
      name: '',
      description: '',
      supportGroup: '',
      signatureHtml: '',
      signatureText: '',
      isDefault: false,
      isActive: true,
      contactName: '',
      contactTitle: '',
      contactPhone: '',
      contactEmail: '',
      companyName: '',
      companyWebsite: '',
      companyAddress: '',
      logoUrl: '',
    }
  });

  // Queries
  const { data: inboxMessages = [], isLoading: inboxLoading, refetch: refetchInbox } = useQuery({
    queryKey: ['/api/email-config/inbox'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-config/inbox?limit=50');
      const data = await response.json();
      return data.data || [];
    },
    enabled: activeTab === 'inbox'
  });

  const { data: emailRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/email-config/rules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-config/rules');
      const data = await response.json();
      return data.data || [];
    }
  });

  const { data: emailTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/email-config/templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-config/templates');
      const data = await response.json();
      return data.data || [];
    }
  });

  const { data: availableVariables = [] } = useQuery({
    queryKey: ['/api/email-config/variables'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-config/variables');
      const data = await response.json();
      return data.data || [];
    }
  });

  const { data: monitoringStatus = null, refetch: refetchMonitoringStatus } = useQuery({
    queryKey: ['/api/email-config/monitoring/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-config/monitoring/status');
      const data = await response.json();
      return data.data || null;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: processingLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['/api/email-config/logs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-config/logs?limit=100');
      const data = await response.json();
      return data.data || [];
    },
    enabled: showLogsDialog
  });

  const { data: emailSignatures = [], isLoading: signaturesLoading } = useQuery({
    queryKey: ['/api/email-config/signatures'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-config/signatures');
      const data = await response.json();
      return data.data || [];
    }
  });

  const { data: emailIntegrations = [], isLoading: integrationsLoading } = useQuery({
    queryKey: ['/api/email-config/integrations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-config/integrations');
      const data = await response.json();
      return data.data || [];
    }
  });

  // Mutations
  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/email-config/rules', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Regra criada com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/rules'] });
      setIsRuleDialogOpen(false);
      ruleForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/email-config/rules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Regra atualizada com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/rules'] });
      setIsRuleDialogOpen(false);
      setSelectedRule(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/email-config/rules/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Regra excluída com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/rules'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/email-config/templates', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Template criado com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/templates'] });
      setIsTemplateDialogOpen(false);
      templateForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/email-config/templates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Template atualizado com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/templates'] });
      setIsTemplateDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/email-config/templates/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Template excluído com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/templates'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const testRuleMutation = useMutation({
    mutationFn: async ({ ruleId, emailData }: { ruleId: string; emailData: any }) => {
      const response = await apiRequest('POST', `/api/email-config/rules/${ruleId}/test`, emailData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: data.data.matches ? 'Teste Passou!' : 'Teste Falhou', 
        description: data.data.matches ? 'A regra corresponde ao email de teste' : 'A regra não corresponde ao email de teste',
        variant: data.data.matches ? 'default' : 'destructive'
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const startMonitoringMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/email-config/monitoring/start');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Monitoramento de email iniciado' });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/monitoring/status'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const stopMonitoringMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/email-config/monitoring/stop');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Monitoramento de email parado' });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/monitoring/status'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest('PUT', `/api/email-config/inbox/${messageId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/inbox'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const createRuleFromMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/email-config/rules', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Regra criada a partir da mensagem com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/rules'] });
      setIsCreateRuleFromMessageDialogOpen(false);
      setSelectedInboxMessage(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const createSignatureMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/email-config/signatures', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Assinatura criada com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/signatures'] });
      setIsSignatureDialogOpen(false);
      signatureForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const updateSignatureMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/email-config/signatures/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Assinatura atualizada com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/signatures'] });
      setIsSignatureDialogOpen(false);
      setSelectedSignature(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const deleteSignatureMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/email-config/signatures/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Assinatura excluída com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/signatures'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  // Handlers
  const handleCreateRule = () => {
    setSelectedRule(null);
    ruleForm.reset();
    setIsRuleDialogOpen(true);
  };

  const handleEditRule = (rule: EmailRule) => {
    setSelectedRule(rule);
    ruleForm.reset(rule);
    setIsRuleDialogOpen(true);
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    templateForm.reset();
    setIsTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    templateForm.reset(template);
    setIsTemplateDialogOpen(true);
  };

  const handleCreateRuleFromMessage = (message: InboxMessage) => {
    setSelectedInboxMessage(message);
    // Pre-populate rule form with message data
    ruleForm.reset({
      name: `Regra para: ${message.subject}`,
      description: `Regra criada automaticamente baseada no email de ${message.fromEmail}`,
      priority: 0,
      isActive: true,
      fromEmailPattern: message.fromEmail,
      subjectPattern: message.subject.includes('urgente') || message.subject.includes('critical') ? '(urgente|crítico|critical)' : '',
      bodyPattern: '',
      attachmentRequired: message.hasAttachments,
      actionType: 'create_ticket',
      defaultCategory: message.priority === 'high' ? 'Crítico' : 'Geral',
      defaultPriority: message.priority,
      defaultUrgency: message.priority,
      defaultStatus: 'open',
      autoResponseEnabled: false,
      autoResponseDelay: 0,
      extractTicketNumber: true,
      createDuplicateTickets: false,
      notifyAssignee: true,
    });
    setIsCreateRuleFromMessageDialogOpen(true);
  };

  const handleMarkAsRead = (message: InboxMessage) => {
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const onSubmitRule = (data: any) => {
    if (selectedRule) {
      updateRuleMutation.mutate({ id: selectedRule.id, data });
    } else {
      createRuleMutation.mutate(data);
    }
  };

  const onSubmitTemplate = (data: any) => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleTestRule = (rule: EmailRule) => {
    setSelectedRule(rule);
    setIsTestDialogOpen(true);
  };

  const runRuleTest = () => {
    if (!selectedRule) return;

    testRuleMutation.mutate({
      ruleId: selectedRule.id,
      emailData: testEmail
    });
  };

  const handleCreateSignature = () => {
    setSelectedSignature(null);
    signatureForm.reset();
    setIsSignatureDialogOpen(true);
  };

  const handleEditSignature = (signature: EmailSignature) => {
    setSelectedSignature(signature);
    signatureForm.reset(signature);
    setIsSignatureDialogOpen(true);
  };

  const onSubmitSignature = (data: any) => {
    if (selectedSignature) {
      updateSignatureMutation.mutate({ id: selectedSignature.id, data });
    } else {
      createSignatureMutation.mutate(data);
    }
  };

  const actionTypeOptions = [
    { value: 'create_ticket', label: 'Criar Ticket' },
    { value: 'update_ticket', label: 'Atualizar Ticket' },
    { value: 'auto_respond', label: 'Resposta Automática' },
    { value: 'forward', label: 'Encaminhar' },
    { value: 'ignore', label: 'Ignorar' }
  ];

  const templateTypeOptions = [
    { value: 'auto_response', label: 'Resposta Automática' },
    { value: 'acknowledgment', label: 'Confirmação' },
    { value: 'status_update', label: 'Atualização de Status' },
    { value: 'resolution', label: 'Resolução' },
    { value: 'escalation', label: 'Escalação' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baixa' },
    { value: 'medium', label: 'Média' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' }
  ];

  const supportGroupOptions = [
    { value: 'suporte_tecnico', label: 'Suporte Técnico' },
    { value: 'atendimento_geral', label: 'Atendimento Geral' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'recursos_humanos', label: 'Recursos Humanos' },
    { value: 'diretoria', label: 'Diretoria' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'produto', label: 'Produto' }
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Configuração de Email</h1>
          <p className="text-muted-foreground">
            Gerencie regras de processamento de email e templates de resposta
          </p>
        </div>

        <div className="flex items-center gap-4">
          {monitoringStatus && (
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${monitoringStatus.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {monitoringStatus.isActive ? 'Monitoramento Ativo' : 'Monitoramento Inativo'}
              </span>
            </div>
          )}

          {monitoringStatus?.isActive ? (
            <Button 
              variant="outline"
              onClick={() => stopMonitoringMutation.mutate()}
              disabled={stopMonitoringMutation.isPending}
            >
              <div className="w-4 h-4 mr-2 bg-red-500 rounded-full" />
              Parar Monitoramento
            </Button>
          ) : (
            <Button 
              onClick={() => startMonitoringMutation.mutate()}
              disabled={startMonitoringMutation.isPending || emailRules.filter(r => r.isActive).length === 0}
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar Monitoramento
            </Button>
          )}
        </div>
      </div>

      {monitoringStatus && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${monitoringStatus.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              Status do Monitoramento de Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">
                  {monitoringStatus.totalRules}
                </div>
                <p className="text-xs text-muted-foreground">Total de Regras</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {monitoringStatus.activeRules}
                </div>
                <p className="text-xs text-muted-foreground">Regras Ativas</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {monitoringStatus.recentProcessing?.successful || 0}
                </div>
                <p className="text-xs text-muted-foreground">Sucessos (24h)</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {monitoringStatus.recentProcessing?.failed || 0}
                </div>
                <p className="text-xs text-muted-foreground">Falhas (24h)</p>
              </div>
            </div>

            {monitoringStatus.lastProcessedEmail && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium">Último Email Processado:</p>
                <p className="text-sm text-muted-foreground">
                  De: {monitoringStatus.lastProcessedEmail.fromEmail} | 
                  Assunto: {monitoringStatus.lastProcessedEmail.subject} |
                  Ação: {monitoringStatus.lastProcessedEmail.actionTaken}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inbox">
            <Mail className="w-4 h-4 mr-2" />
            Caixa de Entrada
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Play className="w-4 h-4 mr-2" />
            Monitoramento
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Settings className="w-4 h-4 mr-2" />
            Integrações de Email
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Filter className="w-4 h-4 mr-2" />
            Regras de Processamento
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Edit className="w-4 h-4 mr-2" />
            Templates de Resposta
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Caixa de Entrada</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {inboxMessages.filter((m: InboxMessage) => !m.isRead).length} não lidas
              </Badge>
              <Button variant="outline" onClick={() => refetchInbox()}>
                <Download className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {inboxLoading ? (
              <div className="text-center py-8">Carregando mensagens...</div>
            ) : inboxMessages.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma mensagem</h3>
                    <p className="text-muted-foreground">
                      Não há mensagens de email recebidas ainda.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {inboxMessages.map((message: InboxMessage) => (
                  <Card key={message.id} className={`transition-all hover:shadow-md ${!message.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            {!message.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                            {message.subject}
                            <Badge variant={
                              message.priority === 'high' ? 'destructive' :
                              message.priority === 'medium' ? 'default' : 
                              'secondary'
                            }>
                              {message.priority === 'high' ? 'Alta' : 
                               message.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            <div className="flex items-center gap-4 text-sm">
                              <span><strong>De:</strong> {message.fromName || message.fromEmail}</span>
                              <span><strong>Para:</strong> {message.toEmail}</span>
                              <span><strong>Data:</strong> {new Date(message.emailDate).toLocaleString('pt-BR')}</span>
                              {message.hasAttachments && (
                                <Badge variant="outline">
                                  📎 {message.attachmentCount} anexo(s)
                                </Badge>
                              )}
                            </div>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {!message.isRead && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleMarkAsRead(message)}
                              disabled={markAsReadMutation.isPending}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Marcar como Lida
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCreateRuleFromMessage(message)}
                          >
                            <Filter className="w-4 h-4 mr-1" />
                            Criar Regra
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm whitespace-pre-wrap">{message.bodyText || 'Sem conteúdo de texto'}</p>
                        </div>

                        {message.isProcessed && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Processado</span>
                            {message.ruleMatched && (
                              <Badge variant="outline">Regra: {message.ruleMatched}</Badge>
                            )}
                            {message.ticketCreated && (
                              <Badge variant="outline">Ticket: {message.ticketCreated}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Email Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Integrações de Email Configuradas</h2>
            <Badge variant="outline">
              {emailIntegrations.filter((i: any) => i.isConfigured).length} conectadas
            </Badge>
          </div>

          <div className="grid gap-4">
            {integrationsLoading ? (
              <div className="text-center py-8">Carregando integrações...</div>
            ) : emailIntegrations.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma integração configurada</h3>
                    <p className="text-muted-foreground">
                      Configure suas integrações de email no Workspace Admin
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {emailIntegrations.map((integration: any) => (
                  <Card key={integration.id} className={`transition-all hover:shadow-md ${integration.isConfigured ? 'border-l-4 border-l-green-500' : ''}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Mail className="w-5 h-5" />
                            {integration.name}
                            <Badge variant={integration.isConfigured ? 'default' : 'secondary'}>
                              {integration.isConfigured ? 'Conectado' : 'Desconectado'}
                            </Badge>
                          </CardTitle>
                          <CardDescription>{integration.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {integration.category}
                          </Badge>
                          <div className={`w-3 h-3 rounded-full ${integration.isConfigured ? 'bg-green-500' : 'bg-gray-400'}`} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {integration.isConfigured && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {integration.emailAddress && (
                            <div>
                              <span className="font-medium">Email:</span>
                              <p className="text-muted-foreground">{integration.emailAddress}</p>
                            </div>
                          )}
                          {integration.serverHost && (
                            <div>
                              <span className="font-medium">Servidor:</span>
                              <p className="text-muted-foreground">{integration.serverHost}:{integration.serverPort}</p>
                            </div>
                          )}
                          {integration.useSSL !== undefined && (
                            <div>
                              <span className="font-medium">Segurança:</span>
                              <p className="text-muted-foreground">{integration.useSSL ? 'SSL/TLS' : 'Sem criptografia'}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {integration.features && integration.features.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2">Recursos Disponíveis:</h4>
                          <div className="flex flex-wrap gap-2">
                            {integration.features.map((feature: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {integration.lastSync && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            Última sincronização: {new Date(integration.lastSync).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Email Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Monitoramento de Email</h2>
          </div>

          {/* Real-time Monitoring Status */}
          <div className="grid gap-6">
            {monitoringStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Status do Monitoramento
                    <Badge variant={monitoringStatus.isActive ? 'default' : 'secondary'}>
                      {monitoringStatus.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Sistema de monitoramento em tempo real para leitura e processamento de emails
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {monitoringStatus.totalIntegrations || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Integrações Configuradas</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {monitoringStatus.activeConnections || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Conexões Ativas</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {monitoringStatus.recentProcessing?.successful || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Emails Processados (24h)</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {monitoringStatus.recentProcessing?.failed || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Falhas (24h)</p>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex gap-3 mb-6">
                    {!monitoringStatus.isActive ? (
                      <Button 
                        onClick={() => startMonitoringMutation.mutate()}
                        disabled={startMonitoringMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {startMonitoringMutation.isPending ? 'Iniciando...' : 'Iniciar Monitoramento'}
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => stopMonitoringMutation.mutate()}
                        disabled={stopMonitoringMutation.isPending}
                        variant="destructive"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {stopMonitoringMutation.isPending ? 'Parando...' : 'Parar Monitoramento'}
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/email-config/monitoring/status'] });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Atualizar Status
                    </Button>
                  </div>

                  {/* Active Integrations */}
                  {monitoringStatus.integrations && monitoringStatus.integrations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Integrações Monitoradas:</h4>
                      <div className="grid gap-3">
                        {monitoringStatus.integrations.map((integration: any) => {
                          const isConfigured = integration.emailAddress && integration.emailAddress !== 'Not configured';
                          const statusColor = integration.isConnected && isConfigured ? 'bg-green-500' : 'bg-red-500';
                          const statusText = integration.isConnected && isConfigured ? 'Conectado' : 
                                           !isConfigured ? 'Não Configurado' : 'Desconectado';
                          const statusVariant = integration.isConnected && isConfigured ? 'default' : 'destructive';

                          return (
                            <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${statusColor}`} />
                                <div>
                                  <p className="font-medium">{integration.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {isConfigured ? integration.emailAddress : 'Email não configurado'}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={statusVariant}>
                                {statusText}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Last Processed Email */}
                  {monitoringStatus.lastProcessedEmail && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-medium mb-2">Último Email Processado:</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-medium">De:</span> {monitoringStatus.lastProcessedEmail.fromEmail}
                          </div>
                          <div>
                            <span className="font-medium">Assunto:</span> {monitoringStatus.lastProcessedEmail.subject}
                          </div>
                          <div>
                            <span className="font-medium">Ação:</span> {monitoringStatus.lastProcessedEmail.actionTaken}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Monitoring Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Como Funciona o Monitoramento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Conexão Automática</p>
                      <p className="text-muted-foreground">O sistema conecta automaticamente às suas integrações de email configuradas (IMAP, OAuth2)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Verificação Periódica</p>
                      <p className="text-muted-foreground">Emails são verificados a cada 5 minutos quando o monitoramento está ativo</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Processamento Inteligente</p>
                      <p className="text-muted-foreground">Novos emails são processados de acordo com as regras configuradas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Criação de Tickets</p>
                      <p className="text-muted-foreground">Emails correspondem automaticamente geram tickets no sistema</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Regras de Processamento de Email</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowLogsDialog(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Ver Logs de Processamento
              </Button>
              <Button onClick={handleCreateRule}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Regra
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {rulesLoading ? (
              <div className="text-center py-8">Carregando regras...</div>
            ) : emailRules.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma regra configurada</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie sua primeira regra para processar emails automaticamente
                    </p>
                    <Button onClick={handleCreateRule}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Regra
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {emailRules.map((rule: EmailRule) => (
                  <Card key={rule.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {rule.name}
                            <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                              {rule.isActive ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <Badge variant="outline">
                              Prioridade: {rule.priority}
                            </Badge>
                          </CardTitle>
                          {rule.description && (
                            <CardDescription>{rule.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestRule(rule)}
                          >
                            <TestTube className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRuleMutation.mutate(rule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Ação:</span>
                          <p className="text-muted-foreground">{rule.actionType}</p>
                        </div>
                        <div>
                          <span className="font-medium">Prioridade Padrão:</span>
                          <p className="text-muted-foreground">{rule.defaultPriority}</p>
                        </div>
                        <div>
                          <span className="font-medium">Status Padrão:</span>
                          <p className="text-muted-foreground">{rule.defaultStatus}</p>
                        </div>
                        <div>
                          <span className="font-medium">Resposta Automática:</span>
                          <p className="text-muted-foreground">
                            {rule.autoResponseEnabled ? 'Sim' : 'Não'}
                          </p>
                        </div>
                      </div>
                      {(rule.fromEmailPattern || rule.subjectPattern || rule.bodyPattern) && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2">Padrões de Correspondência:</h4>
                          <div className="space-y-1 text-sm">
                            {rule.fromEmailPattern && (
                              <div>
                                <span className="font-medium">Email:</span> 
                                <code className="ml-2 px-1 bg-muted rounded">{rule.fromEmailPattern}</code>
                              </div>
                            )}
                            {rule.subjectPattern && (
                              <div>
                                <span className="font-medium">Assunto:</span> 
                                <code className="ml-2 px-1 bg-muted rounded">{rule.subjectPattern}</code>
                              </div>
                            )}
                            {rule.bodyPattern && (
                              <div>
                                <span className="font-medium">Corpo:</span> 
                                <code className="ml-2 px-1 bg-muted rounded">{rule.bodyPattern}</code>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Templates de Resposta</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCreateSignature}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Assinatura
              </Button>
              <Button onClick={handleCreateTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Template
              </Button>
            </div>
          </div>

          {/* Email Signatures Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Assinaturas de Email por Grupo de Atendimento</h3>
            {signaturesLoading ? (
              <div className="text-center py-4">Carregando assinaturas...</div>
            ) : emailSignatures.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6">
                    <Edit className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <h4 className="font-medium mb-2">Nenhuma assinatura configurada</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure assinaturas específicas para cada grupo de atendimento
                    </p>
                    <Button onClick={handleCreateSignature}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Assinatura
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {emailSignatures.map((signature: EmailSignature) => (
                  <Card key={signature.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base">
                            {signature.name}
                            <Badge variant={signature.isActive ? 'default' : 'secondary'}>
                              {signature.isActive ? 'Ativa' : 'Inativa'}
                            </Badge>
                            {signature.isDefault && (
                              <Badge variant="destructive">Padrão</Badge>
                            )}
                            <Badge variant="outline">
                              {supportGroupOptions.find(g => g.value === signature.supportGroup)?.label || signature.supportGroup}
                            </Badge>
                          </CardTitle>
                          {signature.description && (
                            <CardDescription className="text-sm">{signature.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSignature(signature)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSignatureMutation.mutate(signature.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Contato:</span>
                          <p className="text-muted-foreground">{signature.contactName || 'Não definido'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Cargo:</span>
                          <p className="text-muted-foreground">{signature.contactTitle || 'Não definido'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Email:</span>
                          <p className="text-muted-foreground">{signature.contactEmail || 'Não definido'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Telefone:</span>
                          <p className="text-muted-foreground">{signature.contactPhone || 'Não definido'}</p>
                        </div>
                      </div>
                      {signature.signatureText && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="font-medium text-sm">Prévia da Assinatura:</span>
                          <div className="mt-2 p-2 bg-muted rounded-md text-xs">
                            <pre className="whitespace-pre-wrap">
                              {signature.signatureText.substring(0, 150)}
                              {signature.signatureText.length > 150 && '...'}
                            </pre>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Templates Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Templates de Resposta Automática</h3>
            <div className="grid gap-4">

            {templatesLoading ? (
              <div className="text-center py-8">Carregando templates...</div>
            ) : emailTemplates.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum template configurado</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie templates para respostas automáticas de email
                    </p>
                    <Button onClick={handleCreateTemplate}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {emailTemplates.map((template: EmailTemplate) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {template.name}
                            <Badge variant={template.isActive ? 'default' : 'secondary'}>
                              {template.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {template.isDefault && (
                              <Badge variant="destructive">Padrão</Badge>
                            )}
                            <Badge variant="outline">
                              {template.templateType}
                            </Badge>
                          </CardTitle>
                          {template.description && (
                            <CardDescription>{template.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">Assunto:</span>
                          <p className="text-muted-foreground">{template.subject}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Tipo:</span>
                            <p className="text-muted-foreground">{template.templateType}</p>
                          </div>
                          <div>
                            <span className="font-medium">Atraso de Envio:</span>
                            <p className="text-muted-foreground">{template.sendDelay} min</p>
                          </div>
                          <div>
                            <span className="font-medium">Horário Comercial:</span>
                            <p className="text-muted-foreground">
                              {template.businessHoursOnly ? 'Sim' : 'Não'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Requer Aprovação:</span>
                            <p className="text-muted-foreground">
                              {template.requiresApproval ? 'Sim' : 'Não'}
                            </p>
                          </div>
                        </div>
                        {(template.bodyText || template.bodyHtml) && (
                          <div className="pt-3 border-t">
                            <span className="font-medium">Prévia do Conteúdo:</span>
                            <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                              {template.bodyText ? (
                                <pre className="whitespace-pre-wrap">
                                  {template.bodyText.substring(0, 200)}
                                  {template.bodyText.length > 200 && '...'}
                                </pre>
                              ) : template.bodyHtml ? (
                                <div dangerouslySetInnerHTML={{ 
                                  __html: template.bodyHtml.substring(0, 200) + 
                                    (template.bodyHtml.length > 200 ? '...' : '')
                                }} />
                              ) : null}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? 'Editar Regra' : 'Nova Regra de Email'}
            </DialogTitle>
            <DialogDescription>
              Configure como os emails devem ser processados para criação ou atualização de tickets
            </DialogDescription>
          </DialogHeader>

          <Form {...ruleForm}>
            <form onSubmit={ruleForm.handleSubmit(onSubmitRule)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={ruleForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Regra</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Suporte Urgente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Maior número = maior prioridade
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={ruleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição opcional da regra"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Critérios de Correspondência</h3>

                <FormField
                  control={ruleForm.control}
                  name="fromEmailPattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Padrão do Email Remetente (RegEx)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder=".*@example\.com$"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Expressão regular para corresponder ao email do remetente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="subjectPattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Padrão do Assunto (RegEx)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="URGENTE|CRITICAL|EMERGENCY"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Expressão regular para corresponder ao assunto do email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="bodyPattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Padrão do Corpo (RegEx)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="erro|falha|problema"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Expressão regular para corresponder ao corpo do email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="attachmentRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Anexo Obrigatório</FormLabel>
                        <FormDescription>
                          Email deve ter anexos para corresponder a esta regra
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ação a Realizar</h3>

                <FormField
                  control={ruleForm.control}
                  name="actionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Ação</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a ação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {actionTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={ruleForm.control}
                    name="defaultCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria Padrão</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Suporte Técnico" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ruleForm.control}
                    name="defaultPriority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade Padrão</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorityOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Resposta Automática</h3>

                <FormField
                  control={ruleForm.control}
                  name="autoResponseEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Habilitar Resposta Automática</FormLabel>
                        <FormDescription>
                          Enviar resposta automática quando esta regra for acionada
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="autoResponseDelay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atraso da Resposta (minutos)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Aguardar quantos minutos antes de enviar a resposta
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações Avançadas</h3>

                <div className="space-y-4">
                  <FormField
                    control={ruleForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Regra Ativa</FormLabel>
                          <FormDescription>
                            Habilitar ou desabilitar esta regra
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ruleForm.control}
                    name="extractTicketNumber"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Extrair Número do Ticket</FormLabel>
                          <FormDescription>
                            Tentar encontrar números de tickets existentes no email
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ruleForm.control}
                    name="createDuplicateTickets"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Permitir Tickets Duplicados</FormLabel>
                          <FormDescription>
                            Criar novos tickets mesmo se já existir um similar
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ruleForm.control}
                    name="notifyAssignee"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Notificar Responsável</FormLabel>
                          <FormDescription>
                            Enviar notificação ao responsável quando ticket for criado
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsRuleDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                >
                  {selectedRule ? 'Atualizar' : 'Criar'} Regra
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Editar Template' : 'Novo Template de Email'}
            </DialogTitle>
            <DialogDescription>
              Configure templates para respostas automáticas de email
            </DialogDescription>
          </DialogHeader>

          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(onSubmitTemplate)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={templateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Template</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Confirmação de Recebimento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={templateForm.control}
                  name="templateType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Template</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templateTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={templateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição opcional do template"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={templateForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assunto do Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Confirmação - Ticket #{{ticket_number}}"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Use variáveis como {`{{ticket_number}}, {{customer_name}}, etc.`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Conteúdo do Email</h3>
                  <div className="text-sm text-muted-foreground">
                    Variáveis disponíveis: {availableVariables.slice(0, 3).join(', ')}...
                  </div>
                </div>

                <FormField
                  control={templateForm.control}
                  name="bodyText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Corpo do Email (Texto)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Olá {{customer_name}},&#10;&#10;Recebemos seu ticket #{{ticket_number}} e nossa equipe está analisando.&#10;&#10;Atenciosamente,&#10;Equipe de Suporte"
                          rows={8}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={templateForm.control}
                  name="bodyHtml"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Corpo do Email (HTML)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="<p>Olá <strong>{{customer_name}}</strong>,</p><p>Recebemos seu ticket <em>#{{ticket_number}}</em> e nossa equipe está analisando.</p><p>Atenciosamente,<br>Equipe de Suporte</p>"
                          rows={6}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Versão HTML do email (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações de Envio</h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={templateForm.control}
                    name="sendDelay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Atraso de Envio (minutos)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Aguardar antes de enviar o email
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={templateForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Template Ativo</FormLabel>
                          <FormDescription>
                            Habilitar ou desabilitar este template
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Template Padrão</FormLabel>
                        <FormDescription>
                          Usar como template padrão para este tipo
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={templateForm.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Requer Aprovação</FormLabel>
                        <FormDescription>
                          Email deve ser aprovado antes do envio
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={templateForm.control}
                  name="businessHoursOnly"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Apenas Horário Comercial</FormLabel>
                        <FormDescription>
                          Enviar apenas durante horário comercial
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={templateForm.control}
                    name="trackOpens"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Rastrear Aberturas</FormLabel>
                          <FormDescription>
                            Monitorar se o email foi aberto
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="trackClicks"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Rastrear Cliques</FormLabel>
                          <FormDescription>
                            Monitorar cliques em links
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsTemplateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              >
                {selectedTemplate ? 'Atualizar' : 'Criar'} Template
              </Button>
            </div>
          </form>
        </FormContent>
      </Dialog>

      {/* Test Rule Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Testar Regra de Email</DialogTitle>
            <DialogDescription>
              Teste se a regra "{selectedRule?.name}" corresponde a um email específico
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email do Remetente</label>
              <Input
                placeholder="usuario@exemplo.com"
                value={testEmail.from}
                onChange={(e) => setTestEmail(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Assunto</label>
              <Input
                placeholder="URGENTE: Problema no sistema"
                value={testEmail.subject}
                onChange={(e) => setTestEmail(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Corpo do Email</label>
              <Textarea
                placeholder="Descrição do problema..."
                rows={4}
                value={testEmail.body}
                onChange={(e) => setTestEmail(prev => ({ ...prev, body: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={testEmail.hasAttachment}
                onCheckedChange={(checked) => setTestEmail(prev => ({ ...prev, hasAttachment: checked }))}
              />
              <label className="text-sm font-medium">Email tem anexos</label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsTestDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={runRuleTest}
              disabled={testRuleMutation.isPending}
            >
              <TestTube className="w-4 h-4 mr-2" />
              Executar Teste
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Rule from Message Dialog */}
      <Dialog open={isCreateRuleFromMessageDialogOpen} onOpenChange={setIsCreateRuleFromMessageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Regra a partir da Mensagem</DialogTitle>
            <DialogDescription>
              Configure uma regra de processamento baseada na mensagem: "{selectedInboxMessage?.subject}"
            </DialogDescription>
          </DialogHeader>

          {selectedInboxMessage && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Informações da Mensagem</h4>
              <div className="text-sm space-y-1">
                <p><strong>De:</strong> {selectedInboxMessage.fromName || selectedInboxMessage.fromEmail}</p>
                <p><strong>Assunto:</strong> {selectedInboxMessage.subject}</p>
                <p><strong>Prioridade:</strong> {selectedInboxMessage.priority}</p>
                <p><strong>Tem anexos:</strong> {selectedInboxMessage.hasAttachments ? 'Sim' : 'Não'}</p>
              </div>
            </div>
          )}

          <Form {...ruleForm}>
            <form onSubmit={ruleForm.handleSubmit((data) => createRuleFromMessageMutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={ruleForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Regra</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Suporte Urgente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={ruleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição da regra..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Critérios de Correspondência</h3>

                <FormField
                  control={ruleForm.control}
                  name="fromEmailPattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Padrão do Email Remetente</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder=".*@example\.com$"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Expressão regular para corresponder ao email do remetente (pré-preenchido com email da mensagem)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="subjectPattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Padrão do Assunto</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(urgente|crítico|critical)"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Expressão regular para corresponder ao assunto do email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="attachmentRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Requer Anexos</FormLabel>
                        <FormDescription>
                          Esta regra só se aplica a emails com anexos
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ações do Ticket</h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={ruleForm.control}
                    name="defaultCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria Padrão</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Crítico">Crítico</SelectItem>
                            <SelectItem value="Geral">Geral</SelectItem>
                            <SelectItem value="Suporte">Suporte</SelectItem>
                            <SelectItem value="Manutenção">Manutenção</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ruleForm.control}
                    name="defaultPriority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade do Ticket</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a prioridade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateRuleFromMessageDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRuleFromMessageMutation.isPending}
                >
                  Criar Regra
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSignature ? 'Editar Assinatura' : 'Nova Assinatura de Email'}
            </DialogTitle>
            <DialogDescription>
              Configure assinaturas específicas para grupos de atendimento
            </DialogDescription>
          </DialogHeader>

          <Form {...signatureForm}>
            <form onSubmit={signatureForm.handleSubmit(onSubmitSignature)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={signatureForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Assinatura</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Assinatura Suporte Técnico" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signatureForm.control}
                  name="supportGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo de Atendimento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o grupo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {supportGroupOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={signatureForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição opcional da assinatura"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={signatureForm.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Contato</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signatureForm.control}
                  name="contactTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo/Função</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Analista de Suporte" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signatureForm.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: joao@empresa.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signatureForm.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: (11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={signatureForm.control}
                name="signatureText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assinatura em Texto</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Atenciosamente,&#10;João Silva&#10;Analista de Suporte&#10;joao@empresa.com&#10;(11) 99999-9999"
                        rows={6}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Versão em texto simples da assinatura para emails não-HTML
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={signatureForm.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Assinatura Padrão</FormLabel>
                        <FormDescription>
                          Usar como padrão para o grupo
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={signatureForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativa</FormLabel>
                        <FormDescription>
                          Assinatura disponível para uso
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsSignatureDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createSignatureMutation.isPending || updateSignatureMutation.isPending}
                >
                  {selectedSignature ? 'Atualizar' : 'Criar'} Assinatura
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Processing Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Logs de Processamento de Email</DialogTitle>
            <DialogDescription>
              Visualize o histórico de processamento das regras de email
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {logsLoading ? (
              <div className="text-center py-8">Carregando logs...</div>
                        ) : processingLogs.length === 0 ? (
              <div className="text-center py-8">
                <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum log encontrado</h3>
                <p className="text-muted-foreground">
                  Os logs aparecerão aqui quando as regras processarem emails
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {processingLogs.map((log: any, index: number) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base">
                            {log.subject || 'Sem assunto'}
                            <Badge variant={log.success ? 'default' : 'destructive'}>
                              {log.success ? 'Sucesso' : 'Falha'}
                            </Badge>
                            {log.ruleMatched && (
                              <Badge variant="outline">
                                Regra: {log.ruleMatched}
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            De: {log.fromEmail} | {new Date(log.processedAt).toLocaleString('pt-BR')}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Ação Executada:</span>
                          <p className="text-muted-foreground">{log.actionTaken || 'Nenhuma'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Tempo de Processamento:</span>
                          <p className="text-muted-foreground">{log.processingTime || '0'}ms</p>
                        </div>
                      </div>
                      {log.error && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="font-medium text-sm text-red-600">Erro:</span>
                          <div className="mt-2 p-2 bg-red-50 rounded-md text-xs text-red-800">
                            {log.error}
                          </div>
                        </div>
                      )}
                      {log.ticketCreated && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="font-medium text-sm text-green-600">Ticket Criado:</span>
                          <p className="text-sm text-green-700">{log.ticketCreated}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowLogsDialog(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}