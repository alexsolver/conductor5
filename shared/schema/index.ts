// ENTERPRISE SCHEMA INDEX: Optimized modular exports for clean architecture
// Centralized export point maintaining backwards compatibility with improved organization

// Core domain schemas
export * from "./base";
export * from "./customer";
export * from "./customer-company";
export * from "./ticket";
export * from "./location";
export * from "./security";
export * from "./tenant-specific";
export * from "./user-management";
export * from "./technical-skills";

// SCHEMA CONSOLIDATION: Unified type exports to eliminate duplication

// Main schema aggregation for backwards compatibility
import { 
  sessions, 
  tenants, 
  users,
  insertSessionSchema,
  insertTenantSchema, 
  insertUserSchema,
  type Session,
  type Tenant,
  type User,
  type InsertSession,
  type InsertTenant,
  type InsertUser
} from "./base";

import { 
  customers,
  customerLocations,
  insertCustomerSchema,
  insertCustomerLocationSchema,
  type Customer,
  type InsertCustomer,
  type CustomerLocation,
  type InsertCustomerLocation
} from "./customer";

import {
  customerCompanies,
  customerCompanyMemberships,
  customerCompanyBilling,
  insertCustomerCompanySchema,
  insertCustomerCompanyMembershipSchema,
  insertCustomerCompanyBillingSchema,
  type CustomerCompany,
  type InsertCustomerCompany,
  type CustomerCompanyMembership,
  type InsertCustomerCompanyMembership,
  type CustomerCompanyBilling,
  type InsertCustomerCompanyBilling
} from "./customer-company";

// Removed: external-contacts imports - functionality eliminated

import {
  tickets,
  ticketMessages,
  insertTicketSchema,
  insertTicketMessageSchema,
  type Ticket,
  type TicketMessage,
  type InsertTicket,
  type InsertTicketMessage
} from "./ticket";

import {
  locations,
  insertLocationSchema,
  type Location,
  type InsertLocation
} from "./location";

import {
  securityEvents,
  userTwoFactor,
  accountLockouts,
  passwordResets,
  magicLinks,
  insertSecurityEventSchema,
  insertUserTwoFactorSchema,
  insertAccountLockoutSchema,
  insertPasswordResetSchema,
  insertMagicLinkSchema,
  type SecurityEvent,
  type UserTwoFactor,
  type AccountLockout,
  type PasswordReset,
  type MagicLink,
  type InsertSecurityEvent,
  type InsertUserTwoFactor,
  type InsertAccountLockout,
  type InsertPasswordReset,
  type InsertMagicLink
} from "./security";

import { getTenantSpecificSchema } from "./tenant-specific";

// Default export for backwards compatibility
export {
  // Base tables
  sessions,
  tenants,
  users,
  
  // Customer tables
  customers,
  customerLocations,
  customerCompanies,
  customerCompanyMemberships,
  customerCompanyBilling,
  
  // Removed: external contacts tables - functionality eliminated
  
  // Ticket tables
  tickets,
  ticketMessages,
  
  // Location tables
  locations,
  
  // Security tables
  securityEvents,
  userTwoFactor,
  accountLockouts,
  passwordResets,
  magicLinks,
  
  // Schema generators
  getTenantSpecificSchema,
  
  // Insert schemas
  insertSessionSchema,
  insertTenantSchema,
  insertUserSchema,
  insertCustomerSchema,
  insertCustomerLocationSchema,
  insertCustomerCompanySchema,
  insertCustomerCompanyMembershipSchema,
  insertCustomerCompanyBillingSchema,
  // Removed: external contact insert schemas - functionality eliminated
  insertTicketSchema,
  insertTicketMessageSchema,
  insertLocationSchema,
  insertSecurityEventSchema,
  insertUserTwoFactorSchema,
  insertAccountLockoutSchema,
  insertPasswordResetSchema,
  insertMagicLinkSchema,
  
  // Types
  type Session,
  type Tenant,
  type User,
  type Customer,
  type CustomerLocation,
  type CustomerCompany,
  type CustomerCompanyMembership,
  type CustomerCompanyBilling,
  // Removed: external contact types - functionality eliminated
  type Ticket,
  type TicketMessage,
  type Location,
  type SecurityEvent,
  type UserTwoFactor,
  type AccountLockout,
  type PasswordReset,
  type MagicLink,
  type InsertSession,
  type InsertTenant,
  type InsertUser,
  type InsertCustomer,
  type InsertCustomerLocation,
  type InsertCustomerCompany,
  type InsertCustomerCompanyMembership,
  type InsertCustomerCompanyBilling,
  // Removed: insert external contact types - functionality eliminated
  type InsertTicket,
  type InsertTicketMessage,
  type InsertLocation,
  type InsertSecurityEvent,
  type InsertUserTwoFactor,
  type InsertAccountLockout,
  type InsertPasswordReset,
  type InsertMagicLink,
};

// Legacy default export for current imports
const schema = {
  sessions,
  tenants,
  users,
  customers,
  customerLocations,
  customerCompanies,
  customerCompanyMemberships,
  customerCompanyBilling,
  tickets,
  ticketMessages,
  locations,
  securityEvents,
  userTwoFactor,
  accountLockouts,
  passwordResets,
  magicLinks,
  getTenantSpecificSchema,
};

export default schema;