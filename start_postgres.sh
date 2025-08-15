#!/bin/bash
# PostgreSQL Auto-Start Script - 1qa.md Compliance

export PGDATA=$HOME/postgres_data

# Check if PostgreSQL is already running
if psql -h localhost -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ PostgreSQL already running"
    exit 0
fi

# Start PostgreSQL
echo "🚀 Starting PostgreSQL local..."
/nix/store/yz718sizpgsnq2y8gfv8bba8l8r4494l-postgresql-16.3/bin/postgres -D $PGDATA > $HOME/postgres.log 2>&1 &

# Wait and verify
sleep 5
if psql -h localhost -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ PostgreSQL started successfully"
else
    echo "❌ PostgreSQL failed to start"
    cat $HOME/postgres.log
    exit 1
fi
