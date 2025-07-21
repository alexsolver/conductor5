# NOMENCLATURE STANDARDS GUIDE
**Established: July 21, 2025**

## Overview
This document defines the nomenclature standards for the Conductor platform, addressing the coexistence of Portuguese and English naming conventions in a Brazilian business context.

## 🎯 Core Principles

### 1. **Business Context First**
- Brazilian legal terms (CPF, CNPJ, RG) remain in Portuguese for accuracy
- International business terms (email, phone) use English for global compatibility
- Table names reflect target audience (favorecidos = Brazilian context, customers = international)

### 2. **Consistency Within Scope**
- Database fields: Always snake_case (`created_at`, `tenant_id`)
- TypeScript schema: Always camelCase (`createdAt`, `tenantId`)
- API endpoints: kebab-case URLs (`/api/customer-companies`)
- Components: PascalCase (`CustomerCompanies.tsx`)

### 3. **Functional Distinction**
- `favorecidos`: Brazilian entities with CPF/CNPJ (Portuguese context)
- `customers`: International entities with standard fields (English context)
- Both can coexist serving different business needs

## 📋 Detailed Standards

### Database Naming Conventions

#### ✅ CORRECT Patterns:
```sql
-- Table names: snake_case
CREATE TABLE customer_companies (...);
CREATE TABLE user_skills (...);
CREATE TABLE project_actions (...);

-- Field names: snake_case
tenant_id UUID NOT NULL
created_at TIMESTAMP DEFAULT NOW()
is_active BOOLEAN DEFAULT true
```

#### ❌ AVOID:
```sql
-- Mixed case in database
CREATE TABLE customerCompanies (...);
CREATE TABLE UserSkills (...);

-- Inconsistent field naming
createdAt TIMESTAMP  -- Should be created_at
tenantID UUID        -- Should be tenant_id
```

### TypeScript Schema Conventions

#### ✅ CORRECT Patterns:
```typescript
// Schema definitions: camelCase
export const customerCompanies = pgTable("customer_companies", {
  tenantId: uuid("tenant_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true)
});

// Types: camelCase
type CustomerCompany = typeof customerCompanies.$inferSelect;
```

### API Naming Conventions

#### ✅ CORRECT Patterns:
```typescript
// URL endpoints: kebab-case
GET /api/customer-companies
POST /api/user-skills
PUT /api/project-actions/:id

// JSON response: camelCase
{
  "customerCompanies": [...],
  "totalCount": 42,
  "isActive": true
}
```

### Component Naming Conventions

#### ✅ CORRECT Patterns:
```typescript
// File names: PascalCase
CustomerCompanies.tsx
UserSkills.tsx
ProjectActions.tsx

// Component names: PascalCase
export function CustomerCompanies() { ... }
export function UserSkillsManager() { ... }
```

## 🇧🇷 Brazilian-Specific Fields

### Legal Requirements (Keep Portuguese)
```typescript
// ✅ CORRECT - Legal accuracy required
cpf: varchar("cpf", { length: 14 })        // Brazilian tax ID
cnpj: varchar("cnpj", { length: 18 })      // Brazilian company ID  
rg: varchar("rg", { length: 20 })          // Brazilian identity document

// ✅ CORRECT - Business context
favorecidos: "Beneficiaries/Recipients in Brazilian business context"
```

### International Fields (Use English)
```typescript
// ✅ CORRECT - Global compatibility
email: varchar("email", { length: 255 })
phone: varchar("phone", { length: 20 })
firstName: varchar("first_name", { length: 100 })
lastName: varchar("last_name", { length: 100 })
```

## 🔧 Inconsistency Resolution Guidelines

### 1. **Field Name Conflicts**

**Problem**: `favorecidos.name` vs `customers.firstName/lastName`

**Resolution Options**:
- **Option A**: Standardize on `firstName/lastName` everywhere
- **Option B**: Use `name` for entities, `firstName/lastName` for people
- **Recommended**: Option B - business entities use `name`, individuals use `firstName/lastName`

### 2. **Phone Field Redundancy**

**Problem**: `phone` and `cellPhone` in same table

**Resolution**:
```typescript
// ✅ PREFERRED - Clear distinction
landlinePhone: varchar("landline_phone", { length: 20 })
mobilePhone: varchar("mobile_phone", { length: 20 })

// ✅ ALTERNATIVE - Primary/secondary
primaryPhone: varchar("primary_phone", { length: 20 })
secondaryPhone: varchar("secondary_phone", { length: 20 })
```

### 3. **Table Language Mixing**

**Current State**: 
- 1 Portuguese table: `favorecidos`
- 12+ English tables: `customers`, `tickets`, etc.

**Recommendation**: **KEEP AS-IS**
- `favorecidos` serves Brazilian market specifically
- English tables serve international/general use
- Both patterns have business justification

## 📊 Implementation Checklist

### For New Development:
- [ ] Database fields use snake_case
- [ ] TypeScript schema uses camelCase  
- [ ] API endpoints use kebab-case URLs
- [ ] Components use PascalCase
- [ ] Brazilian legal fields keep Portuguese names
- [ ] International business fields use English

### For Existing Code:
- [ ] Document business justification for mixed languages
- [ ] Resolve field naming conflicts (name vs firstName/lastName)
- [ ] Clarify phone field purposes (landline vs mobile)
- [ ] Maintain consistency within each table/module

## 🎯 Business Impact Assessment

### Risk Level: **LOW** 🟢
- Inconsistencies don't break functionality
- Mixed languages serve legitimate business purposes
- Primary impact is on developer experience and maintenance

### Benefits of Standardization:
1. **Developer Productivity**: Predictable naming patterns
2. **Code Maintainability**: Consistent conventions across codebase
3. **International Compatibility**: English for global features
4. **Legal Compliance**: Portuguese for Brazilian requirements

## 📚 Examples

### Complete Table Example:
```typescript
// Brazilian-specific table
export const favorecidos = pgTable("favorecidos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Business entity info (Portuguese context)
  name: varchar("name", { length: 255 }).notNull(),           // Entity name
  tradeName: varchar("trade_name", { length: 255 }),         // Nome fantasia
  
  // Brazilian legal fields (keep Portuguese)
  cpf: varchar("cpf", { length: 14 }),                       // Individual tax ID
  cnpj: varchar("cnpj", { length: 18 }),                     // Company tax ID
  rg: varchar("rg", { length: 20 }),                         // Identity document
  
  // International contact fields (English)
  email: varchar("email", { length: 255 }),
  primaryPhone: varchar("primary_phone", { length: 20 }),
  secondaryPhone: varchar("secondary_phone", { length: 20 }),
  
  // Standard system fields (English)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
```

## 🔄 Future Considerations

1. **Internationalization (i18n)**: Consider translatable display names while keeping database fields consistent
2. **API Documentation**: Document field purposes clearly for mixed-language APIs
3. **Migration Strategy**: Plan for potential future standardization if business requirements change

---

**Last Updated**: July 21, 2025  
**Next Review**: Quarterly or when expanding to new markets