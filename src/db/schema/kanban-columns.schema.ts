import { mysqlTable, varchar, int, boolean } from "drizzle-orm/mysql-core";

export const kanbanColumns = mysqlTable("kanban_columns", {
  id: varchar("id", {
    length: 191,
  }).primaryKey(),
  name: varchar("name", {
    length: 191,
  }).notNull(),
  disableAdd: boolean("disableAdd").default(false).notNull(),
  order: int("order").default(0).notNull(),
  boardId: varchar("boardId", {
    length: 191,
  }).notNull(),
});
