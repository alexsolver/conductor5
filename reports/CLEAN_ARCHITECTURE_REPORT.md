# Clean Architecture Validation Report

**Data:** 2025-08-11  
**Score:** 0/100  
**Status:** ❌ REPROVADO

## Resumo de Problemas

- 🔥 **Críticos:** 5
- ⚠️ **Altos:** 131
- 📋 **Médios:** 60
- 💡 **Baixos:** 130
- **Total:** 326

## Principais Problemas por Módulo

### 🔥 beneficiaries
- **Total de problemas:** 16
- **Críticos:** 1 | **Altos:** 6
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express
  - Entity contém lógica de infraestrutura (acesso a dados, ORM) - violação de responsabilidade

### 🔥 custom-fields
- **Total de problemas:** 17
- **Críticos:** 1 | **Altos:** 7
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express

### ⚠️ dashboard
- **Total de problemas:** 9
- **Críticos:** 0 | **Altos:** 4
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Application Layer: Dependência proibida encontrada -> express
  - Entity misturada com conceitos de Presentation layer (DTOs, Request/Response) - violação de responsabilidade

### ⚠️ field-layout
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Application Layer: Dependência proibida encontrada -> express
  - Domain Service 'FieldLayoutDomainService' não precisa necessariamente terminar com 'Service'

### ⚠️ field-layouts
- **Total de problemas:** 9
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express
  - Use Case 'indexUseCase' não segue o padrão '[Action]UseCase' (ex: CreateCustomerUseCase)

### ⚠️ knowledge-base
- **Total de problemas:** 9
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express
  - Repository contém possível lógica de negócio ou validação complexa

### ⚠️ locations
- **Total de problemas:** 6
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express
  - Use Case contém lógica de Presentation layer (acesso a request/response, express)

### 🔥 materials-services
- **Total de problemas:** 72
- **Críticos:** 2 | **Altos:** 37
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express
  - Application Layer: Dependência proibida encontrada -> express

### ⚠️ notifications
- **Total de problemas:** 8
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express

### ⚠️ people
- **Total de problemas:** 11
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Application Layer: Dependência proibida encontrada -> express
  - Use Case contém lógica de Presentation layer (acesso a request/response, express)

### ⚠️ projects
- **Total de problemas:** 8
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Camada 'domain' ausente no módulo projects
  - Estrutura esperada 'use-cases' ausente na camada 'application'
  - Estrutura esperada 'dto' ausente na camada 'application'

### ⚠️ saas-admin
- **Total de problemas:** 8
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express
  - Repository 'indexRepository' não segue o padrão '[Entity]Repository' (ex: CustomerRepository)

### ⚠️ schedule-management
- **Total de problemas:** 14
- **Críticos:** 0 | **Altos:** 7
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express
  - Application Layer: Dependência proibida encontrada -> express

### ⚠️ shared
- **Total de problemas:** 14
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Estrutura esperada 'config' ausente na camada 'infrastructure'
  - Use Case contém lógica de Presentation layer (acesso a request/response, express)
  - Repository contém possível lógica de negócio ou validação complexa

### ⚠️ teams
- **Total de problemas:** 8
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Camada 'domain' ausente no módulo teams
  - Estrutura esperada 'use-cases' ausente na camada 'application'
  - Estrutura esperada 'dto' ausente na camada 'application'

### 📋 template-hierarchy
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Estrutura esperada 'config' ausente na camada 'infrastructure'
  - Domain Service 'TemplateHierarchyDomainService' não precisa necessariamente terminar com 'Service'

### 📋 template-versions
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Estrutura esperada 'config' ausente na camada 'infrastructure'
  - Domain Service 'TemplateVersionDomainService' não precisa necessariamente terminar com 'Service'

### ⚠️ tenant-admin
- **Total de problemas:** 7
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express
  - Use Case 'indexUseCase' não segue o padrão '[Action]UseCase' (ex: CreateCustomerUseCase)

### ⚠️ ticket-history
- **Total de problemas:** 6
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Application Layer: Dependência proibida encontrada -> express
  - Application Layer: Dependência proibida encontrada -> express

### 📋 ticket-templates
- **Total de problemas:** 3
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'config' ausente na camada 'infrastructure'
  - Domain Service 'TemplateValidationService' não precisa necessariamente terminar com 'Service'

### ⚠️ tickets
- **Total de problemas:** 18
- **Críticos:** 0 | **Altos:** 9
- **Principais problemas:**
  - Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express

### ⚠️ timecard
- **Total de problemas:** 12
- **Críticos:** 0 | **Altos:** 4
- **Principais problemas:**
  - Rotas contêm lógica de negócio ou acesso direto a dados
  - Application Layer: Dependência proibida encontrada -> express
  - Application Layer: Dependência proibida encontrada -> express

### 📋 user-management
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Arquivo de rotas (routes.ts ou presentation/index.ts) ausente no módulo user-management
  - Service 'index' não segue o padrão PascalCase
  - Service 'index' não segue o padrão PascalCase

### ⚠️ users
- **Total de problemas:** 8
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Camada 'domain' ausente no módulo users
  - Estrutura esperada 'use-cases' ausente na camada 'application'
  - Estrutura esperada 'dto' ausente na camada 'application'

### ⚠️ auth
- **Total de problemas:** 10
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Application Layer: Dependência proibida encontrada -> express
  - Entity misturada com conceitos de Presentation layer (DTOs, Request/Response) - violação de responsabilidade
  - Use Case contém lógica de Presentation layer (acesso a request/response, express)

### 🔥 customers
- **Total de problemas:** 17
- **Críticos:** 1 | **Altos:** 10
- **Principais problemas:**
  - Application Layer: Dependência proibida encontrada -> express
  - Entity misturada com conceitos de Presentation layer (DTOs, Request/Response) - violação de responsabilidade
  - Entity contém lógica de infraestrutura (acesso a dados, ORM) - violação de responsabilidade

### ⚠️ technical-skills
- **Total de problemas:** 20
- **Críticos:** 0 | **Altos:** 11
- **Principais problemas:**
  - Application Layer: Dependência proibida encontrada -> express
  - Application Layer: Dependência proibida encontrada -> express
  - Application Layer: Dependência proibida encontrada -> express

### 📋 template-audit
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Domain Service 'AuditValidationService' não precisa necessariamente terminar com 'Service'
  - Service 'index' não segue o padrão PascalCase
  - Service 'index' não segue o padrão PascalCase


## Plano de Correção

### 📋 beneficiaries
- **Prioridade:** indefinida
- **Tempo estimado:** não estimado
- **Ações:** 0



### 📋 custom-fields
- **Prioridade:** indefinida
- **Tempo estimado:** não estimado
- **Ações:** 0



### 📋 customers
- **Prioridade:** indefinida
- **Tempo estimado:** não estimado
- **Ações:** 0



### 📋 materials-services
- **Prioridade:** indefinida
- **Tempo estimado:** não estimado
- **Ações:** 0



### 📋 materials-services
- **Prioridade:** indefinida
- **Tempo estimado:** não estimado
- **Ações:** 0




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
