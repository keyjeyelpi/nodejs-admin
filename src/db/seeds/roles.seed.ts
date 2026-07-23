import { v4 as uuidv4 } from "uuid";
import { db } from "../index.ts";
import { roles } from "../schema/index.ts";

export async function seed() {
  console.log("Seeding roles...");
  // Check if roles already exist

  const existingRoles = await db.select().from(roles);

  if (existingRoles.length > 0) await db.delete(roles).execute();

  console.log("Creating default roles...");

  await db.insert(roles).values([
    {
      id: uuidv4(),
      name: "System Administrator",
      description: "Full system access with all permissions",
      systemGenerated: true,
    },
    {
      id: uuidv4(),
      name: "Administrator",
      description: "Full system access",
      systemGenerated: true,
    },
    {
      id: uuidv4(),
      name: "Manager",
      description: "Manage team and projects",
      systemGenerated: true,
    },
    {
      id: uuidv4(),
      name: "User",
      description: "Standard user access",
      systemGenerated: true,
    },
    {
      id: uuidv4(),
      name: "Guest",
      description: "Limited guest access",
      systemGenerated: true,
    },
  ]);

  const rolesList = await db.select().from(roles);

  console.log(
    "createRolesd roles:",
    rolesList.map((r) => r.name)
  );
  console.log("Roles seeding complete!");
}
