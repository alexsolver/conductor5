import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, integer, jsonb, pgEnum, index, unique, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// Import items from master schema instead of redefining
import { items } from './schema-master';

// Import tenants table from a different schema if it exists, otherwise define it.
// Assuming 'tenants' is defined elsewhere or needs to be imported.
// For this example, let's assume it's defined in a 'tenants' file or similar.
// If not, you would need to import or define it here.
// Example placeholder:
// import { tenants } from './schema-tenants'; 
// If tenants table is not yet defined, you might need to adjust the foreign key reference or define it.
// For now, we'll use a placeholder reference.
const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});


// Export the items table from master schema
export { items };

// Enums específicos do módulo Materiais e Serviços
export const itemTypeEnum = pgEnum('item_type', ['material', 'service', 'asset']);
export const measurementUnitEnum = pgEnum('measurement_unit', ['UN', 'M', 'M2', 'M3', 'KG', 'L', 'H', 'PC', 'CX', 'GL', 'SET']);
export const itemStatusEnum = pgEnum('item_status', ['active', 'under_review', 'discontinued']);
export const movementTypeEnum = pgEnum('movement_type', ['entry', 'exit', 'transfer', 'adjustment', 'return', 'inventory']);
export const assetStatusEnum = pgEnum('asset_status', ['active', 'inactive', 'maintenance', 'disposed']);
export const linkTypeEnum = pgEnum('link_type', ['item_item', 'item_customer', 'item_supplier']);

