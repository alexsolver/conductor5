// ✅ 1QA.MD COMPLIANCE: APPLICATION DTO - DATA TRANSFER OBJECTS
// Application Layer - Input/Output validation and transformation

import { z } from 'zod';

// Create Dashboard DTO Schema
export const createDashboardDTOSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required').max(255, 'Dashboard name too long'),
  description: z.string().optional(),
  layoutType: z.enum(['grid', 'flex', 'custom', 'responsive', 'mobile_first']).default('grid'),
  layoutConfig: z.record(z.any()).default({}),
  themeConfig: z.record(z.any()).default({}),
  styleConfig: z.record(z.any()).default({}),
  isPublic: z.boolean().default(false),
  accessLevel: z.enum(['view_only', 'edit', 'admin', 'public', 'restricted']).default('view_only'),
  allowedRoles: z.array(z.string()).default([]),
  allowedUsers: z.array(z.string()).default([]),
  isRealTime: z.boolean().default(false),
  refreshInterval: z.number().min(10).default(300), // Minimum 10 seconds
  autoRefresh: z.boolean().default(true),
  mobileConfig: z.record(z.any()).default({}),
  tabletConfig: z.record(z.any()).default({}),
  desktopConfig: z.record(z.any()).default({}),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({})
});

export type CreateDashboardDTO = z.infer<typeof createDashboardDTOSchema>;

// Update Dashboard DTO Schema
export const updateDashboardDTOSchema = createDashboardDTOSchema.partial().extend({
  id: z.string().uuid(),
  version: z.number().optional(),
  shareToken: z.string().optional(),
  shareExpiresAt: z.string().datetime().optional()
});

export type UpdateDashboardDTO = z.infer<typeof updateDashboardDTOSchema>;

// Dashboard Widget Position Schema
export const widgetPositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1),
  height: z.number().min(1)
});

// Create Dashboard Widget DTO Schema
export const createDashboardWidgetDTOSchema = z.object({
  dashboardId: z.string().uuid(),
  name: z.string().min(1, 'Widget name is required').max(255, 'Widget name too long'),
  type: z.enum(['chart', 'table', 'metric', 'gauge', 'text', 'image', 'map', 'custom']),
  reportId: z.string().uuid().optional(),
  position: widgetPositionSchema,
  gridPosition: z.record(z.any()).default({}),
  zIndex: z.number().default(1),
  config: z.record(z.any()).default({}),
  dataConfig: z.record(z.any()).default({}),
  styleConfig: z.record(z.any()).default({}),
  interactionConfig: z.record(z.any()).default({}),
  query: z.string().optional(),
  cacheConfig: z.record(z.any()).default({}),
  refreshInterval: z.number().min(10).default(300),
  isRealTime: z.boolean().default(false),
  mobileConfig: z.record(z.any()).default({}),
  tabletConfig: z.record(z.any()).default({}),
  isVisible: z.boolean().default(true),
  isInteractive: z.boolean().default(true)
});

export type CreateDashboardWidgetDTO = z.infer<typeof createDashboardWidgetDTOSchema>;

// Update Dashboard Widget DTO Schema
export const updateDashboardWidgetDTOSchema = createDashboardWidgetDTOSchema.partial().extend({
  id: z.string().uuid()
});

export type UpdateDashboardWidgetDTO = z.infer<typeof updateDashboardWidgetDTOSchema>;

