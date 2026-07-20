import { v4 as uuidv4 } from "uuid";
import { db } from "../index.ts";
import { positions } from "../schema/index.ts";

const POSITION_DATA: Array<{ name: string; description: string }> = [
  { name: "System Administrator", description: "Full system access and administration" },
  { name: "Chief Executive Officer", description: "Executive leadership and strategic direction" },
  { name: "Chief Technology Officer", description: "Technology strategy and innovation" },
  { name: "Chief Financial Officer", description: "Financial planning and oversight" },
  { name: "Human Resources Director", description: "HR strategy and employee relations" },
  { name: "Software Engineer", description: "Full-stack software development" },
  { name: "Product Manager", description: "Product strategy and management" },
  { name: "UI/UX Designer", description: "User interface and experience design" },
  { name: "Data Scientist", description: "Data analysis and machine learning" },
  { name: "DevOps Engineer", description: "Infrastructure and deployment automation" },
  { name: "QA Engineer", description: "Quality assurance and testing" },
  { name: "Technical Lead", description: "Technical leadership and architecture" },
  { name: "Project Manager", description: "Project planning and coordination" },
];

export async function seed() {
  console.log("Seeding positions...");

  const existingPositions = await db.select().from(positions);

  if (existingPositions.length > 0) await db.delete(positions).execute();

  console.log("Creating default positions...");

  await db.insert(positions).values(
    POSITION_DATA.map((pos) => ({
      id: uuidv4(),
      name: pos.name,
      description: pos.description,
      systemGenerated: true,
    }))
  );

  const positionsList = await db.select().from(positions);

  console.log(
    "Created positions:",
    positionsList.map((p) => p.name)
  );
  console.log("Positions seeding complete!");
}