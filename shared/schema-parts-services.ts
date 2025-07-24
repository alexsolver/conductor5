
import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, integer, date, check } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// 1. ITENS
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  active: boolean('active').default(true),
  type: varchar('type', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  integrationCode: varchar('integration_code', { length: 100 }),
  description: text('description'),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }),
  defaultMaintenancePlan: text('default_maintenance_plan'),
  groupCategory: varchar('group_category', { length: 100 }),
  defaultChecklist: text('default_checklist'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdById: uuid('created_by_id')
});

// 2. ANEXOS DOS ITENS
export const itemAttachments = pgTable('item_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  fileType: varchar('file_type', { length: 100 }),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
  uploadedById: uuid('uploaded_by_id')
});

// 3. VÍNCULOS ENTRE ITENS
export const itemLinks = pgTable('item_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  parentItemId: uuid('parent_item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  linkedItemId: uuid('linked_item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  relationshipType: varchar('relationship_type', { length: 100 }).default('related'),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).default('1'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// 4. EMPRESAS CLIENTES
export const customerCompanies = pgTable('customer_companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  documentNumber: varchar('document_number', { length: 50 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  address: text('address'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// 5. VÍNCULOS ITEM-CLIENTE
export const itemCustomerLinks = pgTable('item_customer_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  customerCompanyId: uuid('customer_company_id').notNull().references(() => customerCompanies.id, { onDelete: 'cascade' }),
  nickname: varchar('nickname', { length: 255 }),
  sku: varchar('sku', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  qrCode: varchar('qr_code', { length: 100 }),
  isAsset: boolean('is_asset').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// 6. FORNECEDORES
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  documentNumber: varchar('document_number', { length: 50 }),
  supplierCode: varchar('supplier_code', { length: 100 }),
  tradeName: varchar('trade_name', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  address: text('address'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdById: uuid('created_by_id')
});

// 7. VÍNCULOS ITEM-FORNECEDOR
export const itemSupplierLinks = pgTable('item_supplier_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  partNumber: varchar('part_number', { length: 100 }),
  supplierDescription: text('supplier_description'),
  qrCode: varchar('qr_code', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  costPrice: decimal('cost_price', { precision: 15, scale: 2 }).default('0'),
  leadTimeDays: integer('lead_time_days').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// 8. LOCALIZAÇÕES DE ESTOQUE
export const stockLocations = pgTable('stock_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }),
  address: text('address'),
  responsiblePerson: varchar('responsible_person', { length: 255 }),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// 9. CONTROLE DE ESTOQUE
export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => stockLocations.id, { onDelete: 'cascade' }),
  currentQuantity: decimal('current_quantity', { precision: 10, scale: 3 }).default('0'),
  minimumStock: decimal('minimum_stock', { precision: 10, scale: 3 }).default('0'),
  maximumStock: decimal('maximum_stock', { precision: 10, scale: 3 }).default('0'),
  reorderPoint: decimal('reorder_point', { precision: 10, scale: 3 }).default('0'),
  economicLot: decimal('economic_lot', { precision: 10, scale: 3 }).default('0'),
  reservedQuantity: decimal('reserved_quantity', { precision: 10, scale: 3 }).default('0'),
  consignedQuantity: decimal('consigned_quantity', { precision: 10, scale: 3 }).default('0'),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow()
});

// 10. MOVIMENTAÇÕES DE ESTOQUE
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull().references(() => items.id),
  locationId: uuid('location_id').notNull().references(() => stockLocations.id),
  movementType: varchar('movement_type', { length: 50 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unitCost: decimal('unit_cost', { precision: 15, scale: 2 }).default('0'),
  totalCost: decimal('total_cost', { precision: 15, scale: 2 }).default('0'),
  referenceDocument: varchar('reference_document', { length: 100 }),
  notes: text('notes'),
  lotNumber: varchar('lot_number', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  expiryDate: date('expiry_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdById: uuid('created_by_id')
});

// 11. KITS DE SERVIÇO
export const serviceKits = pgTable('service_kits', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  maintenanceType: varchar('maintenance_type', { length: 100 }),
  description: text('description'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdById: uuid('created_by_id')
});

// 12. ITENS DOS KITS DE SERVIÇO
export const serviceKitItems = pgTable('service_kit_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  serviceKitId: uuid('service_kit_id').notNull().references(() => serviceKits.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull().default('1'),
  isOptional: boolean('is_optional').default(false)
});

// 13. LISTAS DE PREÇOS
export const priceLists = pgTable('price_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  version: varchar('version', { length: 50 }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  customerCompanyId: uuid('customer_company_id').references(() => customerCompanies.id),
  costCenter: varchar('cost_center', { length: 100 }),
  region: varchar('region', { length: 100 }),
  channel: varchar('channel', { length: 100 }),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdById: uuid('created_by_id')
});

// 14. ITENS DAS LISTAS DE PREÇOS
export const priceListItems = pgTable('price_list_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  priceListId: uuid('price_list_id').notNull().references(() => priceLists.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
  marginPercentage: decimal('margin_percentage', { precision: 5, scale: 2 }).default('0'),
  minQuantity: decimal('min_quantity', { precision: 10, scale: 3 }).default('1'),
  maxQuantity: decimal('max_quantity', { precision: 10, scale: 3 }),
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).default('0'),
  specialPrice: decimal('special_price', { precision: 15, scale: 2 }),
  validFrom: date('valid_from'),
  validUntil: date('valid_until')
});

// 15. CONTROLE DE ATIVOS
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').references(() => items.id),
  customerCompanyId: uuid('customer_company_id').references(() => customerCompanies.id),
  assetTag: varchar('asset_tag', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  parentAssetId: uuid('parent_asset_id').references(() => assets.id),
  hierarchyLevel: integer('hierarchy_level').default(1),
  serialNumber: varchar('serial_number', { length: 100 }),
  model: varchar('model', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 100 }),
  acquisitionDate: date('acquisition_date'),
  warrantyStart: date('warranty_start'),
  warrantyEnd: date('warranty_end'),
  locationDescription: text('location_description'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  qrCode: varchar('qr_code', { length: 100 }),
  rfidTag: varchar('rfid_tag', { length: 100 }),
  meterType: varchar('meter_type', { length: 50 }),
  currentMeterReading: decimal('current_meter_reading', { precision: 15, scale: 3 }).default('0'),
  status: varchar('status', { length: 50 }).default('Ativo'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// TIPOS TYPESCRIPT
export type InsertItem = typeof items.$inferInsert;
export type Item = typeof items.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertCustomerCompany = typeof customerCompanies.$inferInsert;
export type CustomerCompany = typeof customerCompanies.$inferSelect;
export type InsertStockLocation = typeof stockLocations.$inferInsert;
export type StockLocation = typeof stockLocations.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;
export type Inventory = typeof inventory.$inferSelect;
export type InsertStockMovement = typeof stockMovements.$inferInsert;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertServiceKit = typeof serviceKits.$inferInsert;
export type ServiceKit = typeof serviceKits.$inferSelect;
export type InsertPriceList = typeof priceLists.$inferInsert;
export type PriceList = typeof priceLists.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;
export type Asset = typeof assets.$inferSelect;

// SCHEMAS DE VALIDAÇÃO ZOD
export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
});

export const insertCustomerCompanySchema = createInsertSchema(customerCompanies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStockLocationSchema = createInsertSchema(stockLocations).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
  createdById: true,
});

export const insertServiceKitSchema = createInsertSchema(serviceKits).omit({
  id: true,
  createdAt: true,
  createdById: true,
});

export const insertPriceListSchema = createInsertSchema(priceLists).omit({
  id: true,
  createdAt: true,
  createdById: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
