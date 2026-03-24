import { db } from "../index.ts";
import { permissions } from "../schema/index.ts";
import { v4 as uuidv4 } from "uuid";

// Define permission keys
// System Administrator gets "all:access"
const PERMISSIONS = [
  "all:access",
  "userlink:users:add",
  "userlink:users:edit",
  "userlink:users:view",
  "userlink:users:list",
  "userlink:users:delete",
];

export async function seed() {
  console.log("Seeding permissions...");

  // Check if permissions already exist
  const existingPermissions = await db.select().from(permissions);

  if (existingPermissions.length > 0) {
    console.log("Permissions already exist, skipping...");
    console.log(
      "Existing permissions:",
      existingPermissions.map((p) => p.key)
    );
    return;
  }

  console.log("Creating default permissions...");

  await db.insert(permissions).values(
    PERMISSIONS.map((key) => ({
      id: uuidv4(),
      key,
    }))
  );

  const permissionsList = await db.select().from(permissions);
  console.log(
    "Created permissions:",
    permissionsList.map((p) => p.key)
  );
  console.log("Permissions seeding complete!");
}
