# Clean Architecture Validation Report

**Data:** 2025-08-09  
**Score:** 38/100  
**Status:** ❌ REPROVADO

## Resumo de Problemas

- 🔥 **Críticos:** 0
- ⚠️ **Altos:** 75
- 📋 **Médios:** 77
- 💡 **Baixos:** 2
- **Total:** 154

## Principais Problemas por Módulo

### ⚠️ auth
- **Total de problemas:** 6
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Routes não utiliza controllers - lógica direta nas rotas
  - Application Layer violando dependência: express
  - Repository contém possível lógica de negócio

### ⚠️ beneficiaries
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Use Case index deve terminar com 'UseCase'
  - Routes contém lógica de negócio ou acesso a dados

### ⚠️ customers
- **Total de problemas:** 5
- **Críticos:** 0 | **Altos:** 5
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Application Layer violando dependência: express
  - Entity Customer não possui Repository correspondente

### 🔥 knowledge-base
- **Total de problemas:** 32
- **Críticos:** 1 | **Altos:** 19
- **Principais problemas:**
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain
  - Routes contém lógica de negócio ou acesso a dados

### 🔥 materials-services
- **Total de problemas:** 119
- **Críticos:** 7 | **Altos:** 73
- **Principais problemas:**
  - Estrutura repositories ausente na camada domain
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain

### ⚠️ saas-admin
- **Total de problemas:** 16
- **Críticos:** 0 | **Altos:** 5
- **Principais problemas:**
  - Camada domain ausente no módulo saas-admin
  - Camada application ausente no módulo saas-admin
  - Camada infrastructure ausente no módulo saas-admin

### 🔥 schedule-management
- **Total de problemas:** 18
- **Críticos:** 1 | **Altos:** 6
- **Principais problemas:**
  - Estrutura repositories ausente na camada domain
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain

### 🔥 shared
- **Total de problemas:** 12
- **Críticos:** 1 | **Altos:** 1
- **Principais problemas:**
  - Routes não utiliza controllers - lógica direta nas rotas
  - Use Case index deve terminar com 'UseCase'
  - Repository index deve terminar com 'Repository'

### 🔥 technical-skills
- **Total de problemas:** 25
- **Críticos:** 1 | **Altos:** 14
- **Principais problemas:**
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain
  - Estrutura use-cases ausente na camada application

### ⚠️ tickets
- **Total de problemas:** 14
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Estrutura services ausente na camada domain
  - Estrutura controllers ausente na camada application
  - Estrutura dto ausente na camada application

### 🔥 timecard
- **Total de problemas:** 26
- **Críticos:** 1 | **Altos:** 13
- **Principais problemas:**
  - Camada domain ausente no módulo timecard
  - Estrutura use-cases ausente na camada application
  - Estrutura dto ausente na camada application

### 📋 dashboard
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Repository contém possível lógica de negócio
  - Repository contém possível lógica de negócio

### 📋 custom-fields
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Use Case index deve terminar com 'UseCase'
  - Use Case index deve terminar com 'UseCase'

### 📋 field-layouts
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Use Case index deve terminar com 'UseCase'
  - Use Case index deve terminar com 'UseCase'

### 📋 people
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Use Case index deve terminar com 'UseCase'
  - Use Case index deve terminar com 'UseCase'

### 📋 tenant-admin
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Use Case index deve terminar com 'UseCase'
  - Use Case index deve terminar com 'UseCase'


## Plano de Correção

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
- **Tempo estimado:** 3h
- **Ações:** 3

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada application
3. **create_file:** Criar Repository com interface

### ⚠️ knowledge-base
- **Prioridade:** high
- **Tempo estimado:** 7h
- **Ações:** 12

1. **create_directory:** Criar diretório/arquivo events na camada domain
2. **create_directory:** Criar diretório/arquivo services na camada domain
3. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
4. **refactor_code:** Refatorar dependência inválida na camada application
5. **refactor_code:** Refatorar dependência inválida na camada application
6. **refactor_code:** Refatorar dependência inválida na camada application
7. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
8. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
9. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
10. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
11. **create_file:** Criar Repository com interface
12. **create_file:** Criar Repository com interface

### ⚠️ materials-services
- **Prioridade:** high
- **Tempo estimado:** 27h
- **Ações:** 43

