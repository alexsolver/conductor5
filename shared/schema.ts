/**
 * SCHEMA PROXY - FONTE ÚNICA DE VERDADE
 * 
 * Este arquivo é apenas um proxy que re-exporta o schema master.
 * TODAS as definições estão em schema-master.ts
 * 
 * ARQUITETURA CONSOLIDADA:
 * ✅ shared/schema-master.ts - Fonte única autoritativa
 * ✅ shared/schema.ts - Proxy de re-export (este arquivo)
 * ✅ server/db.ts - Validação alinhada com schema real
 */

export * from './schema-master';
// Note: Other schema files have overlapping exports, importing only master for now
// export * from './schema-multilocation';
// export * from './schema-materials-services';
// export * from './schema-knowledge-base';