
# 🎯 PROMPT COMPLETO: MÓDULO DE APROVAÇÕES UNIVERSAL

Construir um **módulo de aprovações universal** que permita aprovações hierárquicas, condicionais e externas para **tickets, materiais/serviços, knowledge base e outros módulos**, baseado em regras configuráveis via query builder e seguindo rigorosamente os padrões definidos em **1qa.md**.

---

## 📋 REQUISITOS FUNCIONAIS ESSENCIAIS

### 1. **Criação de Regras de Aprovação Universal**
- Definição de regras via **Query Builder** sobre campos de qualquer módulo:
  - **Tickets**: priority, category, value, location, customer_id, assigned_to
  - **Materiais/Serviços**: item_value, supplier_id, category, stock_impact
  - **Knowledge Base**: article_type, visibility_level, content_sensitivity
  - **Timecard**: overtime_hours, approval_amount, employee_level
- Condições lógicas com operadores: `EQ, NEQ, IN, NOT IN, GT, GTE, LT, LTE, CONTAINS, STARTS_WITH, EXISTS, BETWEEN`
- Agrupadores lógicos: `AND/OR` com parênteses para precedência
- **Meta-campos**: created_by, tenant_id, company_id para regras cross-module

### 2. **Pipeline de Aprovação Flexível**
- **Etapas sequenciais** e **paralelas** configuráveis
- Modos de decisão por etapa:
  - `ALL`: Todos aprovadores devem aprovar
  - `ANY`: Qualquer aprovador pode aprovar
  - `QUORUM`: X de N aprovadores (ex: 2 de 3)
- **Aprovação hierárquica**: manager_chain levels 1-5
- **Tipos de aprovadores**:
  - Indivíduos (user_id)
  - Grupos internos (user_groups)
  - Clientes externos (customer_contacts)
  - Fornecedores (suppliers) - para materiais
  - Especialistas por domínio (technical_skills)
- **Auto-aprovação condicional**: regras baseadas em valor, urgência, etc.

### 3. **Execução Multi-Módulo de Instâncias**
- Cada entidade pode ter **múltiplas instâncias** de aprovação paralelas
- **Context-aware approvals**: diferentes regras por módulo
- **SLA por etapa** respeitando:
  - Horário de funcionamento (locations working_hours)
  - Feriados (holidays calendar)
  - Configurações de tenant
- **Idle Time SLA**: medição de tempo ocioso com ações:
  - Lembretes automáticos
  - Escalonamento hierárquico
  - Auto-rejeição por timeout
  - Delegação automática

### 4. **Escalonamento e Notificações Inteligentes**
- **Escalonamento automático** por não-resposta:
  - Nível hierárquico superior
  - Grupo de backup
  - Especialista da área
- **Delegação de aprovadores**:
  - Temporária (férias, ausência)
  - Permanente (mudança de função)
  - Por competência (domain expertise)
- **Notificações multi-canal**:
  - E-mail (templates personalizáveis)
  - Portal interno (real-time)
  - API/Webhooks para integrações externas
  - WhatsApp/Telegram (via OmniBridge)

### 5. **Auditoria e Compliance Obrigatório**
- **Integração obrigatória** com `audit_logs` global:
  - tenant_id, user_id, action_type, entity_type, entity_id
  - before_snapshot, after_snapshot (JSON completo)
  - timestamp, ip_address, user_agent
- **Ações auditadas**:
  - `requested, reminded, approved, rejected, delegated, escalated, expired, auto_approved`
- **Rastreabilidade completa**:
  - Quem aprovou/rejeitou e quando
  - Critérios aplicados na decisão
  - Comentários obrigatórios para rejeições
  - Histórico de modificações nas regras

---

## 🏗️ ARQUITETURA TÉCNICA (1qa.md COMPLIANCE)

### **Clean Architecture Obrigatória**
```
server/modules/approvals/
├── domain/
│   ├── entities/
│   │   ├── ApprovalRule.ts
│   │   ├── ApprovalInstance.ts
│   │   ├── ApprovalStep.ts
│   │   └── ApprovalDecision.ts
│   ├── repositories/
│   │   ├── IApprovalRuleRepository.ts
│   │   └── IApprovalInstanceRepository.ts
│   └── services/
│       ├── ApprovalRuleEngine.ts
│       └── EscalationService.ts
├── application/
│   ├── use-cases/
│   │   ├── CreateApprovalRuleUseCase.ts
│   │   ├── ExecuteApprovalFlowUseCase.ts
│   │   ├── ProcessApprovalDecisionUseCase.ts
│   │   └── EscalateApprovalUseCase.ts
│   └── controllers/
│       └── ApprovalController.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── DrizzleApprovalRuleRepository.ts
│   │   └── DrizzleApprovalInstanceRepository.ts
│   └── services/
│       ├── NotificationService.ts
│       └── SlaCalculationService.ts
└── routes.ts
```

### **Schema Database (Drizzle ORM)**
```typescript
// Seguindo shared/schema-master.ts
export const approvalRules = pgTable("approval_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  moduleType: varchar("module_type", { length: 50 }).notNull(), // 'tickets', 'materials', 'knowledge_base'
  queryConditions: jsonb("query_conditions").notNull(), // Query Builder JSON
  approvalSteps: jsonb("approval_steps").notNull(), // Pipeline configuration
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const approvalInstances = pgTable("approval_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ruleId: uuid("rule_id").references(() => approvalRules.id),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  currentStepIndex: integer("current_step_index").default(0),
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected, expired
  slaDeadline: timestamp("sla_deadline"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});
```

