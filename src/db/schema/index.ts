// Table schemas
export { users } from "@/db/schema/users.schema.ts";
export { userSettings } from "@/db/schema/user-settings.schema.ts";
export { userTokens } from "@/db/schema/user-tokens.schema.ts";
export { roles } from "@/db/schema/roles.schema.ts";
export { permissions } from "@/db/schema/permissions.schema.ts";
export { rolePermissions } from "@/db/schema/role-permissions.schema.ts";
export { positions } from "@/db/schema/positions.schema.ts";
export { positionRoles } from "@/db/schema/position-roles.schema.ts";
export { userPositions } from "@/db/schema/user-positions.schema.ts";
export { logs } from "@/db/schema/logs.schema.ts";
export { teams } from "@/db/schema/teams.schema.ts";
export { teamUsers } from "@/db/schema/team-users.schema.ts";
export { departments } from "@/db/schema/departments.schema.ts";
export { departmentUsers } from "@/db/schema/department-users.schema.ts";

// Relations
export {
  usersRelations,
  userSettingsRelations,
  userTokensRelations,
  rolesRelations,
  permissionsRelations,
  rolePermissionsRelations,
  positionsRelations,
  positionRolesRelations,
  userPositionsRelations,
  teamsRelations,
  teamUsersRelations,
  departmentsRelations,
  departmentUsersRelations,
} from "@/db/schema/relations.schema.ts";
