import { FastifyRequest, FastifyReply } from 'fastify';
import { UpdateUrlSchema, ShortKeyParamSchema, PaginationSchema } from '@redirex/shared';
import { UrlService } from '../../services/urlService.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from "../../utils/validation.js";

// GET /api/urls
export const listUrls = (urlService: UrlService) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(req, reply);
    if (!user) return;

    const { data: query, error } = validateQuery(PaginationSchema, req.query);
    if (error) return reply.status(400).send({ error });

    const result = await urlService.getUserUrls(user.userId, query.page, query.limit);
    return reply.send(result);
  };

// GET /api/urls/:shortKey
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

// PATCH /api/urls/:shortKey
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
  