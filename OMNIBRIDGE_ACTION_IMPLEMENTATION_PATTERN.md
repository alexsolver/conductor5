# OmniBridge - Action Implementation Pattern

## ✅ COMPLETED: 3 REAL IMPLEMENTATIONS

### 1. `reply_email` - Email Communication (REAL)
**Location:** `ActionExecutor.ts:2525`
**Pattern:** External API Integration (SendGrid)
```typescript
// Import external service dynamically
const { SendGridService } = await import('../../../../services/sendgridService');

// Get config and context
const { to, subject, body, template } = action.config || {};
const { messageData, tenantId } = context;

// Execute real operation
const sent = await SendGridService.sendEmail({
  to: recipientEmail,
  from: fromEmail,
  subject: emailSubject,
  html: emailBody
});

// Return detailed result
return { 
  success: true, 
  message: 'Email sent successfully via SendGrid', 
  data: { to, subject, sentAt: new Date().toISOString() } 
};
```

### 2. `merge_tickets` - Ticket Operations (REAL)
**Location:** `ActionExecutor.ts:2606`
**Pattern:** Direct Database Operations
```typescript
// Import schema and ORM
const { ticketMessages, tickets } = await import('../../../../../shared/schema-tenant');
const { eq, and } = await import('drizzle-orm');

// Execute multiple DB operations
// 1. Move messages from source to target
await db.update(ticketMessages)
  .set({ ticketId: targetTicketId })
  .where(and(eq(ticketMessages.tenantId, tenantId), eq(ticketMessages.ticketId, sourceTicketId)));

// 2. Update source ticket status
await db.update(tickets)
  .set({ status: 'closed', resolution: `Merged into ${targetTicketId}` });

// 3. Add audit notification
await db.insert(ticketMessages).values({
  tenantId, ticketId: targetTicketId, 
  content: `Ticket ${sourceTicketId} merged`, 
  isInternal: true
});
```

### 3. `update_customer` - Customer Operations (REAL)
**Location:** `ActionExecutor.ts:2689`
**Pattern:** Use Case Integration
```typescript
// Import existing use case and repository
const { DrizzleCustomerRepository } = await import('../../../customers/infrastructure/repositories/DrizzleCustomerRepository');
const { UpdateCustomerUseCase } = await import('../../../customers/application/use-cases/UpdateCustomerUseCase');
const { CustomerDomainService } = await import('../../../customers/domain/entities/Customer');

// Initialize use case with proper dependencies
const customerRepository = new DrizzleCustomerRepository(db, tenantId);
const customerDomainService = new CustomerDomainService();
const updateCustomerUseCase = new UpdateCustomerUseCase(customerRepository, customerDomainService);

// Execute through use case (validates, formats, updates)
const updatedCustomer = await updateCustomerUseCase.execute(customerId, updates);
```

---

## 🚧 TODO: 17 ACTIONS REQUIRING IMPLEMENTATION

### Communication Actions (4 remaining)

#### `forward_email` - Email Forwarding
**Priority:** HIGH
**Implementation Pattern:** Same as `reply_email` (SendGrid)
**Steps:**
1. Import SendGrid service dynamically
2. Extract original message + headers from `context.messageData`
3. Add "Fwd:" prefix to subject
4. Include original message in body
5. Send via SendGridService.sendEmail()

#### `send_whatsapp` - WhatsApp Messaging
**Priority:** HIGH
**Implementation Pattern:** External API Integration
**Requirements:**
- WhatsApp Business API integration
- Import existing WhatsApp service (check for existing implementation)
- Extract phone number from config or customer data
- Format message with template support
**API Reference:** Check `/server/services/` for existing WhatsApp integration

#### `send_slack` - Slack Messaging
**Priority:** MEDIUM
**Implementation Pattern:** External API Integration (Slack SDK)
**Steps:**
1. Import Slack WebClient from `@slack/web-api`
2. Get channel from config or default to notification channel
3. Format message with Slack blocks
4. Call `client.chat.postMessage()`

#### `send_telegram` - Telegram Messaging
**Priority:** MEDIUM
**Implementation Pattern:** External API Integration (Telegram Bot API)
**Steps:**
1. Import Telegram bot service
2. Get chatId from config or customer metadata
3. Send message via bot.sendMessage()

---

### Ticket Operations (1 remaining)

#### `link_tickets` - Link Related Tickets
**Priority:** HIGH
**Implementation Pattern:** Direct DB Operations (similar to `merge_tickets`)
**Steps:**
1. Import `ticketRelations` schema from `shared/schema-tenant.ts`
2. Create bidirectional relationship records
3. Insert into `ticketRelations` table with linkType (duplicate, related, parent-child)
4. Add notification to both tickets

**Schema to use:**
```typescript
await db.insert(ticketRelations).values({
  tenantId,
  ticketId: ticketId1,
  relatedTicketId: ticketId2,
  linkType: linkType || 'related'
});
```

---

### Customer Operations (1 remaining)

#### `search_customer_history` - Customer History Search
**Priority:** MEDIUM
**Implementation Pattern:** Repository Query
**Steps:**
1. Import CustomerRepository
2. Query tickets, interactions, purchases by customerId
3. Aggregate data from multiple tables (tickets, ticketMessages, activities)
4. Return structured history with timeline

**Query pattern:**
```typescript
const tickets = await customerRepository.getCustomerTickets(customerId);
const interactions = await customerRepository.getInteractionHistory(customerId);
return { historyItems: [...tickets, ...interactions].sort(byDate) };
```

