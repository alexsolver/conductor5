import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import ChatbotKanban from '@/components/omnibridge/ChatbotKanban';
import {
  MessageSquare,
  Mail,
  Phone,
  Settings,
  Plus,
  Search,
  Filter,
  Send,
  Archive,
  Star,
  Reply,
  Forward,
  MoreHorizontal,
  Bot,
  Zap,
  Bell,
  Users,
  Calendar,
  FileText,
  Workflow,
  Target,
  MessageCircle,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Tag,
  Hash,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Channel {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'telegram' | 'sms' | 'chat';
  enabled: boolean;
  icon: any;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  messageCount: number;
  lastMessage?: string;
  lastActivity?: string;
  features?: string[];
}

interface Message {
  id: string;
  channelId: string;
  channelType: 'email' | 'whatsapp' | 'telegram' | 'sms' | 'chat';
  from: string;
  to: string;
  subject?: string;
  content: string;
  timestamp: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  attachments?: number;
  starred?: boolean;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: {
    type: 'new_message' | 'keyword' | 'time' | 'channel';
    conditions: string[];
  };
  actions: {
    type: 'reply' | 'forward' | 'create_ticket' | 'notify' | 'tag';
    parameters: Record<string, any>;
  }[];
  priority: number;
}

interface Template {
  id: string;
  name: string;
  category: 'email' | 'whatsapp' | 'general';
  subject?: string;
  content: string;
  variables: string[];
  usage_count: number;
  created_at: string;
}

interface Chatbot {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  channels: string[];
  workflows: {
    id: string;
    name: string;
    steps: any[];
  }[];
  ai_enabled: boolean;
  fallback_to_human: boolean;
}

// Helper functions for channel mapping
function getChannelType(integrationId: string): 'email' | 'whatsapp' | 'telegram' | 'sms' | 'chat' {
  if (integrationId.includes('email') || integrationId.includes('gmail') || integrationId.includes('outlook') || integrationId.includes('imap')) {
    return 'email';
  }
  if (integrationId.includes('whatsapp')) {
    return 'whatsapp';
  }
  if (integrationId.includes('telegram')) {
    return 'telegram';
  }
  if (integrationId.includes('sms') || integrationId.includes('twilio')) {
    return 'sms';
  }
  return 'chat';
}

function getChannelIcon(integrationId: string) {
  if (integrationId.includes('email') || integrationId.includes('gmail') || integrationId.includes('outlook') || integrationId.includes('imap')) {
    return Mail;
  }
  if (integrationId.includes('whatsapp')) {
    return MessageSquare;
  }
  if (integrationId.includes('telegram')) {
    return MessageCircle;
  }
  if (integrationId.includes('sms') || integrationId.includes('twilio')) {
    return Phone;
  }
  return MessageSquare;
}

export default function OmniBridge() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inbox');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [newRuleData, setNewRuleData] = useState({
    name: '',
    description: '',
    triggerType: 'new_message',
    actionType: 'auto_reply',
    priority: 0
  });
  const [replyContent, setReplyContent] = useState('');
  const [forwardContent, setForwardContent] = useState('');
  const [forwardRecipients, setForwardRecipients] = useState('');

  // Add automation state
  useEffect(() => {
    const fetchAutomationRules = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        };

        const response = await fetch('/api/omnibridge/automation-rules', { headers });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setAutomationRules(result.data);
            console.log('✅ [OmniBridge] Automation rules loaded:', result.data.length);
          }
        }
      } catch (error) {
        console.error('❌ [OmniBridge] Error fetching automation rules:', error);
      }
    };

    if (activeTab === 'automation') {
      fetchAutomationRules();
    }
  }, [activeTab, user?.tenantId]);

  const handleToggleAutomationRule = async (ruleId: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/omnibridge/automation-rules/${ruleId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        },
        body: JSON.stringify({ isEnabled: enabled })
      });

      if (response.ok) {
        setAutomationRules(prev => prev.map(rule =>
          rule.id === ruleId ? { ...rule, isEnabled: enabled } : rule
        ));
        console.log(`✅ [OmniBridge] Automation rule ${enabled ? 'enabled' : 'disabled'}: ${ruleId}`);
      }
    } catch (error) {
      console.error('❌ [OmniBridge] Error toggling automation rule:', error);
    }
  };

  const handleCreateAutomationRule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/omnibridge/automation-rules', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        },
        body: JSON.stringify({
          name: newRuleData.name || 'Nova Regra',
          description: newRuleData.description || 'Regra criada pelo usuário',
          isEnabled: true,
          triggers: [{ type: newRuleData.triggerType, conditions: [] }],
          actions: [{ type: newRuleData.actionType, parameters: {} }],
          priority: newRuleData.priority || 0
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAutomationRules(prev => [result.data, ...prev]);
          setShowCreateRuleModal(false);
          setNewRuleData({
            name: '',
            description: '',
            triggerType: 'new_message',
            actionType: 'auto_reply',
            priority: 0
          });
          console.log('✅ [OmniBridge] Automation rule created successfully');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [OmniBridge] Failed to create automation rule:', errorData);
        alert(`Erro ao criar regra: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ [OmniBridge] Error creating automation rule:', error);
      alert('Erro ao criar regra. Verifique o console para mais detalhes.');
    }
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('token');

        // ✅ TELEGRAM FIX: Garantir autenticação adequada com tenantId
        const headers = {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        };

        console.log('🔧 [OMNIBRIDGE-FIX] Using headers:', headers);
        console.log('🔧 [OMNIBRIDGE-FIX] User tenantId:', user?.tenantId);

        console.log('🔧 [OMNIBRIDGE-FIX] Using headers:', headers);

        // Primeiro, sincronizar integrações para canais
        try {
          const syncResponse = await fetch('/api/omnibridge/sync-integrations', {
            method: 'POST',
            headers
          });

          if (syncResponse.ok) {
            console.log('✅ [OMNIBRIDGE-SYNC] Manual sync completed');
          } else {
            console.warn('⚠️ [OMNIBRIDGE-SYNC] Sync failed, continuing with existing channels');
          }
        } catch (syncError) {
          console.warn('⚠️ [OMNIBRIDGE-SYNC] Sync error:', syncError);
        }

        // Agora buscar canais sincronizados
        const channelsResponse = await fetch('/api/omnibridge/channels', {
          headers
        });

        const inboxResponse = await fetch('/api/omnibridge/messages', {
          headers
        });

        let channelsData = [];
        let messagesData = [];

        if (channelsResponse.ok) {
          const channelsResult = await channelsResponse.json();
          console.log('🔍 [OmniBridge] Channels data:', channelsResult);

          if (channelsResult.success) {
            channelsData = channelsResult.data.map((channel: any) => ({
              id: channel.id,
              name: channel.name,
              type: channel.type,
              status: channel.status === 'active' ? 'connected' : 'disconnected',
              enabled: channel.status === 'active',
              icon: channel.icon,
              description: channel.description,
              features: channel.features || [],
              messageCount: channel.metrics?.totalMessages || 0,
              lastMessage: null
            }));
          }
        } else {
          console.log('⚠️ [OmniBridge] Failed to fetch channels, status:', channelsResponse.status);
          // Fallback to fetching from integrations if /api/omnibridge/channels fails
          const integrationsResponse = await fetch('/api/tenant-admin-integration/integrations', {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json',
              'x-tenant-id': user?.tenantId || ''
            }
          });

          if (integrationsResponse.ok) {
            const integrationsResult = await integrationsResponse.json();
            console.log('🔍 [OmniBridge] Raw integrations data:', integrationsResult?.data || integrationsResult);

            if (integrationsResult?.data && Array.isArray(integrationsResult.data)) {
              const communicationChannels = integrationsResult.data.filter((integration: any) => {
                const category = integration.category?.toLowerCase() || '';
                return category === 'comunicação' || category === 'communication' || category === 'comunicacao';
              });

              console.log('🔍 [OmniBridge] Filtered communication channels:', communicationChannels.length, 'channels');

              channelsData = communicationChannels.map((integration: any) => ({
                id: integration.id,
                name: integration.name,
                type: getChannelType(integration.id),
                enabled: integration.status === 'connected' || integration.enabled === true,
                icon: getChannelIcon(integration.id),
                description: integration.description || 'Canal de comunicação',
                status: integration.status || 'disconnected',
                messageCount: 0,
                lastMessage: integration.status === 'connected' ? 'Configurado' : 'Aguardando configuração',
                lastActivity: integration.status === 'connected' ? 'Ativo' : 'Nunca',
                features: integration.features || []
              }));
            }
          } else {
            console.log('⚠️ [OmniBridge] Failed to fetch integrations, status:', integrationsResponse.status);
          }
        }

        let inboxResult = null;
        if (inboxResponse.ok) {
          inboxResult = await inboxResponse.json();
          console.log('🔍 [OmniBridge] API Response for inbox:', inboxResult);
        } else {
          console.log('⚠️ [OmniBridge] Failed to fetch inbox, status:', inboxResponse.status);
        }

        if (inboxResult && inboxResult.success) {
          messagesData = inboxResult.messages.map((msg: any) => ({
            id: msg.id,
            channelId: msg.channelId,
            channelType: msg.channelType,
            from: msg.from,
            to: msg.to,
            subject: msg.subject,
            content: msg.body || msg.content,
            timestamp: new Date(msg.receivedAt || msg.timestamp || msg.createdAt).toLocaleString(),
            status: msg.status,
            priority: msg.priority,
            tags: msg.tags,
            attachments: msg.attachments
          }));
        }

        if (channelsData.length === 0) {
          console.log('⚠️ [OmniBridge] No integrations data available, showing message to configure in Workspace Admin');
          channelsData = [];
        }

        console.log('🔍 [OmniBridge-DEBUG] Final channels count:', channelsData.length);
        console.log('🔍 [OmniBridge-DEBUG] Final inbox count:', messagesData.length);

        setChannels(channelsData);
        setMessages(messagesData);

        if (messagesData.length === 0) {
          console.log('📪 No inbox messages available');
        }

      } catch (error) {
        console.error('❌ [OmniBridge] Error fetching data:', error);

        // Fallback data if both endpoints fail
        setChannels([
          {
            id: 'email-imap',
            name: 'Email (IMAP)',
            type: 'email',
            enabled: false,
            icon: Mail,
            description: 'Configuração de email via IMAP/SMTP',
            status: 'disconnected',
            messageCount: 0,
            lastMessage: 'Erro ao carregar',
            lastActivity: 'Erro'
          },
          {
            id: 'whatsapp-business',
            name: 'WhatsApp Business',
            type: 'whatsapp',
            enabled: false,
            icon: MessageSquare,
            description: 'API do WhatsApp Business',
            status: 'disconnected',
            messageCount: 0,
            lastMessage: 'Erro ao carregar',
            lastActivity: 'Erro'
          },
          {
            id: 'telegram-bot',
            name: 'Telegram Bot',
            type: 'telegram',
            enabled: false,
            icon: MessageCircle,
            description: 'Bot do Telegram para atendimento',
            status: 'disconnected',
            messageCount: 0,
            lastMessage: 'Erro ao carregar',
            lastActivity: 'Erro'
          }
        ]);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSyncIntegrations = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      console.log('🔄 [OMNIBRIDGE-MANUAL-SYNC] Starting manual sync...');

      const response = await fetch('/api/omnibridge/sync-integrations', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        }
      });

      if (response.ok) {
        console.log('✅ [OmniBridge] Integrations synced successfully');

        // Wait a moment for sync to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Force reload data after sync
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [OmniBridge] Sync failed:', response.statusText, errorData);
        alert(`Erro na sincronização: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ [OmniBridge] Sync error:', error);
      alert('Erro na sincronização. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };


  const handleChannelToggle = async (channelId: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('token');
      // Assuming a new endpoint for toggling channels or using the integrations endpoint
      const response = await fetch(`/api/omnibridge/channels/${channelId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        setChannels(prev => prev.map(channel =>
          channel.id === channelId
            ? {
                ...channel,
                enabled,
                status: enabled ? 'connected' : 'disconnected',
                lastMessage: enabled ? 'Ativo' : 'Desativado',
                lastActivity: enabled ? 'Agora' : 'Desabilitado'
              }
            : channel
        ));

        console.log(`✅ Canal ${channelId} ${enabled ? 'ativado' : 'desativado'} com sucesso`);
      } else {
        console.error('Erro ao alterar status do canal:', response.status);
      }
    } catch (error) {
      console.error('Error toggling channel:', error);
    }
  };

  const handleSendMessage = async (content: string, channelId: string, recipient: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/omnibridge/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        },
        body: JSON.stringify({
          channelId,
          recipient,
          content
        })
      });

      if (response.ok) {
        console.log('✅ [OMNIBRIDGE] Message sent successfully');
        // Refresh messages
        await refreshMessages();
      } else {
        console.error('❌ [OMNIBRIDGE] Failed to send message:', response.status);
      }
    } catch (error) {
      console.error('❌ [OMNIBRIDGE] Error sending message:', error);
    }
  };

  const refreshMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const messagesResponse = await fetch('/api/omnibridge/messages', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        }
      });

      if (messagesResponse.ok) {
        const result = await messagesResponse.json();
        if (result.success) {
          const messagesData = result.messages.map((msg: any) => ({
            id: msg.id,
            channelId: msg.channelId,
            channelType: msg.channelType,
            from: msg.from,
            to: msg.to,
            subject: msg.subject,
            content: msg.body || msg.content,
            timestamp: new Date(msg.receivedAt || msg.timestamp || msg.createdAt).toLocaleString(),
            status: msg.status,
            priority: msg.priority,
            tags: msg.tags,
            attachments: msg.attachments
          }));
          setMessages(messagesData);
          console.log('✅ [OMNIBRIDGE] Messages refreshed successfully');
        }
      }
    } catch (error) {
      console.error('❌ [OMNIBRIDGE] Error refreshing messages:', error);
    }
  };

  const handleReplyMessage = async (messageId: string, content: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const token = localStorage.getItem('token');
      const response = await fetch('/api/omnibridge/messages/reply', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        },
        body: JSON.stringify({
          originalMessageId: messageId,
          channelId: message.channelId,
          recipient: message.from,
          content
        })
      });

      if (response.ok) {
        console.log('✅ [OMNIBRIDGE] Reply sent successfully');
        await refreshMessages();
        // Update message status to replied
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, status: 'replied' } : msg
        ));
      } else {
        console.error('❌ [OMNIBRIDGE] Failed to send reply:', response.status);
      }
    } catch (error) {
      console.error('❌ [OMNIBRIDGE] Error sending reply:', error);
    }
  };

  const handleForwardMessage = async (messageId: string, recipients: string[], content: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const token = localStorage.getItem('token');
      const response = await fetch('/api/omnibridge/messages/forward', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        },
        body: JSON.stringify({
          originalMessageId: messageId,
          channelId: message.channelId,
          recipients,
          content,
          originalContent: message.content
        })
      });

      if (response.ok) {
        console.log('✅ [OMNIBRIDGE] Message forwarded successfully');
        await refreshMessages();
      } else {
        console.error('❌ [OMNIBRIDGE] Failed to forward message:', response.status);
      }
    } catch (error) {
      console.error('❌ [OMNIBRIDGE] Error forwarding message:', error);
    }
  };

  const handleArchiveMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/omnibridge/messages/${messageId}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        }
      });

      if (response.ok) {
        console.log('✅ [OMNIBRIDGE] Message archived successfully');
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, status: 'archived' } : msg
        ));
      } else {
        console.error('❌ [OMNIBRIDGE] Failed to archive message:', response.status);
      }
    } catch (error) {
      console.error('❌ [OMNIBRIDGE] Error archiving message:', error);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/omnibridge/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        }
      });

      if (response.ok) {
        console.log('✅ [OMNIBRIDGE] Message marked as read');
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, status: 'read' } : msg
        ));
      } else {
        console.error('❌ [OMNIBRIDGE] Failed to mark message as read:', response.status);
      }
    } catch (error) {
      console.error('❌ [OMNIBRIDGE] Error marking message as read:', error);
    }
  };

  const handleStarMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/omnibridge/messages/${messageId}/star`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || ''
        }
      });

      if (response.ok) {
        console.log('✅ [OMNIBRIDGE] Message starred');
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, starred: !msg.starred } : msg
        ));
      } else {
        console.error('❌ [OMNIBRIDGE] Failed to star message:', response.status);
      }
    } catch (error) {
      console.error('❌ [OMNIBRIDGE] Error starring message:', error);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (message.subject && message.subject.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
    const matchesChannel = filterChannel === 'all' || message.channelType === filterChannel;

    return matchesSearch && matchesStatus && matchesChannel;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800 border-green-200';
      case 'disconnected': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando OmniBridge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OmniBridge</h1>
          <p className="text-muted-foreground">
            Central de comunicação unificada - Email, WhatsApp, Telegram e mais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncIntegrations}
            disabled={loading}
          >
            <Settings className="h-4 w-4 mr-2" />
            {loading ? 'Sincronizando...' : 'Sincronizar Integrações'}
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Canais
          </TabsTrigger>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automação
          </TabsTrigger>
          <TabsTrigger value="chatbots" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Chatbots
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar mensagens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("common.status") || "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
                <SelectItem value="replied">Respondidas</SelectItem>
                <SelectItem value="archived">Arquivadas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os canais</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Mensagens ({filteredMessages.length})</span>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const selectedMessages = filteredMessages.filter(msg => msg.status !== 'archived');
                          selectedMessages.forEach(msg => handleArchiveMessage(msg.id));
                        }}
                        title="Arquivar mensagens visíveis"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => refreshMessages()}
                        title="Atualizar mensagens"
                      >
                        <Activity className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        title="Filtros aplicados"
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {filteredMessages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma mensagem encontrada</p>
                        <p className="text-sm">Configure seus canais para começar a receber mensagens</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                              selectedMessage?.id === message.id ? 'border-primary bg-primary/5' : ''
                            } ${message.status === 'unread' ? 'border-l-4 border-l-primary' : ''}`}
                            onClick={() => setSelectedMessage(message)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  {message.channelType === 'email' && <Mail className="h-4 w-4" />}
                                  {message.channelType === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
                                  {message.channelType === 'telegram' && <MessageCircle className="h-4 w-4" />}
                                  {message.channelType === 'sms' && <Phone className="h-4 w-4" />}
                                  <span className="font-medium">{message.from}</span>
                                  {message.starred && (
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  )}
                                </div>
                                <Badge variant="secondary" className={getPriorityColor(message.priority)}>
                                  {message.priority}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{message.timestamp}</span>
                                {message.attachments && message.attachments > 0 && (
                                  <Badge variant="outline">{message.attachments} anexos</Badge>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStarMessage(message.id);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Star className={`h-3 w-3 ${message.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                </Button>
                              </div>
                            </div>
                            {message.subject && (
                              <h4 className="font-medium mb-1">{message.subject}</h4>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {message.content}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1">
                                {message.tags?.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  message.status === 'unread' ? 'border-primary text-primary' :
                                  message.status === 'replied' ? 'border-green-500 text-green-700' :
                                  'border-gray-300 text-gray-600'
                                }
                              >
                                {message.status === 'unread' && <AlertCircle className="h-3 w-3 mr-1" />}
                                {message.status === 'read' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {message.status === 'replied' && <Reply className="h-3 w-3 mr-1" />}
                                {message.status === 'archived' && <Archive className="h-3 w-3 mr-1" />}
                                {message.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes da Mensagem</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedMessage ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {selectedMessage.channelType === 'email' && <Mail className="h-4 w-4" />}
                          {selectedMessage.channelType === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
                          {selectedMessage.channelType === 'telegram' && <MessageCircle className="h-4 w-4" />}
                          <span className="font-medium">{selectedMessage.from}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      {selectedMessage.subject && (
                        <div>
                          <Label className="text-sm font-medium">Assunto</Label>
                          <p className="text-sm mt-1">{selectedMessage.subject}</p>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium">Conteúdo</Label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{selectedMessage.content}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getPriorityColor(selectedMessage.priority)}>
                          {selectedMessage.priority}
                        </Badge>
                        <Badge variant="outline">
                          {selectedMessage.status}
                        </Badge>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Button 
                          className="w-full" 
                          size="sm"
                          onClick={() => {
                            setShowReplyModal(true);
                            setReplyContent('');
                          }}
                        >
                          <Reply className="h-4 w-4 mr-2" />
                          Responder
                        </Button>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setShowForwardModal(true);
                              setForwardContent('');
                              setForwardRecipients('');
                            }}
                          >
                            <Forward className="h-4 w-4 mr-2" />
                            Encaminhar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => selectedMessage && handleArchiveMessage(selectedMessage.id)}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Arquivar
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => selectedMessage && handleMarkAsRead(selectedMessage.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como Lida
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => selectedMessage && handleStarMessage(selectedMessage.id)}
                          >
                            <Star className={`h-4 w-4 mr-2 ${selectedMessage?.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            {selectedMessage?.starred ? 'Remover Estrela' : 'Marcar'}
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => refreshMessages()}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Atualizar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecione uma mensagem para ver os detalhes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Canais de Comunicação</CardTitle>
              <CardDescription>
                Gerencie seus canais de comunicação. Integrações configuradas no Workspace Admin aparecerão aqui.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {channels.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Nenhum canal configurado</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure seus canais de comunicação no Workspace Admin para que eles apareçam aqui.
                  </p>
                  <Button
                    onClick={() => window.open('/tenant-admin/integrations', '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ir para Integrações
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.map((channel) => (
                  <Card key={channel.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Use the actual icon if available, otherwise fallback */}
                          {channel.icon ? (
                            <div className="p-2 rounded-lg bg-primary/10">
                              <img src={channel.icon} alt={channel.name} className="h-5 w-5 text-primary" />
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-primary/10">
                              {React.createElement(getChannelIcon(channel.id), { className: "h-5 w-5 text-primary" })}
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium">{channel.name}</h3>
                            <p className="text-sm text-muted-foreground">{channel.type}</p>
                          </div>
                        </div>
                        <Switch
                          checked={channel.enabled}
                          onCheckedChange={(enabled) => handleChannelToggle(channel.id, enabled)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">
                        {channel.description}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Status:</span>
                          <Badge variant="outline" className={getStatusColor(channel.status)}>
                            {channel.status}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span>Mensagens:</span>
                          <span className="font-medium">{channel.messageCount}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span>Última atividade:</span>
                          <span className="text-muted-foreground">{channel.lastActivity || 'Nenhuma'}</span>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open('/tenant-admin/integrations', '_blank')}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Activity className="h-4 w-4 mr-2" />
                          Logs
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Regras de Automação</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Templates
                  </Button>
                  <Button size="sm" onClick={() => setShowCreateRuleModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Regra
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Configure regras automáticas para processar mensagens, criar tickets, enviar notificações e mais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {automationRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma regra de automação configurada</p>
                  <p className="text-sm">Crie sua primeira regra para automatizar o atendimento</p>
                  <div className="mt-4 space-y-2">
                    <Button onClick={() => setShowCreateRuleModal(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Regra
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      Use templates prontos para começar rapidamente
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Rules List */}
                  <div className="grid grid-cols-1 gap-4">
                    {automationRules.map((rule) => (
                      <Card key={rule.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${rule.isEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                                <Workflow className={`h-5 w-5 ${rule.isEnabled ? 'text-green-600' : 'text-gray-500'}`} />
                              </div>
                              <div>
                                <h3 className="font-medium">{rule.name}</h3>
                                <p className="text-sm text-muted-foreground">{rule.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rule.isEnabled}
                                onCheckedChange={(enabled) => handleToggleAutomationRule(rule.id, enabled)}
                              />
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {/* Triggers */}
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">GATILHOS</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {rule.triggers && rule.triggers.map((trigger, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {trigger.type === 'keyword' && 'Palavras-chave'}
                                    {trigger.type === 'new_message' && 'Nova mensagem'}
                                    {trigger.type === 'channel_specific' && 'Canal específico'}
                                    {trigger.type === 'priority_based' && 'Prioridade'}
                                    {trigger.type === 'time_based' && 'Horário'}
                                    {trigger.type === 'sender_pattern' && 'Padrão do remetente'}
                                    {trigger.type === 'content_pattern' && 'Padrão de conteúdo'}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">AÇÕES</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {rule.actions && rule.actions.map((action, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {action.type === 'auto_reply' && 'Resposta automática'}
                                    {action.type === 'forward_message' && 'Encaminhar'}
                                    {action.type === 'create_ticket' && 'Criar ticket'}
                                    {action.type === 'send_notification' && 'Notificação'}
                                    {action.type === 'add_tags' && 'Adicionar tags'}
                                    {action.type === 'assign_agent' && 'Atribuir agente'}
                                    {action.type === 'mark_priority' && 'Marcar prioridade'}
                                    {action.type === 'archive' && 'Arquivar'}
                                    {action.type === 'webhook_call' && 'Webhook'}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-4">
                                <span className="text-muted-foreground">
                                  Prioridade: <span className="font-medium">{rule.priority}</span>
                                </span>
                                <span className="text-muted-foreground">
                                  Execuções: <span className="font-medium">{rule.executionStats?.totalExecutions || 0}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm">
                                  <Settings className="h-4 w-4 mr-2" />
                                  Editar
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Activity className="h-4 w-4 mr-2" />
                                  Logs
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Templates de Resposta</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </CardTitle>
              <CardDescription>
                Crie e gerencie templates para respostas rápidas em diferentes canais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum template configurado</p>
                <p className="text-sm">Crie templates para agilizar suas respostas</p>
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chatbots Tab */}
        <TabsContent value="chatbots" className="space-y-4">
          <ChatbotKanban />
        </TabsContent>
      </Tabs>

      {/* Modal de Resposta */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder Mensagem</DialogTitle>
            <DialogDescription>
              Respondendo para: {selectedMessage?.from}
              {selectedMessage?.subject && ` - ${selectedMessage.subject}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded p-3 bg-muted">
              <p className="text-sm text-muted-foreground">Mensagem original:</p>
              <p className="text-sm mt-1">{selectedMessage?.content}</p>
            </div>
            <Textarea
              placeholder="Digite sua resposta..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={6}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReplyModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={async () => {
                  if (selectedMessage && replyContent.trim()) {
                    await handleReplyMessage(selectedMessage.id, replyContent);
                    setShowReplyModal(false);
                    setReplyContent('');
                  }
                }}
                disabled={!replyContent.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Resposta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Encaminhamento */}
      <Dialog open={showForwardModal} onOpenChange={setShowForwardModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Encaminhar Mensagem</DialogTitle>
            <DialogDescription>
              Encaminhando mensagem de: {selectedMessage?.from}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded p-3 bg-muted">
              <p className="text-sm text-muted-foreground">Mensagem original:</p>
              <p className="text-sm mt-1">{selectedMessage?.content}</p>
            </div>
            <div>
              <Label htmlFor="recipients">Destinatários (separados por vírgula)</Label>
              <Input
                id="recipients"
                placeholder="email1@exemplo.com, email2@exemplo.com"
                value={forwardRecipients}
                onChange={(e) => setForwardRecipients(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="forward-message">Mensagem adicional (opcional)</Label>
              <Textarea
                id="forward-message"
                placeholder="Adicione uma mensagem..."
                value={forwardContent}
                onChange={(e) => setForwardContent(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForwardModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={async () => {
                  if (selectedMessage && forwardRecipients.trim()) {
                    const recipients = forwardRecipients.split(',').map(r => r.trim()).filter(r => r);
                    await handleForwardMessage(selectedMessage.id, recipients, forwardContent);
                    setShowForwardModal(false);
                    setForwardContent('');
                    setForwardRecipients('');
                  }
                }}
                disabled={!forwardRecipients.trim()}
              >
                <Forward className="h-4 w-4 mr-2" />
                Encaminhar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Criar Regra de Automação */}
      <Dialog open={showCreateRuleModal} onOpenChange={setShowCreateRuleModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Regra de Automação</DialogTitle>
            <DialogDescription>
              Configure uma nova regra para automatizar o processamento de mensagens
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rule-name">Nome da Regra</Label>
              <Input
                id="rule-name"
                placeholder="Ex: Resposta automática para novos clientes"
                value={newRuleData.name}
                onChange={(e) => setNewRuleData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="rule-description">Descrição</Label>
              <Textarea
                id="rule-description"
                placeholder="Descreva o que esta regra faz..."
                value={newRuleData.description}
                onChange={(e) => setNewRuleData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trigger-type">Gatilho</Label>
                <Select 
                  value={newRuleData.triggerType} 
                  onValueChange={(value) => setNewRuleData(prev => ({ ...prev, triggerType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gatilho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_message">Nova mensagem</SelectItem>
                    <SelectItem value="keyword">Palavra-chave</SelectItem>
                    <SelectItem value="channel_specific">Canal específico</SelectItem>
                    <SelectItem value="priority_based">Baseado em prioridade</SelectItem>
                    <SelectItem value="time_based">Baseado em horário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="action-type">Ação</Label>
                <Select 
                  value={newRuleData.actionType} 
                  onValueChange={(value) => setNewRuleData(prev => ({ ...prev, actionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto_reply">Resposta automática</SelectItem>
                    <SelectItem value="forward_message">Encaminhar mensagem</SelectItem>
                    <SelectItem value="create_ticket">Criar ticket</SelectItem>
                    <SelectItem value="send_notification">Enviar notificação</SelectItem>
                    <SelectItem value="add_tags">Adicionar tags</SelectItem>
                    <SelectItem value="assign_agent">Atribuir agente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="priority">Prioridade (0-10)</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                max="10"
                value={newRuleData.priority}
                onChange={(e) => setNewRuleData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateRuleModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateAutomationRule}
                disabled={!newRuleData.name.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Regra
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}