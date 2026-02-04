import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { accountType } from "../db/schema.js";

export const fetchAllAccounts = async (
  _req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const accounts = await db.select().from(accountType);

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
