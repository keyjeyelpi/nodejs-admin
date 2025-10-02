import { Router, type Request, type Response } from "express";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { prisma } from "../config/prisma.config.ts";

const router = Router();

router.get("/", authenticateJWT, async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.accountType.findMany();
    
    res.status(200).json({ message: "", data: accounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
