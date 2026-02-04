import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL || "mysql://user:password@localhost:3306/db",
});

export const db = drizzle(connection, { schema, mode: "default" });
