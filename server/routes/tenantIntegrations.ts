import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { requireTenantAdmin, requirePermission, AuthorizedRequest } from '../middleware/authorizationMiddleware';
import { Permission } from '../domain/authorization/RolePermissions';

const router = Router();

// Aplicar middlewares de autenticação e autorização
router.use(jwtAuth);
router.use(requireTenantAdmin);

/**
 * GET /api/tenant-admin/integrations
 * Obter integrações do tenant
 */
router.get('/', requirePermission(Permission.TENANT_MANAGE_SETTINGS), async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    // Simular dados de integrações do tenant
    const integrations = [
      {
        id: 'email-smtp',
        name: 'Email SMTP',
        category: 'Comunicação',
        status: 'disconnected',
        configured: false,
        lastSync: null
      },
      {
        id: 'whatsapp-business',
        name: 'WhatsApp Business',
        category: 'Comunicação',
        status: 'disconnected',
        configured: false,
        lastSync: null
      },
      {
        id: 'slack',
        name: 'Slack',
        category: 'Comunicação',
        status: 'disconnected',
        configured: false,
        lastSync: null
      },
      {
        id: 'twilio-sms',
        name: 'Twilio SMS',
        category: 'Comunicação',
        status: 'disconnected',
        configured: false,
        lastSync: null
      },
      {
        id: 'zapier',
        name: 'Zapier',
        category: 'Automação',
        status: 'disconnected',
        configured: false,
        lastSync: null
      },
      {
        id: 'webhooks',
        name: 'Webhooks',
        category: 'Automação',
        status: 'disconnected',
        configured: false,
        lastSync: null
      },
      {
        id: 'crm-integration',
        name: 'CRM Integration',
        category: 'Dados',
        status: 'disconnected',
        configured: false,
        lastSync: null
      },
      {
        id: 'sso-saml',
        name: 'SSO/SAML',
        category: 'Segurança',
        status: 'disconnected',
        configured: false,
        lastSync: null
      },
      {
        id: 'google-workspace',
        name: 'Google Workspace',
        category: 'Produtividade',
        status: 'disconnected',
        configured: false,
        lastSync: null
      },
      {
        id: 'chatbot',
        name: 'Chatbot IA',
        category: 'Automação',
        status: 'disconnected',
        configured: false,
        lastSync: null
      }
    ];
    
    res.json({ integrations });
  } catch (error) {
    console.error('Error fetching tenant integrations:', error);
    res.status(500).json({ message: 'Failed to fetch integrations' });
  }
});

/**
 * PUT /api/tenant-admin/integrations/:integrationId/config
 * Configurar integração do tenant
 */
router.put('/:integrationId/config', requirePermission(Permission.TENANT_MANAGE_SETTINGS), async (req: AuthorizedRequest, res) => {
  try {
    const { integrationId } = req.params;
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const { apiKey, apiSecret, webhookUrl, accessToken, enabled, settings } = req.body;

    // Validar integrationId
    const validIntegrations = [
      'email-smtp', 'whatsapp-business', 'slack', 'twilio-sms', 
      'zapier', 'webhooks', 'crm-integration', 'sso-saml', 
      'google-workspace', 'chatbot'
    ];
    
    if (!validIntegrations.includes(integrationId)) {
      return res.status(400).json({ message: 'Invalid integration ID' });
    }

    // Simular configuração da integração
    const config = {
      integrationId,
      tenantId,
      apiKey: apiKey ? '***' + apiKey.slice(-4) : undefined,
      apiSecret: apiSecret ? '***' + apiSecret.slice(-4) : undefined,
      webhookUrl,
      accessToken: accessToken ? '***' + accessToken.slice(-4) : undefined,
      enabled: enabled !== false,
      settings: settings || {},
      updatedAt: new Date().toISOString()
    };

    res.json({
      message: 'Integration configured successfully',
      config
    });
  } catch (error) {
    console.error('Error configuring tenant integration:', error);
    res.status(500).json({ message: 'Failed to configure integration' });
  }
});

/**
 * POST /api/tenant-admin/integrations/:integrationId/test
 * Testar integração do tenant
 */
router.post('/:integrationId/test', requirePermission(Permission.TENANT_MANAGE_SETTINGS), async (req: AuthorizedRequest, res) => {
  try {
    const { integrationId } = req.params;
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    // Simular teste da integração
    let testResult = { success: false, error: '', details: {} };

    switch (integrationId) {
      case 'email-smtp':
        testResult = { 
          success: true, 
          error: '', 
          details: { 
            server: 'smtp.gmail.com',
            port: '587',
            authentication: 'successful'
          }
        };
        break;

      case 'whatsapp-business':
        testResult = { 
          success: true, 
          error: '', 
          details: { 
            phoneNumber: '+55 11 99999-9999',
            status: 'verified',
            webhookStatus: 'active'
          }
        };
        break;

      case 'slack':
        testResult = { 
          success: true, 
          error: '', 
          details: { 
            workspace: 'empresa-workspace',
            channels: ['#suporte', '#alertas'],
            botStatus: 'online'
          }
        };
        break;

      case 'webhooks':
        testResult = { 
          success: true, 
          error: '', 
          details: { 
            url: 'https://exemplo.com/webhook',
            responseTime: '120ms',
            status: 'reachable'
          }
        };
        break;

      default:
        testResult = { 
          success: true, 
          error: '', 
          details: { 
            status: 'integration test successful',
            timestamp: new Date().toISOString()
          }
        };
    }

    res.json(testResult);
  } catch (error) {
    console.error('Error testing tenant integration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test integration' 
    });
  }
});

export default router;