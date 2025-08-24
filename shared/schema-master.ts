// ========================================
// MASTER SCHEMA - UNIFIED IMPORT ARCHITECTURE
// ========================================
// This file serves as the single entry point for all schema definitions
// All actual table definitions are now separated into specialized files

// ========================================
// SCHEMA IMPORTS - NEW ARCHITECTURE
// ========================================
// Import public and tenant schemas from dedicated files
export * from "./schema-public";
export * from "./schema-tenant";

// Import specialized schemas
export * from "./schema-notifications";
export * from "./schema-expense-approval";

// Import temporary missing tables
export * from "./schema-temp";

// ========================================
// RE-EXPORT VALIDATION SCHEMAS
// ========================================
// These are automatically exported from the individual schema files
// but listed here for documentation purposes:
//
// FROM SCHEMA-PUBLIC:
// - insertTenantSchema, insertUserSchema, insertUserSessionSchema
// - Tenant, User, UserSession types
//
// FROM SCHEMA-TENANT:
// - insertCustomerSchema, insertCompanySchema, insertBeneficiarySchema
// - insertTicketSchema, insertPerformanceEvaluationSchema, etc.
// - Customer, Company, Beneficiary, Ticket types, etc.
//
// FROM SCHEMA-NOTIFICATIONS:
// - All notification-related schemas and types
//
// FROM SCHEMA-EXPENSE-APPROVAL:
// - All expense approval schemas and types

// ========================================
// LEGACY COMPATIBILITY NOTE
// ========================================
// All table definitions have been moved to dedicated schema files:
// - schema-public.ts: Cross-tenant essential tables (tenants, users, sessions, user_sessions)
// - schema-tenant.ts: Business data tables with tenant isolation
// - schema-notifications.ts: Notification system tables
// - schema-expense-approval.ts: Expense approval system tables
//
// This new architecture ensures:
// 1. Clear separation of concerns
// 2. Better maintainability
// 3. Proper tenant isolation
// 4. No circular dependencies
// 5. Easier testing and development