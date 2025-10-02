import { Router } from "express";

import { login } from "../controllers/auth.controller.ts";

import { signature } from "../middleware/signature.middleware.ts";

const router = Router();

router.post("/login", signature, login);

export default router;