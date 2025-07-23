import { pgTable, uuid, varchar, text, jsonb, integer, decimal, boolean, timestamp, date, index } from "drizzle-orm/pg-core";

// =====================================================
// MÓDULO 1: GESTÃO DE PEÇAS - SCHEMA COMPLETO
// =====================================================

// Categorias de peças
export const partCategories = pgTable('part_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  parent_category_id: uuid('parent_category_id'),
  hierarchy_level: integer('hierarchy_level').default(1),
  created_at: timestamp('created_at').defaultNow(),
  is_active: boolean('is_active').default(true)
});

// Especificações técnicas detalhadas
export const partSpecifications = pgTable('part_specifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  part_id: uuid('part_id').notNull(),
  
  // Dimensões físicas
  length_mm: decimal('length_mm', { precision: 10, scale: 2 }),
  width_mm: decimal('width_mm', { precision: 10, scale: 2 }),
  height_mm: decimal('height_mm', { precision: 10, scale: 2 }),
  weight_kg: decimal('weight_kg', { precision: 10, scale: 3 }),
  volume_m3: decimal('volume_m3', { precision: 10, scale: 6 }),
  
  // Especificações elétricas
  voltage_min: decimal('voltage_min', { precision: 8, scale: 2 }),
  voltage_max: decimal('voltage_max', { precision: 8, scale: 2 }),
  current_amperage: decimal('current_amperage', { precision: 8, scale: 2 }),
  power_watts: decimal('power_watts', { precision: 10, scale: 2 }),
  frequency_hz: decimal('frequency_hz', { precision: 8, scale: 2 }),
  
  // Especificações materiais
  material_composition: jsonb('material_composition'),
  hardness_scale: varchar('hardness_scale', { length: 50 }),
  hardness_value: decimal('hardness_value', { precision: 8, scale: 2 }),
  corrosion_resistance: varchar('corrosion_resistance', { length: 100 }),
  
  // Especificações ambientais
  operating_temp_min: decimal('operating_temp_min', { precision: 6, scale: 2 }),
  operating_temp_max: decimal('operating_temp_max', { precision: 6, scale: 2 }),
  storage_temp_min: decimal('storage_temp_min', { precision: 6, scale: 2 }),
  storage_temp_max: decimal('storage_temp_max', { precision: 6, scale: 2 }),
  humidity_tolerance: varchar('humidity_tolerance', { length: 50 }),
  ip_rating: varchar('ip_rating', { length: 10 }),
  
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Códigos de barras e identificação
export const partIdentification = pgTable('part_identification', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  part_id: uuid('part_id').notNull(),
  
  // Códigos de identificação
  internal_code: varchar('internal_code', { length: 50 }).notNull(),
  manufacturer_code: varchar('manufacturer_code', { length: 100 }),
  supplier_code: varchar('supplier_code', { length: 100 }),
  barcode_ean13: varchar('barcode_ean13', { length: 13 }),
  barcode_upc: varchar('barcode_upc', { length: 12 }),
  qr_code: text('qr_code'),
  rfid_tag: varchar('rfid_tag', { length: 100 }),
  
  // Códigos alternativos
  alternative_codes: jsonb('alternative_codes'),
  cross_reference_codes: jsonb('cross_reference_codes'),
  
  created_at: timestamp('created_at').defaultNow(),
  is_active: boolean('is_active').default(true)
});

// =====================================================
// MÓDULO 2: CONTROLE DE ESTOQUE MULTI-LOCALIZAÇÃO
// =====================================================

// Localizações de estoque
export const stockLocations = pgTable('stock_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Informações da localização
  location_code: varchar('location_code', { length: 20 }).notNull(),
  location_name: varchar('location_name', { length: 100 }).notNull(),
  location_type: varchar('location_type', { length: 50 }).notNull(), // warehouse, store, truck, customer
  
  // Endereço completo
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  postal_code: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 50 }).default('Brasil'),
  
  // Coordenadas GPS
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  
  // Configurações da localização
  is_main_warehouse: boolean('is_main_warehouse').default(false),
  allows_negative_stock: boolean('allows_negative_stock').default(false),
  requires_cycle_counting: boolean('requires_cycle_counting').default(true),
  
  created_at: timestamp('created_at').defaultNow(),
  is_active: boolean('is_active').default(true)
});

