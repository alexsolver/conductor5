# Clean Architecture Validation Report

**Data:** 2025-08-09  
**Score:** 38/100  
**Status:** ❌ REPROVADO

## Resumo de Problemas

- 🔥 **Críticos:** 0
- ⚠️ **Altos:** 113
- 📋 **Médios:** 109
- 💡 **Baixos:** 4
- **Total:** 226

## Principais Problemas por Módulo

### 📋 auth
- **Total de problemas:** 9
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Estrutura repositories ausente na camada domain
  - Estrutura services ausente na camada domain
  - Estrutura use-cases ausente na camada application

### ⚠️ beneficiaries
- **Total de problemas:** 5
- **Críticos:** 0 | **Altos:** 4
- **Principais problemas:**
  - Camada domain ausente no módulo beneficiaries
  - Camada application ausente no módulo beneficiaries
  - Camada infrastructure ausente no módulo beneficiaries

### ⚠️ custom-fields
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 4
- **Principais problemas:**
  - Camada domain ausente no módulo custom-fields
  - Camada application ausente no módulo custom-fields
  - Camada infrastructure ausente no módulo custom-fields

### ⚠️ customers
- **Total de problemas:** 6
- **Críticos:** 0 | **Altos:** 5
- **Principais problemas:**
  - Estrutura services ausente na camada domain
  - Routes contém lógica de negócio ou acesso a dados
  - Application Layer violando dependência: express

### ⚠️ dashboard
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Camada domain ausente no módulo dashboard
  - Camada application ausente no módulo dashboard
  - Camada infrastructure ausente no módulo dashboard

### ⚠️ field-layout
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Camada domain ausente no módulo field-layout
  - Camada application ausente no módulo field-layout
  - Camada infrastructure ausente no módulo field-layout

### ⚠️ field-layouts
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Camada domain ausente no módulo field-layouts
  - Camada application ausente no módulo field-layouts
  - Camada infrastructure ausente no módulo field-layouts

### ⚠️ knowledge-base
- **Total de problemas:** 18
- **Críticos:** 0 | **Altos:** 10
- **Principais problemas:**
  - Camada domain ausente no módulo knowledge-base
  - Estrutura use-cases ausente na camada application
  - Estrutura dto ausente na camada application

### ⚠️ locations
- **Total de problemas:** 7
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Estrutura repositories ausente na camada domain
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain

### ⚠️ materials-services
- **Total de problemas:** 62
- **Críticos:** 0 | **Altos:** 37
- **Principais problemas:**
  - Estrutura repositories ausente na camada domain
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain

### ⚠️ notifications
- **Total de problemas:** 7
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Estrutura repositories ausente na camada domain
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain

### ⚠️ people
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Camada domain ausente no módulo people
  - Camada application ausente no módulo people
  - Camada infrastructure ausente no módulo people

### ⚠️ saas-admin
- **Total de problemas:** 5
- **Críticos:** 0 | **Altos:** 4
- **Principais problemas:**
  - Camada domain ausente no módulo saas-admin
  - Camada application ausente no módulo saas-admin
  - Camada infrastructure ausente no módulo saas-admin

### ⚠️ schedule-management
- **Total de problemas:** 12
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Estrutura repositories ausente na camada domain
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain

### 📋 shared
- **Total de problemas:** 10
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Estrutura entities ausente na camada domain
  - Estrutura repositories ausente na camada domain
  - Estrutura events ausente na camada domain

### ⚠️ technical-skills
- **Total de problemas:** 15
- **Críticos:** 0 | **Altos:** 7
- **Principais problemas:**
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain
  - Estrutura use-cases ausente na camada application

### ⚠️ template-audit
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Camada domain ausente no módulo template-audit
  - Camada application ausente no módulo template-audit
  - Camada infrastructure ausente no módulo template-audit

### ⚠️ template-hierarchy
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Camada domain ausente no módulo template-hierarchy
  - Camada application ausente no módulo template-hierarchy
  - Camada infrastructure ausente no módulo template-hierarchy

### ⚠️ template-versions
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Camada domain ausente no módulo template-versions
  - Camada application ausente no módulo template-versions
  - Camada infrastructure ausente no módulo template-versions

### ⚠️ tenant-admin
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Camada domain ausente no módulo tenant-admin
  - Camada application ausente no módulo tenant-admin
  - Camada infrastructure ausente no módulo tenant-admin

### ⚠️ ticket-history
- **Total de problemas:** 6
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain
  - Estrutura dto ausente na camada application

