import { mysqlTable, varchar, int, boolean, text, datetime, mysqlEnum } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const accountType = mysqlTable("account_type", {
  id: int("id").autoincrement().primaryKey(),
  accountId: varchar("account_id", { length: 191 }).unique().notNull(),
  title: varchar("title", { length: 191 }).notNull(),
  description: text("description").notNull(),
  isEditable: boolean("is_editable").notNull(),
  isDeletable: boolean("is_deletable").notNull(),
  isSelectable: boolean("is_selectable").notNull(),
  allowedToEdit: boolean("allowed_to_edit").notNull(),
});

export const users = mysqlTable("users", {
  id: varchar("id", { length: 191 }).primaryKey(),
  country: varchar("country", { length: 191 }).notNull(),
  accountTypeId: varchar("account_type_id", { length: 191 }).notNull(),
  lastname: varchar("lastname", { length: 191 }).notNull(),
  firstname: varchar("firstname", { length: 191 }).notNull(),
  email: varchar("email", { length: 191 }).unique().notNull(),
  username: varchar("username", { length: 191 }).unique().notNull(),
  password: varchar("password", { length: 191 }).notNull(),
  contactnumber: varchar("contactnumber", { length: 191 }).notNull(),
  photo: text("photo"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("user_id", { length: 191 }).unique().notNull(),
  colorPrimary: varchar("color_primary", { length: 191 }).notNull(),
  colorSecondary: varchar("color_secondary", { length: 191 }).notNull(),
  darkModePreference: varchar("dark_mode_preference", { length: 191 }).default("system").notNull(),
});

export const kanbanBoards = mysqlTable("kanban_boards", {
  id: varchar("id", { length: 191 }).primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
});

export const kanbanColumns = mysqlTable("kanban_columns", {
  id: varchar("id", { length: 191 }).primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
  disableAdd: boolean("disableAdd").default(false).notNull(),
  order: int("order").default(0).notNull(),
  boardId: varchar("boardId", { length: 191 }).notNull(),
});

export const kanbanCards = mysqlTable("kanban_cards", {
  id: varchar("id", { length: 191 }).primaryKey(),
  title: varchar("title", { length: 191 }).notNull(),
  description: text("description").notNull(),
  categoryTitle: varchar("categoryTitle", { length: 191 }).notNull(),
  categoryColor: varchar("categoryColor", { length: 191 }).notNull(),
  priority: mysqlEnum("priority", ["URGENT", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM").notNull(),
  status: mysqlEnum("status", ["TO_DO", "DONE", "REVIEW", "PROCESS"]).default("TO_DO").notNull(),
  likes: int("likes").default(0).notNull(),
  kanbanColumnId: varchar("kanbanColumnId", { length: 191 }).notNull(),
});

export const kanbanComments = mysqlTable("kanban_comments", {
  id: varchar("id", { length: 191 }).primaryKey(),
  text: text("text").notNull(),
  userId: varchar("userId", { length: 191 }).notNull(),
  kanbanCardId: varchar("kanbanCardId", { length: 191 }).notNull(),
  replyForKanbanCommentId: varchar("replyForKanbanCommentId", { length: 191 }),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// Relations
export const accountTypeRelations = relations(accountType, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  accountType: one(accountType, {
    fields: [users.accountTypeId],
    references: [accountType.accountId],
  }),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  comments: many(kanbanComments),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const kanbanBoardsRelations = relations(kanbanBoards, ({ many }) => ({
  columns: many(kanbanColumns),
}));

export const kanbanColumnsRelations = relations(kanbanColumns, ({ one, many }) => ({
  board: one(kanbanBoards, {
    fields: [kanbanColumns.boardId],
    references: [kanbanBoards.id],
  }),
  cards: many(kanbanCards),
}));

export const kanbanCardsRelations = relations(kanbanCards, ({ one, many }) => ({
  column: one(kanbanColumns, {
    fields: [kanbanCards.kanbanColumnId],
    references: [kanbanColumns.id],
  }),
  comments: many(kanbanComments),
}));

export const kanbanCommentsRelations = relations(kanbanComments, ({ one }) => ({
  user: one(users, {
    fields: [kanbanComments.userId],
    references: [users.id],
  }),
  card: one(kanbanCards, {
    fields: [kanbanComments.kanbanCardId],
    references: [kanbanCards.id],
  }),
}));
