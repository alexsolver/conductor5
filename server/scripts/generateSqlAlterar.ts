
import fs from "fs";
import { Client } from "pg";

interface SchemaMap {
  [table: string]: {
    [column: string]: string;
  };
}

// ==============================
// 1. Ler scriptzão e parsear
// ==============================

let schemaMap: SchemaMap = {};

try {
  const sql = fs.readFileSync("./migrations/pg-migrations/tenant/001_create_tenant_tables.sql", "utf8");
  
  // Simple SQL parsing approach - extract CREATE TABLE statements
  const createTableRegex = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([^\s(]+)\s*\(([\s\S]*?)\);/gi;
  let match;

  while ((match = createTableRegex.exec(sql)) !== null) {
    const tableName = match[1].replace(/"/g, ''); // Remove quotes
    const columnsText = match[2];
    
    schemaMap[tableName] = {};
    
    // Parse columns
    const lines = columnsText.split(',');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('CONSTRAINT') && !trimmedLine.startsWith('PRIMARY KEY') && !trimmedLine.startsWith('FOREIGN KEY')) {
        const parts = trimmedLine.split(/\s+/);
        if (parts.length >= 2) {
          const colName = parts[0].replace(/"/g, '');
          const colType = parts.slice(1).join(' ');
          schemaMap[tableName][colName] = colType;
        }
      }
    }
  }
} catch (error) {
  console.error('Error parsing SQL file:', error);
  process.exit(1);
}

// ==============================
// 2. Conectar no banco
// ==============================
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function syncSchema(schemaName: string) {
  console.log(`\n🔹 Processando schema: ${schemaName}`);
  
  for (const [table, cols] of Object.entries(schemaMap)) {
    try {
      // checar se tabela existe nesse schema
      const tblCheck = await client.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
        [schemaName, table]
      );
      
      if (tblCheck.rowCount === 0) {
        console.log(`⚠️  Tabela ${table} não encontrada no schema ${schemaName}`);
        continue;
      }

      // colunas existentes
      const existingColsRes = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
        [schemaName, table]
      );
      const existingCols = existingColsRes.rows.map(r => r.column_name);

      for (const [col, def] of Object.entries(cols)) {
        if (!existingCols.includes(col)) {
          const alter = `ALTER TABLE "${schemaName}"."${table}" ADD COLUMN "${col}" ${def};`;
          console.log("▶", alter);
          
          try {
            await client.query(alter);
            console.log("✅ Executado em", schemaName, table, col);
          } catch (alterError) {
            console.error("❌ Erro ao executar:", alter);
            console.error(alterError);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Erro processando tabela ${table} no schema ${schemaName}:`, error);
    }
  }
}

async function run() {
  try {
    await client.connect();
    console.log("🔗 Conectado ao banco de dados");

    const schemasRes = await client.query(
      `SELECT schema_name 
       FROM information_schema.schemata 
       WHERE schema_name LIKE 'tenant_%'`
    );

    console.log(`📊 Encontrados ${schemasRes.rows.length} schemas tenant`);

    for (const row of schemasRes.rows) {
      await syncSchema(row.schema_name);
    }

    await client.end();
    console.log("\n🎉 Sincronização concluída!");
  } catch (error) {
    console.error("❌ Erro durante execução:", error);
    await client.end();
    process.exit(1);
  }
}

run().catch(console.error);
