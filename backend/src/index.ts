import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

import { db, redis, analyticsQueue } from './config/infra.js';
import { UrlService }  from './services/urlService.js';
import { AuthService } from './services/authService.js';
import { authRoutes }  from './routes/authRoutes.js';
import { urlRoutes }   from './routes/urlRoutes.js';

const app = Fastify({ logger: true });

const urlService  = new UrlService(db, redis);
const authService = new AuthService(db);


// ── Plugins ───────────────────────────────────────────────────────────────
await app.register(cors, { origin: process.env.FRONTEND_URL || true });

await app.register(fastifySwagger, {
  openapi: {
    info: { title: 'Redirex API', description: 'URL shortener with user auth', version: '2.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
});

await app.register(fastifySwaggerUi, { routePrefix: '/docs' });

// ── Routes ────────────────────────────────────────────────────────────────
authRoutes(app, authService);
urlRoutes(app, urlService, analyticsQueue);

// ── Boot ──────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
    console.log('🚀 Server ready at http://localhost:3000');
    console.log('📖 API Docs at  http://localhost:3000/docs');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
