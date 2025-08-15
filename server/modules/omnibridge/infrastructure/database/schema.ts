
import { pgTable, varchar, timestamp, jsonb, boolean, text, integer } from 'drizzle-orm/pg-core';

export const omnibridgeChannels = pgTable('omnibridge_channels', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  integrationId: varchar('integration_id', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('inactive'),
  config: jsonb('config').default({}),
  features: jsonb('features').default([]),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  lastSync: timestamp('last_sync'),
  metrics: jsonb('metrics').default({}),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const omnibridgeMessages = pgTable('omnibridge_messages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  channelId: varchar('channel_id', { length: 36 }).notNull(),
  channelType: varchar('channel_type', { length: 50 }).notNull(),
  fromAddress: text('from_address'),
  toAddress: text('to_address'),
  subject: text('subject'),
  content: text('content'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('unread'),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'),
  tags: jsonb('tags').default([]),
  attachments: integer('attachments').default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
