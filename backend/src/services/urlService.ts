import { Pool } from 'pg';
import Redis from 'ioredis';
import { encode } from '../utils/base62';

export class UrlService {
  constructor(private db: Pool, private redis: Redis) {}

  async shortenUrl(longUrl: string) {
    // 1. Persist to DB
    const res = await this.db.query(
      'INSERT INTO urls (long_url, short_key) VALUES ($1, $2) RETURNING id',
      [longUrl, 'pending']
    );
    const shortKey = encode(res.rows.id);

    // 2. Update with real key
    await this.db.query('UPDATE urls SET short_key = $1 WHERE id = $2', [shortKey, res.rows.id]);

    // 3. Cache Warmup
    await this.redis.set(`url:${shortKey}`, longUrl, 'EX', 86400);

    return { shortKey, longUrl };
  }

  async getLongUrl(shortKey: string) {
    // 1. L1 Cache
    let url = await this.redis.get(`url:${shortKey}`);
    if (url) return url;

    // 2. L2 Database
    const res = await this.db.query('SELECT long_url FROM urls WHERE short_key = $1', [shortKey]);
    url = res.rows?.long_url;

    if (url) await this.redis.set(`url:${shortKey}`, url, 'EX', 86400);
    return url;
  }
}