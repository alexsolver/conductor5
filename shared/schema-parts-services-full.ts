import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

// =====================================================
// SISTEMA COMPLETO PARTS & SERVICES - 11 MÓDULOS
// Schema PostgreSQL para todos os módulos solicitados
// =====================================================

// MÓDULO 1: GESTÃO DE PEÇAS
export const parts = pgTable('parts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Códigos e identificação
  internalCode: varchar('internal_code', { length: 50 }).notNull(),
  manufacturerCode: varchar('manufacturer_code', { length: 50 }),
  barcode: varchar('barcode', { length: 100 }),
  qrCode: varchar('qr_code', { length: 200 }),
  rfidTag: varchar('rfid_tag', { length: 100 }),
  
  // Descrição e categorização
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  subcategory: varchar('subcategory', { length: 100 }),
  
  // Especificações técnicas
  dimensions: jsonb('dimensions'), // {length, width, height, unit}
  weight: decimal('weight', { precision: 10, scale: 3 }),
  weightUnit: varchar('weight_unit', { length: 10 }),
  materials: text('materials'),
  voltage: varchar('voltage', { length: 20 }),
  power: varchar('power', { length: 20 }),
  
  // Comercial
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }),
  margin: decimal('margin', { precision: 5, scale: 2 }),
  salePrice: decimal('sale_price', { precision: 12, scale: 2 }),
  abcClassification: varchar('abc_classification', { length: 1 }), // A, B, C
  isObsolete: boolean('is_obsolete').default(false),
  
  // Documentação
  images: text('images').array(),
  manuals: text('manuals').array(),
  technicalDocuments: text('technical_documents').array(),
  
  // Sistema
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

