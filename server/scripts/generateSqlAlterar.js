import fs from "fs";
import { Client } from "pg";
import { parse } from "pgsql-ast-parser";

// ==============================
// Funções auxiliares
// ==============================
function formatDefault(def) {
  if (!def) return "";
  if (def.kind === "string") return `'${def.value}'`;
  if (def.kind === "numeric") return def.value;
  if (def.kind === "identifier") return def.name;
  if (def.kind === "call")
    return `${def.function.name}(${def.args.map(formatDefault).join(",")})`;
  if (def.kind === "binary")
    return `${formatDefault(def.left)} ${def.op} ${formatDefault(def.right)}`;
  if (def.kind === "cast") {
    return `${formatDefault(def.operand)}::${def.to}`;
  }
  return String(def.value || def.name || def);
}


// regex para pegar "coluna tipo" direto do SQL original
function splitColumnsSafe(body) {
  let parts = [];
  let current = "";
  let depth = 0;

  for (let char of body) {
    if (char === "(") {
      depth++;
      current += char;
    } else if (char === ")") {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function regexColumnType(tableName, colName, fullSql) {
  const regex = new RegExp(
    `CREATE TABLE[^;]*${tableName}[^;]*\\(([^;]*)\\)`,
    "is"
  );
  const match = fullSql.match(regex);
  if (!match) return null;

  const body = match[1];
  const colDefs = splitColumnsSafe(body);

  for (let def of colDefs) {
    // ignora constraints gerais
    if (/^(CONSTRAINT|PRIMARY KEY|FOREIGN KEY)/i.test(def)) continue;

    if (
      def.startsWith(`"${colName}"`) ||
      def.startsWith(colName)
    ) {
      // remove o nome da coluna
      return def.replace(/^"?(?:\w+)"?\s+/, "");
    }
  }

  return null;
}

function stripComments(sql) {
  return sql
    // remove comentários de bloco /* ... */
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // remove comentários de linha --
    .replace(/--.*$/gm, "")
    .trim();
}



function buildSchemaMap(sql) {
  // só parseia CREATE TABLE
  sql = stripComments(sql);
  const onlyTablesSql = sql
    .split(";")
    .filter((stmt) => stmt.trim().toUpperCase().startsWith("CREATE TABLE"))
    .join(";");

  const ast = parse(onlyTablesSql);
  const schemaMap = {};

  for (const stmt of ast) {
    if (stmt.type === "create table") {
      const table = stmt.name.name;
      schemaMap[table] = {};

      for (const col of stmt.columns ?? []) {
        const colName = col.name.name;
        let defParts = [];

        // tenta pegar pelo parser
        if (col.dataType && col.dataType.kind === "named type") {
          const typeName =
            typeof col.dataType.name === "string"
              ? col.dataType.name
              : col.dataType.name.name;
          defParts.push(typeName.toUpperCase());

          if (col.dataType.args?.length) {
            defParts.push(
              "(" + col.dataType.args.map((a) => a.value).join(",") + ")"
            );
          }
        }

        // NOT NULL
        if (col.constraints?.some((c) => c.type === "not null")) {
          defParts.push("NOT NULL");
        }

        // DEFAULT
        const defConstraint = col.constraints?.find(
          (c) => c.type === "default"
        );
        if (defConstraint?.default) {
          defParts.push("DEFAULT " + formatDefault(defConstraint.default));
        }

        // REFERENCES
        const refConstraint = col.constraints?.find(
          (c) => c.type === "references"
        );
        if (refConstraint) {
          defParts.push(
            `REFERENCES ${refConstraint.foreignTable.name}(${refConstraint.foreignColumns
              .map((c) => c.name)
              .join(",")})`
          );
          if (refConstraint.onDelete) {
            defParts.push("ON DELETE " + refConstraint.onDelete.toUpperCase());
          }
        }

        // fallback: se não detectou tipo
        if (defParts.length === 0) {
            let fallback = regexColumnType(table, colName, sql);

            if (fallback) {
                console.warn(
                `⚠️ [Fallback regex] Coluna ${colName} em ${table} -> ${fallback}`
                );
                defParts.push(fallback);
            } else {
                // fallback final baseado no nome da coluna
                if (colName === "id" || colName.endsWith("_id")) {
                    fallback = "UUID";
                } else if (colName.includes("date") || colName.endsWith("_at")) {
                    fallback = "TIMESTAMP";
                } else if (colName.startsWith("is_") || colName.startsWith("has_")) {
                    fallback = "BOOLEAN";
                } else {
                    fallback = "TEXT";
                }

                console.warn(
                    `⚠️ [Fallback FINAL] Coluna ${colName} em ${table} sem tipo detectado, assumindo: ${fallback}`
                );

                defParts.push(fallback);

                // adiciona default pra boolean
                if (fallback === "BOOLEAN") {
                    defParts.push("DEFAULT false");
                }
            }
        }


        schemaMap[table][colName] = defParts.join(" ");
      }
    }
  }

  return schemaMap;
}

async function syncSchema(schemaName, client, schemaMap) {
  console.log(`\n🔹 Processando schema: ${schemaName}`);

  for (const [table, cols] of Object.entries(schemaMap)) {
    try {
      const tblCheck = await client.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
        [schemaName, table]
      );
      if (tblCheck.rowCount === 0) continue;

      const existingColsRes = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
        [schemaName, table]
      );
      const existingCols = existingColsRes.rows.map((r) => r.column_name);

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
      console.error(
        `❌ Erro processando tabela ${table} no schema ${schemaName}:`,
        error
      );
    }
  }
}

async function main() {
  console.log("🔧 Iniciando geração de SQL ALTER...");

  const migrationPath =
    "./server/migrations/pg-migrations/tenant/001_create_tenant_tables.sql";
  const sql = fs.readFileSync(migrationPath, "utf8");
  const schemaMap = buildSchemaMap(sql);

  console.log(
    `✅ Parsed ${Object.keys(schemaMap).length} tabelas do arquivo de migração`
  );

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  console.log("🔗 Conectado ao banco de dados");

  const schemasRes = await client.query(
    `SELECT schema_name
     FROM information_schema.schemata
     WHERE schema_name LIKE 'tenant_%'`
  );

  console.log(`📊 Encontrados ${schemasRes.rows.length} schemas tenant`);

  for (const row of schemasRes.rows) {
    await syncSchema(row.schema_name, client, schemaMap);
  }

  await client.end();
  console.log("\n🎉 Sincronização concluída!");
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
