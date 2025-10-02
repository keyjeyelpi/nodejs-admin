import { Router } from "express";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { fetchAllAccounts } from "../controllers/account.controller.ts";

const router = Router();

router.get("/", authenticateJWT, fetchAllAccounts);

export default router;
