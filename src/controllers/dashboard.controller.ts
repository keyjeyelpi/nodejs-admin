import type { FastifyRequest, FastifyReply } from "fastify";
import { sql, gte, lte, eq, and, desc, isNotNull } from "drizzle-orm";
import { db } from "../db/index.ts";
import { users } from "../db/schema/index.ts";
import countries, { type Countries, type Country } from "world-countries";

// Helper function to get date ranges
const getDateRange = (daysAgo: number, days: number = 7) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - daysAgo - days + 1);
    const end = new Date(now);
    end.setDate(now.getDate() - daysAgo);
    return { start, end };
};

// Helper for month ranges
const getMonthRange = (month: number) => {
    const now = new Date();
    const targetYear = now.getFullYear();

    const start = new Date(targetYear, month, 1);
    const end = new Date(targetYear, month + 1, 0);

    return { start, end };
};

export const getUserDashboard = async (
    req: FastifyRequest,
    reply: FastifyReply
) => {
    console.log("getUserDashboard accessed");

    try {
        const now = new Date();

        // Current week: last 7 days
        const currentWeek = getDateRange(0, 7);
        // Previous week: 7-14 days ago
        const previousWeek = getDateRange(7, 7);

        // Total users
        const totalUsersCurrent = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(
                and(
                    eq(users.active, true),
                    gte(users.createdAt, currentWeek.start),
                    lte(users.createdAt, currentWeek.end)
                )
            );

        const totalUsersPrevious = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(
                and(
                    eq(users.active, true),
                    gte(users.createdAt, previousWeek.start),
                    lte(users.createdAt, previousWeek.end)
                )
            );

        const totalUsersCurrentCount = totalUsersCurrent[0]?.count || 0;
        const totalUsersPreviousCount = totalUsersPrevious[0]?.count || 0;
        const totalUsersPercentage =
            totalUsersPreviousCount > 0
                ? (totalUsersCurrentCount / totalUsersPreviousCount) * 100
                : totalUsersCurrentCount > 0
                    ? 100
                    : 0;

        // New users (created in period)
        const newUsersCurrent = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(
                and(
                    gte(users.createdAt, currentWeek.start),
                    lte(users.createdAt, currentWeek.end)
                )
            );

        const newUsersPrevious = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(
                and(
                    gte(users.createdAt, previousWeek.start),
                    lte(users.createdAt, previousWeek.end)
                )
            );

        const newUsersCurrentCount = newUsersCurrent[0]?.count || 0;
        const newUsersPreviousCount = newUsersPrevious[0]?.count || 0;
        const newUsersPercentage =
            newUsersPreviousCount > 0
                ? (newUsersCurrentCount / newUsersPreviousCount) * 100
                : newUsersCurrentCount > 0
                    ? 100
                    : 0;

        // Inactive users: assume not logged in for 30 days
        const inactiveThreshold = new Date(now);
        inactiveThreshold.setDate(now.getDate() - 30);

        const inactiveUsersCurrent = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(
                and(
                    eq(users.active, true),
                    lte(users.lastLogin, inactiveThreshold),
                    gte(users.createdAt, currentWeek.start),
                    lte(users.createdAt, currentWeek.end)
                )
            );

        const inactiveUsersPrevious = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(
                and(
                    eq(users.active, true),
                    lte(users.lastLogin, inactiveThreshold),
                    gte(users.createdAt, previousWeek.start),
                    lte(users.createdAt, previousWeek.end)
                )
            );

        const inactiveUsersCurrentCount = inactiveUsersCurrent[0]?.count || 0;
        const inactiveUsersPreviousCount = inactiveUsersPrevious[0]?.count || 0;
        const inactiveUsersPercentage =
            inactiveUsersPreviousCount > 0
                ? (inactiveUsersCurrentCount / inactiveUsersPreviousCount) * 100
                : inactiveUsersCurrentCount > 0
                    ? 100
                    : 0;

        // Deactivated users
        const deactivatedUsersCurrent = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(
                and(
                    eq(users.active, false),
                    gte(users.updatedAt, currentWeek.start),
                    lte(users.updatedAt, currentWeek.end)
                )
            );

        const deactivatedUsersPrevious = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(
                and(
                    eq(users.active, false),
                    gte(users.updatedAt, previousWeek.start),
                    lte(users.updatedAt, previousWeek.end)
                )
            );

        const deactivatedUsersCurrentCount = deactivatedUsersCurrent[0]?.count || 0;
        const deactivatedUsersPreviousCount =
            deactivatedUsersPrevious[0]?.count || 0;
        const deactivatedUsersPercentage =
            deactivatedUsersPreviousCount > 0
                ? (deactivatedUsersCurrentCount / deactivatedUsersPreviousCount) * 100
                : deactivatedUsersCurrentCount > 0
                    ? 100
                    : 0;

        // Risk trends: last 12 months
        const totalUsersTrend = [];
        const newUsersTrend = [];
        const inactiveUsersTrend = [];
        const deactivatedUsersTrend = [];

        for (let i = 0; i <= 11; i++) {
            const { start, end } = getMonthRange(i);

            const total = await db
                .select({ count: sql<number>`count(*)` })
                .from(users)
                .where(
                    and(
                        eq(users.active, true),
                        gte(users.createdAt, start),
                        lte(users.createdAt, end)
                    )
                );

            const newU = await db
                .select({ count: sql<number>`count(*)` })
                .from(users)
                .where(and(gte(users.createdAt, start), lte(users.createdAt, end)));

            const inactive = await db
                .select({ count: sql<number>`count(*)` })
                .from(users)
                .where(
                    and(
                        eq(users.active, true),
                        lte(users.lastLogin, inactiveThreshold),
                        gte(users.createdAt, start),
                        lte(users.createdAt, end)
                    )
                );

            const deactivated = await db
                .select({ count: sql<number>`count(*)` })
                .from(users)
                .where(
                    and(
                        eq(users.active, false),
                        gte(users.updatedAt, start),
                        lte(users.updatedAt, end)
                    )
                );

            console.log({ i, start, end });
            console.log("Total users: ", total[0]?.count || 0);
            console.log("New users: ", newU[0]?.count || 0);
            console.log("Inactive users: ", inactive[0]?.count || 0);
            console.log("Deactivated users: ", deactivated[0]?.count || 0);

            totalUsersTrend.push(total[0]?.count || 0);
            newUsersTrend.push(newU[0]?.count || 0);
            inactiveUsersTrend.push(inactive[0]?.count || 0);
            deactivatedUsersTrend.push(deactivated[0]?.count || 0);
        }

        // Recent activity: most recent user login
        const recentLoginsResponse = await db
            .select({
                firstname: users.firstname,
                lastname: users.lastname,
                lastLogin: users.lastLogin,
            })
            .from(users)
            .where(and(eq(users.active, true), isNotNull(users.lastLogin)))
            .orderBy(desc(users.lastLogin))
            .limit(5);

        const recentLogins = recentLoginsResponse.map((recentLogin) => ({
            title: "Recent Activity",
            subTitle: `${recentLogin.firstname} ${recentLogin.lastname} logged in`,
            timestamp: recentLogin.lastLogin?.toISOString() || "",
        })) || [];

        // Locations
        const locationData = await db
            .select({
                country: users.country,
                count: sql<number>`count(*)`,
            })
            .from(users)
            .groupBy(users.country);

        const countryMap: Map<string, Country> = new Map(
            (countries as unknown as Countries).map((c) => [c.cca2, c])
        );

        const locations = locationData.map((item) => {
            const country = countryMap.get(item.country);

            if (!country) {
                return {
                    name: item.country,
                    count: item.count,
                    lat: 0,
                    lng: 0,
                };
            }

            return {
                name: country.name.common,
                count: item.count,
                lat: country.latlng[0],
                lng: country.latlng[1],
            };
        });

        reply.status(200).send({
            message: "User dashboard retrieved successfully",
            data: {
                totalUsers: {
                    current: totalUsersCurrentCount,
                    previous: totalUsersPreviousCount,
                    percentageDifference: totalUsersPercentage,
                },
                newUsers: {
                    current: newUsersCurrentCount,
                    previous: newUsersPreviousCount,
                    percentageDifference: newUsersPercentage,
                },
                inactiveUsers: {
                    current: inactiveUsersCurrentCount,
                    previous: inactiveUsersPreviousCount,
                    percentageDifference: inactiveUsersPercentage,
                },
                deactivatedUsers: {
                    current: deactivatedUsersCurrentCount,
                    previous: deactivatedUsersPreviousCount,
                    percentageDifference: deactivatedUsersPercentage,
                },
                riskTrends: {
                    totalUsers: totalUsersTrend,
                    newUsers: newUsersTrend,
                    inactiveUsers: inactiveUsersTrend,
                    deactivatedUsers: deactivatedUsersTrend,
                },
                recentLogins,
                locations,
            }
        });
    } catch (err) {
        console.error(err);
        return reply.status(500).send({
            message: "Server error",
            error: err,
        });
    }
};
