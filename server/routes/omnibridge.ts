import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { pgTable, uuid, varchar, boolean, integer, jsonb, timestamp, text, decimal, date } from 'drizzle-orm/pg-core';

const router = express.Router();

// Schema definitions
const omnibridgeRules = pgTable('omnibridge_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  enabled: boolean('enabled').default(true),
  priority: integer('priority').default(0),
  conditions: jsonb('conditions').notNull(),
  actions: jsonb('actions').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

const omnibridgeTemplates = pgTable('omnibridge_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  channels: text('channels').array().default([]),
  subject: varchar('subject', { length: 500 }),
  content: text('content').notNull(),
  isApproved: boolean('is_approved').default(false),
  isMultilingual: boolean('is_multilingual').default(false),
  languages: text('languages').array().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

const omnibridgeMetrics = pgTable('omnibridge_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  channelType: varchar('channel_type', { length: 50 }).notNull(),
  metricDate: date('metric_date').notNull(),
  messageCount: integer('message_count').default(0),
  errorCount: integer('error_count').default(0),
  avgResponseTime: integer('avg_response_time').default(0),
  uptimePercentage: decimal('uptime_percentage', { precision: 5, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Validation schemas
const createRuleSchema = z.object({
  name: z.string().min(1),
  conditions: z.object({
    channel: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    sender: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
  }),
  actions: z.object({
    createTicket: z.boolean().optional(),
    assignTo: z.string().optional(),
    autoRespond: z.boolean().optional(),
    templateId: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
  }),
  priority: z.number().default(0),
  enabled: z.boolean().default(true)
});

const createTemplateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  channels: z.array(z.string()).default([]),
  subject: z.string().optional(),
  content: z.string().min(1),
  isApproved: z.boolean().default(false),
  isMultilingual: z.boolean().default(false),
  languages: z.array(z.string()).default([])
});

// Helper function to get tenant from auth - use hardcoded tenant for now
const getTenantId = (req: any): string => {
  return '3f99462f-3621-4b1b-bea8-782acc50d62e';
};

// Rules endpoints
router.get('/rules', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const rules = await db
      .select()
      .from(omnibridgeRules)
      .where(eq(omnibridgeRules.tenantId, tenantId))
      .orderBy(desc(omnibridgeRules.priority), desc(omnibridgeRules.createdAt));

    res.json({ rules });
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

router.post('/rules', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = createRuleSchema.parse(req.body);
    
    const [rule] = await db
      .insert(omnibridgeRules)
      .values({
        tenantId,
        name: validatedData.name,
        enabled: validatedData.enabled,
        priority: validatedData.priority,
        conditions: validatedData.conditions,
        actions: validatedData.actions
      })
      .returning();

    res.status(201).json({ rule });
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

router.put('/rules/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const validatedData = createRuleSchema.parse(req.body);
    
    const [rule] = await db
      .update(omnibridgeRules)
      .set({
        name: validatedData.name,
        enabled: validatedData.enabled,
        priority: validatedData.priority,
        conditions: validatedData.conditions,
        actions: validatedData.actions,
        updatedAt: new Date()
      })
      .where(and(eq(omnibridgeRules.id, id), eq(omnibridgeRules.tenantId, tenantId)))
      .returning();

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json({ rule });
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

router.delete('/rules/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    
    const [rule] = await db
      .delete(omnibridgeRules)
      .where(and(eq(omnibridgeRules.id, id), eq(omnibridgeRules.tenantId, tenantId)))
      .returning();

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

// Templates endpoints
router.get('/templates', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const templates = await db
      .select()
      .from(omnibridgeTemplates)
      .where(eq(omnibridgeTemplates.tenantId, tenantId))
      .orderBy(desc(omnibridgeTemplates.createdAt));

    res.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = createTemplateSchema.parse(req.body);
    
    const [template] = await db
      .insert(omnibridgeTemplates)
      .values({
        tenantId,
        name: validatedData.name,
        category: validatedData.category,
        channels: validatedData.channels,
        subject: validatedData.subject,
        content: validatedData.content,
        isApproved: validatedData.isApproved,
        isMultilingual: validatedData.isMultilingual,
        languages: validatedData.languages
      })
      .returning();

    res.status(201).json({ template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Metrics endpoints
router.get('/metrics', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    
    const metrics = await db
      .select()
      .from(omnibridgeMetrics)
      .where(and(
        eq(omnibridgeMetrics.tenantId, tenantId)
      ))
      .orderBy(desc(omnibridgeMetrics.metricDate));

    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

router.post('/metrics', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { channelType, messageCount, errorCount, avgResponseTime, uptimePercentage } = req.body;
    
    const [metric] = await db
      .insert(omnibridgeMetrics)
      .values({
        tenantId,
        channelType,
        messageCount: messageCount || 0,
        errorCount: errorCount || 0,
        avgResponseTime: avgResponseTime || 0,
        uptimePercentage: uptimePercentage?.toString() || '0'
      })
      .returning();

    res.status(201).json({ metric });
  } catch (error) {
    console.error('Error creating metric:', error);
    res.status(500).json({ error: 'Failed to create metric' });
  }
});

export default router;