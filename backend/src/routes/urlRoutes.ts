import { FastifyInstance } from 'fastify';
import { Queue } from 'bullmq';
import { UrlService } from '../services/urlService.js';
import * as urlController        from '../controllers/url/urlController.js';
import * as urlMgmtController    from '../controllers/url/urlManagementController.js';
import * as analyticsController  from '../controllers/analytics/analyticsController.js';

export function urlRoutes(app: FastifyInstance, urlService: UrlService, analyticsQueue: Queue) {
  // ── Public ──────────────────────────────────────────────────────────────
  app.post('/api/shorten', urlController.shortenUrl(urlService));

  // ── URL Management (protected inside controllers) ────────────────────────
  app.get   ('/api/urls',                        urlMgmtController.listUrls(urlService));
  app.get   ('/api/urls/:shortKey',              urlMgmtController.getUrl(urlService));
  app.patch ('/api/urls/:shortKey',              urlMgmtController.updateUrl(urlService));
  app.delete('/api/urls/:shortKey',              urlMgmtController.deleteUrl(urlService));

  // ── Analytics (protected inside controller) ───────────────────────────────
  app.get('/api/urls/:shortKey/analytics', analyticsController.getAnalytics(urlService));

  // ── Redirect — MUST be last (catches all /:shortKey) ─────────────────────
  app.get('/:shortKey', urlController.redirectUrl(urlService, analyticsQueue));
}
