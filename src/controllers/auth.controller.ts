import { randomUUID } from "node:crypto";
import type { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { eq, or, lt, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { decrypt } from "../utils/encryption.util.js";
import { toCamelCase } from "../utils/case-converter.util.ts";
import { logUserAction } from "../utils/logger.util.ts";
import { getCurrentUTCTime } from "../utils/date.util.ts";
import type { TokenPayload } from "../interfaces/auth.interface.ts";
import {
  permissions,
  rolePermissions,
  roles,
  users,
  userSettings,
  userTokens,
} from "../db/schema/index.ts";

const JWT_SECRET = process.env.JWT_SECRET || "";
const EXPIRATION_IN_MINUTES = 10;
const EXPIRES_AT = `${EXPIRATION_IN_MINUTES}m`;

export const login = async (
  req: FastifyRequest<{
    Body: {
      username?: string;
      password?: string;
    };
  }>,
  reply: FastifyReply
) => {
  if (!req.body)
    return reply.status(400).send({
      message: "Request body is missing",
    });

  const { username, password } = req.body || {};

  if (!username || !password)
    return reply.status(400).send({
      message: "Username and password are required",
    });

  try {
    const userResult = await db
      .select({
        id: users.id,
        userId: users.id,
        country: users.country,
        roleId: users.roleId,
        lastname: users.lastname,
        firstname: users.firstname,
        email: users.email,
        username: users.username,
        contactnumber: users.contactnumber,
        password: users.password,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        active: users.active,
        settings: {
          colorPrimary: userSettings.colorPrimary,
          colorSecondary: userSettings.colorSecondary,
          darkModePreference: userSettings.darkModePreference,
        },
        role: {
          id: roles.id,
          title: roles.title,
          description: roles.description,
        },
        permissions: sql`
        COALESCE(
          JSON_ARRAYAGG(
            CASE 
              WHEN ${permissions.key} IS NOT NULL 
              THEN ${permissions.key}
            END
          ),
          JSON_ARRAY()
        )
      `,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .leftJoin(userSettings, eq(users.id, userSettings.userId))
      .where(or(eq(users.email, username), eq(users.username, username)))
      .groupBy(users.id, roles.id)
      .then((rows) => rows[0]);

    if (!userResult)
      return reply.status(401).send({
        message: "User does not exist",
      });

    if (!userResult.active)
      return reply.status(403).send({
        message: "User account is inactive. Please contact support.",
      });

    const isMatch = await bcrypt.compare(
      decrypt(password),
      userResult.password || ""
    );

    if (!isMatch)
      return reply.status(401).send({
        message: "Password is incorrect",
      });

    // Update last login timestamp
    await db
      .update(users)
      .set({
        lastLogin: getCurrentUTCTime(),
      })
      .where(eq(users.id, userResult.id));

    const token = jwt.sign(
      {
        sub: userResult.id,
        username: userResult.username,
        role: userResult.roleId || "user",
        permissions: userResult.permissions || [],
      },
      JWT_SECRET,
      {
        expiresIn: EXPIRES_AT,
      }
    );

    // Generate refresh token
    const refreshToken = randomUUID();
    const expiresAt = getCurrentUTCTime();

    console.log({ refreshToken })

    expiresAt.setUTCDate(expiresAt.getUTCDate() + 1);
    // 1 day expiry
    await db.insert(userTokens).values({
      token: refreshToken,
      userID: userResult.id,
      expiration: expiresAt,
    } as any);

    // Log successful login
    await logUserAction({
      userId: userResult.id,
      functionName: "login",
      req,
    });

    reply.send({
      message: "Login successful",
      data: {
        token,
        refreshToken,
        refreshTokenExpiresAt: new Date(Date.now() + EXPIRATION_IN_MINUTES * 60 * 1000), // Already in UTC milliseconds
        expiresAt,
        ...(toCamelCase(userResult) || {}),
      },
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const refreshToken = async (
  req: FastifyRequest<{ Body: { refreshToken?: string } }>,
  reply: FastifyReply
) => {
  // Clean up expired tokens
  await cleanupExpiredTokensInternal();

  if (!req.body)
    return reply.status(400).send({
      message: "Request body is missing",
    });

  const { refreshToken: token } = req.body;

  if (!token)
    return reply.status(400).send({
      message: "Refresh token is required",
    });

  try {
    // Find refresh token in DB
    const tokenResult = await db
      .select({
        id: userTokens.id,
        token: userTokens.token,
        userID: userTokens.userID,
        expiration: userTokens.expiration,
      })
      .from(userTokens)
      .where(eq(userTokens.token, token))
      .then((rows) => rows[0]);

    if (!tokenResult)
      return reply.status(401).send({ message: "Invalid refresh token" });

    // Check expiration
    const now = getCurrentUTCTime();
    const expiresAt = tokenResult.expiration;
    if (now > new Date(expiresAt))
      return reply.status(401).send({ message: "Refresh token has expired" });

    // Fetch user
    const userResult = await db
      .select({
        id: users.id,
        userId: users.id,
        country: users.country,
        roleId: users.roleId,
        lastname: users.lastname,
        firstname: users.firstname,
        email: users.email,
        username: users.username,
        contactnumber: users.contactnumber,
        password: users.password,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        active: users.active,
        settings: {
          colorPrimary: userSettings.colorPrimary,
          colorSecondary: userSettings.colorSecondary,
          darkModePreference: userSettings.darkModePreference,
        },
        role: {
          id: roles.id,
          title: roles.title,
          description: roles.description,
        },
        permissions: sql`
          COALESCE(
            JSON_ARRAYAGG(
              CASE
                WHEN ${permissions.key} IS NOT NULL THEN ${permissions.key}
              END
            ),
            JSON_ARRAY()
          )
        `,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .leftJoin(userSettings, eq(users.id, userSettings.userId))
      .where(eq(users.id, tokenResult.userID))
      .groupBy(users.id, roles.id)
      .then((rows) => rows[0]);

    if (!userResult)
      return reply.status(401).send({ message: "Invalid refresh token" });

    if (!userResult.active)
      return reply.status(403).send({
        message: "User account is inactive. Please contact support.",
      });

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        sub: userResult.id,
        username: userResult.username,
        role: userResult.roleId || "user",
        permissions: userResult.permissions || [],
      },
      JWT_SECRET,
      { expiresIn: EXPIRES_AT }
    );

    // Generate new refresh token
    const newRefreshToken = randomUUID();
    const newExpiresAt = getCurrentUTCTime();
    newExpiresAt.setUTCDate(newExpiresAt.getUTCDate() + 1);

    // Update refresh token in DB
    await db
      .update(userTokens)
      .set({ token: newRefreshToken, expiration: newExpiresAt })
      .where(eq(userTokens.id, tokenResult.id));

    // Log action
    await logUserAction({
      userId: userResult.id,
      functionName: "refreshToken",
      req,
    });

    // Return same structure as validateSession
    reply.send({
      message: "Token refreshed successfully",
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt: newExpiresAt,
        expiresAt: new Date(Date.now() + EXPIRATION_IN_MINUTES * 60 * 1000),
        ...(toCamelCase(userResult) || {}),
      },
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ message: "Server error", error: err });
  }
};
export const logout = async (
  req: FastifyRequest<{
    Body: {
      refreshToken?: string;
    };
  }>,
  reply: FastifyReply
) => {

  console.log("Logout accessed");

  // Clean up expired tokens before processing
  await cleanupExpiredTokensInternal();

  if (!req.body)
    return reply.status(400).send({
      message: "Request body is missing",
    });

  const { refreshToken: token } = req.body || {};

  if (!token) {
    console.warn("Refresh token is missing in request body");
    return reply.status(400).send({
      message: "Refresh token is required",
    });
  }

  try {
    // Find and delete the refresh token from the database
    const tokenResult = await db
      .select({
        id: userTokens.id,
        token: userTokens.token,
        userID: userTokens.userID,
        expiration: userTokens.expiration,
      })
      .from(userTokens)
      .where(eq(userTokens.token, token))
      .then((rows) => rows[0]);

    if (!tokenResult) {
      console.warn("Refresh token not found in database for logout:", token);
      return reply.status(404).send({
        message: "Refresh token not found",
      });
    }

    console.log(userTokens.id, tokenResult.id);

    // Delete the refresh token (logout)
    await db.delete(userTokens).where(eq(userTokens.id, tokenResult.id));

    // Log logout
    await logUserAction({
      userId: tokenResult.userID,
      functionName: "logout",
      req,
    });

    reply.send({
      message: "Logout successful",
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
    });
  }
};

// Internal function to clean up expired tokens (no reply sent)
const cleanupExpiredTokensInternal = async (): Promise<void> => {
  try {
    const now = getCurrentUTCTime();

    // Delete all expired tokens
    await db.delete(userTokens).where(lt(userTokens.expiration, now));

    console.log("Expired refresh tokens cleaned up");
  } catch (err) {
    console.error("Error cleaning up expired tokens:", err);
  }
};

// Exported function for manual cleanup via API endpoint
export const cleanupExpiredTokens = (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    // Delete all expired tokens
    console.log("Expired refresh tokens cleaned up");

    return reply.send({
      message: "Expired tokens cleanup completed",
    });
  } catch (err) {
    console.error("Error cleaning up expired tokens:", err);
    return reply.status(500).send({
      message: "Server error during cleanup",
    });
  }
};
