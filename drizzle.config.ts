
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./server/migrations/pg-migrations/drizzle",
  schema: ["./shared/schema.ts", "./shared/schema-tenant.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  schemaFilter: ["public", "tenant_*"],
});
