
import { pgTable, uuid, varchar, text, jsonb, integer, decimal, boolean, timestamp, date, index } from "drizzle-orm/pg-core";

// =====================================================
// SCHEMA UNIFICADO PEÇAS E SERVIÇOS - IMPLEMENTAÇÃO GRADUAL
// =====================================================

// ETAPA 1: TABELAS CORE JÁ IMPLEMENTADAS
export const parts = pgTable('parts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Identificação
  internal_code: varchar('internal_code', { length: 100 }).notNull(),
  manufacturer_code: varchar('manufacturer_code', { length: 100 }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Classificação
  category: varchar('category', { length: 100 }).default('Geral'),
  subcategory: varchar('subcategory', { length: 100 }),
  abc_classification: varchar('abc_classification', { length: 1 }).default('B'),
  
  // Preços
  cost_price: decimal('cost_price', { precision: 10, scale: 2 }),
  sale_price: decimal('sale_price', { precision: 10, scale: 2 }),
  margin_percentage: decimal('margin_percentage', { precision: 5, scale: 2 }),
  
  // Controle
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Identificação
  supplier_code: varchar('supplier_code', { length: 50 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  trade_name: varchar('trade_name', { length: 200 }),
  document_number: varchar('document_number', { length: 20 }),
  
  // Contato
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  
  // Endereço
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  country: varchar('country', { length: 50 }).default('Brasil'),
  
  // Controle
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// ETAPA 1: LOCALIZAÇÕES DE ESTOQUE (Implementar nesta etapa)
export const stockLocations = pgTable('stock_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Identificação
  location_code: varchar('location_code', { length: 20 }).notNull(),
  location_name: varchar('location_name', { length: 100 }).notNull(),
  location_type: varchar('location_type', { length: 50 }).notNull(), // warehouse, store, truck, customer
  
  // Endereço
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  postal_code: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 50 }).default('Brasil'),
  
  // GPS
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  
  // Configurações
  is_main_warehouse: boolean('is_main_warehouse').default(false),
  allows_negative_stock: boolean('allows_negative_stock').default(false),
  
  // Controle
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// ETAPA 1: INVENTÁRIO MULTI-LOCALIZAÇÃO (Implementar nesta etapa)
export const inventoryMultiLocation = pgTable('inventory_multi_location', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  part_id: uuid('part_id').notNull().references(() => parts.id),
  location_id: uuid('location_id').notNull().references(() => stockLocations.id),
  
  // Quantidades
  current_quantity: integer('current_quantity').default(0),
  reserved_quantity: integer('reserved_quantity').default(0),
  available_quantity: integer('available_quantity').default(0),
  on_order_quantity: integer('on_order_quantity').default(0),
  
  // Níveis de estoque
  minimum_stock: integer('minimum_stock').default(0),
  maximum_stock: integer('maximum_stock').default(0),
  reorder_point: integer('reorder_point').default(0),
  safety_stock: integer('safety_stock').default(0),
  
  // Custos
  unit_cost: decimal('unit_cost', { precision: 10, scale: 2 }),
  total_value: decimal('total_value', { precision: 15, scale: 2 }),
  average_cost: decimal('average_cost', { precision: 10, scale: 2 }),
  
  // Controle
  last_movement_date: timestamp('last_movement_date'),
  last_count_date: date('last_count_date'),
  
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// ETAPA 2: MOVIMENTAÇÕES DE ESTOQUE (Próxima etapa)
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Referências
  part_id: uuid('part_id').notNull().references(() => parts.id),
  location_id: uuid('location_id').notNull().references(() => stockLocations.id),
  movement_number: varchar('movement_number', { length: 50 }).notNull(),
  
  // Tipo de movimentação
  movement_type: varchar('movement_type', { length: 50 }).notNull(), // IN, OUT, TRANSFER, ADJUSTMENT
  movement_subtype: varchar('movement_subtype', { length: 50 }),
  
  // Quantidades
  quantity: integer('quantity').notNull(),
  unit_cost: decimal('unit_cost', { precision: 10, scale: 2 }),
  total_cost: decimal('total_cost', { precision: 15, scale: 2 }),
  
  // Transferências
  source_location_id: uuid('source_location_id').references(() => stockLocations.id),
  destination_location_id: uuid('destination_location_id').references(() => stockLocations.id),
  
  // Documentos
  reference_document_type: varchar('reference_document_type', { length: 50 }),
  reference_document_number: varchar('reference_document_number', { length: 100 }),
  
  // Observações
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  created_by: uuid('created_by').notNull()
});

// ÍNDICES PARA PERFORMANCE
export const partsIndex = index('idx_parts_tenant_code').on(parts.tenantId, parts.internal_code);
export const suppliersIndex = index('idx_suppliers_tenant_code').on(suppliers.tenantId, suppliers.supplier_code);
export const stockLocationsIndex = index('idx_stock_locations_tenant').on(stockLocations.tenantId);
export const inventoryMultiIndex = index('idx_inventory_multi_tenant_part_location').on(
  inventoryMultiLocation.tenantId, 
  inventoryMultiLocation.part_id, 
  inventoryMultiLocation.location_id
);
export const stockMovementsIndex = index('idx_stock_movements_tenant_part_date').on(
  stockMovements.tenantId, 
  stockMovements.part_id, 
  stockMovements.created_at
);
