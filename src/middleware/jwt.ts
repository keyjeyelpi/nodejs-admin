import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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

  // Unauthorized
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.sendStatus(401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const jwtSecret = process.env.JWT_SECRET;
    
    // Internal Server Error if secret is missing
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

    // attach user to request for later use
    (req as any).user = decoded;

    next();
  } catch (err) {
    // Forbidden (invalid token)
    return res.sendStatus(403); 
  }
};
