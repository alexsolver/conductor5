// ✅ CHAT & QUEUE MANAGEMENT SCHEMA - MULTI-TENANT SUPPORT
// Chat system with queue management, real-time messaging, and OmniBridge integration

import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========================================
// ENUMS DEFINITION
// ========================================

export const chatTypeEnum = pgEnum("chat_type_enum", ["direct", "group", "support"]);
export const chatStatusEnum = pgEnum("chat_status_enum", ["active", "closed", "archived"]);
export const queueStrategyEnum = pgEnum("queue_strategy_enum", ["fifo", "priority", "skill_based", "round_robin", "least_busy"]);
export const queueEntryStatusEnum = pgEnum("queue_entry_status_enum", ["waiting", "assigned", "in_progress", "completed", "cancelled", "timeout"]);
export const agentStatusEnum = pgEnum("agent_status_enum", ["available", "busy", "away", "offline"]);
export const messageTypeEnum = pgEnum("message_type_enum", ["text", "file", "image", "system"]);
export const transferTypeEnum = pgEnum("transfer_type_enum", ["agent", "queue", "supervisor"]);

// ========================================
// CHAT QUEUES
// ========================================

export const chatQueues = pgTable("chat_queues", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  strategy: queueStrategyEnum("strategy").default("fifo").notNull(),
  maxConcurrentChats: integer("max_concurrent_chats").default(3).notNull(),
  maxWaitTime: integer("max_wait_time").default(600), // seconds, 10 min default
  skills: jsonb("skills").default([]), // Required skills for agents
  autoAssign: boolean("auto_assign").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdById: uuid("created_by_id"),
  updatedById: uuid("updated_by_id"),
}, (table) => ({
  tenantIdx: index("chat_queues_tenant_idx").on(table.tenantId),
  activeIdx: index("chat_queues_active_idx").on(table.tenantId, table.isActive),
}));

// ========================================
// QUEUE MEMBERS (Agents in queues)
// ========================================

export const queueMembers = pgTable("queue_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  queueId: uuid("queue_id").notNull(),
  userId: uuid("user_id").notNull(),
  skills: jsonb("skills").default([]),
  maxConcurrentChats: integer("max_concurrent_chats").default(3).notNull(),
  priority: integer("priority").default(1), // Higher = more priority for round-robin
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  queueIdx: index("queue_members_queue_idx").on(table.queueId),
  userIdx: index("queue_members_user_idx").on(table.userId),
  activeIdx: index("queue_members_active_idx").on(table.queueId, table.isActive),
}));

// ========================================
// QUEUE ENTRIES (Customers waiting in queue)
// ========================================

export const queueEntries = pgTable("queue_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  queueId: uuid("queue_id").notNull(),
  customerId: uuid("customer_id"), // Can be null for anonymous
  customerName: varchar("customer_name", { length: 255 }),
  customerChannel: varchar("customer_channel", { length: 50 }), // whatsapp, telegram, email, web
  customerIdentifier: varchar("customer_identifier", { length: 255 }), // phone, email, user_id
  conversationId: varchar("conversation_id", { length: 255 }), // From OmniBridge
  status: queueEntryStatusEnum("status").default("waiting").notNull(),
  priority: integer("priority").default(1), // Higher = more urgent
  assignedAgentId: uuid("assigned_agent_id"),
  assignedAt: timestamp("assigned_at"),
  chatId: uuid("chat_id"), // Created when assigned
  waitStartedAt: timestamp("wait_started_at").defaultNow().notNull(),
  waitEndedAt: timestamp("wait_ended_at"),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").default({}),
  slaExceeded: boolean("sla_exceeded").default(false),
  escalated: boolean("escalated").default(false),
  escalatedAt: timestamp("escalated_at"),
}, (table) => ({
  queueIdx: index("queue_entries_queue_idx").on(table.queueId),
  statusIdx: index("queue_entries_status_idx").on(table.status),
  waitingIdx: index("queue_entries_waiting_idx").on(table.queueId, table.status, table.priority),
  assignedIdx: index("queue_entries_assigned_idx").on(table.assignedAgentId),
  conversationIdx: index("queue_entries_conversation_idx").on(table.conversationId),
}));

