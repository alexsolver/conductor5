
import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const itemTypeEnum = pgEnum('item_type', ['material', 'service']);
export const measurementUnitEnum = pgEnum('measurement_unit', ['UN', 'M', 'M2', 'M3', 'KG', 'L', 'H', 'PC', 'CX', 'GL', 'SET']);
export const movementTypeEnum = pgEnum('movement_type', ['entrada', 'saida', 'transferencia', 'ajuste', 'devolucao', 'inventario']);
export const assetStatusEnum = pgEnum('asset_status', ['ativo', 'inativo', 'manutencao', 'descartado']);
export const linkTypeEnum = pgEnum('link_type', ['item_item', 'item_cliente', 'item_fornecedor']);

// ================================
// ITENS (CORE)
// ================================
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Campos obrigatórios conforme requisitos
  active: boolean('active').default(true).notNull(),
  type: itemTypeEnum('type').notNull(), // Material/Serviço
  name: varchar('name', { length: 255 }).notNull(),
  integrationCode: varchar('integration_code', { length: 100 }),
  description: text('description'),
  measurementUnit: measurementUnitEnum('measurement_unit').default('UN'),
  maintenancePlan: text('maintenance_plan'),
  group: varchar('group', { length: 100 }),
  defaultChecklist: jsonb('default_checklist'), // Checklist padrão
  
  // Campos técnicos adicionais
  internalCode: varchar('internal_code', { length: 100 }),
  manufacturerCode: varchar('manufacturer_code', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  qrCode: varchar('qr_code', { length: 255 }),
  sku: varchar('sku', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 255 }),
  model: varchar('model', { length: 255 }),
  
  // Preços e custos
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }),
  salePrice: decimal('sale_price', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  
  // Classificações
  abcClassification: varchar('abc_classification', { length: 1 }),
  criticality: varchar('criticality', { length: 20 }),
  category: varchar('category', { length: 100 }),
  subcategory: varchar('subcategory', { length: 100 }),
  
  // Especificações técnicas
  specifications: jsonb('specifications'),
  technicalDetails: text('technical_details'),
  weight: decimal('weight', { precision: 10, scale: 3 }),
  dimensions: jsonb('dimensions'), // {length, width, height}
  
  // Estoque
  minimumStock: decimal('minimum_stock', { precision: 10, scale: 2 }).default('0'),
  maximumStock: decimal('maximum_stock', { precision: 10, scale: 2 }),
  reorderPoint: decimal('reorder_point', { precision: 10, scale: 2 }),
  economicLot: decimal('economic_lot', { precision: 10, scale: 2 }),
  
  // Garantia e validade
  warrantyPeriod: integer('warranty_period'), // em dias
  hasExpiration: boolean('has_expiration').default(false),
  shelfLife: integer('shelf_life'), // em dias
  
  // Metadados
  tags: jsonb('tags'),
  customFields: jsonb('custom_fields'),
  notes: text('notes'),
  status: varchar('status', { length: 20 }).default('active'),
  
  // Auditoria
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

// ================================
// ANEXOS DE ITENS
// ================================
export const itemAttachments = pgTable('item_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull(),
  
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  description: text('description'),
  category: varchar('category', { length: 50 }), // manual, foto, especificacao, etc
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

// ================================
// VÍNCULOS DE ITENS (CORE REQUIREMENT)
// ================================
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
  supplierPrice: decimal('supplier_price', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  minimumOrderQuantity: decimal('minimum_order_quantity', { precision: 10, scale: 2 }),
  deliveryTimeDays: integer('delivery_time_days'),
  isPreferred: boolean('is_preferred').default(false),
  
  // Metadados do vínculo
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  customFields: jsonb('custom_fields'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

// ================================
// FORNECEDORES COMPLETO
// ================================
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Dados básicos
  name: varchar('name', { length: 255 }).notNull(),
  supplierCode: varchar('supplier_code', { length: 50 }),
  tradeName: varchar('trade_name', { length: 255 }),
  documentNumber: varchar('document_number', { length: 20 }),
  documentType: varchar('document_type', { length: 10 }), // CNPJ, CPF
  
  // Contato
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  website: varchar('website', { length: 255 }),
  
  // Endereço
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  country: varchar('country', { length: 50 }).default('BR'),
  zipCode: varchar('zip_code', { length: 10 }),
  
  // Dados comerciais
  paymentTerms: varchar('payment_terms', { length: 100 }),
  deliveryTime: integer('delivery_time'), // em dias
  minimumOrder: decimal('minimum_order', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  category: varchar('category', { length: 100 }),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  
  // Status e metadados
  status: varchar('status', { length: 20 }).default('active'),
  notes: text('notes'),
  customFields: jsonb('custom_fields'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

// ================================
// CATÁLOGO DE FORNECEDORES
// ================================
export const supplierCatalog = pgTable('supplier_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  supplierId: uuid('supplier_id').notNull(),
  itemId: uuid('item_id'),
  
  // Dados do produto no catálogo
  supplierProductCode: varchar('supplier_product_code', { length: 100 }).notNull(),
  supplierProductName: varchar('supplier_product_name', { length: 255 }),
  description: text('description'),
  specifications: jsonb('specifications'),
  
  // Preços e condições
  price: decimal('price', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  minimumQuantity: decimal('minimum_quantity', { precision: 10, scale: 2 }),
  unitOfMeasure: varchar('unit_of_measure', { length: 10 }),
  deliveryTime: integer('delivery_time'),
  
  // Validação e status
  validFrom: timestamp('valid_from'),
  validTo: timestamp('valid_to'),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ================================
// LOCALIZAÇÕES DE ESTOQUE
// ================================
export const stockLocations = pgTable('stock_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Dados básicos
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  description: text('description'),
  locationType: varchar('location_type', { length: 20 }).default('warehouse'), // warehouse, mobile, customer, supplier
  
  // Hierarquia
  parentLocationId: uuid('parent_location_id'),
  locationPath: varchar('location_path', { length: 500 }), // /central/setor1/prateleira1
  level: integer('level').default(1),
  
  // Endereço e coordenadas
  address: text('address'),
  coordinates: jsonb('coordinates'), // {lat, lng}</old_str>
  
  // Capacidade e controles
  capacity: decimal('capacity', { precision: 12, scale: 2 }),
  allowNegativeStock: boolean('allow_negative_stock').default(false),
  requiresApproval: boolean('requires_approval').default(false),
  isActive: boolean('is_active').default(true),
  
  // Responsável
  managerId: uuid('manager_id'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

// ================================
// NÍVEIS DE ESTOQUE
// ================================
export const stockLevels = pgTable('stock_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull(),
  locationId: uuid('location_id').notNull(),
  
  // Quantidades
  currentQuantity: decimal('current_quantity', { precision: 10, scale: 2 }).default('0'),
  reservedQuantity: decimal('reserved_quantity', { precision: 10, scale: 2 }).default('0'),
  availableQuantity: decimal('available_quantity', { precision: 10, scale: 2 }).default('0'),
  
  // Níveis de controle
  minimumStock: decimal('minimum_stock', { precision: 10, scale: 2 }).default('0'),
  maximumStock: decimal('maximum_stock', { precision: 10, scale: 2 }),
  reorderPoint: decimal('reorder_point', { precision: 10, scale: 2 }),
  safetyStock: decimal('safety_stock', { precision: 10, scale: 2 }),
  
  // Custos
  averageCost: decimal('average_cost', { precision: 12, scale: 2 }),
  lastCost: decimal('last_cost', { precision: 12, scale: 2 }),
  totalValue: decimal('total_value', { precision: 12, scale: 2 }),
  
  // Controle de datas
  lastMovementDate: timestamp('last_movement_date'),
  lastCountDate: timestamp('last_count_date'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ================================
// MOVIMENTAÇÕES DE ESTOQUE
// ================================
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Referências
  itemId: uuid('item_id').notNull(),
  fromLocationId: uuid('from_location_id'),
  toLocationId: uuid('to_location_id'),
  
  // Tipo e dados da movimentação
  movementType: movementTypeEnum('movement_type').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unitCost: decimal('unit_cost', { precision: 12, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 12, scale: 2 }),
  
  // Referências de origem
  referenceType: varchar('reference_type', { length: 20 }), // OS, purchase_order, transfer, etc
  referenceId: uuid('reference_id'),
  referenceNumber: varchar('reference_number', { length: 50 }),
  
  // Lote e rastreabilidade
  batchNumber: varchar('batch_number', { length: 50 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  expirationDate: timestamp('expiration_date'),
  
  // Metadados
  reason: text('reason'),
  notes: text('notes'),
  
  // Aprovação
  requiresApproval: boolean('requires_approval').default(false),
  isApproved: boolean('is_approved').default(true),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull()
});

// ================================
// ATIVOS (CONTROLE DE ATIVOS)
// ================================
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Dados básicos
  assetCode: varchar('asset_code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Hierarquia
  parentAssetId: uuid('parent_asset_id'),
  assetPath: varchar('asset_path', { length: 500 }), // /equipamento1/componente1/peca1
  level: integer('level').default(1),
  
  // Classificação
  category: varchar('category', { length: 100 }),
  subcategory: varchar('subcategory', { length: 100 }),
  criticality: varchar('criticality', { length: 20 }),
  
  // Dados técnicos
  manufacturer: varchar('manufacturer', { length: 255 }),
  model: varchar('model', { length: 255 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  manufactureDate: timestamp('manufacture_date'),
  purchaseDate: timestamp('purchase_date'),
  installationDate: timestamp('installation_date'),
  warrantyExpiration: timestamp('warranty_expiration'),
  
  // Localização
  currentLocationId: uuid('current_location_id'),
  coordinates: jsonb('coordinates'),
  
  // Status e operação
  status: assetStatusEnum('status').default('ativo'),
  operationalStatus: varchar('operational_status', { length: 20 }), // funcionando, parado, manutencao
  
  // Medidores
  hasHourMeter: boolean('has_hour_meter').default(false),
  currentHours: decimal('current_hours', { precision: 10, scale: 2 }),
  hasKmMeter: boolean('has_km_meter').default(false),
  currentKm: decimal('current_km', { precision: 10, scale: 2 }),
  
  // Custos
  purchaseValue: decimal('purchase_value', { precision: 12, scale: 2 }),
  currentValue: decimal('current_value', { precision: 12, scale: 2 }),
  residualValue: decimal('residual_value', { precision: 12, scale: 2 }),
  
  // Metadados
  specifications: jsonb('specifications'),
  customFields: jsonb('custom_fields'),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

// ================================
// LISTA DE PREÇOS UNITÁRIOS (LPU)
// ================================
export const priceList = pgTable('price_list', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Dados básicos
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  description: text('description'),
  version: varchar('version', { length: 20 }).default('1.0'),
  
  // Vigência
  validFrom: timestamp('valid_from').notNull(),
  validTo: timestamp('valid_to'),
  
  // Segmentação
  customerId: uuid('customer_id'),
  contractId: uuid('contract_id'),
  costCenterId: uuid('cost_center_id'),
  region: varchar('region', { length: 100 }),
  channel: varchar('channel', { length: 100 }),
  
  // Configurações
  currency: varchar('currency', { length: 3 }).default('BRL'),
  includesTax: boolean('includes_tax').default(false),
  defaultMargin: decimal('default_margin', { precision: 5, scale: 2 }),
  
  // Status
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

// ================================
// ITENS DA LISTA DE PREÇOS
// ================================
export const priceListItems = pgTable('price_list_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  priceListId: uuid('price_list_id').notNull(),
  itemId: uuid('item_id').notNull(),
  
  // Preços
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }),
  margin: decimal('margin', { precision: 5, scale: 2 }),
  
  // Descontos por escala
  minimumQuantity: decimal('minimum_quantity', { precision: 10, scale: 2 }).default('1'),
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }),
  
  // Configurações
  isSpecialPrice: boolean('is_special_price').default(false),
  requiresApproval: boolean('requires_approval').default(false),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ================================
// RELATIONS
// ================================
export const itemsRelations = relations(items, ({ many, one }) => ({
  attachments: many(itemAttachments),
  parentLinks: many(itemLinks, { relationName: "parentItem" }),
  childLinks: many(itemLinks, { relationName: "linkedItem" }),
  stockLevels: many(stockLevels),
  movements: many(stockMovements),
  catalogItems: many(supplierCatalog),
  priceListItems: many(priceListItems)
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
    references: [items.id],
    relationName: "parentItem"
  }),
  linkedItem: one(items, {
    fields: [itemLinks.linkedItemId],
    references: [items.id],
    relationName: "linkedItem"
  }),
  supplier: one(suppliers, {
    fields: [itemLinks.supplierId],
    references: [suppliers.id]
  })
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  catalogItems: many(supplierCatalog),
  itemLinks: many(itemLinks)
}));

export const supplierCatalogRelations = relations(supplierCatalog, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierCatalog.supplierId],
    references: [suppliers.id]
  }),
  item: one(items, {
    fields: [supplierCatalog.itemId],
    references: [items.id]
  })
}));

export const stockLocationsRelations = relations(stockLocations, ({ many, one }) => ({
  parentLocation: one(stockLocations, {
    fields: [stockLocations.parentLocationId],
    references: [stockLocations.id],
    relationName: "locationHierarchy"
  }),
  childLocations: many(stockLocations, { relationName: "locationHierarchy" }),
  stockLevels: many(stockLevels),
  movementsFrom: many(stockMovements, { relationName: "fromLocation" }),
  movementsTo: many(stockMovements, { relationName: "toLocation" }),
  assets: many(assets)
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
  fromLocation: one(stockLocations, {
    fields: [stockMovements.fromLocationId],
    references: [stockLocations.id],
    relationName: "fromLocation"
  }),
  toLocation: one(stockLocations, {
    fields: [stockMovements.toLocationId],
    references: [stockLocations.id],
    relationName: "toLocation"
  })
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  parentAsset: one(assets, {
    fields: [assets.parentAssetId],
    references: [assets.id],
    relationName: "assetHierarchy"
  }),
  childAssets: many(assets, { relationName: "assetHierarchy" }),
  currentLocation: one(stockLocations, {
    fields: [assets.currentLocationId],
    references: [stockLocations.id]
  })
}));

export const priceListRelations = relations(priceList, ({ many }) => ({
  items: many(priceListItems)
}));

export const priceListItemsRelations = relations(priceListItems, ({ one }) => ({
  priceList: one(priceList, {
    fields: [priceListItems.priceListId],
    references: [priceList.id]
  }),
  item: one(items, {
    fields: [priceListItems.itemId],
    references: [items.id]
  })
}));
