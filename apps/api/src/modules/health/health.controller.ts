import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiExcludeController } from '@nestjs/swagger';

/**
 * Liveness and readiness are deliberately separate endpoints per
 * docs/v2/adr/0009-operational-architecture.md, and both sit outside
 * the /v1 prefix (see main.ts) since infrastructure tooling — PM2,
 * uptime checks, a future load balancer — probes health at a fixed,
 * unversioned path.
 *
 * Readiness checks process health (heap/RSS) today. Database and
 * Redis reachability checks are added to this endpoint once apps/api
 * gains a Prisma client and a Redis client — out of scope for this
 * foundation epic per its brief ("Do not implement Database Models").
 */
@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  liveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
    ]);
  }
}
