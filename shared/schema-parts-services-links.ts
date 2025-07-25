import { pgTable, uuid, varchar, text, timestamp, boolean, numeric, jsonb } from "drizzle-orm/pg-core";

// ============================================
// TABELAS DE VÍNCULOS PARA PEÇAS E SERVIÇOS
// ============================================

// Vínculos item-item (um item pode ser vinculado a outro item)
export const itemLinks = pgTable("item_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Relacionamentos
  parentItemId: uuid("parent_item_id").notNull(), // Item principal
  childItemId: uuid("child_item_id").notNull(),   // Item vinculado
  
  // Detalhes do vínculo
  linkType: varchar("link_type", { length: 50 }).notNull(), // 'component', 'alternative', 'substitute', 'accessory'
  quantity: numeric("quantity", { precision: 10, scale: 2 }).default('1'),
  description: text("description"),
  isRequired: boolean("is_required").default(false),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  isActive: boolean("is_active").default(true).notNull(),
});

// Vínculos item-cliente (dados específicos por cliente)
export const itemCustomerLinks = pgTable("item_customer_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Relacionamentos
  itemId: uuid("item_id").notNull(),
  customerId: uuid("customer_id").notNull(), // Link para tabela customers
  
  // Campos específicos por cliente conforme anexo
  apelido: varchar("apelido", { length: 255 }), // Apelido
  sku: varchar("sku", { length: 100 }),         // SKU
  codigoBarras: varchar("codigo_barras", { length: 100 }), // Código de barras
  codigoQr: varchar("codigo_qr", { length: 255 }),         // Código QR
  isAsset: boolean("is_asset").default(false),              // Asset (SIM/NÃO)
  
  // Campos adicionais para gestão
  priceOverride: numeric("price_override", { precision: 10, scale: 2 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Vínculos item-fornecedor (dados específicos por fornecedor)
export const itemSupplierLinks = pgTable("item_supplier_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Relacionamentos
  itemId: uuid("item_id").notNull(),
  supplierId: uuid("supplier_id").notNull(),
  
  // Campos específicos por fornecedor conforme anexo
  partNumber: varchar("part_number", { length: 100 }),      // Part Number
  supplierDescription: text("supplier_description"),         // Descrição
  supplierCodigoQr: varchar("supplier_codigo_qr", { length: 255 }), // Código QR
  supplierCodigoBarras: varchar("supplier_codigo_barras", { length: 100 }), // Código de Barras
  
  // Campos comerciais
  supplierPrice: numeric("supplier_price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default('BRL'),
  minimumOrderQuantity: numeric("minimum_order_quantity", { precision: 10, scale: 2 }),
  leadTimeDays: numeric("lead_time_days", { precision: 3, scale: 0 }),
  
  // Status e metadados
  isPreferred: boolean("is_preferred").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Anexos para itens (upload de arquivos)
export const itemAttachments = pgTable("item_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Relacionamento
  itemId: uuid("item_id").notNull(),
  
  // Dados do arquivo
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: numeric("file_size", { precision: 12, scale: 0 }).notNull(), // bytes
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  
  // Categorização
  attachmentType: varchar("attachment_type", { length: 50 }).notNull(), // 'manual', 'image', 'drawing', 'certificate', 'other'
  description: text("description"),
  
  // Metadados
  uploadedBy: uuid("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Kits de peças (agrupamento de itens para manutenção)
export const serviceKits = pgTable("service_kits", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Dados básicos
  kitName: varchar("kit_name", { length: 255 }).notNull(),
  kitCode: varchar("kit_code", { length: 100 }).notNull(),
  description: text("description"),
  
  // Aplicação
  serviceType: varchar("service_type", { length: 100 }), // 'preventive', 'corrective', 'emergency'
  equipmentModel: varchar("equipment_model", { length: 100 }),
  maintenancePlan: varchar("maintenance_plan", { length: 100 }),
  
  // Metadados
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Itens dos kits
export const serviceKitItems = pgTable("service_kit_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Relacionamentos
  kitId: uuid("kit_id").notNull(),
  itemId: uuid("item_id").notNull(),
  
  // Quantidade e especificações
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  isOptional: boolean("is_optional").default(false),
  notes: text("notes"),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});