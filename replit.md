# Conductor - Customer Support Platform

## Overview
Conductor is a modern SaaS customer support platform designed for omnichannel customer support management with enterprise multitenancy. Its purpose is to streamline customer support operations through comprehensive tools for managing tickets, customer interactions, and internal workflows. Engineered for scalability and internationalization, Conductor aims to deliver a comprehensive, compliant, and efficient solution for customer support.

## User Preferences
Preferred communication style: Simple, everyday language.
Interface preference: Text-based hierarchical menus with dropdowns over visual card-based interfaces.

## System Architecture
Conductor follows a Clean Architecture with Domain-Driven Design principles, utilizing a full-stack TypeScript architecture. Core modules are standardized with domain/application/infrastructure layers and dependency injection.

### UI/UX Decisions
The UI features a gradient-focused design system (purple/blue primary, pink/red secondary, blue/cyan success) with dynamic, database-driven color systems for badges and configurations. It prioritizes text-based hierarchical menus and organized sections over card-based interfaces for complex data.

### Technical Implementations & Feature Specifications
- **Frontend**: React 18 with TypeScript, Tailwind CSS (custom gradient system, Shadcn UI), TanStack React Query for state, Wouter for routing.
- **Backend**: Node.js with Express.js, TypeScript, PostgreSQL with Drizzle ORM.
- **Authentication**: Local JWT with fixed auto-logout prevention and a four-tier RBAC system.
- **Multi-tenancy**: True schema separation with dedicated PostgreSQL schemas for each tenant.
- **Schema Validation**: Comprehensive multi-layer system for data isolation and GDPR compliance.
- **Employment Type System**: Supports dual employment types (CLT/Autonomous) with automatic detection.
- **Key Features**:
    - **Ticket Management**: ServiceNow-style fields, hierarchical configurations, dynamic metadata, audit trails, rich text editor, templates, automation, workflow engine, analytics.
    - **Customer & Beneficiary Management**: Flexible person management with sensitive data protection.
    - **Location Management**: Comprehensive system with address auto-fill and map integration.
    - **User & Team Management**: Consolidated system with HR database expansion and group memberships.
    - **Project Management**: Full project and project actions system with automatic project-ticket integration.
    - **Timecard/Journey Management**: CLT-compliant electronic timecard system with integrity hashing and compliance reports.
    - **Omnichannel Communication**: Unified communication center supporting email, WhatsApp, Slack, Telegram, with real-time inbox processing and automation. **Unique Conversation ID System**: Each ticket conversation uses a unique UUID (conversationId) to prevent reply confusion when users have multiple simultaneous conversations. Generated on first message send, stored in ticket metadata, and tracked across all channels (Email: X-Conversation-ID header, WhatsApp/Telegram: metadata). MessageIngestionService prioritizes conversationId lookup (exact match) over chatId (open tickets first) for accurate message routing. **Telegram DM Support**: Webhook endpoint (`POST /api/telegram/webhook`) automatically captures chat_id when users send /start command, enabling DM functionality (note: @username only works for public channels/groups, DMs require numeric chat_id).
    - **OmniBridge AI Agent System**: Comprehensive AI conversational agent with natural language configuration, modal-based workflow, visual card interface. Features intelligent message-to-ticket linking system that bypasses automation rules for replies to existing tickets using email headers (In-Reply-To, References, X-Ticket-ID, X-Conversation-ID) and chat metadata (threadId, conversationId). Includes automatic sentiment detection on all ticket messages using SaaS Admin-configured AI providers (OpenAI/DeepSeek/Google AI) with keyword-based fallback, storing sentiment data (sentiment, sentimentScore, sentimentEmotion, confidence, urgency) in ticket_messages.metadata JSONB column with GIN index for efficient queries. Sentiment analysis integrated into ProcessMessageUseCase with proper error handling (failures don't break message flow). Configuration UI includes 5 tabs: Actions, Personality, Behavior, Field Mapping (DE→PARA interface with transformation rules for data collected by AI agent), and Sentiment (threshold configuration, auto-escalation, visualization controls). Implemented Actions: (1) Communication: reply_email/SendGrid, (2) Ticket Operations: merge_tickets/DB operations, update_customer/use case integration, (3) AI Agent Actions: search_knowledge_base (text search + RAG-ready), get_article (with view counter), search_customer (multi-filter), search_tickets (dynamic filters), get_business_hours (with fallback), get_location_info (with coordinates). All actions use real database integration with proper tenant isolation. Sample data: 5 knowledge base articles created, OmniBridge Assistant agent configured with all 6 AI actions enabled. Sentiment visualization in ticket message history with color-coded badges and icons. Database schema updated with ticket_messages.metadata column and GIN index for production use.
    - **Agenda/Schedule Management**: Integrated scheduling system.
    - **Internationalization (i18n)**: Comprehensive system with multiple languages (English, Portuguese, Spanish, French, German), dynamic switching, and translation management interface, with full translation infrastructure operational.
    - **Template System**: Dynamic UI customization via CSS variables and hierarchical template management.
    - **Module Integrity Control**: Detects code quality and architectural compliance issues.
    - **Multilocation System**: Hybrid system supporting Brazilian nomenclature with international aliases.
    - **Inventory Management**: Stock, supplier, and services management.
    - **Materials Services Management System**: Item catalog with embedded ticket integration and pricing rules.
    - **Custom Fields Management**: Supports 12 field types across 10 modules, with conditional logic and validation.
    - **Notifications Management**: Multi-channel support (email/in-app/sms/webhook/slack) with user preferences and automation.
    - **Dashboard Module**: Real-time statistics, activity tracking, customizable widgets, multi-module analytics.
    - **Dashboard Governance System**: 4-layer architecture (Source → KPI → Presentation → Rules) with data source catalog, KPI management, dynamic card generation, and multi-tenant isolation.
    - **SaaS Admin Module**: Global administration, tenant lifecycle, billing, audit compliance.
    - **Approval Management Module**: Comprehensive workflow system with hierarchical and conditional rules, using CQRS pattern. **Ticket Integration**: Fully integrated approval panel in ticket details sidebar showing real-time approval status with visual indicators, SLA tracking, multi-step workflow visualization, and inline approve/reject actions. Features color-coded status badges, urgency levels, step progression UI, and approval history with timestamped decisions. **Modern UX**: Complete module redesign with gradient-focused visual system, featuring: (1) Dashboard with gradient cards and dynamic status indicators, (2) Unified Approval Configurator with intelligent Query Builder (dynamic field detection renders Select for predefined values, Input for free text), tabbed interface (Basic/Conditions/Workflow/Advanced), and module-specific field mapping (Tickets, Materials, Knowledge Base, Timecard, Contracts), (3) Approval Instances with gradient status badges and enhanced filtering, (4) Approval Groups Manager with type-based gradient cards (Agents/Clients/Beneficiaries/Mixed). All components follow consistent gradient design patterns (purple/pink primary, blue/cyan actions, emerald/green success, amber/orange warnings) with hover animations and visual feedback.
    - **Contract Management Module**: Enterprise system with CRUD, workflow, automated billing, and SLA monitoring.
    - **Activity Planner Module**: Advanced maintenance management for asset and work order scheduling.
    - **Corporate Expense Management Module**: Expense management with OCR, multi-currency, and fraud detection.
    - **Reports & Dashboards Module**: Enterprise reporting with real-time dashboards, PDF designer, visual query builder, scheduling, and AI analytics.

### System Design Choices
- **Clean Architecture**: With Domain, Application, and Infrastructure layers.
- **RESTful API**: With structured error handling.
- **True Schema Separation**: For multi-tenancy.
- **Comprehensive Notification System**: With user preferences and global controls.
- **AI Agent Auto-Configuration**: Natural language-to-configuration generation using GPT-4o-mini.
- **Ticket Context Tracking**: Intelligent message-to-ticket linking system for emails and chat platforms.
- **Extended Action Library**: Comprehensive automation action library across communication, ticket operations, customer management, knowledge base, scheduling, and analytics/integration.

### AI Provider Configuration
The platform supports per-tenant AI provider configuration. Each tenant can configure their own API keys for:
- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4 Turbo, GPT-3.5 Turbo
- **DeepSeek**: DeepSeek Chat, DeepSeek Reasoner
- **Google AI**: Gemini 2.0 Flash, Gemini 1.5 Flash/Pro, Gemini 1.0 Pro

Configuration is managed through the Tenant Admin → Integrations page. AI providers are fully integrated into the main integrations system, displayed alongside other integrations with standardized cards. The `TenantAIConfigService` provides methods to retrieve tenant-specific API keys:
- `getTenantAIConfig(tenantId)`: Get all AI configurations for a tenant
- `getPreferredAIProvider(tenantId)`: Get the preferred provider (OpenAI > DeepSeek > Google AI > env fallback)
- `getProviderConfig(tenantId, provider)`: Get specific provider configuration

### Integration Management UI
Both Tenant Admin and SaaS Admin integration pages feature a standardized card system with:
- **Visual Badges**: Green badge with Key icon for configured integrations, status badges (connected/disconnected/error) with appropriate icons
- **Responsive Layout**: Cards with hover animations, responsive text truncation, mobile-optimized badges
- **Consistent Actions**: All integrations include Configure and Test buttons with loading states
- **Categorization**: Integrations organized by category (Comunicação, IA, Analytics, etc.) with tab-based navigation
- **AI Integration**: AI providers (OpenAI, DeepSeek, Google AI) fully integrated into main integrations array, no separate hard-coded IA tab

## External Dependencies
- **Database**: Neon PostgreSQL.
- **UI Components**: Radix UI, Shadcn UI.
- **Form Management**: React Hook Form, Zod.
- **Date Handling**: date-fns.
- **Email Communication**: `imap`, `mailparser`.
- **Geocoding/Address Lookup**: ViaCEP API.
- **Mapping**: Leaflet.
- **Rich Text Editor**: TipTap.
- **Logging**: Winston.
- **AI Agent Improvement**: OmniBridge Conversation Logging & Learning System.