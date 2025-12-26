import { Router } from "express";

import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { signature } from "../middleware/signature.middleware.ts";

const router = Router();

router.get("/", authenticateJWT, signature);

router.put("/:user_id", authenticateJWT, signature);

router.delete("/:user_id", authenticateJWT, signature);

export default router;
