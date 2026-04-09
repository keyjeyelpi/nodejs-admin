import { mysqlTable, varchar, int, datetime } from "drizzle-orm/mysql-core";

export const userTokens = mysqlTable("user_token", {
  id: int("id").autoincrement().primaryKey(),
  userID: varchar("userID", {
    length: 191,
  }).notNull(),
  token: varchar("token", {
    length: 500,
  }).notNull(),
  expiration: datetime("expiration").notNull(),
});
