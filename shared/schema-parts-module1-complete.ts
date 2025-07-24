import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// MÓDULO 1 - GESTÃO DE PEÇAS COMPLETA
// Conforme especificações: código interno/fabricante, descrição, categoria, especificações técnicas,
// imagens, manuais, código de barras, preços, fornecedores, classificação ABC, obsolescência, intercambiáveis

export const parts = pgTable("parts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Códigos e Identificação
  internalCode: varchar("internal_code", { length: 50 }).notNull(),
  manufacturerCode: varchar("manufacturer_code", { length: 50 }),
  barcode: varchar("barcode", { length: 100 }),
  
  // Descrição e Categorização (adaptado para estrutura existente)
  title: varchar("title", { length: 255 }).notNull(), // campo existente
  description: text("description"),
  categoryId: uuid("category_id"), // campo existente 
  subcategory: varchar("subcategory", { length: 100 }),
  
  // Especificações Técnicas (usando campos existentes)
  technicalSpecs: jsonb("technical_specs").default({}),
  dimensions: varchar("dimensions", { length: 255 }),
  weightKg: decimal("weight_kg", { precision: 8, scale: 3 }),
  material: varchar("material", { length: 100 }),
  voltage: varchar("voltage", { length: 50 }),
  powerWatts: decimal("power_watts", { precision: 10, scale: 2 }),
  
  // Documentação e Mídias (campos existentes como arrays)
  images: varchar("images").array(),
  manuals: varchar("manuals").array(),
  
  // Informações Comerciais (campos existentes)
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  marginPercentage: decimal("margin_percentage", { precision: 5, scale: 2 }),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  
  // Fornecedores Alternativos
  alternativeSuppliers: jsonb("alternative_suppliers").$type<Array<{
    supplierId: string;
    supplierName: string;
    partNumber: string;
    price: number;
    leadTime: number;
    isPreferred: boolean;
  }>>().default([]),
  
  // Classificação ABC
  abcClassification: varchar("abc_classification", { length: 1 }).default("C"), // A, B, C
  criticality: varchar("criticality", { length: 20 }).default("normal"), // critical, high, normal, low
  annualConsumptionValue: decimal("annual_consumption_value", { precision: 12, scale: 2 }).default("0.00"),
  
  // Gestão de Obsolescência
  obsolescenceStatus: varchar("obsolescence_status", { length: 30 }).default("active"), // active, obsolete, discontinued, restricted
  obsolescenceDate: timestamp("obsolescence_date"),
  replacementPartId: uuid("replacement_part_id"),
  obsolescenceReason: text("obsolescence_reason"),
  
  // Peças Intercambiáveis (campo existente como array)
  interchangeableParts: varchar("interchangeable_parts").array(),
  
  // Controle de Status
  status: varchar("status", { length: 20 }).default("active"), // active, inactive, discontinued
  isActive: boolean("is_active").default(true),
  
  // Auditoria (campos existentes)
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  createdById: uuid("created_by_id"),
  updatedById: uuid("updated_by_id")
});

// Zod Schemas
const baseInsertSchema = createInsertSchema(parts);
export const insertPartSchema = baseInsertSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const updatePartSchema = insertPartSchema.partial();

export type Part = typeof parts.$inferSelect;
export type InsertPart = z.infer<typeof insertPartSchema>;
export type UpdatePart = z.infer<typeof updatePartSchema>;