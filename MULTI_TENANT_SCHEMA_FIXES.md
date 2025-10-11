# Multi-tenant Schema Fixes Required

## Problema Identificado
Alguns módulos estão usando o `db` global do Drizzle ORM sem configurar o schema correto do tenant, resultando em consultas que não acessam os dados corretos.

## Sintoma
- Dados não aparecem mesmo existindo
- Endpoints retornam 404 ou arrays vazios
- Filtro por `tenantId` não é suficiente se o schema não está configurado

## Módulos que Precisam de Correção

### 1. Ticket Templates Repository
**Arquivo:** `server/modules/ticket-templates/infrastructure/repositories/DrizzleTicketTemplateRepository.ts`

**Métodos com problema:**
- `findById()` - linha 186
- `findByName()` - linha 204
- `update()` - linha 222
- `delete()` - linha 247
- `findAll()` - linha 269
- Todos os métodos que usam `db.select()`, `db.update()`, `db.delete()`

**Solução:** Usar SQL bruto com schema explícito (similar ao Knowledge Base fix):

```typescript
async findById(id: string, tenantId: string): Promise<TicketTemplate | null> {
  try {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.ticket_templates
      WHERE id = ${id} AND tenant_id = ${tenantId}
      LIMIT 1
    `);
    
    return result.rows[0] ? this.mapFromDatabase(result.rows[0]) : null;
  } catch (error) {
    console.error('Error finding template by id:', error);
    return null;
  }
}
```

### 2. Technical Skills Routes
**Arquivo:** `server/modules/technical-skills/routes-working.ts`

**Rotas com problema:**
- POST `/working/skills` - linha 87
- GET `/working/skills` - linha 150
- GET `/working/skills/:id` - linha 211
- PUT `/working/skills/:id` - linha 232
- DELETE `/working/skills/:id` - linha 279
- POST `/working/user-skills` - linha 314
- GET `/working/user-skills` - linha 368
- E todas as outras rotas

**Solução:** Usar `getTenantDb()` ou SQL bruto:

**Opção 1 - getTenantDb:**
```typescript
import { getTenantDb } from '../../db-tenant';

router.post('/working/skills', async (req, res) => {
  const tenantId = req.user?.tenantId;
  const db = await getTenantDb(tenantId); // Configura search_path
  
  const [newSkill] = await db.insert(skills).values(newSkillData).returning();
  // ...
});
```

**Opção 2 - SQL bruto:**
```typescript
import { db, pool } from '../../db';
import { sql } from 'drizzle-orm';

router.post('/working/skills', async (req, res) => {
  const tenantId = req.user?.tenantId;
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
  
  const result = await pool.query(
    `INSERT INTO ${schemaName}.skills (tenant_id, name, category, ...) 
     VALUES ($1, $2, $3, ...) RETURNING *`,
    [tenantId, skillData.name, skillData.category, ...]
  );
  // ...
});
```

## Padrões Corretos a Seguir

### ✅ Padrão 1: getTenantDb (Preferido para Drizzle ORM)
```typescript
import { getTenantDb } from '@server/db-tenant';

const db = await getTenantDb(tenantId);
const result = await db.select().from(table).where(eq(table.id, id));
```

### ✅ Padrão 2: SQL bruto com sql.identifier
```typescript
import { db, sql } from '@server/db';

const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
const result = await db.execute(sql`
  SELECT * FROM ${sql.identifier(schemaName)}.table_name
  WHERE id = ${id}
`);
```

### ✅ Padrão 3: Pool direto com schema
```typescript
import { pool } from '@server/db';

const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
const result = await pool.query(
  `SELECT * FROM ${schemaName}.table_name WHERE id = $1`,
  [id]
);
```

### ❌ NUNCA fazer:
```typescript
// INCORRETO - db global sem configurar schema
import { db } from '@server/db';

const result = await db.select().from(table)
  .where(and(
    eq(table.id, id),
    eq(table.tenantId, tenantId) // Filtro não é suficiente!
  ));
```

## Outros Módulos a Verificar

Módulos que também usam `db` global e podem ter o mesmo problema:
- `server/modules/locations/infrastructure/repositories/DrizzleLocationRepository.ts`
- `server/modules/activity-planner/infrastructure/repositories/DrizzleActivityPlannerRepository.ts`
- `server/modules/gdpr-compliance/infrastructure/repositories/*`
- `server/modules/interactive-map/infrastructure/repositories/DrizzleInteractiveMapRepository.ts`

## Prioridade de Correção

1. **ALTA** - Ticket Templates (muito usado)
2. **ALTA** - Technical Skills (funcionalidade core)
3. **MÉDIA** - Locations (se usar db global)
4. **MÉDIA** - Activity Planner (se usar db global)
5. **BAIXA** - Outros módulos menos usados

## Teste após Correção

1. Verificar logs do servidor após mudanças
2. Testar CRUD básico em cada módulo
3. Confirmar que dados aparecem corretamente
4. Verificar que dados de diferentes tenants não vazam

## Observação
O problema do Knowledge Base foi corrigido usando SQL bruto com pool direto. A mesma abordagem pode ser aplicada aos outros módulos.
