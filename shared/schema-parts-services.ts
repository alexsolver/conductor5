import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums específicos do módulo
export const itemTypeEnum = pgEnum('item_type', ['material', 'service']);
export const measurementUnitEnum = pgEnum('measurement_unit', ['UN', 'M', 'M2', 'M3', 'KG', 'L', 'H', 'PC', 'CX', 'GL', 'SET']);
export const movementTypeEnum = pgEnum('movement_type', ['entrada', 'saida', 'transferencia', 'ajuste', 'devolucao']);
export const linkTypeEnum = pgEnum('link_type', ['item_item', 'item_cliente', 'item_fornecedor']);

// TABELA PRINCIPAL DE ITENS
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // Campos obrigatórios conforme requisitos
  active: boolean('active').default(true).notNull(),
  type: itemTypeEnum('type').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  integrationCode: varchar('integration_code', { length: 100 }),
  description: text('description'),
  measurementUnit: measurementUnitEnum('measurement_unit').default('UN'),
  maintenancePlan: text('maintenance_plan'),
  group: varchar('group', { length: 100 }),
  defaultChecklist: jsonb('default_checklist'),

  // Metadados
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

// ANEXOS DE ITENS
export const itemAttachments = pgTable('item_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull(),

  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

// VÍNCULOS DE ITENS
export const itemLinks = pgTable('item_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  linkType: linkTypeEnum('link_type').notNull(),
  parentItemId: uuid('parent_item_id').notNull(),

  // Para vínculos item-item
  linkedItemId: uuid('linked_item_id'),

  // Para vínculos item-cliente
  customerId: uuid('customer_id'),
  customerAlias: varchar('customer_alias', { length: 255 }),
  customerSku: varchar('customer_sku', { length: 100 }),
  customerBarcode: varchar('customer_barcode', { length: 100 }),
  customerQrCode: varchar('customer_qr_code', { length: 255 }),
  isAsset: boolean('is_asset').default(false),

  // Para vínculos item-fornecedor
  supplierId: uuid('supplier_id'),
  partNumber: varchar('part_number', { length: 100 }),
  supplierDescription: text('supplier_description'),
  supplierQrCode: varchar('supplier_qr_code', { length: 255 }),
  supplierBarcode: varchar('supplier_barcode', { length: 100 }),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// FORNECEDORES
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  supplierCode: varchar('supplier_code', { length: 50 }),
  documentNumber: varchar('document_number', { length: 20 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),

  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// LOCALIZAÇÕES DE ESTOQUE
export const stockLocations = pgTable('stock_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  description: text('description'),
  address: text('address'),
  coordinates: jsonb('coordinates').default('{}'),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// NÍVEIS DE ESTOQUE
export const stockLevels = pgTable('stock_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull(),
  locationId: uuid('location_id').notNull(),

  currentQuantity: decimal('current_quantity', { precision: 10, scale: 2 }).default('0'),
  minimumStock: decimal('minimum_stock', { precision: 10, scale: 2 }).default('0'),
  maximumStock: decimal('maximum_stock', { precision: 10, scale: 2 }),
  reorderPoint: decimal('reorder_point', { precision: 10, scale: 2 }),

  averageCost: decimal('average_cost', { precision: 12, scale: 2 }),
  lastCost: decimal('last_cost', { precision: 12, scale: 2 }),
  totalValue: decimal('total_value', { precision: 12, scale: 2 }),

  lastMovementDate: timestamp('last_movement_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// MOVIMENTAÇÕES DE ESTOQUE
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  itemId: uuid('item_id').notNull(),
  locationId: uuid('location_id').notNull(),
  fromLocationId: uuid('from_location_id'),
  toLocationId: uuid('to_location_id'),

  movementType: movementTypeEnum('movement_type').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unitCost: decimal('unit_cost', { precision: 12, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 12, scale: 2 }),

  referenceType: varchar('reference_type', { length: 20 }),
  referenceId: uuid('reference_id'),
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull()
});

// RELATIONS
export const itemsRelations = relations(items, ({ many }) => ({
  attachments: many(itemAttachments),
  links: many(itemLinks),
  stockLevels: many(stockLevels),
  movements: many(stockMovements)
}));

export const itemAttachmentsRelations = relations(itemAttachments, ({ one }) => ({
  item: one(items, {
    fields: [itemAttachments.itemId],
    references: [items.id]
  })
}));

export const itemLinksRelations = relations(itemLinks, ({ one }) => ({
  parentItem: one(items, {
    fields: [itemLinks.parentItemId],
    references: [items.id]
  }),
  linkedItem: one(items, {
    fields: [itemLinks.linkedItemId],
    references: [items.id]
  }),
  supplier: one(suppliers, {
    fields: [itemLinks.supplierId],
    references: [suppliers.id]
  })
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  itemLinks: many(itemLinks)
}));

export const stockLocationsRelations = relations(stockLocations, ({ many }) => ({
  stockLevels: many(stockLevels),
  movements: many(stockMovements)
}));

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
  item: one(items, {
    fields: [stockLevels.itemId],
    references: [items.id]
  }),
  location: one(stockLocations, {
    fields: [stockLevels.locationId],
    references: [stockLocations.id]
  })
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  item: one(items, {
    fields: [stockMovements.itemId],
    references: [items.id]
  }),
  location: one(stockLocations, {
    fields: [stockMovements.locationId],
    references: [stockLocations.id]
  })
}));

// TYPES para TypeScript
export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
export type ItemAttachment = typeof itemAttachments.$inferSelect;
export type InsertItemAttachment = typeof itemAttachments.$inferInsert;
export type ItemLink = typeof itemLinks.$inferSelect;
export type InsertItemLink = typeof itemLinks.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;
export type StockLocation = typeof stockLocations.$inferSelect;
export type InsertStockLocation = typeof stockLocations.$inferInsert;
export type StockLevel = typeof stockLevels.$inferSelect;
export type InsertStockLevel = typeof stockLevels.$inferInsert;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = typeof stockMovements.$inferInsert;