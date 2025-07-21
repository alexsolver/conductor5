// UNIFIED SCHEMA - SINGLE SOURCE OF TRUTH
// This file consolidates all fragmented schema definitions into one authoritative source
// Replaces: schema-simple.ts, schema-unified.ts, modular schema/index.ts conflicts

// ARCHITECTURE CONSOLIDATION: Use schema-master.ts as the single source of truth
// Eliminates fragmentation between multiple schema files and SQL raw creation logic
export * from "./schema-master";