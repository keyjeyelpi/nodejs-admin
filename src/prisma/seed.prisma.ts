import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";
import { prisma } from "../config/prisma.config.ts";
import { hash } from "../utils/encryption.util.ts";

dotenv.config();

const seedAccountTypes = async () => {
  console.log("👥 Seeding account types...");
  const accountTypes = [
    {
      account_id: uuid(),
      title: "Super Admin",
      description: "Has all permissions",
      is_editable: false,
      is_deletable: false,
      allowed_to_edit: true,
      is_selectable: false,
    },
    {
      account_id: uuid(),
      title: "Admin",
      description: "Can manage users and data",
      is_editable: true,
      is_deletable: true,
      allowed_to_edit: true,
      is_selectable: true,
    },
    {
      account_id: uuid(),
      title: "User",
      description: "Regular user account",
      is_editable: true,
      is_deletable: true,
      allowed_to_edit: false,
      is_selectable: true,
    },
  ];

  const createdAccountTypes = [];

  for (const [index, type] of accountTypes.entries()) {
    const accountType = await prisma.accountType.create({
      data: {
        id: index + 1,
        ...type,
      },
    });

    createdAccountTypes.push(accountType);
  }

  return createdAccountTypes;
};

const seedUsers = async (createdAccountTypes: any[]) => {
  console.log("👤 Creating users...");
  const password = await hash("Keyjeyelpi");

  const users = [];

  // Super user
  const superUser = await prisma.user.create({
    data: {
      user_id: uuid(),
      username: "keyjeyelpi",
      password: password,
      firstname: "Kim Joseph",
      lastname: "Peñaloza",
      email: "kj.penaloza@gmail.com",
      country: "PH",
      account_type_id: createdAccountTypes[0]?.account_id || "",
      contactnumber: "+639952585388",
    },
  });
  users.push(superUser);

  // Additional users
  const additionalUsersData = [
    { username: "admin1", firstname: "Alice", lastname: "Smith", email: "alice@example.com", country: "US", contactnumber: "+1234567890", accountTypeIndex: 1 },
    { username: "admin2", firstname: "Bob", lastname: "Johnson", email: "bob@example.com", country: "US", contactnumber: "+1234567891", accountTypeIndex: 1 },
    { username: "admin3", firstname: "Charlie", lastname: "Brown", email: "charlie@example.com", country: "US", contactnumber: "+1234567892", accountTypeIndex: 1 },
    { username: "admin4", firstname: "Diana", lastname: "Prince", email: "diana@example.com", country: "US", contactnumber: "+1234567893", accountTypeIndex: 1 },
    { username: "admin5", firstname: "Eve", lastname: "Adams", email: "eve@example.com", country: "US", contactnumber: "+1234567894", accountTypeIndex: 1 },
    { username: "user1", firstname: "Frank", lastname: "Miller", email: "frank@example.com", country: "US", contactnumber: "+1234567895", accountTypeIndex: 2 },
    { username: "user2", firstname: "Grace", lastname: "Lee", email: "grace@example.com", country: "US", contactnumber: "+1234567896", accountTypeIndex: 2 },
    { username: "user3", firstname: "Henry", lastname: "Wilson", email: "henry@example.com", country: "US", contactnumber: "+1234567897", accountTypeIndex: 2 },
    { username: "user4", firstname: "Ivy", lastname: "Davis", email: "ivy@example.com", country: "US", contactnumber: "+1234567898", accountTypeIndex: 2 },
    { username: "user5", firstname: "Jack", lastname: "Garcia", email: "jack@example.com", country: "US", contactnumber: "+1234567899", accountTypeIndex: 2 },
  ];

  for (const userData of additionalUsersData) {
    const user = await prisma.user.create({
      data: {
        user_id: uuid(),
        username: userData.username,
        password: password,
        firstname: userData.firstname,
        lastname: userData.lastname,
        email: userData.email,
        country: userData.country,
        account_type_id: createdAccountTypes[userData.accountTypeIndex]?.account_id || "",
        contactnumber: userData.contactnumber,
      },
    });
    users.push(user);
  }

  return users;
};

