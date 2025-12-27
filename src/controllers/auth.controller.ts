import process from "node:process";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.config.ts";
import { decrypt } from "../utils/encryption.util.ts";
import { toCamelCase } from "../utils/caseConverter.util.ts";

const JWT_SECRET = process.env.JWT_SECRET || "";

export const login = async (req: Request, res: Response) => {
  if (!req.body)
    return res.status(400).json({
      message: "Request body is missing",
    });

  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({
      message: "Username and password are required",
    });

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: username,
          },
          {
            username,
          },
        ],
      },
      include: {
        settings: true,
      },
    });

    if (!user)
      return res.status(401).json({
        message: "User does not exist",
      });

    const isMatch = await bcrypt.compare(decrypt(password), user.password);

    if (!isMatch)
      return res.status(401).json({
        message: "Invalid credentials",
      });

    const token = jwt.sign(
      { id: user.user_id, username: user.username },
      JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      message: "Login successful",
      data: {
        token,
        ...(toCamelCase(user) || {}),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};
