import type { Request, Response } from "express";
import { prisma } from "../config/prisma.config.ts";
import { toCamelCase } from "../utils/caseConverter.util.ts";

export const fetchAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortOrder = (req.query.sortOrder as string) || "asc";
    const sortBy = (req.query.sortBy as string) || "lastname";
    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
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
          settings: true,
        },
      }),
      prisma.user.count(),
    ]);

    res.status(200).json({
      message: "",
      data: toCamelCase(users),
      count: users.length,
      totalCount,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const fetchUserByAccountID = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        settings: true,
      },
    });

    if (!user)
      return res.status(404).json({
        message: "User not found",
      });

    res.status(200).json({
      message: `Get user with ID ${id}`,
      data: toCamelCase(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      return res.status(400).json({
        message: "Email and password required",
      });

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser)
      return res.status(400).json({
        message: "User already exists",
      });

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { user_id } = req.params;

  if (!user_id)
    return res.status(400).json({
      message: "user_id is required",
    });

  try {
    const updatedUser = await prisma.user.update({
      where: {
        user_id,
      },
      data: req.body,
    });

    res.status(200).json({
      message: `User with ID ${user_id} updated`,
      data: toCamelCase(updatedUser),
    });
  } catch (err: any) {
    console.error(err);

    if (err.code === "P2025")
      return res.status(404).json({
        message: "User not found",
      });

    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { user_id } = req.params;

  if (!user_id)
    return res.status(400).json({
      message: "user_id is required",
    });

  try {
    await prisma.user.delete({
      where: {
        user_id,
      },
    });

    res.status(200).json({
      message: `User with ID ${user_id} deleted`,
    });
  } catch (err: any) {
    console.error(err);

    if (err.code === "P2025")
      return res.status(404).json({
        message: "User not found",
      });

    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};
