import express from "express";

import accountRoutes from "./account.route.ts";
import authRoutes from "./auth.route.ts";
import userRoutes from "./user.route.ts";

import { error404, globalErrorHandler } from "../controllers/index.ts";

const app = express();

app.use("/account", accountRoutes);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

// 404 handler
app.use(error404);

// Global error handler
app.use(globalErrorHandler);

export default app;
