import { relations } from "drizzle-orm";
import { users } from "./users.schema.ts";
import { userSettings } from "./user-settings.schema.ts";
import { userTokens } from "./user-tokens.schema.ts";
import { kanbanBoards } from "./kanban-boards.schema.ts";
import { kanbanColumns } from "./kanban-columns.schema.ts";
import { kanbanCards } from "./kanban-cards.schema.ts";
import { kanbanComments } from "./kanban-comments.schema.ts";
import { roles } from "./roles.schema.ts";
import { permissions } from "./permissions.schema.ts";
import { rolePermissions } from "./role-permissions.schema.ts";
import { positions } from "./positions.schema.ts";
import { positionRoles } from "./position-roles.schema.ts";
import { userPositions } from "./user-positions.schema.ts";
import { teams } from "./teams.schema.ts";
import { teamUsers } from "./team-users.schema.ts";
import { departments } from "./departments.schema.ts";
import { departmentUsers } from "./department-users.schema.ts";

export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  comments: many(kanbanComments),
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

export const kanbanBoardsRelations = relations(kanbanBoards, ({ many }) => ({
  columns: many(kanbanColumns),
}));

export const kanbanColumnsRelations = relations(
  kanbanColumns,
  ({ one, many }) => ({
    board: one(kanbanBoards, {
      fields: [kanbanColumns.boardId],
      references: [kanbanBoards.id],
    }),
    cards: many(kanbanCards),
  })
);

export const kanbanCardsRelations = relations(kanbanCards, ({ one, many }) => ({
  column: one(kanbanColumns, {
    fields: [kanbanCards.kanbanColumnId],
    references: [kanbanColumns.id],
  }),
  comments: many(kanbanComments),
}));

export const kanbanCommentsRelations = relations(kanbanComments, ({ one }) => ({
  user: one(users, {
    fields: [kanbanComments.userId],
    references: [users.id],
  }),
  card: one(kanbanCards, {
    fields: [kanbanComments.kanbanCardId],
    references: [kanbanCards.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  })
);

export const positionsRelations = relations(positions, ({ many }) => ({
  positionRoles: many(positionRoles),
  userPositions: many(userPositions),
}));

export const positionRolesRelations = relations(
  positionRoles,
  ({ one }) => ({
    position: one(positions, {
      fields: [positionRoles.positionId],
      references: [positions.id],
    }),
    role: one(roles, {
      fields: [positionRoles.roleId],
      references: [roles.id],
    }),
  })
);

export const userPositionsRelations = relations(
  userPositions,
  ({ one }) => ({
    user: one(users, {
      fields: [userPositions.userId],
      references: [users.id],
    }),
    position: one(positions, {
      fields: [userPositions.positionId],
      references: [positions.id],
    }),
  })
);

export const teamsRelations = relations(teams, ({ many }) => ({
  teamUsers: many(teamUsers),
}));

export const teamUsersRelations = relations(
  teamUsers,
  ({ one }) => ({
    user: one(users, {
      fields: [teamUsers.userId],
      references: [users.id],
    }),
    team: one(teams, {
      fields: [teamUsers.teamId],
      references: [teams.id],
    }),
  })
);

export const departmentsRelations = relations(departments, ({ many }) => ({
  departmentUsers: many(departmentUsers),
}));

export const departmentUsersRelations = relations(
  departmentUsers,
  ({ one }) => ({
    user: one(users, {
      fields: [departmentUsers.userId],
      references: [users.id],
    }),
    department: one(departments, {
      fields: [departmentUsers.departmentId],
      references: [departments.id],
    }),
  })
);