// Anexos de itens
export const itemAttachments = pgTable('item_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

// VÍNCULOS DE ITENS - SISTEMA COMPLEXO CONFORME ESPECIFICAÇÃO
export const itemLinks = pgTable('item_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  linkType: linkTypeEnum('link_type').notNull(),
  itemId: uuid('item_id').notNull(), // Item principal

  // 1. VÍNCULOS ITEM ↔ ITEM
  linkedItemId: uuid('linked_item_id'),
  relationship: varchar('relationship', { length: 50 }), // kit, substitute, equivalent, compatible, group

  // Suporte a grupos nomeados
  groupName: varchar('group_name', { length: 255 }),
  groupDescription: text('group_description'),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

// Nova tabela para operações em lote
export const bulkItemOperations = pgTable('bulk_item_operations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  operationType: varchar('operation_type', { length: 50 }).notNull(), // 'bulk_link', 'bulk_unlink', 'group_create'
  itemIds: jsonb('item_ids').notNull(), // Array de IDs dos itens
  relationship: varchar('relationship', { length: 50 }),
  groupName: varchar('group_name', { length: 255 }),

  executedBy: uuid('executed_by').notNull(),
  executedAt: timestamp('executed_at').defaultNow().notNull(),
  isCompleted: boolean('is_completed').default(false)
});

// VÍNCULOS ITEM ↔ EMPRESA CLIENTE (dados específicos por empresa cliente)
export const itemCustomerLinks = pgTable('item_customer_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull(),
  companyId: uuid('company_id').notNull(), // Referencia companies

  // Campos específicos do cliente conforme especificação
  alias: varchar('alias', { length: 255 }), // Apelido
  sku: varchar('sku', { length: 100 }), // SKU do cliente
  barcode: varchar('barcode', { length: 100 }), // Código de barras
  qrCode: varchar('qr_code', { length: 255 }), // Código QR
  isAsset: boolean('is_asset').default(false), // Se SIM → vai para Controle de Ativos (só materiais)

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

// VÍNCULOS ITEM ↔ FORNECEDOR (dados específicos por fornecedor)
export const itemSupplierLinks = pgTable('item_supplier_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull(),
  supplierId: uuid('supplier_id').notNull(),

  // Campos específicos do fornecedor conforme especificação
  partNumber: varchar('part_number', { length: 100 }), // Part Number
  description: text('description'), // Descrição do fornecedor
  qrCode: varchar('qr_code', { length: 255 }), // Código QR
  barcode: varchar('barcode', { length: 100 }), // Código de Barras

  // Dados logísticos (sem preço - controlado no LPU)
  leadTime: integer('lead_time'), // days
  minimumOrderQuantity: decimal('minimum_order_quantity', { precision: 10, scale: 2 }),

  isActive: boolean('is_active').default(true),
  validFrom: timestamp('valid_from').defaultNow(),
  validTo: timestamp('valid_to'),
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
  code: varchar('code', { length: 50 }),
  tradeName: varchar('trade_name', { length: 255 }),
  document: varchar('document', { length: 20 }).notNull(), // Campo obrigatório conforme banco real
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),

  // Endereço
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  country: varchar('country', { length: 50 }).default('Brasil'),
  website: varchar('website', { length: 255 }),
  contactPerson: varchar('contact_person', { length: 255 }),
  paymentTerms: text('payment_terms'),
  notes: text('notes'),

  // Performance
  performanceRating: decimal('performance_rating', { precision: 3, scale: 2 }),
  active: boolean('active').default(true), // Alinhado com banco real

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
  description: text('description'),
  version: varchar('version', { length: 20 }),

  // Aplicação
  customerId: uuid('customer_id'),
  customerCompanyId: uuid('customer_company_id'),
  contractId: uuid('contract_id'),
  costCenterId: uuid('cost_center_id'),

  // Vigência
  validFrom: timestamp('valid_from'),
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

export const materialCertifications = pgTable('certifications', {
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
  certifications: many(materialCertifications)
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
  certifications: many(materialCertifications)
}));

export const priceListsRelations = relations(priceLists, ({ many }) => ({
  items: many(priceListItems)
}));

// ===============================
// EXTENSÕES DOS TRÊS MÓDULOS FALTANTES
// ===============================

// CONTROLE DE ATIVOS AVANÇADO - Extensões para geolocalização, QR codes, medidores
export const assetMaintenance = pgTable('asset_maintenance', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  assetId: uuid('asset_id').notNull(),

  type: varchar('type', { length: 20 }).notNull(), // preventive, corrective, emergency
  status: varchar('status', { length: 20 }).notNull().default('scheduled'), // scheduled, in_progress, completed, cancelled
  priority: varchar('priority', { length: 10 }).default('medium'), // low, medium, high, critical

  scheduledDate: timestamp('scheduled_date'),
  completedDate: timestamp('completed_date'),
  technicianId: uuid('technician_id'),

  description: text('description'),
  workPerformed: text('work_performed'),
  partsUsed: jsonb('parts_used'),
  cost: decimal('cost', { precision: 12, scale: 2 }),
  downtime: integer('downtime'), // minutes

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const assetMeters = pgTable('asset_meters', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  assetId: uuid('asset_id').notNull(),

  meterType: varchar('meter_type', { length: 30 }).notNull(), // hours, kilometers, cycles, etc
  currentReading: decimal('current_reading', { precision: 15, scale: 3 }),
  previousReading: decimal('previous_reading', { precision: 15, scale: 3 }),
  readingDate: timestamp('reading_date').defaultNow(),
  unit: varchar('unit', { length: 10 }).notNull(),
  notes: text('notes'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const assetLocations = pgTable('asset_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  assetId: uuid('asset_id').notNull(),

  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  address: text('address'),
  locationName: varchar('location_name', { length: 200 }),

  isActive: boolean('is_active').default(true),
  recordedAt: timestamp('recorded_at').defaultNow(),
  recordedBy: uuid('recorded_by'),
});

// LPU - LISTA DE PREÇOS UNIFICADA - Sistema completo com workflow de aprovação
export const pricingRules = pgTable('pricing_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ruleType: varchar('rule_type', { length: 50 }).notNull(), // percentual, fixo, escalonado, dinâmico
  conditions: jsonb('conditions'), // complex conditions for rule application
  actions: jsonb('actions'), // price modification actions
  priority: integer('priority').default(1),

  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const priceListVersions = pgTable('price_list_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  priceListId: uuid('price_list_id').notNull(),

  version: varchar('version', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, pending_approval, approved, active, archived

  // Workflow de aprovação
  submittedBy: uuid('submitted_by'),
  submittedAt: timestamp('submitted_at'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  rejectedBy: uuid('rejected_by'),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),

  // Controle de margem
  baseMargin: decimal('base_margin', { precision: 5, scale: 2 }), // percentage
  marginOverride: jsonb('margin_override'), // specific overrides

  effectiveDate: timestamp('effective_date'),
  expirationDate: timestamp('expiration_date'),

  notes: text('notes'),
  changeLog: jsonb('change_log'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const dynamicPricing = pgTable('dynamic_pricing', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  priceListId: uuid('price_list_id').notNull(),
  itemId: uuid('item_id'),

  // Preço dinâmico baseado em condições
  basePrice: decimal('base_price', { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal('current_price', { precision: 15, scale: 2 }).notNull(),

  // Fatores de ajuste
  demandFactor: decimal('demand_factor', { precision: 5, scale: 4 }).default('1.0000'),
  seasonalFactor: decimal('seasonal_factor', { precision: 5, scale: 4 }).default('1.0000'),
  inventoryFactor: decimal('inventory_factor', { precision: 5, scale: 4 }).default('1.0000'),
  competitorFactor: decimal('competitor_factor', { precision: 5, scale: 4 }).default('1.0000'),

  lastUpdated: timestamp('last_updated').defaultNow(),
  calculationRules: jsonb('calculation_rules'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// GESTÃO DE COMPLIANCE - Alinhado com tabelas reais do banco
export const complianceAudits = pgTable('compliance_audits', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  title: varchar('title', { length: 200 }).notNull(),
  type: varchar('type', { length: 30 }).notNull(), // internal, external, regulatory, certification
  status: varchar('status', { length: 20 }).notNull().default('planned'), // planned, in_progress, completed, cancelled

  auditorName: varchar('auditor_name', { length: 100 }),
  auditorOrganization: varchar('auditor_organization', { length: 100 }),

  scheduledDate: timestamp('scheduled_date'),
  startDate: timestamp('start_date'),
  completionDate: timestamp('completion_date'),

  scope: text('scope'),
  methodology: text('methodology'),
  findings: jsonb('findings'),
  recommendations: text('recommendations'),

  overallScore: decimal('overall_score', { precision: 5, scale: 2 }),
  criticalIssues: integer('critical_issues').default(0),
  majorIssues: integer('major_issues').default(0),
  minorIssues: integer('minor_issues').default(0),

  responsiblePerson: uuid('responsible_person'),
  nextAuditDate: timestamp('next_audit_date'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const complianceAlerts = pgTable('compliance_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  title: varchar('title', { length: 255 }),
  description: text('description'),
  severity: varchar('severity', { length: 20 }),
  status: varchar('status', { length: 20 }),
  category: varchar('category', { length: 50 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const complianceCertifications = pgTable('compliance_certifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 30 }).notNull(), // iso, industry, regulatory
  standard: varchar('standard', { length: 50 }).notNull(),
  issuingBody: varchar('issuing_body', { length: 100 }).notNull(),

  certificateNumber: varchar('certificate_number', { length: 50 }),
  issueDate: timestamp('issue_date'),
  expirationDate: timestamp('expiration_date'),

  status: varchar('status', { length: 20 }).notNull().default('active'), // active, expired, suspended, revoked
  scope: text('scope'),
  evidenceFiles: jsonb('evidence_files'),
  renewalNoticeDate: timestamp('renewal_notice_date'),

  cost: decimal('cost', { precision: 12, scale: 2 }),
  responsiblePerson: uuid('responsible_person'),
  notes: text('notes'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const complianceEvidence = pgTable('compliance_evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  auditId: uuid('audit_id'),
  certificationId: uuid('certification_id'),

  title: varchar('title', { length: 200 }).notNull(),
  type: varchar('type', { length: 30 }).notNull(), // document, photo, record, measurement

  fileName: varchar('file_name', { length: 255 }),
  filePath: varchar('file_path', { length: 500 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),

  description: text('description'),
  collectedDate: timestamp('collected_date').defaultNow(),
  collectedBy: uuid('collected_by'),
  verifiedBy: uuid('verified_by'),
  verifiedAt: timestamp('verified_at'),

  isValid: boolean('is_valid').default(true),
  expirationDate: timestamp('expiration_date'),
  tags: text('tags').array(),
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const complianceScores = pgTable('compliance_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  entityType: varchar('entity_type', { length: 30 }).notNull(), // item, supplier, asset, process
  entityId: uuid('entity_id').notNull(),

  category: varchar('category', { length: 50 }).notNull(), // quality, safety, environmental, regulatory
  score: decimal('score', { precision: 5, scale: 2 }).notNull(), // 0-100
  maxScore: decimal('max_score', { precision: 5, scale: 2 }).default('100.00'),

  criteria: jsonb('criteria'), // detailed scoring criteria
  gaps: jsonb('gaps'), // identified compliance gaps
  recommendations: text('recommendations'),

  assessedBy: uuid('assessed_by'),
  assessedAt: timestamp('assessed_at').defaultNow(),
  nextAssessmentDate: timestamp('next_assessment_date'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ===== SYSTEM SETTINGS TABLE =====
export const systemSettings = pgTable('materials_system_settings', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  autoValidation: boolean('auto_validation').default(true),
  duplicateNotifications: boolean('duplicate_notifications').default(true),
  autoBackup: boolean('auto_backup').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});


// RELATIONS ADICIONAIS PARA OS NOVOS MÓDULOS
export const assetMaintenanceRelations = relations(assetMaintenance, ({ one }) => ({
  asset: one(assets, { fields: [assetMaintenance.assetId], references: [assets.id] })
}));

export const priceListVersionsRelations = relations(priceListVersions, ({ one }) => ({
  priceList: one(priceLists, { fields: [priceListVersions.priceListId], references: [priceLists.id] })
}));

export const complianceAuditsRelations = relations(complianceAudits, ({ many }) => ({
  evidence: many(complianceEvidence)
}));

export const complianceCertificationsRelations = relations(complianceCertifications, ({ many }) => ({
  evidence: many(complianceEvidence)
}));

// Types para uso no frontend - EXTENSÕES
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

// Novos tipos para os módulos faltantes
export type AssetMaintenance = typeof assetMaintenance.$inferSelect;
export type InsertAssetMaintenance = typeof assetMaintenance.$inferInsert;
export type AssetMeter = typeof assetMeters.$inferSelect;
export type InsertAssetMeter = typeof assetMeters.$inferInsert;
export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = typeof pricingRules.$inferInsert;
export type DynamicPricing = typeof dynamicPricing.$inferSelect;
export type InsertDynamicPricing = typeof dynamicPricing.$inferInsert;
export type ComplianceAudit = typeof complianceAudits.$inferSelect;
export type InsertComplianceAudit = typeof complianceAudits.$insert;
export type ComplianceCertification = typeof complianceCertifications.$inferSelect;
export type InsertComplianceCertification = typeof complianceCertifications.$insert;
export type ComplianceEvidence = typeof complianceEvidence.$inferSelect;
export type InsertComplianceEvidence = typeof complianceEvidence.$insert;
export type ComplianceAlert = typeof complianceAlerts.$inferSelect;
export type InsertComplianceAlert = typeof complianceAlerts.$insert;
export type ComplianceScore = typeof complianceScores.$inferSelect;
export type InsertComplianceScore = typeof complianceScores.$insert;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;