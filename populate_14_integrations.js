// Script para popular todas as 14 integrações no tenant atual
import { storage } from './server/storage-simple.js';

const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';

const allIntegrations = [
  // Comunicação (7 integrações)
  {
    id: 'gmail-oauth2',
    name: 'Gmail OAuth2',
    description: 'Integração OAuth2 com Gmail para envio e recebimento seguro de emails',
    category: 'Comunicação',
    icon: 'Mail',
    features: ['OAuth2 Authentication', 'Send/Receive Emails', 'Auto-sync', 'Secure Token Management']
  },
  {
    id: 'outlook-oauth2',
    name: 'Outlook OAuth2',
    description: 'Integração OAuth2 com Microsoft Outlook para emails corporativos',
    category: 'Comunicação',
    icon: 'Mail',
    features: ['OAuth2 Authentication', 'Exchange Integration', 'Calendar Sync', 'Corporate Email']
  },
  {
    id: 'email-smtp',
    name: 'Email SMTP',
    description: 'Configuração de servidor SMTP para envio de emails automáticos e notificações',
    category: 'Comunicação',
    icon: 'Mail',
    features: ['Notificações por email', 'Tickets por email', 'Relatórios automáticos']
  },
  {
    id: 'imap-email',
    name: 'IMAP Email',
    description: 'Conecte sua caixa de email via IMAP para sincronização de tickets',
    category: 'Comunicação',
    icon: 'Inbox',
    features: ['Sincronização bidirecional', 'Auto-resposta', 'Filtros avançados']
  },
  {
    id: 'whatsapp-business',
    name: 'WhatsApp Business',
    description: 'Integração com WhatsApp Business API para atendimento via WhatsApp',
    category: 'Comunicação',
    icon: 'MessageSquare',
    features: ['Mensagens automáticas', 'Templates aprovados', 'Webhooks']
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Notificações e gerenciamento de tickets através do Slack',
    category: 'Comunicação',
    icon: 'MessageCircle',
    features: ['Notificações de tickets', 'Comandos slash', 'Bot integrado']
  },
  {
    id: 'twilio-sms',
    name: 'Twilio SMS',
    description: 'Envio de SMS para notificações e alertas importantes',
    category: 'Comunicação',
    icon: 'Phone',
    features: ['SMS automático', 'Notificações críticas', 'Verificação 2FA']
  },
  // Automação (2 integrações)
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Conecte com mais de 3000 aplicativos através de automações Zapier',
    category: 'Automação',
    icon: 'Zap',
    features: ['Workflows automáticos', '3000+ integrações', 'Triggers personalizados']
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Receba notificações em tempo real de eventos do sistema',
    category: 'Automação',
    icon: 'Webhook',
    features: ['Eventos em tempo real', 'Custom endpoints', 'Retry automático']
  },
  // Dados (2 integrações)
  {
    id: 'crm-integration',
    name: 'CRM Integration',
    description: 'Sincronização com sistemas CRM para gestão unificada de clientes',
    category: 'Dados',
    icon: 'Database',
    features: ['Sincronização bidirecionais', 'Mapeamento de campos', 'Histórico unificado']
  },
  {
    id: 'dropbox-personal',
    name: 'Dropbox Pessoal',
    description: 'Backup automático de dados e arquivos importantes',
    category: 'Dados',
    icon: 'Cloud',
    features: ['Backup automático', 'Sincronização de arquivos', 'Versionamento']
  },
  // Segurança (1 integração)
  {
    id: 'sso-saml',
    name: 'SSO/SAML',
    description: 'Single Sign-On para autenticação corporativa segura',
    category: 'Segurança',
    icon: 'Shield',
    features: ['Single Sign-On', 'SAML 2.0', 'Active Directory', 'Multi-factor Authentication']
  },
  // Produtividade (2 integrações)
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Integração completa com Gmail, Drive e Calendar',
    category: 'Produtividade',
    icon: 'Calendar',
    features: ['Gmail sync', 'Drive backup', 'Calendar integration']
  },
  {
    id: 'chatbot-ai',
    name: 'Chatbot IA',
    description: 'Assistente virtual inteligente para atendimento automatizado',
    category: 'Produtividade',
    icon: 'Bot',
    features: ['Respostas automáticas', 'Machine Learning', 'Escalação inteligente']
  }
];

async function populateAllIntegrations() {
  try {
    console.log('🚀 Populando todas as 14 integrações...');
    
    // Usar o método interno para criar integrações
    await storage.createDefaultTenantIntegrations(tenantId);
    
    console.log('✅ Integrações populadas com sucesso!');
    
    // Verificar resultados
    const integrations = await storage.getTenantIntegrations(tenantId);
    console.log(`📊 Total de integrações criadas: ${integrations.length}`);
    
    integrations.forEach(int => {
      console.log(`• ${int.name} (${int.category})`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao popular integrações:', error);
  }
}

populateAllIntegrations();