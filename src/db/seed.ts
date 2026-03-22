import { db } from "./index.js";
import { users, accountType, userSettings } from "./schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  console.log("Seeding database...");

  // Check if account types exist
  const existingAccountTypes = await db.select().from(accountType);
  
  let accountTypes = existingAccountTypes;
  
  // If no account types exist, create default ones
  if (accountTypes.length === 0) {
    console.log("Creating default account types...");
    await db.insert(accountType).values([
      {
        accountId: "admin",
        title: "Administrator",
        description: "Full system access",
        isEditable: false,
        isDeletable: false,
        isSelectable: true,
        allowedToEdit: true,
      },
      {
        accountId: "manager",
        title: "Manager",
        description: "Manage team and projects",
        isEditable: true,
        isDeletable: true,
        isSelectable: true,
        allowedToEdit: true,
      },
      {
        accountId: "user",
        title: "User",
        description: "Standard user access",
        isEditable: true,
        isDeletable: true,
        isSelectable: true,
        allowedToEdit: false,
      },
      {
        accountId: "guest",
        title: "Guest",
        description: "Limited guest access",
        isEditable: true,
        isDeletable: true,
        isSelectable: true,
        allowedToEdit: false,
      },
    ]);
    
    accountTypes = await db.select().from(accountType);
    console.log("Created account types:", accountTypes.map(a => a.title));
  }

  if (accountTypes.length === 0) {
    throw new Error("No account types available");
  }

  // Get the highest account type (first one in the list - typically admin)
  const highestAccountType = accountTypes[0];
  console.log("Highest account type:", highestAccountType.title);

  // First, delete existing users to avoid duplicates
  await db.delete(users);
  
  // Create Kim Joseph Penaloza as the first user
  const kimId = uuidv4();
  const hashedPassword = await bcrypt.hash("keyjeyelpi", 10);
  
  await db.insert(users).values({
    id: kimId,
    country: "Philippines",
    accountTypeId: highestAccountType.accountId,
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
    "United States", "United Kingdom", "Canada", "Australia", "Germany",
    "France", "Japan", "Singapore", "Philippines", "India"
  ];

  // Create 49 additional users
  for (let i = 0; i < 49; i++) {
    const userId = uuidv4();
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const country = countries[i % countries.length];
    const active = Math.random() > 0.5; // Random active status
    
    // Pick a random account type
    const randomAccountType = accountTypes[Math.floor(Math.random() * accountTypes.length)];
    
    const password = await bcrypt.hash("password123", 10);
    
    await db.insert(users).values({
      id: userId,
      country: country,
      accountTypeId: randomAccountType.accountId,
      lastname: lastName,
      firstname: firstName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`,
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
