# Clean Architecture Validation Report

**Data:** 2025-08-10  
**Score:** 32/100  
**Status:** ❌ REPROVADO

## Resumo de Problemas

- 🔥 **Críticos:** 2
- ⚠️ **Altos:** 49
- 📋 **Médios:** 22
- 💡 **Baixos:** 0
- **Total:** 73

## Principais Problemas por Módulo

### ⚠️ materials-services
- **Total de problemas:** 36
- **Críticos:** 0 | **Altos:** 30
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Application Layer violando dependência: express
  - Application Layer violando dependência: express

### ⚠️ saas-admin
- **Total de problemas:** 3
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Entity SaasConfigEntity não possui Repository correspondente
  - Repository indexRepository não possui interface no Domain

### ⚠️ technical-skills
- **Total de problemas:** 5
- **Críticos:** 0 | **Altos:** 5
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Application Layer violando dependência: express
  - Application Layer violando dependência: ../../infrastructure/repositories/DrizzleUserSkillRepository

### ⚠️ tickets
- **Total de problemas:** 3
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Application Layer violando dependência: express
  - Repository contém possível lógica de negócio

### 🔥 beneficiaries
- **Total de problemas:** 4
- **Críticos:** 2 | **Altos:** 2
- **Principais problemas:**
  - Domain Layer violando dependência: ../../application/dto/CreateBeneficiaryDTO
  - Domain Layer violando dependência: ../../application/dto/CreateBeneficiaryDTO
  - Application Layer violando dependência: express

### ⚠️ custom-fields
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Application Layer violando dependência: express

### ⚠️ knowledge-base
- **Total de problemas:** 6
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Application Layer violando dependência: ../../infrastructure/repositories/MediaRepository
  - Application Layer violando dependência: ../../infrastructure/repositories/MediaRepository
  - Repository contém possível lógica de negócio

### ⚠️ timecard
- **Total de problemas:** 7
- **Críticos:** 0 | **Altos:** 4
- **Principais problemas:**
  - Application Layer violando dependência: express
  - Application Layer violando dependência: express
  - Application Layer violando dependência: drizzle-orm

### 📋 auth
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Repository contém possível lógica de negócio

### 📋 dashboard
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Repository contém possível lógica de negócio

### ⚠️ schedule-management
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Repository contém possível lógica de negócio
  - Entity ScheduleEntity não possui Repository correspondente

### 📋 shared
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Repository contém possível lógica de negócio
  - Repository index deve terminar com 'Repository'
  - Repository index deve implementar interface


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
