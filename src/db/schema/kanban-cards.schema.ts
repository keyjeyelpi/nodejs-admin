import {
  mysqlTable,
  varchar,
  text,
  int,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

export const kanbanCards = mysqlTable("kanban_cards", {
  id: varchar("id", { length: 191 }).primaryKey(),
  title: varchar("title", { length: 191 }).notNull(),
  description: text("description").notNull(),
  categoryTitle: varchar("categoryTitle", { length: 191 }).notNull(),
  categoryColor: varchar("categoryColor", { length: 191 }).notNull(),
  priority: mysqlEnum("priority", ["URGENT", "HIGH", "MEDIUM", "LOW"])
    .default("MEDIUM")
    .notNull(),
  status: mysqlEnum("status", ["TO_DO", "DONE", "REVIEW", "PROCESS"])
    .default("TO_DO")
    .notNull(),
  likes: int("likes").default(0).notNull(),
  kanbanColumnId: varchar("kanbanColumnId", { length: 191 }).notNull(),
});
