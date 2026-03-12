import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const connStr = process.env.DATABASE_URL!.replace(/[?&]sslmode=[^&]*/g, '').replace(/[?&]$/, '');
const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false, require: true } });
export const db = drizzle(pool, { schema });
