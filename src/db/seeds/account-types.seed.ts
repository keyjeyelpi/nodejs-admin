import { db } from "../index.ts";
import { accountTypes } from "../schema/index.ts";
import { v4 as uuidv4 } from "uuid";

export async function seed() {
  console.log("Seeding account types...");

  // Check if account types already exist
  const existingAccountTypes = await db.select().from(accountTypes);

  if (existingAccountTypes.length > 0) {
    console.log("Account types already exist, skipping...");
    console.log("Existing account types:", existingAccountTypes.map(a => a.title));
    return;
  }

  console.log("Creating default account types...");

  await db.insert(accountTypes).values([
    {
      id: uuidv4(),
      title: "Administrator",
      description: "Full system access",
      isEditable: false,
      isDeletable: false,
      isSelectable: true,
      allowedToEdit: true,
    },
    {
      id: uuidv4(),
      title: "Manager",
      description: "Manage team and projects",
      isEditable: true,
      isDeletable: true,
      isSelectable: true,
      allowedToEdit: true,
    },
    {
      id: uuidv4(),
      title: "User",
      description: "Standard user access",
      isEditable: true,
      isDeletable: true,
      isSelectable: true,
      allowedToEdit: false,
    },
    {
      id: uuidv4(),
      title: "Guest",
      description: "Limited guest access",
      isEditable: true,
      isDeletable: true,
      isSelectable: true,
      allowedToEdit: false,
    },
  ]);

  const accountTypesList = await db.select().from(accountTypes);
  console.log("Created account types:", accountTypesList.map(a => a.title));
  console.log("Account types seeding complete!");
}
