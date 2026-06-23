import {
  mysqlTable,
  varchar,
  text,
  boolean,
} from "drizzle-orm/mysql-core";

export const permissions = mysqlTable("permissions", {
  id: varchar("id", {
    length: 191,
  }).primaryKey(),
  name: varchar("name", {
    length: 191,
  }).notNull(),
  key: varchar("key", {
    length: 191,
  }).notNull(),
  systemGenerated: boolean("system_generated").notNull().default(false),
  module: varchar("module", {
    length: 191,
  }),
});
