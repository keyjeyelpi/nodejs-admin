import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { positions } from "./positions.schema.ts";
import { roles } from "./roles.schema.ts";

export const positionRoles = mysqlTable("position_roles", {
  positionId: varchar("position_id", {
    length: 191,
  })
    .notNull()
    .references(() => positions.id, {
      onDelete: "cascade",
    }),
  roleId: varchar("role_id", {
    length: 191,
  })
    .notNull()
    .references(() => roles.id, {
      onDelete: "cascade",
    }),
});