// Controle de estoque multi-localização
export const inventoryMultiLocation = pgTable('inventory_multi_location', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  part_id: uuid('part_id').notNull(),
  location_id: uuid('location_id').notNull(),
  
  // Quantidades
  current_quantity: integer('current_quantity').default(0),
  reserved_quantity: integer('reserved_quantity').default(0),
  available_quantity: integer('available_quantity').default(0),
  on_order_quantity: integer('on_order_quantity').default(0),
  
  // Níveis de estoque
  minimum_stock: integer('minimum_stock').default(0),
  maximum_stock: integer('maximum_stock').default(0),
  reorder_point: integer('reorder_point').default(0),
  economic_order_quantity: integer('economic_order_quantity').default(0),
  safety_stock: integer('safety_stock').default(0),
  
  // Custo e valor
  unit_cost: decimal('unit_cost', { precision: 10, scale: 2 }),
  total_value: decimal('total_value', { precision: 15, scale: 2 }),
  average_cost: decimal('average_cost', { precision: 10, scale: 2 }),
  
  // Controle de lotes
  lot_control_enabled: boolean('lot_control_enabled').default(false),
  serial_control_enabled: boolean('serial_control_enabled').default(false),
  expiry_control_enabled: boolean('expiry_control_enabled').default(false),
  
  // Datas de controle
  last_movement_date: timestamp('last_movement_date'),
  last_count_date: date('last_count_date'),
  next_count_date: date('next_count_date'),
  
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Movimentações de estoque detalhadas
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Referências
  part_id: uuid('part_id').notNull(),
  location_id: uuid('location_id').notNull(),
  movement_number: varchar('movement_number', { length: 50 }).notNull(),
  
  // Tipo de movimentação
  movement_type: varchar('movement_type', { length: 50 }).notNull(), // IN, OUT, TRANSFER, ADJUSTMENT, RETURN
  movement_subtype: varchar('movement_subtype', { length: 50 }), // PURCHASE, SALE, PRODUCTION, CONSUMPTION
  
  // Quantidades
  quantity: integer('quantity').notNull(),
  unit_cost: decimal('unit_cost', { precision: 10, scale: 2 }),
  total_cost: decimal('total_cost', { precision: 15, scale: 2 }),
  
  // Transferências
  source_location_id: uuid('source_location_id'),
  destination_location_id: uuid('destination_location_id'),
  
  // Controle de lotes e série
  lot_number: varchar('lot_number', { length: 50 }),
  serial_number: varchar('serial_number', { length: 100 }),
  expiry_date: date('expiry_date'),
  
  // Documentos de referência
  reference_document_type: varchar('reference_document_type', { length: 50 }),
  reference_document_number: varchar('reference_document_number', { length: 100 }),
  invoice_number: varchar('invoice_number', { length: 100 }),
  
  // Metadados
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  created_by: uuid('created_by').notNull(),
  approved_by: uuid('approved_by'),
  approved_at: timestamp('approved_at')
});

// Reservas de estoque
export const stockReservations = pgTable('stock_reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  part_id: uuid('part_id').notNull(),
  location_id: uuid('location_id').notNull(),
  
  // Informações da reserva
  reservation_number: varchar('reservation_number', { length: 50 }).notNull(),
  reservation_type: varchar('reservation_type', { length: 50 }).notNull(), // SERVICE, SALE, TRANSFER, MAINTENANCE
  reference_id: uuid('reference_id'), // ID do serviço, venda, etc.
  
  // Quantidades
  reserved_quantity: integer('reserved_quantity').notNull(),
  consumed_quantity: integer('consumed_quantity').default(0),
  remaining_quantity: integer('remaining_quantity').notNull(),
  
  // Datas
  reservation_date: timestamp('reservation_date').defaultNow(),
  expiry_date: timestamp('expiry_date'),
  consumed_date: timestamp('consumed_date'),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'), // active, expired, consumed, cancelled
  
  created_at: timestamp('created_at').defaultNow(),
  created_by: uuid('created_by').notNull()
});

// =====================================================
// MÓDULO 3: GESTÃO DE FORNECEDORES AVANÇADA
// =====================================================

// Catálogo de produtos dos fornecedores
export const supplierCatalog = pgTable('supplier_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  supplier_id: uuid('supplier_id').notNull(),
  part_id: uuid('part_id').notNull(),
  
  // Códigos do fornecedor
  supplier_part_number: varchar('supplier_part_number', { length: 100 }).notNull(),
  supplier_description: text('supplier_description'),
  manufacturer_part_number: varchar('manufacturer_part_number', { length: 100 }),
  
  // Preços e condições
  unit_price: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  minimum_order_quantity: integer('minimum_order_quantity').default(1),
  package_quantity: integer('package_quantity').default(1),
  lead_time_days: integer('lead_time_days').default(0),
  
  // Descontos por quantidade
  quantity_breaks: jsonb('quantity_breaks'), // [{qty: 100, price: 10.50}, {qty: 500, price: 9.80}]
  
  // Validade e condições
  price_valid_from: date('price_valid_from'),
  price_valid_until: date('price_valid_until'),
  payment_terms: varchar('payment_terms', { length: 100 }),
  
  // Status
  is_preferred: boolean('is_preferred').default(false),
  is_active: boolean('is_active').default(true),
  last_updated: timestamp('last_updated').defaultNow()
});

