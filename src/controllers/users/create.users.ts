import type { FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { toCamelCase } from "@/utils/case-converter.util.ts";
import type { UserBody } from "@/interfaces/user.interface.ts";
import { logUserAction } from "@/utils/logger.util.ts";
import { users, userPositions } from "@/db/schema/index.ts";

export const createUser = async (req: FastifyRequest<{ Body: UserBody }>, reply: FastifyReply) => {
  console.log("createUser accessed");

  const {
    email,
    username,
    password,
    country,
    positions: positionIds,
    lastname,
    firstname,
    contactnumber,
    active,
  } = req.body || {};

  try {
    if (
      !email ||
      !username ||
      !password ||
      !country ||
      !positionIds ||
      positionIds.length === 0 ||
      !lastname ||
      !firstname ||
      !contactnumber
    )
      return reply.status(400).send({
        message: "All fields are required",
      });

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .then((rows) => rows[0]);

    if (existingUser)
      return reply.status(400).send({
        message: "User already exists",
      });

    const userId = crypto.randomUUID();

    await db.insert(users).values({
      id: userId,
      email,
      username,
      password,
      country,
      lastname,
      firstname,
      contactnumber,
      active: active ?? true,
    });

    // Insert user-position associations
    if (positionIds.length > 0) {
      await db.insert(userPositions).values(
        positionIds.map((positionId) => ({
          userId,
          positionId,
        }))
      );
    }

    // Fetch the created user
    const [newUser] = await db
      .select({
        id: users.id,
        userId: users.id,
        country: users.country,
        lastname: users.lastname,
        firstname: users.firstname,
        email: users.email,
        username: users.username,
        contactnumber: users.contactnumber,
        active: users.active,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.email, email));

    // Log user creation
    if (newUser)
      await logUserAction({
        userId: newUser.id,
        functionName: "createUser",
        req,
      });

    reply.status(201).send({
      message: "User registered successfully",
      data: toCamelCase(newUser),
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};
