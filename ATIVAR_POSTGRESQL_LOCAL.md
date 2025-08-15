# Como Ativar PostgreSQL Local - Agosto 2025

## Status Atual
- ✅ PostgreSQL local instalado e funcionando
- ✅ Dados migrados completamente (4.8MB)
- ✅ Socket Unix funcionando: `/tmp/.s.PGSQL.5432`
- ✅ Script de inicialização: `./start_postgres.sh`

## Para Ativar PostgreSQL Local

### 1. Verificar se PostgreSQL está rodando
```bash
PGHOST=/tmp psql -U postgres -d conductor_local -c "SELECT version();"
```

### 2. Se não estiver rodando, iniciar
```bash
./start_postgres.sh
```

### 3. Alterar arquivo `server/db.ts`
Substituir a linha:
```typescript
const DATABASE_URL = process.env.DATABASE_URL
```

Por:
```typescript
const DATABASE_URL = `postgresql://postgres@localhost/conductor_local?host=/tmp`
```

### 4. Reiniciar aplicação
A aplicação se conectará automaticamente no PostgreSQL local.

## Dados Disponíveis
- Schema público: ✅ Migrado
- 4 Tenant schemas: ✅ Migrados
- Todos os dados: ✅ Preservados

## Backup de Segurança
Localizado em: `/tmp/neon_backup/` (4.8MB)