const seedUserSettings = async (users: any[]) => {
  console.log("⚙️ Creating user settings...");
  for (const user of users) {
    await prisma.user_settings.create({
      data: {
        user_id: user.id,
        color_primary: "#1976d2",
        color_secondary: "#dc004e",
        dark_mode_preference: "system",
      },
    });
  }
};

const seedKanban = async (users: any[]) => {
  console.log("📋 Creating kanban boards and importing data...");
  // Read and parse the kanban data JSON file
  const kanbanDataPath = join(process.cwd(), "src", "data", "kanban.data.json");
  const rawData = readFileSync(kanbanDataPath, "utf8");

  // Remove BOM if present
  const cleanData =
    rawData.charCodeAt(0) === 0xfeff ? rawData.slice(1) : rawData;

  const kanbanData = JSON.parse(cleanData);

  const boardNames = [
    "Project Management Board",
    "Development Board",
    "Design Board",
    "Testing Board"
  ];

  const priorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
  const statuses = ['TO_DO', 'DONE', 'REVIEW', 'PROCESS'];

  for (const boardName of boardNames) {
    // Create a kanban board
    const board = await prisma.kanbanBoard.create({
      data: {
        id: uuid(),
        name: boardName,
      },
    });

    console.log(`📝 Creating columns and cards for board: ${boardName}...`);
    // Process each column from the JSON data

    for (const [index, columnData] of kanbanData.entries()) {
      const column = await prisma.kanbanColumn.create({
        data: {
          id: uuid(), // Generate new UUID for each column per board
          name: columnData.name,
          disableAdd: columnData.disableAdd || false,
          order: index,
          boardId: board.id,
        },
      });

      // Process each card in the column
      for (const item of columnData.items) {
        // Truncate description if too long (MySQL VARCHAR limit)
        let { description } = item.content;

        if (description && description.length > 100) {
          // Remove HTML tags and truncate
          description =
            description.replace(/<[^>]*>/g, "").substring(0, 100) + "...";
        }

        const card = await prisma.kanbanCard.create({
          data: {
            id: uuid(), // Generate new UUID for each card per board
            title: item.content.title,
            description: description || "",
            categoryTitle: item.content.category.label,
            categoryColor: item.content.category.color,
            priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
            status: statuses[Math.floor(Math.random() * statuses.length)] as any,
            likes: item.content.likes,
            kanbanColumnId: column.id,
          },
        });

        // Process comments for the card
        if (item.content.comments && item.content.comments.length > 0)
          for (const comment of item.content.comments) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const createdComment = await prisma.kanbanComment.create({
              data: {
                id: uuid(), // Generate unique UUID for each comment
                text: comment.text,
                user_id: randomUser.user_id,
                kanbanCardId: card.id,
              },
            });

            // Process replies if they exist
            if (comment.replies && comment.replies.length > 0)
              for (const reply of comment.replies) {
                const randomReplyUser = users[Math.floor(Math.random() * users.length)];
                await prisma.kanbanComment.create({
                  data: {
                    id: uuid(), // Generate unique UUID for each reply
                    text: reply.text,
                    user_id: randomReplyUser.user_id,
                    kanbanCardId: card.id,
                    replyForKanbanCommentId: createdComment.id, // Reference the parent comment
                  },
                });
              }
          }
      }
    }
  }

  return kanbanData.length;
};

const main = async () => {
  console.log("🌱 Starting database seeding...");
  // Clear existing data in correct order (due to foreign key constraints)
  console.log("🧹 Cleaning existing data...");
  await prisma.kanbanComment.deleteMany();
  await prisma.kanbanCard.deleteMany();
  await prisma.kanbanColumn.deleteMany();
  await prisma.kanbanBoard.deleteMany();
  await prisma.user_settings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.accountType.deleteMany();

  const createdAccountTypes = await seedAccountTypes();
  const users = await seedUsers(createdAccountTypes);
  await seedUserSettings(users);
  const columnsPerBoard = await seedKanban(users);

  console.log("✅ Database seeding completed successfully!");
  console.log(`Created ${createdAccountTypes.length} account types`);
  console.log(`Created ${users.length} users with settings`);
  console.log(`Created 4 kanban boards from JSON data`);
  console.log(
    `Processed ${columnsPerBoard} columns per board with all cards and comments`
  );
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
