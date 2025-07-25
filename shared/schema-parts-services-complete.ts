import { pgTable, uuid, varchar, text, timestamp, boolean, numeric, jsonb, pgEnum } from "drizzle-orm/pg-core";

// ============================================
// ENUMS ESPECÍFICOS PARA PEÇAS E SERVIÇOS
// ============================================

export const itemTypeEnum = pgEnum('item_type', ['material', 'service']);
export const unitOfMeasureEnum = pgEnum('unit_of_measure', ['unit', 'kg', 'm', 'm2', 'm3', 'liter', 'hour', 'day', 'month']);
export const itemStatusEnum = pgEnum('item_status', ['active', 'inactive', 'discontinued']);
export const supplierStatusEnum = pgEnum('supplier_status', ['active', 'inactive', 'blocked']);
export const movementTypeEnum = pgEnum('movement_type', ['in', 'out', 'transfer', 'adjustment', 'return']);

// ============================================
// TABELA PRINCIPAL: ITEMS
// Conforme especificação do anexo
// ============================================

export const items = pgTable("items", {
  // Campos básicos obrigatórios
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Campos especificados no anexo
  active: boolean("active").default(true).notNull(), // Ativo (SIM/NÃO)
  type: itemTypeEnum("type").notNull(), // Tipo: Material/Serviço
  title: varchar("title", { length: 255 }).notNull(), // Nome
  integrationCode: varchar("integration_code", { length: 100 }), // Código de Integração
  description: text("description"), // Descrição
  unitOfMeasure: unitOfMeasureEnum("unit_of_measure").notNull(), // Unidade de Medida
  defaultMaintenancePlan: text("default_maintenance_plan"), // Plano de manutenção padrão
  itemGroup: varchar("item_group", { length: 100 }), // Grupo
  defaultChecklist: jsonb("default_checklist"), // Checklist Padrão (JSON)
  attachments: jsonb("attachments"), // Anexos (upload de arquivos)
  
  // Campos adicionais para controle
  internalCode: varchar("internal_code", { length: 100 }).notNull(),
  manufacturerCode: varchar("manufacturer_code", { length: 100 }),
  barcode: varchar("barcode", { length: 100 }),
  qrCode: varchar("qr_code", { length: 255 }),
  status: itemStatusEnum("status").default('active').notNull(),
  minimumStock: numeric("minimum_stock", { precision: 10, scale: 2 }),
  maximumStock: numeric("maximum_stock", { precision: 10, scale: 2 }),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
  weight: numeric("weight", { precision: 10, scale: 3 }),
  dimensions: jsonb("dimensions"), // {length, width, height}
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  specifications: jsonb("specifications"),
  warrantyMonths: numeric("warranty_months", { precision: 3, scale: 0 }),
  tags: jsonb("tags"), // Array de tags
  customFields: jsonb("custom_fields"),
  
  // Campos de auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

// ============================================
// VÍNCULOS ENTRE ITENS (conforme anexo)
// ============================================

export const itemLinks = pgTable("item_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  parentItemId: uuid("parent_item_id").notNull(),
  childItemId: uuid("child_item_id").notNull(),
  linkType: varchar("link_type", { length: 50 }).notNull(), // 'component', 'alternative', 'upgrade', 'kit'
  quantity: numeric("quantity", { precision: 10, scale: 2 }).default("1"),
  description: text("description"),
  isOptional: boolean("is_optional").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// VÍNCULOS COM EMPRESAS CLIENTES (conforme anexo)
// ============================================

export const itemClientLinks = pgTable("item_client_links", {
  id: uuid("id").primaryKey().defaultRandom(), // ID (gerado automaticamente)
  tenantId: uuid("tenant_id").notNull(),
  itemId: uuid("item_id").notNull(),
  clientId: uuid("client_id").notNull(), // Cliente (vinculado ao módulo empresa cliente)
  
  // Campos específicos conforme anexo
  nickname: varchar("nickname", { length: 255 }), // Apelido
  sku: varchar("sku", { length: 100 }), // SKU
  barcode: varchar("barcode", { length: 100 }), // Código de barras
  qrCode: varchar("qr_code", { length: 255 }), // Código QR
  isAsset: boolean("is_asset").default(false), // Asset (SIM/NÃO)
  
  // Campos adicionais para gestão
  clientItemCode: varchar("client_item_code", { length: 100 }),
  clientDescription: text("client_description"),
  clientPrice: numeric("client_price", { precision: 10, scale: 2 }),
  contractedQuantity: numeric("contracted_quantity", { precision: 10, scale: 2 }),
  minimumOrderQuantity: numeric("minimum_order_quantity", { precision: 10, scale: 2 }),
  leadTimeDays: numeric("lead_time_days", { precision: 3, scale: 0 }),
  warrantyMonths: numeric("warranty_months", { precision: 3, scale: 0 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// VÍNCULOS COM FORNECEDORES (conforme anexo)
// ============================================

export const itemSupplierLinks = pgTable("item_supplier_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  itemId: uuid("item_id").notNull(),
  supplierId: uuid("supplier_id").notNull(),
  
  // Campos específicos conforme anexo
  partNumber: varchar("part_number", { length: 100 }).notNull(), // Part Number
  supplierDescription: text("supplier_description"), // Descrição
  qrCode: varchar("qr_code", { length: 255 }), // Código de QR
  barcode: varchar("barcode", { length: 100 }), // Código de Barras
  
  // Campos adicionais para gestão
  supplierItemCode: varchar("supplier_item_code", { length: 100 }),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
  minimumOrderQuantity: numeric("minimum_order_quantity", { precision: 10, scale: 2 }),
  leadTimeDays: numeric("lead_time_days", { precision: 3, scale: 0 }),
  packageSize: numeric("package_size", { precision: 10, scale: 2 }),
  packageUnit: varchar("package_unit", { length: 50 }),
  warrantyMonths: numeric("warranty_months", { precision: 3, scale: 0 }),
  catalogPage: varchar("catalog_page", { length: 100 }),
  notes: text("notes"),
  isPreferred: boolean("is_preferred").default(false),
  isActive: boolean("is_active").default(true),
  lastPriceUpdate: timestamp("last_price_update"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// FORNECEDORES EXPANDIDOS
// ============================================

export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Dados básicos
  name: varchar("name", { length: 255 }).notNull(),
  supplierCode: varchar("supplier_code", { length: 50 }).notNull(),
  tradeName: varchar("trade_name", { length: 255 }),
  documentNumber: varchar("document_number", { length: 20 }), // CNPJ/CPF
  stateRegistration: varchar("state_registration", { length: 20 }),
  municipalRegistration: varchar("municipal_registration", { length: 20 }),
  
  // Contato
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  cellphone: varchar("cellphone", { length: 20 }),
  website: varchar("website", { length: 255 }),
  
  // Endereço
  zipCode: varchar("zip_code", { length: 10 }),
  address: text("address"),
  addressNumber: varchar("address_number", { length: 20 }),
  complement: varchar("complement", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  country: varchar("country", { length: 100 }).default('Brasil'),
  
  // Dados comerciais
  status: supplierStatusEnum("status").default('active').notNull(),
  supplierType: varchar("supplier_type", { length: 50 }), // 'parts', 'services', 'both'
  paymentTerms: varchar("payment_terms", { length: 100 }),
  creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }),
  deliveryTerms: text("delivery_terms"),
  notes: text("notes"),
  
  // Dados do contato principal
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  contactPosition: varchar("contact_position", { length: 100 }),
  
  // Classificação e avaliação
  category: varchar("category", { length: 100 }),
  rating: numeric("rating", { precision: 2, scale: 1 }), // 1.0 a 5.0
  certifications: jsonb("certifications"), // ISO, etc.
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

// ============================================
// CATÁLOGO DE PRODUTOS DOS FORNECEDORES
// ============================================

export const supplierCatalog = pgTable("supplier_catalog", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  supplierId: uuid("supplier_id").notNull(),
  
  // Produto no catálogo do fornecedor
  supplierItemCode: varchar("supplier_item_code", { length: 100 }).notNull(),
  supplierItemName: varchar("supplier_item_name", { length: 255 }).notNull(),
  supplierDescription: text("supplier_description"),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  partNumber: varchar("part_number", { length: 100 }),
  barcode: varchar("barcode", { length: 100 }),
  qrCode: varchar("qr_code", { length: 255 }),
  
  // Preços e condições
  listPrice: numeric("list_price", { precision: 10, scale: 2 }),
  discountedPrice: numeric("discounted_price", { precision: 10, scale: 2 }),
  minimumOrderQuantity: numeric("minimum_order_quantity", { precision: 10, scale: 2 }),
  packageSize: numeric("package_size", { precision: 10, scale: 2 }),
  packageUnit: varchar("package_unit", { length: 50 }),
  leadTimeDays: numeric("lead_time_days", { precision: 3, scale: 0 }),
  
  // Especificações
  unitOfMeasure: unitOfMeasureEnum("unit_of_measure"),
  weight: numeric("weight", { precision: 10, scale: 3 }),
  dimensions: jsonb("dimensions"),
  specifications: jsonb("specifications"),
  datasheet: varchar("datasheet", { length: 255 }),
  image: varchar("image", { length: 255 }),
  
  // Controle
  isActive: boolean("is_active").default(true),
  isAvailable: boolean("is_available").default(true),
  availabilityDate: timestamp("availability_date"),
  lastPriceUpdate: timestamp("last_price_update"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// STOCK MOVEMENTS (MOVIMENTAÇÕES)
// ============================================

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  itemId: uuid("item_id").notNull(),
  locationId: uuid("location_id").notNull(),
  
  // Dados da movimentação
  movementType: movementTypeEnum("movement_type").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }),
  
  // Referências
  referenceNumber: varchar("reference_number", { length: 100 }),
  referenceType: varchar("reference_type", { length: 50 }), // 'purchase_order', 'work_order', 'transfer', etc.
  referenceId: uuid("reference_id"),
  
  // Localização origem/destino para transferências
  fromLocationId: uuid("from_location_id"),
  toLocationId: uuid("to_location_id"),
  
  // Dados adicionais
  reason: varchar("reason", { length: 255 }),
  notes: text("notes"),
  batchNumber: varchar("batch_number", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  expirationDate: timestamp("expiration_date"),
  
  // Controle
  isConfirmed: boolean("is_confirmed").default(false),
  confirmedAt: timestamp("confirmed_at"),
  confirmedBy: uuid("confirmed_by"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by").notNull(),
});

// ============================================
// RESERVAS DE ESTOQUE
// ============================================

export const stockReservations = pgTable("stock_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  itemId: uuid("item_id").notNull(),
  locationId: uuid("location_id").notNull(),
  
  // Dados da reserva
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  reservedFor: varchar("reserved_for", { length: 50 }).notNull(), // 'work_order', 'customer', 'project'
  referenceId: uuid("reference_id").notNull(),
  referenceName: varchar("reference_name", { length: 255 }),
  
  // Período da reserva
  reservationDate: timestamp("reservation_date").defaultNow().notNull(),
  expectedUseDate: timestamp("expected_use_date"),
  expirationDate: timestamp("expiration_date"),
  
  // Status
  status: varchar("status", { length: 50 }).default('active'), // 'active', 'used', 'cancelled', 'expired'
  notes: text("notes"),
  
  // Controle
  usedQuantity: numeric("used_quantity", { precision: 10, scale: 2 }).default("0"),
  usedAt: timestamp("used_at"),
  usedBy: uuid("used_by"),
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: uuid("cancelled_by"),
  cancellationReason: text("cancellation_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by").notNull(),
});

// ============================================
// KITS DE SERVIÇO
// ============================================

export const serviceKits = pgTable("service_kits", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Dados do kit
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  description: text("description"),
  kitType: varchar("kit_type", { length: 50 }).notNull(), // 'maintenance', 'installation', 'repair'
  
  // Aplicação
  equipmentType: varchar("equipment_type", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  maintenanceType: varchar("maintenance_type", { length: 100 }), // 'preventive', 'corrective'
  
  // Controle
  isActive: boolean("is_active").default(true),
  version: varchar("version", { length: 20 }).default('1.0'),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export const serviceKitItems = pgTable("service_kit_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  kitId: uuid("kit_id").notNull(),
  itemId: uuid("item_id").notNull(),
  
  // Quantidade e especificações
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  isOptional: boolean("is_optional").default(false),
  isAlternative: boolean("is_alternative").default(false),
  alternativeGroup: varchar("alternative_group", { length: 50 }),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type ItemLink = typeof itemLinks.$inferSelect;
export type ItemClientLink = typeof itemClientLinks.$inferSelect;
export type ItemSupplierLink = typeof itemSupplierLinks.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type SupplierCatalogItem = typeof supplierCatalog.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type StockReservation = typeof stockReservations.$inferSelect;
export type ServiceKit = typeof serviceKits.$inferSelect;