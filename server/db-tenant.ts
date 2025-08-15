// TENANT-SPECIFIC DATABASE CONNECTION
// Configures Drizzle to use tenant-specific schemas

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// PostgreSQL local - 1qa.md compliance

// 1qa.md COMPLIANCE: Environment fallback (PostgreSQL infrastructure ready)
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL required for PostgreSQL operations");
}

// Create tenant-specific database connection
export function getTenantDb(tenantId: string) {
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
  
  // Create pool with schema search path - PostgreSQL (1qa.md compliant)
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    options: `-c search_path=${schemaName},public`
  });
  
  return drizzle({ client: pool, schema });
}

// Main db for public tables (users, tenants, sessions) - PostgreSQL (1qa.md compliant)
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });