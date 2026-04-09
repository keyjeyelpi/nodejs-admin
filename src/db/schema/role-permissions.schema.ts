import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { roles } from "./roles.schema.ts";
import { permissions } from "./permissions.schema.ts";

export const rolePermissions = mysqlTable("role_permissions", {
  roleId: varchar("role_id", {
    length: 191,
  })
    .notNull()
    .references(() => roles.id, {
      onDelete: "cascade",
    }),
  permissionId: varchar("permission_id", {
    length: 191,
  })
    .notNull()
    .references(() => permissions.id, {
      onDelete: "cascade",
    }),
});
