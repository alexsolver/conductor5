# AI Conversational Agent System - Documentation

## 📋 Overview

This document describes the comprehensive AI conversational agent system that was developed to enable non-technical users to configure and deploy AI agents through natural language prompts.

### ✅ Completed Features

1. **Auto-Configuration via Natural Language** - Users can describe what they want the agent to do in plain language, and the system automatically generates the complete configuration
2. **Multi-turn Conversation Management** - Full conversation flow with context preservation, intent detection, and parameter collection
3. **Action Execution Engine** - Autonomous execution of customer service tasks
4. **Knowledge Base with RAG** - Semantic search using OpenAI embeddings for intelligent information retrieval
5. **Webhook System** - Integration with external systems via webhooks
6. **Learning System** - Continuous improvement through user feedback
7. **Email Integration** - Real email sending via SendGrid

---

## 🏗️ System Architecture

### Backend Services

#### 1. **AI Engine** (`server/services/ai-engine.ts`)
Core AI processing service that handles:
- Intent detection from user messages
- Entity extraction (parameters from conversations)
- Sentiment analysis and urgency detection
- Response generation with personality adaptation
- Confirmation parsing

**Key Features:**
- Uses GPT-4o-mini for all AI operations
- Structured output with JSON mode
- Context-aware processing
- Multi-language support (pt-BR, en, es)

#### 2. **Conversation Manager** (`server/services/conversation-manager.ts`)
Orchestrates the complete conversation lifecycle:
- Multi-turn conversation flow
- State management (greeting → intent detection → parameter collection → confirmation → execution)
- Automatic escalation to humans when needed
- Sentiment tracking across conversation

**Conversation States:**
- `greeting` - Initial contact
- `detecting_intent` - Understanding user needs
- `collecting_params` - Gathering required information
- `confirming_action` - User confirmation before execution
- `completed` - Action successfully executed
- `escalated` - Transferred to human agent
- `failed` - Error occurred

#### 3. **Action Executor** (`server/services/action-executor.ts`)
Executes actions with full validation:
- **Customer Management**: create, update, search customers
- **Ticket Management**: create, update, assign, comment, change status
- **Knowledge Base**: search articles, retrieve information
- **Notifications**: send notifications to users/groups
- **Email**: send emails via SendGrid integration

**Features:**
- Prerequisite checking before execution
- Automatic retry logic for transient failures
- Error handling with escalation options
- Execution logging and tracking

#### 4. **Knowledge Base** (`server/services/knowledge-base.ts`)
RAG (Retrieval-Augmented Generation) system:
- Vector embeddings using OpenAI `text-embedding-3-small`
- Cosine similarity search
- Article management (create, update, delete)
- Feedback tracking (helpful/unhelpful)
- Answer generation using retrieved context

**Key Operations:**
```typescript
// Search knowledge base
await knowledgeBase.search(tenantId, "How do I reset password?", 5);

// Add new article
await knowledgeBase.addArticle(tenantId, {
  title: "Password Reset Guide",
  content: "...",
  category: "account-management"
});

// Generate answer with sources
const { answer, sources } = await knowledgeBase.generateAnswer(
  tenantId, 
  "How do I reset my password?",
  agentPersonality
);
```

#### 5. **Webhook Manager** (`server/services/webhook-manager.ts`)
External system integration:
- HTTP webhook execution (GET, POST, PUT, PATCH, DELETE)
- Authentication support (Bearer, Basic, API Key)
- Retry logic with exponential backoff
- Timeout handling
- Response parsing

**Example:**
```typescript
await webhookManager.executeWithRetry({
  url: "https://external-system.com/api/action",
  method: "POST",
  headers: { "Content-Type": "application/json" },
  authentication: {
    type: "bearer",
    token: "your-token"
  },
  retryAttempts: 3
}, payloadData);
```

#### 6. **Learning System** (`server/services/learning-system.ts`)
Continuous improvement through feedback:
- Feedback processing and analysis
- Pattern detection in conversations
- Performance metrics (success rate, satisfaction)
- Automatic knowledge base article generation from failed conversations
- System prompt improvement suggestions

