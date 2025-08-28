
const fs = require("fs");
const { Client } = require("pg");

// Função simples para parsear CREATE TABLE do SQL
function parseCreateTable(sql) {
  const schemaMap = {};
  
  // Remove comentários
  const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Regex para encontrar CREATE TABLE
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)["`]?\s*\(\s*([\s\S]*?)\s*\);/gi;
  
  let match;
  while ((match = tableRegex.exec(cleanSql)) !== null) {
    const tableName = match[1];
    const columnsSection = match[2];
    
    schemaMap[tableName] = {};
    
    // Parse colunas - regex simplificada
    const columnLines = columnsSection.split(',').map(line => line.trim());
    
    for (const line of columnLines) {
      // Pula constraints e outras linhas que não são colunas
      if (line.toUpperCase().includes('CONSTRAINT') || 
          line.toUpperCase().includes('PRIMARY KEY') ||
          line.toUpperCase().includes('FOREIGN KEY') ||
          line.toUpperCase().includes('UNIQUE') ||
          line.toUpperCase().includes('CHECK') ||
          line.trim() === '') {
        continue;
      }
      
      // Extrai nome da coluna e tipo
      const columnMatch = line.match(/^["`]?(\w+)["`]?\s+(\w+(?:\([^)]*\))?)/);
      if (columnMatch) {
        const columnName = columnMatch[1];
        let columnDef = columnMatch[2];
        
        // Adiciona NOT NULL se presente
        if (line.toUpperCase().includes('NOT NULL')) {
          columnDef += ' NOT NULL';
        }
        
        // Adiciona DEFAULT se presente
        const defaultMatch = line.match(/DEFAULT\s+([^,\s]+(?:\([^)]*\))?)/i);
        if (defaultMatch) {
          columnDef += ` DEFAULT ${defaultMatch[1]}`;
        }
        
        schemaMap[tableName][columnName] = columnDef;
      }
    }
  }
  
  return schemaMap;
}

// ==============================
// 1. Ler e parsear o arquivo SQL
// ==============================
console.log("🔧 [GENERATE-SQL-ALTERAR] Iniciando script...");

let sql;
try {
  sql = fs.readFileSync("./migrations/pg-migrations/tenant/001_create_tenant_tables.sql", "utf8");
  console.log("✅ [GENERATE-SQL-ALTERAR] Arquivo SQL lido com sucesso");
} catch (error) {
  console.error("❌ [GENERATE-SQL-ALTERAR] Erro ao ler arquivo SQL:", error.message);
  process.exit(1);
}

const schemaMap = parseCreateTable(sql);
console.log("✅ [GENERATE-SQL-ALTERAR] Schema parseado:", Object.keys(schemaMap));

// ==============================
// 2. Conectar no banco
// ==============================
const client = new Client({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function syncSchema(schemaName) {
  console.log(`\n🔹 Processando schema: ${schemaName}`);
  
  for (const [table, cols] of Object.entries(schemaMap)) {
    try {
      // Checar se tabela existe nesse schema
      const tblCheck = await client.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
        [schemaName, table]
      );
      
      if (tblCheck.rowCount === 0) {
        console.log(`⚠️ Tabela ${table} não existe no schema ${schemaName}, pulando...`);
        continue;
      }

      // Obter colunas existentes
      const existingColsRes = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
        [schemaName, table]
      );
      const existingCols = existingColsRes.rows.map(r => r.column_name);

      // Adicionar colunas faltantes
      for (const [col, def] of Object.entries(cols)) {
        if (!existingCols.includes(col)) {
          const alter = `ALTER TABLE "${schemaName}"."${table}" ADD COLUMN "${col}" ${def};`;
          console.log("▶", alter);
          
          try {
            await client.query(alter);
            console.log(`✅ Coluna ${col} adicionada em ${schemaName}.${table}`);
          } catch (alterError) {
            console.log(`❌ Erro ao adicionar coluna ${col}: ${alterError.message}`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Erro ao processar tabela ${table}: ${error.message}`);
    }
  }
}

async function run() {
  try {
    console.log("🔄 [GENERATE-SQL-ALTERAR] Conectando ao banco...");
    await client.connect();
    console.log("✅ [GENERATE-SQL-ALTERAR] Conectado ao banco");

    // Buscar schemas tenant
    const schemasRes = await client.query(
      `SELECT schema_name 
       FROM information_schema.schemata 
       WHERE schema_name LIKE 'tenant_%'`
    );

    console.log(`🔍 [GENERATE-SQL-ALTERAR] Encontrados ${schemasRes.rows.length} schemas tenant`);

    if (schemasRes.rows.length === 0) {
      console.log("⚠️ Nenhum schema tenant encontrado");
      return;
    }

    for (const row of schemasRes.rows) {
      await syncSchema(row.schema_name);
    }

    console.log("\n🎉 Sincronização concluída!");
  } catch (error) {
    console.error("❌ [GENERATE-SQL-ALTERAR] Erro durante execução:", error.message);
  } finally {
    try {
      await client.end();
      console.log("✅ [GENERATE-SQL-ALTERAR] Conexão fechada");
    } catch (error) {
      console.log("⚠️ Erro ao fechar conexão:", error.message);
    }
  }
}

run();
