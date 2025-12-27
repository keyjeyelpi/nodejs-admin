import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";
import { prisma } from "../config/prisma.config.ts";
import { hash } from "../utils/encryption.util.ts";

dotenv.config();

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

  console.log("👤 Creating super user...");
  const superUserPassword = await hash();

  const superUser = await prisma.user.create({
    data: {
      user_id: uuid(),
      username: "keyjeyelpi",
      password: superUserPassword,
      firstname: "Kim Joseph",
      lastname: "Peñaloza",
      email: "kj.penaloza@gmail.com",
      country: "PH",
      account_type_id: createdAccountTypes[0]?.account_id || "", // Use account_id (String) not id (Int)
      contactnumber: "+639952585388",
    },
  });

  // Create user settings for super user
  await prisma.user_settings.create({
    data: {
      user_id: superUser.id, // Use id (Int) not user_id (String)
      color_primary: "#1976d2",
      color_secondary: "#dc004e",
      dark_mode_preference: "system",
    },
  });

  console.log("📋 Creating kanban board and importing data...");
  // Read and parse the kanban data JSON file
  const kanbanDataPath = join(process.cwd(), "src", "data", "kanban.data.json");
  const rawData = readFileSync(kanbanDataPath, "utf8");

  // Remove BOM if present
  const cleanData =
    rawData.charCodeAt(0) === 0xfeff ? rawData.slice(1) : rawData;

  const kanbanData = JSON.parse(cleanData);

  // Create a main kanban board
  const mainBoard = await prisma.kanbanBoard.create({
    data: {
      id: uuid(),
      name: "Project Management Board",
    },
  });

  console.log("📝 Creating columns and cards from JSON data...");
  // Process each column from the JSON data

  for (const columnData of kanbanData) {
    const column = await prisma.kanbanColumn.create({
      data: {
        id: columnData.id,
        name: columnData.name,
        disableAdd: columnData.disableAdd || false,
        boardId: mainBoard.id,
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
          id: item.id,
          title: item.content.title,
          description: description || "",
          categoryTitle: item.content.category.label,
          categoryColor: item.content.category.color,
          likes: item.content.likes,
          kanbanColumnId: column.id,
        },
      });

      // Process comments for the card
      if (item.content.comments && item.content.comments.length > 0)
        for (const comment of item.content.comments) {
          const createdComment = await prisma.kanbanComment.create({
            data: {
              id: uuid(), // Generate unique UUID for each comment
              text: comment.text,
              author: comment.author,
              kanbanCardId: card.id,
            },
          });

          // Process replies if they exist
          if (comment.replies && comment.replies.length > 0)
            for (const reply of comment.replies) {
              await prisma.kanbanComment.create({
                data: {
                  id: uuid(), // Generate unique UUID for each reply
                  text: reply.text,
                  author: reply.author,
                  kanbanCardId: card.id,
                  replyForKanbanCardId: createdComment.id, // Reference the parent comment
                },
              });
            }
        }
    }
  }

  console.log("✅ Database seeding completed successfully!");
  console.log(`Created ${createdAccountTypes.length} account types`);
  console.log(`Created 1 super user with settings`);
  console.log(`Created 1 kanban board from JSON data`);
  console.log(
    `Processed ${kanbanData.length} columns with all cards and comments`
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
