import type { FastifyReply, FastifyRequest } from "fastify";
import { sql } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { users } from "@/db/schema/index.ts";
import { logUserAction } from "@/utils/logger.util.ts";

export const getUsersAnalytics = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startOfNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const [analytics] = await db
      .select({
        totalUsers: sql<number>`count(*)`,
        activeUsers: sql<number>`sum(case when ${users.active} = true then 1 else 0 end)`,
        inactiveUsers: sql<number>`sum(case when ${users.active} = false then 1 else 0 end)`,
        newUsers: sql<number>`sum(case when ${users.createdAt} >= ${startOfMonth} and ${users.createdAt} < ${startOfNextMonth} then 1 else 0 end)`,
      })
      .from(users);

    await logUserAction({
      userId: (req as { user?: { sub?: string } }).user?.sub || "unknown",
      functionName: "getUsersAnalytics",
      req,
    });

    return reply.status(200).send({
      totalUsers: Number(analytics?.totalUsers || 0),
      activeUsers: Number(analytics?.activeUsers || 0),
      inactiveUsers: Number(analytics?.inactiveUsers || 0),
      newUsers: Number(analytics?.newUsers || 0),
    });
  } catch (error) {
    req.log.error(error, "Failed to retrieve user analytics");
    return reply.status(500).send({
      message: "Server error",
    });
  }
};
