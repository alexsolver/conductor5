
import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, integer, index, foreignKey, unique, check } from 'drizzle-orm/pg-core';

// 1. TABELA DE CATEGORIAS DE ITENS
export const itemCategories = pgTable('item_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  parentCategoryId: uuid('parent_category_id'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}, (table) => ({
  tenantIdx: index('idx_item_categories_tenant_id').on(table.tenantId),
  parentIdx: index('idx_item_categories_parent_id').on(table.parentCategoryId),
  uniqueCategoryName: unique('unique_category_name_per_tenant').on(table.tenantId, table.name, table.parentCategoryId),
  parentFk: foreignKey({
    columns: [table.parentCategoryId],
    foreignColumns: [table.id],
  }),
}));

// 2. TABELA PRINCIPAL DE ITENS
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  active: boolean('active').notNull().default(true),
  type: varchar('type', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  integrationCode: varchar('integration_code', { length: 100 }),
  description: text('description'),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }),
  defaultMaintenancePlan: varchar('default_maintenance_plan', { length: 255 }),
  itemGroup: varchar('item_group', { length: 100 }),
  defaultChecklist: text('default_checklist'),
  categoryId: uuid('category_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}, (table) => ({
  tenantIdx: index('idx_items_tenant_id').on(table.tenantId),
  typeIdx: index('idx_items_type').on(table.type),
  activeIdx: index('idx_items_active').on(table.active),
  nameIdx: index('idx_items_name').on(table.name),
  integrationCodeIdx: index('idx_items_integration_code').on(table.integrationCode),
  categoryIdx: index('idx_items_category_id').on(table.categoryId),
  createdAtIdx: index('idx_items_created_at').on(table.createdAt),
  updatedAtIdx: index('idx_items_updated_at').on(table.updatedAt),
  uniqueIntegrationCode: unique('unique_integration_code_per_tenant').on(table.tenantId, table.integrationCode),
  typeCheck: check('type_check', table.type.inArray(['material', 'service'])),
  categoryFk: foreignKey({
    columns: [table.categoryId],
    foreignColumns: [itemCategories.id],
  }),
}));

// 3. TABELA DE ANEXOS DOS ITENS
export const itemAttachments = pgTable('item_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  description: text('description'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
  uploadedBy: uuid('uploaded_by'),
}, (table) => ({
  itemIdx: index('idx_item_attachments_item_id').on(table.itemId),
  tenantIdx: index('idx_item_attachments_tenant_id').on(table.tenantId),
  itemFk: foreignKey({
    columns: [table.itemId],
    foreignColumns: [items.id],
  }),
}));

// 4. TABELA DE VÍNCULOS ENTRE ITENS
export const itemLinks = pgTable('item_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  parentItemId: uuid('parent_item_id').notNull(),
  linkedItemId: uuid('linked_item_id').notNull(),
  linkType: varchar('link_type', { length: 50 }).notNull().default('related'),
  quantity: decimal('quantity', { precision: 10, scale: 3 }),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by'),
}, (table) => ({
  parentIdx: index('idx_item_links_parent_item').on(table.parentItemId),
  linkedIdx: index('idx_item_links_linked_item').on(table.linkedItemId),
  tenantIdx: index('idx_item_links_tenant_id').on(table.tenantId),
  uniqueLink: unique('unique_item_link').on(table.tenantId, table.parentItemId, table.linkedItemId, table.linkType),
  noSelfReference: check('no_self_reference', table.parentItemId.ne(table.linkedItemId)),
  parentFk: foreignKey({
    columns: [table.parentItemId],
    foreignColumns: [items.id],
  }),
  linkedFk: foreignKey({
    columns: [table.linkedItemId],
    foreignColumns: [items.id],
  }),
}));

// 5. TABELA DE VÍNCULOS COM EMPRESAS CLIENTES
export const itemCustomerLinks = pgTable('item_customer_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull(),
  customerId: uuid('customer_id').notNull(),
  nickname: varchar('nickname', { length: 255 }),
  sku: varchar('sku', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  qrCode: varchar('qr_code', { length: 255 }),
  isAsset: boolean('is_asset').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}, (table) => ({
  itemIdx: index('idx_item_customer_links_item_id').on(table.itemId),
  customerIdx: index('idx_item_customer_links_customer_id').on(table.customerId),
  tenantIdx: index('idx_item_customer_links_tenant_id').on(table.tenantId),
  skuIdx: index('idx_item_customer_links_sku').on(table.sku),
  barcodeIdx: index('idx_item_customer_links_barcode').on(table.barcode),
  uniqueItemCustomer: unique('unique_item_customer_link').on(table.tenantId, table.itemId, table.customerId),
  itemFk: foreignKey({
    columns: [table.itemId],
    foreignColumns: [items.id],
  }),
}));

// 6. TABELA DE VÍNCULOS COM FORNECEDORES
export const itemSupplierLinks = pgTable('item_supplier_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull(),
  supplierId: uuid('supplier_id').notNull(),
  partNumber: varchar('part_number', { length: 100 }),
  supplierDescription: text('supplier_description'),
  qrCode: varchar('qr_code', { length: 255 }),
  barcode: varchar('barcode', { length: 100 }),
  leadTimeDays: integer('lead_time_days'),
  minimumOrderQuantity: decimal('minimum_order_quantity', { precision: 10, scale: 3 }),
  unitPrice: decimal('unit_price', { precision: 12, scale: 4 }),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  isPreferred: boolean('is_preferred').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}, (table) => ({
  itemIdx: index('idx_item_supplier_links_item_id').on(table.itemId),
  supplierIdx: index('idx_item_supplier_links_supplier_id').on(table.supplierId),
  tenantIdx: index('idx_item_supplier_links_tenant_id').on(table.tenantId),
  partNumberIdx: index('idx_item_supplier_links_part_number').on(table.partNumber),
  barcodeIdx: index('idx_item_supplier_links_barcode').on(table.barcode),
  uniqueItemSupplier: unique('unique_item_supplier_link').on(table.tenantId, table.itemId, table.supplierId, table.partNumber),
  itemFk: foreignKey({
    columns: [table.itemId],
    foreignColumns: [items.id],
  }),
}));

// TIPOS TYPESCRIPT
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type ItemCategory = typeof itemCategories.$inferSelect;
export type NewItemCategory = typeof itemCategories.$inferInsert;
export type ItemAttachment = typeof itemAttachments.$inferSelect;
export type NewItemAttachment = typeof itemAttachments.$inferInsert;
export type ItemLink = typeof itemLinks.$inferSelect;
export type NewItemLink = typeof itemLinks.$inferInsert;
export type ItemCustomerLink = typeof itemCustomerLinks.$inferSelect;
export type NewItemCustomerLink = typeof itemCustomerLinks.$inferInsert;
export type ItemSupplierLink = typeof itemSupplierLinks.$inferSelect;
export type NewItemSupplierLink = typeof itemSupplierLinks.$inferInsert;

// ENUMS
export const ItemType = {
  MATERIAL: 'material',
  SERVICE: 'service',
} as const;

export const LinkType = {
  RELATED: 'related',
  COMPONENT: 'component',
  ALTERNATIVE: 'alternative',
  ACCESSORY: 'accessory',
} as const;