### ⚠️ ticket-templates
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Camada domain ausente no módulo ticket-templates
  - Camada application ausente no módulo ticket-templates
  - Camada infrastructure ausente no módulo ticket-templates

### ⚠️ tickets
- **Total de problemas:** 11
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Estrutura services ausente na camada domain
  - Estrutura controllers ausente na camada application
  - Estrutura dto ausente na camada application

### ⚠️ timecard
- **Total de problemas:** 13
- **Críticos:** 0 | **Altos:** 7
- **Principais problemas:**
  - Camada domain ausente no módulo timecard
  - Estrutura use-cases ausente na camada application
  - Estrutura dto ausente na camada application


## Plano de Correção

### ⚠️ beneficiaries
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 5

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar estrutura da camada application
3. **create_directory:** Criar estrutura da camada infrastructure
4. **create_directory:** Criar controllers na camada Application e usar nas rotas
5. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados

### ⚠️ custom-fields
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 4

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar estrutura da camada application
3. **create_directory:** Criar estrutura da camada infrastructure
4. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados

### ⚠️ customers
- **Prioridade:** high
- **Tempo estimado:** 4h
- **Ações:** 6

1. **create_directory:** Criar diretório/arquivo services na camada domain
2. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **refactor_code:** Refatorar dependência inválida na camada application
5. **create_file:** Criar Repository com interface
6. **create_file:** Criar Repository com interface

### ⚠️ dashboard
- **Prioridade:** high
- **Tempo estimado:** 40min
- **Ações:** 4

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar estrutura da camada application
3. **create_directory:** Criar estrutura da camada infrastructure
4. **create_directory:** Criar controllers na camada Application e usar nas rotas

### ⚠️ field-layout
- **Prioridade:** high
- **Tempo estimado:** 1h
- **Ações:** 4

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar estrutura da camada application
3. **create_directory:** Criar estrutura da camada infrastructure
4. **create_file:** Criar arquivo routes.ts para definir endpoints da API

### ⚠️ field-layouts
- **Prioridade:** high
- **Tempo estimado:** 40min
- **Ações:** 4

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar estrutura da camada application
3. **create_directory:** Criar estrutura da camada infrastructure
4. **create_directory:** Criar controllers na camada Application e usar nas rotas

### ⚠️ knowledge-base
- **Prioridade:** high
- **Tempo estimado:** 8h
- **Ações:** 13

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar diretório/arquivo use-cases na camada application
3. **create_directory:** Criar diretório/arquivo dto na camada application
4. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
5. **refactor_code:** Refatorar dependência inválida na camada application
6. **refactor_code:** Refatorar dependência inválida na camada application
7. **refactor_code:** Refatorar dependência inválida na camada application
8. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
9. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
10. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
11. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
12. **create_file:** Criar Repository com interface
13. **create_file:** Criar Repository com interface

### ⚠️ locations
- **Prioridade:** high
- **Tempo estimado:** 3h
- **Ações:** 7

1. **create_directory:** Criar diretório/arquivo repositories na camada domain
2. **create_directory:** Criar diretório/arquivo events na camada domain
3. **create_directory:** Criar diretório/arquivo services na camada domain
4. **create_directory:** Criar diretório/arquivo dto na camada application
5. **create_directory:** Criar diretório/arquivo services na camada application
6. **refactor_code:** Refatorar dependência inválida na camada application
7. **rename_file:** Padronizar nomenclatura: Nome da classe LocationEntity não corresponde ao arquivo Location

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

### ⚠️ notifications
- **Prioridade:** high
- **Tempo estimado:** 3h
- **Ações:** 7

1. **create_directory:** Criar diretório/arquivo repositories na camada domain
2. **create_directory:** Criar diretório/arquivo events na camada domain
3. **create_directory:** Criar diretório/arquivo services na camada domain
4. **create_directory:** Criar diretório/arquivo dto na camada application
5. **create_directory:** Criar diretório/arquivo services na camada application
6. **refactor_code:** Refatorar dependência inválida na camada application
7. **refactor_code:** Refatorar dependência inválida na camada application

### ⚠️ people
- **Prioridade:** high
- **Tempo estimado:** 40min
- **Ações:** 4

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar estrutura da camada application
3. **create_directory:** Criar estrutura da camada infrastructure
4. **create_directory:** Criar controllers na camada Application e usar nas rotas

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

