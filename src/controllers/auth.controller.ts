import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "../config/prisma.config.ts";
import { signature } from "../middleware/signature.middleware.ts";
import { decrypt } from "../utils/encryption.util.ts";
import bcrypt from "bcryptjs";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "";

router.post("/login", signature, async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: username }, { username }],
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(decrypt(password), user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.user_id, username: user.username }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login successful",
      data: { id: user.user_id, token },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
