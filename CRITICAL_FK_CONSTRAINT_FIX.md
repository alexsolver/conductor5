# 🚨 CORREÇÃO CRÍTICA: FK Constraint Violation

## PROBLEMA IDENTIFICADO
**Error**: `insert or update on table "tickets" violates foreign key constraint "tickets_beneficiary_id_fkey"`

**ROOT CAUSE**: 
- Frontend está enviando `customer.id` como `beneficiary_id`
- Schema define `beneficiaryId` referenciando `favorecidos.id`
- Incompatibilidade entre tipo de entidade enviada vs esperada

## ANÁLISE TÉCNICA

### Schema Atual (schema-master.ts):
```typescript
// TICKETS TABLE - Line 249
beneficiaryId: uuid("beneficiary_id").references(() => favorecidos.id),
```

### Frontend Envio:
```json
{
  "caller_id": "c1ab5232-3e1c-4277-b4e7-1fcfa6b379d8",      // ✅ customer.id
  "beneficiary_id": "c1ab5232-3e1c-4277-b4e7-1fcfa6b379d8"  // ❌ customer.id sendo usado como favorecido.id
}
```

## CORREÇÕES NECESSÁRIAS

### 1. Validação Frontend
O frontend precisa:
- Distinguir entre `customer.id` e `favorecido.id`
- Enviar IDs corretos baseados na seleção do usuário
- Validar se beneficiary selecionado é um favorecido válido

### 2. Schema Consistency
Verificar se:
- Tabela `favorecidos` existe em todos os tenants
- FKs estão criados corretamente
- Relacionamentos customer → favorecido estão mapeados

### 3. Database Push
```bash
npm run db:push
```

## IMPACTO

**CRÍTICO**: 
- Ticket updates falhando em produção
- Usuários não conseguem salvar alterações em tickets
- Sistema de beneficiários comprometido

## STATUS
- ⚠️ **ERRO DETECTADO**: FK constraint violation
- 🔧 **CORREÇÃO PENDENTE**: Schema push + frontend validation
- 📊 **PRIORIDADE**: CRÍTICA (bloqueia funcionalidade core)