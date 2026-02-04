import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { users, accountType } from "../db/schema.js";
import { desc, eq, asc, sql, type AnyColumn } from "drizzle-orm";
import { toCamelCase } from "../utils/caseConverter.util.js";

interface QueryParams {
  page?: string;
  limit?: string;
  sortOrder?: string;
  sortBy?: string;
}

// Mapping for sortable columns
const sortableColumns: Record<string, AnyColumn> = {
  id: users.id,
  lastname: users.lastname,
  firstname: users.firstname,
  email: users.email,
  username: users.username,
  country: users.country,
  contactnumber: users.contactnumber,
  createdAt: users.createdAt,
};

export const fetchAllUsers = async (
  req: FastifyRequest<{ Querystring: QueryParams }>,
  reply: FastifyReply
) => {
  console.log("fetchAllUsers accessed");
  try {
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "10");
    const sortOrder = (req.query.sortOrder as string) || "asc";
    const sortByColumn = sortableColumns[req.query.sortBy as string] || users.lastname;
    const skip = (page - 1) * limit;

    const allUsers = await db.select({
      id: users.id,
      userId: users.id,
      country: users.country,
      accountTypeId: users.accountTypeId,
      lastname: users.lastname,
      firstname: users.firstname,
      email: users.email,
      username: users.username,
      contactnumber: users.contactnumber,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      accountType: {
        title: accountType.title,
        isEditable: accountType.isEditable,
        isDeletable: accountType.isDeletable,
        allowedToEdit: accountType.allowedToEdit,
        isSelectable: accountType.isSelectable,
      },
    })
      .from(users)
      .leftJoin(accountType, eq(users.accountTypeId, accountType.accountId))
      .orderBy(sortOrder === "asc" ? asc(sortByColumn) : desc(sortByColumn))
      .limit(limit)
      .offset(skip);

    const totalCountResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalCount = totalCountResult[0]?.count || 0;

    reply.status(200).send({
      data: {
        users: toCamelCase(allUsers),
        total: totalCount,
        page,
        limit,
      },
    });
  } catch (err) {
    console.error(err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const fetchUserByAccountID = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  console.log("fetchUserByAccountID accessed");
  const { id } = req.params;

  try {
    const user = await db.select()
      .from(users)
      .leftJoin(accountType, eq(users.accountTypeId, accountType.accountId))
      .where(eq(users.id, id))
      .then(rows => rows[0]);

    if (!user)
      return reply.status(404).send({
        message: "User not found",
      });

    reply.status(200).send({
      message: `Get user with ID ${id}`,
      data: toCamelCase(user),
    });
  } catch (err) {
    console.error(err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const createUser = async (
  req: FastifyRequest<{ Body: { email?: string; password?: string } }>,
  reply: FastifyReply
) => {
  console.log("createUser accessed");
  const { email, password } = req.body || {};

  try {
    if (!email || !password)
      return reply.status(400).send({
        message: "Email and password required",
      });

    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .then(rows => rows[0]);

    if (existingUser)
      return reply.status(400).send({
        message: "User already exists",
      });

    reply.status(201).send({
      message: "User registered successfully",
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const updateUser = async (
  req: FastifyRequest<{ Params: { user_id: string }; Body: Record<string, unknown> }>,
  reply: FastifyReply
) => {
  console.log("updateUser accessed");
  const { user_id } = req.params;

  if (!user_id)
    return reply.status(400).send({
      message: "user_id is required",
    });

  try {
    await db.update(users)
      .set(req.body)
      .where(eq(users.id, user_id));

    reply.status(200).send({
      message: `User with ID ${user_id} updated`,
    });
  } catch (err: unknown) {
    console.error(err);

    // Check for record not found error (drizzle throws different errors)
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ER_ROW_IS_REFERENCED_2') {
      return reply.status(404).send({
        message: "User not found",
      });
    }

    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const deleteUser = async (
  req: FastifyRequest<{ Params: { user_id: string } }>,
  reply: FastifyReply
) => {
  console.log("deleteUser accessed");
  const { user_id } = req.params;

  if (!user_id)
    return reply.status(400).send({
      message: "user_id is required",
    });

  try {
    await db.delete(users)
      .where(eq(users.id, user_id));

    reply.status(200).send({
      message: `User with ID ${user_id} deleted`,
    });
  } catch (err: unknown) {
    console.error(err);

    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};
