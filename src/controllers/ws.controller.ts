import type { FastifyRequest } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db/index.js";
import { userTokens } from "@/db/schema/index.ts";
import { getCurrentUTCTime } from "@/utils/date.util.ts";

const CHECK_INTERVAL_MS = 30_000; // 30 seconds

/**
 * Tracks active WebSocket connections per user ID.
 * Used to actively notify a device when the user logs in elsewhere (force login).
 */
const userConnections = new Map<string, Set<WebSocket>>();

/**
 * Actively notify all WebSocket connections for a user that they have been
 * logged out (e.g. because the user logged in on another device via force login).
 *
 * Sends a `force_logout` event and closes each connection.
 */
export const notifyUserForceLogout = (userId: string) => {
  const sockets = userConnections.get(userId);
  if (!sockets || sockets.size === 0) return;

  console.log(
    `[ws:token-check] notifying ${sockets.size} connection(s) for user ${userId} of force logout`
  );

  for (const socket of sockets) {
    if (socket.readyState === socket.OPEN) {
      socket.send(
        JSON.stringify({
          event: "force_logout",
          message: "You have been logged out because you logged in on another device",
        })
      );
      socket.close(4001, "Force logout");
    }
  }

  userConnections.delete(userId);
};

/**
 * WebSocket handler that continuously verifies whether a refresh token
 * still exists (and is not expired) in the `user_token` table.
 *
 * Query param: ?token=<refreshToken>
 *
 * Messages sent to the client:
 *  - { event: "token_valid",   message: "Token is valid" }   — periodic heartbeat
 *  - { event: "token_invalid", message: "Token no longer exists" } — token gone/expired
 *  - { event: "force_logout",  message: "..." } — user logged in on another device
 *
 * Close codes:
 *  - 4001: missing or invalid token
 */
export const tokenCheckWs = (socket: WebSocket, req: FastifyRequest) => {
  const token = (req.query as { token?: string }).token;

  console.log(`[ws:token-check] connection opened for token: ${token}`);

  if (!token) {
    socket.send(
      JSON.stringify({
        event: "token_invalid",
        message: "Token is required",
      })
    );
    socket.close(4001, "Token is required");
    return;
  }

  console.log(`[ws:token-check] connection opened for token`);

  const send = (payload: Record<string, unknown>) => {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  };

  const closeInvalid = (message: string) => {
    send({ event: "token_invalid", message });
    socket.close(4001, message);
  };

  const unregister = () => {
    if (userId) {
      const sockets = userConnections.get(userId);
      if (sockets) {
        sockets.delete(socket);
        if (sockets.size === 0) {
          userConnections.delete(userId);
        }
      }
    }
  };

  let userId: string | undefined;

  const verify = async () => {
    try {
      const row = await db
        .select({ id: userTokens.id, userID: userTokens.userID })
        .from(userTokens)
        .where(and(eq(userTokens.token, token), gt(userTokens.expiration, getCurrentUTCTime())))
        .then((rows) => rows[0]);

      if (!row) {
        clearInterval(interval);
        unregister();
        closeInvalid("Token no longer exists");
        return;
      }

      // Register the socket under the user ID so force-login can notify it
      if (!userId) {
        userId = row.userID;
        let sockets = userConnections.get(userId);
        if (!sockets) {
          sockets = new Set();
          userConnections.set(userId, sockets);
        }
        sockets.add(socket);
      }

      send({ event: "token_valid", message: "Token is valid" });
    } catch (err) {
      console.error("[ws:token-check] verification error:", err);
      // Don't close on transient DB errors; retry on next tick
    }
  };

  // Run an initial check immediately, then on an interval
  verify();
  const interval = setInterval(verify, CHECK_INTERVAL_MS);

  // Clean up when the client disconnects
  socket.on("close", () => {
    clearInterval(interval);
    unregister();
    console.log(`[ws:token-check] connection closed`);
  });

  // Clean up on unexpected errors
  socket.on("error", (err: Error) => {
    clearInterval(interval);
    unregister();
    console.error("[ws:token-check] socket error:", err);
  });
};
