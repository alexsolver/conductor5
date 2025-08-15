#!/bin/bash
echo "🚀 Auto-iniciando PostgreSQL local..."
export PGDATA=$HOME/postgres_data

# Verificar se já está rodando
if PGHOST=/tmp psql -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ PostgreSQL já rodando"
    exit 0
fi

# Iniciar PostgreSQL
/nix/store/yz718sizpgsnq2y8gfv8bba8l8r4494l-postgresql-16.3/bin/postgres -D $PGDATA > $HOME/postgres.log 2>&1 &
sleep 5

if PGHOST=/tmp psql -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ PostgreSQL iniciado com sucesso"
else
    echo "❌ Falha ao iniciar PostgreSQL"
    cat $HOME/postgres.log
fi
