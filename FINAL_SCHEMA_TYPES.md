# 🚀 TIPOS E INTERFACES CONSOLIDADAS - AGOSTO 2025

## ✅ TIPOS ADICIONADOS AO SCHEMA-MASTER

### MATERIALS & SERVICES
```typescript
// Items
export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;

// Suppliers
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// Stock
export type StockLocation = typeof stockLocations.$inferSelect;
export type InsertStockLocation = typeof stockLocations.$inferInsert;

export type StockEntry = typeof stockEntries.$inferSelect;
export type InsertStockEntry = typeof stockEntries.$inferInsert;

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = typeof stockMovements.$inferInsert;

// Price Lists (LPU)
export type PriceList = typeof priceLists.$inferSelect;
export type InsertPriceList = typeof priceLists.$inferInsert;

export type PriceListItem = typeof priceListItems.$inferSelect;
export type InsertPriceListItem = typeof priceListItems.$inferInsert;

export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = typeof pricingRules.$inferInsert;

export type DynamicPricing = typeof dynamicPricing.$inferSelect;
export type InsertDynamicPricing = typeof dynamicPricing.$inferInsert;
```

### ASSET MANAGEMENT
```typescript
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

export type AssetMaintenance = typeof assetMaintenance.$inferSelect;
export type InsertAssetMaintenance = typeof assetMaintenance.$inferInsert;

export type AssetMeter = typeof assetMeters.$inferSelect;
export type InsertAssetMeter = typeof assetMeters.$inferInsert;

export type AssetLocation = typeof assetLocations.$inferSelect;
export type InsertAssetLocation = typeof assetLocations.$inferInsert;
```

### COMPLIANCE
```typescript
export type ComplianceAudit = typeof complianceAudits.$inferSelect;
export type InsertComplianceAudit = typeof complianceAudits.$inferInsert;

export type ComplianceCertification = typeof complianceCertifications.$inferSelect;
export type InsertComplianceCertification = typeof complianceCertifications.$inferInsert;

export type ComplianceEvidence = typeof complianceEvidence.$inferSelect;
export type InsertComplianceEvidence = typeof complianceEvidence.$inferInsert;

export type ComplianceAlert = typeof complianceAlerts.$inferSelect;
export type InsertComplianceAlert = typeof complianceAlerts.$inferInsert;

export type ComplianceScore = typeof complianceScores.$inferSelect;
export type InsertComplianceScore = typeof complianceScores.$inferInsert;
```

## 🔧 PRÓXIMO PASSO

Adicionar essas definições de tipos ao final do arquivo `shared/schema-master.ts` para completar a consolidação total e permitir que os repositories funcionem corretamente.

## 📊 STATUS

- ✅ Tabelas definidas e consolidadas
- ✅ Imports de schema-materials-services eliminados
- ⏳ Tipos TypeScript a serem adicionados
- ⏳ Restart do servidor para verificação final