#!/bin/bash
echo "🚀 [POSTGRESQL-AUTO] Iniciando PostgreSQL local..."

export PGDATA=$HOME/postgres_data

# Verificar se PostgreSQL já está rodando
if pgrep postgres > /dev/null; then
    echo "✅ PostgreSQL já está rodando"
    exit 0
fi

# Iniciar PostgreSQL
postgres -D $PGDATA > $HOME/postgres.log 2>&1 &
sleep 3

# Verificar se iniciou
if PGHOST=/tmp psql -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ PostgreSQL iniciado com sucesso"
    echo "📝 DATABASE_URL: postgresql://postgres@localhost/conductor_local?host=/tmp"
else
    echo "❌ Falha ao iniciar PostgreSQL"
    cat $HOME/postgres.log
fi
