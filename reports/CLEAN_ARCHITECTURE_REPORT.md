# Clean Architecture Validation Report

**Data:** 2025-08-11  
**Score:** 0/100  
**Status:** ❌ REPROVADO

## Resumo de Problemas

- 🔥 **Críticos:** 0
- ⚠️ **Altos:** 95
- 📋 **Médios:** 55
- 💡 **Baixos:** 168
- **Total:** 318

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
- **Total de problemas:** 16
- **Críticos:** 0 | **Altos:** 4
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### ⚠️ customers
- **Total de problemas:** 19
- **Críticos:** 0 | **Altos:** 9
- **Principais problemas:**
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'
  - Estrutura esperada 'config' ausente na camada 'infrastructure'

### ⚠️ dashboard
- **Total de problemas:** 10
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### 📋 field-layout
- **Total de problemas:** 7
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### ⚠️ field-layouts
- **Total de problemas:** 11
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### ⚠️ knowledge-base
- **Total de problemas:** 13
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### ⚠️ locations
- **Total de problemas:** 9
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### ⚠️ materials-services
- **Total de problemas:** 58
- **Críticos:** 0 | **Altos:** 32
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### ⚠️ notifications
- **Total de problemas:** 10
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### ⚠️ people
- **Total de problemas:** 13
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### ⚠️ saas-admin
- **Total de problemas:** 11
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### ⚠️ schedule-management
- **Total de problemas:** 13
- **Críticos:** 0 | **Altos:** 5
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'
  - Estrutura esperada 'config' ausente na camada 'infrastructure'

### ⚠️ shared
- **Total de problemas:** 17
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### ⚠️ technical-skills
- **Total de problemas:** 20
- **Críticos:** 0 | **Altos:** 10
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### 📋 template-audit
- **Total de problemas:** 8
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

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
- **Total de problemas:** 10
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

### ⚠️ ticket-history
- **Total de problemas:** 7
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Estrutura esperada 'value-objects' ausente na camada 'domain'
  - Estrutura esperada 'repositories' ausente na camada 'application'
  - Estrutura esperada 'clients' ausente na camada 'infrastructure'

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