### ⚠️ template-audit
- **Prioridade:** high
- **Tempo estimado:** 1h
- **Ações:** 4

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar estrutura da camada application
3. **create_directory:** Criar estrutura da camada infrastructure
4. **create_file:** Criar arquivo routes.ts para definir endpoints da API

### ⚠️ template-hierarchy
- **Prioridade:** high
- **Tempo estimado:** 1h
- **Ações:** 4

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar estrutura da camada application
3. **create_directory:** Criar estrutura da camada infrastructure
4. **create_file:** Criar arquivo routes.ts para definir endpoints da API

### ⚠️ template-versions
- **Prioridade:** high
- **Tempo estimado:** 1h
- **Ações:** 4

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar estrutura da camada application
3. **create_directory:** Criar estrutura da camada infrastructure
4. **create_file:** Criar arquivo routes.ts para definir endpoints da API

### ⚠️ tenant-admin
- **Prioridade:** high
- **Tempo estimado:** 40min
- **Ações:** 4

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar estrutura da camada application
3. **create_directory:** Criar estrutura da camada infrastructure
4. **create_directory:** Criar controllers na camada Application e usar nas rotas

### ⚠️ ticket-history
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 6

1. **create_directory:** Criar diretório/arquivo events na camada domain
2. **create_directory:** Criar diretório/arquivo services na camada domain
3. **create_directory:** Criar diretório/arquivo dto na camada application
4. **create_directory:** Criar diretório/arquivo services na camada application
5. **refactor_code:** Refatorar dependência inválida na camada application
6. **rename_file:** Padronizar nomenclatura: Nome da classe TicketHistoryEntity não corresponde ao arquivo TicketHistory

### ⚠️ ticket-templates
- **Prioridade:** high
- **Tempo estimado:** 1h
- **Ações:** 4

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar estrutura da camada application
3. **create_directory:** Criar estrutura da camada infrastructure
4. **create_file:** Criar arquivo routes.ts para definir endpoints da API

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

### 📋 auth
- **Prioridade:** medium
- **Tempo estimado:** 3h
- **Ações:** 9

1. **create_directory:** Criar diretório/arquivo repositories na camada domain
2. **create_directory:** Criar diretório/arquivo services na camada domain
3. **create_directory:** Criar diretório/arquivo use-cases na camada application
4. **create_directory:** Criar diretório/arquivo controllers na camada application
5. **create_directory:** Criar diretório/arquivo dto na camada application
6. **create_directory:** Criar diretório/arquivo services na camada application
7. **create_directory:** Criar controllers na camada Application e usar nas rotas
8. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
9. **create_file:** Criar diretório controllers na camada Application

### 📋 shared
- **Prioridade:** medium
- **Tempo estimado:** 2h
- **Ações:** 10

1. **create_directory:** Criar diretório/arquivo entities na camada domain
2. **create_directory:** Criar diretório/arquivo repositories na camada domain
3. **create_directory:** Criar diretório/arquivo events na camada domain
4. **create_directory:** Criar diretório/arquivo services na camada domain
5. **create_directory:** Criar diretório/arquivo use-cases na camada application
6. **create_directory:** Criar diretório/arquivo controllers na camada application
7. **create_directory:** Criar diretório/arquivo dto na camada application
8. **create_directory:** Criar diretório/arquivo services na camada application
9. **create_directory:** Criar diretório/arquivo repositories na camada infrastructure
10. **create_file:** Criar arquivo routes.ts para definir endpoints da API


## Recomendações

### Prioridade Imediata 🔥
Nenhuma ação imediata necessária

### Prioridade Alta ⚠️
- **beneficiaries:** 5 ações (2h)
- **custom-fields:** 4 ações (2h)
- **customers:** 6 ações (4h)
- **dashboard:** 4 ações (40min)
- **field-layout:** 4 ações (1h)
- **field-layouts:** 4 ações (40min)
- **knowledge-base:** 13 ações (8h)
- **locations:** 7 ações (3h)
- **materials-services:** 43 ações (27h)
- **notifications:** 7 ações (3h)
- **people:** 4 ações (40min)
- **saas-admin:** 5 ações (2h)
- **schedule-management:** 10 ações (4h)
- **technical-skills:** 11 ações (5h)
- **template-audit:** 4 ações (1h)
- **template-hierarchy:** 4 ações (1h)
- **template-versions:** 4 ações (1h)
- **tenant-admin:** 4 ações (40min)
- **ticket-history:** 6 ações (2h)
- **ticket-templates:** 4 ações (1h)
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
