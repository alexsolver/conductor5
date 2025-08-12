# Conductor - Customer Support Platform

## Overview
Conductor is a modern SaaS customer support platform designed for omnichannel customer support management with enterprise multitenancy. Its purpose is to streamline customer support operations, offering comprehensive tools for managing tickets, customer interactions, and internal workflows. Built with a full-stack TypeScript architecture, it features a gradient-focused design system. The platform is engineered for scalability and internationalization, supporting diverse business models and geographical locations, with a business vision to provide a comprehensive, compliant, and efficient solution for customer support.

## User Preferences
Preferred communication style: Simple, everyday language.
Interface preference: Text-based hierarchical menus with dropdowns over visual card-based interfaces.

## System Architecture
Conductor follows a Clean Architecture with Domain-Driven Design principles. As of August 2025, the core modules (Tickets, Users, Auth) have been fully standardized following Clean Architecture patterns with domain/application/infrastructure layers and proper dependency injection.

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with a custom gradient design system and Shadcn UI components built on Radix UI primitives.
- **State Management**: TanStack React Query for server state management.
- **Routing**: Wouter for client-side routing with employment-aware route guards.
- **UI/UX Decisions**: Gradient-focused design (purple/blue primary, pink/red secondary, blue/cyan success). The color system is dynamic and database-driven for badges and configurations. UI prioritizes text-based hierarchical menus and organized sections over card-based interfaces for complex data, allowing dynamic badge colors based on database configurations.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Local JWT authentication.
- **Session Management**: Express sessions with PostgreSQL storage.
- **API Design**: RESTful endpoints with structured error handling.
- **Architecture Pattern**: Clean Architecture with Domain, Application, and Infrastructure layers.
- **Multi-tenancy**: True schema separation where each tenant has a dedicated PostgreSQL schema (`tenant_{uuid}`).
- **Employment Type System**: Dual employment type support (CLT/Autonomous) with automatic detection, terminology mapping, and route redirection to appropriate interfaces.
- **Key Features**:
    - **Authentication & Authorization**: Local JWT with access/refresh tokens, bcrypt hashing, and a four-tier RBAC system (saas_admin, tenant_admin, agent, customer) with granular permissions and tenant isolation.
    - **Ticket Management**: Comprehensive system with ServiceNow-style fields, hierarchical configurations (category → subcategory → action), and dynamic metadata. Includes full audit trails and a rich text description editor with Markdown support.
    - **Customer & Beneficiary Management**: Flexible person management system for callers and beneficiaries, including sensitive data protection.
    - **Location Management**: Comprehensive system supporting various location record types with advanced UX features like CEP auto-fill, interactive map coordinate collection, and centralized operating hours.
    - **User & Team Management**: Consolidated system for user and team management with HR database schema expansion, user group memberships, and a list-based view.
    - **Project Management**: Full project and project actions system, including automatic project-ticket integration and detailed task tracking.
    - **Timecard/Journey Management**: Comprehensive, CLT-compliant electronic timecard system with NSR, SHA-256 integrity hashing, audit trails, digital signatures, automatic backups, and compliance reports. Supports both CLT and Autonomous workers with distinct interfaces and terminology while maintaining identical backend functionality.
    - **Omnichannel Communication**: Unified communication center supporting multiple channels (email, WhatsApp, Slack) with real-time inbox processing, rule-based automation, and template management.
    - **Agenda/Schedule Management**: Integrated scheduling system with filtering capabilities connecting client companies, team management groups, and users, featuring timeline and 14-day agenda views.
    - **Internationalization (i18n)**: Comprehensive i18n system with multiple languages, dynamic language switching, regional formatting, and a translation management interface.
    - **Template System**: Dynamic UI customization system allowing professional themes and gradient styles via CSS variable integration.
    - **Module Integrity Control**: System for detecting code quality issues, security vulnerabilities, and architectural compliance deviations.
    - **Multilocation System**: Hybrid system supporting Brazilian nomenclature (CPF/CNPJ) with international aliases.
    - **Inventory Management**: Comprehensive stock, supplier, and services management modules, including item catalog, stock tracking, and supplier ratings.
    - **Materials Management System**: Comprehensive item catalog with embedded ticket integration, including a three-phase workflow (Planning → Execution → Control), full CRUD operations with backend, LPU (Unit Price List) integration, and a pricing rules system with various rule types and priority.
    - **Schema Consistency**: Complete Drizzle ORM consolidation with unified imports, standardized type definitions, and systematic resolution of all LSP diagnostics.
    - **Validation System Enhancement**: Standardized tenant validation thresholds, implemented soft delete (is_active) across critical audit tables, and redesigned core table definitions.
    - **Hierarchical Ticket Classification System**: Fully functional category→subcategory→action hierarchy with proper backend integration, frontend validation, dynamic loading, company-specific isolation, and automatic color synchronization.
    - **File Upload System**: Complete implementation of file upload system with description field support.
    - **Clean Architecture Implementation**: Complete standardization of Tickets, Users, Auth, Customers, Companies, Locations, Beneficiaries, Schedule Management, Technical Skills, Teams, Inventory, Custom Fields, People, Materials Services, Notifications, and Timecard modules following Clean Architecture patterns with domain/application/infrastructure layers, proper use cases, and repository patterns as per 1qa.md specifications. All modules include Brazilian business compliance (CPF/CNPJ validation), tenant isolation, and gradual integration system with dual-system approach for backward compatibility.
    - **Phase 7 - Beneficiaries Module**: Complete implementation with Domain Layer (Beneficiary entity + BeneficiaryDomainService with CPF/CNPJ validation), Application Layer (4 use cases + BeneficiaryController), Infrastructure Layer (SimplifiedBeneficiaryRepository), and Presentation Layer (Clean Architecture routes + Integration routes). Features comprehensive Brazilian compliance, 30+ repository methods, 12 RESTful endpoints, advanced filtering/search, statistics, bulk operations, and multi-tenancy support.
    - **Phase 8 - Schedule Management Module**: Complete implementation with advanced workforce scheduling capabilities. Features include schedule CRUD operations, activity type management, agent availability tracking, conflict detection, recurring schedules, analytics, and dual-system integration (/working + /clean routes). Implements comprehensive schedule validation, multi-tenancy support, and 9+ active endpoints with advanced Clean Architecture routes available.
    - **Phase 9 - Technical Skills Module**: Complete integration leveraging existing Clean Architecture structure. Features technical skills CRUD operations, user skill assignments, proficiency levels, skill categories, and dual-system integration (/working + /legacy routes). Includes 10+ active endpoints, multi-tenancy support, comprehensive validation with Zod schemas, and backward compatibility with original technical skills system.
    - **Phase 10 - Teams Module**: Complete implementation following Clean Architecture patterns. Features include team CRUD operations, team types (support/technical/sales/management/external), status management, working hours configuration, manager assignments, department integration, and advanced team statistics. Includes 8+ active endpoints, multi-tenancy support, comprehensive validation with Zod schemas, and team capacity management.
    - **Phase 11 - Inventory Module**: Complete implementation following Clean Architecture patterns. Features include inventory item CRUD operations, SKU management, stock control (current/minimum/maximum), cost tracking (unit/average/purchase price), supplier management, location tracking, serial numbers, expiration control, stock movements with audit trails, and comprehensive inventory statistics. Includes 9+ active endpoints, multi-tenancy support, comprehensive validation with Zod schemas, and advanced filtering capabilities.
    - **Phase 12 - Custom Fields Module**: Complete implementation following Clean Architecture patterns. Features include custom field CRUD operations, 12 field types support (text, number, email, phone, date, datetime, boolean, select, multiselect, textarea, file, url), module-specific fields for 10 modules, field ordering and reordering, conditional logic, field templates, validation rules, field grouping, and comprehensive field statistics. Includes 10+ active endpoints, multi-tenancy support, comprehensive validation with Zod schemas, and advanced field management capabilities.
    - **Phase 13 - People Module**: Complete implementation following Clean Architecture patterns. Features include comprehensive people management for both natural persons (PF) and legal persons (PJ), Brazilian document validation (CPF/CNPJ/RG), complete address system, contact management (email/phone/cellphone), flexible tags system, advanced search and filtering, duplicate detection, age analytics, location distribution, relationship detection, and bulk operations. Includes 10+ active endpoints, multi-tenancy support, comprehensive Brazilian compliance, and advanced people analytics.
    - **Phase 14 - Materials Services Module**: Complete implementation following Clean Architecture patterns. Features include comprehensive materials and services management, inventory control with stock levels (current/minimum/maximum), price management with multi-currency support and price history, supplier management, brand/model tracking, barcode and serial number support, expiration date management, location tracking, advanced search and filtering, stock alerts (low/out/over stock), duplicate detection, tags system, and comprehensive analytics. Includes 12+ active endpoints, multi-tenancy support, business rules validation (materials vs services), and advanced inventory analytics.
    - **Phase 15 - Notifications Module**: Complete implementation leveraging existing Clean Architecture structure. Features include comprehensive notification management with multi-channel support (email/in_app/sms/webhook/slack), user preferences management, scheduled notification processing, notification automation service, status tracking (pending/sent/delivered/failed/read), priority system (low/medium/high/urgent), and complete notification analytics. Includes 10+ active endpoints, multi-tenancy support, Clean Architecture use cases and controllers, and advanced notification automation.
    - **Phase 16 - Timecard Module**: Complete implementation with comprehensive Clean Architecture structure including domain entities (TimecardEntry, WorkSchedule, HourBank, AbsenceRequest), CLT compliance, Brazilian labor law support, hour bank management, approval workflow, multiple schedule types (5x2, 6x1, 12x36), comprehensive reporting, and time tracking with automatic overtime calculation. Includes 13+ active endpoints with working routes, multi-tenancy support, and complete business rule validation.

## External Dependencies
- **Database**: Neon PostgreSQL.
- **UI Components**: Radix UI, Shadcn UI.
- **Form Management**: React Hook Form, Zod.
- **Date Handling**: date-fns.
- **Email Communication**: `imap` and `mailparser` for Gmail IMAP connection.
- **Geocoding/Address Lookup**: ViaCEP API for address auto-fill.
- **Mapping**: Leaflet for interactive map integration.
- **Rich Text Editor**: TipTap.
- **Logging**: Winston for structured logging.