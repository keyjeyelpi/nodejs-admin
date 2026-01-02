import type { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { prisma } from "../config/prisma.config.ts";
import type {
  CreateBoardRequest,
  CreateCardRequest,
  CreateColumnRequest,
  CreateCommentRequest,
  CreateReplyRequest,
  MoveCardRequest,
} from "./type.d.ts";

// Interfaces for request validation
const isUndefined = (a: unknown): a is undefined => typeof a === "undefined";

export const getAllKanbanBoards = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || undefined;
    const limit = parseInt(req.query.limit as string) || undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const [boards, totalCount] = await Promise.all([
      prisma.kanbanBoard.findMany({
        ...(!isUndefined(skip) && {
          skip,
        }),
        ...(!isUndefined(limit) && {
          take: limit,
        }),
        include: {
          kanbanColumns: {
            orderBy: {
              name: "asc",
            },
            include: {
              kanbanCards: {
                orderBy: {
                  title: "asc",
                },
                include: {
                  kanbanComments: {
                    select: {
                      id: true,
                      text: true,
                      author: true,
                      kanbanCardId: true,
                      replyForKanbanCardId: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.kanbanBoard.count(),
    ]);

    // Transform the data to match the expected format
    const transformedBoards = boards.map((board) => ({
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
            comments: card.kanbanComments.filter((c) => !c.replyForKanbanCardId)
              .length,
          },
        })),
      })),
    }));

    res.status(200).json({
      message: `Retrieved ${boards.length} kanban boards`,
      data: transformedBoards,
      count: boards.length,
      totalCount,
      ...(page &&
        limit && {
          pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            hasNextPage: page < Math.ceil(totalCount / limit),
            hasPrevPage: page > 1,
          },
        }),
    });
  } catch (err) {
    console.error("Error fetching boards:", err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const getBoardList = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || undefined;
    const limit = parseInt(req.query.limit as string) || undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const [boards, totalCount] = await Promise.all([
      prisma.kanbanBoard.findMany({
        ...(!isUndefined(skip) && {
          skip,
        }),
        ...(!isUndefined(limit) && {
          take: limit,
        }),
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.kanbanBoard.count(),
    ]);

    res.status(200).json({
      message: `Retrieved ${boards.length} boards`,
      data: boards,
      count: boards.length,
      totalCount,
      ...(page &&
        limit && {
          pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            hasNextPage: page < Math.ceil(totalCount / limit),
            hasPrevPage: page > 1,
          },
        }),
    });
  } catch (err) {
    console.error("Error fetching board list:", err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const getBoardById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id)
    return res.status(400).json({
      message: "Board id is required",
    });

  try {
    const board = await prisma.kanbanBoard.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!board)
      return res.status(404).json({
        message: "Board not found",
      });

    res.status(200).json({
      message: `Retrieved board with ID ${id}`,
      data: board,
    });
  } catch (err) {
    console.error("Error fetching board:", err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const getKanbanBoardById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || undefined;
  const limit = parseInt(req.query.limit as string) || undefined;
  const skip = page && limit ? (page - 1) * limit : undefined;

  if (!id)
    return res.status(400).json({
      message: "Board id is required",
    });

  try {
    const board = await prisma.kanbanBoard.findUnique({
      where: {
        id,
      },
      include: {
        kanbanColumns: {
          orderBy: {
            order: "asc",
          },
          include: {
            kanbanCards: {
              ...(!isUndefined(skip) && {
                skip,
              }),
              ...(!isUndefined(limit) && {
                take: limit,
              }),
              orderBy: {
                title: "asc",
              },
              include: {
                kanbanComments: {
                  orderBy: {
                    id: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!board)
      return res.status(404).json({
        message: "Kanban board not found",
      });

    // Get total card count for pagination
    const totalCardCount = await prisma.kanbanCard.count({
      where: {
        kanbanColumn: {
          boardId: id,
        },
      },
    });

    // Transform the data to match the expected format with nested replies
    const transformedBoard = {
      id: board.id,
      name: board.name,
      kanbanColumns: board.kanbanColumns.map((column) => ({
        id: column.id,
        name: column.name,
        disableAdd: column.disableAdd,
        items: column.kanbanCards.map((card) => {
          // Get top-level comments (no replyForKanbanCardId)
          const topLevelComments = card.kanbanComments.filter(
            (c) => !c.replyForKanbanCardId
          );

          // Get replies for each comment
          const commentsWithReplies = topLevelComments.map((comment) => {
            const replies = card.kanbanComments
              .filter((c) => c.replyForKanbanCardId === comment.id)
              .map((reply) => ({
                id: reply.id,
                text: reply.text,
                author: reply.author,
                date: new Date().toISOString(), // TODO: Add date field to schema
                avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(reply.author)}`,
              }));

            return {
              id: comment.id,
              text: comment.text,
              author: comment.author,
              date: new Date().toISOString(), // TODO: Add date field to schema
              avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(comment.author)}`,
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

    res.status(200).json({
      message: `Get kanban board with ID ${id}`,
      data: transformedBoard,
      ...(page &&
        limit && {
          pagination: {
            page,
            limit,
            totalCards: totalCardCount,
            totalPages: Math.ceil(totalCardCount / limit),
            hasNextPage: page < Math.ceil(totalCardCount / limit),
            hasPrevPage: page > 1,
          },
        }),
    });
  } catch (err) {
    console.error("Error fetching board:", err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const createBoard = async (req: Request, res: Response) => {
  const { name }: CreateBoardRequest = req.body;

  try {
    if (!name?.trim())
      return res.status(400).json({
        message: "Board name is required",
      });

    const board = await prisma.kanbanBoard.create({
      data: {
        id: uuid(),
        name: name.trim(),
      },
      include: {
        kanbanColumns: true,
      },
    });

    res.status(201).json({
      message: "Board created successfully",
      data: board,
    });
  } catch (err) {
    console.error("Error creating board:", err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const updateBoard = async (req: Request, res: Response) => {
  const { body, params } = req;
  const { id } = params;
  const {
    name,
  }: {
    name: string;
  } = body;

  try {
    if (!id)
      return res.status(400).json({
        message: "Board id is required",
      });

    if (!name?.trim())
      return res.status(400).json({
        message: "Board name is required",
      });

    const updatedBoard = await prisma.kanbanBoard.update({
      where: {
        id,
      },
      data: {
        name: name.trim(),
      },
      include: {
        kanbanColumns: {
          include: {
            kanbanCards: {
              include: {
                kanbanComments: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      message: `Board with ID ${id} updated`,
      data: updatedBoard,
    });
  } catch (err: any) {
    console.error("Error updating board:", err);

    if (err.code === "P2025")
      return res.status(404).json({
        message: "Board not found",
      });

    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const deleteBoard = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    if (!id)
      return res.status(400).json({
        message: "Board id is required",
      });

    // Check if board exists
    const existingBoard = await prisma.kanbanBoard.findUnique({
      where: {
        id,
      },
    });

    if (!existingBoard)
      return res.status(404).json({
        message: "Board not found",
      });

    await prisma.kanbanBoard.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      message: `Board with ID ${id} deleted`,
    });
  } catch (err: any) {
    console.error("Error deleting board:", err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const addColumn = async (req: Request, res: Response) => {
  const { boardId, name, disableAdd, order }: CreateColumnRequest = req.body;

  try {
    if (!boardId?.trim() || !name?.trim())
      return res.status(400).json({
        message: "boardId and name are required",
      });

    // Check if board exists
    const boardExists = await prisma.kanbanBoard.findUnique({
      where: {
        id: boardId,
      },
    });

    if (!boardExists)
      return res.status(404).json({
        message: "Board not found",
      });

    const column = await prisma.kanbanColumn.create({
      data: {
        id: uuid(),
        name: name.trim(),
        disableAdd: disableAdd || false,
        order: order || 0,
        boardId,
      },
      include: {
        kanbanCards: true,
      },
    });

    res.status(201).json({
      message: "Column added successfully",
      data: column,
    });
  } catch (err: any) {
    console.error("Error creating column:", err);

    if (err.code === "P2003")
      return res.status(400).json({
        message: "Invalid board ID",
      });

    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const addCard = async (req: Request, res: Response) => {
  const {
    kanbanColumnId,
    title,
    description,
    categoryTitle,
    categoryColor,
    priority,
    status,
  }: CreateCardRequest = req.body;

  try {
    if (!kanbanColumnId?.trim() || !title?.trim())
      return res.status(400).json({
        message: "kanbanColumnId and title are required",
      });

    // Check if column exists and is not disabled for adding
    const column = await prisma.kanbanColumn.findUnique({
      where: {
        id: kanbanColumnId,
      },
    });

    if (!column)
      return res.status(404).json({
        message: "Column not found",
      });

    if (column.disableAdd)
      return res.status(400).json({
        message: "Adding cards is disabled for this column",
      });

    const card = await prisma.kanbanCard.create({
      data: {
        id: uuid(),
        title: title.trim(),
        description: description?.trim() || "",
        categoryTitle: categoryTitle?.trim() || "",
        categoryColor: categoryColor?.trim() || "",
        priority: priority || "MEDIUM",
        status: status || "TO_DO",
        kanbanColumnId,
      },
      include: {
        kanbanComments: true,
      },
    });

    res.status(201).json({
      message: "Card added successfully",
      data: card,
    });
  } catch (err: any) {
    console.error("Error creating card:", err);

    if (err.code === "P2003")
      return res.status(400).json({
        message: "Invalid column ID",
      });

    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const moveCard = async (req: Request, res: Response) => {
  const { cardId, targetColumnId }: MoveCardRequest = req.body;

  try {
    if (!cardId?.trim() || !targetColumnId?.trim())
      return res.status(400).json({
        message: "cardId and targetColumnId are required",
      });

    // Check if card exists
    const card = await prisma.kanbanCard.findUnique({
      where: {
        id: cardId,
      },
    });

    if (!card)
      return res.status(404).json({
        message: "Card not found",
      });

    // Check if target column exists
    const targetColumn = await prisma.kanbanColumn.findUnique({
      where: {
        id: targetColumnId,
      },
    });

    if (!targetColumn)
      return res.status(404).json({
        message: "Target column not found",
      });

    const updatedCard = await prisma.kanbanCard.update({
      where: {
        id: cardId,
      },
      data: {
        kanbanColumnId: targetColumnId,
      },
      include: {
        kanbanColumn: true,
        kanbanComments: true,
      },
    });

    res.status(200).json({
      message: "Card moved successfully",
      data: updatedCard,
    });
  } catch (err: any) {
    console.error("Error moving card:", err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const updateColumn = async (req: Request, res: Response) => {
  const { body, params } = req;
  const { id } = params;
  const { name, disableAdd, order } = body;

  try {
    if (!id)
      return res.status(400).json({
        message: "id is required",
      });

    const updatedColumn = await prisma.kanbanColumn.update({
      where: {
        id,
      },
      data: {
        name,
        disableAdd,
        order,
      },
    });

    res.status(200).json({
      message: `Column with ID ${id} updated`,
      data: updatedColumn,
    });
  } catch (err: any) {
    console.error(err);

    if (err.code === "P2025")
      return res.status(404).json({
        message: "Column not found",
      });

    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const updateCard = async (req: Request, res: Response) => {
  const { body, params } = req;
  const { id } = params;
  const {
    title,
    description,
    categoryTitle,
    categoryColor,
    likes,
    priority,
    status,
  } = body;

  try {
    if (!id)
      return res.status(400).json({
        message: "id is required",
      });

    const updatedCard = await prisma.kanbanCard.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        categoryTitle,
        categoryColor,
        likes,
        priority,
        status,
      },
    });

    res.status(200).json({
      message: `Card with ID ${id} updated`,
      data: updatedCard,
    });
  } catch (err: any) {
    console.error(err);

    if (err.code === "P2025")
      return res.status(404).json({
        message: "Card not found",
      });

    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const deleteColumn = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    if (!id)
      return res.status(400).json({
        message: "id is required",
      });

    await prisma.kanbanColumn.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      message: `Column with ID ${id} deleted`,
    });
  } catch (err: any) {
    console.error(err);

    if (err.code === "P2025")
      return res.status(404).json({
        message: "Column not found",
      });

    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const deleteCard = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    if (!id)
      return res.status(400).json({
        message: "id is required",
      });

    // Check if card exists
    const existingCard = await prisma.kanbanCard.findUnique({
      where: {
        id,
      },
    });

    if (!existingCard)
      return res.status(404).json({
        message: "Card not found",
      });

    await prisma.kanbanCard.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      message: `Card with ID ${id} deleted`,
    });
  } catch (err: any) {
    console.error("Error deleting card:", err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const addComment = async (req: Request, res: Response) => {
  const { kanbanCardId, text, author }: CreateCommentRequest = req.body;

  try {
    if (!kanbanCardId?.trim() || !text?.trim() || !author?.trim())
      return res.status(400).json({
        message: "kanbanCardId, text, and author are required",
      });

    // Check if card exists
    const cardExists = await prisma.kanbanCard.findUnique({
      where: {
        id: kanbanCardId,
      },
    });

    if (!cardExists)
      return res.status(404).json({
        message: "Card not found",
      });

    const comment = await prisma.kanbanComment.create({
      data: {
        id: uuid(),
        text: text.trim(),
        author: author.trim(),
        kanbanCardId,
      },
    });

    res.status(201).json({
      message: "Comment added successfully",
      data: comment,
    });
  } catch (err: any) {
    console.error("Error creating comment:", err);

    if (err.code === "P2003")
      return res.status(400).json({
        message: "Invalid card ID",
      });

    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const updateComment = async (req: Request, res: Response) => {
  const { body, params } = req;
  const { id } = params;
  const {
    text,
  }: {
    text: string;
  } = body;

  try {
    if (!id)
      return res.status(400).json({
        message: "Comment id is required",
      });

    if (!text?.trim())
      return res.status(400).json({
        message: "Comment text is required",
      });

    const updatedComment = await prisma.kanbanComment.update({
      where: {
        id,
      },
      data: {
        text: text.trim(),
      },
    });

    res.status(200).json({
      message: `Comment with ID ${id} updated`,
      data: updatedComment,
    });
  } catch (err: any) {
    console.error("Error updating comment:", err);

    if (err.code === "P2025")
      return res.status(404).json({
        message: "Comment not found",
      });

    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    if (!id)
      return res.status(400).json({
        message: "Comment id is required",
      });

    // Check if comment exists
    const existingComment = await prisma.kanbanComment.findUnique({
      where: {
        id,
      },
    });

    if (!existingComment)
      return res.status(404).json({
        message: "Comment not found",
      });

    // Delete all replies to this comment first
    await prisma.kanbanComment.deleteMany({
      where: {
        replyForKanbanCardId: id,
      },
    });

    await prisma.kanbanComment.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      message: `Comment with ID ${id} deleted`,
    });
  } catch (err: any) {
    console.error("Error deleting comment:", err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const addReply = async (req: Request, res: Response) => {
  const { commentId, text, author }: CreateReplyRequest = req.body;

  try {
    if (!commentId?.trim() || !text?.trim() || !author?.trim())
      return res.status(400).json({
        message: "commentId, text, and author are required",
      });

    // Check if parent comment exists
    const parentComment = await prisma.kanbanComment.findUnique({
      where: {
        id: commentId,
      },
    });

    if (!parentComment)
      return res.status(404).json({
        message: "Parent comment not found",
      });

    const reply = await prisma.kanbanComment.create({
      data: {
        id: uuid(),
        text: text.trim(),
        author: author.trim(),
        kanbanCardId: parentComment.kanbanCardId,
        replyForKanbanCardId: commentId,
      },
    });

    res.status(201).json({
      message: "Reply added successfully",
      data: reply,
    });
  } catch (err: any) {
    console.error("Error creating reply:", err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const getReplies = async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const page = parseInt(req.query.page as string) || undefined;
  const limit = parseInt(req.query.limit as string) || undefined;
  const skip = page && limit ? (page - 1) * limit : undefined;

  try {
    if (!commentId)
      return res.status(400).json({
        message: "Comment id is required",
      });

    // Check if parent comment exists
    const parentComment = await prisma.kanbanComment.findUnique({
      where: {
        id: commentId,
      },
    });

    if (!parentComment)
      return res.status(404).json({
        message: "Comment not found",
      });

    const [replies, totalCount] = await Promise.all([
      prisma.kanbanComment.findMany({
        where: {
          replyForKanbanCardId: commentId,
        },
        ...(!isUndefined(skip) && {
          skip,
        }),
        ...(!isUndefined(limit) && {
          take: limit,
        }),
        orderBy: {
          id: "asc",
        },
      }),
      prisma.kanbanComment.count({
        where: {
          replyForKanbanCardId: commentId,
        },
      }),
    ]);

    res.status(200).json({
      message: `Retrieved ${replies.length} replies`,
      data: replies,
      count: replies.length,
      totalCount,
      ...(page &&
        limit && {
          pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            hasNextPage: page < Math.ceil(totalCount / limit),
            hasPrevPage: page > 1,
          },
        }),
    });
  } catch (err: any) {
    console.error("Error fetching replies:", err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};

export const likeCard = async (req: Request, res: Response) => {
  const { body, params } = req;
  const { id } = params;
  const {
    increment = true,
  }: {
    increment?: boolean;
  } = body;

  try {
    if (!id)
      return res.status(400).json({
        message: "Card id is required",
      });

    const card = await prisma.kanbanCard.findUnique({
      where: {
        id,
      },
    });

    if (!card)
      return res.status(404).json({
        message: "Card not found",
      });

    const newLikes = increment ? card.likes + 1 : Math.max(0, card.likes - 1);

    const updatedCard = await prisma.kanbanCard.update({
      where: {
        id,
      },
      data: {
        likes: newLikes,
      },
    });

    res.status(200).json({
      message: increment ? "Card liked" : "Card unliked",
      data: updatedCard,
    });
  } catch (err: any) {
    console.error("Error updating card likes:", err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};
