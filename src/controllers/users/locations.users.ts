import type { FastifyRequest, FastifyReply } from "fastify";
import { sql } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { logUserAction } from "@/utils/logger.util.ts";
import { users } from "@/db/schema/index.ts";
import countries, { type Countries, type Country } from "world-countries";

const getCurrentUserId = (req: FastifyRequest): string => {
  return (req as any).user?.sub || "unknown";
};

export const getUserLocations = async (req: FastifyRequest, reply: FastifyReply) => {
  console.log("getUserLocations accessed");

  try {
    // Query to group users by country and count them
    const locationData = await db
      .select({
        country: users.country,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .groupBy(users.country);

    // Create a map for fast country lookups
    const countryMap: Map<string, Country> = new Map(
      (countries as unknown as Countries).map((c) => [c.cca2, c])
    );

    // Map to include coordinates
    const locations = locationData.map((item) => {
      const country = countryMap.get(item.country);

      if (!country) {
        // If country not found, use country code as name and 0,0 coords
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

    // Log the action
    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "getUserLocations",
      req,
    });

    reply.status(200).send({
      message: "User locations retrieved successfully",
      data: locations,
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};
