import type { FastifyRequest, FastifyReply } from "fastify";
import { v4 as uuid } from "uuid";
import { db } from "../db/index.js";
import {
  kanbanBoards,
  kanbanColumns,
  kanbanCards,
  kanbanComments,
  users,
} from "../db/schema.js";
import { eq, asc, desc, sql, and } from "drizzle-orm";

// Define valid values as constants to avoid enum issues
const VALID_PRIORITIES = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const;
const VALID_STATUSES = ["TO_DO", "DONE", "REVIEW", "PROCESS"] as const;

type Priority = (typeof VALID_PRIORITIES)[number];
type Status = (typeof VALID_STATUSES)[number];

const isUndefined = (a: unknown): a is undefined => typeof a === "undefined";

export const getAllKanbanBoards = async (req: FastifyRequest, reply: FastifyReply) => {
  console.log("[KanbanController] getAllKanbanBoards accessed");
  try {
    const query = req.query as { page?: string; limit?: string; search?: string };
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const skip = (page - 1) * limit;
    const search = query.search;

    // Get all boards with their columns and cards
    const allBoards = await db.select({
      id: kanbanBoards.id,
      name: kanbanBoards.name,
    })
      .from(kanbanBoards)
      .orderBy(asc(kanbanBoards.name));

    // Get columns for each board
    const boardsWithColumns = await Promise.all(
      allBoards.map(async (board) => {
        const columns = await db.select({
          id: kanbanColumns.id,
          name: kanbanColumns.name,
          disableAdd: kanbanColumns.disableAdd,
          order: kanbanColumns.order,
        })
          .from(kanbanColumns)
          .where(eq(kanbanColumns.boardId, board.id))
          .orderBy(asc(kanbanColumns.order));

        // Get cards for each column
        const columnsWithCards = await Promise.all(
          columns.map(async (column) => {
            const cards = await db.select({
              id: kanbanCards.id,
              title: kanbanCards.title,
              description: kanbanCards.description,
              categoryTitle: kanbanCards.categoryTitle,
              categoryColor: kanbanCards.categoryColor,
              priority: kanbanCards.priority,
              status: kanbanCards.status,
              likes: kanbanCards.likes,
            })
              .from(kanbanCards)
              .where(eq(kanbanCards.kanbanColumnId, column.id))
              .orderBy(asc(kanbanCards.title));

            // Get comments for each card
            const cardsWithComments = await Promise.all(
              cards.map(async (card) => {
                const comments = await db.select({
                  id: kanbanComments.id,
                  text: kanbanComments.text,
                  userId: kanbanComments.userId,
                  kanbanCardId: kanbanComments.kanbanCardId,
                  replyForKanbanCommentId: kanbanComments.replyForKanbanCommentId,
                  firstname: users.firstname,
                  lastname: users.lastname,
                  username: users.username,
                })
                  .from(kanbanComments)
                  .leftJoin(users, eq(kanbanComments.userId, users.id))
                  .where(eq(kanbanComments.kanbanCardId, card.id));

                return {
                  ...card,
                  kanbanComments: comments,
                };
              })
            );

            return {
              ...column,
              kanbanCards: cardsWithComments,
            };
          })
        );

        return {
          ...board,
          kanbanColumns: columnsWithCards,
        };
      })
    );

    const totalCount = boardsWithColumns.length;
    const startIndex = skip;
    const endIndex = startIndex + limit;
    const paginatedBoards = boardsWithColumns.slice(startIndex, endIndex);

    const transformedBoards = paginatedBoards.map((board) => ({
      id: board.id,
      name: board.name,
      kanbanColumns: board.kanbanColumns.map((column) => ({
        id: column.id,
        name: column.name,
        disableAdd: column.disableAdd,
        items: column.kanbanCards.map((card) => ({
          id: card.id,
          content: {
            title: card.title,
            description: card.description,
            category: {
              icon: "",
              label: card.categoryTitle,
              color: card.categoryColor,
            },
            priority: card.priority,
            status: card.status,
            likes: card.likes,
            comments: card.kanbanComments.filter(
              (c) => !c.replyForKanbanCommentId
            ).length,
          },
        })),
      })),
    }));

    reply.status(200).send({
      message: `Retrieved ${transformedBoards.length} kanban boards`,
      data: transformedBoards,
      count: transformedBoards.length,
      totalCount,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("[KanbanController] Error in getAllKanbanBoards:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const getBoardList = async (req: FastifyRequest, reply: FastifyReply) => {
  console.log("[KanbanController] getBoardList accessed");
  try {
    const query = req.query as { page?: string; limit?: string };
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const skip = (page - 1) * limit;

    const allBoards = await db.select({
      id: kanbanBoards.id,
      name: kanbanBoards.name,
    })
      .from(kanbanBoards)
      .orderBy(asc(kanbanBoards.name));

    const totalCount = allBoards.length;
    const boards = allBoards.slice(skip, skip + limit);

    reply.status(200).send({
      message: `Retrieved ${boards.length} boards`,
      data: boards,
      count: boards.length,
      totalCount,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("[KanbanController] Error in getBoardList:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const getBoardById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] getBoardById accessed");
  const { id } = req.params;

  if (!id)
    return reply.status(400).send({
      message: "Board id is required",
    });

  try {
    const board = await db.select({
      id: kanbanBoards.id,
      name: kanbanBoards.name,
    })
      .from(kanbanBoards)
      .where(eq(kanbanBoards.id, id))
      .then(rows => rows[0]);

    if (!board)
      return reply.status(404).send({
        message: "Board not found",
      });

    reply.status(200).send({
      message: `Retrieved board with ID ${id}`,
      data: board,
    });
  } catch (err) {
    console.error("[KanbanController] Error in getBoardById:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const getKanbanBoardById = async (req: FastifyRequest, reply: FastifyReply) => {
  console.log("[KanbanController] getKanbanBoardById accessed");
  const params = req.params as { id?: string };
  const { id } = params;
  const query = req.query as { page?: string; limit?: string };
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");
  const skip = (page - 1) * limit;

  if (!id)
    return reply.status(400).send({
      message: "Board id is required",
    });

  try {
    const board = await db.select({
      id: kanbanBoards.id,
      name: kanbanBoards.name,
    })
      .from(kanbanBoards)
      .where(eq(kanbanBoards.id, id))
      .then(rows => rows[0]);

    if (!board)
      return reply.status(404).send({
        message: "Kanban board not found",
      });

    const columns = await db.select({
      id: kanbanColumns.id,
      name: kanbanColumns.name,
      disableAdd: kanbanColumns.disableAdd,
      order: kanbanColumns.order,
    })
      .from(kanbanColumns)
      .where(eq(kanbanColumns.boardId, id))
      .orderBy(asc(kanbanColumns.order));

    // Count total cards
    const totalCardCountResult = await db.select({
      count: sql<number>`count(*)`,
    })
      .from(kanbanCards)
      .innerJoin(kanbanColumns, eq(kanbanCards.kanbanColumnId, kanbanColumns.id))
      .where(eq(kanbanColumns.boardId, id));
    const totalCardCount = totalCardCountResult[0]?.count || 0;

    const columnsWithCards = await Promise.all(
      columns.map(async (column) => {
        const cards = await db.select({
          id: kanbanCards.id,
          title: kanbanCards.title,
          description: kanbanCards.description,
          categoryTitle: kanbanCards.categoryTitle,
          categoryColor: kanbanCards.categoryColor,
          priority: kanbanCards.priority,
          status: kanbanCards.status,
          likes: kanbanCards.likes,
        })
          .from(kanbanCards)
          .where(eq(kanbanCards.kanbanColumnId, column.id))
          .orderBy(asc(kanbanCards.title))
          .limit(limit)
          .offset(skip);

        const cardsWithComments = await Promise.all(
          cards.map(async (card) => {
            const comments = await db.select({
              id: kanbanComments.id,
              text: kanbanComments.text,
              userId: kanbanComments.userId,
              kanbanCardId: kanbanComments.kanbanCardId,
              replyForKanbanCommentId: kanbanComments.replyForKanbanCommentId,
              createdAt: kanbanComments.createdAt,
              firstname: users.firstname,
              lastname: users.lastname,
              username: users.username,
            })
              .from(kanbanComments)
              .leftJoin(users, eq(kanbanComments.userId, users.id))
              .where(eq(kanbanComments.kanbanCardId, card.id))
              .orderBy(asc(kanbanComments.id));

            return {
              ...card,
              kanbanComments: comments,
            };
          })
        );

        return {
          ...column,
          kanbanCards: cardsWithComments,
        };
      })
    );

    const transformedBoard = {
      id: board.id,
      name: board.name,
      kanbanColumns: columnsWithCards.map((column) => ({
        id: column.id,
        name: column.name,
        disableAdd: column.disableAdd,
        items: column.kanbanCards.map((card) => {
          const topLevelComments = card.kanbanComments.filter(
            (c) => !c.replyForKanbanCommentId
          );

          const commentsWithReplies = topLevelComments.map((comment) => {
            const replies = card.kanbanComments
              .filter((c) => c.replyForKanbanCommentId === comment.id)
              .map((reply) => ({
                id: reply.id,
                text: reply.text,
                author: `${reply.firstname} ${reply.lastname}`,
                date: reply.createdAt?.toISOString() || "",
                avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(reply.username || "")}`,
              }));

            return {
              id: comment.id,
              text: comment.text,
              author: `${comment.firstname} ${comment.lastname}`,
              date: comment.createdAt?.toISOString() || "",
              avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(comment.username || "")}`,
              replies,
            };
          });

          return {
            id: card.id,
            content: {
              title: card.title,
              description: card.description,
              category: {
                icon: "",
                label: card.categoryTitle,
                color: card.categoryColor,
              },
              priority: card.priority,
              status: card.status,
              likes: card.likes,
              comments: commentsWithReplies,
            },
          };
        }),
      })),
    };

    reply.status(200).send({
      message: `Get kanban board with ID ${id}`,
      data: transformedBoard,
      pagination: {
        page,
        limit,
        totalCards: totalCardCount,
        totalPages: Math.ceil(totalCardCount / limit),
        hasNextPage: page < Math.ceil(totalCardCount / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("[KanbanController] Error in getKanbanBoardById:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const createBoard = async (
  req: FastifyRequest<{ Body: { name?: string } }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] createBoard accessed");
  const { name } = req.body || {};

  try {
    if (!name?.trim())
      return reply.status(400).send({
        message: "Board name is required",
      });

    const boardId = uuid();
    await db.insert(kanbanBoards).values({
      id: boardId,
      name: name.trim(),
    });

    const newBoard = await db.select()
      .from(kanbanBoards)
      .where(eq(kanbanBoards.id, boardId))
      .then(rows => rows[0]);

    reply.status(201).send({
      message: "Board created successfully",
      data: newBoard,
    });
  } catch (err) {
    console.error("[KanbanController] Error in createBoard:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const updateBoard = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { name?: string } }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] updateBoard accessed");
  const { id } = req.params;
  const { name } = req.body || {};

  try {
    if (!id)
      return reply.status(400).send({
        message: "Board id is required",
      });

    if (!name?.trim())
      return reply.status(400).send({
        message: "Board name is required",
      });

    await db.update(kanbanBoards)
      .set({ name: name.trim() })
      .where(eq(kanbanBoards.id, id));

    const updatedBoard = await db.select()
      .from(kanbanBoards)
      .where(eq(kanbanBoards.id, id))
      .then(rows => rows[0]);

    if (!updatedBoard)
      return reply.status(404).send({
        message: "Board not found",
      });

    reply.status(200).send({
      message: `Board with ID ${id} updated`,
      data: updatedBoard,
    });
  } catch (err: unknown) {
    console.error("[KanbanController] Error in updateBoard:", err);

    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const deleteBoard = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] deleteBoard accessed");
  const { id } = req.params;

  try {
    if (!id)
      return reply.status(400).send({
        message: "Board id is required",
      });

    const existingBoard = await db.select()
      .from(kanbanBoards)
      .where(eq(kanbanBoards.id, id))
      .then(rows => rows[0]);

    if (!existingBoard)
      return reply.status(404).send({
        message: "Board not found",
      });

    await db.delete(kanbanBoards)
      .where(eq(kanbanBoards.id, id));

    reply.status(200).send({
      message: `Board with ID ${id} deleted`,
    });
  } catch (err) {
    console.error("[KanbanController] Error in deleteBoard:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const addColumn = async (
  req: FastifyRequest<{ Body: { boardId?: string; name?: string; disableAdd?: boolean; order?: number } }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] addColumn accessed");
  const { boardId, name, disableAdd, order } = req.body || {};

  try {
    if (!boardId?.trim() || !name?.trim())
      return reply.status(400).send({
        message: "boardId and name are required",
      });

    const columnId = uuid();
    await db.insert(kanbanColumns).values({
      id: columnId,
      name: name.trim(),
      boardId: boardId,
      disableAdd: disableAdd || false,
      order: order || 0,
    });

    const newColumn = await db.select()
      .from(kanbanColumns)
      .where(eq(kanbanColumns.id, columnId))
      .then(rows => rows[0]);

    reply.status(201).send({
      message: "Column added successfully",
      data: newColumn,
    });
  } catch (err) {
    console.error("[KanbanController] Error in addColumn:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const updateColumn = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { name?: string; disableAdd?: boolean; order?: number } }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] updateColumn accessed");
  const { id } = req.params;
  const { name, disableAdd, order } = req.body || {};

  try {
    if (!id)
      return reply.status(400).send({
        message: "Column id is required",
      });

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (disableAdd !== undefined) updateData.disableAdd = disableAdd;
    if (order !== undefined) updateData.order = order;

    await db.update(kanbanColumns)
      .set(updateData)
      .where(eq(kanbanColumns.id, id));

    const updatedColumn = await db.select()
      .from(kanbanColumns)
      .where(eq(kanbanColumns.id, id))
      .then(rows => rows[0]);

    if (!updatedColumn)
      return reply.status(404).send({
        message: "Column not found",
      });

    reply.status(200).send({
      message: `Column with ID ${id} updated`,
      data: updatedColumn,
    });
  } catch (err) {
    console.error("[KanbanController] Error in updateColumn:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const deleteColumn = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] deleteColumn accessed");
  const { id } = req.params;

  try {
    if (!id)
      return reply.status(400).send({
        message: "Column id is required",
      });

    const existingColumn = await db.select()
      .from(kanbanColumns)
      .where(eq(kanbanColumns.id, id))
      .then(rows => rows[0]);

    if (!existingColumn)
      return reply.status(404).send({
        message: "Column not found",
      });

    await db.delete(kanbanColumns)
      .where(eq(kanbanColumns.id, id));

    reply.status(200).send({
      message: `Column with ID ${id} deleted`,
    });
  } catch (err) {
    console.error("[KanbanController] Error in deleteColumn:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const addCard = async (
  req: FastifyRequest<{
    Body: {
      columnId?: string;
      title?: string;
      description?: string;
      categoryTitle?: string;
      categoryColor?: string;
      priority?: string;
      status?: string;
    }
  }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] createCard accessed");
  const { columnId, title, description, categoryTitle, categoryColor, priority, status } = req.body || {};

  try {
    if (!columnId?.trim() || !title?.trim())
      return reply.status(400).send({
        message: "columnId and title are required",
      });

    const cardId = uuid();
    await db.insert(kanbanCards).values({
      id: cardId,
      title: title.trim(),
      description: description || "",
      categoryTitle: categoryTitle || "",
      categoryColor: categoryColor || "#000000",
      priority: (priority as Priority) || "MEDIUM",
      status: (status as Status) || "TO_DO",
      kanbanColumnId: columnId,
    });

    const newCard = await db.select()
      .from(kanbanCards)
      .where(eq(kanbanCards.id, cardId))
      .then(rows => rows[0]);

    reply.status(201).send({
      message: "Card created successfully",
      data: newCard,
    });
  } catch (err) {
    console.error("[KanbanController] Error in createCard:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const updateCard = async (
  req: FastifyRequest<{
    Params: { id: string };
    Body: {
      title?: string;
      description?: string;
      categoryTitle?: string;
      categoryColor?: string;
      priority?: string;
      status?: string;
      likes?: number;
    }
  }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] updateCard accessed");
  const { id } = req.params;
  const { title, description, categoryTitle, categoryColor, priority, status, likes } = req.body || {};

  try {
    if (!id)
      return reply.status(400).send({
        message: "Card id is required",
      });

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (categoryTitle !== undefined) updateData.categoryTitle = categoryTitle;
    if (categoryColor !== undefined) updateData.categoryColor = categoryColor;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (likes !== undefined) updateData.likes = likes;

    await db.update(kanbanCards)
      .set(updateData)
      .where(eq(kanbanCards.id, id));

    const updatedCard = await db.select()
      .from(kanbanCards)
      .where(eq(kanbanCards.id, id))
      .then(rows => rows[0]);

    if (!updatedCard)
      return reply.status(404).send({
        message: "Card not found",
      });

    reply.status(200).send({
      message: `Card with ID ${id} updated`,
      data: updatedCard,
    });
  } catch (err) {
    console.error("[KanbanController] Error in updateCard:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const deleteCard = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] deleteCard accessed");
  const { id } = req.params;

  try {
    if (!id)
      return reply.status(400).send({
        message: "Card id is required",
      });

    const existingCard = await db.select()
      .from(kanbanCards)
      .where(eq(kanbanCards.id, id))
      .then(rows => rows[0]);

    if (!existingCard)
      return reply.status(404).send({
        message: "Card not found",
      });

    await db.delete(kanbanCards)
      .where(eq(kanbanCards.id, id));

    reply.status(200).send({
      message: `Card with ID ${id} deleted`,
    });
  } catch (err) {
    console.error("[KanbanController] Error in deleteCard:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const addComment = async (
  req: FastifyRequest<{
    Body: {
      cardId?: string;
      text?: string;
      userId?: string;
      replyForCommentId?: string;
    }
  }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] createComment accessed");
  const { cardId, text, userId, replyForCommentId } = req.body || {};

  try {
    if (!cardId?.trim() || !text?.trim() || !userId?.trim())
      return reply.status(400).send({
        message: "cardId, text, and userId are required",
      });

    const commentId = uuid();
    await db.insert(kanbanComments).values({
      id: commentId,
      text: text.trim(),
      userId: userId,
      kanbanCardId: cardId,
      replyForKanbanCommentId: replyForCommentId || null,
    });

    const newComment = await db.select()
      .from(kanbanComments)
      .where(eq(kanbanComments.id, commentId))
      .then(rows => rows[0]);

    reply.status(201).send({
      message: "Comment created successfully",
      data: newComment,
    });
  } catch (err) {
    console.error("[KanbanController] Error in createComment:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const deleteComment = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] deleteComment accessed");
  const { id } = req.params;

  try {
    if (!id)
      return reply.status(400).send({
        message: "Comment id is required",
      });

    const existingComment = await db.select()
      .from(kanbanComments)
      .where(eq(kanbanComments.id, id))
      .then(rows => rows[0]);

    if (!existingComment)
      return reply.status(404).send({
        message: "Comment not found",
      });

    await db.delete(kanbanComments)
      .where(eq(kanbanComments.id, id));

    reply.status(200).send({
      message: `Comment with ID ${id} deleted`,
    });
  } catch (err) {
    console.error("[KanbanController] Error in deleteComment:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const updateComment = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { text?: string } }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] updateComment accessed");
  const { id } = req.params;
  const { text } = req.body || {};

  try {
    if (!id)
      return reply.status(400).send({
        message: "Comment id is required",
      });

    if (!text?.trim())
      return reply.status(400).send({
        message: "Comment text is required",
      });

    await db.update(kanbanComments)
      .set({ text: text.trim() })
      .where(eq(kanbanComments.id, id));

    const updatedComment = await db.select()
      .from(kanbanComments)
      .where(eq(kanbanComments.id, id))
      .then(rows => rows[0]);

    if (!updatedComment)
      return reply.status(404).send({
        message: "Comment not found",
      });

    reply.status(200).send({
      message: `Comment with ID ${id} updated`,
      data: updatedComment,
    });
  } catch (err) {
    console.error("[KanbanController] Error in updateComment:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const addReply = async (
  req: FastifyRequest<{ Body: { kanbanCardId?: string; replyForKanbanCommentId?: string; text?: string; userId?: string } }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] addReply accessed");
  const { kanbanCardId, replyForKanbanCommentId, text, userId } = req.body || {};

  try {
    if (!kanbanCardId?.trim() || !text?.trim() || !userId?.trim())
      return reply.status(400).send({
        message: "kanbanCardId, text, and userId are required",
      });

    const commentId = uuid();
    await db.insert(kanbanComments).values({
      id: commentId,
      text: text.trim(),
      userId: userId,
      kanbanCardId: kanbanCardId,
      replyForKanbanCommentId: replyForKanbanCommentId || null,
    });

    const newReply = await db.select()
      .from(kanbanComments)
      .where(eq(kanbanComments.id, commentId))
      .then(rows => rows[0]);

    reply.status(201).send({
      message: "Reply created successfully",
      data: newReply,
    });
  } catch (err) {
    console.error("[KanbanController] Error in addReply:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const getReplies = async (
  req: FastifyRequest<{ Params: { commentId: string } }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] getReplies accessed");
  const { commentId } = req.params;

  try {
    if (!commentId)
      return reply.status(400).send({
        message: "Comment id is required",
      });

    const replies = await db.select({
      id: kanbanComments.id,
      text: kanbanComments.text,
      userId: kanbanComments.userId,
      kanbanCardId: kanbanComments.kanbanCardId,
      replyForKanbanCommentId: kanbanComments.replyForKanbanCommentId,
      createdAt: kanbanComments.createdAt,
      firstname: users.firstname,
      lastname: users.lastname,
      username: users.username,
    })
      .from(kanbanComments)
      .leftJoin(users, eq(kanbanComments.userId, users.id))
      .where(eq(kanbanComments.replyForKanbanCommentId, commentId));

    reply.status(200).send({
      message: `Retrieved ${replies.length} replies`,
      data: replies,
    });
  } catch (err) {
    console.error("[KanbanController] Error in getReplies:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const likeCard = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] likeCard accessed");
  const { id } = req.params;

  try {
    if (!id)
      return reply.status(400).send({
        message: "Card id is required",
      });

    const card = await db.select()
      .from(kanbanCards)
      .where(eq(kanbanCards.id, id))
      .then(rows => rows[0]);

    if (!card)
      return reply.status(404).send({
        message: "Card not found",
      });

    await db.update(kanbanCards)
      .set({ likes: (card.likes || 0) + 1 })
      .where(eq(kanbanCards.id, id));

    const updatedCard = await db.select()
      .from(kanbanCards)
      .where(eq(kanbanCards.id, id))
      .then(rows => rows[0]);

    reply.status(200).send({
      message: `Card with ID ${id} liked`,
      data: updatedCard,
    });
  } catch (err) {
    console.error("[KanbanController] Error in likeCard:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const moveCard = async (
  req: FastifyRequest<{ Body: { cardId?: string; newColumnId?: string; newIndex?: number } }>,
  reply: FastifyReply
) => {
  console.log("[KanbanController] moveCard accessed");
  const { cardId, newColumnId, newIndex } = req.body || {};

  try {
    if (!cardId?.trim() || !newColumnId?.trim())
      return reply.status(400).send({
        message: "cardId and newColumnId are required",
      });

    const card = await db.select()
      .from(kanbanCards)
      .where(eq(kanbanCards.id, cardId))
      .then(rows => rows[0]);

    if (!card)
      return reply.status(404).send({
        message: "Card not found",
      });

    await db.update(kanbanCards)
      .set({ kanbanColumnId: newColumnId })
      .where(eq(kanbanCards.id, cardId));

    const updatedCard = await db.select()
      .from(kanbanCards)
      .where(eq(kanbanCards.id, cardId))
      .then(rows => rows[0]);

    reply.status(200).send({
      message: `Card moved successfully`,
      data: updatedCard,
    });
  } catch (err) {
    console.error("[KanbanController] Error in moveCard:", err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};
