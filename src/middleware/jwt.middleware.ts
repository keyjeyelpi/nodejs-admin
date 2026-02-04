import process from "node:process";
import type { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

export const authenticateJWT = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  console.log("[JWTMiddleware] authenticateJWT accessed for path:", req.url);
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return reply.status(401).send({
      message: "Authorization header missing or malformed",
      data:
        process.env.NODE_ENV === "development"
          ? authHeader || "No authorization header found"
          : undefined,
    });

  const [, token] = authHeader.split(" ");

  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) return reply.status(500).send({ error: "Server misconfiguration" });

    if (!token) return reply.status(401).send({ error: "Token missing" });

    (req as any).user = jwt.verify(
      token as string,
      jwtSecret as string
    ) as unknown as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError)
      return reply.status(401).send({
        error: "TokenExpired",
        message: "Token has expired, please log in again.",
      });

    return reply.status(403).send({
      error: "InvalidToken",
      message: "Token is invalid.",
    });
  }
};
