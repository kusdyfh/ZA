import { Global, Module } from '@nestjs/common';
import { OUTBOX_REPOSITORY } from './outbox.repository';
import { PrismaOutboxRepository } from './prisma-outbox.repository';

/** The outbox write/read surface (ADR 0023) — `EventEmitterModule.forRoot()` itself lives in `AppModule`/`WorkerModule`, mirroring how `ConfigModule.forRoot()` is registered once at the root. */
@Global()
@Module({
  providers: [{ provide: OUTBOX_REPOSITORY, useClass: PrismaOutboxRepository }],
  exports: [OUTBOX_REPOSITORY],
})
export class EventsModule {}
