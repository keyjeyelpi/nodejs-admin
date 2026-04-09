import { v4 as uuidv4 } from "uuid";
import { tryToCatch } from "try-to-catch";
import { db } from "../db/index.ts";
import { logs } from "../db/schema/index.ts";

export interface LogParams {
  userId: string;
  action: string;
  module?: string;
}

/**
 * Extracts the module name from a Fastify request URL
 * e.g., "/auth/login" -> "auth", "/users" -> "users", "/kanban/boards" -> "kanban"
 */
export const getModuleFromUrl = (url: string): string => {
  // Remove query string if present
  const pathParts = url.split("?");
  const path = pathParts[0] || "";

  // Split by "/" and filter empty segments
  const segments = path.split("/").filter(Boolean);

  // Return the first segment (parent route path)
  return segments[0] || "unknown";
};

/**
 * Extracts the action from the function name
 * e.g., "fetchUsers" -> "fetch", "createUser" -> "create", "updateUser" -> "update"
 */
export const getActionFromFunctionName = (functionName: string): string => {
  const actionPatterns = [
    "fetch",
    "get",
    "load",
    "fetchAll",
    "fetchBy",
    "create",
    "add",
    "insert",
    "update",
    "edit",
    "modify",
    "delete",
    "remove",
  ];

  for (const action of actionPatterns) {
    if (functionName.toLowerCase().startsWith(action)) return action;
  }

  return functionName.toLowerCase();
};

export const createLog = async ({ userId, action, module }: LogParams) => {
  const [error] = await tryToCatch(db.insert(logs).values, {
    id: uuidv4(),
    userId,
    action,
    module: module || "unknown",
    timestamp: new Date(),
  });

  if (error) console.error("Failed to create log:", error);
};

/**
 * Creates a log entry with automatic module and action detection
 * @param userId - The user ID performing the action
 * @param functionName - The name of the controller function (used for action)
 * @param req - Optional FastifyRequest to extract module from URL
 */
export const logUserAction = async ({
  userId,
  functionName,
  req,
}: {
  userId: string;
  functionName: string;
  req?: {
    url?: string;
  };
}) => {
  const action = getActionFromFunctionName(functionName);
  const module = req?.url ? getModuleFromUrl(req.url) : "unknown";

  await createLog({
    userId,
    action,
    module,
  });
};
