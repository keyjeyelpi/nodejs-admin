import type { FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { logUserAction } from "@/utils/logger.util.ts";
import { users, userPositions } from "@/db/schema/index.ts";

const getCurrentUserId = (req: FastifyRequest): string => {
  return (req as any).user?.sub || "unknown";
};

export const deleteUser = async (
  req: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) => {
  console.log("deleteUser accessed");
  const { id } = req.params;

  if (!id)
    return reply.status(400).send({
      message: "id is required",
    });

  try {
    // Get current user to toggle their active status
    const [user] = await db
      .select({
        firstname: users.firstname,
        lastname: users.lastname,
        active: users.active,
      })
      .from(users)
      .where(eq(users.id, id));

    if (!user)
      return reply.status(404).send({
        message: `User with ID ${id} not found`,
      });

    // Toggle the active status
    const newActiveStatus = !user.active;

    await db
      .update(users)
      .set({
        active: newActiveStatus,
      })
      .where(eq(users.id, id));

    // Purge user-position associations when deactivating
    if (!newActiveStatus) {
      await db.delete(userPositions).where(eq(userPositions.userId, id));
    }

    // Log user delete (toggle active status)
    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "deleteUser",
      req,
    });

    reply.status(200).send({
      data: user.active,
      message: `${user.firstname + " " + user.lastname} has been ${newActiveStatus ? "activated" : "deactivated"}.`,
    });
  } catch (err: unknown) {
    console.error(err);

    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};