// Dashboard Query Parameters DTO
export const dashboardQueryDTOSchema = z.object({
  tenantId: z.string().uuid(),
  status: z.enum(['draft', 'active', 'archived', 'error', 'processing', 'completed']).optional(),
  layoutType: z.enum(['grid', 'flex', 'custom', 'responsive', 'mobile_first']).optional(),
  ownerId: z.string().uuid().optional(),
  isPublic: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  updatedFrom: z.string().datetime().optional(),
  updatedTo: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'viewCount', 'lastViewedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type DashboardQueryDTO = z.infer<typeof dashboardQueryDTOSchema>;

// Dashboard Widget Query Parameters DTO
export const dashboardWidgetQueryDTOSchema = z.object({
  tenantId: z.string().uuid(),
  dashboardId: z.string().uuid().optional(),
  type: z.enum(['chart', 'table', 'metric', 'gauge', 'text', 'image', 'map', 'custom']).optional(),
  reportId: z.string().uuid().optional(),
  isVisible: z.boolean().optional(),
  isInteractive: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

export type DashboardWidgetQueryDTO = z.infer<typeof dashboardWidgetQueryDTOSchema>;

// Dashboard Share DTO Schema
export const dashboardShareDTOSchema = z.object({
  dashboardId: z.string().uuid(),
  shareType: z.enum(['public', 'private', 'internal']).default('private'),
  accessLevel: z.enum(['view_only', 'edit', 'admin', 'public', 'restricted']).default('view_only'),
  requiresLogin: z.boolean().default(false),
  allowedUsers: z.array(z.string().uuid()).default([]),
  allowedRoles: z.array(z.string()).default([]),
  allowedDomains: z.array(z.string()).default([]),
  password: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  maxViews: z.number().min(1).optional(),
  maxDownloads: z.number().min(1).optional(),
  canDownload: z.boolean().default(true),
  canPrint: z.boolean().default(true),
  canShare: z.boolean().default(false),
  canComment: z.boolean().default(false)
});

export type DashboardShareDTO = z.infer<typeof dashboardShareDTOSchema>;

// Dashboard Response DTO
export const dashboardResponseDTOSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  layoutType: z.enum(['grid', 'flex', 'custom', 'responsive', 'mobile_first']),
  status: z.enum(['draft', 'active', 'archived', 'error', 'processing', 'completed']),
  ownerId: z.string().uuid(),
  isPublic: z.boolean(),
  accessLevel: z.enum(['view_only', 'edit', 'admin', 'public', 'restricted']),
  shareToken: z.string().optional(),
  shareExpiresAt: z.string().datetime().optional(),
  isRealTime: z.boolean(),
  refreshInterval: z.number(),
  autoRefresh: z.boolean(),
  isFavorite: z.boolean(),
  viewCount: z.number(),
  lastViewedAt: z.string().datetime().optional(),
  tags: z.array(z.string()),
  version: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid().optional(),
  // Computed fields
  canModify: z.boolean().optional(),
  canShare: z.boolean().optional(),
  widgetCount: z.number().optional(),
  shareUrl: z.string().optional()
});

export type DashboardResponseDTO = z.infer<typeof dashboardResponseDTOSchema>;

// Dashboard Widget Response DTO
export const dashboardWidgetResponseDTOSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  dashboardId: z.string().uuid(),
  name: z.string(),
  type: z.enum(['chart', 'table', 'metric', 'gauge', 'text', 'image', 'map', 'custom']),
  reportId: z.string().uuid().optional(),
  position: widgetPositionSchema,
  gridPosition: z.record(z.any()),
  zIndex: z.number(),
  config: z.record(z.any()),
  dataConfig: z.record(z.any()),
  styleConfig: z.record(z.any()),
  interactionConfig: z.record(z.any()),
  query: z.string().optional(),
  refreshInterval: z.number(),
  isRealTime: z.boolean(),
  isVisible: z.boolean(),
  isInteractive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Computed fields
  hasData: z.boolean().optional(),
  lastDataUpdate: z.string().datetime().optional()
});

export type DashboardWidgetResponseDTO = z.infer<typeof dashboardWidgetResponseDTOSchema>;

// Bulk Widget Position Update DTO
export const bulkWidgetPositionUpdateDTOSchema = z.object({
  dashboardId: z.string().uuid(),
  widgets: z.array(z.object({
    id: z.string().uuid(),
    position: widgetPositionSchema,
    zIndex: z.number().optional()
  }))
});

export type BulkWidgetPositionUpdateDTO = z.infer<typeof bulkWidgetPositionUpdateDTOSchema>;