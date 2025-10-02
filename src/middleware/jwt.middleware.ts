import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({
        message: "Authorization header missing or malformed",
        data: process.env.NODE_ENV === "development" ? authHeader ? authHeader: "No authorization header found" : undefined,
      });
  }

  const token = authHeader.split(" ")[1];

  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.sendStatus(500);
    }

    if (!token) {
      return res.sendStatus(401);
    }
    const decoded = jwt.verify(
      token as string,
      jwtSecret as string
    ) as unknown as JwtPayload;

    (req as any).user = decoded;

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: "TokenExpired",
        message: "Token has expired, please log in again.",
      });
    }

    return res.status(403).json({
      error: "InvalidToken",
      message: "Token is invalid.",
    });
  }
};
