import { db } from "../index.ts";
import { departments, users, departmentUsers } from "../schema/index.ts";

export async function seed() {
  console.log("Seeding department users...");

  const existingDepartmentUsers = await db.select().from(departmentUsers);

  if (existingDepartmentUsers.length > 0) {
    console.log("Department users already exist, skipping...");
    console.log("Existing department users count:", existingDepartmentUsers.length);
    return;
  }

  const departmentsList = await db.select().from(departments);
  const usersList = await db.select().from(users);

  if (!departmentsList.length || !usersList.length) {
    console.error(
      "No departments or users found. Please run departments.seed.ts and users.seed.ts first."
    );
    process.exit(1);
  }

  console.log("Creating department-user associations...");

  const assignments: { userId: string; departmentId: string }[] = [];

  for (const dept of departmentsList) {
    const deptLead = usersList.find((u) => u.id === dept.lead);
    if (deptLead) {
      assignments.push({
        userId: deptLead.id,
        departmentId: dept.id,
      });
    }

    const otherUsers = usersList
      .filter((u) => u.id !== dept.lead)
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 7) + 3);

    for (const user of otherUsers) {
      assignments.push({
        userId: user.id,
        departmentId: dept.id,
      });
    }
  }

  await db.insert(departmentUsers).values(assignments);

  const createdAssignments = await db.select().from(departmentUsers);

  console.log("Created department-user associations:", createdAssignments.length);
  console.log("Department users seeding complete!");
}
