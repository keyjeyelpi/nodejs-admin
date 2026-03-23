import { db } from "../index.ts";
import { users, accountTypes } from "../schema/index.ts";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";

export async function seed() {
  console.log("Seeding users...");

  // Check if account types exist
  const accountTypesList = await db.select().from(accountTypes);

  if (accountTypesList.length === 0) {
    console.error("No account types found. Please run account-types.seed.ts first.");
    process.exit(1);
  }

  // Check if users already exist
  const existingUsers = await db.select().from(users);

  if (existingUsers.length > 0) {
    console.log("Users already exist, skipping...");
    console.log("Existing users count:", existingUsers.length);
    return;
  }

  // Get the first account type (typically admin)
  const highestAccountType = accountTypesList[0]!;
  console.log("Using account type:", highestAccountType.title);

  // Create Kim Joseph Penaloza as the first user
  const kimId = uuidv4();
  const hashedPassword = await bcrypt.hash("keyjeyelpi", 10);

  await db.insert(users).values({
    id: kimId,
    country: "PH",
    accountTypeId: highestAccountType.id,
    lastname: "Penaloza",
    firstname: "Kim Joseph",
    email: "kj.penaloza@gmail.com",
    username: "keyjeyelpi",
    password: hashedPassword,
    contactnumber: "+63 123 456 7890",
    active: true,
  });

  console.log("Created Kim Joseph Penaloza with highest account type");

  // Create 49 additional users
  for (let i = 0; i < 99; i++) {
    const userId = uuidv4();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const country = faker.location.countryCode();
    const active = i % 2 === 0;

    // Pick a random account type
    const randomAccountType = accountTypesList[Math.floor(Math.random() * accountTypesList.length)]!;

    const password = await bcrypt.hash("password123", 10);

    await db.insert(users).values({
      id: userId,
      country: country,
      accountTypeId: randomAccountType.id,
      lastname: lastName!,
      firstname: firstName!,
      email: `${firstName!.toLowerCase()}.${lastName!.toLowerCase()}${i}@example.com`,
      username: `${firstName!.toLowerCase()}${lastName!.toLowerCase()}${i}`,
      password: password,
      contactnumber: `+1 555 ${String(1000 + i).padStart(4, "0")}`,
      active: active,
    });
  }

  console.log("Users seeding complete! Created 50 users (1 Kim Joseph Penaloza + 49 random)");

  // Count active vs inactive users
  const allUsers = await db.select({ active: users.active }).from(users);
  const activeCount = allUsers.filter(u => u.active).length;
  const inactiveCount = allUsers.length - activeCount;

  console.log(`Total users: ${allUsers.length}`);
  console.log(`Active: ${activeCount}, Inactive: ${inactiveCount}`);
}
