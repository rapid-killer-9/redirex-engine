import { FastifyRequest, FastifyReply } from 'fastify';
import { UrlService } from '../../services/urlService.js';
import { UpdateUrlSchema, ShortKeyParamSchema, PaginationSchema } from '../../types/schemas.js';
import { validateBody, validateParams, validateQuery } from '../../utils/validate.js';
import { authenticate } from '../../middleware/auth.js';

// GET /api/urls — list all URLs for authenticated user
export const listUrls = (urlService: UrlService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(req, reply);
    if (!user) return;

    const { data: query, error: queryError } = validateQuery(PaginationSchema, req.query);
    if (queryError) return reply.status(400).send({ error: queryError });

    const result = await urlService.getUserUrls(user.userId, query.page, query.limit);
    return reply.send(result);
  };

// GET /api/urls/:shortKey — get single URL with recent clicks
export const getUrl = (urlService: UrlService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(req, reply);
    if (!user) return;

    const { data: params, error } = validateParams(ShortKeyParamSchema, req.params);
    if (error) return reply.status(400).send({ error });

    const url = await urlService.getUserUrl(params.shortKey, user.userId);
    if (!url) return reply.status(404).send({ error: 'Not found' });
    return reply.send(url);
  };

// PATCH /api/urls/:shortKey — update URL metadata
export const updateUrl = (urlService: UrlService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(req, reply);
    if (!user) return;

    const { data: params, error: paramError } = validateParams(ShortKeyParamSchema, req.params);
    if (paramError) return reply.status(400).send({ error: paramError });

    const { data: body, error: bodyError } = validateBody(UpdateUrlSchema, req.body);
    if (bodyError) return reply.status(400).send({ error: bodyError });

    try {
      const updated = await urlService.updateUrl(params.shortKey, user.userId, {
        isActive:    body.isActive,
        title:       body.title,
        description: body.description,
        expiresAt:   body.expiresAt ?? undefined,
      });
      if (!updated) return reply.status(404).send({ error: 'Not found or not yours' });
      return reply.send(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed';
      return reply.status(400).send({ error: message });
    }
  };

// DELETE /api/urls/:shortKey
export const deleteUrl = (urlService: UrlService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(req, reply);
    if (!user) return;

    const { data: params, error } = validateParams(ShortKeyParamSchema, req.params);
    if (error) return reply.status(400).send({ error });

    const deleted = await urlService.deleteUrl(params.shortKey, user.userId);
    if (!deleted) return reply.status(404).send({ error: 'Not found or not yours' });
    return reply.status(204).send();
  };