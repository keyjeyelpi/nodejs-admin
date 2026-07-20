import { randomUUID } from "node:crypto";
import type { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { eq, or, lt, sql, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { decrypt, encrypt } from "../utils/encryption.util.js";
import { toCamelCase } from "../utils/case-converter.util.ts";
import { logUserAction } from "../utils/logger.util.ts";
import { getCurrentUTCTime } from "../utils/date.util.ts";

import {
  permissions,
  positionRoles,
  positions,
  rolePermissions,
  roles,
  users,
  userSettings,
  userTokens,
} from "../db/schema/index.ts";
import { userPositions } from "../db/schema/user-positions.schema.ts";

const JWT_SECRET = process.env.JWT_SECRET || "";
const EXPIRATION_IN_MINUTES = 15;
const EXPIRES_AT = `${EXPIRATION_IN_MINUTES}m`;
const EXPIRATION_IN_DAYS = 7;

export const login = async (
  req: FastifyRequest<{
    Body: {
      username?: string;
      password?: string;
    };
  }>,
  reply: FastifyReply
) => {
  console.log("login accessed");

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
      })
      .from(users)
      .leftJoin(userSettings, eq(users.id, userSettings.userId))
      .where(or(eq(users.email, username), eq(users.username, username)))
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

    const userPositionRows = await db
      .select({
        id: positions.id,
        name: positions.name,
        systemGenerated: positions.systemGenerated,
      })
      .from(userPositions)
      .innerJoin(positions, eq(userPositions.positionId, positions.id))
      .where(eq(userPositions.userId, userResult.id));

    const positionIds = userPositionRows.map((p) => p.id);

    const positionRoleRows =
      positionIds.length > 0
        ? await db
          .select({
            positionId: positionRoles.positionId,
            id: roles.id,
            name: roles.name,
            systemGenerated: roles.systemGenerated,
          })
          .from(positionRoles)
          .innerJoin(roles, eq(positionRoles.roleId, roles.id))
          .where(inArray(positionRoles.positionId, positionIds))
        : [];

    const roleIds = [...new Set(positionRoleRows.map((r) => r.id))];

    const rolePermissionRows =
      roleIds.length > 0
        ? await db
          .select({
            roleId: rolePermissions.roleId,
            id: permissions.id,
            name: permissions.name,
            key: permissions.key,
            module: permissions.module,
            systemGenerated: permissions.systemGenerated,
          })
          .from(rolePermissions)
          .innerJoin(
            permissions,
            eq(rolePermissions.permissionId, permissions.id)
          )
          .where(inArray(rolePermissions.roleId, roleIds))
        : [];

    const uniquePermissionsMap = new Map<
      string,
      { id: string; name: string; key: string; module: string | null; systemGenerated: boolean }
    >();
    rolePermissionRows.forEach((p) => {
      if (!uniquePermissionsMap.has(p.id)) {
        uniquePermissionsMap.set(p.id, {
          id: p.id,
          name: p.name,
          key: p.key,
          module: p.module,
          systemGenerated: p.systemGenerated,
        });
      }
    });

    const assembledPositions = userPositionRows.map((position) => {
      const posRoles = positionRoleRows
        .filter((r) => r.positionId === position.id)
        .map((role) => {
          const rolePerms = rolePermissionRows
            .filter((p) => p.roleId === role.id)
            .map((p) => ({
              id: p.id,
              name: p.name,
              key: p.key,
              module: p.module,
              systemGenerated: p.systemGenerated,
            }));

          return {
            id: role.id,
            name: role.name,
            systemGenerated: role.systemGenerated,
            permissions: rolePerms,
          };
        });

      return {
        id: position.id,
        name: position.name,
        systemGenerated: position.systemGenerated,
        roles: posRoles,
      };
    });

    const flatRoles = Array.from(
      new Map(positionRoleRows.map((r) => [r.id, { id: r.id, name: r.name }])).values()
    );
    const flatPermissionKeys = Array.from(uniquePermissionsMap.values()).map(
      (p) => p.key
    );

    // await db
    //   .update(users)
    //   .set({ lastLogin: getCurrentUTCTime() })
    //   .where(eq(users.id, userResult.id));

    const token = jwt.sign(
      {
        sub: userResult.id,
        username: userResult.username,
        roles: flatRoles.map((r) => r.id),
        permissions: flatPermissionKeys,
      },
      JWT_SECRET,
      { expiresIn: EXPIRES_AT }
    );

    const refreshToken = randomUUID();
    const expiresAt = getCurrentUTCTime();
    expiresAt.setUTCDate(expiresAt.getUTCDate() + EXPIRATION_IN_DAYS);

    await db.insert(userTokens).values({
      token: refreshToken,
      userID: userResult.id,
      expiration: expiresAt,
    } as any);

    await logUserAction({
      userId: userResult.id,
      functionName: "login",
      req,
    });

    reply.send({
      message: "Login successful",
      data: {
        refreshToken: token,
        token: refreshToken,
        expiresAt: new Date(Date.now() + EXPIRATION_IN_MINUTES * 60 * 1000),
        refreshTokenExpiresAt: expiresAt,
        ...(toCamelCase(userResult) || {}),
        positions: assembledPositions,
        roles: flatRoles,
        permissions: Array.from(uniquePermissionsMap.values()),
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

export const revalidate = async (req: FastifyRequest, reply: FastifyReply) => {
  console.log("revalidate accessed");

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        message: "Authorization header missing or invalid",
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    if (!decoded.sub) {
      return reply.status(401).send({
        message: "Invalid token",
      });
    }

    const userId = decoded.sub as string;

    const userResult = await db
      .select({
        id: users.id,
        userId: users.id,
        country: users.country,
        lastname: users.lastname,
        firstname: users.firstname,
        email: users.email,
        username: users.username,
        contactnumber: users.contactnumber,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        active: users.active,
        settings: {
          colorPrimary: userSettings.colorPrimary,
          colorSecondary: userSettings.colorSecondary,
          darkModePreference: userSettings.darkModePreference,
        },
      })
      .from(users)
      .leftJoin(userSettings, eq(users.id, userSettings.userId))
      .where(eq(users.id, userId))
      .then((rows) => rows[0]);

    if (!userResult) {
      return reply.status(401).send({
        message: "User not found",
      });
    }

    if (!userResult.active) {
      return reply.status(403).send({
        message: "User account is inactive. Please contact support.",
      });
    }

    const userPositionRows = await db
      .select({
        id: positions.id,
        name: positions.name,
        systemGenerated: positions.systemGenerated,
      })
      .from(userPositions)
      .innerJoin(positions, eq(userPositions.positionId, positions.id))
      .where(eq(userPositions.userId, userResult.id));

    const positionIds = userPositionRows.map((p) => p.id);

    const positionRoleRows =
      positionIds.length > 0
        ? await db
          .select({
            positionId: positionRoles.positionId,
            id: roles.id,
            name: roles.name,
            systemGenerated: roles.systemGenerated,
          })
          .from(positionRoles)
          .innerJoin(roles, eq(positionRoles.roleId, roles.id))
          .where(inArray(positionRoles.positionId, positionIds))
        : [];

    const roleIds = [...new Set(positionRoleRows.map((r) => r.id))];

    const rolePermissionRows =
      roleIds.length > 0
        ? await db
          .select({
            roleId: rolePermissions.roleId,
            id: permissions.id,
            name: permissions.name,
            key: permissions.key,
            module: permissions.module,
            systemGenerated: permissions.systemGenerated,
          })
          .from(rolePermissions)
          .innerJoin(
            permissions,
            eq(rolePermissions.permissionId, permissions.id)
          )
          .where(inArray(rolePermissions.roleId, roleIds))
        : [];

    const uniquePermissionsMap = new Map<
      string,
      { id: string; name: string; key: string; module: string | null; systemGenerated: boolean }
    >();
    rolePermissionRows.forEach((p) => {
      if (!uniquePermissionsMap.has(p.id)) {
        uniquePermissionsMap.set(p.id, {
          id: p.id,
          name: p.name,
          key: p.key,
          module: p.module,
          systemGenerated: p.systemGenerated,
        });
      }
    });

    const assembledPositions = userPositionRows.map((position) => {
      const posRoles = positionRoleRows
        .filter((r) => r.positionId === position.id)
        .map((role) => {
          const rolePerms = rolePermissionRows
            .filter((p) => p.roleId === role.id)
            .map((p) => ({
              id: p.id,
              name: p.name,
              key: p.key,
              module: p.module,
              systemGenerated: p.systemGenerated,
            }));

          return {
            id: role.id,
            name: role.name,
            systemGenerated: role.systemGenerated,
            permissions: rolePerms,
          };
        });

      return {
        id: position.id,
        name: position.name,
        systemGenerated: position.systemGenerated,
        roles: posRoles,
      };
    });

    const flatRoles = Array.from(
      new Map(positionRoleRows.map((r) => [r.id, { id: r.id, name: r.name }])).values()
    );

    await logUserAction({
      userId: userResult.id,
      functionName: "revalidate",
      req,
    });

    reply.send({
      message: "Token is valid",
      data: {
        ...(toCamelCase(userResult) || {}),
        positions: assembledPositions,
        roles: flatRoles,
        permissions: Array.from(uniquePermissionsMap.values()),
      },
    });
  } catch (err) {
    console.error(err);
    if (err instanceof jwt.JsonWebTokenError) {
      return reply.status(401).send({
        message: "Invalid token",
      });
    }
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const token = async (
  req: FastifyRequest<{ Body: { token?: string } }>,
  reply: FastifyReply
) => {
  console.log("token accessed");

  if (!req.body)
    return reply.status(400).send({ message: "Request body is missing" });

  const { token: refreshToken } = req.body;

  if (!refreshToken)
    return reply.status(400).send({ message: "Token is required" });

  try {
    const tokenResult = await db
      .select({
        id: userTokens.id,
        token: userTokens.token,
        userID: userTokens.userID,
        expiration: userTokens.expiration,
      })
      .from(userTokens)
      .where(eq(userTokens.token, refreshToken))
      .then((rows) => rows[0]);

    if (!tokenResult)
      return reply.status(401).send({ message: "Invalid token" });

    if (getCurrentUTCTime() > new Date(tokenResult.expiration))
      return reply.status(401).send({ message: "Token has expired" });

    const userResult = await db
      .select({ id: users.id, active: users.active })
      .from(users)
      .where(eq(users.id, tokenResult.userID))
      .then((rows) => rows[0]);

    if (!userResult)
      return reply.status(401).send({ message: "Invalid refresh token" });

    if (!userResult.active)
      return reply.status(403).send({
        message: "User account is inactive. Please contact support.",
      });

    const newAccessToken = jwt.sign({ sub: userResult.id }, JWT_SECRET, {
      expiresIn: EXPIRES_AT,
    });

    const newRefreshToken = randomUUID();

    await db
      .update(userTokens)
      .set({ token: newRefreshToken })
      .where(eq(userTokens.id, tokenResult.id));

    reply.send({
      message: "Refresh token refreshed successfully",
      data: {
        refreshToken: encrypt(newAccessToken),
        token: newRefreshToken,
        refreshTokenExpiresAt: tokenResult.expiration,
        expiresAt: new Date(Date.now() + EXPIRATION_IN_MINUTES * 60 * 1000),
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
      token?: string;
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

  const { token: refreshToken } = req.body || {};

  if (!refreshToken) {
    console.warn("Token is missing in request body");
    return reply.status(400).send({
      message: "Token is required",
    });
  }

  try {
    // Find and delete the token from the database
    const tokenResult = await db
      .select({
        id: userTokens.id,
        token: userTokens.token,
        userID: userTokens.userID,
        expiration: userTokens.expiration,
      })
      .from(userTokens)
      .where(eq(userTokens.token, refreshToken))
      .then((rows) => rows[0]);

    if (!tokenResult) {
      console.warn("Token not found in database for logout:", refreshToken);
      return reply.status(404).send({
        message: "Token not found",
      });
    }

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

// Internal function to clean up expired refresh tokens (no reply sent)
const cleanupExpiredTokensInternal = async (): Promise<void> => {
  console.log("cleanupExpiredTokensInternal accessed");
  try {
    const now = getCurrentUTCTime();

    // Delete all expired refresh tokens
    await db.delete(userTokens).where(lt(userTokens.expiration, now));

    console.log("Expired tokens cleaned up");
  } catch (err) {
    console.error("Error cleaning up expired refresh tokens:", err);
  }
};

// Exported function for manual cleanup via API endpoint
export const cleanupExpiredTokens = (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    // Delete all expired refresh tokens
    console.log("Expired tokens cleaned up");

    return reply.send({
      message: "Expired refresh tokens cleanup completed",
    });
  } catch (err) {
    console.error("Error cleaning up expired refresh tokens:", err);
    return reply.status(500).send({
      message: "Server error during cleanup",
    });
  }
};