**Metrics Tracked:**
- Total conversations
- Success rate
- Average satisfaction score
- Common issues
- Improvement recommendations

---

## 🔌 API Endpoints

### AI Agent Management

#### `GET /api/ai-agents`
List all AI agents for tenant
```json
Response: [
  {
    "id": "agent-123",
    "name": "Customer Support Bot",
    "status": "active",
    "enabledActions": ["create_ticket", "search_knowledge_base"],
    ...
  }
]
```

#### `POST /api/ai-agents/generate-config`
Generate agent configuration from natural language prompt
```json
Request:
{
  "prompt": "I want an agent that helps customers create support tickets and search our knowledge base"
}

Response:
{
  "success": true,
  "config": {
    "name": "Customer Support Assistant",
    "personality": { "tone": "friendly", "language": "pt-BR", ... },
    "enabledActions": ["create_ticket", "search_knowledge_base"],
    "behaviorRules": { ... },
    "aiConfig": { ... }
  }
}
```

#### `POST /api/ai-agents`
Create new AI agent
```json
Request:
{
  "name": "Support Bot",
  "configPrompt": "Help customers with tickets",
  "personality": { ... },
  "enabledActions": ["create_ticket"],
  "behaviorRules": { ... },
  "aiConfig": { ... }
}
```

#### `PATCH /api/ai-agents/:id`
Update existing agent

#### `DELETE /api/ai-agents/:id`
Delete agent

### Conversation Management

#### `POST /api/ai-agents/conversations/message`
Send message to agent
```json
Request:
{
  "agentId": "agent-123",
  "userId": "user-456",
  "message": "I need to create a support ticket",
  "channelType": "chat"
}

Response:
{
  "conversationId": "conv-789",
  "agentResponse": "Sure! I'll help you create a ticket. What's the issue?",
  "status": "collecting_params",
  "nextStep": "collecting_params"
}
```

#### `GET /api/ai-agents/conversations/:conversationId`
Get conversation details

#### `GET /api/ai-agents/conversations/:conversationId/messages`
Get all messages in conversation

#### `GET /api/ai-agents/conversations/:conversationId/logs`
Get conversation logs (for debugging)

### Feedback & Learning

#### `POST /api/ai-agents/conversations/:conversationId/feedback`
Submit feedback on conversation
```json
Request:
{
  "rating": 5,
  "comment": "Very helpful!"
}
```

#### `GET /api/ai-agents/:agentId/performance`
Get agent performance metrics
```json
Response:
{
  "totalConversations": 150,
  "successRate": 0.87,
  "avgSatisfaction": 4.2,
  "commonIssues": ["action_failed", "escalating_to_human"],
  "improvementSuggestions": ["Improve intent detection to reduce escalations"]
}
```

### Knowledge Base

#### `GET /api/ai-agents/knowledge-base`
List articles

#### `POST /api/ai-agents/knowledge-base`
Add article
```json
Request:
{
  "title": "How to Reset Password",
  "content": "Step by step guide...",
  "category": "account-management",
  "tags": ["password", "account", "security"]
}
```

#### `POST /api/ai-agents/knowledge-base/search`
Search knowledge base
```json
Request:
{
  "query": "How to reset password?",
  "limit": 5
}

Response:
{
  "articles": [
    {
      "id": "article-123",
      "title": "Password Reset Guide",
      "content": "...",
      "similarity": 0.89
    }
  ],
  "resultCount": 3
}
```

---

## 🗄️ Database Schema

### AI Agent Tables (8 tables)

1. **ai_agents** - Agent configuration
2. **ai_actions** - Available actions library
3. **ai_conversations** - Conversation instances
4. **ai_conversation_messages** - Messages in conversations
5. **ai_conversation_logs** - Debug logs
6. **ai_conversation_feedback** - User feedback
7. **ai_action_executions** - Action execution tracking
8. **ai_knowledge_base** - Knowledge base articles with embeddings

