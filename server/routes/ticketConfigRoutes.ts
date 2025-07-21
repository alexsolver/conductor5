/**
 * Ticket Configuration Routes
 * Handles ticket configuration management endpoints
 */

import { Router, Request, Response } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { requireTenantAccess, AuthenticatedRequest } from '../middleware/rbacMiddleware';
import { logInfo, logError } from '../utils/logger';
import { storage } from '../storage-simple';

const router = Router();

/**
 * Get ticket configuration for tenant
 */
router.get('/', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    
    logInfo('Getting ticket configuration', { tenantId });
    
    // Mock ticket configuration - replace with actual implementation
    const ticketConfig = {
      id: tenantId,
      statusOptions: ['
        { value: 'open', label: 'Open', color: '#28a745' },
        { value: 'in_progress', label: 'In Progress', color: '#ffc107' },
        { value: 'pending', label: 'Pending', color: '#fd7e14' },
        { value: 'resolved', label: 'Resolved', color: '#17a2b8' },
        { value: 'closed', label: 'Closed', color: '#6c757d' }
      ],
      priorityOptions: ['
        { value: 'low', label: 'Low', color: '#28a745' },
        { value: 'medium', label: 'Medium', color: '#ffc107' },
        { value: 'high', label: 'High', color: '#fd7e14' },
        { value: 'critical', label: 'Critical', color: '#dc3545' }
      ],
      categoryOptions: ['
        { value: 'technical', label: 'Technical Support' },
        { value: 'billing', label: 'Billing' },
        { value: 'general', label: 'General Inquiry' },
        { value: 'feature_request', label: 'Feature Request' },
        { value: 'bug_report', label: 'Bug Report' }
      ],
      settings: {
        autoAssignEnabled: true,
        slaEnabled: true,
        defaultSlaHours: 24,
        escalationEnabled: true,
        escalationHours: 48,
        requiredFields: ['title', 'description', 'category]
      }
    };

    res.json(ticketConfig);
  } catch (error) {
    logError('Error getting ticket configuration', error);
    res.status(500).json({ message: 'Failed to get ticket configuration' });
  }
});

/**
 * Update ticket configuration
 */
router.put('/', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const configData = req.body;
    
    logInfo('Updating ticket configuration', { tenantId, configData });
    
    // Validate configuration data
    if (!configData.statusOptions || !Array.isArray(configData.statusOptions)) {
      return res.status(400).json({ message: 'Invalid status options' });
    }
    
    if (!configData.priorityOptions || !Array.isArray(configData.priorityOptions)) {
      return res.status(400).json({ message: 'Invalid priority options' });
    }
    
    // Mock update - replace with actual implementation
    const updatedConfig = {
      id: tenantId,
      ...configData,
      updatedAt: new Date().toISOString()
    };

    res.json(updatedConfig);
  } catch (error) {
    logError('Error updating ticket configuration', error);
    res.status(500).json({ message: 'Failed to update ticket configuration' });
  }
});

/**
 * Get default ticket templates
 */
