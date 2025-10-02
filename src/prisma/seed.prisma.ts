import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.config.ts";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";
import { hash } from "../utils/encryption.util.ts";

dotenv.config();

const main = async () => {
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

  for (const [index, type] of accountTypes.entries()) {
    await prisma.accountType.upsert({
      where: { id: index + 1 },
      update: {},
      create: type,
    });
  }

  const superUserPassword = await hash();

  await prisma.user.upsert({
    where: { email: "kj.penaloza@gmail.com" },
    update: {},
    create: {
      user_id: uuid(),
      username: "keyjeyelpi",
      password: superUserPassword,
      firstname: "Kim Joseph",
      lastname: "Peñaloza",
      email: "kj.penaloza@gmail.com",
      country: "PH",
      account_type_id: accountTypes[0]?.account_id || "",
      contactnumber: "+639952585388",
    },
  });
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
