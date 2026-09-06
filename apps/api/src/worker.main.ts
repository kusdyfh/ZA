import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { WorkerModule } from './worker.module';

/**
 * `za-worker`'s entrypoint (ADR 0023) — a separate OS process from
 * `za-api` (`main.ts`), started independently: `pnpm --filter @za/api
 * worker:dev` locally, or `node dist/worker.main.js` under its own PM2
 * process in production. `createApplicationContext` — no HTTP listener,
 * no port to bind.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('app.nodeEnv');

  logger.log(`ZA Store worker started (${nodeEnv}) — processing outbox-relay, notifications, email, maintenance queues.`);
}

void bootstrap();
