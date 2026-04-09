import { mysqlTable, varchar, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const logs = mysqlTable("logs", {
  id: varchar("id", { length: 191 }).primaryKey(),
  userId: varchar("user_id", { length: 191 }).notNull(),
  action: varchar("action", { length: 191 }).notNull(),
  module: varchar("module", { length: 191 }).notNull(),
  timestamp: datetime("timestamp")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
