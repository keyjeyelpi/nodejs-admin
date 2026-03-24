import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.ts";
import { roles } from "../db/schema/index.ts";

export const fetchAllAccounts = async (
  _req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const accounts = await db.select().from(roles);

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
