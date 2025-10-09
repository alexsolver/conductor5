# Conductor - Customer Support Platform

## Overview
Conductor is a modern SaaS customer support platform designed for omnichannel customer support management with enterprise multitenancy. Its purpose is to streamline customer support operations through comprehensive tools for managing tickets, customer interactions, and internal workflows. Engineered for scalability and internationalization, Conductor aims to deliver a comprehensive, compliant, and efficient solution for customer support, enhancing business vision with advanced AI capabilities and robust system integrations.

## Recent Changes
### AI Agent Interview System Refactoring (October 2025)
- **Architecture Pivot**: Redesigned AI Agent from complex personality-based system to simple conversational interviewer
- **New Focus**: Agents conduct interviews to fill Internal Forms automatically via natural language conversations
- **Simplified Configuration**: Agents now configured via single natural language prompt + allowed form selection
- **Database Schema**: New tables `omnibridge_ai_agents` (agent config) and `omnibridge_ai_actions` (interview actions)
- **Interview Engine**: `ConversationalInterviewEngine` reads form fields, validates responses, creates submissions
- **Integration**: Seamless integration with `/internal-forms` module for form discovery and submission creation
- **Impact**: Enables automated form filling through conversational AI, reducing manual data entry

### OmniBridge Route Fix (October 2025)
- **Critical Bug Fixed**: Resolved OmniBridge routes registration failure caused by Node.js import path conflict
- **Root Cause**: Directory `server/modules/omnibridge/routes/` existed without `index.ts`, causing dynamic import to fail silently
- **Solution**: Created `routes/index.ts` to properly export `omniBridgeRoutes` from parent file
- **Impact**: All OmniBridge API endpoints now functioning correctly (`/api/omnibridge/*`)
- **Database Import Fix**: Corrected Drizzle import path from `'../../../../database/drizzle'` to `'../../../../db'` following codebase patterns

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
    - **Ticket Management**: ServiceNow-style fields, hierarchical configurations, dynamic metadata, audit trails, rich text editor, templates, automation, workflow engine, analytics. Includes symptoms, workarounds, followers, and tags.
    - **Customer & Beneficiary Management**: Flexible person management with sensitive data protection.
    - **Location Management**: Comprehensive system with address auto-fill and map integration.
    - **User & Team Management**: Consolidated system with HR database expansion and group memberships.
    - **Project Management**: Full project and project actions system with automatic project-ticket integration.
    - **Timecard/Journey Management**: CLT-compliant electronic timecard system with integrity hashing.
    - **Omnichannel Communication**: Unified communication center supporting email, WhatsApp, Slack, Telegram, with real-time inbox processing and automation. Features a unique `conversationId` system for accurate message routing across channels, and Telegram DM support via webhook.
    - **OmniBridge AI Agent System**: Comprehensive AI conversational agent with natural language configuration, intelligent message-to-ticket linking, and automatic sentiment detection using configurable AI providers. Includes a visual AI Action Builder System for custom actions and an Entity Extraction System leveraging OpenAI Function Calling for data collection with confidence scoring and interactive widget fallback.
    - **Agenda/Schedule Management**: Integrated scheduling system.
    - **Internationalization (i18n)**: Comprehensive system with multiple languages and translation management interface.
    - **Template System**: Dynamic UI customization via CSS variables and hierarchical template management.
    - **Multilocation System**: Hybrid system supporting Brazilian nomenclature with international aliases.
    - **Inventory Management**: Stock, supplier, and services management.
    - **Materials Services Management System**: Item catalog with embedded ticket integration and pricing rules.
    - **Custom Fields Management**: Supports 12 field types across 10 modules, with conditional logic and validation.
    - **Notifications Management**: Multi-channel support with user preferences and automation.
    - **Dashboard Module**: Real-time statistics, activity tracking, customizable widgets, multi-module analytics with a 4-layer governance system.
    - **SaaS Admin Module**: Global administration, tenant lifecycle, billing, audit compliance.
    - **Approval Management Module**: Comprehensive workflow system with hierarchical and conditional rules, CQRS pattern, and integrated panel in ticket details. Features a modern, gradient-focused UX.
    - **Contract Management Module**: Enterprise system with CRUD, workflow, automated billing, and SLA monitoring.
    - **Activity Planner Module**: Advanced maintenance management for asset and work order scheduling.
    - **Corporate Expense Management Module**: Expense management with OCR, multi-currency, and fraud detection.
    - **Reports & Dashboards Module**: Enterprise reporting with real-time dashboards, PDF designer, visual query builder, scheduling, and AI analytics.

### System Design Choices
- **Clean Architecture**: Domain, Application, and Infrastructure layers.
- **RESTful API**: Structured error handling.
- **True Schema Separation**: For multi-tenancy.
- **Comprehensive Notification System**: User preferences and global controls.
- **AI Agent Auto-Configuration**: Natural language-to-configuration generation using GPT-4o-mini.
- **Ticket Context Tracking**: Intelligent message-to-ticket linking for emails and chat platforms.
- **Extended Action Library**: Comprehensive automation action library.

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