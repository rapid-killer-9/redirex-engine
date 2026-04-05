import { Pool } from 'pg';
import Redis from 'ioredis';
import { encode } from '../utils/base62.js';

export class UrlService {
  constructor(private db: Pool, private redis: Redis) {}

  async shortenUrl(longUrl: string) {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const tempKey = Math.random().toString(36).substring(2, 10);

      const res = await client.query(
        'INSERT INTO urls (long_url, short_key) VALUES ($1, $2) RETURNING id',
        [longUrl, tempKey]
      );

      const insertedId = res.rows[0]?.id;

      if (insertedId === undefined || insertedId === null) {
        throw new Error("ID not found in database response");
      }

      // Convert to BigInt explicitly to handle Postgres BIGINT strings
      const shortKey = encode(insertedId);

      await client.query('UPDATE urls SET short_key = $1 WHERE id = $2', [shortKey, insertedId]);

      await client.query('COMMIT');

      await this.redis.set(`url:${shortKey}`, longUrl, 'EX', 86400);

      return { 
        shortKey, 
        shortUrl: `http://localhost:3000/${shortKey}` 
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getLongUrl(shortKey: string) {
    let url = await this.redis.get(`url:${shortKey}`);
    if (url) return url;

    const res = await this.db.query('SELECT long_url FROM urls WHERE short_key = $1', [shortKey]);
    
    const longUrl = res.rows[0]?.long_url;

    if (longUrl) {
      await this.redis.set(`url:${shortKey}`, longUrl, 'EX', 86400);
      return longUrl;
    }
    return null;
  }
}
