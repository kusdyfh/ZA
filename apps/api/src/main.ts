import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseEnvelopeInterceptor } from './shared/interceptors/response-envelope.interceptor';
import type { AppConfig } from './shared/config/configuration';

async function bootstrap(): Promise<void> {
  // rawBody: true (Epic 12, ADR 0026) — Stripe webhook signature
  // verification needs the exact raw request bytes; NestJS populates
  // `req.rawBody` alongside the normal parsed body when this is set, no
  // other request handling changes.
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>('app');

  app.setGlobalPrefix(appConfig.globalPrefix, {
    exclude: ['health', 'health/ready'],
  });

  app.enableCors({
    origin: appConfig.corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  // Per docs/08-API-REVIEW.md §9, Swagger is admin/dev tooling, not a
  // public surface — not served in production.
  if (appConfig.nodeEnv !== 'production') {
    const swaggerDocument = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('ZA Store API')
        .setDescription(
          'Internal API reference. See docs/04-API-DESIGN.md for conventions. ' +
            'Staff endpoints require "Authorization: Bearer <access-token>" — ' +
            'obtained from POST /v1/auth/login — per ' +
            'docs/v2/adr/0017-authentication-and-authorization.md. Customer-facing ' +
            'endpoints under /v1/customers use a separate token from ' +
            'POST /v1/customers/auth/login|register — per ' +
            'docs/v2/adr/0018-customer-accounts.md.',
        )
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
        .addBearerAuth(
          { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          'customer-access-token',
        )
        .build(),
    );
    SwaggerModule.setup(`${appConfig.globalPrefix}/docs`, app, swaggerDocument);
  }

  await app.listen(appConfig.port);
  logger.log(
    `ZA Store API listening on port ${appConfig.port} (prefix: /${appConfig.globalPrefix})`,
  );
}

void bootstrap();
