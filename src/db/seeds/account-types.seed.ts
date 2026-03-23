import { db } from "../index.ts";
import { accountTypes } from "../schema/index.ts";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  console.log("Seeding database...");

  // Check if account types exist
  const existingAccountTypes = await db.select().from(accountTypes);

  let accountTypesList = existingAccountTypes;

  // If no account types exist, create default ones
  if (accountTypesList.length === 0) {
    console.log("Creating default account types...");
    await db.insert(accountTypes).values([
      {
        id: uuidv4(),
        title: "Administrator",
        description: "Full system access",
        isEditable: false,
        isDeletable: false,
        isSelectable: true,
        allowedToEdit: true,
      },
      {
        id: uuidv4(),
        title: "Manager",
        description: "Manage team and projects",
        isEditable: true,
        isDeletable: true,
        isSelectable: true,
        allowedToEdit: true,
      },
      {
        id: uuidv4(),
        title: "User",
        description: "Standard user access",
        isEditable: true,
        isDeletable: true,
        isSelectable: true,
        allowedToEdit: false,
      },
      {
        id: uuidv4(),
        title: "Guest",
        description: "Limited guest access",
        isEditable: true,
        isDeletable: true,
        isSelectable: true,
        allowedToEdit: false,
      },
    ]);

    accountTypesList = await db.select().from(accountTypes);
    console.log("Created account types:", accountTypesList.map(a => a.title));
  }

  if (accountTypesList.length === 0) {
    throw new Error("No account types available");
  }

  // Get the highest account type (first one in the list - typically admin)
  const highestAccountType = accountTypesList[0]!;
  console.log("Highest account type:", highestAccountType.title);

  // First, delete existing users to avoid duplicates
  await db.delete(users);

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

  // Create user settings for Kim
  await db.insert(userSettings).values({
    userId: kimId,
    colorPrimary: "#007bff",
    colorSecondary: "#6c757d",
    darkModePreference: "system",
  });

  console.log("Created Kim Joseph Penaloza with highest account type");

  // Generate 49 more users with random active status
  const firstNames = [
    "John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa",
    "James", "Mary", "William", "Jennifer", "Thomas", "Linda", "Christopher", "Patricia",
    "Daniel", "Barbara", "Matthew", "Susan", "Anthony", "Jessica", "Mark", "Nancy",
    "Donald", "Karen", "Steven", "Lisa", "Paul", "Betty", "Andrew", "Margaret",
    "Joshua", "Sandra", "Kenneth", "Ashley", "Kevin", "Kimberly", "Brian", "Donna",
    "George", "Carol", "Edward", "Michelle", "Ronald", "Dorothy", "Timothy", "Carolyn"
  ];

  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
    "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
    "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
    "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell"
  ];

  const countries = [
    "US", "UK", "CA", "AU", "DE",
    "FR", "JP", "SG", "PH", "IN"
  ];

  // Create 49 additional users
  for (let i = 0; i < 49; i++) {
    const userId = uuidv4();
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const country = countries[i % countries.length];
    const active = Math.random() > 0.5; // Random active status

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

    // Create user settings
    await db.insert(userSettings).values({
      userId: userId,
      colorPrimary: "#007bff",
      colorSecondary: "#6c757d",
      darkModePreference: "system",
    });
  }

  console.log("Seeding complete! Created 50 users (1 Kim Joseph Penaloza + 49 random)");

  // Count active vs inactive users
  const allUsers = await db.select({ active: users.active }).from(users);
  const activeCount = allUsers.filter(u => u.active).length;
  const inactiveCount = allUsers.length - activeCount;

  console.log(`Total users: ${allUsers.length}`);
  console.log(`Active: ${activeCount}, Inactive: ${inactiveCount}`);
}

seed()
  .then(() => {
    console.log("Seed completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
