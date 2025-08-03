# Plano de Padronização de Nomenclatura: Favorecidos → Beneficiários

## Problema Identificado
Sistema usando nomenclatura mista "favorecidos" vs "beneficiary" causando inconsistências críticas no fullstack.

## Decisão de Padronização
**ADOTAR: "beneficiários" em português / "beneficiaries" em inglês**

## Inconsistências a Corrigir

### 1. Backend - Schema e Rotas
- ❌ `favorecidos` (tabela) → ✅ `beneficiaries` 
- ❌ `/api/favorecidos` → ✅ `/api/beneficiaries`
- ❌ `getFavorecidos()` → ✅ `getBeneficiaries()`
- ❌ `createFavorecido()` → ✅ `createBeneficiary()`

### 2. Frontend - Componentes e Variáveis
- ❌ `FilteredBeneficiarySelect` (correto, manter)
- ❌ Páginas usando `/api/favorecidos` → ✅ `/api/beneficiaries`
- ❌ Variáveis `favorecidos` → ✅ `beneficiaries`

### 3. Database Schema
- ❌ Tabela `favorecidos` → ✅ `beneficiaries`
- ❌ Colunas com `favorecido_id` → ✅ `beneficiary_id`

## Plano de Execução

### Fase 1: Backend Storage
1. Renomear métodos em storage.ts
2. Atualizar rotas para usar apenas `/api/beneficiaries`
3. Remover rotas duplicadas `/api/favorecidos`

### Fase 2: Database Migration
1. Renomear tabela `favorecidos` → `beneficiaries`
2. Atualizar referências de FK em tickets

### Fase 3: Frontend Updates
1. Atualizar todos os endpoints para `/api/beneficiaries`
2. Padronizar variáveis para `beneficiaries`
3. Atualizar labels UI para "Beneficiário"

### Fase 4: Schema Consistency
1. Atualizar shared/schema.ts
2. Corrigir tipos TypeScript
3. Validar integridade das relações

## Status de Execução
- [ ] Fase 1: Backend Storage
- [ ] Fase 2: Database Migration  
- [ ] Fase 3: Frontend Updates
- [ ] Fase 4: Schema Consistency