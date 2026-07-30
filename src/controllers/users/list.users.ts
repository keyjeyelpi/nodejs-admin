import type { FastifyRequest, FastifyReply } from "fastify";
import { desc, eq, asc, sql, or, and, like, type AnyColumn } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { toCamelCase } from "@/utils/case-converter.util.ts";
import type { QueryParams } from "@/interfaces/general.interface.ts";
import { logUserAction } from "@/utils/logger.util.ts";
import { users, userPositions, positions } from "@/db/schema/index.ts";

const getCurrentUserId = (req: FastifyRequest): string => {
  return (req as any).user?.sub || "unknown";
};

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
  updatedAt: users.updatedAt,
  lastLogin: users.lastLogin,
};

export const getListUsers = async (
  req: FastifyRequest<{ Querystring: QueryParams }>,
  reply: FastifyReply
) => {
  try {
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "12");
    const search = (req.query.search as string) || "";

    const active = !!req.query.status ? parseInt(req.query.status as string) : 0;

    const sortOrder = (req.query.sortOrder as string) || "asc";

    const sortByColumn = sortableColumns[req.query.sortBy as string] || users.lastname;

    const skip = (page - 1) * limit;

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

    let activeCondition;

    if (active === 1) activeCondition = eq(users.active, true);
    else if (active === 2) activeCondition = eq(users.active, false);

    const whereCondition = activeCondition
      ? searchCondition
        ? and(searchCondition, activeCondition)
        : activeCondition
      : searchCondition;

    const rows = await db
      .select({
        id: users.id,
        country: users.country,
        lastname: users.lastname,
        firstname: users.firstname,
        email: users.email,
        contactnumber: users.contactnumber,
        active: users.active,
        updatedAt: users.updatedAt,
        lastLogin: users.lastLogin,
        position: {
          id: positions.id,
          name: positions.name,
          description: positions.description,
          systemGenerated: positions.systemGenerated,
        },
      })
      .from(users)
      .leftJoin(userPositions, eq(users.id, userPositions.userId))
      .leftJoin(positions, eq(userPositions.positionId, positions.id))
      .where(whereCondition)
      .orderBy(sortOrder === "asc" ? asc(sortByColumn) : desc(sortByColumn))
      .limit(limit)
      .offset(skip);

    const allUsers = Object.values(
      rows.reduce<Record<string, any>>((acc, { position, ...userFields }) => {
        if (!acc[userFields.id]) {
          acc[userFields.id] = { ...userFields, positions: [] };
        }

        if (position?.id) {
          acc[userFields.id].positions.push(position);
        }

        return acc;
      }, {})
    );

    const totalCountResult = await db
      .select({
        count: sql`count(*)`,
      })
      .from(users)
      .where(whereCondition);

    const totalCount = totalCountResult[0]?.count || 0;

    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "getListUsers",
      req,
    });

    return reply.status(200).send({
      data: toCamelCase(allUsers),
      total: totalCount,
      pageTotal: Math.ceil(Number(totalCount) / limit),
      page,
      limit,
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};
