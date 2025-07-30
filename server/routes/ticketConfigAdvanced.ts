
import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { db } from '../db';
import { 
  ticketFieldConfigurations,
  ticketFieldOptions,
  ticketDefaultConfigurations
} from '../@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// SLA Configurations endpoints
router.get('/sla-configurations', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    // Mock SLA configurations for now - implement actual table later
    const slaConfigs = [
      {
        id: '1',
        priority: 'critical',
        responseTimeHours: 1,
        resolutionTimeHours: 4,
        escalationTimeHours: 2,
        businessHoursOnly: false,
        notificationEnabled: true
      },
      {
        id: '2',
        priority: 'high',
        responseTimeHours: 2,
        resolutionTimeHours: 8,
        escalationTimeHours: 4,
        businessHoursOnly: true,
        notificationEnabled: true
      },
      {
        id: '3',
        priority: 'medium',
        responseTimeHours: 4,
        resolutionTimeHours: 24,
        escalationTimeHours: 12,
        businessHoursOnly: true,
        notificationEnabled: true
      },
      {
        id: '4',
        priority: 'low',
        responseTimeHours: 8,
        resolutionTimeHours: 72,
        escalationTimeHours: 24,
        businessHoursOnly: true,
        notificationEnabled: false
      }
    ];

    res.json(slaConfigs);
  } catch (error) {
    console.error('Error fetching SLA configurations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch SLA configurations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/sla-configurations', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const {
      priority,
      responseTimeHours,
      resolutionTimeHours,
      escalationTimeHours,
      businessHoursOnly,
      notificationEnabled
    } = req.body;

    // Validate required fields
    if (!priority || !responseTimeHours || !resolutionTimeHours || !escalationTimeHours) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Mock creation - implement actual table later
    const newSLAConfig = {
      id: Date.now().toString(),
      priority,
      responseTimeHours: parseInt(responseTimeHours),
      resolutionTimeHours: parseInt(resolutionTimeHours),
      escalationTimeHours: parseInt(escalationTimeHours),
      businessHoursOnly: businessHoursOnly || false,
      notificationEnabled: notificationEnabled || true,
      tenantId,
      createdAt: new Date().toISOString()
    };

    res.status(201).json(newSLAConfig);
  } catch (error) {
    console.error('Error creating SLA configuration:', error);
    res.status(500).json({ 
      error: 'Failed to create SLA configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Field options endpoints with fieldId parameter
router.post('/field-options/:fieldId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const fieldId = req.params.fieldId;
    
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const {
      optionValue,
      displayLabel,
      colorHex,
      sortOrder,
      isDefault,
      isActive,
      slaHours
    } = req.body;

    // Validate required fields
    if (!optionValue || !displayLabel) {
      return res.status(400).json({ message: 'Missing required fields: optionValue and displayLabel' });
    }

    // Create the field option
    const [createdOption] = await db
      .insert(ticketFieldOptions)
      .values({
        tenantId,
        fieldConfigId: fieldId,
        optionValue,
        displayLabel,
        colorHex: colorHex || '#3b82f6',
        sortOrder: sortOrder || 1,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
        slaHours: slaHours ? parseInt(slaHours) : null
      })
      .returning();

    res.status(201).json({
      success: true,
      data: createdOption,
      message: 'Field option created successfully'
    });
  } catch (error) {
    console.error('Error creating field option:', error);
    res.status(500).json({ 
      error: 'Failed to create field option',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update field configuration endpoint
router.put('/field-configurations/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const configId = req.params.id;
    
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const updateData = req.body;

    // Update the field configuration
    const [updatedConfig] = await db
      .update(ticketFieldConfigurations)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(ticketFieldConfigurations.id, configId),
          eq(ticketFieldConfigurations.tenantId, tenantId)
        )
      )
      .returning();

    if (!updatedConfig) {
      return res.status(404).json({ message: 'Field configuration not found' });
    }

    res.json({
      success: true,
      data: updatedConfig,
      message: 'Field configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating field configuration:', error);
    res.status(500).json({ 
      error: 'Failed to update field configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
