import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import { db } from "@/db/index.ts";
import { users, positions, userPositions } from "@/db/schema/index.ts";

export async function seed() {
  console.log("Seeding users...");

  // Check if positions exist
  const positionsList = await db.select().from(positions);

  if (!positionsList.length) {
    console.error("No positions found. Please run positions.seed.ts first.");
    process.exit(1);
  }

  // Check if users already exist
  const existingUsers = await db.select().from(users);

  if (existingUsers.length > 0) {
    console.log("Users already exist, skipping...");
    console.log("Existing users count:", existingUsers.length);
    return;
  }

  // Get System Administrator position for Kim Joseph
  const systemAdminPosition = positionsList.find((p) => p.name === "System Administrator");

  if (!systemAdminPosition) {
    console.error("System Administrator position not found.");
    process.exit(1);
  }

  console.log("Using System Administrator position for Kim Joseph");
  // Create Kim Joseph Penaloza as the first user with System Administrator position
  const kimId = uuidv4();
  const hashedPassword = await bcrypt.hash("keyjeyelpi", 10);

  await db.insert(users).values({
    id: kimId,
    country: "PH",
    lastname: "Penaloza",
    firstname: "Kim Joseph",
    email: "kj.penaloza@gmail.com",
    username: "keyjeyelpi",
    password: hashedPassword,
    contactnumber: "+63 123 456 7890",
    active: true,
  });

  // Assign System Administrator position to Kim Joseph
  await db.insert(userPositions).values({
    userId: kimId,
    positionId: systemAdminPosition.id,
  });

  console.log("Created Kim Joseph Penaloza with System Administrator position");

  // Get other positions for random users (exclude System Administrator)
  const otherPositions = positionsList.filter((p) => p.name !== "System Administrator");

  // Create 99 additional users
  for (let i = 0; i < 99; i++) {
    const userId = uuidv4();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const country = faker.location.countryCode();
    const active = i % 2 === 0;

    const password = await bcrypt.hash("password123", 10);

    await db.insert(users).values({
      id: userId,
      country,
      lastname: lastName!,
      firstname: firstName!,
      email: faker.internet.email({
        firstName: firstName.toLowerCase(),
        lastName: lastName.toLowerCase(),
      }),
      username: faker.internet.username({
        firstName: firstName.toLowerCase(),
        lastName: lastName.toLowerCase(),
      }),
      password,
      contactnumber: faker.phone.number({
        style: "international",
      }),
      active,
    });

    // Assign a random position to the user
    const randomPosition = otherPositions[Math.floor(Math.random() * otherPositions.length)]!;
    await db.insert(userPositions).values({
      userId,
      positionId: randomPosition.id,
    });
  }

  console.log("Users seeding complete! Created 100 users (1 Kim Joseph Penaloza + 99 random)");
  // Count active vs inactive users

  const allUsers = await db
    .select({
      active: users.active,
    })
    .from(users);

  const activeCount = allUsers.filter((u) => u.active).length;
  const inactiveCount = allUsers.length - activeCount;

  console.log(`Total users: ${allUsers.length}`);
  console.log(`Active: ${activeCount}, Inactive: ${inactiveCount}`);
}
