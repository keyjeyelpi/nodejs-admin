import { db } from "../index.ts";
import { users, positions, userPositions } from "../schema/index.ts";

export async function seed() {
  console.log("Seeding user positions...");

  const existingUserPositions = await db.select().from(userPositions);

  if (existingUserPositions.length > 0) {
    console.log("User positions already exist, skipping...");
    console.log("Existing user positions count:", existingUserPositions.length);
    return;
  }

  const usersList = await db.select().from(users);
  const positionsList = await db.select().from(positions);

  if (!usersList.length || !positionsList.length) {
    console.error(
      "No users or positions found. Please run users.seed.ts and positions.seed.ts first."
    );
    process.exit(1);
  }

  console.log("Creating user-position associations...");

  const kimJoseph = usersList.find((u) => u.email === "kj.penaloza@gmail.com");

  const assignments: { userId: string; positionId: string }[] = [];

  if (kimJoseph) {
    const techLeadPosition = positionsList.find((p) => p.name === "Technical Lead");
    if (techLeadPosition) {
      assignments.push({
        userId: kimJoseph.id,
        positionId: techLeadPosition.id,
      });
    }
  }

  const otherUsers = usersList.filter((u) => u.email !== "kj.penaloza@gmail.com");
  const otherPositions = positionsList;

  for (let i = 0; i < otherUsers.length && i < 50; i++) {
    const user = otherUsers[i];
    const position = otherPositions[i % otherPositions.length];
    if (user && position) {
      const exists = assignments.find((a) => a.userId === user.id && a.positionId === position.id);
      if (!exists) {
        assignments.push({
          userId: user.id,
          positionId: position.id,
        });
      }
    }
  }

  await db.insert(userPositions).values(assignments);

  const createdUserPositions = await db.select().from(userPositions);

  console.log("Created user-position associations:", createdUserPositions.length);
  console.log("User positions seeding complete!");
}
