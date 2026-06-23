import { sql } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  text,
  datetime,
} from "drizzle-orm/mysql-core";

export const departments = mysqlTable("departments", {
  id: varchar("id", {
    length: 191,
  }).primaryKey(),
  name: varchar("name", {
    length: 191,
  }).notNull(),
  description: text("description"),
  lead: varchar("lead", {
    length: 191,
  }).notNull(),
  createdAt: datetime("created_at", { mode: "date" })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});