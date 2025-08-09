# Clean Architecture Validation Report

**Data:** 2025-08-09  
**Score:** 33/100  
**Status:** ❌ REPROVADO

## Resumo de Problemas

- 🔥 **Críticos:** 12
- ⚠️ **Altos:** 67
- 📋 **Médios:** 52
- 💡 **Baixos:** 2
- **Total:** 133

## Principais Problemas por Módulo

### ⚠️ auth
- **Total de problemas:** 3
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Routes não utiliza controllers - lógica direta nas rotas
  - Application Layer violando dependência: express
  - Repository contém possível lógica de negócio

### ⚠️ beneficiaries
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Use Case index deve terminar com 'UseCase'

### ⚠️ customers
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Application Layer violando dependência: express

### 🔥 knowledge-base
- **Total de problemas:** 15
- **Críticos:** 1 | **Altos:** 9
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Application Layer violando dependência: express

### 🔥 materials-services
- **Total de problemas:** 57
- **Críticos:** 7 | **Altos:** 36
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Domain Layer violando dependência: drizzle-orm/neon-http

### ⚠️ saas-admin
- **Total de problemas:** 11
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Estrutura entities ausente na camada domain
  - Estrutura repositories ausente na camada domain
  - Estrutura events ausente na camada domain

### 🔥 schedule-management
- **Total de problemas:** 6
- **Críticos:** 1 | **Altos:** 3
- **Principais problemas:**
  - Arquivo routes.ts ausente no módulo schedule-management
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Application Layer violando dependência: express

### 🔥 shared
- **Total de problemas:** 6
- **Críticos:** 1 | **Altos:** 0
- **Principais problemas:**
  - Routes não utiliza controllers - lógica direta nas rotas
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Use Case index deve terminar com 'UseCase'

### 🔥 technical-skills
- **Total de problemas:** 10
- **Críticos:** 1 | **Altos:** 7
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Application Layer violando dependência: express

### ⚠️ tickets
- **Total de problemas:** 3
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Routes não utiliza controllers - lógica direta nas rotas
  - Routes contém lógica de negócio ou acesso a dados
  - Repository contém possível lógica de negócio

### 🔥 timecard
- **Total de problemas:** 13
- **Críticos:** 1 | **Altos:** 6
- **Principais problemas:**
  - Estrutura entities ausente na camada domain
  - Estrutura repositories ausente na camada domain
  - Estrutura events ausente na camada domain

### 📋 dashboard
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Repository contém possível lógica de negócio

### 📋 custom-fields
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Use Case index deve terminar com 'UseCase'

### 📋 field-layouts
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Use Case index deve terminar com 'UseCase'

### 📋 people
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Use Case index deve terminar com 'UseCase'

### 📋 tenant-admin
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Use Case index deve terminar com 'UseCase'


## Plano de Correção

### 🔥 knowledge-base
- **Prioridade:** immediate
- **Tempo estimado:** 8h
- **Ações:** 10

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **refactor_code:** Refatorar dependência inválida na camada application
5. **refactor_code:** Refatorar dependência inválida na camada application
6. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
7. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
8. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
9. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
10. **create_file:** Criar Repository com interface

### 🔥 materials-services
- **Prioridade:** immediate
- **Tempo estimado:** 29h
- **Ações:** 38

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada domain
4. **refactor_code:** Refatorar dependência inválida na camada domain
5. **refactor_code:** Refatorar dependência inválida na camada domain
6. **refactor_code:** Refatorar dependência inválida na camada domain
7. **refactor_code:** Refatorar dependência inválida na camada domain
8. **refactor_code:** Refatorar dependência inválida na camada domain
9. **refactor_code:** Refatorar dependência inválida na camada application
10. **refactor_code:** Refatorar dependência inválida na camada application
11. **refactor_code:** Refatorar dependência inválida na camada application
12. **refactor_code:** Refatorar dependência inválida na camada application
13. **refactor_code:** Refatorar dependência inválida na camada application
14. **refactor_code:** Refatorar dependência inválida na camada application
15. **refactor_code:** Refatorar dependência inválida na camada application
16. **refactor_code:** Refatorar dependência inválida na camada application
17. **refactor_code:** Refatorar dependência inválida na camada application
18. **refactor_code:** Refatorar dependência inválida na camada application
19. **refactor_code:** Refatorar dependência inválida na camada application
20. **refactor_code:** Refatorar dependência inválida na camada application
21. **refactor_code:** Refatorar dependência inválida na camada application
22. **refactor_code:** Refatorar dependência inválida na camada application
23. **refactor_code:** Refatorar dependência inválida na camada application
24. **refactor_code:** Refatorar dependência inválida na camada application
25. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
26. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
27. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
28. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
29. **rename_file:** Padronizar nomenclatura: Entity index não segue padrão PascalCase
30. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
31. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
32. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
33. **rename_file:** Padronizar nomenclatura: Repository LPUCacheWarmer deve terminar com 'Repository'
34. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
35. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
36. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
37. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
38. **create_file:** Criar Repository com interface

