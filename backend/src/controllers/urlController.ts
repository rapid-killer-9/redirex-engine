import { FastifyRequest, FastifyReply } from 'fastify';
import { UrlService } from '../../services/urlService.js';
import { Queue } from 'bullmq';
import { ShortenUrlSchema, ShortKeyParamSchema } from '../../types/schemas.js';
import { validateBody, validateParams } from '../../utils/validate.js';
import { verifyJwt } from '../../services/authService.js';

// POST /api/shorten — public, but attaches userId if token present
export const shortenUrl = (urlService: UrlService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const { data, error } = validateBody(ShortenUrlSchema, req.body);
    if (error) return reply.status(400).send({ error });

    // Optional auth
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = verifyJwt<{ userId: string }>(authHeader.slice(7));
        userId = payload.userId;
      } catch {
        // anonymous — invalid token is not a hard error here
      }
    }

    try {
      const result = await urlService.shortenUrl(data.url, userId, {
        title:       data.title,
        description: data.description,
        expiresAt:   data.expiresAt,
      });
      return reply.status(201).send({ ...result, userId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to shorten URL';
      return reply.status(500).send({ error: message });
    }
  };

// GET /:shortKey — public redirect
export const redirectUrl = (urlService: UrlService, analyticsQueue: Queue) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const { data, error } = validateParams(ShortKeyParamSchema, req.params);
    if (error) return reply.status(400).send({ error });

    const longUrl = await urlService.getLongUrl(data.shortKey);
    if (!longUrl) return reply.status(404).send({ error: 'Not Found' });

    analyticsQueue.add('log-click', {
      shortKey: data.shortKey,
      ip:       req.ip,
      ua:       req.headers['user-agent'],
      referer:  req.headers['referer'],
    });

    return reply.redirect(longUrl);
  };
  