---

### Knowledge Base Operations (3 remaining)

#### `search_knowledge_base` - KB Search
**Priority:** HIGH
**Implementation Pattern:** Full-text Search or Vector Search
**Steps:**
1. Check if KB module exists in `/server/modules/knowledge-base/`
2. Import KBRepository or search service
3. Execute full-text search on articles
4. Return ranked results with snippets

**Potential implementations:**
- PostgreSQL full-text search: `ts_query` and `ts_rank`
- Vector search if embeddings are available
- Simple LIKE query as fallback

#### `suggest_kb_article` - KB Article Suggestions
**Priority:** MEDIUM
**Implementation Pattern:** AI-powered recommendation
**Steps:**
1. Extract keywords from ticket content
2. Search KB with extracted keywords
3. Use semantic similarity if available
4. Return top 3-5 relevant articles

#### `create_kb_from_ticket` - KB Article Creation
**Priority:** LOW
**Implementation Pattern:** Use Case Integration
**Steps:**
1. Import CreateKBArticleUseCase (if exists)
2. Extract ticket resolution as article content
3. Generate title from ticket subject
4. Tag with ticket categories
5. Create draft article for review

---

### Scheduling Operations (3 remaining)

#### `schedule_appointment` - Schedule Appointment
**Priority:** HIGH
**Implementation Pattern:** Check existing Schedule/Agenda module
**Steps:**
1. Import from `/server/modules/agenda/` or `/server/modules/schedules/`
2. Use CreateAppointmentUseCase if exists
3. Create calendar event with datetime, subject, participants
4. Send calendar invitation if configured

#### `schedule_callback` - Schedule Callback
**Priority:** HIGH
**Implementation Pattern:** Task/Reminder creation
**Steps:**
1. Create task in tasks table or reminders table
2. Link to ticket and customer
3. Set reminder for assigned user
4. Create notification for callback time

#### `reschedule_appointment` - Reschedule Appointment
**Priority:** MEDIUM
**Implementation Pattern:** Update existing appointment
**Steps:**
1. Find appointment by ID
2. Update datetime
3. Send rescheduling notification to all participants
4. Update ticket timeline

---

### Analytics & Integration (5 remaining)

#### `log_interaction` - Log Customer Interaction
**Priority:** LOW
**Implementation Pattern:** Direct DB Insert
**Steps:**
1. Insert into `customer_interactions` or `activity_logs` table
2. Capture interaction type, channel, duration
3. Link to customer and ticket if applicable

#### `export_data` - Export Data
**Priority:** LOW
**Implementation Pattern:** File generation
**Steps:**
1. Query data based on dataType (tickets, customers, reports)
2. Format as CSV, JSON, or Excel
3. Generate file and return download link
4. Use existing export utilities if available

#### `call_webhook` - Webhook Integration
**Priority:** MEDIUM
**Implementation Pattern:** HTTP Request
**Steps:**
1. Import axios or fetch
2. Execute HTTP request with method (GET/POST/PUT)
3. Include authentication headers if configured
4. Log response and handle retries

**Implementation:**
```typescript
const response = await axios.request({
  url, method,
  headers: { Authorization: `Bearer ${config.apiKey}` },
  data: context.messageData
});
```

#### `sync_crm` - CRM Synchronization
**Priority:** LOW
**Implementation Pattern:** External API Integration
**Steps:**
1. Detect CRM type (Salesforce, HubSpot, Pipedrive)
2. Import corresponding integration service
3. Execute sync operation (push/pull)
4. Map fields between systems

#### `update_external_system` - External System Update
**Priority:** LOW
**Implementation Pattern:** Generic webhook/API call
**Steps:**
1. Similar to `call_webhook`
2. Support for multiple external systems
3. Configuration-driven endpoint and authentication
4. Retry logic and error handling

---

## Implementation Checklist

For each new action implementation:

- [ ] Extract config parameters from `action.config`
- [ ] Extract context (tenantId, messageData, ticketId, etc.)
- [ ] Validate required parameters
- [ ] Import necessary services/repositories dynamically (avoid circular deps)
- [ ] Execute real operation (API call, DB query, use case)
- [ ] Add comprehensive logging (`console.log` for success, `console.error` for failures)
- [ ] Return structured result with success/failure and detailed data
- [ ] Handle errors gracefully with try/catch
- [ ] Type error as `error: any` for message access

## Key Principles

1. **Dynamic Imports:** Avoid circular dependencies by using `await import()`
2. **Tenant Isolation:** Always use `tenantId` from context for multi-tenancy
3. **Use Existing Code:** Leverage existing repositories, use cases, services
4. **Comprehensive Logging:** Prefix logs with `[ACTION-NAME]` for traceability
5. **Detailed Results:** Return actionable data in result.data for debugging
6. **Graceful Errors:** Never throw - always return { success: false, message, error }

## Testing Pattern

```typescript
// Manual test via ProcessMessageUseCase
const testMessage = {
  from: 'test@example.com',
  subject: 'Test Action',
  content: 'Testing reply_email action'
};

const testRule = {
  actions: [{
    type: 'reply_email',
    config: { 
      subject: 'Auto Reply',
      body: '<p>Thank you for contacting us!</p>'
    }
  }]
};

await processMessageUseCase.execute(tenantId, 'email', testMessage, testRule);
// Check logs for execution results
```

---

**Status:** 3/20 actions fully implemented with REAL code | 17/20 remaining as documented stubs
**Last Updated:** 2025-10-04
