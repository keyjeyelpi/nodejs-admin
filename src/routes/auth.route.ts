import type { FastifyInstance } from 'fastify';
import { signature } from '../middleware/signature.middleware.ts';
import {
    login,
    refreshToken,
    logout,
    cleanupExpiredTokens,
    validateSession,
} from '../controllers/auth.controller.ts';

const authRoutes = async (fastify: FastifyInstance) => {
    fastify.post<{
        Body: {
            username?: string;
            password?: string;
        }
    }>('/login', { preHandler: [signature] }, login);

    fastify.get('/validate-session', { preHandler: [signature] }, validateSession);

    fastify.post<{
        Body: {
            refreshToken?: string;
        }
    }>('/refresh', { preHandler: [signature] }, refreshToken);

    fastify.post<{
        Body: {
            refreshToken?: string;
        }
    }>('/logout', { preHandler: [signature] }, logout);

    fastify.get('/cleanup', { preHandler: [signature] }, cleanupExpiredTokens);
}

export default authRoutes;