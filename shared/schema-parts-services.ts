import { pgTable, uuid, varchar, text, jsonb, integer, decimal, boolean, timestamp, date, index } from "drizzle-orm/pg-core";
import { parts, suppliers, serviceKits, users } from "./schema-master";

// Stock Movements table
export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  partId: uuid("part_id").references(() => parts.id),
  locationId: uuid("location_id"),
  movementType: varchar("movement_type", { length: 50 }).notNull(),
  quantity: integer("quantity").notNull(),
  referenceDocument: varchar("reference_document", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdById: uuid("created_by_id")
});

// Quotations table
export const quotations = pgTable("quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  quotationNumber: varchar("quotation_number", { length: 100 }).notNull(),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  status: varchar("status", { length: 50 }).default("draft"),
  requestedDate: timestamp("requested_date").defaultNow(),
  responseDate: timestamp("response_date"),
  validUntil: timestamp("valid_until"),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdById: uuid("created_by_id")
});

// Quotation Items table
export const quotationItems = pgTable("quotation_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  quotationId: uuid("quotation_id").references(() => quotations.id, { onDelete: 'cascade' }),
  partId: uuid("part_id").references(() => parts.id),
  requestedQuantity: integer("requested_quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }),
  leadTime: integer("lead_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Purchase Orders table
export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  poNumber: varchar("po_number", { length: 100 }).notNull(),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  quotationId: uuid("quotation_id").references(() => quotations.id),
  status: varchar("status", { length: 50 }).default("draft"),
  orderDate: timestamp("order_date").defaultNow(),
  expectedDelivery: date("expected_delivery"),
  actualDelivery: date("actual_delivery"),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  deliveryAddress: text("delivery_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdById: uuid("created_by_id"),
  approvedById: uuid("approved_by_id"),
  approvedAt: timestamp("approved_at")
});

// Purchase Order Items table
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  partId: uuid("part_id").references(() => parts.id),
  orderedQuantity: integer("ordered_quantity").notNull(),
  receivedQuantity: integer("received_quantity").default(0),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }),
  status: varchar("status", { length: 50 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow()
});

// Service Kit Items table
export const serviceKitItems = pgTable("service_kit_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  serviceKitId: uuid("service_kit_id").references(() => serviceKits.id, { onDelete: 'cascade' }),
  partId: uuid("part_id").references(() => parts.id),
  quantity: integer("quantity").notNull(),
  isOptional: boolean("is_optional").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Assets table
export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  assetCode: varchar("asset_code", { length: 100 }).notNull(),
  assetName: varchar("asset_name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  locationId: uuid("location_id"),
  parentAssetId: uuid("parent_asset_id").references(() => assets.id),
  status: varchar("status", { length: 50 }).default("active"),
  acquisitionDate: date("acquisition_date"),
  warrantyExpiry: date("warranty_expiry"),
  specifications: jsonb("specifications"),
  qrCode: varchar("qr_code", { length: 255 }),
  rfidTag: varchar("rfid_tag", { length: 255 }),
  geoLatitude: decimal("geo_latitude", { precision: 10, scale: 8 }),
  geoLongitude: decimal("geo_longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdById: uuid("created_by_id")
});

// Asset Maintenance History table
export const assetMaintenanceHistory = pgTable("asset_maintenance_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  assetId: uuid("asset_id").references(() => assets.id),
  serviceOrderId: uuid("service_order_id"),
  maintenanceType: varchar("maintenance_type", { length: 100 }).notNull(),
  description: text("description"),
  partsUsed: jsonb("parts_used"),
  cost: decimal("cost", { precision: 15, scale: 2 }),
  durationHours: decimal("duration_hours", { precision: 5, scale: 2 }),
  technicianId: uuid("technician_id"),
  completedAt: timestamp("completed_at"),
  nextMaintenanceDate: date("next_maintenance_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Price Lists table
export const priceLists = pgTable("price_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  validFrom: date("valid_from").notNull(),
  validTo: date("valid_to"),
  customerId: uuid("customer_id"),
  contractId: uuid("contract_id"),
  costCenter: varchar("cost_center", { length: 100 }),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  status: varchar("status", { length: 50 }).default("draft"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdById: uuid("created_by_id"),
  approvedById: uuid("approved_by_id"),
  approvedAt: timestamp("approved_at")
});

// Price List Items table
export const priceListItems = pgTable("price_list_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  priceListId: uuid("price_list_id").references(() => priceLists.id, { onDelete: 'cascade' }),
  itemType: varchar("item_type", { length: 50 }).notNull(),
  itemId: uuid("item_id"),
  itemCode: varchar("item_code", { length: 100 }),
  itemDescription: text("item_description"),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  minimumQuantity: integer("minimum_quantity").default(1),
  discountScale: jsonb("discount_scale"),
  marginPercentage: decimal("margin_percentage", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Supplier Evaluations table
export const supplierEvaluations = pgTable("supplier_evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  evaluationPeriodStart: date("evaluation_period_start"),
  evaluationPeriodEnd: date("evaluation_period_end"),
  qualityScore: integer("quality_score"),
  deliveryScore: integer("delivery_score"),
  priceScore: integer("price_score"),
  serviceScore: integer("service_score"),
  overallScore: decimal("overall_score", { precision: 3, scale: 2 }),
  comments: text("comments"),
  evaluatorId: uuid("evaluator_id"),
  createdAt: timestamp("created_at").defaultNow()
});

// Parts Audit Log table
export const partsAuditLog = pgTable("parts_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: uuid("record_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  userId: uuid("user_id"),
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent")
});

// Export types for validation
export type InsertStockMovement = typeof stockMovements.$inferInsert;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertQuotation = typeof quotations.$inferInsert;
export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotationItem = typeof quotationItems.$inferInsert;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertServiceKitItem = typeof serviceKitItems.$inferInsert;
export type ServiceKitItem = typeof serviceKitItems.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type InsertAssetMaintenanceHistory = typeof assetMaintenanceHistory.$inferInsert;
export type AssetMaintenanceHistory = typeof assetMaintenanceHistory.$inferSelect;
export type InsertPriceList = typeof priceLists.$inferInsert;
export type PriceList = typeof priceLists.$inferSelect;
export type InsertPriceListItem = typeof priceListItems.$inferInsert;
export type PriceListItem = typeof priceListItems.$inferSelect;
export type InsertSupplierEvaluation = typeof supplierEvaluations.$inferInsert;
export type SupplierEvaluation = typeof supplierEvaluations.$inferSelect;
export type InsertPartsAuditLog = typeof partsAuditLog.$inferInsert;
export type PartsAuditLog = typeof partsAuditLog.$inferSelect;