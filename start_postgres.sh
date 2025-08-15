#!/bin/bash
echo "🚀 Iniciando PostgreSQL local..."
export PGDATA=$HOME/postgres_data
export PGHOST=$HOME/postgres_run
mkdir -p $PGHOST

# Iniciar PostgreSQL se não estiver rodando
if ! pgrep postgres > /dev/null; then
    postgres -D $PGDATA > $HOME/postgres.log 2>&1 &
    sleep 3
    echo "✅ PostgreSQL iniciado"
else
    echo "✅ PostgreSQL já está rodando"
fi

# Definir variáveis de ambiente
export DATABASE_URL="postgresql://postgres@localhost:5433/conductor_local?host=$HOME/postgres_run"
export PGPORT=5433
export PGUSER=postgres
export PGDATABASE=conductor_local

echo "🔧 PostgreSQL local configurado:"
echo "  - Database: $PGDATABASE"
echo "  - Socket: $PGHOST"
echo "  - URL: $DATABASE_URL"
