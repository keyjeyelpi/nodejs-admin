"use strict";

import { v4 as uuidv4 } from "uuid";
import { db } from "../index.ts";
import { permissions } from "../schema/index.ts";

const PERMISSIONS: Array<{ key: string; name: string }> = [
  { key: "all:access", name: "All Access" },
  { key: "userlink:users:add", name: "Add Users" },
  { key: "userlink:users:edit", name: "Edit Users" },
  { key: "userlink:users:view", name: "View Users" },
  { key: "userlink:users:list", name: "List Users" },
  { key: "userlink:users:delete", name: "Delete Users" },
];

export async function seed() {
  console.log("Seeding permissions...");

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
    PERMISSIONS.map((perm) => ({
      id: uuidv4(),
      key: perm.key,
      name: perm.name,
    }))
  );

  const permissionsList = await db.select().from(permissions);

  console.log(
    "Created permissions:",
    permissionsList.map((p) => p.key)
  );
  console.log("Permissions seeding complete!");
}
