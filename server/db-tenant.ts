// TENANT-SPECIFIC DATABASE CONNECTION
// Configures Drizzle to use tenant-specific schemas

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create tenant-specific database connection
export function getTenantDb(tenantId: string) {
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
  
  // Create pool with schema search path
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    options: `-c search_path=${schemaName},public`
  });
  
  return drizzle({ client: pool, schema });
}

// Main db for public tables (users, tenants, sessions)
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });