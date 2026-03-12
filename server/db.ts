import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { readFileSync } from "fs";
import { resolve } from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const ca = readFileSync(resolve(process.cwd(), "ca-certificate.crt")).toString();
const connStr = process.env.DATABASE_URL!.replace(/[?&]sslmode=[^&]*/g, '').replace(/[?&]$/, '').replace(/\?$/, '');
const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: true, ca } });
export const db = drizzle(pool, { schema });
