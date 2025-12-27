import express from "express";
import accountRoutes from "./account.route.ts";
import authRoutes from "./auth.route.ts";
import kanbanRoutes from "./kanban.route.ts";
import userRoutes from "./user.route.ts";
import userSettingsRoutes from "./user-settings.route.ts";
import { error404, globalErrorHandler } from "../controllers/index.ts";

const app = express();

app.use("/account", accountRoutes);
app.use("/auth", authRoutes);
app.use("/kanban", kanbanRoutes);
app.use("/users", userRoutes);
app.use("/users/:user_id/settings", userSettingsRoutes);
// 404 handler
app.use(error404);
// Global error handler
app.use(globalErrorHandler);

export default app;
