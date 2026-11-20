import { app } from './app.js';
import { env } from './config/env.js';

const HOST = '0.0.0.0';

const server = app.listen(env.PORT, HOST, () => {
  console.log('====================================================');
  console.log(` CredLock Security Intelligence API`);
  console.log(` Environment : ${env.NODE_ENV}`);
  console.log(` Listening on: http://${HOST}:${env.PORT}`);
  console.log(` Health check: http://${HOST}:${env.PORT}/api/health`);
  console.log('====================================================');
});

// Graceful shutdown handling
function shutdown(signal: string) {
  console.log(`\nReceived ${signal}. Gracefully shutting down HTTP server...`);
  server.close(() => {
    console.log('Server closed successfully.');
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Forcefully terminating process after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export { server };
