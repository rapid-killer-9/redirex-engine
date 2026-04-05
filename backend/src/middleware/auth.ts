import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJwt } from '../services/authService.js';

export interface AuthPayload {
  userId: string;
  email: string;
  exp: number;
  iat: number;
}

// Attach to req.user – usage: await authenticate(req, reply); if (reply.sent) return;
export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<AuthPayload | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Missing or invalid Authorization header' });
    return null;
  }

  try {
    const token = authHeader.slice(7);
    return verifyJwt<AuthPayload>(token);
  } catch {
    reply.status(401).send({ error: 'Invalid or expired token' });
    return null;
  }
}
