import { FastifyInstance } from 'fastify';
import { AuthService } from '../services/authService.js';
import * as authController from "../controllers/auth/authController.js";

export function authRoutes(app: FastifyInstance, authService: AuthService) {
  app.post('/api/auth/register', authController.register(authService));
  app.post('/api/auth/login',    authController.login(authService));
}