import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJwt } from '../services/authService.js';
import type { JwtPayload } from '@redirex/shared';

export async function authenticate(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<JwtPayload | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Missing or invalid Authorization header' });
    return null;
  }
  try {
    const token = authHeader.slice(7);
    return verifyJwt<JwtPayload>(token);
  } catch (e) {
    reply.status(401).send({ error: 'Invalid or expired token' });
    return null;
  }
}