// Histórico de compras detalhado
export const purchaseHistory = pgTable('purchase_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  supplier_id: uuid('supplier_id').notNull(),
  part_id: uuid('part_id').notNull(),
  
  // Informações da compra
  purchase_order_number: varchar('purchase_order_number', { length: 100 }),
  invoice_number: varchar('invoice_number', { length: 100 }),
  purchase_date: date('purchase_date').notNull(),
  delivery_date: date('delivery_date'),
  
  // Quantidades e preços
  ordered_quantity: integer('ordered_quantity').notNull(),
  delivered_quantity: integer('delivered_quantity').default(0),
  unit_price: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  total_value: decimal('total_value', { precision: 15, scale: 2 }).notNull(),
  
  // Avaliação de qualidade
  quality_rating: integer('quality_rating'), // 1-5
  delivery_rating: integer('delivery_rating'), // 1-5
  service_rating: integer('service_rating'), // 1-5
  overall_rating: decimal('overall_rating', { precision: 3, scale: 2 }),
  
  // Problemas e observações
  quality_issues: text('quality_issues'),
  delivery_issues: text('delivery_issues'),
  observations: text('observations'),
  
  created_at: timestamp('created_at').defaultNow()
});

// Avaliação de performance dos fornecedores
export const supplierPerformance = pgTable('supplier_performance', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  supplier_id: uuid('supplier_id').notNull(),
  
  // Período de avaliação
  evaluation_period_start: date('evaluation_period_start').notNull(),
  evaluation_period_end: date('evaluation_period_end').notNull(),
  
  // Métricas de qualidade
  quality_score: decimal('quality_score', { precision: 5, scale: 2 }),
  defect_rate: decimal('defect_rate', { precision: 5, scale: 4 }),
  return_rate: decimal('return_rate', { precision: 5, scale: 4 }),
  quality_certifications: text('quality_certifications').array(),
  
  // Métricas de entrega
  on_time_delivery_rate: decimal('on_time_delivery_rate', { precision: 5, scale: 2 }),
  average_lead_time: integer('average_lead_time'),
  delivery_reliability: decimal('delivery_reliability', { precision: 5, scale: 2 }),
  
  // Métricas comerciais
  price_competitiveness: decimal('price_competitiveness', { precision: 5, scale: 2 }),
  payment_compliance: decimal('payment_compliance', { precision: 5, scale: 2 }),
  total_spend: decimal('total_spend', { precision: 15, scale: 2 }),
  
  // Métricas de serviço
  responsiveness_score: decimal('responsiveness_score', { precision: 5, scale: 2 }),
  technical_support_score: decimal('technical_support_score', { precision: 5, scale: 2 }),
  communication_score: decimal('communication_score', { precision: 5, scale: 2 }),
  
  // Score geral
  overall_score: decimal('overall_score', { precision: 5, scale: 2 }),
  performance_tier: varchar('performance_tier', { length: 20 }), // A, B, C, D
  
  // Ações recomendadas
  improvement_areas: text('improvement_areas').array(),
  action_plan: text('action_plan'),
  next_review_date: date('next_review_date'),
  
  created_at: timestamp('created_at').defaultNow(),
  created_by: uuid('created_by').notNull()
});

// =====================================================
// MÓDULO 4: PLANEJAMENTO E COMPRAS
// =====================================================

// Análise de demanda
export const demandAnalysis = pgTable('demand_analysis', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  part_id: uuid('part_id').notNull(),
  
  // Período de análise
  analysis_period: varchar('analysis_period', { length: 20 }).notNull(), // monthly, quarterly, yearly
  period_start: date('period_start').notNull(),
  period_end: date('period_end').notNull(),
  
  // Dados históricos
  total_consumption: integer('total_consumption').default(0),
  average_monthly_consumption: decimal('average_monthly_consumption', { precision: 10, scale: 2 }),
  peak_consumption: integer('peak_consumption').default(0),
  minimum_consumption: integer('minimum_consumption').default(0),
  
  // Sazonalidade
  seasonality_factor: decimal('seasonality_factor', { precision: 5, scale: 2 }),
  seasonal_pattern: jsonb('seasonal_pattern'), // {jan: 1.2, feb: 0.8, ...}
  trend_direction: varchar('trend_direction', { length: 20 }), // increasing, decreasing, stable
  trend_rate: decimal('trend_rate', { precision: 5, scale: 2 }),
  
  // Previsão
  forecasted_demand_next_month: integer('forecasted_demand_next_month'),
  forecasted_demand_next_quarter: integer('forecasted_demand_next_quarter'),
  forecasted_demand_next_year: integer('forecasted_demand_next_year'),
  forecast_accuracy: decimal('forecast_accuracy', { precision: 5, scale: 2 }),
  
  created_at: timestamp('created_at').defaultNow(),
  calculated_by: varchar('calculated_by', { length: 50 }).default('system')
});

