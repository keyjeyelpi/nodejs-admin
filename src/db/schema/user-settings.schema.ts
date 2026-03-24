import { mysqlTable, varchar, int } from "drizzle-orm/mysql-core";

export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("user_id", { length: 191 }).unique().notNull(),
  colorPrimary: varchar("color_primary", { length: 191 }).notNull(),
  colorSecondary: varchar("color_secondary", { length: 191 }).notNull(),
  darkModePreference: varchar("dark_mode_preference", { length: 191 })
    .default("system")
    .notNull(),
});
