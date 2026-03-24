import { mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const kanbanBoards = mysqlTable("kanban_boards", {
  id: varchar("id", { length: 191 }).primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
});
