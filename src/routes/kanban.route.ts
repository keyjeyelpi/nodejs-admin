import { Router } from "express";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { signature } from "../middleware/signature.middleware.ts";
import {
  getAllKanbanBoards,
  getBoardList,
  getBoardById,
  getKanbanBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  addColumn,
  addCard,
  moveCard,
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

router.get("/list", authenticateJWT, getBoardList);

router.get("/board/:id", authenticateJWT, getBoardById);

router.get("/:id", authenticateJWT, getKanbanBoardById);

router.post("/", authenticateJWT, signature, createBoard);

router.put("/:id", authenticateJWT, signature, updateBoard);

router.delete("/:id", authenticateJWT, signature, deleteBoard);

router.post("/column", authenticateJWT, signature, addColumn);

router.post("/card", authenticateJWT, signature, addCard);

router.put("/card/move", authenticateJWT, signature, moveCard);

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
