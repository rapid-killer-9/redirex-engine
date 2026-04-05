import { FastifyRequest, FastifyReply } from 'fastify';
import { UrlService } from '../services/urlService';
import { Queue } from 'bullmq';

export const handleRedirect = (urlService: UrlService, analyticsQueue: Queue) => 
  async (req: FastifyRequest, reply: FastifyReply) => {
    const { shortKey } = req.params as { shortKey: string };
    
    const longUrl = await urlService.getLongUrl(shortKey);

    if (longUrl) {
      // Async background task
      analyticsQueue.add('log-click', {
        shortKey,
        ip: req.ip,
        ua: req.headers['user-agent']
      });

      return reply.redirect(302, longUrl);
    }

    return reply.status(404).send({ error: 'Not Found' });
};