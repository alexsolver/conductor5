# Clean Architecture Validation Report

**Data:** 2025-08-10  
**Score:** 33/100  
**Status:** ❌ REPROVADO

## Resumo de Problemas

- 🔥 **Críticos:** 2
- ⚠️ **Altos:** 48
- 📋 **Médios:** 25
- 💡 **Baixos:** 0
- **Total:** 75

## Principais Problemas por Módulo

### ⚠️ materials-services
- **Total de problemas:** 40
- **Críticos:** 0 | **Altos:** 33
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Application Layer violando dependência: express
  - Application Layer violando dependência: ../../infrastructure/repositories/AssetManagementRepository

### ⚠️ saas-admin
- **Total de problemas:** 5
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Application Layer violando dependência: express
  - Repository indexRepository deve implementar interface

### ⚠️ technical-skills
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Entity SkillEntity não possui Repository correspondente

### ⚠️ tickets
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Repository contém possível lógica de negócio

### 🔥 beneficiaries
- **Total de problemas:** 3
- **Críticos:** 2 | **Altos:** 1
- **Principais problemas:**
  - Domain Layer violando dependência: ../../application/dto/CreateBeneficiaryDTO
  - Domain Layer violando dependência: ../../application/dto/CreateBeneficiaryDTO
  - Entity misturada com DTOs - violação de responsabilidade

### ⚠️ knowledge-base
- **Total de problemas:** 9
- **Críticos:** 0 | **Altos:** 5
- **Principais problemas:**
  - Application Layer violando dependência: express
  - Application Layer violando dependência: ../../infrastructure/repositories/MediaRepository
  - Application Layer violando dependência: ../../infrastructure/repositories/MediaRepository

### ⚠️ timecard
- **Total de problemas:** 5
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Application Layer violando dependência: express
  - Repository contém possível lógica de negócio
  - Repository DrizzleTimecardRepository deve implementar interface

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
- **Total de problemas:** 5
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Repository contém possível lógica de negócio
  - Repository index deve terminar com 'Repository'
  - Repository index deve implementar interface


## Plano de Correção

### 🔥 beneficiaries
- **Prioridade:** immediate
- **Tempo estimado:** 2h
- **Ações:** 2

1. **refactor_code:** Refatorar dependência inválida na camada domain
2. **move_code:** Resolver acoplamento: Entity misturada com DTOs - violação de responsabilidade

### ⚠️ materials-services
- **Prioridade:** high
- **Tempo estimado:** 21h
- **Ações:** 24

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada application
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **refactor_code:** Refatorar dependência inválida na camada application
5. **refactor_code:** Refatorar dependência inválida na camada application
6. **refactor_code:** Refatorar dependência inválida na camada application
7. **refactor_code:** Refatorar dependência inválida na camada application
8. **refactor_code:** Refatorar dependência inválida na camada application
9. **refactor_code:** Refatorar dependência inválida na camada application
10. **refactor_code:** Refatorar dependência inválida na camada application
11. **refactor_code:** Refatorar dependência inválida na camada application
12. **refactor_code:** Refatorar dependência inválida na camada application
13. **refactor_code:** Refatorar dependência inválida na camada application
14. **refactor_code:** Refatorar dependência inválida na camada application
15. **refactor_code:** Refatorar dependência inválida na camada application
16. **refactor_code:** Refatorar dependência inválida na camada application
17. **refactor_code:** Refatorar dependência inválida na camada application
18. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
19. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
20. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
21. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
22. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
23. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
24. **create_file:** Criar Repository com interface

### ⚠️ saas-admin
- **Prioridade:** high
- **Tempo estimado:** 3h
- **Ações:** 5

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada application
3. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
4. **create_file:** Criar Repository com interface
5. **create_file:** Criar Repository com interface

### ⚠️ technical-skills
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 2

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **create_file:** Criar Repository com interface

### ⚠️ tickets
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 2

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio

### ⚠️ knowledge-base
- **Prioridade:** high
- **Tempo estimado:** 4h
- **Ações:** 6

1. **refactor_code:** Refatorar dependência inválida na camada application
2. **refactor_code:** Refatorar dependência inválida na camada application
3. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
4. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
5. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
6. **create_directory:** Criar interface I[Entity]Repository no domain e implementar

### ⚠️ timecard
- **Prioridade:** high
- **Tempo estimado:** 3h
- **Ações:** 5

1. **refactor_code:** Refatorar dependência inválida na camada application
2. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
3. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
4. **create_file:** Criar Repository com interface
5. **create_file:** Criar Repository com interface

### ⚠️ schedule-management
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 2

1. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
2. **create_file:** Criar Repository com interface

### 💡 auth
- **Prioridade:** low
- **Tempo estimado:** 45min
- **Ações:** 1

1. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio

### 💡 dashboard
- **Prioridade:** low
- **Tempo estimado:** 45min
- **Ações:** 1

1. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio

### 💡 shared
- **Prioridade:** low
- **Tempo estimado:** 2h
- **Ações:** 5

1. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
2. **rename_file:** Padronizar nomenclatura: Repository index deve terminar com 'Repository'
3. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
4. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
5. **create_file:** Criar Repository com interface


## Recomendações

### Prioridade Imediata 🔥
- **beneficiaries:** 2 ações (2h)

### Prioridade Alta ⚠️
- **materials-services:** 24 ações (21h)
- **saas-admin:** 5 ações (3h)
- **technical-skills:** 2 ações (2h)
- **tickets:** 2 ações (2h)
- **knowledge-base:** 6 ações (4h)
- **timecard:** 5 ações (3h)
- **schedule-management:** 2 ações (2h)

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