// Ordens de compra com aprovações
export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Identificação
  po_number: varchar('po_number', { length: 50 }).notNull(),
  po_type: varchar('po_type', { length: 30 }).default('standard'), // standard, emergency, blanket, contract
  priority: varchar('priority', { length: 20 }).default('normal'), // low, normal, high, urgent
  
  // Fornecedor
  supplier_id: uuid('supplier_id').notNull(),
  supplier_contact_id: uuid('supplier_contact_id'),
  quotation_id: uuid('quotation_id'),
  
  // Status e datas
  status: varchar('status', { length: 30 }).default('draft'), // draft, pending_approval, approved, sent, acknowledged, shipped, received, closed, cancelled
  order_date: timestamp('order_date').defaultNow(),
  required_date: date('required_date'),
  promised_date: date('promised_date'),
  actual_delivery_date: date('actual_delivery_date'),
  
  // Valores
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }),
  tax_amount: decimal('tax_amount', { precision: 15, scale: 2 }),
  shipping_cost: decimal('shipping_cost', { precision: 15, scale: 2 }),
  total_amount: decimal('total_amount', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  
  // Termos e condições
  payment_terms: varchar('payment_terms', { length: 100 }),
  delivery_terms: varchar('delivery_terms', { length: 100 }),
  shipping_method: varchar('shipping_method', { length: 50 }),
  
  // Endereços
  billing_address: jsonb('billing_address'),
  shipping_address: jsonb('shipping_address'),
  
  // Observações
  internal_notes: text('internal_notes'),
  supplier_notes: text('supplier_notes'),
  special_instructions: text('special_instructions'),
  
  // Workflow de aprovação
  requires_approval: boolean('requires_approval').default(true),
  approval_level_required: integer('approval_level_required').default(1),
  current_approval_level: integer('current_approval_level').default(0),
  
  // Auditoria
  created_at: timestamp('created_at').defaultNow(),
  created_by: uuid('created_by').notNull(),
  last_modified_at: timestamp('last_modified_at').defaultNow(),
  last_modified_by: uuid('last_modified_by'),
  
  // Aprovações
  approved_at: timestamp('approved_at'),
  approved_by: uuid('approved_by'),
  sent_to_supplier_at: timestamp('sent_to_supplier_at'),
  
  is_active: boolean('is_active').default(true)
});

// =====================================================
// ÍNDICES PARA PERFORMANCE
// =====================================================

// Índices para performance das consultas
export const partCategoriesIndex = index('idx_part_categories_tenant').on(partCategories.tenantId);
export const partSpecsIndex = index('idx_part_specs_tenant_part').on(partSpecifications.tenantId, partSpecifications.part_id);
export const stockLocationsIndex = index('idx_stock_locations_tenant').on(stockLocations.tenantId);
export const inventoryMultiIndex = index('idx_inventory_multi_tenant_part_location').on(inventoryMultiLocation.tenantId, inventoryMultiLocation.part_id, inventoryMultiLocation.location_id);
export const stockMovementsIndex = index('idx_stock_movements_tenant_part_date').on(stockMovements.tenantId, stockMovements.part_id, stockMovements.created_at);
export const supplierCatalogIndex = index('idx_supplier_catalog_tenant_supplier').on(supplierCatalog.tenantId, supplierCatalog.supplier_id);
export const purchaseHistoryIndex = index('idx_purchase_history_tenant_supplier_date').on(purchaseHistory.tenantId, purchaseHistory.supplier_id, purchaseHistory.purchase_date);
export const demandAnalysisIndex = index('idx_demand_analysis_tenant_part_period').on(demandAnalysis.tenantId, demandAnalysis.part_id, demandAnalysis.period_start);
export const purchaseOrdersIndex = index('idx_purchase_orders_tenant_status_date').on(purchaseOrders.tenantId, purchaseOrders.status, purchaseOrders.order_date);