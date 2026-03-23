import { db } from "../index.ts";
import { users, userSettings } from "../schema/index.ts";
import { v4 as uuidv4 } from "uuid";

export async function seed() {
  console.log("Seeding user settings...");

  // Check if users exist
  const existingUsers = await db.select().from(users);

  if (existingUsers.length === 0) {
    console.error("No users found. Please run users.seed.ts first.");
    process.exit(1);
  }

  // Check if user settings already exist
  const existingSettings = await db.select().from(userSettings);

  if (existingSettings.length > 0) {
    console.log("User settings already exist, skipping...");
    console.log("Existing settings count:", existingSettings.length);
    return;
  }

  console.log("Creating user settings for", existingUsers.length, "users...");

  // Create settings for each user
  for (const user of existingUsers) {
    await db.insert(userSettings).values({
      userId: user.id,
      colorPrimary: "#007bff",
      colorSecondary: "#6c757d",
      darkModePreference: "system",
    });
  }

  console.log("User settings seeding complete!");
  console.log("Created settings for", existingUsers.length, "users");
}
