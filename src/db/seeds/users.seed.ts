import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import { db } from "../index.ts";
import { users, roles } from "../schema/index.ts";

export async function seed() {
  console.log("Seeding users...");
  // Check if roles exist
  const rolesList = await db.select().from(roles);

  if (!rolesList.length) {
    console.error("No roles found. Please run roles.seed.ts first.");
    process.exit(1);
  }

  // Check if users already exist
  const existingUsers = await db.select().from(users);

  if (existingUsers.length > 0) {
    console.log("Users already exist, skipping...");
    console.log("Existing users count:", existingUsers.length);
    return;
  }

  // Get System Administrator role for Kim Joseph
  const systemAdminRole = rolesList.find(
    (r) => r.title === "System Administrator"
  );

  if (!systemAdminRole) {
    console.error("System Administrator role not found.");
    process.exit(1);
  }

  console.log("Using System Administrator role for Kim Joseph");
  // Create Kim Joseph Penaloza as the first user with System Administrator role
  const kimId = uuidv4();
  const hashedPassword = await bcrypt.hash("keyjeyelpi", 10);

  await db.insert(users).values({
    id: kimId,
    country: "PH",
    roleId: systemAdminRole.id,
    lastname: "Penaloza",
    firstname: "Kim Joseph",
    email: "kj.penaloza@gmail.com",
    username: "keyjeyelpi",
    password: hashedPassword,
    contactnumber: "+63 123 456 7890",
    active: true,
  });

  console.log("Created Kim Joseph Penaloza with System Administrator role");
  // Get other roles for random users (exclude System Administrator)

  const otherRoles = rolesList.filter(
    (r) => r.title !== "System Administrator"
  );

  // Create 49 additional users
  for (let i = 0; i < 99; i++) {
    const userId = uuidv4();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const country = faker.location.countryCode();
    const active = i % 2 === 0;

    // Pick a random role (from other roles, not System Administrator)
    const randomRole =
      otherRoles[Math.floor(Math.random() * otherRoles.length)]!;

    const password = await bcrypt.hash("password123", 10);

    await db.insert(users).values({
      id: userId,
      country,
      roleId: randomRole.id,
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
  }

  console.log(
    "Users seeding complete! Created 50 users (1 Kim Joseph Penaloza + 49 random)"
  );

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
