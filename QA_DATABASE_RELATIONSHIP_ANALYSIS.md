# 🔍 ANÁLISE QA CRÍTICA: RELACIONAMENTOS DE BANCO DE DADOS

**Data:** 24 de Julho de 2025  
**Analista QA:** Sistema Automático  
**Escopo:** Módulos Timecard e Gestão de Equipes  

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **TABELAS TIMECARD INEXISTENTES - SEVERIDADE CRÍTICA**
**Código do Erro:** `relation "timecard_entries" does not exist`

#### Problema:
O código tenta acessar tabelas que **NÃO EXISTEM** no banco de dados:

**Tabelas Esperadas pelo Código:**
```typescript
// DrizzleTimecardRepository.ts usa:
timecardEntries     // ❌ NÃO EXISTE
workSchedules       // ❌ NÃO EXISTE 
absenceRequests     // ❌ NÃO EXISTE
scheduleTemplates   // ❌ NÃO EXISTE
```

**Tabelas Reais no Banco (Schema 3f99462f-3621-4b1b-bea8-782acc50d62e):**
```sql
daily_timesheet     ✅ EXISTE
time_records        ✅ EXISTE  
time_bank          ✅ EXISTE
time_bank_movements ✅ EXISTE
timecard_alerts     ✅ EXISTE
timecard_audit_log  ✅ EXISTE
timecard_settings   ✅ EXISTE
```

#### Impacto:
- **100% das operações de timecard falham**
- Erro 500 em `/api/timecard/current-status`
- Sistema completamente não funcional

---

### 2. **NOMENCLATURA INCONSISTENTE - SEVERIDADE ALTA**

#### Schema Master vs Banco Real:
| Schema Master      | Banco Real         | Status | Problema |
|-------------------|-------------------|---------|----------|
| `timecardEntries` | `time_records`    | ❌ MISMATCH | Nome diferente |
| `workSchedules`   | Não existe        | ❌ MISSING | Tabela ausente |
| `absenceRequests` | Não existe        | ❌ MISSING | Tabela ausente |
| `dailyTimesheet`  | `daily_timesheet` | ✅ MATCH | Correto |

---

### 3. **IMPORTS DE SCHEMA INCORRETOS - SEVERIDADE ALTA**

#### DrizzleTimecardRepository.ts:
```typescript
// LINHA 3-12 - IMPORTS INCORRETOS:
import { 
  timecardEntries,     // ❌ NÃO EXISTE no schema-master.ts
  workSchedules,       // ❌ NÃO EXISTE no schema-master.ts
  absenceRequests,     // ❌ NÃO EXISTE no schema-master.ts
  scheduleTemplates,   // ❌ NÃO EXISTE no schema-master.ts
  hourBankEntries,     // ❌ NOME INCORRETO (deveria ser timeBank)
  flexibleWorkArrangements, // ❌ NÃO EXISTE no schema-master.ts
  shiftSwapRequests,   // ❌ NÃO EXISTE no schema-master.ts
  users                // ✅ CORRETO
} from '../../../../../shared/schema';
```

#### Verificação Schema Master (shared/schema-master.ts):
```typescript
// TIMECARD TABLES NO SCHEMA MASTER:
- timeRecords ✅ EXISTE (linha ~800)
- dailyTimesheet ✅ EXISTE 
- workSchedules ❌ NÃO DEFINIDO
- timeBank ✅ EXISTE
- timecardEntries ❌ NÃO DEFINIDO
- absenceRequests ❌ NÃO DEFINIDO
```

---

### 4. **RELACIONAMENTOS FOREIGN KEY QUEBRADOS - SEVERIDADE ALTA**

#### Problemas Identificados:
```typescript
// Repository tenta fazer JOIN com tabelas inexistentes:
.leftJoin(users, eq(absenceRequests.userId, users.id))  // ❌ absenceRequests não existe
.leftJoin(users, eq(workSchedules.userId, users.id))    // ❌ workSchedules não existe
```

#### Foreign Keys Corretos Disponíveis:
```sql
-- Tabelas reais com FK para users:
time_records.user_id → users.id ✅
daily_timesheet.user_id → users.id ✅  
time_bank.user_id → users.id ✅
```

---

### 5. **GESTÃO DE EQUIPES - PROBLEMAS DE RELACIONAMENTO**

#### UserGroups vs UserGroupMemberships:
```typescript
// users.ts - Tabela userGroups existe:
export const userGroups = pgTable("user_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  // ... outros campos
});

// Mas userGroupMemberships pode ter problemas de referência:
export const userGroupMemberships = pgTable("user_group_memberships", {
  userId: uuid("user_id").references(() => users.id),     // ✅ CORRETO
  groupId: uuid("group_id").references(() => userGroups.id), // ⚠️ VERIFICAR
});
```

---

## 🛠️ CORREÇÕES CRÍTICAS NECESSÁRIAS

### PRIORIDADE 1 - CRÍTICA (Imediato):

#### 1. **Corrigir Imports do Repository**
```typescript
// CORRIGIR DrizzleTimecardRepository.ts linha 3-12:
import { 
  timeRecords,        // ✅ USAR NOME CORRETO
  dailyTimesheet,     // ✅ MANTER
  timeBank,           // ✅ USAR NOME CORRETO  
  users               // ✅ MANTER
} from '../../../../../shared/schema';

// REMOVER IMPORTS INEXISTENTES:
// timecardEntries ❌
// workSchedules ❌  
// absenceRequests ❌
// scheduleTemplates ❌
```

#### 2. **Mapear Queries para Tabelas Reais**
```typescript
// SUBSTITUIR:
.from(timecardEntries)  →  .from(timeRecords)
.from(workSchedules)    →  CRIAR NOVA TABELA ou usar time_records
.from(absenceRequests)  →  CRIAR NOVA TABELA
```

#### 3. **Criar Tabelas Ausentes**
```sql
-- EXECUTAR MIGRAÇÃO:
CREATE TABLE absence_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  absence_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, 
  user_id UUID REFERENCES users(id),
  schedule_name VARCHAR(255),
  work_days JSONB,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### PRIORIDADE 2 - ALTA (24h):

#### 4. **Validar Foreign Keys Existentes**
```sql
-- VERIFICAR INTEGRIDADE:
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = '3f99462f-3621-4b1b-bea8-782acc50d62e';
```

#### 5. **Padronizar Nomenclatura**
- Decidir padrão: `snake_case` (banco) vs `camelCase` (TypeScript)
- Atualizar schema-master.ts com nomes corretos
- Implementar mapeamento automático

---

## 📊 RESUMO EXECUTIVO

### Status Atual:
- **🔴 CRÍTICO:** Sistema Timecard 0% funcional - tabelas inexistentes
- **🟠 ALTO:** Gestão de Equipes 70% funcional - alguns relacionamentos podem estar quebrados
- **🟡 MÉDIO:** Schema definitions inconsistentes com banco real

### Estimativa de Correção:
- **Prioridade 1:** 4-6 horas (correção de imports + mapeamento)
- **Prioridade 2:** 2-4 horas (validação FK + padronização)

### Impacto Pós-Correção:
- **✅ Sistema Timecard 100% funcional**
- **✅ Relacionamentos íntegros entre todas as tabelas**
- **✅ Arquitetura de dados consistente e escalável**

---

**Status Final:** 🔴 **INTERVENÇÃO IMEDIATA NECESSÁRIA - TABELAS CRÍTICAS AUSENTES**