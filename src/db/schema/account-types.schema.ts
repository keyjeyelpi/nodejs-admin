import { mysqlTable, varchar, text, boolean } from "drizzle-orm/mysql-core";

export const accountTypes = mysqlTable("account_types", {
  id: varchar("id", { length: 191 }).primaryKey(),
  title: varchar("title", { length: 191 }).notNull(),
  description: text("description").notNull(),
  isEditable: boolean("is_editable").notNull(),
  isDeletable: boolean("is_deletable").notNull(),
  isSelectable: boolean("is_selectable").notNull(),
  allowedToEdit: boolean("allowed_to_edit").notNull(),
});