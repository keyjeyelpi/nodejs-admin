import { Router } from "express";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { signature } from "../middleware/signature.middleware.ts";
import {
  getAllKanbanBoards,
  getKanbanBoardById,
  addColumn,
  addCard,
  updateColumn,
  updateCard,
  deleteColumn,
  deleteCard,
  addComment,
  updateComment,
  deleteComment,
  addReply,
  getReplies,
  likeCard,
} from "../controllers/kanban.controller.ts";

const router = Router();

router.get("/", authenticateJWT, getAllKanbanBoards);

router.get("/:id", authenticateJWT, getKanbanBoardById);

router.post("/column", authenticateJWT, signature, addColumn);

router.post("/card", authenticateJWT, signature, addCard);

router.put("/column/:id", authenticateJWT, signature, updateColumn);

router.put("/card/:id", authenticateJWT, signature, updateCard);

router.delete("/column/:id", authenticateJWT, signature, deleteColumn);

router.delete("/card/:id", authenticateJWT, signature, deleteCard);
// Comment routes
router.post("/comment", authenticateJWT, signature, addComment);

router.put("/comment/:id", authenticateJWT, signature, updateComment);

router.delete("/comment/:id", authenticateJWT, signature, deleteComment);
// Reply routes
router.post("/reply", authenticateJWT, signature, addReply);

router.get("/comment/:commentId/replies", authenticateJWT, getReplies);
// Like route
router.post("/card/:id/like", authenticateJWT, signature, likeCard);

export default router;
