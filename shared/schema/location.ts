import { pgTable, uuid, varchar, text, timestamp, jsonb, decimal, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Location types enum
export const locationTypeEnum = pgEnum('location_type', [
  'cliente',
  'ativo', 
  'filial',
  'tecnico',
  'parceiro'
]);

// Location status enum  
export const locationStatusEnum = pgEnum('location_status', [
  'ativo',
  'inativo',
  'manutencao',
  'suspenso'
]);

// Locations table - tenant-specific
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: locationTypeEnum('type').notNull(),
  status: locationStatusEnum('status').notNull().default('ativo'),
  
  // Address fields
  address: text('address').notNull(),
  number: varchar('number', { length: 20 }),
  complement: varchar('complement', { length: 100 }),
  neighborhood: varchar('neighborhood', { length: 100 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 50 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 50 }).notNull().default('Brasil'),
  
  // Geographic coordinates
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  
  // Business hours and SLA
  businessHours: jsonb('business_hours').default('{}'),
  specialHours: jsonb('special_hours').default('{}'), // Holidays, exceptions
  timezone: varchar('timezone', { length: 50 }).default('America/Sao_Paulo'),
  slaId: uuid('sla_id'), // Reference to SLA
  
  // Access and security
  accessInstructions: text('access_instructions'),
  requiresAuthorization: boolean('requires_authorization').default(false),
  securityEquipment: jsonb('security_equipment').default('[]'),
  emergencyContacts: jsonb('emergency_contacts').default('[]'),
  
  // Metadata and customization
  metadata: jsonb('metadata').default('{}'),
  tags: jsonb('tags').default('[]'),
  
  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

// Zod schemas
export const insertLocationSchema = createInsertSchema(locations, {
  name: z.string().min(1, "Nome é obrigatório").max(255),
  type: z.enum(['cliente', 'ativo', 'filial', 'tecnico', 'parceiro']),
  status: z.enum(['ativo', 'inativo', 'manutencao', 'suspenso']),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  zipCode: z.string().min(1, "CEP é obrigatório"),
  country: z.string().default('Brasil'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  businessHours: z.record(z.any()).optional(),
  specialHours: z.record(z.any()).optional(),
  timezone: z.string().default('America/Sao_Paulo'),
  accessInstructions: z.string().optional(),
  requiresAuthorization: z.boolean().optional(),
  securityEquipment: z.array(z.string()).optional(),
  emergencyContacts: z.array(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const selectLocationSchema = createSelectSchema(locations);

// Types
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type UpdateLocation = Partial<InsertLocation>;

// Business hours type
export interface BusinessHours {
  [day: string]: {
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    breaks?: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
}

// Emergency contact type
export interface EmergencyContact {
  name: string;
  phone: string;
  email?: string;
  role: string;
  isPrimary?: boolean;
}

// Location with distance (for proximity searches)
export interface LocationWithDistance extends Location {
  distance?: number;
  distanceUnit?: 'km' | 'miles';
}