// ========================================
// AGENT STATUS (Real-time agent availability)
// ========================================

export const agentStatus = pgTable("agent_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  status: agentStatusEnum("status").default("offline").notNull(),
  currentChatsCount: integer("current_chats_count").default(0).notNull(),
  maxConcurrentChats: integer("max_concurrent_chats").default(3).notNull(),
  lastStatusChange: timestamp("last_status_change").defaultNow().notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("agent_status_user_idx").on(table.userId),
  statusIdx: index("agent_status_status_idx").on(table.tenantId, table.status),
  availableIdx: index("agent_status_available_idx").on(table.tenantId, table.status, table.currentChatsCount),
}));

// ========================================
// CHATS
// ========================================

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  type: chatTypeEnum("type").default("support").notNull(),
  status: chatStatusEnum("status").default("active").notNull(),
  title: varchar("title", { length: 255 }),
  queueId: uuid("queue_id"),
  queueEntryId: uuid("queue_entry_id"),
  conversationId: varchar("conversation_id", { length: 255 }), // Link to OmniBridge
  customerId: uuid("customer_id"),
  customerChannel: varchar("customer_channel", { length: 50 }),
  ticketId: uuid("ticket_id"), // Link to ticket if created
  assignedAgentId: uuid("assigned_agent_id"),
  transferHistory: jsonb("transfer_history").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  closedById: uuid("closed_by_id"),
}, (table) => ({
  tenantIdx: index("chats_tenant_idx").on(table.tenantId),
  statusIdx: index("chats_status_idx").on(table.tenantId, table.status),
  queueIdx: index("chats_queue_idx").on(table.queueId),
  agentIdx: index("chats_agent_idx").on(table.assignedAgentId),
  conversationIdx: index("chats_conversation_idx").on(table.conversationId),
  customerIdx: index("chats_customer_idx").on(table.customerId),
}));

// ========================================
// CHAT PARTICIPANTS
// ========================================

export const chatParticipants = pgTable("chat_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  chatId: uuid("chat_id").notNull(),
  userId: uuid("user_id"),
  role: varchar("role", { length: 50 }).default("participant"), // participant, supervisor, observer
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
  isActive: boolean("is_active").default(true).notNull(),
}, (table) => ({
  chatIdx: index("chat_participants_chat_idx").on(table.chatId),
  userIdx: index("chat_participants_user_idx").on(table.userId),
  activeIdx: index("chat_participants_active_idx").on(table.chatId, table.isActive),
}));

// ========================================
// MESSAGES
// ========================================

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  chatId: uuid("chat_id").notNull(),
  senderId: uuid("sender_id"),
  senderName: varchar("sender_name", { length: 255 }),
  type: messageTypeEnum("type").default("text").notNull(),
  content: text("content"),
  attachmentUrl: text("attachment_url"),
  attachmentType: varchar("attachment_type", { length: 50 }),
  attachmentName: varchar("attachment_name", { length: 255 }),
  metadata: jsonb("metadata").default({}),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  readBy: jsonb("read_by").default([]), // Array of user IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  isEdited: boolean("is_edited").default(false),
}, (table) => ({
  chatIdx: index("chat_messages_chat_idx").on(table.chatId),
  senderIdx: index("chat_messages_sender_idx").on(table.senderId),
  createdIdx: index("chat_messages_created_idx").on(table.chatId, table.createdAt),
  unreadIdx: index("chat_messages_unread_idx").on(table.chatId, table.isRead),
}));

// ========================================
// MESSAGE REACTIONS
// ========================================

export const messageReactions = pgTable("message_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  messageId: uuid("message_id").notNull(),
  userId: uuid("user_id").notNull(),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  messageIdx: index("message_reactions_message_idx").on(table.messageId),
  userEmojiIdx: index("message_reactions_user_emoji_idx").on(table.messageId, table.userId, table.emoji),
}));

// ========================================
// CHAT TRANSFERS (Audit log for transfers)
// ========================================

