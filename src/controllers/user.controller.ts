import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { users, accountTypes } from "../db/schema/index.ts";
import { desc, eq, asc, sql, or, and, like, type AnyColumn } from "drizzle-orm";
import { toCamelCase } from "../utils/case-converter.util.ts";
import type { QueryParams } from "../interfaces/general.interface.ts";
import type { UserBody } from "../interfaces/user.interface.js";

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
    const limit = parseInt(req.query.limit || "12");
    const search = (req.query.search as string) || "";
    const active = req.query.status !== undefined ? parseInt(req.query.status as string) : 0;
    const sortOrder = (req.query.sortOrder as string) || "asc";
    const sortByColumn = sortableColumns[req.query.sortBy as string] || users.lastname;
    const skip = (page - 1) * limit;

    // Build search condition
    const searchCondition = search
      ? or(
        eq(users.id, search),
        like(users.lastname, `%${search}%`),
        like(users.firstname, `%${search}%`),
        like(users.email, `%${search}%`),
        like(users.username, `%${search}%`),
        like(users.country, `%${search}%`),
        like(users.contactnumber, `%${search}%`)
      )
      : undefined;

    // Build active filter condition
    // active === 0: return all users
    // active === 1: return only active users
    // active === 2: return only inactive users
    let activeCondition;
    if (active === 1) {
      activeCondition = eq(users.active, true);
    } else if (active === 2) {
      activeCondition = eq(users.active, false);
    }

    // Combine search and active conditions
    const whereCondition = activeCondition
      ? searchCondition
        ? and(searchCondition, activeCondition)
        : activeCondition
      : searchCondition;

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
      active: users.active,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      accountType: {
        title: accountTypes.title,
        isEditable: accountTypes.isEditable,
        isDeletable: accountTypes.isDeletable,
        allowedToEdit: accountTypes.allowedToEdit,
        isSelectable: accountTypes.isSelectable,
      },
    })
      .from(users)
      .leftJoin(accountTypes, eq(users.accountTypeId, accountTypes.id))
      .where(whereCondition)
      .orderBy(sortOrder === "asc" ? asc(sortByColumn) : desc(sortByColumn))
      .limit(limit)
      .offset(skip);

    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereCondition);
    const totalCount = totalCountResult[0]?.count || 0;

    reply.status(200).send({
      data: toCamelCase(allUsers),
      total: totalCount,
      pageTotal: Math.ceil(totalCount / limit),
      page,
      limit,
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
    const user = await db.select({
      id: users.id,
      userId: users.id,
      country: users.country,
      accountTypeId: users.accountTypeId,
      lastname: users.lastname,
      firstname: users.firstname,
      email: users.email,
      username: users.username,
      contactnumber: users.contactnumber,
      active: users.active,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      accountType: {
        title: accountTypes.title,
        isEditable: accountTypes.isEditable,
        isDeletable: accountTypes.isDeletable,
        allowedToEdit: accountTypes.allowedToEdit,
        isSelectable: accountTypes.isSelectable,
      },
    })
      .from(users)
      .leftJoin(accountTypes, eq(users.accountTypeId, accountTypes.id))
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
  req: FastifyRequest<{ Body: UserBody }>,
  reply: FastifyReply
) => {
  console.log("createUser accessed");
  const { email, username, password, country, accountTypeId, lastname, firstname, contactnumber, active } = req.body || {};

  try {
    if (!email || !username || !password || !country || !accountTypeId || !lastname || !firstname || !contactnumber)
      return reply.status(400).send({
        message: "All fields are required",
      });

    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .then(rows => rows[0]);

    if (existingUser)
      return reply.status(400).send({
        message: "User already exists",
      });

    await db.insert(users)
      .values({
        id: crypto.randomUUID(),
        email,
        username,
        password,
        country,
        accountTypeId,
        lastname,
        firstname,
        contactnumber,
        active: active ?? true,
      });

    // Fetch the created user
    const [newUser] = await db.select({
      id: users.id,
      userId: users.id,
      country: users.country,
      accountTypeId: users.accountTypeId,
      lastname: users.lastname,
      firstname: users.firstname,
      email: users.email,
      username: users.username,
      contactnumber: users.contactnumber,
      active: users.active,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
      .from(users)
      .where(eq(users.email, email));

    reply.status(201).send({
      message: "User registered successfully",
      data: toCamelCase(newUser),
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
  req: FastifyRequest<{ Params: { id: string }; Body: UserBody }>,
  reply: FastifyReply
) => {
  console.log("updateUser accessed");
  const { id } = req.params;
  const { country, accountTypeId, lastname, firstname, email, username, contactnumber, active } = req.body || {};

  if (!id)
    return reply.status(400).send({
      message: "id is required",
    });

  try {
    // Check if user exists
    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.id, id));

    if (!existingUser)
      return reply.status(404).send({
        message: "User not found",
      });

    await db.update(users)
      .set({
        country,
        accountTypeId,
        lastname,
        firstname,
        email,
        username,
        contactnumber,
        active,
      })
      .where(eq(users.id, id));

    const [updatedUser] = await db.select({
      id: users.id,
      userId: users.id,
      country: users.country,
      accountTypeId: users.accountTypeId,
      lastname: users.lastname,
      firstname: users.firstname,
      email: users.email,
      username: users.username,
      contactnumber: users.contactnumber,
      active: users.active,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
      .from(users)
      .where(eq(users.id, id));

    reply.status(200).send({
      message: `User with ID ${id} updated`,
      data: toCamelCase(updatedUser),
    });
  } catch (err: unknown) {
    console.error(err);

    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const deleteUser = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  console.log("deleteUser accessed");
  const { id } = req.params;

  if (!id)
    return reply.status(400).send({
      message: "id is required",
    });

  try {
    // Get current user to toggle their active status
    const [user] = await db.select({ firstname: users.firstname, lastname: users.lastname, active: users.active })
      .from(users)
      .where(eq(users.id, id));

    if (!user) {
      return reply.status(404).send({
        message: `User with ID ${id} not found`,
      });
    }

    // Toggle the active status
    const newActiveStatus = !user.active;

    await db.update(users)
      .set({ active: newActiveStatus })
      .where(eq(users.id, id));

    reply.status(200).send({
      data: user.active,
      message: `${user.firstname + ' ' + user.lastname} has been ${newActiveStatus ? 'activated' : 'deactivated'}.`,
    });
  } catch (err: unknown) {
    console.error(err);

    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};
