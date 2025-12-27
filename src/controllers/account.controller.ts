import type { Request, Response } from "express";
import { prisma } from "../config/prisma.config.ts";

export const fetchAllAccounts = async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.accountType.findMany();

    res.status(200).json({
      message: "",
      data: accounts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};
