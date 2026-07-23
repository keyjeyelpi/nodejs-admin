import { db } from "../index.ts";
import { teams, users, teamUsers } from "../schema/index.ts";

export async function seed() {
  console.log("Seeding team users...");

  const existingTeamUsers = await db.select().from(teamUsers);

  if (existingTeamUsers.length > 0) {
    console.log("Team users already exist, skipping...");
    console.log("Existing team users count:", existingTeamUsers.length);
    return;
  }

  const teamsList = await db.select().from(teams);
  const usersList = await db.select().from(users);

  if (!teamsList.length || !usersList.length) {
    console.error("No teams or users found. Please run teams.seed.ts and users.seed.ts first.");
    process.exit(1);
  }

  console.log("Creating team-user associations...");

  const assignments: { userId: string; teamId: string }[] = [];

  for (const team of teamsList) {
    const teamLead = usersList.find((u) => u.id === team.lead);
    if (teamLead) {
      assignments.push({
        userId: teamLead.id,
        teamId: team.id,
      });
    }

    const creator = usersList.find((u) => u.id === team.createdBy);
    if (creator && teamLead && creator.id !== teamLead.id) {
      assignments.push({
        userId: creator.id,
        teamId: team.id,
      });
    }

    const otherUsers = usersList
      .filter((u) => u.id !== team.lead && u.id !== team.createdBy)
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 5) + 3);

    for (const user of otherUsers) {
      assignments.push({
        userId: user.id,
        teamId: team.id,
      });
    }
  }

  await db.insert(teamUsers).values(assignments);

  const createdAssignments = await db.select().from(teamUsers);

  console.log("Created team-user associations:", createdAssignments.length);
  console.log("Team users seeding complete!");
}
