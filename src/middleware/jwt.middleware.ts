import type { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

export const authenticateJWT = async (req: FastifyRequest, reply: FastifyReply) => {
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

    if (!jwtSecret) {
      console.error("JWT_SECRET is not defined in environment variables");
      return reply.status(500).send({
        error: "Server misconfiguration",
      });
    }

    if (!token) {
      console.warn("Token is missing in the Authorization header");
      return reply.status(401).send({
        error: "Token missing",
      });
    }

    (req as any).user = jwt.verify(
      token as string,
      jwtSecret as string
    ) as unknown as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      console.warn("JWT token has expired:", err);
      return reply.status(401).send({
        error: "TokenExpired",
        message: "Token has expired, please log in again.",
      });
    }

    console.error("JWT verification failed:", err);

    return reply.status(403).send({
      error: "InvalidToken",
      message: "Token is invalid.",
    });
  }
};
