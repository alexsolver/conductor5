import fs from "fs";
import { Client } from "pg";
import { parse } from "pgsql-ast-parser";

interface SchemaMap {
  [table: string]: {
    [column: string]: string;
  };
}

// ==============================
// 1. Ler e parsear scriptzão
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
// 2. Formatar DEFAULT
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
// 3. Gerar ALTER TABLE em texto
// ==============================
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function syncSchema(schemaName: string, output: string[]) {
  for (const [table, cols] of Object.entries(schemaMap)) {
    const tblCheck = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
      [schemaName, table]
    );
    if (tblCheck.rowCount === 0) continue;

    const existingColsRes = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
      [schemaName, table]
    );
    const existingCols = existingColsRes.rows.map(r => r.column_name);

    for (const [col, def] of Object.entries(cols)) {
      if (!existingCols.includes(col)) {
        const alter = `ALTER TABLE "${schemaName}"."${table}" ADD COLUMN "${col}" ${def};`;
        output.push(alter);
      }
    }
  }
}

async function run() {
  await client.connect();

  const output: string[] = [];

  const schemasRes = await client.query(
    `SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog','information_schema','public')`
  );

  for (const row of schemasRes.rows) {
    output.push(`-- ========================`);
    output.push(`-- Schema: ${row.schema_name}`);
    output.push(`-- ========================\n`);
    await syncSchema(row.schema_name, output);
    output.push("");
  }

  fs.writeFileSync("schema_diff.sql", output.join("\n"), "utf8");
  console.log("✅ Arquivo schema_diff.sql gerado com sucesso!");

  await client.end();
}

run().catch(console.error);
