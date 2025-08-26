
# PG-Migrations - Drizzle Kit Integration

Sistema de migrações integrado com Drizzle Kit para gerenciar o schema do banco PostgreSQL.

## Estrutura

```
server/migrations/pg-migrations/
├── config/
│   └── migration-manager.ts    # Gerenciador de migrações
├── public/                     # Migrações do schema público
│   └── 001_create_public_tables.sql
├── tenant/                     # Migrações do schema tenant (futuramente)
└── drizzle/                    # Migrações geradas pelo drizzle-kit
```

## Comandos Disponíveis

### 1. Executar migrações do schema público
```bash
tsx server/scripts/run-migrations.ts public
```

### 2. Executar migrações para um tenant específico
```bash
tsx server/scripts/run-migrations.ts tenant ff475b41-b21b-410d-9fea-aa02caa6a11c
```

### 3. Setup inicial completo
```bash
tsx server/scripts/run-migrations.ts setup
```

### 4. Gerar novas migrações com Drizzle Kit
```bash
npx drizzle-kit generate:pg
```

### 5. Executar migrações do Drizzle Kit
```bash
npx drizzle-kit push:pg
```

## Tabelas Criadas no Schema Público

### `tenants`
- id (UUID, PK)
- name (varchar 255)
- subdomain (varchar 100, unique)
- is_active (boolean, default true)
- created_at, updated_at (timestamp)
- settings, metadata (jsonb)

### `users`
- id (UUID, PK)
- tenant_id (UUID, FK → tenants.id)
- email (varchar 255, unique)
- password_hash (varchar 255)
- first_name, last_name (varchar 255)
- role (varchar 50, default 'user')
- is_active (boolean, default true)
- last_login, created_at, updated_at (timestamp)
- metadata (jsonb)

### `sessions`
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- tenant_id (UUID, FK → tenants.id)
- session_token (varchar 255, unique)
- expires_at, created_at (timestamp)
- ip_address (varchar 45)
- user_agent (text)

### `user_sessions`
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- session_token (varchar 500, unique)
- expires_at, created_at, updated_at (timestamp)
- is_active (boolean, default true)

## Integração com o Sistema

O sistema está integrado com `server/db.ts` através dos métodos:

- `schemaManager.runMigrations()` - Executa migrações públicas
- `schemaManager.runTenantMigrations(tenantId)` - Executa migrações de tenant

## Próximos Passos

1. Criar migrações para schema de tenant
2. Implementar rollback de migrações
3. Adicionar validação de integridade
4. Integrar com CI/CD pipeline
