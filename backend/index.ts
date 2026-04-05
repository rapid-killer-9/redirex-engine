import Fastify from 'fastify';
import { UrlService } from './services/urlService';
import { handleRedirect } from './controllers/urlController';
import { db, redis, analyticsQueue } from './config/infrastructure'; // Assume helper file

const app = Fastify();
const urlService = new UrlService(db, redis);

// Clean Routing
app.get('/:shortKey', handleRedirect(urlService, analyticsQueue));

app.post('/shorten', async (req) => {
  const { url } = req.body as { url: string };
  return urlService.shortenUrl(url);
});

app.listen({ port: 3000 });
