import { v4 as uuidv4 } from "uuid";
import { db } from "../index.ts";
import { teams, users } from "../schema/index.ts";

export async function seed() {
  console.log("Seeding teams...");

  const existingTeams = await db.select().from(teams);

  if (existingTeams.length > 0) {
    console.log("Teams already exist, skipping...");
    console.log("Existing teams count:", existingTeams.length);
    return;
  }

  const usersList = await db.select().from(users);

  if (!usersList.length) {
    console.error("No users found. Please run users.seed.ts first.");
    process.exit(1);
  }

  console.log("Creating default teams...");

  const teamData = [
    {
      name: "Engineering",
      description: "Software development and engineering team",
    },
    {
      name: "Product",
      description: "Product management and strategy team",
    },
    {
      name: "Design",
      description: "UI/UX and product design team",
    },
    {
      name: "Marketing",
      description: "Marketing and growth team",
    },
    {
      name: "Sales",
      description: "Sales and customer success team",
    },
  ];

  if (usersList.length === 0) {
    throw new Error("usersList is empty");
  }

  for (const team of teamData) {
    const creator = usersList[Math.floor(Math.random() * usersList.length)];
    const lead = usersList[Math.floor(Math.random() * usersList.length)];

    if (!creator || !lead) {
      throw new Error("Failed to select creator or lead");
    }

    await db.insert(teams).values({
      id: uuidv4(),
      name: team.name,
      description: team.description,
      createdBy: creator.id,
      lead: lead.id,
    });
  } const createdTeams = await db.select().from(teams);

  console.log("Created teams:", createdTeams.length);
  createdTeams.forEach((t) => console.log(`  - ${t.name}`));
  console.log("Teams seeding complete!");
}