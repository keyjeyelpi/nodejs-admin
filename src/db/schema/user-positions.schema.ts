import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { users } from "./users.schema.ts";
import { positions } from "./positions.schema.ts";

export const userPositions = mysqlTable("user_positions", {
  userId: varchar("user_id", {
    length: 191,
  })
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
  positionId: varchar("position_id", {
    length: 191,
  })
    .notNull()
    .references(() => positions.id, {
      onDelete: "cascade",
    }),
});