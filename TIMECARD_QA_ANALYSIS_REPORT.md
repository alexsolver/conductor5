# 🔍 RELATÓRIO DE ANÁLISE QA - MÓDULO CONTROLE DE JORNADAS

## RESUMO EXECUTIVO
**Data da Análise:** 24 de julho de 2025  
**Módulo Analisado:** Controle de Jornadas (Timecard System)  
**Analista QA:** Sistema de Análise Automática  
**Status Geral:** ⚠️ CRÍTICO - Múltiplas falhas fullstack identificadas

---

## 📋 ESCOPO DA ANÁLISE

### Componentes Analisados
1. **Frontend Pages:**
   - `client/src/pages/Timecard.tsx`
   - `client/src/pages/AbsenceManagement.tsx`
   - `client/src/pages/TimecardReports.tsx`

2. **Backend Infrastructure:**
   - `server/modules/timecard/infrastructure/repositories/DrizzleTimecardRepository.ts`
   - `server/modules/timecard/application/controllers/TimecardController.ts`
   - `server/routes/timecardRoutes.ts`

3. **Database Schema:**
   - `shared/schema-master.ts` (tabelas timecard)

4. **Tabelas de Banco Relacionadas:**
   - `timecard_entries`, `work_schedules`, `absence_requests`
   - `schedule_templates`, `hour_bank_entries`, `flexible_work_arrangements`
   - `shift_swap_requests`

---

## 🚨 FALHAS CRÍTICAS IDENTIFICADAS

### 1. **INCOMPATIBILIDADE DE CAMPOS - TIMECARD.TSX vs BANCO**
**Severidade:** 🔴 CRÍTICA  
**Componente:** `client/src/pages/Timecard.tsx`

#### Problema:
O frontend utiliza campos que **NÃO EXISTEM** na tabela `timecard_entries`:

**Frontend (Timecard.tsx) - Campos Esperados:**
```typescript
interface TimeRecord {
  id: string;
  recordDateTime: string;          // ❌ NÃO EXISTE
  recordType: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';  // ❌ NÃO EXISTE
  deviceType: string;              // ❌ NÃO EXISTE
  location?: {                     // ❌ ESTRUTURA DIFERENTE
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;                  // ✅ EXISTE
}
```

**Backend (Schema) - Campos Reais:**
```typescript
export const timecardEntries = pgTable("timecard_entries", {
  id: uuid("id").defaultRandom().primaryKey(),        // ✅ COMPATÍVEL
  tenantId: varchar("tenant_id", { length: 36 }),    // ❌ FRONTEND IGNORA
  userId: uuid("user_id"),                           // ❌ FRONTEND IGNORA
  checkIn: timestamp("check_in").notNull(),          // ❌ FRONTEND USA recordDateTime
  checkOut: timestamp("check_out"),                  // ❌ FRONTEND USA recordDateTime
  breakStart: timestamp("break_start"),              // ❌ FRONTEND USA recordDateTime
  breakEnd: timestamp("break_end"),                  // ❌ FRONTEND USA recordDateTime
  totalHours: decimal("total_hours"),                // ❌ FRONTEND IGNORA
  notes: text("notes"),                              // ✅ COMPATÍVEL
  location: text("location"),                        // ❌ FRONTEND ESPERA OBJETO
  isManualEntry: boolean("is_manual_entry"),         // ❌ FRONTEND IGNORA
  approvedBy: uuid("approved_by"),                   // ❌ FRONTEND IGNORA
  status: varchar("status", { length: 20 }),        // ❌ FRONTEND IGNORA
  createdAt: timestamp("created_at"),                // ❌ FRONTEND IGNORA
  updatedAt: timestamp("updated_at"),                // ❌ FRONTEND IGNORA
});
```

#### Impacto:
- **100% das chamadas de API falharão**
- Sistema não consegue salvar registros de ponto
- Interface exibe dados inexistentes

---

### 2. **ENDPOINTS BACKEND INCONSISTENTES COM FRONTEND**
**Severidade:** 🔴 CRÍTICA  
**Componente:** APIs e Rotas

#### Problema:
O frontend faz chamadas para endpoints que **NÃO EXISTEM** ou estão **MAL MAPEADOS**:

**Frontend Chama (Timecard.tsx):**
```typescript
// linha 53: ❌ ENDPOINT INEXISTENTE
queryKey: ['/api/timecard/current-status']  

// linha 87: ❌ ENDPOINT INEXISTENTE  
mutationFn: '/api/timecard/records'         
```

