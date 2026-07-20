import { db } from "../index.ts";
import { positions, roles, positionRoles } from "../schema/index.ts";

export async function seed() {
  console.log("Seeding position roles...");

  const existingPositionRoles = await db.select().from(positionRoles);

  if (existingPositionRoles.length > 0)
    await db.delete(positionRoles).execute();

  const positionsList = await db.select().from(positions);
  const rolesList = await db.select().from(roles);

  if (!positionsList.length || !rolesList.length) {
    console.error(
      "No positions or roles found. Please run positions.seed.ts and roles.seed.ts first."
    );
    process.exit(1);
  }

  console.log("Creating position-role associations...");

  const adminRole = rolesList.find((r) => r.name === "Administrator");
  const managerRole = rolesList.find((r) => r.name === "Manager");
  const userRole = rolesList.find((r) => r.name === "User");

  const softwareEngineer = positionsList.find((p) => p.name === "Software Engineer");
  const productManager = positionsList.find((p) => p.name === "Product Manager");
  const uiuxDesigner = positionsList.find((p) => p.name === "UI/UX Designer");
  const dataScientist = positionsList.find((p) => p.name === "Data Scientist");
  const devopsEngineer = positionsList.find((p) => p.name === "DevOps Engineer");
  const qaEngineer = positionsList.find((p) => p.name === "QA Engineer");
  const techLead = positionsList.find((p) => p.name === "Technical Lead");
  const projectManager = positionsList.find((p) => p.name === "Project Manager");

  const positionRolesData = [];

  const assignRoles = (positionId: string, roleIds: string[]) => {
    for (const roleId of roleIds) {
      positionRolesData.push({ positionId, roleId });
    }
  };

  if (softwareEngineer && adminRole && managerRole) {
    assignRoles(softwareEngineer.id, [adminRole.id, managerRole.id]);
  }

  if (productManager && adminRole) {
    assignRoles(productManager.id, [adminRole.id]);
  }

  if (uiuxDesigner && adminRole && managerRole) {
    assignRoles(uiuxDesigner.id, [adminRole.id, managerRole.id]);
  }

  if (dataScientist && adminRole && managerRole) {
    assignRoles(dataScientist.id, [adminRole.id, managerRole.id]);
  }

  if (devopsEngineer && adminRole && managerRole && userRole) {
    assignRoles(devopsEngineer.id, [adminRole.id, managerRole.id, userRole.id]);
  }

  if (qaEngineer && adminRole && managerRole && userRole) {
    assignRoles(qaEngineer.id, [adminRole.id, managerRole.id, userRole.id]);
  }

  if (techLead && adminRole) {
    assignRoles(techLead.id, [adminRole.id]);
  }

  if (projectManager && adminRole && managerRole) {
    assignRoles(projectManager.id, [adminRole.id, managerRole.id]);
  }

  await db.insert(positionRoles).values(positionRolesData);

  const createdPositionRoles = await db.select().from(positionRoles);

  console.log("Created position-role associations:", createdPositionRoles.length);
  console.log("Position roles seeding complete!");
}