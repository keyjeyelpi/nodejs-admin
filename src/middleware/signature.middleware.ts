import process from "node:process";
import dotenv from "dotenv";
import type { FastifyRequest, FastifyReply } from "fastify";
import { decrypt, encrypt } from "../utils/encryption.util.ts";

dotenv.config();

export const signature = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  if (!req.body)
    return reply.status(400).send({
      message: "Request body is missing",
    });

  const { signature, ...body } = req.body as { signature?: string; [key: string]: any };

  const predefinedSignature = Object.values(body)
    .map((v) => JSON.stringify(v))
    .join("");

  const errorResponse = (msg: string) =>
    reply.status(400).send({
      message: msg,
      signature:
        process.env.NODE_ENV === "development"
          ? encrypt(predefinedSignature)
          : undefined,
    });

  if (!signature) return errorResponse("Signature is required");

  if (decrypt(signature) !== predefinedSignature)
    return errorResponse("Invalid signature");
};
