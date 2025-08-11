# Clean Architecture Validation Report

**Data:** 2025-08-11  
**Score:** 0/100  
**Status:** ❌ REPROVADO

## Resumo de Problemas

- 🔥 **Críticos:** 0
- ⚠️ **Altos:** 95
- 📋 **Médios:** 56
- 💡 **Baixos:** 115
- **Total:** 266

## Principais Problemas por Módulo

### ⚠️ auth
- **Total de problemas:** 10
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Entity misturada com conceitos de Presentation layer (DTOs, Request/Response) - violação de responsabilidade

### ⚠️ beneficiaries
- **Total de problemas:** 15
- **Críticos:** 0 | **Altos:** 6
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express

### ⚠️ custom-fields
- **Total de problemas:** 12
- **Críticos:** 0 | **Altos:** 4
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express

### ⚠️ customers
- **Total de problemas:** 16
- **Críticos:** 0 | **Altos:** 9
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Entity misturada com conceitos de Presentation layer (DTOs, Request/Response) - violação de responsabilidade

### ⚠️ dashboard
- **Total de problemas:** 6
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Use Case contém lógica de Presentation layer (acesso a request/response, express)
  - Repository contém possível lógica de negócio ou validação complexa

### 📋 field-layout
- **Total de problemas:** 3
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Domain Service 'FieldLayoutDomainService' não precisa necessariamente terminar com 'Service'
  - Repository 'DrizzleFieldLayoutRepository' implementa uma interface que não foi encontrada no Domain layer

### ⚠️ field-layouts
- **Total de problemas:** 7
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Use Case 'indexUseCase' não segue o padrão '[Action]UseCase' (ex: CreateCustomerUseCase)
  - Domain Service 'FieldLayoutDomainService' não precisa necessariamente terminar com 'Service'

### ⚠️ knowledge-base
- **Total de problemas:** 9
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Repository contém possível lógica de negócio ou validação complexa
  - Controller contém lógica de negócio ou acesso direto a dados

### ⚠️ locations
- **Total de problemas:** 5
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Use Case contém lógica de Presentation layer (acesso a request/response, express)
  - Domain Service 'LocationDomainService' não precisa necessariamente terminar com 'Service'

### ⚠️ materials-services
- **Total de problemas:** 54
- **Críticos:** 0 | **Altos:** 32
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express

### ⚠️ notifications
- **Total de problemas:** 6
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Use Case contém lógica de Presentation layer (acesso a request/response, express)

### ⚠️ people
- **Total de problemas:** 9
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Use Case contém lógica de Presentation layer (acesso a request/response, express)
  - Use Case contém lógica de Presentation layer (acesso a request/response, express)

### ⚠️ saas-admin
- **Total de problemas:** 7
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Repository 'indexRepository' não segue o padrão '[Entity]Repository' (ex: CustomerRepository)
  - Domain Service 'SaasAdminDomainService' não precisa necessariamente terminar com 'Service'

### ⚠️ schedule-management
- **Total de problemas:** 10
- **Críticos:** 0 | **Altos:** 5
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Use Case contém lógica de Presentation layer (acesso a request/response, express)
  - Use Case contém lógica de Presentation layer (acesso a request/response, express)

### ⚠️ shared
- **Total de problemas:** 17
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### ⚠️ technical-skills
- **Total de problemas:** 16
- **Críticos:** 0 | **Altos:** 10
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express
  - Application Layer: Dependência proibida encontrada -> express

### 📋 template-hierarchy
- **Total de problemas:** 5
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### 📋 template-versions
- **Total de problemas:** 5
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### ⚠️ tenant-admin
- **Total de problemas:** 6
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Use Case 'indexUseCase' não segue o padrão '[Action]UseCase' (ex: CreateCustomerUseCase)
  - Domain Service 'TenantConfigDomainService' não precisa necessariamente terminar com 'Service'

### ⚠️ ticket-history
- **Total de problemas:** 3
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Use Case contém lógica de Presentation layer (acesso a request/response, express)
  - Domain Service 'TicketHistoryDomainService' não precisa necessariamente terminar com 'Service'

### 📋 ticket-templates
- **Total de problemas:** 5
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### ⚠️ tickets
- **Total de problemas:** 14
- **Críticos:** 0 | **Altos:** 6
- **Principais problemas:**
  - Estrutura esperada 'use-cases' ausente na camada 'application'
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Rotas contêm lógica de negócio ou acesso direto a dados

### ⚠️ timecard
- **Total de problemas:** 12
- **Críticos:** 0 | **Altos:** 4
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express
  - Application Layer: Dependência proibida encontrada -> express

### 📋 user-management
- **Total de problemas:** 10
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Estrutura esperada 'entities' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'domain'
  - Estrutura esperada 'events' ausente na camada 'domain'

### 📋 template-audit
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Domain Service 'AuditValidationService' não precisa necessariamente terminar com 'Service'
  - Service 'index' não segue o padrão PascalCase
  - Service 'index' não segue o padrão PascalCase


## Plano de Correção



## Recomendações

### Prioridade Imediata 🔥
Nenhuma ação imediata necessária

### Prioridade Alta ⚠️
Nenhuma ação de alta prioridade necessária

## Comandos para Correção

```bash
# Validar arquitetura
npm run validate:architecture

# Aplicar correções automáticas
npm run validate:architecture --fix

# Gerar relatório detalhado
npm run validate:architecture --report
```

---
*Relatório gerado automaticamente pelo Clean Architecture Validator*
