# ANÁLISE CRÍTICA: Inconsistências de Foreign Key no Schema

## PROBLEMA ARQUITETURAL IDENTIFICADO

### 🚨 INCONSISTÊNCIAS CRÍTICAS

#### 1. Nomenclatura Inconsistente
```typescript
// PROBLEMA: Mistura de snake_case e camelCase
customerId vs customer_id
companyId vs customer_company_id
```

#### 2. Referências FK Incorretas
```typescript
// ❌ ERRO CRÍTICO - Linha 2661 em schema-master.ts
customerCompanyId: uuid("customer_company_id").references(() => customers.id, { onDelete: 'cascade' })
// ✅ DEVERIA SER:
customerCompanyId: uuid("customer_company_id").references(() => customerCompanies.id, { onDelete: 'cascade' })
```

#### 3. Estrutura Conceitual Correta
```
customer_companies.id ← Empresa cliente (entidade principal)
├── customers.id ← Pessoas/usuários da empresa 
└── customer_company_memberships ← Relacionamento N:N
```

### 🔍 TABELAS AFETADAS

#### A. Tickets (PROBLEMA PRINCIPAL)
```typescript
// ❌ FALTANDO campo empresa
tickets: {
  callerId: uuid("caller_id").references(() => customers.id), // Pessoa
  // FALTANDO: customerCompanyId
}

// ✅ DEVERIA TER:
tickets: {
  callerId: uuid("caller_id").references(() => customers.id),
  customerCompanyId: uuid("customer_company_id").references(() => customerCompanies.id),
}
```

#### B. Configurações de Ticket
```typescript
// ❌ TODAS referenciam customers.id
ticketCategories.customerId → customers.id
ticketSubcategories.customerId → customers.id  
ticketActions.customerId → customers.id

// ✅ DEVERIAM referenciar customer_companies.id
```

#### C. Customer Company Memberships
```typescript
// ❌ LINHA 2661 - ERRO CRÍTICO
customerCompanyId: uuid("customer_company_id").references(() => customers.id)
// ✅ DEVE SER:
customerCompanyId: uuid("customer_company_id").references(() => customerCompanies.id)
```

### 🎯 IMPACTOS DOS PROBLEMAS

1. **Filtros Quebrados**: MaterialsServicesMiniSystem não consegue filtrar por empresa
2. **Relacionamentos Incorretos**: FKs apontando para entidades erradas
3. **Queries Falhas**: JOINs retornando dados incorretos
4. **Inconsistência de Dados**: Referências órfãs no banco

### 📋 PLANO DE CORREÇÃO SISTEMÁTICA

#### Fase 1: Corrigir Tickets (PRIORITÁRIO)
- [ ] Adicionar `customerCompanyId` à tabela tickets
- [ ] Migrar dados existentes baseados em relacionamentos
- [ ] Atualizar todas as queries que usam tickets

#### Fase 2: Padronizar Nomenclatura
- [ ] Definir padrão: `customer_company_id` (snake_case)
- [ ] Atualizar todas as referências FK
- [ ] Padronizar índices e constraints

#### Fase 3: Corrigir Configurações
- [ ] Alterar ticketCategories.customerId → customerCompanyId
- [ ] Alterar ticketSubcategories.customerId → customerCompanyId
- [ ] Alterar ticketActions.customerId → customerCompanyId

#### Fase 4: Validar Integridade
- [ ] Verificar todas as Foreign Keys
- [ ] Testar queries críticas
- [ ] Validar filtros por empresa

### ⚠️ CORREÇÃO IMEDIATA NECESSÁRIA

**LINHA 2661** em schema-master.ts:
```typescript
// ❌ ERRO CRÍTICO ATUAL:
customerCompanyId: uuid("customer_company_id").references(() => customers.id, { onDelete: 'cascade' })

// ✅ CORREÇÃO IMEDIATA:
customerCompanyId: uuid("customer_company_id").references(() => customerCompanies.id, { onDelete: 'cascade' })
```

---
*Documento criado em: ${new Date().toISOString()}*
*Status: CRÍTICO - Correção Imediata Necessária*