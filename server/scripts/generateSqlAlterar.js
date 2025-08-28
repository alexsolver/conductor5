const fs = require("fs");
const { Client } = require("pg");

console.log("🔧 [GENERATE-SQL-ALTERAR] Iniciando script simples...");

// Verificar se o arquivo existe
const schemaFile = "./migrations/pg-migrations/tenant/001_create_tenant_tables.sql";

if (!fs.existsSync(schemaFile)) {
  console.error("❌ Arquivo não encontrado:", schemaFile);
  console.log("📁 Conteúdo do diretório migrations:");
  try {
    const files = fs.readdirSync("./migrations/pg-migrations/tenant/");
    console.log(files);
  } catch (err) {
    console.error("Erro ao listar diretório:", err.message);
  }
  process.exit(1);
}

console.log("✅ Arquivo encontrado:", schemaFile);

// Ler arquivo
let sql;
try {
  sql = fs.readFileSync(schemaFile, "utf8");
  console.log("✅ Arquivo lido com sucesso");
  console.log("📄 Primeiras 200 chars:", sql.substring(0, 200));
} catch (error) {
  console.error("❌ Erro ao ler arquivo:", error.message);
  process.exit(1);
}

// Parser simples para extrair CREATE TABLE
function extractTables(sqlContent) {
  const tables = {};

  // Regex para encontrar CREATE TABLE
  const tableMatches = sqlContent.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\);/gi);

  if (!tableMatches) {
    console.log("⚠️ Nenhuma tabela CREATE TABLE encontrada");
    return tables;
  }

  console.log(`📊 Encontradas ${tableMatches.length} tabelas`);

  tableMatches.forEach(match => {
    const nameMatch = match.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
    if (nameMatch) {
      const tableName = nameMatch[1];
      tables[tableName] = { found: true };
      console.log(`🔍 Tabela encontrada: ${tableName}`);
    }
  });

  return tables;
}

const schemaMap = extractTables(sql);
console.log("✅ Schema parseado:", Object.keys(schemaMap));

// Conectar no banco se houver variável de ambiente
if (!process.env.DATABASE_URL) {
  console.log("⚠️ DATABASE_URL não configurada, apenas validando arquivo");
  console.log("🎉 Validação do arquivo SQL concluída com sucesso!");
  process.exit(0);
}

// Se chegou aqui, tenta conectar no banco
const client = new Client({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function run() {
  try {
    console.log("🔄 Conectando ao banco...");
    await client.connect();
    console.log("✅ Conectado ao banco");

    // Buscar schemas tenant
    const schemasRes = await client.query(
      `SELECT schema_name 
       FROM information_schema.schemata 
       WHERE schema_name LIKE 'tenant_%'`
    );

    console.log(`🔍 Encontrados ${schemasRes.rows.length} schemas tenant`);

    if (schemasRes.rows.length === 0) {
      console.log("⚠️ Nenhum schema tenant encontrado");
      return;
    }

    // Para cada schema, mostrar as tabelas existentes
    for (const row of schemasRes.rows) {
      const schemaName = row.schema_name;
      console.log(`\n🔹 Schema: ${schemaName}`);

      const tablesRes = await client.query(
        `SELECT table_name 
         FROM information_schema.tables 
         WHERE table_schema = $1`,
        [schemaName]
      );

      console.log(`  📋 Tabelas existentes: ${tablesRes.rows.map(r => r.table_name).join(', ')}`);
    }

    console.log("\n🎉 Análise concluída!");
  } catch (error) {
    console.error("❌ Erro durante execução:", error.message);
  } finally {
    try {
      await client.end();
      console.log("✅ Conexão fechada");
    } catch (error) {
      console.log("⚠️ Erro ao fechar conexão:", error.message);
    }
  }
}

run();