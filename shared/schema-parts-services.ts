import { pgTable, text, uuid, timestamp, integer, decimal, boolean, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// MÓDULO 1: GESTÃO DE ITENS
// ============================================

// Tabela principal de itens (peças e serviços)
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Informações básicas obrigatórias conforme requisitos
  active: boolean("active").notNull().default(true), // Ativo (SIM/NÃO)
  type: varchar("type", { length: 50 }).notNull(), // Tipo: Material/Serviço
  title: varchar("title", { length: 255 }).notNull(), // Nome
  integrationCode: varchar("integration_code", { length: 100 }), // Código de Integração
  description: text("description"), // Descrição
  measurementUnit: varchar("measurement_unit", { length: 50 }).default("UN"), // Unidade de Medida
  defaultMaintenancePlan: text("default_maintenance_plan"), // Plano de manutenção padrão
  itemGroup: varchar("item_group", { length: 100 }), // Grupo
  defaultChecklist: text("default_checklist"), // Checklist Padrão
  
  // Campos adicionais para organização
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  
  // Códigos de identificação
  internalCode: varchar("internal_code", { length: 100 }).notNull(),
  manufacturerCode: varchar("manufacturer_code", { length: 100 }),
  supplierCode: varchar("supplier_code", { length: 100 }),
  barcode: varchar("barcode", { length: 255 }),
  sku: varchar("sku", { length: 100 }),
  
  // Especificações técnicas
  manufacturer: varchar("manufacturer", { length: 255 }),
  model: varchar("model", { length: 255 }),
  specifications: jsonb("specifications"),
  technicalDetails: text("technical_details"),
  
  
  
  // Informações comerciais
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  
  // Classificação ABC
  abcClassification: varchar("abc_classification", { length: 1 }), // A, B, C
  criticality: varchar("criticality", { length: 20 }), // low, medium, high, critical
  
  // Status e controle
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, discontinued
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  
  // Metadados adicionais
  tags: text("tags").array(),
  customFields: jsonb("custom_fields"),
  notes: text("notes")
});

// Tabela de vínculos item-cliente com campos específicos
export const itemCustomerLinks = pgTable("item_customer_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Relacionamentos
  itemId: uuid("item_id").notNull().references(() => items.id),
  customerId: uuid("customer_id").notNull(), // vinculado ao módulo empresa cliente
  
  // Campos específicos por cliente
  nickname: varchar("nickname", { length: 255 }),
  customerSku: varchar("customer_sku", { length: 100 }),
  barcode: varchar("barcode", { length: 255 }),
  qrCode: varchar("qr_code", { length: 255 }),
  isAsset: boolean("is_asset").default(false),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by")
});

// Tabela de vínculos item-fornecedor
export const itemSupplierLinks = pgTable("item_supplier_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Relacionamentos
  itemId: uuid("item_id").notNull().references(() => items.id),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
  
  // Campos específicos do fornecedor
  partNumber: varchar("part_number", { length: 100 }),
  supplierDescription: text("supplier_description"),
  supplierQrCode: varchar("supplier_qr_code", { length: 255 }),
  supplierBarcode: varchar("supplier_barcode", { length: 255 }),
  
  // Informações comerciais
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  minimumOrderQuantity: decimal("minimum_order_quantity", { precision: 10, scale: 2 }),
  leadTime: integer("lead_time"), // dias
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  isPreferred: boolean("is_preferred").default(false),
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by")
});

// Tabela de vínculos entre itens (substitutos, compatíveis, kits)
export const itemLinks = pgTable("item_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Relacionamento
  sourceItemId: uuid("source_item_id").notNull().references(() => items.id),
  targetItemId: uuid("target_item_id").notNull().references(() => items.id),
  
  // Tipo de vínculo
  linkType: varchar("link_type", { length: 50 }).notNull(), // substitute, compatible, part_of_kit, requires
  
  // Detalhes do vínculo
  description: text("description"),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).default("1"),
  isOptional: boolean("is_optional").default(false),
  priority: integer("priority").default(1),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by")
});

// Tabela de anexos para itens
export const itemAttachments = pgTable("item_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Relacionamento
  itemId: uuid("item_id").notNull().references(() => items.id),
  
  // Informações do arquivo
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  filePath: text("file_path").notNull(),
  
  // Categoria do anexo
  category: varchar("category", { length: 50 }).notNull(), // manual, datasheet, image, certificate, drawing
  description: text("description"),
  
  // Metadados
  isPublic: boolean("is_public").default(false),
  version: varchar("version", { length: 50 }),
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by")
});

// ============================================
// MÓDULO 2: CONTROLE DE ESTOQUE
// ============================================

// Localizações de estoque
export const stockLocations = pgTable("stock_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Informações da localização
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  description: text("description"),
  
  // Hierarquia de localização
  parentLocationId: uuid("parent_location_id"),
  locationPath: text("location_path"), // Exemplo: "Filial SP/Almoxarifado/Setor A/Prateleira 1"
  level: integer("level").default(0),
  
  // Detalhes físicos
  address: text("address"),
  coordinates: jsonb("coordinates"), // lat, lng
  capacity: jsonb("capacity"), // volume, weight, positions
  
  // Configurações
  isActive: boolean("is_active").notNull().default(true),
  allowNegativeStock: boolean("allow_negative_stock").default(false),
  requiresApproval: boolean("requires_approval").default(false),
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by")
});

