import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/authService.js';

export const handleRegister = (authService: AuthService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = req.body as { email: string; password: string };
    try {
      const result = await authService.register(email, password);
      return reply.status(201).send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return reply.status(409).send({ error: message });
    }
  };

export const handleLogin = (authService: AuthService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = req.body as { email: string; password: string };
    try {
      const result = await authService.login(email, password);
      return reply.send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return reply.status(401).send({ error: message });
    }
  };