import { mysqlTable, varchar, text, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const kanbanComments = mysqlTable("kanban_comments", {
  id: varchar("id", { length: 191 }).primaryKey(),
  text: text("text").notNull(),
  userId: varchar("userId", { length: 191 }).notNull(),
  kanbanCardId: varchar("kanbanCardId", { length: 191 }).notNull(),
  replyForKanbanCommentId: varchar("replyForKanbanCommentId", { length: 191 }),
  createdAt: datetime("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: datetime("updated_at")
    .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
    .notNull(),
});
