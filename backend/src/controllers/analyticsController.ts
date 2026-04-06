import { FastifyRequest, FastifyReply } from 'fastify';
import { UrlService } from '../../services/urlService.js';
import { ShortKeyParamSchema } from '../../types/schemas.js';
import { validateParams } from '../../utils/validate.js';
import { authenticate } from '../../middleware/auth.js';

// GET /api/urls/:shortKey/analytics
export const getAnalytics = (urlService: UrlService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(req, reply);
    if (!user) return;

    const { data: params, error } = validateParams(ShortKeyParamSchema, req.params);
    if (error) return reply.status(400).send({ error });

    const analytics = await urlService.getUrlAnalytics(params.shortKey, user.userId);
    if (!analytics) return reply.status(404).send({ error: 'Not found or not yours' });
    return reply.send(analytics);
  };
  