export const chatTransfers = pgTable("chat_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  chatId: uuid("chat_id").notNull(),
  type: transferTypeEnum("type").notNull(),
  fromAgentId: uuid("from_agent_id"),
  toAgentId: uuid("to_agent_id"),
  fromQueueId: uuid("from_queue_id"),
  toQueueId: uuid("to_queue_id"),
  reason: text("reason"),
  notes: text("notes"),
  initiatedById: uuid("initiated_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  chatIdx: index("chat_transfers_chat_idx").on(table.chatId),
  fromAgentIdx: index("chat_transfers_from_agent_idx").on(table.fromAgentId),
  toAgentIdx: index("chat_transfers_to_agent_idx").on(table.toAgentId),
}));

// ========================================
// TYPING INDICATORS (Real-time)
// ========================================

export const typingIndicators = pgTable("typing_indicators", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").notNull(),
  userId: uuid("user_id").notNull(),
  userName: varchar("user_name", { length: 255 }),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // Auto-cleanup after 10 seconds
}, (table) => ({
  chatIdx: index("typing_indicators_chat_idx").on(table.chatId),
  expiresIdx: index("typing_indicators_expires_idx").on(table.expiresAt),
}));

// ========================================
// CHAT METRICS (For analytics and reporting)
// ========================================

export const chatMetrics = pgTable("chat_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  chatId: uuid("chat_id").notNull(),
  queueId: uuid("queue_id"),
  agentId: uuid("agent_id"),
  waitTime: integer("wait_time"), // seconds
  responseTime: integer("response_time"), // First response time in seconds
  resolutionTime: integer("resolution_time"), // Total time to close in seconds
  messageCount: integer("message_count").default(0),
  transferCount: integer("transfer_count").default(0),
  satisfactionRating: integer("satisfaction_rating"), // 1-5 stars
  satisfactionFeedback: text("satisfaction_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  chatIdx: index("chat_metrics_chat_idx").on(table.chatId),
  queueIdx: index("chat_metrics_queue_idx").on(table.queueId),
  agentIdx: index("chat_metrics_agent_idx").on(table.agentId),
  completedIdx: index("chat_metrics_completed_idx").on(table.tenantId, table.completedAt),
}));

// ========================================
// ZOD SCHEMAS
// ========================================

// Chat Queue
export const insertChatQueueSchema = createInsertSchema(chatQueues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertChatQueue = z.infer<typeof insertChatQueueSchema>;
export type ChatQueue = typeof chatQueues.$inferSelect;

// Queue Member
export const insertQueueMemberSchema = createInsertSchema(queueMembers).omit({
  id: true,
  createdAt: true,
});
export type InsertQueueMember = z.infer<typeof insertQueueMemberSchema>;
export type QueueMember = typeof queueMembers.$inferSelect;

// Queue Entry
export const insertQueueEntrySchema = createInsertSchema(queueEntries).omit({
  id: true,
  waitStartedAt: true,
});
export type InsertQueueEntry = z.infer<typeof insertQueueEntrySchema>;
export type QueueEntry = typeof queueEntries.$inferSelect;

// Agent Status
export const insertAgentStatusSchema = createInsertSchema(agentStatus).omit({
  id: true,
  lastStatusChange: true,
  lastActivityAt: true,
  updatedAt: true,
});
export type InsertAgentStatus = z.infer<typeof insertAgentStatusSchema>;
export type AgentStatus = typeof agentStatus.$inferSelect;

// Chat
export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;

// Chat Participant
export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({
  id: true,
  joinedAt: true,
});
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
export type ChatParticipant = typeof chatParticipants.$inferSelect;

// Message
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Message Reaction
export const insertMessageReactionSchema = createInsertSchema(messageReactions).omit({
  id: true,
  createdAt: true,
});
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;

// Chat Transfer
export const insertChatTransferSchema = createInsertSchema(chatTransfers).omit({
  id: true,
  createdAt: true,
});
export type InsertChatTransfer = z.infer<typeof insertChatTransferSchema>;
export type ChatTransfer = typeof chatTransfers.$inferSelect;

// Chat Metrics
export const insertChatMetricsSchema = createInsertSchema(chatMetrics).omit({
  id: true,
  createdAt: true,
});
export type InsertChatMetrics = z.infer<typeof insertChatMetricsSchema>;
export type ChatMetrics = typeof chatMetrics.$inferSelect;
