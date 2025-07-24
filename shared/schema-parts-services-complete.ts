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
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ==============================================
// TABELAS PRINCIPAIS - PEÇAS E SERVIÇOS COMPLETO
// ==============================================

// 1. ITENS (Materiais e Serviços) - CAMPOS COMPLETOS
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  // Campos obrigatórios conforme especificação
  active: boolean('active').default(true).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'Material' | 'Serviço'
  name: varchar('name', { length: 255 }).notNull(),
  integrationCode: varchar('integration_code', { length: 100 }), // NOVO
  description: text('description'),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }), // NOVO
  standardMaintenancePlan: varchar('standard_maintenance_plan', { length: 255 }), // NOVO
  group: varchar('group', { length: 100 }),
  standardChecklist: text('standard_checklist'), // NOVO
  // Campos financeiros
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }).default('0'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).default('0'),
  // Auditoria
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. ANEXOS DE ITENS (Upload de arquivos)
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

// 5. FORNECEDORES
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 100 }).notNull(),
  documentNumber: varchar('document_number', { length: 20 }),
  tradeName: varchar('trade_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. VÍNCULOS COM FORNECEDORES
export const itemSupplierLinks = pgTable('item_supplier_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  partNumber: varchar('part_number', { length: 100 }),
  supplierDescription: text('supplier_description'),
  supplierQrCode: varchar('supplier_qr_code', { length: 255 }),
  supplierBarcode: varchar('supplier_barcode', { length: 100 }),
  leadTimeDays: integer('lead_time_days'),
  minimumOrderQty: decimal('minimum_order_qty', { precision: 10, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==============================================
// CONTROLE DE ESTOQUE AVANÇADO
// ==============================================

// 7. LOCALIZAÇÕES DE ESTOQUE (Armazéns fixos e móveis)
export const stockLocations = pgTable('stock_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'fixed' | 'mobile'
  description: text('description'),
  responsiblePerson: varchar('responsible_person', { length: 255 }),
  address: text('address'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 8. NÍVEIS DE ESTOQUE (mínimo, máximo, ponto de reposição, lote econômico)
export const stockLevels = pgTable('stock_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => stockLocations.id, { onDelete: 'cascade' }),
  currentQuantity: decimal('current_quantity', { precision: 10, scale: 2 }).default('0'),
  minimumQuantity: decimal('minimum_quantity', { precision: 10, scale: 2 }).default('0'),
  maximumQuantity: decimal('maximum_quantity', { precision: 10, scale: 2 }).default('0'),
  reorderPoint: decimal('reorder_point', { precision: 10, scale: 2 }).default('0'),
  economicOrderQuantity: decimal('economic_order_quantity', { precision: 10, scale: 2 }).default('0'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// 9. MOVIMENTAÇÕES DE ESTOQUE (entrada, saída, transferências, devoluções)
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull().references(() => items.id),
  locationId: uuid('location_id').notNull().references(() => stockLocations.id),
  movementType: varchar('movement_type', { length: 20 }).notNull(), // 'in', 'out', 'transfer', 'return', 'adjustment'
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
  reference: varchar('reference', { length: 100 }), // Número da OS, PO, etc.
  referenceType: varchar('reference_type', { length: 50 }), // 'order', 'purchase', 'service', etc.
  notes: text('notes'),
  userId: uuid('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. RESERVAS DE ESTOQUE
export const stockReservations = pgTable('stock_reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull().references(() => items.id),
  locationId: uuid('location_id').notNull().references(() => stockLocations.id),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  reservationType: varchar('reservation_type', { length: 50 }).notNull(), // 'service', 'order', 'maintenance'
  referenceId: uuid('reference_id'), // ID da OS, contrato, etc.
  reservedAt: timestamp('reserved_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true),
  userId: uuid('user_id').notNull(),
});

// ==============================================
// KITS DE SERVIÇO E MANUTENÇÃO
// ==============================================

// 11. KITS DE SERVIÇO
export const serviceKits = pgTable('service_kits', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  maintenanceType: varchar('maintenance_type', { length: 50 }), // 'preventiva', 'corretiva', 'preditiva'
  equipmentModel: varchar('equipment_model', { length: 255 }),
  equipmentBrand: varchar('equipment_brand', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 12. ITENS DOS KITS
export const serviceKitItems = pgTable('service_kit_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  kitId: uuid('kit_id').notNull().references(() => serviceKits.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => items.id),
  quantity: decimal('quantity', { precision: 10, scale: 4 }).notNull(),
  isOptional: boolean('is_optional').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==============================================
// LISTAS DE PREÇOS ENTERPRISE
// ==============================================

// 13. LISTAS DE PREÇOS
export const priceLists = pgTable('price_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  description: text('description'),
  validFrom: timestamp('valid_from').notNull(),
  validTo: timestamp('valid_to').notNull(),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 14. ITENS DAS LISTAS DE PREÇOS
export const priceListItems = pgTable('price_list_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  priceListId: uuid('price_list_id').notNull().references(() => priceLists.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => items.id),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  margin: decimal('margin', { precision: 5, scale: 2 }), // Margem de lucro
  discountTiers: jsonb('discount_tiers').default('[]'), // Descontos por escala
  specialPrice: decimal('special_price', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==============================================
// CONTROLE DE ATIVOS AVANÇADO
// ==============================================

// 15. ATIVOS
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  assetNumber: varchar('asset_number', { length: 100 }).notNull(),
  category: varchar('category', { length: 100 }),
  brand: varchar('brand', { length: 100 }),
  model: varchar('model', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  // Hierarquia de ativos
  parentAssetId: uuid('parent_asset_id').references(() => assets.id),
  hierarchyLevel: integer('hierarchy_level').default(0), // 0=máquina, 1=componente, 2=peça
  // Localização e rastreamento
  currentLocationId: uuid('current_location_id').references(() => stockLocations.id),
  qrCode: varchar('qr_code', { length: 255 }),
  rfidTag: varchar('rfid_tag', { length: 100 }),
  // Valores e depreciação
  acquisitionDate: timestamp('acquisition_date'),
  acquisitionValue: decimal('acquisition_value', { precision: 12, scale: 2 }),
  currentValue: decimal('current_value', { precision: 12, scale: 2 }),
  depreciationRate: decimal('depreciation_rate', { precision: 5, scale: 2 }),
  // Medidores e ciclo de vida
  operationalHours: decimal('operational_hours', { precision: 10, scale: 2 }).default('0'),
  mileage: decimal('mileage', { precision: 10, scale: 2 }).default('0'),
  cycleCount: integer('cycle_count').default(0),
  // Status e garantia
  status: varchar('status', { length: 20 }).default('active'), // 'active', 'maintenance', 'inactive', 'disposed'
  warrantyExpiration: timestamp('warranty_expiration'),
  contractId: uuid('contract_id'), // Vínculo com contratos
  // Auditoria
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 16. HISTÓRICO DE MOVIMENTAÇÃO DE ATIVOS
export const assetMovements = pgTable('asset_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  fromLocationId: uuid('from_location_id').references(() => stockLocations.id),
  toLocationId: uuid('to_location_id').references(() => stockLocations.id),
  movementType: varchar('movement_type', { length: 50 }).notNull(), // 'transfer', 'deployment', 'return'
  reason: text('reason'),
  authorizedBy: uuid('authorized_by').notNull(),
  movedAt: timestamp('moved_at').defaultNow().notNull(),
});

// 17. HISTÓRICO DE MANUTENÇÃO DE ATIVOS
export const assetMaintenanceHistory = pgTable('asset_maintenance_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  maintenanceType: varchar('maintenance_type', { length: 50 }).notNull(),
  serviceOrderId: uuid('service_order_id'), // Vínculo com OS
  kitId: uuid('kit_id').references(() => serviceKits.id),
  description: text('description'),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  downtimeHours: decimal('downtime_hours', { precision: 8, scale: 2 }),
  performedBy: uuid('performed_by').notNull(),
  performedAt: timestamp('performed_at').defaultNow().notNull(),
});

// ==============================================
// SCHEMAS ZOD PARA VALIDAÇÃO
// ==============================================

// Items
export const insertItemSchema = createInsertSchema(items, {
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['Material', 'Serviço']),
  unitCost: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
}).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
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

// Suppliers
export const insertSupplierSchema = createInsertSchema(suppliers, {
  name: z.string().min(1, 'Nome é obrigatório'),
  code: z.string().min(1, 'Código é obrigatório'),
}).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemSupplierLinkSchema = createInsertSchema(itemSupplierLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Stock
export const insertStockLocationSchema = createInsertSchema(stockLocations, {
  name: z.string().min(1, 'Nome é obrigatório'),
  code: z.string().min(1, 'Código é obrigatório'),
  type: z.enum(['fixed', 'mobile']),
}).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements, {
  movementType: z.enum(['in', 'out', 'transfer', 'return', 'adjustment']),
  quantity: z.coerce.number().min(0.01),
}).omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

export const insertStockReservationSchema = createInsertSchema(stockReservations).omit({
  id: true,
  tenantId: true,
  reservedAt: true,
});

// Service Kits
export const insertServiceKitSchema = createInsertSchema(serviceKits, {
  name: z.string().min(1, 'Nome é obrigatório'),
}).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceKitItemSchema = createInsertSchema(serviceKitItems, {
  quantity: z.coerce.number().min(0.01),
}).omit({
  id: true,
  createdAt: true,
});

// Price Lists
export const insertPriceListSchema = createInsertSchema(priceLists, {
  name: z.string().min(1, 'Nome é obrigatório'),
  version: z.string().min(1, 'Versão é obrigatória'),
}).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceListItemSchema = createInsertSchema(priceListItems, {
  unitPrice: z.coerce.number().min(0),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Assets
export const insertAssetSchema = createInsertSchema(assets, {
  name: z.string().min(1, 'Nome é obrigatório'),
  assetNumber: z.string().min(1, 'Número do ativo é obrigatório'),
}).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssetMovementSchema = createInsertSchema(assetMovements).omit({
  id: true,
  movedAt: true,
});

export const insertAssetMaintenanceHistorySchema = createInsertSchema(assetMaintenanceHistory).omit({
  id: true,
  performedAt: true,
});

// ==============================================
// TYPES PARA TYPESCRIPT
// ==============================================

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type ItemAttachment = typeof itemAttachments.$inferSelect;
export type ItemLink = typeof itemLinks.$inferSelect;
export type ItemCustomerLink = typeof itemCustomerLinks.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type ItemSupplierLink = typeof itemSupplierLinks.$inferSelect;
export type StockLocation = typeof stockLocations.$inferSelect;
export type StockLevel = typeof stockLevels.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type StockReservation = typeof stockReservations.$inferSelect;
export type ServiceKit = typeof serviceKits.$inferSelect;
export type ServiceKitItem = typeof serviceKitItems.$inferSelect;
export type PriceList = typeof priceLists.$inferSelect;
export type PriceListItem = typeof priceListItems.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type AssetMovement = typeof assetMovements.$inferSelect;
export type AssetMaintenanceHistory = typeof assetMaintenanceHistory.$inferSelect;