import { v4 as uuidv4 } from "uuid";
import { db } from "../index.ts";
import { departments, users } from "../schema/index.ts";

export async function seed() {
  console.log("Seeding departments...");

  const existingDepartments = await db.select().from(departments);

  if (existingDepartments.length > 0) {
    console.log("Departments already exist, skipping...");
    console.log("Existing departments count:", existingDepartments.length);
    return;
  }

  const usersList = await db.select().from(users);

  if (!usersList.length) {
    console.error("No users found. Please run users.seed.ts first.");
    process.exit(1);
  }

  console.log("Creating default departments...");

  const departmentData = [
    {
      name: "Engineering",
      description: "Software development and technical operations",
    },
    {
      name: "Human Resources",
      description: "HR and people operations",
    },
    {
      name: "Finance",
      description: "Financial planning and accounting",
    },
    {
      name: "Operations",
      description: "Business operations and logistics",
    },
    {
      name: "Research & Development",
      description: "Innovation and product research",
    },
  ];

  if (usersList.length === 0) {
    throw new Error("usersList is empty");
  }

  for (const dept of departmentData) {
    const lead = usersList[Math.floor(Math.random() * usersList.length)];

    if (!lead) {
      throw new Error("Failed to select a lead");
    }

    await db.insert(departments).values({
      id: uuidv4(),
      name: dept.name,
      description: dept.description,
      lead: lead.id,
    });
  }
  const createdDepartments = await db.select().from(departments);

  console.log("Created departments:", createdDepartments.length);
  createdDepartments.forEach((d) => console.log(`  - ${d.name}`));
  console.log("Departments seeding complete!");
}