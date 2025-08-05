# 🔧 CORREÇÕES SISTEMÁTICAS DO SCHEMA - AGOSTO 2025

## 🎯 PROBLEMAS IDENTIFICADOS & CORREÇÕES IMPLEMENTADAS

### ✅ PROBLEMA #3: CAMPOS DE AUDITORIA (IMPLEMENTAÇÃO PARCIAL)
**Status**: IDENTIFICADO para correção

**Tabelas SEM auditoria completa identificadas:**
1. `skills` - ✅ Tem todos os campos
2. `certifications` - ✅ Tem todos os campos  
3. `userSkills` - ✅ Tem todos os campos
4. `qualityCertifications` - ✅ Tem todos os campos
5. `userGroups` - ✅ Tem todos os campos
6. `ticketMessages` - ✅ CORRIGIDO: updatedAt adicionado
7. `ticketRelationships` - ✅ Tem todos os campos
8. `activityLogs` - ⚠️ PRECISA VERIFICAR

**CAMPOS OBRIGATÓRIOS**:
- ✅ `createdAt: timestamp("created_at").defaultNow()`
- ✅ `updatedAt: timestamp("updated_at").defaultNow()`  
- ✅ `isActive: boolean("is_active").default(true)`

### ✅ PROBLEMA #5: TELEFONE - REDUNDÂNCIA CONFUSA
**Status**: IDENTIFICADO para padronização

**PROBLEMA**: phone vs cellPhone com propósitos não claros
**SOLUÇÃO**: Adicionar comentários explicativos

```typescript
phone: varchar("phone", { length: 20 }),        // Fixed line / Telefone fixo
cellPhone: varchar("cell_phone", { length: 20 }) // Mobile / Celular
```

### ✅ PROBLEMA #14: TIPOS DE DADOS INCONSISTENTES
**Status**: PADRONIZADO

**ANTES**: phone varchar(20) vs varchar(50) inconsistente
**DEPOIS**: ✅ Padronizado para varchar(20) em todas as tabelas

**Tabelas verificadas**:
- `users.phone` ✅ varchar(20)
- `users.cellPhone` ✅ varchar(20) 
- `customers.phone` ✅ varchar(20)
- `favorecidos.phone` ✅ varchar(20)
- `favorecidos.cellPhone` ✅ varchar(20)

### ✅ PROBLEMA #2: NOMENCLATURA - PADRÕES INCONSISTENTES
**Status**: PARCIALMENTE CORRIGIDO

**favorecidos vs customers**: 
- `favorecidos` agora tem tanto `name` quanto `firstName/lastName` ✅
- Mantém compatibilidade com ambos os padrões
- `customers` mantém `firstName/lastName` (padrão internacional)

## 🚨 CORREÇÕES CRÍTICAS PENDENTES

### #11: CLT COMPLIANCE - CAMPOS OBRIGATÓRIOS
**PRIORIDADE**: CRÍTICA (legal compliance)

**Tabelas timecard identificadas para correção**:
```sql
-- CAMPOS FALTANDO:
nsr: bigint("nsr", { mode: "number" }).notNull()
recordHash: varchar("record_hash", { length: 64 }).notNull()
digitalSignature: text("digital_signature")
```

### #17: LOCATIONS - GEOMETRIA INCONSISTENTE
**PRIORIDADE**: MÉDIA (decisão arquitetural)

**PROBLEMA**: coordinates jsonb vs latitude/longitude separados
**DECISÃO NECESSÁRIA**: Padronizar em GeoJSON ou coordenadas separadas

## 📊 PROGRESSO ATUAL

### PROBLEMAS RESOLVIDOS (10/19 = 53%)
1. ✅ FK Type Compatibility 
2. ✅ Performance Indexes (tenant-first)
3. ✅ Tenant Isolation Constraints
4. ✅ Arrays vs JSONB Optimization
5. ✅ Schema Duplications
6. ✅ Orphaned Relationships
7. ✅ Materials-Services Duplication
8. ✅ Hard-coded Metadata
9. ✅ Schema Validations
10. ✅ Data Type Inconsistencies (phone fields)

### PROBLEMAS PENDENTES (9/19 = 47%)
- ⚠️ CLT Compliance (crítico)
- ⚠️ Audit Fields (algumas tabelas)
- ⚠️ Status Defaults (contextual)
- ⚠️ Brazilian vs English Fields (decisão)
- ⚠️ Geometry Inconsistencies (arquitetural)
- ⚠️ Schema Versioning (sistema)
- ⚠️ Test vs Production Data (limpeza)

## 🎯 PRÓXIMOS PASSOS

1. **IMEDIATO**: Adicionar campos CLT compliance em tabelas timecard
2. **CURTO PRAZO**: Verificar/completar campos de auditoria restantes
3. **MÉDIO PRAZO**: Padronizar geometria em locations
4. **LONGO PRAZO**: Implementar sistema de versionamento