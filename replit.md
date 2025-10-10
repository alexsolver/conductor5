# Conductor - Customer Support Platform

## Overview
Conductor is a modern SaaS customer support platform designed for omnichannel customer support management with enterprise multitenancy. Its purpose is to streamline customer support operations through comprehensive tools for managing tickets, customer interactions, and internal workflows. Engineered for scalability and internationalization, Conductor aims to deliver a comprehensive, compliant, and efficient solution for customer support, enhancing business vision with advanced AI capabilities and robust system integrations.

## User Preferences
Preferred communication style: Simple, everyday language.
Interface preference: Text-based hierarchical menus with dropdowns over visual card-based interfaces.

## System Architecture
Conductor follows a Clean Architecture with Domain-Driven Design principles, utilizing a full-stack TypeScript architecture. Core modules are standardized with domain/application/infrastructure layers and dependency injection.

### UI/UX Decisions
The UI features a gradient-focused design system (purple/blue primary, pink/red secondary, blue/cyan success) with dynamic, database-driven color systems for badges and configurations. It prioritizes text-based hierarchical menus and organized sections over card-based interfaces for complex data.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Tailwind CSS (custom gradient system, Shadcn UI), TanStack React Query, Wouter.
- **Backend**: Node.js with Express.js, TypeScript, PostgreSQL with Drizzle ORM.
- **Authentication**: Local JWT with RBAC system.
- **Multi-tenancy**: True schema separation with dedicated PostgreSQL schemas.
- **Key Features**:
    - **Ticket Management**: Comprehensive system with dynamic metadata, audit trails, rich text editor, templates, automation, and workflow engine. Includes AI Agent automated ticket creation with client/location registration and Brazilian document validation (CPF/CNPJ, CEP).
    - **Customer & Beneficiary Management**: Flexible person management with sensitive data protection.
    - **Location Management**: Comprehensive system with address auto-fill and map integration.
    - **User & Team Management**: Consolidated system with HR database expansion and group memberships.
    - **Project Management**: Full project and project actions system with automatic project-ticket integration.
    - **Timecard/Journey Management**: CLT-compliant electronic timecard system with integrity hashing.
    - **Omnichannel Communication**: Unified communication center supporting email, WhatsApp, Slack, Telegram, with real-time inbox processing and automation. Features a unique `conversationId` system for accurate message routing across channels.
    - **OmniBridge AI Agent System**: Comprehensive AI conversational agent with natural language configuration, intelligent message-to-ticket linking, and automatic sentiment detection. Includes a visual AI Action Builder System for custom actions and an Entity Extraction System leveraging OpenAI Function Calling. AI agents can conduct interviews to fill internal forms automatically.
    - **Chat + Queue Management Module**: Complete real-time chat system with intelligent queue management. Features 5 distribution strategies (FIFO, Priority, Skill-based, Round-Robin, Least Busy), WebSocket-based real-time messaging, SLA monitoring with automatic escalation, agent status management, seamless OmniBridge integration for AI-to-human handoff, and ticket creation from chat history. Includes file upload (Object Storage), full-text search, comprehensive RBAC (agent/supervisor/admin), audit logging (chatTransfers table), and intelligent notifications (6 types). Frontend: 4 pages (Queue Config, Dashboard, Agent Interface, Agent Control Panel).
    - **Agenda/Schedule Management**: Integrated scheduling system.
    - **Internationalization (i18n)**: Comprehensive system with multiple languages and translation management interface.
    - **Template System**: Dynamic UI customization via CSS variables and hierarchical template management.
    - **Multilocation System**: Hybrid system supporting Brazilian nomenclature with international aliases.
    - **Inventory Management**: Stock, supplier, and services management.
    - **Materials Services Management System**: Item catalog with embedded ticket integration and pricing rules.
    - **Custom Fields Management**: Supports 12 field types across 10 modules, with conditional logic and validation, including AI metadata for guided filling.
    - **Notifications Management**: Multi-channel support with user preferences and automation.
    - **Dashboard Module**: Real-time statistics, activity tracking, customizable widgets, multi-module analytics.
    - **SaaS Admin Module**: Global administration, tenant lifecycle, billing, audit compliance.
    - **Approval Management Module**: Comprehensive workflow system with hierarchical and conditional rules, CQRS pattern.
    - **Contract Management Module**: Enterprise system with CRUD, workflow, automated billing, and SLA monitoring.
    - **Activity Planner Module**: Advanced maintenance management for asset and work order scheduling.
    - **Corporate Expense Management Module**: Expense management with OCR, multi-currency, and fraud detection.
    - **Reports & Dashboards Module**: Enterprise reporting with real-time dashboards, PDF designer, visual query builder, scheduling, and AI analytics.
    - **GDPR Compliance**: Implementation of "Right to Erasure" (Article 17) with data anonymization and audit logging. Privacy Policy management with edit and delete functionalities.

### System Design Choices
- **Clean Architecture**: Domain, Application, and Infrastructure layers.
- **RESTful API**: Structured error handling.
- **True Schema Separation**: For multi-tenancy.
- **Comprehensive Notification System**: User preferences and global controls.
- **AI Agent Auto-Configuration**: Natural language-to-configuration generation using GPT-4o-mini.
- **Ticket Context Tracking**: Intelligent message-to-ticket linking for emails and chat platforms.
- **Extended Action Library**: Comprehensive automation action library.
- **Dynamic QueryBuilder System**: Fully dynamic query builder that automatically fetches all available options (channels, status, priorities, users, companies, categories, groups) from the database. Features centralized API endpoint (`/api/querybuilder/options`) with React Query caching (5-minute TTL), eliminating hardcoded values and automatically supporting new integrations (e.g., Discord). Used in main QueryBuilder, AutomationRuleBuilder, and future components for user-friendly, non-technical query building.

### AI Provider Configuration
The platform supports per-tenant AI provider configuration for OpenAI (GPT-4o, GPT-4o-mini, GPT-4 Turbo, GPT-3.5 Turbo), DeepSeek (DeepSeek Chat, DeepSeek Reasoner), and Google AI (Gemini 2.0 Flash, Gemini 1.5 Flash/Pro, Gemini 1.0 Pro). Configuration is managed through the Tenant Admin → Integrations page, allowing tenants to provide their own API keys.

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