// Níveis de estoque por item e localização
export const stockLevels = pgTable("stock_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Relacionamentos
  itemId: uuid("item_id").notNull().references(() => items.id),
  locationId: uuid("location_id").notNull().references(() => stockLocations.id),
  
  // Quantidades
  currentStock: decimal("current_stock", { precision: 15, scale: 4 }).notNull().default("0"),
  availableStock: decimal("available_stock", { precision: 15, scale: 4 }).notNull().default("0"),
  reservedStock: decimal("reserved_stock", { precision: 15, scale: 4 }).notNull().default("0"),
  
  // Níveis de controle
  minimumStock: decimal("minimum_stock", { precision: 15, scale: 4 }).default("0"),
  maximumStock: decimal("maximum_stock", { precision: 15, scale: 4 }),
  reorderPoint: decimal("reorder_point", { precision: 15, scale: 4 }),
  reorderQuantity: decimal("reorder_quantity", { precision: 15, scale: 4 }),
  
  // Custos
  averageCost: decimal("average_cost", { precision: 10, scale: 2 }),
  lastCost: decimal("last_cost", { precision: 10, scale: 2 }),
  
  // Auditoria
  lastMovementAt: timestamp("last_movement_at"),
  lastInventoryAt: timestamp("last_inventory_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Movimentações de estoque
export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Relacionamentos
  itemId: uuid("item_id").notNull().references(() => items.id),
  locationId: uuid("location_id").notNull().references(() => stockLocations.id),
  
  // Tipo de movimentação
  movementType: varchar("movement_type", { length: 50 }).notNull(), // in, out, transfer, adjustment, inventory
  reason: varchar("reason", { length: 100 }).notNull(), // purchase, sale, transfer, loss, adjustment, etc.
  
  // Quantidades
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 15, scale: 2 }),
  
  // Referências externas
  referenceType: varchar("reference_type", { length: 50 }), // purchase_order, sale_order, transfer, etc.
  referenceId: uuid("reference_id"),
  documentNumber: varchar("document_number", { length: 100 }),
  
  // Transferência (se aplicável)
  fromLocationId: uuid("from_location_id"),
  toLocationId: uuid("to_location_id"),
  
  // Detalhes
  description: text("description"),
  notes: text("notes"),
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by").notNull(),
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default("completed"), // pending, completed, cancelled
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at")
});

// ============================================
// MÓDULO 3: FORNECEDORES
// ============================================

// Fornecedores
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Informações básicas
  name: varchar("name", { length: 255 }).notNull(),
  tradeName: varchar("trade_name", { length: 255 }),
  supplierCode: varchar("supplier_code", { length: 50 }).notNull(),
  
  // Documentos
  documentNumber: varchar("document_number", { length: 50 }), // CNPJ/CPF
  stateRegistration: varchar("state_registration", { length: 50 }),
  municipalRegistration: varchar("municipal_registration", { length: 50 }),
  
  // Contato
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 255 }),
  
  // Endereço
  address: jsonb("address"), // street, number, complement, district, city, state, zipCode, country
  
  // Informações comerciais
  paymentTerms: varchar("payment_terms", { length: 100 }),
  deliveryTerms: varchar("delivery_terms", { length: 100 }),
  category: varchar("category", { length: 100 }),
  rating: integer("rating"), // 1-5
  
  // Status e configurações
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, blocked
  isActive: boolean("is_active").notNull().default(true),
  isPreferred: boolean("is_preferred").default(false),
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  
  // Metadados
  notes: text("notes"),
  customFields: jsonb("custom_fields")
});

// Catálogo de fornecedores (itens que cada fornecedor oferece)
export const supplierCatalog = pgTable("supplier_catalog", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Relacionamentos
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
  itemId: uuid("item_id").notNull().references(() => items.id),
  
  // Códigos do fornecedor
  supplierItemCode: varchar("supplier_item_code", { length: 100 }),
  supplierDescription: text("supplier_description"),
  
  // Preços e condições
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  minimumOrderQuantity: decimal("minimum_order_quantity", { precision: 10, scale: 2 }),
  leadTime: integer("lead_time"), // dias
  
  // Validade do preço
  priceValidFrom: timestamp("price_valid_from"),
  priceValidTo: timestamp("price_valid_to"),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  isPreferred: boolean("is_preferred").default(false),
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: uuid("updated_by")
});

// ============================================
// SCHEMAS ZOD PARA VALIDAÇÃO
// ============================================

// Insert schemas
export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemLinkSchema = createInsertSchema(itemLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemAttachmentSchema = createInsertSchema(itemAttachments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStockLocationSchema = createInsertSchema(stockLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStockLevelSchema = createInsertSchema(stockLevels).omit({
  id: true,
  updatedAt: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierCatalogSchema = createInsertSchema(supplierCatalog).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Types
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;

export type ItemLink = typeof itemLinks.$inferSelect;
export type InsertItemLink = z.infer<typeof insertItemLinkSchema>;

export type ItemAttachment = typeof itemAttachments.$inferSelect;
export type InsertItemAttachment = z.infer<typeof insertItemAttachmentSchema>;

export type StockLocation = typeof stockLocations.$inferSelect;
export type InsertStockLocation = z.infer<typeof insertStockLocationSchema>;

export type StockLevel = typeof stockLevels.$inferSelect;
export type InsertStockLevel = z.infer<typeof insertStockLevelSchema>;

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type SupplierCatalog = typeof supplierCatalog.$inferSelect;
export type InsertSupplierCatalog = z.infer<typeof insertSupplierCatalogSchema>;

export type ItemCustomerLink = typeof itemCustomerLinks.$inferSelect;
export type InsertItemCustomerLink = z.infer<typeof insertItemCustomerLinkSchema>;

export type ItemSupplierLink = typeof itemSupplierLinks.$inferSelect;
export type InsertItemSupplierLink = z.infer<typeof insertItemSupplierLinkSchema>;