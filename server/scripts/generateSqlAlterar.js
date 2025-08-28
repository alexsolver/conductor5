import fs from "fs";
import { Client } from "pg";
import { parse } from "pgsql-ast-parser";

interface SchemaMap {
  [table: string]: {
    [column: string]: string;
  };
}

// ==============================
// 1. Ler scriptzão e parsear
// ==============================
const sql = fs.readFileSync("./migrations/pg-migrations/tenant/001_create_tenant_tables.sql", "utf8");
const ast = parse(sql);
const schemaMap: SchemaMap = {};

for (const stmt of ast) {
  if (stmt.type === "create table") {
    const table = stmt.name.name;
    schemaMap[table] = {};

    for (const col of stmt.columns ?? []) {
      const colName = col.name.name;

      let defParts: string[] = [];

      if (col.dataType) {
        defParts.push(col.dataType.name);
      }
      if (col.constraints?.some(c => c.type === "not null")) {
        defParts.push("NOT NULL");
      }

      const defConstraint = col.constraints?.find(c => c.type === "default");
      if (defConstraint && defConstraint.default) {
        defParts.push("DEFAULT " + formatDefault(defConstraint.default));
      }

      const refConstraint = col.constraints?.find(c => c.type === "references");
      if (refConstraint) {
        defParts.push(
          `REFERENCES ${refConstraint.foreignTable.name}(${refConstraint.foreignColumns
            .map(c => c.name)
            .join(",")})`
        );
        if (refConstraint.onDelete) {
          defParts.push("ON DELETE " + refConstraint.onDelete.toUpperCase());
        }
      }

      schemaMap[table][colName] = defParts.join(" ");
    }
  }
}

// ==============================
// 2. Função para formatar DEFAULT
// ==============================
function formatDefault(def: any): string {
  if (def.kind === "string") return `'${def.value}'`;
  if (def.kind === "numeric") return def.value;
  if (def.kind === "identifier") return def.name;
  if (def.kind === "call") return `${def.function.name}(${def.args.map(formatDefault).join(",")})`;
  if (def.kind === "binary") return `${formatDefault(def.left)} ${def.op} ${formatDefault(def.right)}`;
  return JSON.stringify(def);
}

// ==============================
// 3. Conectar no banco
// ==============================
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function syncSchema(schemaName: string) {
  for (const [table, cols] of Object.entries(schemaMap)) {
    // checar se tabela existe nesse schema
    const tblCheck = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
      [schemaName, table]
    );
    if (tblCheck.rowCount === 0) continue;

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
        await client.query(alter);
        console.log("✅ Executado em", schemaName, table, col);
      }
    }
  }
}

async function run() {
  await client.connect();

  const schemasRes = await client.query(
    `SELECT schema_name 
     FROM information_schema.schemata 
     WHERE schema_name LIKE 'tenant_%'`
  );

  for (const row of schemasRes.rows) {
    console.log("\n🔹 Processando schema:", row.schema_name);
    await syncSchema(row.schema_name);
  }

  await client.end();
  console.log("\n🎉 Sincronização concluída!");
}

run().catch(console.error);
