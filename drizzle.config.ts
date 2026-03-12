import { defineConfig } from "drizzle-kit";
import { readFileSync } from "fs";
import { resolve } from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const ca = readFileSync(resolve(process.cwd(), "ca-certificate.crt")).toString();

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true, ca },
  },
});
