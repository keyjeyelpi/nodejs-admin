import {
  mysqlTable,
  varchar,
  text,
  boolean,
} from "drizzle-orm/mysql-core";

export const positions = mysqlTable("positions", {
  id: varchar("id", {
    length: 191,
  }).primaryKey(),
  name: varchar("name", {
    length: 191,
  })
    .unique()
    .notNull(),
  description: text("description").notNull(),
  systemGenerated: boolean("system_generated").notNull().default(false),
  module: varchar("module", {
    length: 191,
  }),
});