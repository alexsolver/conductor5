import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth.js';
const { db, schemaManager } = require("../../../../db");
import { ticketFieldConfigurations, ticketFieldOptions, ticketStyleConfigurations } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Initialize ticket metadata if not already present
 */
router.post('/initialize', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user.tenantId;

    // Check if metadata already exists
    const existingConfigs = await db
      .select()
      .from(ticketFieldConfigurations)
      .where(eq(ticketFieldConfigurations.tenantId, tenantId))
      .limit(1);

    if (existingConfigs.length > 0) {
      return res.json({ message: 'Ticket metadata already initialized', status: 'exists' });
    }

    // Initialize field configurations
    const fieldConfigs = [
      { fieldName: 'status', fieldType: 'select', label: 'Status', required: true, order: 1 },
      { fieldName: 'priority', fieldType: 'select', label: 'Priority', required: true, order: 2 },
      { fieldName: 'category', fieldType: 'select', label: 'Category', required: false, order: 3 },
      { fieldName: 'location', fieldType: 'select', label: 'Location', required: false, order: 4 },
      { fieldName: 'impact', fieldType: 'select', label: 'Impact', required: false, order: 5 },
      { fieldName: 'urgency', fieldType: 'select', label: 'Urgency', required: false, order: 6 },
      { fieldName: 'template', fieldType: 'select', label: 'Template', required: false, order: 7 },
    ];

    const insertedConfigs = await db
      .insert(ticketFieldConfigurations)
      .values(fieldConfigs.map(config => ({ ...config, tenantId })))
      .returning();

    // Initialize field options
    const fieldOptions = [
      // Status options
      { fieldName: 'status', value: 'open', label: 'Open', color: '#3B82F6', backgroundColor: '#EFF6FF', order: 1 },
      { fieldName: 'status', value: 'in_progress', label: 'In Progress', color: '#8B5CF6', backgroundColor: '#F3E8FF', order: 2 },
      { fieldName: 'status', value: 'resolved', label: 'Resolved', color: '#10B981', backgroundColor: '#ECFDF5', order: 3 },
      { fieldName: 'status', value: 'closed', label: 'Closed', color: '#6B7280', backgroundColor: '#F9FAFB', order: 4 },
      
      // Priority options
      { fieldName: 'priority', value: 'low', label: 'Low', color: '#10B981', backgroundColor: '#ECFDF5', order: 1 },
      { fieldName: 'priority', value: 'medium', label: 'Medium', color: '#F59E0B', backgroundColor: '#FFFBEB', order: 2 },
      { fieldName: 'priority', value: 'high', label: 'High', color: '#EF4444', backgroundColor: '#FEF2F2', order: 3 },
      { fieldName: 'priority', value: 'urgent', label: 'Urgent', color: '#DC2626', backgroundColor: '#FEE2E2', order: 4 },
      
      // Category options
      { fieldName: 'category', value: 'hardware', label: 'Hardware', color: '#6B7280', backgroundColor: '#F9FAFB', order: 1 },
      { fieldName: 'category', value: 'software', label: 'Software', color: '#3B82F6', backgroundColor: '#EFF6FF', order: 2 },
      { fieldName: 'category', value: 'network', label: 'Network', color: '#8B5CF6', backgroundColor: '#F3E8FF', order: 3 },
      { fieldName: 'category', value: 'security', label: 'Security', color: '#EF4444', backgroundColor: '#FEF2F2', order: 4 },
      { fieldName: 'category', value: 'access', label: 'Access Request', color: '#10B981', backgroundColor: '#ECFDF5', order: 5 },
      { fieldName: 'category', value: 'other', label: 'Other', color: '#6B7280', backgroundColor: '#F9FAFB', order: 6 },
      
      // Location options
      { fieldName: 'location', value: 'matriz', label: 'Matriz', color: '#3B82F6', backgroundColor: '#EFF6FF', order: 1 },
      { fieldName: 'location', value: 'filial1', label: 'Filial 1', color: '#10B981', backgroundColor: '#ECFDF5', order: 2 },
      { fieldName: 'location', value: 'filial2', label: 'Filial 2', color: '#F59E0B', backgroundColor: '#FFFBEB', order: 3 },
      { fieldName: 'location', value: 'remoto', label: 'Remoto', color: '#8B5CF6', backgroundColor: '#F3E8FF', order: 4 },
      
      // Impact options
      { fieldName: 'impact', value: 'low', label: 'Low', color: '#10B981', backgroundColor: '#ECFDF5', order: 1 },
      { fieldName: 'impact', value: 'medium', label: 'Medium', color: '#F59E0B', backgroundColor: '#FFFBEB', order: 2 },
      { fieldName: 'impact', value: 'high', label: 'High', color: '#EF4444', backgroundColor: '#FEF2F2', order: 3 },
      
      // Urgency options
      { fieldName: 'urgency', value: 'low', label: 'Low', color: '#10B981', backgroundColor: '#ECFDF5', order: 1 },
      { fieldName: 'urgency', value: 'medium', label: 'Medium', color: '#F59E0B', backgroundColor: '#FFFBEB', order: 2 },
      { fieldName: 'urgency', value: 'high', label: 'High', color: '#EF4444', backgroundColor: '#FEF2F2', order: 3 },
      
      // Template options
      { fieldName: 'template', value: 'incident', label: 'Incident Template', color: '#EF4444', backgroundColor: '#FEF2F2', order: 1 },
      { fieldName: 'template', value: 'request', label: 'Service Request', color: '#3B82F6', backgroundColor: '#EFF6FF', order: 2 },
      { fieldName: 'template', value: 'change', label: 'Change Request', color: '#F59E0B', backgroundColor: '#FFFBEB', order: 3 },
    ];

    await db
      .insert(ticketFieldOptions)
      .values(fieldOptions.map(option => ({ ...option, tenantId })));

    // Initialize style configurations
    const styleConfigs = [
      {
        fieldName: 'status',
        styleType: 'badge',
        cssClass: 'status-badge',
        customCss: '.status-badge { border-radius: 6px; font-weight: 500; }',
      },
      {
        fieldName: 'priority',
        styleType: 'badge',
        cssClass: 'priority-badge',
        customCss: '.priority-badge { border-radius: 6px; font-weight: 500; }',
      },
    ];

    await db
      .insert(ticketStyleConfigurations)
      .values(styleConfigs.map(style => ({ ...style, tenantId })));

    res.json({
      message: 'Ticket metadata initialized successfully',
      status: 'initialized',
      counts: {
        fieldConfigurations: fieldConfigs.length,
        fieldOptions: fieldOptions.length,
        styleConfigurations: styleConfigs.length,
      },
    });
  } catch (error) {
    console.error('Error initializing ticket metadata:', error);
    res.status(500).json({ 
      error: 'Failed to initialize ticket metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get all ticket metadata for current tenant
 */
router.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [configurations, options, styles] = await Promise.all([
      db.select().from(ticketFieldConfigurations).where(eq(ticketFieldConfigurations.tenantId, tenantId)),
      db.select().from(ticketFieldOptions).where(eq(ticketFieldOptions.tenantId, tenantId)),
      db.select().from(ticketStyleConfigurations).where(eq(ticketStyleConfigurations.tenantId, tenantId)),
    ]);

    res.json({
      configurations,
      options,
      styles,
    });
  } catch (error) {
    console.error('Error fetching ticket metadata:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ticket metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;