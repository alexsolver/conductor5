import { pgTable, uuid, varchar, text, decimal, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Localizações de Estoque (Armazéns fixos e móveis)
export const stockLocations = pgTable("stock_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'fixed', 'mobile', 'virtual', 'consignment'
  description: text("description"),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isActive: boolean("is_active").default(true),
  managerId: uuid("manager_id"), // Responsável pelo estoque
  capacity: integer("capacity"), // Capacidade máxima
  currentOccupancy: integer("current_occupancy").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Níveis de Estoque por Item e Localização
export const stockLevels = pgTable("stock_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  itemId: uuid("item_id").notNull(),
  locationId: uuid("location_id").notNull(),
  currentQuantity: decimal("current_quantity", { precision: 15, scale: 4 }).default('0'),
  minimumLevel: decimal("minimum_level", { precision: 15, scale: 4 }).default('0'),
  maximumLevel: decimal("maximum_level", { precision: 15, scale: 4 }).default('0'),
  reorderPoint: decimal("reorder_point", { precision: 15, scale: 4 }).default('0'),
  economicOrderQuantity: decimal("economic_order_quantity", { precision: 15, scale: 4 }).default('0'),
  reservedQuantity: decimal("reserved_quantity", { precision: 15, scale: 4 }).default('0'),
  availableQuantity: decimal("available_quantity", { precision: 15, scale: 4 }).default('0'),
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }).default('0'),
  totalValue: decimal("total_value", { precision: 15, scale: 4 }).default('0'),
  lastMovementDate: timestamp("last_movement_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Movimentações de Estoque
export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  itemId: uuid("item_id").notNull(),
  locationId: uuid("location_id").notNull(),
  movementType: varchar("movement_type", { length: 20 }).notNull(), // 'in', 'out', 'transfer', 'adjustment', 'return'
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }),
  totalCost: decimal("total_cost", { precision: 15, scale: 4 }),
  referenceType: varchar("reference_type", { length: 50 }), // 'purchase', 'sale', 'transfer', 'service_order', 'adjustment'
  referenceId: uuid("reference_id"),
  reasonCode: varchar("reason_code", { length: 20 }),
  notes: text("notes"),
  batchNumber: varchar("batch_number", { length: 50 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  expiryDate: timestamp("expiry_date"),
  userId: uuid("user_id").notNull(),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at"),
  isReversed: boolean("is_reversed").default(false),
  reversedBy: uuid("reversed_by"),
  reversedAt: timestamp("reversed_at"),
  reverseReason: text("reverse_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transferências entre Localizações
export const stockTransfers = pgTable("stock_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  transferNumber: varchar("transfer_number", { length: 50 }).notNull(),
  fromLocationId: uuid("from_location_id").notNull(),
  toLocationId: uuid("to_location_id").notNull(),
  status: varchar("status", { length: 20 }).default('pending'), // 'pending', 'in_transit', 'completed', 'cancelled'
  priority: varchar("priority", { length: 20 }).default('normal'), // 'low', 'normal', 'high', 'urgent'
  requestedBy: uuid("requested_by").notNull(),
  approvedBy: uuid("approved_by"),
  shippedBy: uuid("shipped_by"),
  receivedBy: uuid("received_by"),
  requestDate: timestamp("request_date").defaultNow(),
  approvalDate: timestamp("approval_date"),
  shipDate: timestamp("ship_date"),
  expectedDate: timestamp("expected_date"),
  receivedDate: timestamp("received_date"),
  notes: text("notes"),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  totalItems: integer("total_items").default(0),
  totalValue: decimal("total_value", { precision: 15, scale: 4 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Itens das Transferências
export const stockTransferItems = pgTable("stock_transfer_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  transferId: uuid("transfer_id").notNull(),
  itemId: uuid("item_id").notNull(),
  requestedQuantity: decimal("requested_quantity", { precision: 15, scale: 4 }).notNull(),
  shippedQuantity: decimal("shipped_quantity", { precision: 15, scale: 4 }).default('0'),
  receivedQuantity: decimal("received_quantity", { precision: 15, scale: 4 }).default('0'),
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }),
  totalCost: decimal("total_cost", { precision: 15, scale: 4 }),
  batchNumber: varchar("batch_number", { length: 50 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  expiryDate: timestamp("expiry_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventários Físicos
export const physicalInventories = pgTable("physical_inventories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  inventoryNumber: varchar("inventory_number", { length: 50 }).notNull(),
  locationId: uuid("location_id").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'full', 'cycle', 'spot'
  status: varchar("status", { length: 20 }).default('planned'), // 'planned', 'in_progress', 'completed', 'cancelled'
  plannedDate: timestamp("planned_date").notNull(),
  startDate: timestamp("start_date"),
  completedDate: timestamp("completed_date"),
  responsibleUserId: uuid("responsible_user_id").notNull(),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at"),
  totalItemsPlanned: integer("total_items_planned").default(0),
  totalItemsCounted: integer("total_items_counted").default(0),
  totalDiscrepancies: integer("total_discrepancies").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contagens do Inventário
export const inventoryCounts = pgTable("inventory_counts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  inventoryId: uuid("inventory_id").notNull(),
  itemId: uuid("item_id").notNull(),
  systemQuantity: decimal("system_quantity", { precision: 15, scale: 4 }).notNull(),
  countedQuantity: decimal("counted_quantity", { precision: 15, scale: 4 }),
  variance: decimal("variance", { precision: 15, scale: 4 }),
  variancePercent: decimal("variance_percent", { precision: 5, scale: 2 }),
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }),
  varianceValue: decimal("variance_value", { precision: 15, scale: 4 }),
  reasonCode: varchar("reason_code", { length: 20 }),
  notes: text("notes"),
  countedBy: uuid("counted_by"),
  countedAt: timestamp("counted_at"),
  isAdjusted: boolean("is_adjusted").default(false),
  adjustedBy: uuid("adjusted_by"),
  adjustedAt: timestamp("adjusted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reservas de Estoque
export const stockReservations = pgTable("stock_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  itemId: uuid("item_id").notNull(),
  locationId: uuid("location_id").notNull(),
  reservationType: varchar("reservation_type", { length: 30 }).notNull(), // 'service_order', 'project', 'customer', 'internal'
  referenceId: uuid("reference_id").notNull(),
  reservedQuantity: decimal("reserved_quantity", { precision: 15, scale: 4 }).notNull(),
  consumedQuantity: decimal("consumed_quantity", { precision: 15, scale: 4 }).default('0'),
  availableQuantity: decimal("available_quantity", { precision: 15, scale: 4 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }),
  totalValue: decimal("total_value", { precision: 15, scale: 4 }),
  status: varchar("status", { length: 20 }).default('active'), // 'active', 'consumed', 'cancelled', 'expired'
  priority: varchar("priority", { length: 20 }).default('normal'),
  expiryDate: timestamp("expiry_date"),
  notes: text("notes"),
  reservedBy: uuid("reserved_by").notNull(),
  consumedBy: uuid("consumed_by"),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Kits de Serviço
export const serviceKits = pgTable("service_kits", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 30 }).notNull(),
  description: text("description"),
  kitType: varchar("kit_type", { length: 30 }).notNull(), // 'maintenance', 'repair', 'installation', 'emergency'
  equipmentType: varchar("equipment_type", { length: 50 }),
  maintenanceType: varchar("maintenance_type", { length: 30 }), // 'preventive', 'corrective', 'predictive'
  estimatedCost: decimal("estimated_cost", { precision: 15, scale: 4 }),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").notNull(),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Itens dos Kits de Serviço
export const serviceKitItems = pgTable("service_kit_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  kitId: uuid("kit_id").notNull(),
  itemId: uuid("item_id").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  isOptional: boolean("is_optional").default(false),
  priority: integer("priority").default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relacionamentos
export const stockLocationsRelations = relations(stockLocations, ({ many }) => ({
  stockLevels: many(stockLevels),
  stockMovements: many(stockMovements),
  transfersFrom: many(stockTransfers, { relationName: "fromLocation" }),
  transfersTo: many(stockTransfers, { relationName: "toLocation" }),
  inventories: many(physicalInventories),
  reservations: many(stockReservations),
}));

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
  location: one(stockLocations, {
    fields: [stockLevels.locationId],
    references: [stockLocations.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  location: one(stockLocations, {
    fields: [stockMovements.locationId],
    references: [stockLocations.id],
  }),
}));

export const stockTransfersRelations = relations(stockTransfers, ({ one, many }) => ({
  fromLocation: one(stockLocations, {
    fields: [stockTransfers.fromLocationId],
    references: [stockLocations.id],
    relationName: "fromLocation",
  }),
  toLocation: one(stockLocations, {
    fields: [stockTransfers.toLocationId],
    references: [stockLocations.id],
    relationName: "toLocation",
  }),
  items: many(stockTransferItems),
}));

export const stockTransferItemsRelations = relations(stockTransferItems, ({ one }) => ({
  transfer: one(stockTransfers, {
    fields: [stockTransferItems.transferId],
    references: [stockTransfers.id],
  }),
}));

export const physicalInventoriesRelations = relations(physicalInventories, ({ one, many }) => ({
  location: one(stockLocations, {
    fields: [physicalInventories.locationId],
    references: [stockLocations.id],
  }),
  counts: many(inventoryCounts),
}));

export const inventoryCountsRelations = relations(inventoryCounts, ({ one }) => ({
  inventory: one(physicalInventories, {
    fields: [inventoryCounts.inventoryId],
    references: [physicalInventories.id],
  }),
}));

export const stockReservationsRelations = relations(stockReservations, ({ one }) => ({
  location: one(stockLocations, {
    fields: [stockReservations.locationId],
    references: [stockLocations.id],
  }),
}));

export const serviceKitsRelations = relations(serviceKits, ({ many }) => ({
  items: many(serviceKitItems),
}));

export const serviceKitItemsRelations = relations(serviceKitItems, ({ one }) => ({
  kit: one(serviceKits, {
    fields: [serviceKitItems.kitId],
    references: [serviceKits.id],
  }),
}));