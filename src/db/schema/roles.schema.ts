import { mysqlTable, varchar, text } from "drizzle-orm/mysql-core";

export const roles = mysqlTable("roles", {
  id: varchar("id", {
    length: 191,
  }).primaryKey(),
  title: varchar("title", {
    length: 191,
  }).notNull(),
  description: text("description").notNull(),
});
