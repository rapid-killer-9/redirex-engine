import { FastifyRequest, FastifyReply } from 'fastify';
import { UrlService } from '../services/urlService.js';
import { Queue } from 'bullmq';
import { authenticate } from '../middleware/auth.js';

// ── Public redirect ───────────────────────────────────────────────────────
export const handleRedirect = (urlService: UrlService, analyticsQueue: Queue) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const { shortKey } = req.params as { shortKey: string };
    const longUrl = await urlService.getLongUrl(shortKey);

    if (longUrl) {
      analyticsQueue.add('log-click', {
        shortKey,
        ip:      req.ip,
        ua:      req.headers['user-agent'],
        referer: req.headers['referer'],
      });
      return reply.redirect(longUrl);
    }

    return reply.status(404).send({ error: 'Not Found' });
  };

// ── Shorten (public OR authenticated) ────────────────────────────────────
export const handleShorten = (urlService: UrlService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const { url, title, description, expiresAt } = req.body as {
      url: string; title?: string; description?: string; expiresAt?: string;
    };

    // Optional auth – if token present, attach to url; else anonymous
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { verifyJwt } = await import('../services/authService.js');
        const payload = verifyJwt<{ userId: string }>(authHeader.slice(7));
        userId = payload.userId;
      } catch { /* anonymous */ }
    }

    try {
      const result = await urlService.shortenUrl(url, userId, { title, description, expiresAt });
      return reply.status(201).send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to shorten URL';
      console.error('[shorten error]', err);
      return reply.status(500).send({ error: message });
    }
  };

// ── List user's URLs ──────────────────────────────────────────────────────
export const handleListUrls = (urlService: UrlService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(req, reply);
    if (!user) return;

    const { page = '1', limit = '20' } = req.query as { page?: string; limit?: string };
    const result = await urlService.getUserUrls(user.userId, parseInt(page, 10), Math.min(parseInt(limit, 10), 100));
    return reply.send(result);
  };

// ── Get single URL detail + recent clicks ────────────────────────────────
export const handleGetUrl = (urlService: UrlService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(req, reply);
    if (!user) return;

    const { shortKey } = req.params as { shortKey: string };
    const url = await urlService.getUserUrl(shortKey, user.userId);
    if (!url) return reply.status(404).send({ error: 'Not found' });
    return reply.send(url);
  };

// ── Update URL ────────────────────────────────────────────────────────────
export const handleUpdateUrl = (urlService: UrlService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(req, reply);
    if (!user) return;

    const { shortKey } = req.params as { shortKey: string };
    const { isActive, title, description, expiresAt } = req.body as {
      isActive?: boolean; title?: string; description?: string; expiresAt?: string | null;
    };

    try {
      const updated = await urlService.updateUrl(shortKey, user.userId, { isActive, title, description, expiresAt });
      if (!updated) return reply.status(404).send({ error: 'Not found or not yours' });
      return reply.send(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      return reply.status(400).send({ error: message });
    }
  };

// ── Delete URL ────────────────────────────────────────────────────────────
export const handleDeleteUrl = (urlService: UrlService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(req, reply);
    if (!user) return;

    const { shortKey } = req.params as { shortKey: string };
    const deleted = await urlService.deleteUrl(shortKey, user.userId);
    if (!deleted) return reply.status(404).send({ error: 'Not found or not yours' });
    return reply.status(204).send();
  };

// ── Analytics ─────────────────────────────────────────────────────────────
export const handleGetAnalytics = (urlService: UrlService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(req, reply);
    if (!user) return;

    const { shortKey } = req.params as { shortKey: string };
    const analytics = await urlService.getUrlAnalytics(shortKey, user.userId);
    if (!analytics) return reply.status(404).send({ error: 'Not found or not yours' });
    return reply.send(analytics);
  };
  