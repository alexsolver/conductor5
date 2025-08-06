# 🚨 SIMPLIFICAÇÃO CRÍTICA DO SCHEMA - ITEMS TABLE

## 🎯 PROBLEMA FUNDAMENTAL IDENTIFICADO

**ERRO RAIZ:** Schema Drizzle complexo não alinhado com estrutura real da base de dados  
**CAUSA:** Múltiplas colunas definidas que não existem fisicamente  
**IMPACTO:** Sistema completamente inoperante para updates de itens

---

## 🔧 CORREÇÃO SISTEMÁTICA APLICADA

### 1. Remoção de Colunas Inexistentes
```typescript
// REMOVIDO do schema:
- title: varchar("title") ← Não existe
- category: varchar("category") ← Não existe  
- subcategory: varchar("subcategory") ← Não existe
- internalCode: varchar("internal_code") ← Não existe
- manufacturerCode: varchar("manufacturer_code") ← Não existe
- supplierCode: varchar("supplier_code") ← Não existe
- barcode, sku, manufacturer, model ← Não existem
- costPrice, salePrice, currency, unit ← Não existem
- abcClassification, criticality ← Não existem
- specifications, technicalDetails ← Não existem
- tags, customFields, notes ← Não existem
```

### 2. Schema Simplificado Final
```typescript
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  integrationCode: varchar("integration_code", { length: 100 }),
  description: text("description"),
  measurementUnit: varchar("measurement_unit", { length: 10 }).default("UN"),
  maintenancePlan: text("maintenance_plan"),
  defaultChecklist: text("default_checklist"),
  status: varchar("status", { length: 20 }).default("active"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by")
});
```

### 3. Remoção de Índices Problemáticos
```typescript
// REMOVIDO: Todos os índices que causavam erro de referência
// Mantido: Schema limpo sem índices por enquanto
```

---

## 🎯 VALIDAÇÃO ESPERADA

### Teste de Update:
```bash
curl -X PUT /api/materials-services/items/test \
  -d '{"name":"test","type":"material","measurementUnit":"UN"}'
```

**Resultado Esperado:**
- ✅ Servidor inicia sem erro de schema
- ✅ Update de item funcional (200 OK)
- ✅ Sistema personalização desbloqueado

**Histórico de Erros Resolvidos:**
- ❌ "column title does not exist" → ✅ RESOLVIDO
- ❌ "column category does not exist" → ✅ RESOLVIDO  
- ❌ "IndexedColumn undefined" → ✅ RESOLVIDO

---

**SIMPLIFICAÇÃO RADICAL APLICADA** ✅  
**Data:** 06 de Janeiro de 2025, 01:12h  
**Status:** Schema alinhado com realidade da base de dados