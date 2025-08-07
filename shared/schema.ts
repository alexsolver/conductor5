// UNIFIED SCHEMA - SINGLE SOURCE OF TRUTH
// Re-exports from schema-master.ts as the authoritative source

export * from "./schema-master";

// Validation: Ensure all critical exports are available
import type { 
  User, Customer, Ticket, Tenant,
  TicketPlannedItem, TicketConsumedItem,
  Item, PriceList, PricingRule
} from "./schema-master";

// Re-export all types for consistency
export type {
  User, Customer, Ticket, Tenant,
  TicketPlannedItem, TicketConsumedItem,
  Item, PriceList, PricingRule
};

// This file serves as the single entry point for all schema definitions
// All imports should use: import { ... } from '@shared/schema'