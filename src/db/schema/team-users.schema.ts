import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { users } from "./users.schema.ts";
import { teams } from "./teams.schema.ts";

export const teamUsers = mysqlTable("team_users", {
  userId: varchar("user_id", {
    length: 191,
  })
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
  teamId: varchar("team_id", {
    length: 191,
  })
    .notNull()
    .references(() => teams.id, {
      onDelete: "cascade",
    }),
});
