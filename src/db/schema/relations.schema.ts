import { relations } from "drizzle-orm";
import { accountTypes } from "./account-types.schema";
import { users } from "./users.schema";
import { userSettings } from "./user-settings.schema";
import { userTokens } from "./user-tokens.schema";
import { kanbanBoards } from "./kanban-boards.schema";
import { kanbanColumns } from "./kanban-columns.schema";
import { kanbanCards } from "./kanban-cards.schema";
import { kanbanComments } from "./kanban-comments.schema";

export const accountTypesRelations = relations(accountTypes, ({ many }) => ({
    users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
    accountType: one(accountTypes, {
        fields: [users.accountTypeId],
        references: [accountTypes.id],
    }),
    settings: one(userSettings, {
        fields: [users.id],
        references: [userSettings.userId],
    }),
    comments: many(kanbanComments),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
    user: one(users, {
        fields: [userSettings.userId],
        references: [users.id],
    }),
}));

export const userTokensRelations = relations(userTokens, ({ one }) => ({
    user: one(users, {
        fields: [userTokens.userID],
        references: [users.id],
    }),
}));

export const kanbanBoardsRelations = relations(kanbanBoards, ({ many }) => ({
    columns: many(kanbanColumns),
}));

export const kanbanColumnsRelations = relations(kanbanColumns, ({ one, many }) => ({
    board: one(kanbanBoards, {
        fields: [kanbanColumns.boardId],
        references: [kanbanBoards.id],
    }),
    cards: many(kanbanCards),
}));

export const kanbanCardsRelations = relations(kanbanCards, ({ one, many }) => ({
    column: one(kanbanColumns, {
        fields: [kanbanCards.kanbanColumnId],
        references: [kanbanColumns.id],
    }),
    comments: many(kanbanComments),
}));

export const kanbanCommentsRelations = relations(kanbanComments, ({ one }) => ({
    user: one(users, {
        fields: [kanbanComments.userId],
        references: [users.id],
    }),
    card: one(kanbanCards, {
        fields: [kanbanComments.kanbanCardId],
        references: [kanbanCards.id],
    }),
}));