import { Pool } from 'pg';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL Connection
if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is not defined in .env");
  process.exit(1);
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Redis Connection with BullMQ-specific settings
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null // This is the fix for BullMQ
});

// The Queue
export const analyticsQueue = new Queue('analytics-logic', {
  connection: redis
});