export const partCategories = pgTable('part_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id'), // Para hierarquia
  level: integer('level').default(1),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const partSpecifications = pgTable('part_specifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  partId: uuid('part_id').notNull(),
  specName: varchar('spec_name', { length: 100 }).notNull(),
  specValue: varchar('spec_value', { length: 200 }).notNull(),
  unit: varchar('unit', { length: 20 }),
  isRequired: boolean('is_required').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const interchangeableParts = pgTable('interchangeable_parts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  originalPartId: uuid('original_part_id').notNull(),
  interchangeablePartId: uuid('interchangeable_part_id').notNull(),
  compatibility: varchar('compatibility', { length: 20 }).default('full'), // full, partial, conditional
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// MÓDULO 2: CONTROLE DE ESTOQUE
export const stockLocations = pgTable('stock_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  type: varchar('type', { length: 30 }).notNull(), // warehouse, store, vehicle, technician
  address: text('address'),
  coordinates: jsonb('coordinates'), // {lat, lng}
  managerId: uuid('manager_id'),
  capacity: integer('capacity'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  partId: uuid('part_id').notNull(),
  locationId: uuid('location_id').notNull(),
  
  // Níveis de estoque
  currentStock: integer('current_stock').default(0),
  minimumStock: integer('minimum_stock').default(0),
  maximumStock: integer('maximum_stock').default(0),
  reorderPoint: integer('reorder_point').default(0),
  economicOrderQuantity: integer('economic_order_quantity').default(0),
  
  // Reservas e consignação
  reservedStock: integer('reserved_stock').default(0),
  consignedStock: integer('consigned_stock').default(0),
  
  // Controle de lotes
  lotNumber: varchar('lot_number', { length: 50 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  expirationDate: timestamp('expiration_date'),
  
  // Sistema
  lastCountDate: timestamp('last_count_date'),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  partId: uuid('part_id').notNull(),
  locationId: uuid('location_id').notNull(),
  
  // Movimentação
  movementType: varchar('movement_type', { length: 20 }).notNull(), // IN, OUT, TRANSFER, ADJUSTMENT, RETURN
  quantity: integer('quantity').notNull(),
  unitCost: decimal('unit_cost', { precision: 12, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 12, scale: 2 }),
  
  // Referências
  referenceType: varchar('reference_type', { length: 30 }), // purchase_order, work_order, transfer, adjustment
  referenceId: uuid('reference_id'),
  
  // Destino (para transferências)
  destinationLocationId: uuid('destination_location_id'),
  
  // Documentação
  documentNumber: varchar('document_number', { length: 50 }),
  notes: text('notes'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull()
});

export const stockReservations = pgTable('stock_reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  partId: uuid('part_id').notNull(),
  locationId: uuid('location_id').notNull(),
  quantity: integer('quantity').notNull(),
  
  // Reserva
  reservationType: varchar('reservation_type', { length: 30 }).notNull(), // work_order, maintenance, emergency
  referenceId: uuid('reference_id'),
  reservedFor: uuid('reserved_for'), // user_id
  
  // Datas
  reservedAt: timestamp('reserved_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  fulfilledAt: timestamp('fulfilled_at'),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'), // active, fulfilled, expired, cancelled
  notes: text('notes'),
  
  createdBy: uuid('created_by').notNull()
});

// MÓDULO 3: GESTÃO DE FORNECEDORES
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Dados básicos
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  tradeName: varchar('trade_name', { length: 200 }),
  taxId: varchar('tax_id', { length: 20 }),
  
  // Contato
  email: varchar('email', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  website: varchar('website', { length: 200 }),
  
  // Endereço
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 10 }),
  country: varchar('country', { length: 50 }),
  
  // Comercial
  paymentTerms: varchar('payment_terms', { length: 100 }),
  deliveryTerms: varchar('delivery_terms', { length: 100 }),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  
  // Categorização
  category: varchar('category', { length: 50 }),
  isPreferred: boolean('is_preferred').default(false),
  
  // Sistema
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const supplierCatalog = pgTable('supplier_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  supplierId: uuid('supplier_id').notNull(),
  partId: uuid('part_id').notNull(),
  
  // Preços
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  minimumOrderQuantity: integer('minimum_order_quantity').default(1),
  
  // Descontos por quantidade
  quantityBreaks: jsonb('quantity_breaks'), // [{quantity: 10, discount: 5}, {quantity: 50, discount: 10}]
  
  // Prazo e disponibilidade
  leadTime: integer('lead_time'), // dias
  availability: varchar('availability', { length: 20 }).default('available'),
  
  // Códigos do fornecedor
  supplierPartCode: varchar('supplier_part_code', { length: 50 }),
  supplierDescription: text('supplier_description'),
  
  // Validade
  validFrom: timestamp('valid_from').defaultNow().notNull(),
  validTo: timestamp('valid_to'),
  
  // Sistema
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const supplierPerformance = pgTable('supplier_performance', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  supplierId: uuid('supplier_id').notNull(),
  
  // Período de avaliação
  evaluationPeriod: varchar('evaluation_period', { length: 20 }).notNull(), // monthly, quarterly, yearly
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  // Métricas de qualidade (0-100)
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }),
  deliveryScore: decimal('delivery_score', { precision: 5, scale: 2 }),
  priceScore: decimal('price_score', { precision: 5, scale: 2 }),
  serviceScore: decimal('service_score', { precision: 5, scale: 2 }),
  
  // Estatísticas
  totalOrders: integer('total_orders').default(0),
  onTimeDeliveries: integer('on_time_deliveries').default(0),
  qualityIssues: integer('quality_issues').default(0),
  averageLeadTime: decimal('average_lead_time', { precision: 5, scale: 1 }),
  
  // Score geral
  overallScore: decimal('overall_score', { precision: 5, scale: 2 }),
  
  // Observações
  notes: text('notes'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull()
});

// MÓDULO 4: PLANEJAMENTO E COMPRAS
export const demandAnalysis = pgTable('demand_analysis', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  partId: uuid('part_id').notNull(),
  
  // Análise temporal
  analysisYear: varchar('analysis_year', { length: 4 }).notNull(),
  analysisMonth: varchar('analysis_month', { length: 2 }),
  
  // Demanda histórica
  historicalDemand: integer('historical_demand').default(0),
  forecastDemand: integer('forecast_demand').default(0),
  seasonalityFactor: decimal('seasonality_factor', { precision: 5, scale: 3 }).default(1),
  trendFactor: decimal('trend_factor', { precision: 5, scale: 3 }).default(1),
  
  // Análise ABC/XYZ
  abcClass: varchar('abc_class', { length: 1 }), // A, B, C (valor)
  xyzClass: varchar('xyz_class', { length: 1 }), // X, Y, Z (variabilidade)
  
  // Estatísticas
  averageMonthlyUsage: decimal('average_monthly_usage', { precision: 10, scale: 2 }),
  variationCoefficient: decimal('variation_coefficient', { precision: 5, scale: 3 }),
  
  // Recomendações
  recommendedStock: integer('recommended_stock'),
  recommendedReorderPoint: integer('recommended_reorder_point'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const purchaseOrdersAdvanced = pgTable('purchase_orders_advanced', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Identificação
  orderNumber: varchar('order_number', { length: 50 }).notNull(),
  supplierId: uuid('supplier_id').notNull(),
  
  // Tipo de compra
  orderType: varchar('order_type', { length: 30 }).notNull(), // regular, emergency, programmed, automatic
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high, urgent
  
  // Datas
  orderDate: timestamp('order_date').defaultNow().notNull(),
  requestedDeliveryDate: timestamp('requested_delivery_date'),
  confirmedDeliveryDate: timestamp('confirmed_delivery_date'),
  actualDeliveryDate: timestamp('actual_delivery_date'),
  
  // Valores
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).default(0),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default(0),
  shippingCost: decimal('shipping_cost', { precision: 15, scale: 2 }).default(0),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).default(0),
  
  // Aprovação workflow
  status: varchar('status', { length: 30 }).default('draft'), // draft, pending_approval, approved, sent, confirmed, delivered, invoiced, completed, cancelled
  approvalLevel: varchar('approval_level', { length: 2 }).default('0'),
  requiredApprovalLevel: varchar('required_approval_level', { length: 2 }).default('1'),
  
  // Entrega
  deliveryAddress: text('delivery_address'),
  deliveryLocationId: uuid('delivery_location_id'),
  
  // Termos
  paymentTerms: varchar('payment_terms', { length: 100 }),
  deliveryTerms: varchar('delivery_terms', { length: 100 }),
  
  // Observações
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by')
});

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  purchaseOrderId: uuid('purchase_order_id').notNull(),
  partId: uuid('part_id').notNull(),
  
  // Quantidades
  quantity: integer('quantity').notNull(),
  receivedQuantity: integer('received_quantity').default(0),
  rejectedQuantity: integer('rejected_quantity').default(0),
  
  // Preços
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 5, scale: 2 }).default(0),
  totalPrice: decimal('total_price', { precision: 15, scale: 2 }).notNull(),
  
  // Entrega
  requestedDeliveryDate: timestamp('requested_delivery_date'),
  deliveredDate: timestamp('delivered_date'),
  
  // Status
  status: varchar('status', { length: 20 }).default('pending'), // pending, partial, delivered, cancelled
  
  // Observações
  notes: text('notes'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const purchaseOrderApprovals = pgTable('purchase_order_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  purchaseOrderId: uuid('purchase_order_id').notNull(),
  
  // Aprovação
  approvalLevel: varchar('approval_level', { length: 2 }).notNull(),
  approverId: uuid('approver_id').notNull(),
  approvedAt: timestamp('approved_at'),
  
  // Status
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, rejected
  comments: text('comments'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// MÓDULO 5: INTEGRAÇÃO COM SERVIÇOS
export const serviceKits = pgTable('service_kits', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Identificação
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Tipo de serviço
  serviceType: varchar('service_type', { length: 50 }).notNull(), // preventive, corrective, installation, inspection
  equipmentType: varchar('equipment_type', { length: 100 }),
  equipmentModel: varchar('equipment_model', { length: 100 }),
  equipmentBrand: varchar('equipment_brand', { length: 100 }),
  
  // Periodicidade (para manutenção preventiva)
  maintenanceInterval: integer('maintenance_interval'), // em dias
  maintenanceType: varchar('maintenance_type', { length: 30 }), // daily, weekly, monthly, quarterly, yearly
  
  // Custo estimado
  estimatedCost: decimal('estimated_cost', { precision: 12, scale: 2 }),
  estimatedTime: integer('estimated_time'), // em minutos
  
  // Sistema
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

export const serviceKitItems = pgTable('service_kit_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  serviceKitId: uuid('service_kit_id').notNull(),
  partId: uuid('part_id').notNull(),
  
  // Quantidade
  quantity: integer('quantity').notNull(),
  isOptional: boolean('is_optional').default(false),
  
  // Observações
  notes: text('notes'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const workOrderParts = pgTable('work_order_parts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  workOrderId: uuid('work_order_id').notNull(),
  partId: uuid('part_id').notNull(),
  
  // Quantidade
  plannedQuantity: integer('planned_quantity').default(0),
  usedQuantity: integer('used_quantity').default(0),
  returnedQuantity: integer('returned_quantity').default(0),
  
  // Custo
  unitCost: decimal('unit_cost', { precision: 12, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 12, scale: 2 }),
  
  // Status
  status: varchar('status', { length: 20 }).default('planned'), // planned, reserved, used, returned
  
  // Localização
  sourceLocationId: uuid('source_location_id'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

// MÓDULO 6: LOGÍSTICA E DISTRIBUIÇÃO
export const transfers = pgTable('transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Identificação
  transferNumber: varchar('transfer_number', { length: 50 }).notNull(),
  
  // Origem e destino
  sourceLocationId: uuid('source_location_id').notNull(),
  destinationLocationId: uuid('destination_location_id').notNull(),
  
  // Tipo de transferência
  transferType: varchar('transfer_type', { length: 30 }).notNull(), // internal, external, customer, technician, cross_dock
  
  // Status
  status: varchar('status', { length: 20 }).default('draft'), // draft, pending, in_transit, delivered, cancelled
  
  // Datas
  requestedDate: timestamp('requested_date').defaultNow().notNull(),
  shippedDate: timestamp('shipped_date'),
  deliveredDate: timestamp('delivered_date'),
  
  // Transportadora
  carrier: varchar('carrier', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  shippingCost: decimal('shipping_cost', { precision: 12, scale: 2 }),
  
  // Observações
  notes: text('notes'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const transferItems = pgTable('transfer_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  transferId: uuid('transfer_id').notNull(),
  partId: uuid('part_id').notNull(),
  
  // Quantidades
  requestedQuantity: integer('requested_quantity').notNull(),
  shippedQuantity: integer('shipped_quantity').default(0),
  receivedQuantity: integer('received_quantity').default(0),
  
  // Status
  status: varchar('status', { length: 20 }).default('pending'), // pending, shipped, received, damaged
  
  // Observações
  notes: text('notes'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const returns = pgTable('returns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Identificação
  returnNumber: varchar('return_number', { length: 50 }).notNull(),
  
  // Origem
  returnType: varchar('return_type', { length: 30 }).notNull(), // customer, supplier, internal, warranty
  customerId: uuid('customer_id'),
  supplierId: uuid('supplier_id'),
  workOrderId: uuid('work_order_id'),
  
  // Motivo
  reason: varchar('reason', { length: 50 }).notNull(), // defective, wrong_item, excess, warranty, damaged
  description: text('description'),
  
  // Status
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, rejected, completed
  
  // Ação
  action: varchar('action', { length: 30 }), // refund, replace, repair, credit, dispose
  
  // Datas
  requestDate: timestamp('request_date').defaultNow().notNull(),
  approvalDate: timestamp('approval_date'),
  completedDate: timestamp('completed_date'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull()
});

export const returnItems = pgTable('return_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  returnId: uuid('return_id').notNull(),
  partId: uuid('part_id').notNull(),
  
  // Quantidade e condição
  quantity: integer('quantity').notNull(),
  condition: varchar('condition', { length: 20 }).notNull(), // new, used, damaged, defective
  
  // Valores
  unitCost: decimal('unit_cost', { precision: 12, scale: 2 }),
  refundAmount: decimal('refund_amount', { precision: 12, scale: 2 }),
  
  // Observações
  notes: text('notes'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// MÓDULO 7: CONTROLE DE ATIVOS
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Identificação
  assetNumber: varchar('asset_number', { length: 50 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Hierarquia
  parentAssetId: uuid('parent_asset_id'), // Para hierarquia máquina > componente > peça
  assetLevel: integer('asset_level').default(1), // 1=máquina, 2=componente, 3=peça
  
  // Classificação
  category: varchar('category', { length: 50 }).notNull(), // equipment, vehicle, tool, facility, infrastructure
  subcategory: varchar('subcategory', { length: 50 }),
  type: varchar('type', { length: 50 }),
  
  // Dados técnicos
  brand: varchar('brand', { length: 100 }),
  model: varchar('model', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  manufacturingDate: timestamp('manufacturing_date'),
  
  // Localização
  currentLocationId: uuid('current_location_id'),
  coordinates: jsonb('coordinates'), // {lat, lng}
  
  // Status
  status: varchar('status', { length: 30 }).default('active'), // active, inactive, maintenance, disposed, transferred
  condition: varchar('condition', { length: 20 }).default('good'), // excellent, good, fair, poor, critical
  
  // Valores
  acquisitionCost: decimal('acquisition_cost', { precision: 15, scale: 2 }),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }),
  depreciationRate: decimal('depreciation_rate', { precision: 5, scale: 2 }),
  
  // Ciclo de vida
  operatingHours: integer('operating_hours').default(0),
  kilometers: integer('kilometers').default(0),
  cycleCount: integer('cycle_count').default(0),
  lastMaintenanceDate: timestamp('last_maintenance_date'),
  nextMaintenanceDate: timestamp('next_maintenance_date'),
  
  // Garantias
  warrantyStartDate: timestamp('warranty_start_date'),
  warrantyEndDate: timestamp('warranty_end_date'),
  extendedWarrantyEndDate: timestamp('extended_warranty_end_date'),
  
  // Identificação física
  qrCode: varchar('qr_code', { length: 200 }),
  rfidTag: varchar('rfid_tag', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  
  // Responsabilidade
  assignedTo: uuid('assigned_to'), // usuário responsável
  custodian: uuid('custodian'), // custodiante
  
  // Sistema
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

export const assetMaintenance = pgTable('asset_maintenance', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  assetId: uuid('asset_id').notNull(),
  
  // Tipo de manutenção
  maintenanceType: varchar('maintenance_type', { length: 30 }).notNull(), // preventive, corrective, predictive, emergency
  workOrderId: uuid('work_order_id'),
  
  // Datas
  scheduledDate: timestamp('scheduled_date'),
  startDate: timestamp('start_date'),
  completedDate: timestamp('completed_date'),
  
  // Descrição
  description: text('description').notNull(),
  workPerformed: text('work_performed'),
  
  // Recursos
  technicianId: uuid('technician_id'),
  laborHours: decimal('labor_hours', { precision: 8, scale: 2 }),
  laborCost: decimal('labor_cost', { precision: 12, scale: 2 }),
  partsCost: decimal('parts_cost', { precision: 12, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 12, scale: 2 }),
  
  // Métricas do ativo no momento
  operatingHoursAtMaintenance: integer('operating_hours_at_maintenance'),
  kilometersAtMaintenance: integer('kilometers_at_maintenance'),
  
  // Status
  status: varchar('status', { length: 20 }).default('planned'), // planned, in_progress, completed, cancelled
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

export const assetMovements = pgTable('asset_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  assetId: uuid('asset_id').notNull(),
  
  // Movimento
  movementType: varchar('movement_type', { length: 30 }).notNull(), // transfer, assignment, maintenance, disposal
  fromLocationId: uuid('from_location_id'),
  toLocationId: uuid('to_location_id'),
  fromUserId: uuid('from_user_id'),
  toUserId: uuid('to_user_id'),
  
  // Datas
  movementDate: timestamp('movement_date').defaultNow().notNull(),
  expectedReturnDate: timestamp('expected_return_date'),
  actualReturnDate: timestamp('actual_return_date'),
  
  // Motivo e observações
  reason: varchar('reason', { length: 100 }).notNull(),
  notes: text('notes'),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'), // active, completed, cancelled
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull()
});

// MÓDULO 8: LISTA DE PREÇOS UNITÁRIOS (LPU)
export const priceLists = pgTable('price_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Identificação
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Versão
  version: varchar('version', { length: 20 }).notNull(),
  previousVersionId: uuid('previous_version_id'),
  
  // Aplicação
  customerId: uuid('customer_id'), // Se específica para cliente
  contractId: uuid('contract_id'), // Se vinculada a contrato
  costCenterId: uuid('cost_center_id'), // Se por centro de custo
  
  // Vigência
  validFrom: timestamp('valid_from').notNull(),
  validTo: timestamp('valid_to'),
  
  // Periodicidade de revisão
  reviewPeriod: varchar('review_period', { length: 20 }), // monthly, quarterly, yearly
  nextReviewDate: timestamp('next_review_date'),
  
  // Status
  status: varchar('status', { length: 20 }).default('draft'), // draft, active, expired, superseded
  
  // Sistema
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

export const priceListItems = pgTable('price_list_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  priceListId: uuid('price_list_id').notNull(),
  
  // Item
  itemType: varchar('item_type', { length: 30 }).notNull(), // part, service, labor, travel, equipment
  itemId: uuid('item_id'), // part_id, service_type_id, etc
  itemCode: varchar('item_code', { length: 50 }),
  itemDescription: text('item_description').notNull(),
  
  // Preços
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  unit: varchar('unit', { length: 20 }).default('UN'), // UN, KG, M, H, etc
  
  // Margem e markup
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }),
  margin: decimal('margin', { precision: 5, scale: 2 }),
  markup: decimal('markup', { precision: 5, scale: 2 }),
  
  // Descontos por escala
  scaleDiscounts: jsonb('scale_discounts'), // [{minQty: 10, discount: 5}, {minQty: 50, discount: 10}]
  
  // Observações
  notes: text('notes'),
  
  // Sistema
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const priceListApplications = pgTable('price_list_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  priceListId: uuid('price_list_id').notNull(),
  
  // Onde foi aplicada
  applicationTarget: varchar('application_target', { length: 30 }).notNull(), // work_order, quote, invoice
  targetId: uuid('target_id').notNull(),
  
  // Valores
  estimatedValue: decimal('estimated_value', { precision: 15, scale: 2 }),
  actualValue: decimal('actual_value', { precision: 15, scale: 2 }),
  variance: decimal('variance', { precision: 15, scale: 2 }),
  variancePercentage: decimal('variance_percentage', { precision: 5, scale: 2 }),
  
  // Sistema
  appliedAt: timestamp('applied_at').defaultNow().notNull(),
  appliedBy: uuid('applied_by')
});

// MÓDULO 9: FUNCIONALIDADES AVANÇADAS DE PREÇO
export const pricingTables = pgTable('pricing_tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Identificação
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Segmentação
  customerSegment: varchar('customer_segment', { length: 50 }), // enterprise, medium, small
  region: varchar('region', { length: 50 }),
  channel: varchar('channel', { length: 50 }), // direct, partner, online
  
  // Versão e validade
  version: varchar('version', { length: 20 }).notNull(),
  validFrom: timestamp('valid_from').notNull(),
  validTo: timestamp('valid_to'),
  
  // Status
  status: varchar('status', { length: 20 }).default('draft'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

export const pricingRules = pgTable('pricing_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  pricingTableId: uuid('pricing_table_id').notNull(),
  
  // Regra
  ruleName: varchar('rule_name', { length: 100 }).notNull(),
  ruleType: varchar('rule_type', { length: 30 }).notNull(), // automatic_margin, volume_discount, seasonal, special_customer
  
  // Condições
  conditions: jsonb('conditions'), // {minQuantity: 100, customerType: 'enterprise'}
  
  // Ações
  actionType: varchar('action_type', { length: 30 }).notNull(), // percentage_discount, fixed_discount, new_price, margin_adjustment
  actionValue: decimal('action_value', { precision: 12, scale: 2 }).notNull(),
  
  // Prioridade
  priority: integer('priority').default(1),
  
  // Sistema
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const priceHistories = pgTable('price_histories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Item
  itemType: varchar('item_type', { length: 30 }).notNull(),
  itemId: uuid('item_id').notNull(),
  
  // Preço
  oldPrice: decimal('old_price', { precision: 12, scale: 2 }),
  newPrice: decimal('new_price', { precision: 12, scale: 2 }).notNull(),
  priceChangePercentage: decimal('price_change_percentage', { precision: 5, scale: 2 }),
  
  // Motivo
  changeReason: varchar('change_reason', { length: 100 }),
  notes: text('notes'),
  
  // Sistema
  effectiveDate: timestamp('effective_date').notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  changedBy: uuid('changed_by').notNull()
});

// MÓDULO 10: COMPLIANCE E AUDITORIA
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Ação
  tableName: varchar('table_name', { length: 50 }).notNull(),
  recordId: uuid('record_id').notNull(),
  action: varchar('action', { length: 20 }).notNull(), // CREATE, UPDATE, DELETE, SELECT
  
  // Dados
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  changedFields: text('changed_fields').array(),
  
  // Contexto
  userId: uuid('user_id').notNull(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  sessionId: varchar('session_id', { length: 100 }),
  
  // Sistema
  timestamp: timestamp('timestamp').defaultNow().notNull()
});

export const certifications = pgTable('certifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Certificação
  name: varchar('name', { length: 200 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // quality, environmental, safety, regulatory
  issuingBody: varchar('issuing_body', { length: 200 }).notNull(),
  certificateNumber: varchar('certificate_number', { length: 100 }),
  
  // Aplicação
  scope: text('scope'), // Escopo da certificação
  applicableToAssetType: varchar('applicable_to_asset_type', { length: 50 }),
  applicableToPartType: varchar('applicable_to_part_type', { length: 50 }),
  
  // Validade
  issuedDate: timestamp('issued_date').notNull(),
  expirationDate: timestamp('expiration_date').notNull(),
  reminderDate: timestamp('reminder_date'),
  
  // Documentos
  documentPath: varchar('document_path', { length: 500 }),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'), // active, expired, suspended, cancelled
  
  // Sistema
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

export const complianceAlerts = pgTable('compliance_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Alerta
  alertType: varchar('alert_type', { length: 30 }).notNull(), // certification_expiry, regulatory_change, audit_due, recall
  severity: varchar('severity', { length: 20 }).default('medium'), // low, medium, high, critical
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  
  // Referência
  referenceType: varchar('reference_type', { length: 30 }), // certification, asset, part, supplier
  referenceId: uuid('reference_id'),
  
  // Datas
  alertDate: timestamp('alert_date').defaultNow().notNull(),
  dueDate: timestamp('due_date'),
  resolvedDate: timestamp('resolved_date'),
  
  // Status
  status: varchar('status', { length: 20 }).default('open'), // open, acknowledged, resolved, dismissed
  
  // Responsável
  assignedTo: uuid('assigned_to'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

// MÓDULO 11: DIFERENCIAIS AVANÇADOS
export const budgetSimulations = pgTable('budget_simulations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Simulação
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Cliente e contexto
  customerId: uuid('customer_id'),
  priceListId: uuid('price_list_id'),
  simulationDate: timestamp('simulation_date').defaultNow().notNull(),
  
  // Totais
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).default(0),
  discountAmount: decimal('discount_amount', { precision: 15, scale: 2 }).default(0),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default(0),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).default(0),
  
  // Status
  status: varchar('status', { length: 20 }).default('draft'), // draft, approved, converted, cancelled
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

export const budgetSimulationItems = pgTable('budget_simulation_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  simulationId: uuid('simulation_id').notNull(),
  
  // Item
  itemType: varchar('item_type', { length: 30 }).notNull(),
  itemId: uuid('item_id'),
  description: text('description').notNull(),
  
  // Quantidade e preço
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 5, scale: 2 }).default(0),
  totalPrice: decimal('total_price', { precision: 15, scale: 2 }).notNull(),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const dashboardConfigs = pgTable('dashboard_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(),
  
  // Configuração
  dashboardType: varchar('dashboard_type', { length: 30 }).notNull(), // operational, financial, executive
  layout: jsonb('layout'), // Configuração dos widgets e posições
  filters: jsonb('filters'), // Filtros padrão
  
  // Sistema
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const integrationApis = pgTable('integration_apis', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // API
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 30 }).notNull(), // erp, accounting, ecommerce, crm
  endpoint: varchar('endpoint', { length: 500 }).notNull(),
  method: varchar('method', { length: 10 }).default('POST'),
  
  // Autenticação
  authType: varchar('auth_type', { length: 20 }).notNull(), // api_key, oauth, basic
  authConfig: jsonb('auth_config'), // Configurações de autenticação
  
  // Mapeamento
  fieldMapping: jsonb('field_mapping'), // Mapeamento de campos
  
  // Status
  isActive: boolean('is_active').default(true),
  lastSync: timestamp('last_sync'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
});

export const offlineSync = pgTable('offline_sync', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(),
  
  // Dados offline
  tableName: varchar('table_name', { length: 50 }).notNull(),
  recordId: uuid('record_id').notNull(),
  action: varchar('action', { length: 20 }).notNull(), // CREATE, UPDATE, DELETE
  data: jsonb('data').notNull(),
  
  // Sincronização
  status: varchar('status', { length: 20 }).default('pending'), // pending, synced, error
  syncAttempts: integer('sync_attempts').default(0),
  lastSyncAttempt: timestamp('last_sync_attempt'),
  errorMessage: text('error_message'),
  
  // Sistema
  createdAt: timestamp('created_at').defaultNow().notNull()
});