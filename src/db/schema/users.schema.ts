import { sql } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  text,
  boolean,
  datetime,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: varchar("id", {
    length: 191,
  }).primaryKey(),
  country: varchar("country", {
    length: 191,
  }).notNull(),
  roleId: varchar("role_id", {
    length: 191,
  }).notNull(),
  lastname: varchar("lastname", {
    length: 191,
  }).notNull(),
  firstname: varchar("firstname", {
    length: 191,
  }).notNull(),
  email: varchar("email", {
    length: 191,
  })
    .unique()
    .notNull(),
  username: varchar("username", {
    length: 191,
  })
    .unique()
    .notNull(),
  password: varchar("password", {
    length: 191,
  }).notNull(),
  contactnumber: varchar("contactnumber", {
    length: 191,
  }).notNull(),
  photo: text("photo"),
  active: boolean("active").notNull().default(true),
  createdAt: datetime("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: datetime("updated_at")
    .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
    .notNull(),
});
