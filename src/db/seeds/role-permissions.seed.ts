import { db } from "../index.ts";
import { roles, permissions, rolePermissions } from "../schema/index.ts";

export async function seed() {
  console.log("Seeding role permissions...");
  // Check if role permissions already exist

  const existingRolePermissions = await db.select().from(rolePermissions);

  if (existingRolePermissions.length > 0)
    await db.delete(rolePermissions).execute();

  // Get all roles and permissions
  const rolesList = await db.select().from(roles);

  const permissionsList = await db.select().from(permissions);

  if (!rolesList.length || !permissionsList.length) {
    console.error(
      "No roles or permissions found. Please run roles.seed.ts and permissions.seed.ts first."
    );
    process.exit(1);
  }

  console.log("Creating default role permissions...");
  // Helper function to find permission by key
  const findPermission = (key: string) =>
    permissionsList.find((p) => p.key === key);

  // Define role-permission relationships
  // System Administrator gets all:access permission
  const systemAdminRole = rolesList.find(
    (r) => r.title === "System Administrator"
  );

  const systemAdminPermissions = [findPermission("all:access")];

  // Administrator gets all userlink:users permissions
  const adminRole = rolesList.find((r) => r.title === "Administrator");

  const adminPermissions = [
    findPermission("userlink:users:add"),
    findPermission("userlink:users:edit"),
    findPermission("userlink:users:view"),
    findPermission("userlink:users:list"),
    findPermission("userlink:users:delete"),
  ];

  // Manager gets add, edit, view, list (no delete)
  const managerRole = rolesList.find((r) => r.title === "Manager");

  const managerPermissions = [
    findPermission("userlink:users:add"),
    findPermission("userlink:users:edit"),
    findPermission("userlink:users:view"),
    findPermission("userlink:users:list"),
  ];

  // User gets view and list
  const userRole = rolesList.find((r) => r.title === "User");

  const userPermissions = [
    findPermission("userlink:users:view"),
    findPermission("userlink:users:list"),
  ];

  // Guest gets only list
  const guestRole = rolesList.find((r) => r.title === "Guest");

  const guestPermissions = [findPermission("userlink:users:list")];

  const rolePermissionsData = [];

  if (
    // Add System Administrator permissions
    systemAdminRole
  )
    for (const perm of systemAdminPermissions) {
      if (perm)
        rolePermissionsData.push({
          roleId: systemAdminRole.id,
          permissionId: perm.id,
        });
    }

  if (
    // Add Administrator permissions
    adminRole
  )
    for (const perm of adminPermissions) {
      if (perm)
        rolePermissionsData.push({
          roleId: adminRole.id,
          permissionId: perm.id,
        });
    }

  if (
    // Add Manager permissions
    managerRole
  )
    for (const perm of managerPermissions) {
      if (perm)
        rolePermissionsData.push({
          roleId: managerRole.id,
          permissionId: perm.id,
        });
    }

  if (
    // Add User permissions
    userRole
  )
    for (const perm of userPermissions) {
      if (perm)
        rolePermissionsData.push({
          roleId: userRole.id,
          permissionId: perm.id,
        });
    }

  if (
    // Add Guest permissions
    guestRole
  )
    for (const perm of guestPermissions) {
      if (perm)
        rolePermissionsData.push({
          roleId: guestRole.id,
          permissionId: perm.id,
        });
    }

  await db.insert(rolePermissions).values(rolePermissionsData);

  const rolePermissionsList = await db.select().from(rolePermissions);

  console.log("Created role permissions:", rolePermissionsList.length);
  console.log("Role permissions seeding complete!");
}
