# Conductor - Customer Support Platform

## Overview
Conductor is a modern SaaS customer support platform designed for omnichannel customer support management with enterprise multitenancy. Its primary purpose is to streamline customer support operations through comprehensive tools for managing tickets, customer interactions, and internal workflows. Built with a full-stack TypeScript architecture and featuring a gradient-focused design system, Conductor is engineered for scalability and internationalization, supporting diverse business models and geographical locations. The business vision is to deliver a comprehensive, compliant, and efficient solution for customer support.

## User Preferences
Preferred communication style: Simple, everyday language.
Interface preference: Text-based hierarchical menus with dropdowns over visual card-based interfaces.

## System Architecture
Conductor follows a Clean Architecture with Domain-Driven Design principles. Core modules are standardized with domain/application/infrastructure layers and dependency injection.

### Frontend
- **Framework**: React 18 with TypeScript.
- **Styling**: Tailwind CSS with a custom gradient design system and Shadcn UI components built on Radix UI primitives.
- **State Management**: TanStack React Query for server state management.
- **Routing**: Wouter for client-side routing with employment-aware route guards.
- **UI/UX Decisions**: Gradient-focused design (purple/blue primary, pink/red secondary, blue/cyan success). The color system is dynamic and database-driven for badges and configurations. UI prioritizes text-based hierarchical menus and organized sections over card-based interfaces for complex data, allowing dynamic badge colors based on database configurations.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Local JWT authentication with fixed auto-logout prevention.
- **Notification Preferences**: Complete user notification preference system with global channel activation/deactivation controls (email, in-app, SMS, webhook, Slack) and reset to defaults functionality.
- **Session Management**: Express sessions with PostgreSQL storage.
- **API Design**: RESTful endpoints with structured error handling.
- **Architecture Pattern**: Clean Architecture with Domain, Application, and Infrastructure layers.
- **Multi-tenancy**: True schema separation where each tenant has a dedicated PostgreSQL schema (`tenant_{uuid}`).
- **Schema Validation System**: Comprehensive multi-layer system preventing schema misuse with automatic interceptors, health checks, auditing tools, and daily monitoring. Ensures complete tenant data isolation and GDPR compliance through real-time validation and automated corrections.
- **Employment Type System**: Supports dual employment types (CLT/Autonomous) with automatic detection, terminology mapping, and route redirection.
- **Key Features**:
    - **Authentication & Authorization**: Local JWT with access/refresh tokens, bcrypt hashing, and a four-tier RBAC system with granular permissions and tenant isolation.
    - **Ticket Management**: Comprehensive system with ServiceNow-style fields, hierarchical configurations, dynamic metadata, full audit trails, and a rich text editor. Includes ticket templates with dynamic fields, automation, workflow engine, and analytics.
    - **Customer & Beneficiary Management**: Flexible person management system for callers and beneficiaries, including sensitive data protection and compliance.
    - **Location Management**: Comprehensive system supporting various location record types with advanced UX features like address auto-fill and interactive map coordinate collection.
    - **User & Team Management**: Consolidated system for user and team management with HR database schema expansion, user group memberships, and list-based views.
    - **Project Management**: Full project and project actions system, including automatic project-ticket integration and detailed task tracking.
    - **Timecard/Journey Management**: Comprehensive, CLT-compliant electronic timecard system with NSR, SHA-256 integrity hashing, audit trails, digital signatures, automatic backups, and compliance reports.
    - **Omnichannel Communication**: Unified communication center supporting multiple channels (email, WhatsApp, Slack, Telegram) with real-time inbox processing, rule-based automation, and template management.
    - **Agenda/Schedule Management**: Integrated scheduling system with filtering capabilities connecting client companies, team management groups, and users.
    - **Internationalization (i18n)**: Comprehensive i18n system with multiple languages, dynamic language switching, regional formatting, and a translation management interface. Full translation infrastructure operational with 1400+ translations across English, Portuguese, and Spanish covering UI components, forms, pages, and modals. **CRITICAL FIX (Aug 2025)**: Resolved i18n configuration conflict where system loaded both legacy local files and updated Backend files, causing incorrect language display. **SIDEBAR TRANSLATIONS FIXED (Aug 2025)**: Resolved critical sidebar translation issues by identifying correct translation files (client/src/i18n/locales/ not client/public/locales/), adding missing translation keys directly to pt-BR.json, and removing incorrect legacy translation files. Zero tolerance for English text in Portuguese mode achieved - all navigation items display correctly in target language. **BACKEND PATHS CORRECTED (Aug 22, 2025)**: Fixed critical backend issue where translation system was reading from wrong paths (client/public/locales/ vs client/src/i18n/locales/), causing system to show 0 detected keys. Now correctly detects 604+ translation keys with real completion statistics: PT-BR 100%, EN 100%, ES 100%, FR 100%, DE 100%. **ENGLISH WORD SPACING FIXED (Aug 22, 2025)**: Corrected all concatenated words in English translations (TimecardReports→Timecard Reports, UserManagement→User Management, etc.) for professional presentation.
    - **Template System**: Dynamic UI customization system allowing professional themes and gradient styles via CSS variable integration. Includes a hierarchical template management system with parent-child relationships and inheritance.
    - **Module Integrity Control**: System for detecting code quality issues, security vulnerabilities, and architectural compliance deviations.
    - **Multilocation System**: Hybrid system supporting Brazilian nomenclature (CPF/CNPJ) with international aliases.
    - **Inventory Management**: Comprehensive stock, supplier, and services management modules, including item catalog, stock tracking, and supplier ratings.
    - **Materials Services Management System**: Comprehensive item catalog with embedded ticket integration, including a three-phase workflow (Planning → Execution → Control), full CRUD operations, and a pricing rules system.
    - **Custom Fields Management**: Supports 12 field types, module-specific fields for 10 modules, ordering, conditional logic, templates, validation, and grouping.
    - **Notifications Management**: Comprehensive notification management with multi-channel support (email/in-app/sms/webhook/slack), user preferences, scheduled processing, and automation.
    - **Dashboard Module**: Real-time statistics aggregation, activity tracking, performance monitoring, customizable widget system, and multi-module analytics integration.
    - **Dashboard Governance System**: Advanced 4-layer governance architecture (Fonte → KPI → Apresentação → Regras) with comprehensive data source catalog, KPI management, dynamic card generation, scope restrictions, permission controls, and real-time data validation. Features 11 card types (KPI simples, comparativo, tabela, gráficos, gauge, heatmap, funil), pre-configured KPIs for tickets/contracts/SLAs/timecard/financial metrics, automatic semaforization, drill-down capabilities, and complete multi-tenant isolation. Implemented following Clean Architecture with DashboardGovernanceService, GovernedWidgetRenderer component, and 6 governance API endpoints.
    - **SaaS Admin Module**: Global system administration, complete tenant lifecycle management, billing oversight, audit compliance, advanced analytics, and system maintenance tools.
    - **Approval Management Module**: Comprehensive approval workflow system with hierarchical and conditional approval rules, supporting multiple entity types. Implements Clean Architecture with complete CQRS pattern, real database integration, and multi-tenant isolation.
    - **Contract Management Module**: Enterprise contract management system with complete Clean Architecture implementation. Features 6-table schema, comprehensive CRUD operations, workflow management, automated billing, renewal management, equipment tracking, and SLA monitoring.
    - **Activity Planner Module**: Advanced maintenance management system for asset management and preventive/corrective maintenance scheduling. Features 15+ table schema covering assets, work orders, maintenance plans, scheduling, technician allocation, and analytics.
    - **Corporate Expense Management Module**: Advanced expense management system with OCR processing, multi-currency support, corporate card integration, and fraud detection. Features complete approval workflows, policy engine, and ERP integrations.
    - **Reports & Dashboards Module**: Comprehensive enterprise reporting and dashboard system with complete integration across all 25 system modules. Features include real-time dashboards with WebSocket/SSE support, WYSIWYG PDF designer, visual query builder, intelligent scheduling system (4 types), notification integration (6 channels), approval workflows, AI analytics, and automation pipelines. Supports multi-format exports, mobile-responsive designs, multi-tenant isolation, and compliance with LGPD/GDPR.
    - **Dashboard Governance System**: Advanced 4-layer governance architecture (Fonte → KPI → Apresentação → Regras) with comprehensive data source catalog, KPI management, dynamic card generation, scope restrictions, permission controls, and real-time data validation. Includes pre-configured KPIs for tickets, contracts, SLAs, timecard, and financial metrics with automatic semaforization and drill-down capabilities.

## External Dependencies
- **Database**: Neon PostgreSQL.
- **UI Components**: Radix UI, Shadcn UI.
- **Form Management**: React Hook Form, Zod.
- **Date Handling**: date-fns.
- **Email Communication**: `imap` and `mailparser`.
- **Geocoding/Address Lookup**: ViaCEP API.
- **Mapping**: Leaflet.
- **Rich Text Editor**: TipTap.
- **Logging**: Winston.