---

## 🎨 Frontend Integration

### Configuration Component (`client/src/components/omnibridge/AiAgentActionConfig.tsx`)

**Features:**
- Select existing agent or create new
- Natural language prompt input
- **Auto-generate configuration button** - Click to automatically populate all fields
- Manual configuration tabs:
  - Personality settings
  - Enabled actions selection
  - Behavior rules
  - AI model configuration

**Usage Example:**
1. User types: "I want an agent that helps customers create tickets and search FAQ"
2. User clicks "Generate Configuration Automatically"
3. System populates:
   - Agent name
   - Personality (tone, language, greeting)
   - Enabled actions (create_ticket, search_knowledge_base)
   - Behavior rules (confirmation requirements, escalation keywords)
   - AI configuration (model, temperature, system prompt)

---

## 🚀 How to Use

### 1. Create an AI Agent

**Via Auto-Configuration:**
```javascript
// Frontend - Click "Generate Configuration Automatically" button
// Or via API:
POST /api/ai-agents/generate-config
{
  "prompt": "I want an assistant that helps with customer support tickets"
}

// Then create agent with generated config
POST /api/ai-agents
{ ...generatedConfig }
```

**Manual Configuration:**
```javascript
POST /api/ai-agents
{
  "name": "Support Bot",
  "configPrompt": "Customer support assistant",
  "personality": {
    "tone": "friendly",
    "language": "pt-BR",
    "greeting": "Olá! Como posso ajudá-lo?",
    "fallbackMessage": "Desculpe, não entendi.",
    "confirmationStyle": "explicit"
  },
  "enabledActions": ["create_ticket", "search_knowledge_base"],
  "behaviorRules": {
    "requireConfirmation": ["create_ticket"],
    "autoEscalateKeywords": ["urgent", "emergency"],
    "maxConversationTurns": 10,
    "collectionStrategy": "sequential",
    "errorHandling": "retry"
  },
  "aiConfig": {
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "maxTokens": 1000,
    "systemPrompt": "You are a helpful customer support assistant..."
  }
}
```

### 2. Populate Knowledge Base

```javascript
POST /api/ai-agents/knowledge-base
{
  "title": "How to Create a Ticket",
  "content": "To create a ticket: 1. Click New Ticket...",
  "category": "tutorials",
  "tags": ["tickets", "getting-started"]
}
```

### 3. Start a Conversation

```javascript
POST /api/ai-agents/conversations/message
{
  "agentId": "agent-123",
  "userId": "user-456",
  "message": "I need help creating a ticket",
  "channelType": "chat"
}
```

### 4. Continue Conversation

The agent will guide the user through:
1. **Intent Detection** - Understanding what the user wants
2. **Parameter Collection** - Gathering required information (title, description, etc.)
3. **Confirmation** - Asking user to confirm before action
4. **Execution** - Performing the action
5. **Completion** - Confirming success

### 5. Provide Feedback

```javascript
POST /api/ai-agents/conversations/{conversationId}/feedback
{
  "rating": 5,
  "comment": "Very helpful!"
}
```

---

## ⚙️ Environment Variables Required

```bash
# Required
OPENAI_API_KEY=sk-...           # For AI processing and embeddings
DATABASE_URL=postgresql://...    # Database connection

# Optional
SENDGRID_API_KEY=SG....         # For email sending
SENDGRID_FROM_EMAIL=no-reply@yourapp.com
```

---

## 📊 Available Actions

### Customer Management
- `create_customer` - Create new customer
- `update_customer` - Update customer info
- `search_customer` - Search customers

### Ticket Management
- `create_ticket` - Create support ticket
- `update_ticket` - Update ticket details
- `add_ticket_comment` - Add comment to ticket
- `assign_ticket` - Assign ticket to user
- `change_ticket_status` - Change ticket status
- `search_tickets` - Search tickets

### Knowledge Base
- `search_knowledge_base` - Search articles
- `get_article` - Get specific article

