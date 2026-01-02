// KANBAN CONTROLLER TYPES
export enum Priority {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum Status {
  TO_DO = 'TO_DO',
  DONE = 'DONE',
  REVIEW = 'REVIEW',
  PROCESS = 'PROCESS',
}

export interface CreateBoardRequest {
  name: string;
}

export interface CreateColumnRequest {
  boardId: string;
  name: string;
  disableAdd?: boolean;
}

export interface CreateCardRequest {
  kanbanColumnId: string;
  title: string;
  description?: string;
  categoryTitle?: string;
  categoryColor?: string;
  priority?: Priority;
  status?: Status;
}

export interface CreateCommentRequest {
  kanbanCardId: string;
  text: string;
  author: string;
}

export interface CreateReplyRequest {
  commentId: string;
  text: string;
  author: string;
}

export interface MoveCardRequest {
  cardId: string;
  targetColumnId: string;
}