router.get('/templates', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    
    logInfo('Getting ticket templates', { tenantId });
    
    const templates = ['
      {
        id: 'technical_support',
        name: 'Technical Support',
        description: 'Template for technical support tickets',
        fields: ['
          { name: 'title', required: true, type: 'text' },
          { name: 'description', required: true, type: 'textarea' },
          { name: 'category', required: true, type: 'select', options: ['technical] },
          { name: 'priority', required: false, type: 'select', default: 'medium' },
          { name: 'affected_system', required: false, type: 'text' },
          { name: 'error_message', required: false, type: 'textarea' }
        ]
      },
      {
        id: 'billing_inquiry',
        name: 'Billing Inquiry',
        description: 'Template for billing-related tickets',
        fields: ['
          { name: 'title', required: true, type: 'text' },
          { name: 'description', required: true, type: 'textarea' },
          { name: 'category', required: true, type: 'select', options: ['billing] },
          { name: 'account_number', required: false, type: 'text' },
          { name: 'invoice_number', required: false, type: 'text' }
        ]
      }
    ];

    res.json(templates);
  } catch (error) {
    logError('Error getting ticket templates', error);
    res.status(500).json({ message: 'Failed to get ticket templates' });
  }
});

/**
 * Create custom ticket template
 */
router.post('/templates', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const templateData = req.body;
    
    logInfo('Creating ticket template', { tenantId, templateData });
    
    // Validate template data
    if (!templateData.name || !templateData.fields) {
      return res.status(400).json({ message: 'Template name and fields are required' });
    }
    
    const template = {
      id: `custom_${Date.now()}`,
      tenantId,
      ...templateData,
      createdAt: new Date().toISOString()
    };

    res.status(201).json(template);
  } catch (error) {
    logError('Error creating ticket template', error);
    res.status(500).json({ message: 'Failed to create ticket template' });
  }
});

/**
 * Get SLA configurations
 */
router.get('/sla', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    
    logInfo('Getting SLA configurations', { tenantId });
    
    const slaConfigs = ['
      {
        id: 'default',
        name: 'Default SLA',
        priority: 'medium',
        responseTime: 4, // hours
        resolutionTime: 24, // hours
        businessHoursOnly: false,
        escalationRules: ['
          { condition: 'overdue', action: 'notify_manager', delayHours: 2 },
          { condition: 'critical_overdue', action: 'escalate', delayHours: 8 }
        ]
      },
      {
        id: 'critical',
        name: 'Critical Priority SLA',
        priority: 'critical',
        responseTime: 1, // hours
        resolutionTime: 8, // hours
        businessHoursOnly: false,
        escalationRules: ['
          { condition: 'overdue', action: 'immediate_escalate', delayHours: 0.5 }
        ]
      }
    ];

    res.json(slaConfigs);
  } catch (error) {
    logError('Error getting SLA configurations', error);
    res.status(500).json({ message: 'Failed to get SLA configurations' });
  }
});

/**
 * Update SLA configuration
 */
router.put('/sla/:slaId', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { slaId } = req.params;
    const slaData = req.body;
    
    logInfo('Updating SLA configuration', { tenantId, slaId, slaData });
    
    // Validate SLA data
    if (!slaData.responseTime || !slaData.resolutionTime) {
      return res.status(400).json({ message: 'Response time and resolution time are required' });
    }
    
    const updatedSla = {
      id: slaId,
      tenantId,
      ...slaData,
      updatedAt: new Date().toISOString()
    };

    res.json(updatedSla);
  } catch (error) {
    logError('Error updating SLA configuration', error);
    res.status(500).json({ message: 'Failed to update SLA configuration' });
  }
});

/**
 * Get automation rules
 */
router.get('/automation', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    
    logInfo('Getting automation rules', { tenantId });
    
    const automationRules = ['
      {
        id: 'auto_assign_technical',
        name: 'Auto-assign Technical Tickets',
        enabled: true,
        trigger: 'ticket_created',
        conditions: ['
          { field: 'category', operator: 'equals', value: 'technical' }
        ],
        actions: ['
          { type: 'assign_to_team', value: 'technical_support' },
          { type: 'set_priority', value: 'medium' }
        ]
      },
      {
        id: 'escalate_critical',
        name: 'Escalate Critical Tickets',
        enabled: true,
        trigger: 'ticket_overdue',
        conditions: ['
          { field: 'priority', operator: 'equals', value: 'critical' },
          { field: 'status', operator: 'not_equals', value: 'closed' }
        ],
        actions: ['
          { type: 'notify_manager', value: true },
          { type: 'add_comment', value: 'Critical ticket requires immediate attention' }
        ]
      }
    ];

    res.json(automationRules);
  } catch (error) {
    logError('Error getting automation rules', error);
    res.status(500).json({ message: 'Failed to get automation rules' });
  }
});

export default router;