### 🔥 schedule-management
- **Prioridade:** immediate
- **Tempo estimado:** 4h
- **Ações:** 4

1. **create_file:** Criar arquivo routes.ts para definir endpoints da API
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio

### 🔥 shared
- **Prioridade:** immediate
- **Tempo estimado:** 3h
- **Ações:** 6

1. **create_directory:** Criar controllers na camada Application e usar nas rotas
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'
4. **rename_file:** Padronizar nomenclatura: Repository index deve terminar com 'Repository'
5. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
6. **create_file:** Criar Repository com interface

### 🔥 technical-skills
- **Prioridade:** immediate
- **Tempo estimado:** 5h
- **Ações:** 6

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **refactor_code:** Refatorar dependência inválida na camada application
5. **rename_file:** Padronizar nomenclatura: Nome da classe SkillEntity não corresponde ao arquivo Skill
6. **rename_file:** Padronizar nomenclatura: Repository DrizzleUserSkillRepository_FIXED deve terminar com 'Repository'

### 🔥 timecard
- **Prioridade:** immediate
- **Tempo estimado:** 5h
- **Ações:** 9

1. **create_directory:** Criar diretório/arquivo entities na camada domain
2. **create_directory:** Criar diretório/arquivo repositories na camada domain
3. **create_directory:** Criar diretório/arquivo events na camada domain
4. **create_directory:** Criar diretório/arquivo services na camada domain
5. **refactor_code:** Refatorar dependência inválida na camada domain
6. **refactor_code:** Refatorar dependência inválida na camada application
7. **refactor_code:** Refatorar dependência inválida na camada application
8. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
9. **create_directory:** Criar interface I[Entity]Repository no domain e implementar

### ⚠️ auth
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 3

1. **create_directory:** Criar controllers na camada Application e usar nas rotas
2. **refactor_code:** Refatorar dependência inválida na camada application
3. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio

### ⚠️ beneficiaries
- **Prioridade:** high
- **Tempo estimado:** 1h
- **Ações:** 2

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'

### ⚠️ customers
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 2

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada application

### ⚠️ saas-admin
- **Prioridade:** high
- **Tempo estimado:** 3h
- **Ações:** 11

1. **create_directory:** Criar diretório/arquivo entities na camada domain
2. **create_directory:** Criar diretório/arquivo repositories na camada domain
3. **create_directory:** Criar diretório/arquivo events na camada domain
4. **create_directory:** Criar diretório/arquivo services na camada domain
5. **create_directory:** Criar diretório/arquivo use-cases na camada application
6. **create_directory:** Criar diretório/arquivo controllers na camada application
7. **create_directory:** Criar diretório/arquivo dto na camada application
8. **create_directory:** Criar diretório/arquivo services na camada application
9. **create_directory:** Criar diretório/arquivo repositories na camada infrastructure
10. **create_directory:** Criar controllers na camada Application e usar nas rotas
11. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados

### ⚠️ tickets
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 3

1. **create_directory:** Criar controllers na camada Application e usar nas rotas
2. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
3. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio

### 💡 dashboard
- **Prioridade:** low
- **Tempo estimado:** 45min
- **Ações:** 1

1. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio

### 💡 custom-fields
- **Prioridade:** low
- **Tempo estimado:** 15min
- **Ações:** 1

1. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'

### 💡 field-layouts
- **Prioridade:** low
- **Tempo estimado:** 15min
- **Ações:** 1

1. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'

### 💡 people
- **Prioridade:** low
- **Tempo estimado:** 15min
- **Ações:** 1

1. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'

### 💡 tenant-admin
- **Prioridade:** low
- **Tempo estimado:** 15min
- **Ações:** 1

1. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'


## Recomendações

### Prioridade Imediata 🔥
- **knowledge-base:** 10 ações (8h)
- **materials-services:** 38 ações (29h)
- **schedule-management:** 4 ações (4h)
- **shared:** 6 ações (3h)
- **technical-skills:** 6 ações (5h)
- **timecard:** 9 ações (5h)

### Prioridade Alta ⚠️
- **auth:** 3 ações (2h)
- **beneficiaries:** 2 ações (1h)
- **customers:** 2 ações (2h)
- **saas-admin:** 11 ações (3h)
- **tickets:** 3 ações (2h)

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
