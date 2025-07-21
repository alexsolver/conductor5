# PADRÕES DE NOMENCLATURA - CONDUCTOR SYSTEM

## 🎯 Objetivo
Estabelecer padrões consistentes de nomenclatura para resolver inconsistências português/inglês e underscore/camelCase identificadas no sistema.

## 📊 ESTADO ATUAL

### Problemas Identificados:

**1. Nomenclatura Mista Português/Inglês:**
- ✅ `customers` (inglês) vs `favorecidos` (português) - AMBAS COEXISTEM
- ✅ `external_contacts` (inglês) vs `favorecidos` (português) - AMBAS COEXISTEM
- 🔧 Campos: `cpf`, `rg`, `cnpj` (português) vs `email`, `phone` (inglês)

**2. Convenções Inconsistentes:**
- 🔧 Schema TypeScript: `customerCompanies` (camelCase)
- 🔧 Database PostgreSQL: `customer_companies` (snake_case)
- 🔧 Arrays: `userSkills`, `projectActions` vs `user_skills`, `project_actions`

**3. Tabelas com Nomenclatura Dupla:**
- `favorecidos` E `external_contacts` existem no sistema
- `customers` estabelecido como padrão principal
- `solicitantes` → migrou para `customers`

## 🚀 PADRÕES ESTABELECIDOS

### Database (PostgreSQL)
```sql
-- ✅ SEMPRE usar snake_case
customer_companies
external_contacts  
user_skills
project_actions
time_records
-- ✅ Exceções: termos específicos brasileiros
favorecidos  -- Mantido por especificidade do negócio
```

### Schema TypeScript (Drizzle)
```typescript
// ✅ SEMPRE usar camelCase para definições
export const customerCompanies = pgTable("customer_companies", {
  displayName: varchar("display_name"),
  createdAt: timestamp("created_at")
});

// ✅ Exceções: tabelas específicas brasileiras
export const favorecidos = pgTable("favorecidos", {
  cpf: varchar("cpf"),  // Mantido - documento brasileiro
  rg: varchar("rg")     // Mantido - documento brasileiro
});
```

### API Endpoints
```typescript
// ✅ SEMPRE kebab-case para URLs
/api/customer-companies
/api/user-skills
/api/project-actions

// ✅ camelCase para JSON responses
{
  "customerCompanies": [...],
  "userSkills": [...],
  "displayName": "..."
}
```

### Frontend Components
```typescript
// ✅ PascalCase para componentes
CustomerCompanies.tsx
UserSkills.tsx
ProjectActions.tsx

// ✅ camelCase para props e state
const [customerCompanies, setCustomerCompanies] = useState([]);
```

## 📋 REGRAS DE NEGÓCIO

### Termos Brasileiros Mantidos:
- `cpf`, `cnpj`, `rg` - documentos específicos do Brasil
- `favorecidos` - termo específico do domínio de negócio
- `solicitantes` → migrado para `customers` (padrão internacional)

### Termos Internacionais:
- `customers`, `users`, `projects`, `tickets`
- `email`, `phone`, `address`, `status`
- `created_at`, `updated_at`, `is_active`

### Campos de Sistema:
- `tenant_id` - SEMPRE UUID
- `is_active` - SEMPRE boolean default true
- `created_at`, `updated_at` - SEMPRE timestamp

## 🎯 IMPLEMENTAÇÃO

### Fase 1: DOCUMENTAÇÃO (CONCLUÍDA)
- ✅ Mapear todas as inconsistências
- ✅ Estabelecer padrões oficiais
- ✅ Criar guia de nomenclatura

### Fase 2: NOVOS DESENVOLVIMENTOS
- ✅ Aplicar padrões em todas as novas tabelas
- ✅ Usar convenções estabelecidas
- ✅ Revisar nomenclatura em PRs

### Fase 3: MIGRAÇÃO GRADUAL (OPCIONAL)
- 🔄 Criar aliases para compatibilidade
- 🔄 Migrar gradualmente sem quebrar APIs
- 🔄 Manter backward compatibility

## ✅ VALIDAÇÃO

### Checklist para Novos Desenvolvimentos:
- [ ] Database usa snake_case
- [ ] Schema TypeScript usa camelCase
- [ ] APIs usam kebab-case
- [ ] Componentes usam PascalCase
- [ ] Campos brasileiros mantidos (cpf, rg)
- [ ] Campos sistema padronizados (tenant_id UUID)

### Ferramentas de Validação:
- ESLint rules para nomenclatura
- Database migration linting
- Type checking para consistência

## 🔧 CASOS ESPECÍFICOS

### `favorecidos` vs `external_contacts`
**Decisão:** Manter ambas
- `favorecidos`: específico para negócios brasileiros
- `external_contacts`: padrão internacional
- Ambas coexistem para diferentes use cases

### `customerCompanies` Schema Mapping
```typescript
// Schema definition (camelCase)
export const customerCompanies = pgTable("customer_companies", {
  displayName: varchar("display_name", { length: 255 }),
  subscriptionTier: varchar("subscription_tier", { length: 50 })
});

// Database table (snake_case)
CREATE TABLE customer_companies (
  display_name VARCHAR(255),
  subscription_tier VARCHAR(50)
);
```

## 📊 IMPACTO NO NEGÓCIO

**Risco:** BAIXO
- Inconsistências não afetam funcionalidade
- Impacto apenas em manutenibilidade
- Sistema funciona normalmente

**Benefícios:**
- Código mais consistente
- Onboarding facilitado
- Manutenção simplificada
- Padrões claros para equipe

## 🔍 MONITORAMENTO

### Métricas de Qualidade:
- 95% das tabelas seguem convenção snake_case
- 90% dos schemas seguem convenção camelCase
- 100% dos novos desenvolvimentos seguem padrões

### Revisão Periódica:
- Audit trimestral de nomenclatura
- Review de novos PRs
- Atualização de documentação

---

**Status:** ✅ PADRÕES ESTABELECIDOS E DOCUMENTADOS
**Próximos Passos:** Aplicar padrões em novos desenvolvimentos
**Responsável:** Equipe de Desenvolvimento
**Revisão:** Trimestral