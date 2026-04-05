import { Pool } from 'pg';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// ── tiny JWT (no external dep) ──────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'SecRetKey';

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function signJwt(payload: object, expiresInSec = 60 * 60 * 24 * 7): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = base64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSec, iat: Math.floor(Date.now() / 1000) }));
  const sig    = base64url(createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

export function verifyJwt<T = Record<string, unknown>>(token: string): T {
  const [header, body, sig] = token.split('.');
  const expected = base64url(createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest());
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new Error('Invalid signature');
  const payload = JSON.parse(Buffer.from(body, 'base64').toString()) as T & { exp: number };
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
}

// ── password hashing (crypto only, no bcrypt dep) ──────────────────────────
function hashPassword(password: string, salt: string): string {
  return createHmac('sha256', salt).update(password).digest('hex');
}

function generateSalt(): string {
  return randomBytes(16).toString('hex');
}

// ── AuthService ─────────────────────────────────────────────────────────────
export class AuthService {
  constructor(private db: Pool) {}

  async register(email: string, password: string): Promise<{ userId: string; token: string }> {
    const existing = await this.db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) throw new Error('Email already registered');

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const res = await this.db.query(
      'INSERT INTO users (email, password_hash, salt) VALUES ($1, $2, $3) RETURNING id',
      [email, passwordHash, salt]
    );

    const userId = res.rows[0].id as string;
    const token  = signJwt({ userId, email });
    return { userId, token };
  }

  async login(email: string, password: string): Promise<{ userId: string; token: string }> {
    const res = await this.db.query(
      'SELECT id, password_hash, salt FROM users WHERE email = $1',
      [email]
    );
    if (res.rows.length === 0) throw new Error('Invalid credentials');

    const { id: userId, password_hash, salt } = res.rows[0] as { id: string; password_hash: string; salt: string };
    const hash = hashPassword(password, salt);

    if (!timingSafeEqual(Buffer.from(hash), Buffer.from(password_hash))) {
      throw new Error('Invalid credentials');
    }

    const token = signJwt({ userId, email });
    return { userId, token };
  }
}
