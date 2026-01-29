import { Server } from 'http';
import { logger } from './logger';

export function setupGracefulShutdown(server: Server, onShutdown?: () => Promise<void>) {
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      if (onShutdown) await onShutdown();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
