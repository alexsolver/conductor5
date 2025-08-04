
import { pgTable, uuid, varchar, decimal, timestamp, boolean, text, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// CONSUMO DE MATERIAIS E SERVIÇOS POR TICKET
export const ticketMaterials = pgTable('ticket_materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  ticketId: uuid('ticket_id').notNull(),
  
  // Referência ao item do módulo materiais-serviços
  itemId: uuid('item_id'), // FK para items table
  serviceTypeId: uuid('service_type_id'), // FK para service_types table
  
  // Tipo de registro
  recordType: varchar('record_type', { length: 20 }).notNull(), // 'planned' | 'consumed'
  
  // Identificação do item
  itemType: varchar('item_type', { length: 10 }).notNull(), // 'material' | 'service'
  itemName: varchar('item_name', { length: 255 }).notNull(),
  itemCode: varchar('item_code', { length: 100 }),
  
  // Quantidades
  plannedQuantity: decimal('planned_quantity', { precision: 10, scale: 2 }).default('0'),
  consumedQuantity: decimal('consumed_quantity', { precision: 10, scale: 2 }).default('0'),
  unitOfMeasure: varchar('unit_of_measure', { length: 10 }).default('UN'),
  
  // Preços (baseados na LPU vigente)
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  totalPlannedCost: decimal('total_planned_cost', { precision: 12, scale: 2 }).default('0'),
  totalConsumedCost: decimal('total_consumed_cost', { precision: 12, scale: 2 }).default('0'),
  
  // Lista de preços aplicada
  priceListId: uuid('price_list_id'),
  priceListVersion: varchar('price_list_version', { length: 20 }),
  
  // Detalhes do consumo
  consumptionNotes: text('consumption_notes'),
  consumedBy: uuid('consumed_by'), // Técnico que registrou o consumo
  consumedAt: timestamp('consumed_at'),
  
  // Aprovações
  isApproved: boolean('is_approved').default(false),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  
  // Audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: uuid('updated_by')
});

// RESUMO DE CUSTOS POR TICKET (view materializada para performance)
export const ticketCostSummary = pgTable('ticket_cost_summary', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  ticketId: uuid('ticket_id').notNull(),
  
  // Custos planejados
  totalPlannedMaterialsCost: decimal('total_planned_materials_cost', { precision: 15, scale: 2 }).default('0'),
  totalPlannedServicesCost: decimal('total_planned_services_cost', { precision: 15, scale: 2 }).default('0'),
  totalPlannedCost: decimal('total_planned_cost', { precision: 15, scale: 2 }).default('0'),
  
  // Custos reais
  totalConsumedMaterialsCost: decimal('total_consumed_materials_cost', { precision: 15, scale: 2 }).default('0'),
  totalConsumedServicesCost: decimal('total_consumed_services_cost', { precision: 15, scale: 2 }).default('0'),
  totalConsumedCost: decimal('total_consumed_cost', { precision: 15, scale: 2 }).default('0'),
  
  // Análise de variação
  costVariance: decimal('cost_variance', { precision: 15, scale: 2 }).default('0'), // Real - Planejado
  costVariancePercentage: decimal('cost_variance_percentage', { precision: 5, scale: 2 }).default('0'),
  
  // Contadores
  totalItems: integer('total_items').default(0),
  itemsWithConsumption: integer('items_with_consumption').default(0),
  
  // Status
  hasPlannedItems: boolean('has_planned_items').default(false),
  hasConsumedItems: boolean('has_consumed_items').default(false),
  isFullyConsumed: boolean('is_fully_consumed').default(false), // Todos os itens têm consumo registrado
  
  // Timestamps
  lastPlannedAt: timestamp('last_planned_at'),
  lastConsumedAt: timestamp('last_consumed_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// HISTÓRICO DE ALTERAÇÕES DE MATERIAIS
export const ticketMaterialsHistory = pgTable('ticket_materials_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  ticketMaterialId: uuid('ticket_material_id').notNull(),
  
  action: varchar('action', { length: 20 }).notNull(), // 'planned', 'consumed', 'updated', 'approved', 'rejected'
  field: varchar('field', { length: 50 }), // Campo alterado
  oldValue: text('old_value'),
  newValue: text('new_value'),
  
  reason: text('reason'),
  performedBy: uuid('performed_by').notNull(),
  performedAt: timestamp('performed_at').defaultNow().notNull()
});

// Relations
export const ticketMaterialsRelations = relations(ticketMaterials, ({ one, many }) => ({
  costSummary: one(ticketCostSummary, {
    fields: [ticketMaterials.ticketId],
    references: [ticketCostSummary.ticketId]
  }),
  history: many(ticketMaterialsHistory)
}));

export const ticketCostSummaryRelations = relations(ticketCostSummary, ({ many }) => ({
  materials: many(ticketMaterials)
}));

// Types
export type TicketMaterial = typeof ticketMaterials.$inferSelect;
export type InsertTicketMaterial = typeof ticketMaterials.$inferInsert;
export type TicketCostSummary = typeof ticketCostSummary.$inferSelect;
export type InsertTicketCostSummary = typeof ticketCostSummary.$inferInsert;
export type TicketMaterialHistory = typeof ticketMaterialsHistory.$inferSelect;
export type InsertTicketMaterialHistory = typeof ticketMaterialsHistory.$inferInsert;