### **Multi-Tenant Isolation (Obrigatório)**
- Todas as queries **DEVEM** incluir `tenantId` filter
- Validação de acesso cross-tenant em **todos** os endpoints
- Schema por tenant: `${schemaName}.approval_rules`

---

## 💻 IMPLEMENTAÇÃO ESPECÍFICA POR MÓDULO

### **1. Tickets - Aprovação de Atividades**
```typescript
// Campos específicos para regras
interface TicketApprovalContext {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  estimatedCost: number;
  location: string;
  customerId: string;
  assignedTo: string;
  requiredSkills: string[];
}

// Regras exemplo
const ticketRules = [
  {
    name: "Aprovação Alto Valor",
    conditions: "estimatedCost > 5000 AND priority IN ['high', 'urgent']",
    steps: [
      { approvers: "manager_chain:1", mode: "ANY" },
      { approvers: "finance_team", mode: "ALL" }
    ]
  }
];
```

### **2. Materiais/Serviços - Aprovação de Compras**
```typescript
interface MaterialApprovalContext {
  itemValue: number;
  supplierId: string;
  category: string;
  stockImpact: 'critical' | 'normal' | 'low';
  urgencyLevel: number;
  requestedBy: string;
}

const materialRules = [
  {
    name: "Compra Material Crítico",
    conditions: "stockImpact = 'critical' OR itemValue > 10000",
    steps: [
      { approvers: "procurement_manager", mode: "ANY" },
      { approvers: "cfo", mode: "ANY", condition: "itemValue > 50000" }
    ]
  }
];
```

### **3. Knowledge Base - Aprovação de Conteúdo**
```typescript
interface KnowledgeApprovalContext {
  articleType: 'public' | 'internal' | 'restricted';
  visibilityLevel: number;
  contentSensitivity: 'low' | 'medium' | 'high';
  authorId: string;
  categoryId: string;
}

const knowledgeRules = [
  {
    name: "Conteúdo Público",
    conditions: "articleType = 'public' OR contentSensitivity = 'high'",
    steps: [
      { approvers: "content_reviewer", mode: "ANY" },
      { approvers: "compliance_team", mode: "ANY", condition: "contentSensitivity = 'high'" }
    ]
  }
];
```

---

## 🎛️ CONFIGURAÇÃO VIA INTERFACE

### **Query Builder Visual**
- Drag & drop para campos
- Operadores visuais (dropdowns)
- Preview em tempo real das condições
- Validação de sintaxe
- Teste com dados mockados

### **Pipeline Designer**
- Fluxograma visual das etapas
- Configuração de SLA por etapa
- Definição de aprovadores (autocomplete)
- Simulação de cenários

### **Dashboard de Monitoramento**
- Aprovações pendentes por módulo
- Tempo médio de aprovação
- Taxa de escalonamento
- Gargalos identificados
- Métricas de compliance

---

## 🔧 INTEGRAÇÕES OBRIGATÓRIAS

### **1. Sistema de Notificações**
- Integração com `server/modules/notifications/`
- Templates personalizáveis por tenant
- Suporte a i18n (pt-BR, en, es)

### **2. Auditoria Global**
- Log em `audit_logs` para toda ação
- Snapshot completo do estado antes/depois
- Rastreabilidade para compliance

### **3. SLA Management**
- Integração com `server/modules/sla/`
- Cálculo de SLA considerando horários/feriados
- Alertas proativos de vencimento

### **4. User Management**
- Resolução de hierarquia de usuários
- Validação de permissões RBAC
- Suporte a delegação temporária

---

## 📊 MÉTRICAS E KPIs

### **Dashboard Executivo**
- Tempo médio de aprovação por módulo
- Taxa de auto-aprovação vs manual
- Eficiência por tipo de aprovador
- Impacto no SLA dos processos

### **Relatórios Gerenciais**
- Aprovações por período/usuário/módulo
- Gargalos e escalações frequentes
- Análise de compliance e auditoria
- ROI do processo automatizado

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

1. **Funcionalidade Core**: Criação, execução e auditoria de regras funcionando para todos os módulos
2. **Performance**: Processar 1000+ aprovações simultâneas sem degradação
3. **Security**: Zero vazamento de dados cross-tenant
4. **Usability**: Interface intuitiva para criação de regras sem conhecimento técnico
5. **Compliance**: 100% das ações auditadas conforme padrões legais
6. **Integration**: Funcionamento seamless com todos os módulos existentes

---

## 🚀 ENTREGÁVEIS ESPERADOS

1. **Módulo completo** seguindo Clean Architecture
2. **Interface administrativa** para configuração de regras
3. **Dashboard** de monitoramento em tempo real
4. **Documentação técnica** completa
5. **Testes unitários** e de integração
6. **Scripts de migração** para dados existentes
7. **Guia do usuário** com exemplos práticos

---

**🎯 OBJETIVO FINAL**: Sistema de aprovações robusto, flexível e auditável que atenda às necessidades de compliance empresarial enquanto mantém a agilidade operacional, seguindo rigorosamente os padrões arquiteturais definidos em 1qa.md.
