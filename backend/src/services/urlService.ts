import { Pool } from 'pg';
import Redis from 'ioredis';
import { encode } from '../utils/base62.js';

export class UrlService {
  constructor(private db: Pool, private redis: Redis) {}

  // ── Shorten ──────────────────────────────────────────────────────────────
  async shortenUrl(longUrl: string, userId?: string | null, meta?: { title?: string; description?: string; expiresAt?: string }) {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Insert with a temp key first to get the auto-generated id
      const tempKey = `tmp_${Math.random().toString(36).substring(2, 10)}`;

      const res = await client.query(
        `INSERT INTO urls (long_url, short_key, user_id, title, description, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [longUrl, tempKey, userId ?? null, meta?.title ?? null, meta?.description ?? null, meta?.expiresAt ?? null]
      );

      const insertedId = res.rows[0]?.id as bigint | string | undefined;
      if (insertedId === undefined || insertedId === null) throw new Error('ID not found in database response');

      const shortKey = encode(insertedId);
      await client.query('UPDATE urls SET short_key = $1 WHERE id = $2', [shortKey, insertedId]);
      await client.query('COMMIT');

      // Cache it
      await this.redis.set(`url:${shortKey}`, longUrl, 'EX', 86400);

      return {
        shortKey,
        shortUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/${shortKey}`,
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // ── Redirect lookup ───────────────────────────────────────────────────────
  async getLongUrl(shortKey: string): Promise<string | null> {
    // L1: Redis
    const cached = await this.redis.get(`url:${shortKey}`);
    if (cached) return cached;

    // L2: Postgres
    const res = await this.db.query(
      `SELECT long_url FROM urls
       WHERE short_key = $1
         AND is_active = TRUE
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [shortKey]
    );

    const longUrl = res.rows[0]?.long_url as string | undefined;
    if (longUrl) {
      await this.redis.set(`url:${shortKey}`, longUrl, 'EX', 86400);
      return longUrl;
    }
    return null;
  }

  // ── Get all URLs for a user ───────────────────────────────────────────────
  async getUserUrls(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [rows, countRes] = await Promise.all([
      this.db.query(
        `SELECT id, short_key, long_url, title, description, click_count, is_active, expires_at, created_at
         FROM urls
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      this.db.query('SELECT COUNT(*) FROM urls WHERE user_id = $1', [userId]),
    ]);

    return {
      urls: rows.rows,
      total: parseInt(countRes.rows[0].count as string, 10),
      page,
      limit,
    };
  }

  // ── Get a single URL (must belong to user) ────────────────────────────────
  async getUserUrl(shortKey: string, userId: string) {
    const res = await this.db.query(
      `SELECT u.*, 
              COALESCE(
                json_agg(a ORDER BY a.created_at DESC) FILTER (WHERE a.id IS NOT NULL),
                '[]'
              ) AS recent_clicks
       FROM urls u
       LEFT JOIN analytics a ON a.short_key = u.short_key
       WHERE u.short_key = $1 AND u.user_id = $2
       GROUP BY u.id`,
      [shortKey, userId]
    );
    return res.rows[0] ?? null;
  }

  // ── Update URL ────────────────────────────────────────────────────────────
  async updateUrl(shortKey: string, userId: string, updates: { isActive?: boolean; title?: string; description?: string; expiresAt?: string | null }) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.isActive !== undefined) { fields.push(`is_active = $${idx++}`);    values.push(updates.isActive); }
    if (updates.title !== undefined)    { fields.push(`title = $${idx++}`);        values.push(updates.title); }
    if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description); }
    if (updates.expiresAt !== undefined)   { fields.push(`expires_at = $${idx++}`);  values.push(updates.expiresAt); }

    if (fields.length === 0) throw new Error('No fields to update');

    values.push(shortKey, userId);
    const res = await this.db.query(
      `UPDATE urls SET ${fields.join(', ')} WHERE short_key = $${idx++} AND user_id = $${idx} RETURNING *`,
      values
    );

    if (res.rowCount === 0) return null;

    // Invalidate cache if toggling active or expiry
    if (updates.isActive === false || updates.expiresAt !== undefined) {
      await this.redis.del(`url:${shortKey}`);
    }

    return res.rows[0];
  }

  // ── Delete URL ────────────────────────────────────────────────────────────
  async deleteUrl(shortKey: string, userId: string): Promise<boolean> {
    const res = await this.db.query(
      'DELETE FROM urls WHERE short_key = $1 AND user_id = $2',
      [shortKey, userId]
    );
    if ((res.rowCount ?? 0) > 0) {
      await this.redis.del(`url:${shortKey}`);
      return true;
    }
    return false;
  }

  // ── Analytics for a URL ───────────────────────────────────────────────────
  async getUrlAnalytics(shortKey: string, userId: string) {
    // Verify ownership first
    const owner = await this.db.query(
      'SELECT id FROM urls WHERE short_key = $1 AND user_id = $2',
      [shortKey, userId]
    );
    if (owner.rows.length === 0) return null;

    const [daily, devices, countries] = await Promise.all([
      this.db.query(
        `SELECT date_trunc('day', created_at)::date AS day, COUNT(*) AS clicks
         FROM analytics WHERE short_key = $1 AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY day ORDER BY day`,
        [shortKey]
      ),
      this.db.query(
        `SELECT COALESCE(device_type, 'unknown') AS device, COUNT(*) AS clicks
         FROM analytics WHERE short_key = $1
         GROUP BY device ORDER BY clicks DESC`,
        [shortKey]
      ),
      this.db.query(
        `SELECT COALESCE(country, 'unknown') AS country, COUNT(*) AS clicks
         FROM analytics WHERE short_key = $1
         GROUP BY country ORDER BY clicks DESC LIMIT 10`,
        [shortKey]
      ),
    ]);

    return {
      daily: daily.rows,
      devices: devices.rows,
      countries: countries.rows,
    };
  }
}
