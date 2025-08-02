// UNIFIED SCHEMA - SINGLE SOURCE OF TRUTH
// Re-exports from schema-master.ts as the authoritative source

export * from "./schema-master";

// This file serves as the single entry point for all schema definitions
// All imports should use: import { ... } from '@shared/schema'

// Validation: Ensure all exports are properly typed
import type { 
  User, Customer, Ticket, Tenant
} from "./schema-master";

// Re-export types for consistency
export type {
  User, Customer, Ticket, Tenant
};