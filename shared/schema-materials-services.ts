import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums específicos do módulo Materiais e Serviços
export const itemTypeEnum = pgEnum('item_type', ['material', 'service', 'asset']);
export const measurementUnitEnum = pgEnum('measurement_unit', ['UN', 'M', 'M2', 'M3', 'KG', 'L', 'H', 'PC', 'CX', 'GL', 'SET']);
export const itemStatusEnum = pgEnum('item_status', ['active', 'under_review', 'discontinued']);
export const movementTypeEnum = pgEnum('movement_type', ['entry', 'exit', 'transfer', 'adjustment', 'return', 'inventory']);
export const assetStatusEnum = pgEnum('asset_status', ['active', 'inactive', 'maintenance', 'disposed']);
export const linkTypeEnum = pgEnum('link_type', ['item_item', 'item_customer', 'item_supplier']);

// 1. CATÁLOGO E CADASTRO DE ITENS
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // Campos básicos
  active: boolean('active').default(true).notNull(),
  type: itemTypeEnum('type').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  integrationCode: varchar('integration_code', { length: 100 }),
  description: text('description'),
  measurementUnit: measurementUnitEnum('measurement_unit').default('UN'),
  maintenancePlan: text('maintenance_plan'),
  category: varchar('category', { length: 100 }),
  defaultChecklist: jsonb('default_checklist'),
  status: itemStatusEnum('status').default('active'),

  // Metadados de auditoria
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

// Anexos de itens
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

// Vínculos de itens (kits, substitutos, equivalências)
export const itemLinks = pgTable('item_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  linkType: linkTypeEnum('link_type').notNull(),
  parentItemId: uuid('parent_item_id').notNull(),

  // Para vínculos item-item
  linkedItemId: uuid('linked_item_id'),
  relationship: varchar('relationship', { length: 50 }), // kit, substitute, equivalent

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
  createdBy: uuid('created_by')
});

// 2. GESTÃO DE ESTOQUE
export const stockLocations = pgTable('stock_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // fixed, mobile, consigned
  isActive: boolean('is_active').default(true),
  address: text('address'),
  coordinates: jsonb('coordinates'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const stockLevels = pgTable('stock_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull(),
  locationId: uuid('location_id').notNull(),

  currentStock: decimal('current_stock', { precision: 10, scale: 2 }).default('0'),
  minimumLevel: decimal('minimum_level', { precision: 10, scale: 2 }).default('0'),
  maximumLevel: decimal('maximum_level', { precision: 10, scale: 2 }).default('0'),
  reorderPoint: decimal('reorder_point', { precision: 10, scale: 2 }).default('0'),
  economicOrderQuantity: decimal('economic_order_quantity', { precision: 10, scale: 2 }).default('0'),

  // Rastreabilidade
  batchNumber: varchar('batch_number', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  expiryDate: timestamp('expiry_date'),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: uuid('updated_by')
});

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull(),
  locationId: uuid('location_id').notNull(),

  movementType: movementTypeEnum('movement_type').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }),

  // Referências
  referenceType: varchar('reference_type', { length: 50 }), // order, service, transfer
  referenceId: uuid('reference_id'),
  
  // Rastreabilidade
  batchNumber: varchar('batch_number', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull()
});

