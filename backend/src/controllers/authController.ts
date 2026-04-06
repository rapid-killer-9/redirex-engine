import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../../services/authService.js';
import { RegisterSchema, LoginSchema } from '../../types/schemas.js';
import { validateBody } from '../../utils/validate.js';

export const register = (authService: AuthService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const { data, error } = validateBody(RegisterSchema, req.body);
    if (error) return reply.status(400).send({ error });

    try {
      const result = await authService.register(data.email, data.password);
      return reply.status(201).send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return reply.status(409).send({ error: message });
    }
  };

export const login = (authService: AuthService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const { data, error } = validateBody(LoginSchema, req.body);
    if (error) return reply.status(400).send({ error });

    try {
      const result = await authService.login(data.email, data.password);
      return reply.send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return reply.status(401).send({ error: message });
    }
  };