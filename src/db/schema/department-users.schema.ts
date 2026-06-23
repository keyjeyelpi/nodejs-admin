import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { users } from "./users.schema.ts";
import { departments } from "./departments.schema.ts";

export const departmentUsers = mysqlTable("department_users", {
  userId: varchar("user_id", {
    length: 191,
  })
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
  departmentId: varchar("department_id", {
    length: 191,
  })
    .notNull()
    .references(() => departments.id, {
      onDelete: "cascade",
    }),
});