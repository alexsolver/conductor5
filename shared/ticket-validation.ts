
// PROBLEM 10 RESOLVED: Complete Zod schema for ticket validation
import { z } from 'zod';

// Enums for strict validation (English values for database compatibility)
export const TicketStatusEnum = z.enum(['new', 'open', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled']);
export const TicketPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent', 'critical']);
export const TicketImpactEnum = z.enum(['low', 'medium', 'high']);
export const TicketUrgencyEnum = z.enum(['low', 'medium', 'high']);
export const TicketCategoryEnum = z.enum(['support', 'incident', 'request', 'change', 'problem', 'maintenance']);
export const CallerTypeEnum = z.enum(['user', 'customer', 'system']);
export const ContactTypeEnum = z.enum(['email', 'phone', 'chat', 'portal', 'api']);
export const LinkTypeEnum = z.enum(['relates_to', 'blocks', 'blocked_by', 'duplicates', 'caused_by']);

// Base ticket schema with all required fields marked
export const ticketFormSchema = z.object({
  // Required fields
  subject: z.string()
    .min(3, "Subject must be at least 3 characters")
    .max(255, "Subject cannot exceed 255 characters"),
  
  // Optional but validated fields
  description: z.string()
    .max(4000, "Description cannot exceed 4000 characters")
    .optional(),
  
  // Enums with validation
  status: TicketStatusEnum.default('new'),
  priority: TicketPriorityEnum.default('medium'),
  impact: TicketImpactEnum.optional(),
  urgency: TicketUrgencyEnum.optional(),
  category: z.string().refine(val => !val || TicketCategoryEnum.safeParse(val).success, "Invalid category").optional(),
  
  // Subcategory dependent on category
  subcategory: z.string().max(100).optional(),
  
  // Person fields with UUID validation (accepts empty string)
  callerId: z.string().refine(val => !val || z.string().uuid().safeParse(val).success, "Caller ID must be a valid UUID").optional(),
  callerType: CallerTypeEnum.default('customer'),
  beneficiaryId: z.string().refine(val => !val || z.string().uuid().safeParse(val).success, "Beneficiary ID must be a valid UUID").optional(),
  beneficiaryType: CallerTypeEnum.default('customer'),
  assignedToId: z.string().refine(val => !val || z.string().uuid().safeParse(val).success, "Assigned to ID must be a valid UUID").optional(),
  
  // Location field (accepts empty string)
  location: z.string().refine(val => !val || z.string().uuid().safeParse(val).success, "Location must be a valid UUID").optional(),
  
  // Assignment group
  assignmentGroup: z.string().max(100).optional(),
  
  // Contact
  contactType: ContactTypeEnum.default('email'),
  
  // Business fields
  businessImpact: z.string().max(500).optional(),
  symptoms: z.string().max(1000).optional(),
  workaround: z.string().max(1000).optional(),
  resolution: z.string().max(2000).optional(),
  
  // Estimated/Actual hours
  estimatedHours: z.number()
    .min(0, "Estimated hours must be positive")
    .max(999, "Estimated hours cannot exceed 999")
    .optional(),
  actualHours: z.number()
    .min(0, "Actual hours must be positive")
    .max(999, "Actual hours cannot exceed 999")
    .optional(),
  
  // SLA and Due date
  dueDate: z.string()
    .datetime("Due date must be in valid ISO format")
    .optional(),
  
  // JSON Arrays
  followers: z.array(z.string().uuid()).default([]),
  tags: z.array(z.string().max(50)).default([]),
  
  // Customer company relationship
  customerCompanyId: z.string().refine(val => !val || z.string().uuid().safeParse(val).success, "Company ID must be a valid UUID").optional(),
  
  // Environment
  environment: z.string().max(100).optional(),
  
  // Alternative template
  templateAlternative: z.string().max(200).optional(),
  
  // Linking fields
  linkTicketNumber: z.string().max(50).optional(),
  linkType: z.string().refine(val => !val || LinkTypeEnum.safeParse(val).success, "Invalid link type").optional(),
  linkComment: z.string().max(500).optional(),
})
.refine((data) => {
  // Conditional validation: if linkTicketNumber exists, linkType is required
  if (data.linkTicketNumber && !data.linkType) {
    return false;
  }
  return true;
}, {
  message: "Link type is required when related ticket number is provided",
  path: ["linkType"]
})
.refine((data) => {
  // Conditional validation: impact and urgency must exist together to calculate priority
  if ((data.impact && !data.urgency) || (!data.impact && data.urgency)) {
    return false;
  }
  return true;
}, {
  message: "Impact and urgency must be defined together",
  path: ["impact", "urgency"]
});

// Schema for ticket creation without refine (doesn't support omit/partial)
const baseTicketSchema = z.object({
  subject: z.string()
    .min(3, "Subject must be at least 3 characters")
    .max(255, "Subject cannot exceed 255 characters"),
  description: z.string()
    .max(4000, "Description cannot exceed 4000 characters")
    .optional(),
  status: TicketStatusEnum.default('new'),
  priority: TicketPriorityEnum.default('medium'),
  impact: TicketImpactEnum.optional(),
  urgency: TicketUrgencyEnum.optional(),
  category: TicketCategoryEnum.optional(),
  subcategory: z.string().max(100).optional(),
  callerId: z.string().uuid().optional(),
  callerType: CallerTypeEnum.default('customer'),
  beneficiaryId: z.string().uuid().optional(),
  beneficiaryType: CallerTypeEnum.default('customer'),
  assignedToId: z.string().uuid().optional(),
  location: z.union([
    z.string().uuid(),
    z.literal("unspecified")
  ]).optional(),
  assignmentGroup: z.string().max(100).optional(),
  contactType: ContactTypeEnum.default('email'),
  businessImpact: z.string().max(500).optional(),
  symptoms: z.string().max(1000).optional(),
  workaround: z.string().max(1000).optional(),
  resolution: z.string().max(2000).optional(),
  estimatedHours: z.number().min(0).max(999).optional(),
  actualHours: z.number().min(0).max(999).optional(),
  dueDate: z.string().datetime().optional(),
  followers: z.array(z.string().uuid()).default([]),
  tags: z.array(z.string().max(50)).default([]),
  customerCompanyId: z.string().uuid().optional(),
  environment: z.string().max(100).optional(),
  linkTicketNumber: z.string().max(50).optional(),
  linkType: LinkTypeEnum.optional(),
  linkComment: z.string().max(500).optional(),
});

// Schema for ticket creation
export const createTicketSchema = baseTicketSchema.extend({
  customerId: z.string().uuid("Customer ID is required")
});

// Refactored schema for new ticket creation modal
export const newTicketModalSchema = z.object({
  // Company (required)
  companyId: z.string().uuid("Company is required").min(1, "Company is required"),
  // Customer (required)
  customerId: z.string().uuid("Customer is required").min(1, "Customer is required"),
  // Beneficiary (optional)
  beneficiaryId: z.string().uuid("Beneficiary ID must be a valid UUID").optional(),
  // Ticket Title (required)
  subject: z.string().min(3, "Title must be at least 3 characters").max(255, "Title cannot exceed 255 characters"),
  // Category (required)
  category: z.string().min(1, "Category is required"),
  // Sub Category (required)
  subcategory: z.string().min(1, "Sub category is required"),
  // Action (required)
  action: z.string().min(1, "Action is required"),
  // Priority (required) - using enum for correct validation
  priority: TicketPriorityEnum,
  // Urgency (required) - using enum for correct validation  
  urgency: TicketUrgencyEnum,
  // Detailed Description (required)
  description: z.string().min(10, "Description must be at least 10 characters").max(4000, "Description cannot exceed 4000 characters"),
  // Symptoms (optional)
  symptoms: z.string().max(1000, "Symptoms cannot exceed 1000 characters").optional(),
  // Business Impact (optional)
  businessImpact: z.string().max(500, "Business impact cannot exceed 500 characters").optional(),
  // Temporary Solution (optional)
  workaround: z.string().max(1000, "Temporary solution cannot exceed 1000 characters").optional(),
  // Location (optional)
  location: z.string().optional()
});

// Schema for ticket update (all fields optional)
export const updateTicketSchema = baseTicketSchema.partial();

// TypeScript types derived from schemas
export type TicketFormData = z.infer<typeof ticketFormSchema>;
export type CreateTicketData = z.infer<typeof createTicketSchema>;
export type UpdateTicketData = z.infer<typeof updateTicketSchema>;
export type NewTicketModalData = z.infer<typeof newTicketModalSchema>;

// Schema for table filters validation
export const ticketFiltersSchema = z.object({
  status: z.union([TicketStatusEnum, z.literal("all")]).default("all"),
  priority: z.union([TicketPriorityEnum, z.literal("all")]).default("all"),
  category: z.union([TicketCategoryEnum, z.literal("all")]).default("all"),
  assignedToId: z.string().uuid().optional(),
  customerCompanyId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().max(255).optional()
});

export type TicketFiltersData = z.infer<typeof ticketFiltersSchema>;

// Helper functions for validation
export const validateTicketForm = (data: unknown) => {
  return ticketFormSchema.safeParse(data);
};

export const validateCreateTicket = (data: unknown) => {
  return createTicketSchema.safeParse(data);
};

export const validateUpdateTicket = (data: unknown) => {
  return updateTicketSchema.safeParse(data);
};

export const validateTicketFilters = (data: unknown) => {
  return ticketFiltersSchema.safeParse(data);
};
