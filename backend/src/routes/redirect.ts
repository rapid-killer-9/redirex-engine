fastify.get('/:shortKey', async (request, reply) => {
  const { shortKey } = request.params;

  // 1. Check L1 Cache (Redis)
  let longUrl = await redis.get(`url:${shortKey}`);

  if (!longUrl) {
    // 2. L2 Fallback (Postgres)
    const result = await db.query('SELECT long_url FROM urls WHERE short_key = $1', [shortKey]);
    if (result.rows) {
      longUrl = result.rows.long_url;
      await redis.set(`url:${shortKey}`, longUrl, 'EX', 3600); // Cache for 1 hour
    }
  }

  if (longUrl) {
    // 3. Async Analytics - Don't 'await' this!
    analyticsQueue.add('log-click', { 
      shortKey, 
      ip: request.ip, 
      ua: request.headers['user-agent'] 
    });

    return reply.redirect(302, longUrl);
  }

  return reply.status(404).send({ error: 'Not Found' });
});