### Communication
- `send_email` - Send email via SendGrid
- `send_notification` - Send notification
- `notify_group` - Notify user group

### Information
- `get_business_hours` - Get business hours
- `get_location_info` - Get location information

---

## 🔧 Customization

### Adding New Actions

1. **Define action in database** (`ai_actions` table):
```sql
INSERT INTO ai_actions (action_type, name, description, required_params, ...) 
VALUES ('custom_action', 'My Custom Action', '...', '{"param1": "type"}', ...);
```

2. **Implement in ActionExecutor** (`server/services/action-executor.ts`):
```typescript
private async executeCustomAction(tenantId: string, params: any) {
  // Your implementation
  return result;
}

// Add to switch statement in executeSpecificAction
case 'custom_action':
  return await this.executeCustomAction(tenantId, params);
```

### Customizing Agent Personality

Modify the `personality` object:
```javascript
{
  "tone": "professional|friendly|formal|casual",
  "language": "pt-BR|en|es",
  "greeting": "Custom greeting message",
  "fallbackMessage": "Custom fallback",
  "confirmationStyle": "explicit|implicit|none"
}
```

### Webhook Integration

```javascript
// In ActionExecutor, call webhook
const { webhookManager } = require('./webhook-manager');

const result = await webhookManager.executeWithRetry({
  url: "https://your-system.com/api/endpoint",
  method: "POST",
  authentication: {
    type: "bearer",
    token: "your-token"
  }
}, actionPayload);
```

---

## 🐛 Debugging

### View Conversation Logs
```javascript
GET /api/ai-agents/conversations/:conversationId/logs
```

Returns detailed logs:
- Intent detection results
- Entity extraction
- Sentiment analysis
- Action execution status
- Errors and warnings

### Common Issues

1. **Agent not responding** - Check OpenAI API key is set
2. **Actions failing** - Check prerequisites and permissions
3. **Low intent confidence** - Add more training examples or improve prompt
4. **Knowledge base not finding articles** - Ensure articles have embeddings generated

---

## 📈 Performance Monitoring

### Agent Metrics
```javascript
GET /api/ai-agents/:agentId/performance?days=30
```

Returns:
- Total conversations
- Success rate (% of completed conversations)
- Average satisfaction rating
- Common failure reasons
- Improvement suggestions

### Learning System

The system automatically:
- Analyzes negative feedback
- Identifies recurring issues
- Creates knowledge base articles for improvements
- Suggests system prompt enhancements

---

## 🚦 Next Steps

### Suggested Enhancements

1. **Multi-channel Support** - Extend to WhatsApp, Email, Slack
2. **Advanced Analytics** - Dashboards for agent performance
3. **A/B Testing** - Test different agent configurations
4. **Voice Integration** - Add speech-to-text/text-to-speech
5. **Custom Workflows** - Visual workflow builder
6. **Agent Templates** - Pre-built agent configurations for common use cases
7. **Real-time Monitoring** - Live dashboard of active conversations

### Testing Recommendations

1. Test basic conversation flow
2. Test all enabled actions
3. Test error scenarios (missing params, API failures)
4. Test escalation triggers
5. Test knowledge base search accuracy
6. Load test with multiple concurrent conversations

---

## 📞 Support

For questions or issues, check:
1. Conversation logs for detailed debugging
2. Agent performance metrics for patterns
3. Knowledge base for documented solutions

---

## 🎉 Summary

This system provides a complete AI conversational agent platform that:
- ✅ Is configured through natural language (no code required)
- ✅ Handles complex multi-turn conversations autonomously
- ✅ Executes real actions (tickets, emails, searches)
- ✅ Learns from feedback to improve over time
- ✅ Integrates with external systems via webhooks
- ✅ Provides intelligent answers via knowledge base RAG
- ✅ Scales to handle multiple agents and conversations

The system completely replaces traditional rule-based chatbots with an intelligent, adaptive AI agent that can be deployed by non-technical users in minutes.