1. **create_directory:** Criar diretório/arquivo repositories na camada domain
2. **create_directory:** Criar diretório/arquivo events na camada domain
3. **create_directory:** Criar diretório/arquivo services na camada domain
4. **create_directory:** Criar diretório/arquivo use-cases na camada application
5. **create_directory:** Criar diretório/arquivo dto na camada application
6. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
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
18. **refactor_code:** Refatorar dependência inválida na camada application
19. **refactor_code:** Refatorar dependência inválida na camada application
20. **refactor_code:** Refatorar dependência inválida na camada application
21. **refactor_code:** Refatorar dependência inválida na camada application
22. **refactor_code:** Refatorar dependência inválida na camada application
23. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
24. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
25. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
26. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
27. **rename_file:** Padronizar nomenclatura: Entity index não segue padrão PascalCase
28. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
29. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
30. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
31. **rename_file:** Padronizar nomenclatura: Repository LPUCacheWarmer deve terminar com 'Repository'
32. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
33. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
34. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
35. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
36. **create_file:** Criar Repository com interface
37. **create_file:** Criar Repository com interface
38. **create_file:** Criar Repository com interface
39. **create_file:** Criar Repository com interface
40. **create_file:** Criar Repository com interface
41. **create_file:** Criar Repository com interface
42. **create_file:** Criar Repository com interface
43. **create_file:** Criar Repository com interface

### ⚠️ saas-admin
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 5

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar estrutura da camada application
3. **create_directory:** Criar estrutura da camada infrastructure
4. **create_directory:** Criar controllers na camada Application e usar nas rotas
5. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados

### ⚠️ schedule-management
- **Prioridade:** high
- **Tempo estimado:** 4h
- **Ações:** 10

1. **create_directory:** Criar diretório/arquivo repositories na camada domain
2. **create_directory:** Criar diretório/arquivo events na camada domain
3. **create_directory:** Criar diretório/arquivo services na camada domain
4. **create_directory:** Criar diretório/arquivo use-cases na camada application
5. **create_directory:** Criar diretório/arquivo dto na camada application
6. **create_directory:** Criar diretório/arquivo services na camada application
7. **create_file:** Criar arquivo routes.ts para definir endpoints da API
8. **refactor_code:** Refatorar dependência inválida na camada application
9. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
10. **create_file:** Criar Repository com interface

### ⚠️ shared
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 6

1. **create_directory:** Criar controllers na camada Application e usar nas rotas
2. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'
3. **rename_file:** Padronizar nomenclatura: Repository index deve terminar com 'Repository'
4. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
5. **create_file:** Criar Repository com interface
6. **create_file:** Criar Repository com interface

### ⚠️ technical-skills
- **Prioridade:** high
- **Tempo estimado:** 5h
- **Ações:** 11

1. **create_directory:** Criar diretório/arquivo events na camada domain
2. **create_directory:** Criar diretório/arquivo services na camada domain
3. **create_directory:** Criar diretório/arquivo use-cases na camada application
4. **create_directory:** Criar diretório/arquivo dto na camada application
5. **create_directory:** Criar diretório/arquivo services na camada application
6. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
7. **refactor_code:** Refatorar dependência inválida na camada application
8. **refactor_code:** Refatorar dependência inválida na camada application
9. **rename_file:** Padronizar nomenclatura: Nome da classe SkillEntity não corresponde ao arquivo Skill
10. **rename_file:** Padronizar nomenclatura: Repository DrizzleUserSkillRepository_FIXED deve terminar com 'Repository'
11. **create_file:** Criar Repository com interface

### ⚠️ tickets
- **Prioridade:** high
- **Tempo estimado:** 3h
- **Ações:** 7

1. **create_directory:** Criar diretório/arquivo services na camada domain
2. **create_directory:** Criar diretório/arquivo controllers na camada application
3. **create_directory:** Criar diretório/arquivo dto na camada application
4. **create_directory:** Criar controllers na camada Application e usar nas rotas
5. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
6. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
7. **create_file:** Criar diretório controllers na camada Application

### ⚠️ timecard
- **Prioridade:** high
- **Tempo estimado:** 5h
- **Ações:** 9

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar diretório/arquivo use-cases na camada application
3. **create_directory:** Criar diretório/arquivo dto na camada application
4. **create_directory:** Criar diretório/arquivo services na camada application
5. **refactor_code:** Refatorar dependência inválida na camada application
6. **refactor_code:** Refatorar dependência inválida na camada application
7. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
8. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
9. **create_file:** Criar Repository com interface

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
Nenhuma ação imediata necessária

### Prioridade Alta ⚠️
- **auth:** 3 ações (2h)
- **beneficiaries:** 2 ações (1h)
- **customers:** 3 ações (3h)
- **knowledge-base:** 12 ações (7h)
- **materials-services:** 43 ações (27h)
- **saas-admin:** 5 ações (2h)
- **schedule-management:** 10 ações (4h)
- **shared:** 6 ações (2h)
- **technical-skills:** 11 ações (5h)
- **tickets:** 7 ações (3h)
- **timecard:** 9 ações (5h)

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
