import { mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const permissions = mysqlTable("permissions", {
  id: varchar("id", {
    length: 191,
  }).primaryKey(),
  key: varchar("key", {
    length: 191,
  }).notNull(),
});
