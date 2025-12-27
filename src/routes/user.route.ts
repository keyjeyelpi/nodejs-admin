import { Router } from "express";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { signature } from "../middleware/signature.middleware.ts";
import {
  createUser,
  deleteUser,
  fetchAllUsers,
  fetchUserByAccountID,
  updateUser,
} from "../controllers/user.controller.ts";

const router = Router();

router.get("/", authenticateJWT, fetchAllUsers);

router.get("/:id", authenticateJWT, fetchUserByAccountID);

router.post("/", authenticateJWT, signature, createUser);

router.put("/:user_id", authenticateJWT, signature, updateUser);

router.delete("/:user_id", authenticateJWT, signature, deleteUser);

export default router;
