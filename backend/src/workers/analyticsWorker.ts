import { Worker, Job } from 'bullmq';
import { db, redis } from '../config/infra.js'; // Note the .js extension for ESM

console.log('🚀 Analytics Worker Started');

const worker = new Worker(
  'analytics-logic',
  async (job: Job) => {
    const { shortKey, ip, ua, referer } = job.data;

    try {
      console.log(`[Worker] Processing click for: ${shortKey}`);
      
      // Insert the click record
      // The Postgres trigger 'trg_increment_click' handles the URL total count automatically
      await db.query(
        `INSERT INTO analytics (short_key, ip_address, user_agent, referer) 
         VALUES ($1, $2, $3, $4)`,
        [shortKey, ip, ua, referer]
      );
      
    } catch (err) {
      console.error(`[Worker Error] Failed to process job ${job.id}:`, err);
      throw err; // BullMQ will retry based on default settings
    }
  },
  { 
    connection: redis,
    concurrency: 5 // Process 5 clicks at a time
  }
);

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});