import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

// Infrastructure & Logic Imports
import { db, redis, analyticsQueue } from './config/infra.js';
import { UrlService } from './services/urlService.js';
import { handleRedirect } from './controllers/urlController.js';
import { ShortenUrlSchema, RedirectSchema } from './schemas/urlSchema.js';

const app = Fastify({ logger: true });
const urlService = new UrlService(db, redis);

// 1. Register Plugins
await app.register(cors);

await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'ScaleLink API',
      description: 'High-performance URL redirection engine',
      version: '1.0.0'
    }
  }
});

await app.register(fastifySwaggerUi, { routePrefix: '/docs' });

// 2. Routes
// REDIRECT ROUTE
app.get('/:shortKey', { schema: RedirectSchema }, handleRedirect(urlService, analyticsQueue));

// SHORTEN ROUTE
app.post('/api/shorten', { schema: ShortenUrlSchema }, async (req, reply) => {
  const { url } = req.body as { url: string };
  return urlService.shortenUrl(url); 
});
// 3. Start Server
const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Server ready at http://localhost:3000');
    console.log('📖 API Docs ready at http://localhost:3000/docs');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
