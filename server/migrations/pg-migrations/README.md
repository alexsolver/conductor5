
# PG Migrations

Sistema de migrações para PostgreSQL com suporte a multi-tenancy.

## Estrutura

```
pg-migrations/
├── config/
│   └── migration-manager.ts    # Gerenciador de migrações
├── public/
│   └── 001_create_public_tables.sql  # Tabelas públicas (tenants, users, sessions)
├── tenant/
│   └── 001_create_tenant_tables.sql  # Tabelas de negócio por tenant
└── drizzle/                   # Migrações geradas pelo Drizzle Kit
```

## Como usar

### 1. Executar todas as migrações (público + amostra de tenant)
```bash
npm run script server/scripts/run-migrations.ts
```

### 2. Executar migrações para um tenant específico
```bash
npm run script server/scripts/run-migrations.ts --tenant YOUR_TENANT_ID
```

### 3. Gerar migrações com Drizzle Kit
```bash
npx drizzle-kit generate
```

### 4. Aplicar migrações do Drizzle Kit
```bash
npx drizzle-kit push
```

## Tabelas Criadas

### Schema Público (public)
- `tenants` - Informações dos tenants
- `users` - Usuários do sistema
- `sessions` - Sessões de usuários
- `user_sessions` - Sessões específicas de usuários
- `pg_migrations` - Controle de migrações

### Schema Tenant (tenant_*)
Para cada tenant, um schema é criado com 40+ tabelas de negócio:

**Core Business:**
- `customers` - Clientes
- `companies` - Empresas
- `beneficiaries` - Beneficiários
- `tickets` - Chamados/Tickets
- `locations` - Localizações
- `items` - Itens/Materiais
- `user_groups` - Grupos de usuários
- `activity_logs` - Logs de atividade

**Approval System:**
- `approval_rules` - Regras de aprovação
- `approval_instances` - Instâncias de aprovação
- `approval_decisions` - Decisões de aprovação
- `approval_steps` - Passos de aprovação
- `approval_conditions` - Condições de aprovação
- `approval_workflows` - Workflows de aprovação

**Knowledge Base:**
- `knowledge_base_articles` - Artigos
- `knowledge_base_article_versions` - Versões de artigos
- `knowledge_base_attachments` - Anexos
- `knowledge_base_ratings` - Avaliações
- `knowledge_base_approvals` - Aprovações
- `knowledge_base_comments` - Comentários
- `knowledge_base_templates` - Templates

**Notifications:**
- `notifications` - Notificações
- `user_notification_preferences` - Preferências
- `notification_templates` - Templates
- `schedule_notifications` - Notificações agendadas

**Reports & Dashboards:**
- `reports` - Relatórios
- `dashboards` - Dashboards
- `dashboard_widgets` - Widgets

**Inventory Management:**
- `suppliers` - Fornecedores
- `stock_locations` - Locais de estoque
- `stock_levels` - Níveis de estoque
- `stock_movements` - Movimentações
- `price_lists` - Listas de preços
- `price_list_items` - Itens de lista de preços

**GDPR Compliance:**
- `gdpr_data_requests` - Solicitações de dados
- `gdpr_consent_records` - Registros de consentimento
- `gdpr_audit_logs` - Logs de auditoria

**Ticket Management:**
- `ticket_planned_items` - Itens planejados
- `ticket_consumed_items` - Itens consumidos
- `customer_item_mappings` - Mapeamentos cliente-item

## Isolamento de Dados

Cada tenant possui seu próprio schema PostgreSQL (tenant_uuid), garantindo:
- ✅ Isolamento completo de dados
- ✅ Performance otimizada
- ✅ Facilidade de backup/restore por tenant
- ✅ Compliance de segurança

## ENUMs Suportados

O sistema inclui ENUMs tipados para:
- `customer_type_enum` - Tipo de cliente (PF/PJ)
- `ticket_status_enum` - Status do ticket
- `ticket_priority_enum` - Prioridade do ticket
- `item_type_enum` - Tipo de item
- `location_type_enum` - Tipo de localização
- `notification_type_enum` - Tipo de notificação
- E muitos outros...

## Chaves Estrangeiras

Todas as relações são protegidas por foreign keys:
- Tickets → Customers
- Tickets → Companies
- Tickets → Locations
- Items → Suppliers
- E muitas outras...

## Indexes Otimizados

Cada tabela possui indexes estratégicos:
- Por tenant_id (obrigatório em todas)
- Por campos de busca comum
- Por relacionamentos FK
- Por campos de status/active
