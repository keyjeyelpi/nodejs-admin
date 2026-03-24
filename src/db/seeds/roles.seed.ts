import { db } from "../index.ts";
import { roles } from "../schema/index.ts";
import { v4 as uuidv4 } from "uuid";

export async function seed() {
  console.log("Seeding roles...");

  // Check if roles already exist
  const existingRoles = await db.select().from(roles);

  if (existingRoles.length > 0) {
    await db.delete(roles).execute();
  }

  console.log("Creating default roles...");

  await db.insert(roles).values([
    {
      id: uuidv4(),
      title: "System Administrator",
      description: "Full system access with all permissions",
    },
    {
      id: uuidv4(),
      title: "Administrator",
      description: "Full system access",
    },
    {
      id: uuidv4(),
      title: "Manager",
      description: "Manage team and projects",
    },
    {
      id: uuidv4(),
      title: "User",
      description: "Standard user access",
    },
    {
      id: uuidv4(),
      title: "Guest",
      description: "Limited guest access",
    },
  ]);

  const rolesList = await db.select().from(roles);
  console.log(
    "Created roles:",
    rolesList.map((r) => r.title)
  );
  console.log("Roles seeding complete!");
}
