import type { Request, Response } from "express";
import { prisma } from "../config/prisma.config.ts";

export const fetchUserSettings = async (req: Request, res: Response) => {
  const { user_id } = req.params;
  try {
    const settings = await prisma.user_settings.findUnique({
      where: { user_id: Number(user_id) },
    });
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }
    res.status(200).json({ message: "", data: settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const updateUserSettings = async (req: Request, res: Response) => {
  const { user_id } = req.params;
};