// 3. GESTÃO DE FORNECEDORES
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  tradeName: varchar('trade_name', { length: 255 }),
  documentNumber: varchar('document_number', { length: 20 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  
  // Endereço
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  country: varchar('country', { length: 50 }).default('Brasil'),

  // Performance
  performanceRating: decimal('performance_rating', { precision: 3, scale: 2 }),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

export const supplierCatalog = pgTable('supplier_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  supplierId: uuid('supplier_id').notNull(),
  itemId: uuid('item_id').notNull(),

  supplierItemCode: varchar('supplier_item_code', { length: 100 }),
  supplierDescription: text('supplier_description'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  leadTime: integer('lead_time'), // days
  minimumOrderQuantity: decimal('minimum_order_quantity', { precision: 10, scale: 2 }),

  isActive: boolean('is_active').default(true),
  validFrom: timestamp('valid_from').defaultNow(),
  validTo: timestamp('valid_to'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// 4. GESTÃO DE SERVIÇOS
export const serviceTypes = pgTable('service_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  estimatedDuration: integer('estimated_duration'), // minutes
  complexity: varchar('complexity', { length: 20 }), // low, medium, high, critical
  checklist: jsonb('checklist'),
  requiredItems: jsonb('required_items'),
  procedures: text('procedures'),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const serviceExecution = pgTable('service_execution', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  serviceTypeId: uuid('service_type_id').notNull(),
  assetId: uuid('asset_id'),

  executionDate: timestamp('execution_date').notNull(),
  actualDuration: integer('actual_duration'), // minutes
  technicianId: uuid('technician_id'),
  status: varchar('status', { length: 20 }).default('scheduled'), // scheduled, in_progress, completed, cancelled
  
  checklistResults: jsonb('checklist_results'),
  itemsUsed: jsonb('items_used'),
  notes: text('notes'),
  warrantyExpiry: timestamp('warranty_expiry'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

// 5. CONTROLE DE ATIVOS
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  serialNumber: varchar('serial_number', { length: 100 }),
  model: varchar('model', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 100 }),
  
  // Hierarquia
  parentAssetId: uuid('parent_asset_id'),
  assetLevel: varchar('asset_level', { length: 20 }), // machine, component, item
  
  // Status e localização
  status: assetStatusEnum('status').default('active'),
  currentLocationId: uuid('current_location_id'),
  coordinates: jsonb('coordinates'),
  
  // Ciclo de vida
  acquisitionDate: timestamp('acquisition_date'),
  acquisitionCost: decimal('acquisition_cost', { precision: 12, scale: 2 }),
  warrantyExpiry: timestamp('warranty_expiry'),
  
  // Medidores
  hourMeter: decimal('hour_meter', { precision: 10, scale: 2 }),
  kilometerMeter: decimal('kilometer_meter', { precision: 10, scale: 2 }),
  usageTime: integer('usage_time'), // total minutes of usage
  
  // QR/RFID
  qrCode: varchar('qr_code', { length: 255 }),
  rfidTag: varchar('rfid_tag', { length: 100 }),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

export const assetMovements = pgTable('asset_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  assetId: uuid('asset_id').notNull(),

  fromLocationId: uuid('from_location_id'),
  toLocationId: uuid('to_location_id').notNull(),
  movementDate: timestamp('movement_date').defaultNow().notNull(),
  reason: varchar('reason', { length: 100 }),
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull()
});

// 6. LISTA DE PREÇOS UNITÁRIOS (LPU)
export const priceLists = pgTable('price_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  
  // Aplicação
  customerId: uuid('customer_id'),
  contractId: uuid('contract_id'),
  costCenterId: uuid('cost_center_id'),
  
  // Vigência
  validFrom: timestamp('valid_from').notNull(),
  validTo: timestamp('valid_to'),
  isActive: boolean('is_active').default(true),
  
  // Configurações
  currency: varchar('currency', { length: 3 }).default('BRL'),
  automaticMargin: decimal('automatic_margin', { precision: 5, scale: 2 }),
  
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

export const priceListItems = pgTable('price_list_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  priceListId: uuid('price_list_id').notNull(),
  itemId: uuid('item_id'),
  serviceTypeId: uuid('service_type_id'),

  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  specialPrice: decimal('special_price', { precision: 10, scale: 2 }),
  
  // Descontos por escala
  scaleDiscounts: jsonb('scale_discounts'), // [{quantity: 100, discount: 5}, ...]
  
  // Para serviços
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  travelCost: decimal('travel_cost', { precision: 10, scale: 2 }),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// 7. COMPLIANCE E AUDITORIA
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  entityType: varchar('entity_type', { length: 50 }).notNull(), // item, stock, asset, etc
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 20 }).notNull(), // create, update, delete
  
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  changes: jsonb('changes'),
  
  userId: uuid('user_id').notNull(),
  userEmail: varchar('user_email', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const certifications = pgTable('certifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // quality, environmental, safety
  issuingBody: varchar('issuing_body', { length: 255 }),
  
  // Associações
  itemId: uuid('item_id'),
  supplierId: uuid('supplier_id'),
  assetId: uuid('asset_id'),
  
  issueDate: timestamp('issue_date'),
  expiryDate: timestamp('expiry_date'),
  certificateNumber: varchar('certificate_number', { length: 100 }),
  
  documentPath: varchar('document_path', { length: 500 }),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const itemsRelations = relations(items, ({ many }) => ({
  attachments: many(itemAttachments),
  links: many(itemLinks),
  stockLevels: many(stockLevels),
  movements: many(stockMovements)
}));

export const stockLocationsRelations = relations(stockLocations, ({ many }) => ({
  stockLevels: many(stockLevels),
  movements: many(stockMovements)
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  catalog: many(supplierCatalog),
  certifications: many(certifications)
}));

export const assetsRelations = relations(assets, ({ many, one }) => ({
  children: many(assets, { relationName: "assetHierarchy" }),
  parent: one(assets, { 
    fields: [assets.parentAssetId], 
    references: [assets.id],
    relationName: "assetHierarchy"
  }),
  movements: many(assetMovements),
  services: many(serviceExecution),
  certifications: many(certifications)
}));

export const priceListsRelations = relations(priceLists, ({ many }) => ({
  items: many(priceListItems)
}));

// Types para uso no frontend
export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;
export type StockLevel = typeof stockLevels.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type PriceList = typeof priceLists.$inferSelect;
export type ServiceType = typeof serviceTypes.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;