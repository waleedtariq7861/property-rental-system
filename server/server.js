import app from './app.js';
import pool from './config/database.js';
import env from './config/env.js';

const server = app.listen(env.port, (error) => {
  if (!error) {
    console.log(`RentEase API listening on http://localhost:${env.port}`);
  }
});

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received. Closing RentEase API.`);

  server.close(async () => {
    try {
      await pool.end();
      process.exit(0);
    } catch (error) {
      console.error('Failed to close the database pool cleanly:', error);
      process.exit(1);
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

server.on('error', (error) => {
  console.error('Unable to start the RentEase API:', error);
  process.exit(1);
});
