import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.ts";
import { roles } from "../db/schema/index.ts";
import { logUserAction } from "../utils/logger.util.ts";

export const fetchAllAccounts = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const accounts = await db.select().from(roles);

    // Log roles fetch
    await logUserAction({
      userId: (req as any).user?.sub || "unknown",
      functionName: "fetchAllAccounts",
      req,
    });

    reply.status(200).send({
      message: "",
      data: accounts,
    });
  } catch (err) {
    console.error(err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};
