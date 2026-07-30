import { relations } from "drizzle-orm";
import { users } from "@/db/schema/users.schema.ts";
import { userSettings } from "@/db/schema/user-settings.schema.ts";
import { userTokens } from "@/db/schema/user-tokens.schema.ts";
import { roles } from "@/db/schema/roles.schema.ts";
import { permissions } from "@/db/schema/permissions.schema.ts";
import { rolePermissions } from "@/db/schema/role-permissions.schema.ts";
import { positions } from "@/db/schema/positions.schema.ts";
import { positionRoles } from "@/db/schema/position-roles.schema.ts";
import { userPositions } from "@/db/schema/user-positions.schema.ts";
import { teams } from "@/db/schema/teams.schema.ts";
import { teamUsers } from "@/db/schema/team-users.schema.ts";
import { departments } from "@/db/schema/departments.schema.ts";
import { departmentUsers } from "@/db/schema/department-users.schema.ts";

export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  positions: many(userPositions),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const userTokensRelations = relations(userTokens, ({ one }) => ({
  user: one(users, {
    fields: [userTokens.userID],
    references: [users.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const positionsRelations = relations(positions, ({ many }) => ({
  positionRoles: many(positionRoles),
  userPositions: many(userPositions),
}));

export const positionRolesRelations = relations(positionRoles, ({ one }) => ({
  position: one(positions, {
    fields: [positionRoles.positionId],
    references: [positions.id],
  }),
  role: one(roles, {
    fields: [positionRoles.roleId],
    references: [roles.id],
  }),
}));

export const userPositionsRelations = relations(userPositions, ({ one }) => ({
  user: one(users, {
    fields: [userPositions.userId],
    references: [users.id],
  }),
  position: one(positions, {
    fields: [userPositions.positionId],
    references: [positions.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  teamUsers: many(teamUsers),
}));

export const teamUsersRelations = relations(teamUsers, ({ one }) => ({
  user: one(users, {
    fields: [teamUsers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamUsers.teamId],
    references: [teams.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  departmentUsers: many(departmentUsers),
}));

export const departmentUsersRelations = relations(departmentUsers, ({ one }) => ({
  user: one(users, {
    fields: [departmentUsers.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [departmentUsers.departmentId],
    references: [departments.id],
  }),
}));
