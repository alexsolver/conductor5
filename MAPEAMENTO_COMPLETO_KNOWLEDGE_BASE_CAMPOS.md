
# MAPEAMENTO COMPLETO - KNOWLEDGE BASE CAMPOS

## 🎯 PROBLEMA IDENTIFICADO
O erro persistente indica que existe referência ao campo `summary` que **NÃO EXISTE** no banco de dados.

## 📋 MAPEAMENTO FRONTEND → DOMAIN → SCHEMA → BANCO

### 1. FRONTEND (client/src/components/KnowledgeBaseTicketTab.tsx)
```typescript
interface KnowledgeBaseArticle {
  id: string;
  title: string;
  summary?: string;          // ❌ PROBLEMA: Campo opcional no frontend
  category: string;
  tags: string[];
  status: string;
  visibility: string;
  viewCount: number;
  upvoteCount: number;
  downvoteCount: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2. DOMAIN ENTITY (server/modules/knowledge-base/domain/entities/KnowledgeBase.ts)
```typescript
export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;          // ❌ PROBLEMA: Campo opcional na entidade
  category: string;
  tags: string[];
  // ... outros campos
}
```

### 3. SCHEMA ORM (shared/schema-knowledge-base.ts)
```typescript
export const knowledgeBaseArticles = pgTable("knowledge_base_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"),
  // ❌ SUMMARY NÃO ESTÁ DEFINIDO NO SCHEMA!
  slug: varchar("slug", { length: 500 }),
  category: knowledgeBaseCategoryEnum("category").notNull(),
  tags: jsonb("tags").$type<string[]>(),
  // ... outros campos
});
```

### 4. BANCO DE DADOS (PostgreSQL)
```sql
-- Colunas que EXISTEM no banco:
id, tenant_id, title, content, slug, category, tags, author_id, 
status, visibility, published_at, created_at, updated_at, view_count
-- ❌ SUMMARY NÃO EXISTE NO BANCO!
```

## 🔧 CORREÇÕES NECESSÁRIAS

### OPÇÃO 1: REMOVER SUMMARY COMPLETAMENTE
- Remover do frontend
- Remover da entidade domain
- Remover do repositório
- Usar content.substring() quando necessário

### OPÇÃO 2: ADICIONAR SUMMARY AO BANCO
- Adicionar coluna summary à tabela
- Atualizar schema Drizzle
- Manter interfaces existentes

## 🚨 ARQUIVOS COM REFERÊNCIAS AO SUMMARY
1. server/modules/knowledge-base/domain/entities/KnowledgeBase.ts
2. client/src/components/KnowledgeBaseTicketTab.tsx
3. server/modules/knowledge-base/infrastructure/repositories/DrizzleKnowledgeBaseRepository.ts
4. server/modules/knowledge-base/application/use-cases/CreateKnowledgeBaseArticleUseCase.ts

## ✅ SOLUÇÃO RECOMENDADA: OPÇÃO 1 (REMOVER SUMMARY)
Vamos remover todas as referências ao campo `summary` e usar `content.substring()` quando necessário.
