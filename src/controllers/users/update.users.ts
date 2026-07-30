import type { FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { toCamelCase } from "@/utils/case-converter.util.ts";
import type { UserBody } from "@/interfaces/user.interface.ts";
import { logUserAction } from "@/utils/logger.util.ts";
import { getCurrentUTCTime } from "@/utils/date.util.ts";
import { users, userPositions } from "@/db/schema/index.ts";

const getCurrentUserId = (req: FastifyRequest): string => {
  return (req as any).user?.sub || "unknown";
};

export const updateUser = async (
  req: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: UserBody;
  }>,
  reply: FastifyReply
) => {
  console.log("updateUser accessed");
  const { id } = req.params;
  const {
    country,
    positions: positionIds,
    lastname,
    firstname,
    email,
    username,
    contactnumber,
    active,
  } = req.body || {};

  if (!id)
    return reply.status(400).send({
      message: "id is required",
    });

  try {
    // Check if user exists
    const [existingUser] = await db.select().from(users).where(eq(users.id, id));

    if (!existingUser)
      return reply.status(404).send({
        message: "User not found",
      });

    await db
      .update(users)
      .set({
        country,
        lastname,
        firstname,
        email,
        username,
        contactnumber,
        active,
        updatedAt: getCurrentUTCTime(),
      })
      .where(eq(users.id, id));

    // Update user-position associations: delete existing, insert new
    if (positionIds !== undefined) {
      await db.delete(userPositions).where(eq(userPositions.userId, id));

      if (positionIds.length > 0) {
        await db.insert(userPositions).values(
          positionIds.map((positionId) => ({
            userId: id,
            positionId,
          }))
        );
      }
    }

    const [updatedUser] = await db
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
      .where(eq(users.id, id));

    // Log user update
    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "updateUser",
      req,
    });

    reply.status(200).send({
      message: `User with ID ${id} updated`,
      data: toCamelCase(updatedUser),
    });
  } catch (err: unknown) {
    console.error(err);

    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};
