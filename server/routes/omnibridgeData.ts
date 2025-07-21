import { Router } from 'express';

const router = Router();

// OmniBridge data endpoints
router.get('/channels', (req, res) => {
  console.log('🌉 OmniBridge: Channels endpoint accessed');
  
  const channels = [
    {
      id: 'integration-email-imap',
      name: 'Email IMAP',
      type: 'email',
      isConnected: true,
      status: 'connected',
      lastActivity: new Date().toISOString(),
      config: { 
        provider: 'gmail',
        server: 'imap.gmail.com',
        port: 993
      }
    },
    {
      id: 'integration-gmail-oauth',
      name: 'Gmail OAuth2',
      type: 'email',
      isConnected: false,
      status: 'disconnected',
      lastActivity: null,
      config: { provider: 'gmail-oauth' }
    },
    {
      id: 'integration-twilio-sms',
      name: 'SMS Twilio',
      type: 'sms',
      isConnected: false,
      status: 'disconnected', 
      lastActivity: null,
      config: { provider: 'twilio' }
    },
    {
      id: 'integration-webhook-generic',
      name: 'Webhooks Genéricos',
      type: 'webhook',
      isConnected: true,
      status: 'connected',
      lastActivity: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      config: { provider: 'generic-webhook' }
    }
  ];

  console.log(`🌉 OmniBridge: Returning ${channels.length} channels`);
  res.json({ channels });
});

router.get('/rules', (req, res) => {
  console.log('🌉 OmniBridge: Rules endpoint accessed');
  
  const rules = [
    {
      id: 'rule-1',
      name: 'Urgente - Criar Ticket',
      description: 'Emails com "urgente" no assunto criam tickets de alta prioridade',
      trigger_type: 'subject_contains',
      trigger_value: 'urgente',
      action_type: 'create_ticket',
      action_config: { priority: 'high', auto_assign: true },
      is_active: true,
      priority: 10,
      created_at: new Date().toISOString()
    },
    {
      id: 'rule-2', 
      name: 'Suporte - Auto Resposta',
      description: 'Emails para suporte recebem resposta automática',
      trigger_type: 'to_contains',
      trigger_value: 'suporte',
      action_type: 'auto_reply',
      action_config: { template_id: 'support-auto-reply' },
      is_active: true,
      priority: 5,
      created_at: new Date().toISOString()
    }
  ];

  console.log(`🌉 OmniBridge: Returning ${rules.length} rules`);
  res.json({ rules });
});

router.get('/templates', (req, res) => {
  console.log('🌉 OmniBridge: Templates endpoint accessed');
  
  const templates = [
    {
      id: 'template-1',
      name: 'Resposta Automática Suporte',
      subject: 'Re: {original_subject}',
      content: 'Olá {customer_name},\n\nRecebemos sua mensagem e em breve retornaremos.\n\nAtenciosamente,\nEquipe de Suporte',
      language: 'pt-BR',
      category: 'auto-reply',
      is_active: true,
      usage_count: 47,
      effectiveness_score: 8.5,
      created_at: new Date().toISOString()
    },
    {
      id: 'template-2',
      name: 'Ticket Resolvido',
      subject: 'Ticket #{ticket_id} - Resolvido',
      content: 'Prezado(a) {customer_name},\n\nInformamos que seu ticket #{ticket_id} foi resolvido.\n\nDescrição da solução: {resolution_notes}\n\nQualquer dúvida, entre em contato.\n\nAtenciosamente,\n{agent_name}',
      language: 'pt-BR', 
      category: 'resolution',
      is_active: true,
      usage_count: 23,
      effectiveness_score: 9.2,
      created_at: new Date().toISOString()
    }
  ];

  console.log(`🌉 OmniBridge: Returning ${templates.length} templates`);
  res.json({ templates });
});

router.get('/metrics', (req, res) => {
  console.log('🌉 OmniBridge: Metrics endpoint accessed');
  
  const metrics = [
    {
      id: 'metric-1',
      metric_date: new Date().toISOString(),
      metric_name: 'messages_processed',
      status: 'success',
      value: 42
    },
    {
      id: 'metric-2',
      metric_date: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      metric_name: 'tickets_created', 
      status: 'success',
      value: 15
    },
    {
      id: 'metric-3',
      metric_date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      metric_name: 'auto_replies_sent',
      status: 'success', 
      value: 28
    }
  ];

  console.log(`🌉 OmniBridge: Returning ${metrics.length} metrics`);
  res.json({ metrics });
});

export default router;