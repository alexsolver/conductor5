// EMERGENCY DATABASE MANAGER - COMMONJS VERSION
// Fixes Node.js ES6/CommonJS import conflicts

const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { sql } = require('drizzle-orm');
const ws = require("ws");
const schema = require("../shared/schema");

// CRITICAL FIX: Patch ErrorEvent bug in Neon driver
const originalErrorEvent = globalThis.ErrorEvent;
if (originalErrorEvent) {
  globalThis.ErrorEvent = class PatchedErrorEvent extends originalErrorEvent {
    constructor(type, eventInitDict) {
      super(type, eventInitDict);
      Object.defineProperty(this, 'message', {
        value: eventInitDict?.message || '',
        writable: true,
        configurable: true
      });
    }
  };
}

neonConfig.webSocketConstructor = ws;
neonConfig.fetchConnectionCache = true;
neonConfig.useSecureWebSocket = false;
neonConfig.pipelineConnect = false;
neonConfig.poolQueryViaFetch = true;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000,
  max: 2,
  statement_timeout: 45000,
  query_timeout: 45000,
  retries: 5,
  retryDelay: 2000
});

const db = drizzle({ client: pool, schema });

// Simple schemaManager for backward compatibility
const schemaManager = {
  query: pool.query.bind(pool)
};

// Export everything
module.exports = {
  pool,
  db,
  sql,
  schema,
  schemaManager
};