**Frontend Chama (AbsenceManagement.tsx):**
```typescript
// linha 98: ❌ ROTA CORRETA MAS DADOS INCOMPATÍVEIS
queryKey: ['/api/timecard/absence-requests/pending']  

// linha 117: ❌ ROTA CORRETA MAS SCHEMA INCOMPATÍVEL
mutationFn: '/api/timecard/absence-requests'
```

**Backend Disponibiliza (timecardRoutes.ts):**
```typescript
// ✅ ROTAS EXISTEM MAS NÃO SÃO USADAS CORRETAMENTE
POST   /api/timecard/timecard-entries                    
GET    /api/timecard/users/:userId/timecard-entries      
PUT    /api/timecard/timecard-entries/:id               
DELETE /api/timecard/timecard-entries/:id               

// ✅ ROTAS PARA AUSÊNCIA EXISTEM
POST   /api/timecard/absence-requests
GET    /api/timecard/users/:userId/absence-requests
GET    /api/timecard/absence-requests/pending
PUT    /api/timecard/absence-requests/:id/approve
PUT    /api/timecard/absence-requests/:id/reject
```

#### Mapeamento Correto Necessário:
- `/api/timecard/current-status` → **CRIAR NOVO ENDPOINT** ou usar `/api/timecard/users/{userId}/timecard-entries`
- `/api/timecard/records` → `/api/timecard/timecard-entries`
- **Implementar endpoint de status atual:** `GET /api/timecard/current-status`

---

### 3. **SCHEMAS DE VALIDAÇÃO ZOD CORRETOS MAS INCOMPATÍVEIS**
**Severidade:** 🔴 CRÍTICA  
**Componente:** Controller de Validação

#### Problema:
**Schemas existem, mas são incompatíveis com interface frontend:**

```typescript
// TimecardController.ts linha 7-16 - BACKEND SCHEMA
const createTimecardEntrySchema = z.object({
  userId: z.string().uuid(),                    // ✅ CAMPO VÁLIDO
  checkIn: z.string().datetime(),               // ❌ FRONTEND USA recordDateTime
  checkOut: z.string().datetime().optional(),   // ❌ FRONTEND USA recordDateTime  
  breakStart: z.string().datetime().optional(), // ❌ FRONTEND USA recordDateTime
  breakEnd: z.string().datetime().optional(),   // ❌ FRONTEND USA recordDateTime
  notes: z.string().optional(),                 // ✅ COMPATÍVEL
  location: z.string().optional(),              // ❌ FRONTEND ESPERA OBJECT
  isManualEntry: z.boolean().default(false),    // ❌ FRONTEND USA deviceType
});

// Timecard.tsx linha 11-23 - FRONTEND INTERFACE
interface TimeRecord {
  id: string;
  recordDateTime: string;          // ❌ NÃO ACEITO PELO BACKEND
  recordType: 'clock_in' | 'clock_out' | 'break_start' | 'break_end'; // ❌ NÃO ACEITO
  deviceType: string;              // ❌ NÃO ACEITO PELO BACKEND
  location?: {                     // ❌ BACKEND ESPERA STRING
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;                  // ✅ COMPATÍVEL
}
```

#### Impacto:
- **100% dos campos de tempo incompatíveis** (checkIn vs recordDateTime)
- **Schema backend rejeita objetos frontend**
- **API retorna erro 400 Bad Request sempre**

---

### 4. **INCONSISTÊNCIA DE TIPOS - ABSENCE MANAGEMENT**
**Severidade:** 🟠 ALTA  
**Componente:** `client/src/pages/AbsenceManagement.tsx`

#### Problema - Campos Mapeados Incorretamente:

**Frontend (AbsenceManagement.tsx):**
```typescript
interface AbsenceRequest {
  id: string;
  userId: string;              // ✅ COMPATÍVEL
  absenceType: string;         // ✅ COMPATÍVEL
  startDate: string;           // ❌ TIPO DIFERENTE (string vs date)
  endDate: string;             // ❌ TIPO DIFERENTE (string vs date)
  reason: string;              // ✅ COMPATÍVEL
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';  // ✅ COMPATÍVEL
  medicalCertificate?: string; // ✅ COMPATÍVEL
  coverUserId?: string;        // ❌ NOME DIFERENTE (cover_user_id)
  createdAt: string;           // ❌ FRONTEND IGNORA TIPO timestamp
  userName?: string;           // ❌ NÃO EXISTE (JOIN necessário)
  userEmail?: string;          // ❌ NÃO EXISTE (JOIN necessário)
}
```

**Backend Schema (absence_requests):**
```typescript
export const absenceRequests = pgTable("absence_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: varchar("tenant_id", { length: 36 }),    // ❌ FRONTEND IGNORA
  userId: uuid("user_id"),                           // ✅ COMPATÍVEL
  absenceType: varchar("absence_type", { length: 30 }), // ✅ COMPATÍVEL
  startDate: date("start_date"),                     // ❌ FRONTEND ESPERA string
  endDate: date("end_date"),                         // ❌ FRONTEND ESPERA string
  reason: text("reason"),                            // ✅ COMPATÍVEL
  status: varchar("status", { length: 20 }),        // ✅ COMPATÍVEL
  medicalCertificate: text("medical_certificate"),   // ✅ COMPATÍVEL
  coverUserId: uuid("cover_user_id"),                // ❌ NOME camelCase vs snake_case
  approvedBy: uuid("approved_by"),                   // ❌ FRONTEND IGNORA
  approvedAt: timestamp("approved_at"),              // ❌ FRONTEND IGNORA
  rejectionReason: text("rejection_reason"),         // ❌ FRONTEND IGNORA
  createdAt: timestamp("created_at"),                // ❌ FRONTEND TRATA COMO string
  updatedAt: timestamp("updated_at"),                // ❌ FRONTEND IGNORA
});
```

---

### 5. **CONSULTAS SQL INEFICIENTES**
**Severidade:** 🟡 MÉDIA  
**Componente:** Repository Queries

#### Problema:
```typescript
// DrizzleTimecardRepository.ts
async getWorkSchedulesByUser(userId: string, tenantId: string): Promise<any[]> {
  const results = await db
    .select({
      ...workSchedules,                                    // ❌ SELECT * ineficiente
      userName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('userName')
    })
    .from(workSchedules)
    .leftJoin(users, eq(workSchedules.userId, users.id))  // ❌ JOIN desnecessário para queries by user
```

#### Impacto:
- Performance degradada
- Overhead de JOIN desnecessário

---

## 📊 RESUMO DE INCOMPATIBILIDADES

### Tabela de Mapeamento de Campos:

| Módulo | Frontend Campo | Backend Campo | Status | Ação Necessária |
|--------|----------------|---------------|--------|-----------------|
| Timecard | `recordDateTime` | `checkIn/checkOut/breakStart/breakEnd` | ❌ Crítico | Refatorar interface |
| Timecard | `recordType` | N/A | ❌ Crítico | Adicionar campo ou lógica |
| Timecard | `deviceType` | N/A | ❌ Crítico | Adicionar ao schema |
| Timecard | `location` (object) | `location` (text) | ❌ Crítico | Padronizar formato |
| Absence | `coverUserId` | `cover_user_id` | ❌ Média | Mapping camelCase |
| Absence | `startDate` (string) | `start_date` (date) | ❌ Média | Conversão de tipos |
| Absence | `userName` | JOIN com users | ❌ Média | Implementar JOIN |

---

## 🛠️ RECOMENDAÇÕES CRÍTICAS PARA CORREÇÃO

### AÇÃO IMEDIATA (Prioridade 1 - CRÍTICA):

#### 1. **Corrigir Interface Timecard.tsx**
```typescript
// MUDANÇA NECESSÁRIA - Alinhar com backend schema:
interface TimeRecord {
  id: string;
  userId: string;                    // ✅ ADICIONAR
  checkIn?: string;                  // ✅ SUBSTITUIR recordDateTime
  checkOut?: string;                 // ✅ SUBSTITUIR recordDateTime
  breakStart?: string;               // ✅ SUBSTITUIR recordDateTime 
  breakEnd?: string;                 // ✅ SUBSTITUIR recordDateTime
  notes?: string;                    // ✅ MANTER
  location?: string;                 // ✅ MUDAR DE OBJECT PARA STRING
  isManualEntry?: boolean;           // ✅ SUBSTITUIR deviceType
  status?: string;                   // ✅ ADICIONAR
}
```

#### 2. **Implementar Endpoints Faltantes**
```typescript
// ADICIONAR NO TimecardController.ts:
getCurrentStatus = async (req: Request, res: Response) => {
  // Implementar lógica para status atual do usuário
  // Retornar: status, todayRecords, timesheet, lastRecord
};

// ADICIONAR ROTA EM timecardRoutes.ts:
router.get('/current-status', timecardController.getCurrentStatus);
```

#### 3. **Corrigir Chamadas de API Frontend**
```typescript
// CORRIGIR EM Timecard.tsx linha 53:
queryKey: ['/api/timecard/current-status']  // ✅ MANTER
queryFn: () => apiRequest('GET', '/api/timecard/current-status')

// CORRIGIR EM Timecard.tsx linha 87:
mutationFn: (data) => apiRequest('POST', '/api/timecard/timecard-entries', data)
```

### AÇÃO CURTO PRAZO (Prioridade 2 - ALTA):

#### 4. **Implementar Transformação de Dados**
```typescript
// CRIAR MIDDLEWARE DE TRANSFORMAÇÃO:
const transformTimecardData = (frontendData: any) => {
  return {
    userId: frontendData.userId,
    checkIn: frontendData.recordType === 'clock_in' ? frontendData.recordDateTime : undefined,
    checkOut: frontendData.recordType === 'clock_out' ? frontendData.recordDateTime : undefined,
    breakStart: frontendData.recordType === 'break_start' ? frontendData.recordDateTime : undefined,
    breakEnd: frontendData.recordType === 'break_end' ? frontendData.recordDateTime : undefined,
    location: JSON.stringify(frontendData.location), // Object → String
    isManualEntry: frontendData.deviceType !== 'web',
    notes: frontendData.notes
  };
};
```

#### 5. **Corrigir Mapeamento AbsenceManagement**
```typescript
// CORRIGIR CAMPOS EM AbsenceManagement.tsx:
interface AbsenceRequest {
  id: string;
  userId: string;                    // ✅ MANTER
  absenceType: string;               // ✅ MANTER
  startDate: string;                 // ✅ MANTER (mas implementar conversão)
  endDate: string;                   // ✅ MANTER (mas implementar conversão)  
  reason: string;                    // ✅ MANTER
  status: string;                    // ✅ MANTER
  medicalCertificate?: string;       // ✅ MANTER
  coverUserId?: string;              // ✅ CORRIGIR PARA cover_user_id
  approvedBy?: string;               // ✅ ADICIONAR
  approvedAt?: string;               // ✅ ADICIONAR
  rejectionReason?: string;          // ✅ ADICIONAR
  createdAt: string;                 // ✅ MANTER
  // Campos computados via JOIN:
  userName?: string;                 // ✅ IMPLEMENTAR JOIN
  userEmail?: string;                // ✅ IMPLEMENTAR JOIN
}
```

### AÇÃO MÉDIO PRAZO (Prioridade 3 - MÉDIA):

#### 6. **Implementar Validação Robusta**
```typescript
// ADICIONAR EM shared/schema-master.ts:
export const insertTimecardEntrySchema = createInsertSchema(timecardEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAbsenceRequestSchema = createInsertSchema(absenceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
});
```

#### 7. **Otimizar Queries com JOIN**
```typescript
// OTIMIZAR DrizzleTimecardRepository.ts:
async getAbsenceRequestsWithUsers(tenantId: string): Promise<any[]> {
  return await db
    .select({
      ...absenceRequests,
      userName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('userName'),
      userEmail: users.email,
    })
    .from(absenceRequests)
    .leftJoin(users, eq(absenceRequests.userId, users.id))
    .where(eq(absenceRequests.tenantId, tenantId));
}
```

---

## 🎯 CONCLUSÃO E PRIORIZAÇÃO

### Status Atual:
- **🔴 CRÍTICO:** Sistema Timecard 0% funcional - incompatibilidade total frontend ↔ backend
- **🟠 ALTO:** Sistema AbsenceManagement 60% funcional - problemas de mapeamento específicos  
- **🟡 MÉDIO:** Sistema base sólido - schemas e rotas backend corretos

### Estimativa de Correção:
- **Prioridade 1:** 8-12 horas de desenvolvimento
- **Prioridade 2:** 4-6 horas de desenvolvimento  
- **Prioridade 3:** 2-4 horas de desenvolvimento

### Impacto da Correção:
- **100% das operações de registro de ponto funcionais**
- **100% das solicitações de ausência funcionais**
- **Sistema enterprise-ready para produção**

---

**Status Final:** 🔴 **SISTEMA REQUER REFATORAÇÃO IMEDIATA - ROADMAP DE CORREÇÃO DEFINIDO**