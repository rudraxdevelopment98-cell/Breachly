#!/bin/bash
# Creates each database listed in POSTGRES_MULTIPLE_DATABASES (comma-separated).
# Runs once on first container init. Each aegis service owns its own DB (§4).
set -euo pipefail

if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
  IFS=',' read -ra DBS <<< "$POSTGRES_MULTIPLE_DATABASES"
  for db in "${DBS[@]}"; do
    db="$(echo "$db" | tr -d '[:space:]')"
    echo "Creating database '$db'"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
      SELECT 'CREATE DATABASE $db' WHERE NOT EXISTS (
        SELECT FROM pg_database WHERE datname = '$db'
      )\gexec
EOSQL
  done
fi
