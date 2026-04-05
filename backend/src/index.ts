import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

import { db, redis, analyticsQueue } from './config/infra.js';
import { UrlService }  from './services/urlService.js';
import { AuthService } from './services/authService.js';
import { handleRedirect, handleShorten, handleListUrls, handleGetUrl, handleUpdateUrl, handleDeleteUrl, handleGetAnalytics } from './controllers/urlController.js';
import { handleRegister, handleLogin } from './controllers/authController.js';
import {
  ShortenUrlSchema, RedirectSchema,
  ListUrlsSchema, GetUrlSchema, UpdateUrlSchema, DeleteUrlSchema, AnalyticsSchema,
  RegisterSchema, LoginSchema,
} from './schemas/urlSchema.js';

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

// ── Auth routes ───────────────────────────────────────────────────────────
app.post('/api/auth/register', { schema: RegisterSchema }, handleRegister(authService));
app.post('/api/auth/login',    { schema: LoginSchema    }, handleLogin(authService));

// ── URL CRUD (protected) ──────────────────────────────────────────────────
app.get   ('/api/urls',              { schema: ListUrlsSchema  }, handleListUrls(urlService));
app.get   ('/api/urls/:shortKey',    { schema: GetUrlSchema    }, handleGetUrl(urlService));
app.patch ('/api/urls/:shortKey',    { schema: UpdateUrlSchema }, handleUpdateUrl(urlService));
app.delete('/api/urls/:shortKey',    { schema: DeleteUrlSchema }, handleDeleteUrl(urlService));
app.get   ('/api/urls/:shortKey/analytics', { schema: AnalyticsSchema }, handleGetAnalytics(urlService));

// ── Public routes ─────────────────────────────────────────────────────────
// NOTE: shorten is public but attaches userId if a valid Bearer token is present
app.post('/api/shorten', { schema: ShortenUrlSchema }, handleShorten(urlService));

// Redirect MUST be last – it catches all /:shortKey
app.get('/:shortKey', { schema: RedirectSchema }, handleRedirect(urlService, analyticsQueue));

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
