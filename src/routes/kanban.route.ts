import type { FastifyInstance } from "fastify";
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

export default async function kanbanRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [authenticateJWT] }, getAllKanbanBoards);

  fastify.get("/list", { preHandler: [authenticateJWT] }, getBoardList);

  fastify.get<{ Params: { id: string } }>(
    "/board/:id",
    { preHandler: [authenticateJWT] },
    getBoardById
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authenticateJWT] },
    getKanbanBoardById
  );

  fastify.post<{ Body: { name?: string } }>(
    "/",
    { preHandler: [authenticateJWT, signature] },
    createBoard
  );

  fastify.put<{ Params: { id: string }; Body: { name?: string } }>(
    "/:id",
    { preHandler: [authenticateJWT, signature] },
    updateBoard
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authenticateJWT, signature] },
    deleteBoard
  );

  fastify.post<{ Body: { boardId?: string; name?: string; disableAdd?: boolean; order?: number } }>(
    "/column",
    { preHandler: [authenticateJWT, signature] },
    addColumn
  );

  fastify.post<{ Body: Record<string, unknown> }>(
    "/card",
    { preHandler: [authenticateJWT, signature] },
    addCard
  );

  fastify.put<{ Body: { cardId?: string; newColumnId?: string; newIndex?: number } }>(
    "/card/move",
    { preHandler: [authenticateJWT, signature] },
    moveCard
  );

  fastify.put<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/column/:id",
    { preHandler: [authenticateJWT, signature] },
    updateColumn
  );

  fastify.put<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/card/:id",
    { preHandler: [authenticateJWT, signature] },
    updateCard
  );

  fastify.delete<{ Params: { id: string } }>(
    "/column/:id",
    { preHandler: [authenticateJWT, signature] },
    deleteColumn
  );

  fastify.delete<{ Params: { id: string } }>(
    "/card/:id",
    { preHandler: [authenticateJWT, signature] },
    deleteCard
  );

  // Comment routes
  fastify.post<{ Body: { kanbanCardId?: string; text?: string } }>(
    "/comment",
    { preHandler: [authenticateJWT, signature] },
    addComment
  );

  fastify.put<{ Params: { id: string }; Body: { text?: string } }>(
    "/comment/:id",
    { preHandler: [authenticateJWT, signature] },
    updateComment
  );

  fastify.delete<{ Params: { id: string } }>(
    "/comment/:id",
    { preHandler: [authenticateJWT, signature] },
    deleteComment
  );

  // Reply routes
  fastify.post<{ Body: { kanbanCardId?: string; replyForKanbanCommentId?: string; text?: string } }>(
    "/reply",
    { preHandler: [authenticateJWT, signature] },
    addReply
  );

  fastify.get<{ Params: { commentId: string } }>(
    "/comment/:commentId/replies",
    { preHandler: [authenticateJWT] },
    getReplies
  );

  // Like route
  fastify.post<{ Params: { id: string } }>(
    "/card/:id/like",
    { preHandler: [authenticateJWT, signature] },
    likeCard
  );
}
