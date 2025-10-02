import type { Request, Response } from "express";
import { v4 as uuid } from "uuid";

import { prisma } from "../config/prisma.config.ts";

import { decrypt, hash } from "../utils/encryption.util.ts";

export const fetchAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        account_type: {
          select: {
            title: true,
            is_editable: true,
            is_deletable: true,
            allowed_to_edit: true,
            is_selectable: true,
          },
        },
      },
    });

    res.status(200).json({ message: "", data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const fetchUserByAccountID = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: `Get user with ID ${id}`, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const {
    username,
    email,
    password,
    firstname,
    lastname,
    country,
    contactnumber,
    account_type_id,
  } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await prisma.user.create({
      data: {
        user_id: uuid(),
        username,
        email,
        password: await hash(decrypt(password)),
        contactnumber,
        account_type_id,
        firstname,
        lastname,
        country,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required" });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { user_id },
      data: req.body,
    });

    res.status(200).json({
      message: `User with ID ${user_id} updated`,
      data: updatedUser,
    });
  } catch (err: any) {
    console.error(err);
    if (err.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required" });
  }

  try {
    await prisma.user.delete({
      where: { user_id },
    });

    res.status(200).json({ message: `User with ID ${user_id} deleted` });
  } catch (err: any) {
    console.error(err);
    if (err.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Server error", error: err });
  }
};
