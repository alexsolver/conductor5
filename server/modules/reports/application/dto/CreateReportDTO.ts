// ✅ 1QA.MD COMPLIANCE: APPLICATION DTO - DATA TRANSFER OBJECTS
// Application Layer - Input/Output validation and transformation

import { z } from 'zod';

// Create Report DTO Schema
export const createReportDTOSchema = z.object({
  name: z.string().min(1, 'Report name is required').max(255, 'Report name too long'),
  description: z.string().optional(),
  type: z.enum(['standard', 'custom', 'dashboard', 'scheduled', 'real_time']).default('standard'),
  category: z.string().optional(),
  dataSource: z.string().min(1, 'Data source is required'),
  query: z.string().optional(),
  queryConfig: z.record(z.any()).default({}),
  filters: z.record(z.any()).default({}),
  parameters: z.record(z.any()).default({}),
  layoutConfig: z.record(z.any()).default({}),
  chartConfig: z.record(z.any()).default({}),
  formatConfig: z.record(z.any()).default({}),
  isPublic: z.boolean().default(false),
  accessLevel: z.enum(['view_only', 'edit', 'admin', 'public', 'restricted']).default('view_only'),
  allowedRoles: z.array(z.string()).default([]),
  allowedUsers: z.array(z.string()).default([]),
  cacheConfig: z.record(z.any()).default({}),
  cacheExpiry: z.number().min(60).default(300), // Minimum 1 minute
  exportFormats: z.array(z.string()).default(['pdf', 'excel', 'csv']),
  emailConfig: z.record(z.any()).default({}),
  deliveryConfig: z.record(z.any()).default({}),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  isTemplate: z.boolean().default(false),
  templateId: z.string().uuid().optional()
});

export type CreateReportDTO = z.infer<typeof createReportDTOSchema>;

// Update Report DTO Schema
export const updateReportDTOSchema = createReportDTOSchema.partial().extend({
  id: z.string().uuid(),
  version: z.number().optional()
});

export type UpdateReportDTO = z.infer<typeof updateReportDTOSchema>;

// Report Query Parameters DTO
export const reportQueryDTOSchema = z.object({
  tenantId: z.string().uuid(),
  status: z.enum(['draft', 'active', 'archived', 'error', 'processing', 'completed']).optional(),
  type: z.enum(['standard', 'custom', 'dashboard', 'scheduled', 'real_time']).optional(),
  category: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  isPublic: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  dataSource: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  updatedFrom: z.string().datetime().optional(),
  updatedTo: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'executionCount', 'lastExecutedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type ReportQueryDTO = z.infer<typeof reportQueryDTOSchema>;

// Execute Report DTO Schema
export const executeReportDTOSchema = z.object({
  reportId: z.string().uuid(),
  parameters: z.record(z.any()).default({}),
  filters: z.record(z.any()).default({}),
  outputFormat: z.enum(['json', 'pdf', 'excel', 'csv']).default('json'),
  dryRun: z.boolean().default(false),
  cacheOverride: z.boolean().default(false)
});

export type ExecuteReportDTO = z.infer<typeof executeReportDTOSchema>;

// Report Response DTO
export const reportResponseDTOSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['standard', 'custom', 'dashboard', 'scheduled', 'real_time']),
  status: z.enum(['draft', 'active', 'archived', 'error', 'processing', 'completed']),
  category: z.string().optional(),
  dataSource: z.string(),
  ownerId: z.string().uuid(),
  isPublic: z.boolean(),
  accessLevel: z.enum(['view_only', 'edit', 'admin', 'public', 'restricted']),
  lastExecutedAt: z.string().datetime().optional(),
  executionCount: z.number(),
  averageExecutionTime: z.number(),
  tags: z.array(z.string()),
  version: z.number(),
  isTemplate: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid().optional(),
  // Computed fields
  canExecute: z.boolean().optional(),
  canModify: z.boolean().optional(),
  nextScheduledRun: z.string().datetime().optional()
});

export type ReportResponseDTO = z.infer<typeof reportResponseDTOSchema>;