// Main schema index - Re-exports all schema modules for backwards compatibility
// This maintains the existing import structure while providing modular organization

// Base schema exports
export * from "./base";
export * from "./customer";
export * from "./ticket";
export * from "./location";
export * from "./security";
export * from "./tenant-specific";

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