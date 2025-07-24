import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  jsonb,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ==============================================
// TABELAS PRINCIPAIS - PEÇAS E SERVIÇOS
// ==============================================

// 1. ITENS (Materiais e Serviços)
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  active: boolean('active').default(true).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'Material' | 'Serviço'
  name: varchar('name', { length: 255 }).notNull(),
  integrationCode: varchar('integration_code', { length: 100 }),
  description: text('description'),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }),
  defaultMaintenancePlan: varchar('default_maintenance_plan', { length: 255 }),
  group: varchar('group', { length: 100 }),
  defaultChecklist: text('default_checklist'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. ANEXOS DE ITENS
export const itemAttachments = pgTable('item_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// 3. VÍNCULOS ENTRE ITENS
export const itemLinks = pgTable('item_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentItemId: uuid('parent_item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  childItemId: uuid('child_item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  linkType: varchar('link_type', { length: 50 }).default('related'),
  quantity: decimal('quantity', { precision: 10, scale: 4 }).default('1'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. VÍNCULOS COM EMPRESAS CLIENTES
export const itemCustomerLinks = pgTable('item_customer_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull(), // Referência ao módulo de clientes
  nickname: varchar('nickname', { length: 255 }),
  sku: varchar('sku', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  qrCode: varchar('qr_code', { length: 255 }),
  isAsset: boolean('is_asset').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==============================================
// FORNECEDORES (deve vir antes das referências)
// ==============================================

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  documentNumber: varchar('document_number', { length: 50 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('Brasil'),
  contactPerson: varchar('contact_person', { length: 255 }),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. VÍNCULOS COM FORNECEDORES
export const itemSupplierLinks = pgTable('item_supplier_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  partNumber: varchar('part_number', { length: 100 }),
  supplierDescription: text('supplier_description'),
  qrCode: varchar('qr_code', { length: 255 }),
  barcode: varchar('barcode', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==============================================
// CONTROLE DE ESTOQUE
// ==============================================

// 6. LOCALIZAÇÕES DE ESTOQUE
export const stockLocations = pgTable('stock_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  type: varchar('type', { length: 20 }).notNull(), // 'fixed' | 'mobile'
  description: text('description'),
  address: text('address'),
  responsiblePerson: varchar('responsible_person', { length: 255 }),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 7. NÍVEIS DE ESTOQUE
export const stockLevels = pgTable('stock_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => stockLocations.id, { onDelete: 'cascade' }),
  currentQuantity: decimal('current_quantity', { precision: 10, scale: 4 }).default('0').notNull(),
  minimumQuantity: decimal('minimum_quantity', { precision: 10, scale: 4 }).default('0'),
  maximumQuantity: decimal('maximum_quantity', { precision: 10, scale: 4 }),
  reorderPoint: decimal('reorder_point', { precision: 10, scale: 4 }),
  economicOrderQuantity: decimal('economic_order_quantity', { precision: 10, scale: 4 }),
  reservedQuantity: decimal('reserved_quantity', { precision: 10, scale: 4 }).default('0'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// 8. MOVIMENTAÇÕES DE ESTOQUE
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => stockLocations.id, { onDelete: 'cascade' }),
  movementType: varchar('movement_type', { length: 20 }).notNull(), // 'in' | 'out' | 'transfer' | 'adjustment'
  quantity: decimal('quantity', { precision: 10, scale: 4 }).notNull(),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
  reference: varchar('reference', { length: 255 }), // Referência a OS, compra, etc.
  referenceType: varchar('reference_type', { length: 50 }), // 'service_order' | 'purchase' | 'adjustment'
  batchNumber: varchar('batch_number', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  expirationDate: timestamp('expiration_date'),
  notes: text('notes'),
  userId: uuid('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==============================================
// KITS DE SERVIÇO
// ==============================================

// 9. KITS DE SERVIÇO
export const serviceKits = pgTable('service_kits', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  maintenanceType: varchar('maintenance_type', { length: 100 }),
  equipmentModel: varchar('equipment_model', { length: 255 }),
  equipmentBrand: varchar('equipment_brand', { length: 255 }),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 10. ITENS DOS KITS DE SERVIÇO
export const serviceKitItems = pgTable('service_kit_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  kitId: uuid('kit_id').notNull().references(() => serviceKits.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  quantity: decimal('quantity', { precision: 10, scale: 4 }).notNull(),
  isOptional: boolean('is_optional').default(false),
  notes: text('notes'),
});

// ==============================================
// LISTAS DE PREÇOS
// ==============================================

// 11. LISTAS DE PREÇOS
export const priceLists = pgTable('price_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  description: text('description'),
  customerId: uuid('customer_id'), // Opcional - para lista específica de cliente
  contractId: uuid('contract_id'), // Opcional - para lista específica de contrato
  validFrom: timestamp('valid_from').notNull(),
  validTo: timestamp('valid_to'),
  currency: varchar('currency', { length: 10 }).default('BRL'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 12. ITENS DA LISTA DE PREÇOS
export const priceListItems = pgTable('price_list_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  priceListId: uuid('price_list_id').notNull().references(() => priceLists.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  minimumQuantity: decimal('minimum_quantity', { precision: 10, scale: 4 }).default('1'),
  maximumDiscount: decimal('maximum_discount', { precision: 5, scale: 2 }).default('0'),
  notes: text('notes'),
});

// 13. HISTÓRICO DE PREÇOS
export const priceHistory = pgTable('price_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  priceListId: uuid('price_list_id').notNull().references(() => priceLists.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  oldPrice: decimal('old_price', { precision: 10, scale: 2 }),
  newPrice: decimal('new_price', { precision: 10, scale: 2 }).notNull(),
  changeReason: text('change_reason'),
  userId: uuid('user_id').notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
});

// ==============================================
// CONTROLE DE ATIVOS
// ==============================================

// 14. ATIVOS
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  assetNumber: varchar('asset_number', { length: 100 }),
  parentAssetId: uuid('parent_asset_id').references(() => assets.id),
  customerId: uuid('customer_id'), // Referência ao módulo de clientes
  locationId: uuid('location_id').references(() => stockLocations.id),
  category: varchar('category', { length: 100 }),
  brand: varchar('brand', { length: 100 }),
  model: varchar('model', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  acquisitionDate: timestamp('acquisition_date'),
  acquisitionValue: decimal('acquisition_value', { precision: 10, scale: 2 }),
  currentValue: decimal('current_value', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 50 }).default('active'), // 'active' | 'maintenance' | 'inactive' | 'disposed'
  operationalHours: decimal('operational_hours', { precision: 10, scale: 2 }).default('0'),
  kilometers: decimal('kilometers', { precision: 10, scale: 2 }).default('0'),
  nextMaintenanceDate: timestamp('next_maintenance_date'),
  warrantyExpiration: timestamp('warranty_expiration'),
  qrCode: varchar('qr_code', { length: 255 }),
  rfidTag: varchar('rfid_tag', { length: 100 }),
  notes: text('notes'),
  coordinates: jsonb('coordinates'), // Geolocalização {lat: number, lng: number}
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==============================================
// SCHEMAS ZOD PARA VALIDAÇÃO
// ==============================================

// Items
export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum(['Material', 'Serviço']),
});

export const insertItemAttachmentSchema = createInsertSchema(itemAttachments).omit({
  id: true,
  uploadedAt: true,
});

export const insertItemLinkSchema = createInsertSchema(itemLinks).omit({
  id: true,
  createdAt: true,
});

export const insertItemCustomerLinkSchema = createInsertSchema(itemCustomerLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemSupplierLinkSchema = createInsertSchema(itemSupplierLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Suppliers
export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Stock
export const insertStockLocationSchema = createInsertSchema(stockLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum(['fixed', 'mobile']),
});

export const insertStockLevelSchema = createInsertSchema(stockLevels).omit({
  id: true,
  lastUpdated: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
}).extend({
  movementType: z.enum(['in', 'out', 'transfer', 'adjustment']),
});

// Service Kits
export const insertServiceKitSchema = createInsertSchema(serviceKits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceKitItemSchema = createInsertSchema(serviceKitItems).omit({
  id: true,
});

// Price Lists
export const insertPriceListSchema = createInsertSchema(priceLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceListItemSchema = createInsertSchema(priceListItems).omit({
  id: true,
});

export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({
  id: true,
  changedAt: true,
});

// Assets
export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(['active', 'maintenance', 'inactive', 'disposed']).optional(),
});

// ==============================================
// TIPOS TYPESCRIPT
// ==============================================

export type Item = typeof items.$inferSelect;
export type NewItem = z.infer<typeof insertItemSchema>;

export type ItemAttachment = typeof itemAttachments.$inferSelect;
export type NewItemAttachment = z.infer<typeof insertItemAttachmentSchema>;

export type ItemLink = typeof itemLinks.$inferSelect;
export type NewItemLink = z.infer<typeof insertItemLinkSchema>;

export type ItemCustomerLink = typeof itemCustomerLinks.$inferSelect;
export type NewItemCustomerLink = z.infer<typeof insertItemCustomerLinkSchema>;

export type ItemSupplierLink = typeof itemSupplierLinks.$inferSelect;
export type NewItemSupplierLink = z.infer<typeof insertItemSupplierLinkSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = z.infer<typeof insertSupplierSchema>;

export type StockLocation = typeof stockLocations.$inferSelect;
export type NewStockLocation = z.infer<typeof insertStockLocationSchema>;

export type StockLevel = typeof stockLevels.$inferSelect;
export type NewStockLevel = z.infer<typeof insertStockLevelSchema>;

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = z.infer<typeof insertStockMovementSchema>;

export type ServiceKit = typeof serviceKits.$inferSelect;
export type NewServiceKit = z.infer<typeof insertServiceKitSchema>;

export type ServiceKitItem = typeof serviceKitItems.$inferSelect;
export type NewServiceKitItem = z.infer<typeof insertServiceKitItemSchema>;

export type PriceList = typeof priceLists.$inferSelect;
export type NewPriceList = z.infer<typeof insertPriceListSchema>;

export type PriceListItem = typeof priceListItems.$inferSelect;
export type NewPriceListItem = z.infer<typeof insertPriceListItemSchema>;

export type PriceHistory = typeof priceHistory.$inferSelect;
export type NewPriceHistory = z.infer<typeof insertPriceHistorySchema>;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = z.infer<typeof insertAssetSchema>;