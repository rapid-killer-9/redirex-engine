import { Worker } from 'bullmq';

const worker = new Worker('analytics-queue', async (job) => {
  const { shortKey, ip, ua } = job.data;
  // Perform Geo-IP lookup or batch-insert into Postgres
  console.log(`Logging click for ${shortKey} from ${ip}`);
  await db.query('INSERT INTO analytics (short_key, ip_address, user_agent) VALUES ($1, $2, $3)', [shortKey, ip, ua]);
});