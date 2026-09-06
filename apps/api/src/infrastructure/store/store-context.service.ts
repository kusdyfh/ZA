import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../shared/config/configuration';
import { PrismaService } from '../prisma/prisma.service';

interface ResolvedStore {
  id: string;
  defaultCurrency: string;
}

/**
 * Resolves the current store for every store-scoped repository call, per
 * docs/v2/adr/0006 and docs/v2/adr/0012. Today this is trivial (one
 * seeded Store row); the only thing that changes when real multi-tenancy
 * is built is what happens inside this one class (a `Store.domain`
 * lookup against the request's Host header) — no repository, domain, or
 * migration code changes.
 */
@Injectable()
export class StoreContext {
  private cachedStore: ResolvedStore | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getCurrentStoreId(): Promise<string> {
    const store = await this.resolveStore();
    return store.id;
  }

  async getDefaultCurrency(): Promise<string> {
    const store = await this.resolveStore();
    return store.defaultCurrency;
  }

  private async resolveStore(): Promise<ResolvedStore> {
    if (this.cachedStore) {
      return this.cachedStore;
    }

    const configuredStoreId = this.configService.get<AppConfig>('app')?.defaultStoreId;
    const store = configuredStoreId
      ? await this.prisma.store.findUniqueOrThrow({ where: { id: configuredStoreId } })
      : await this.prisma.store.findFirstOrThrow();

    this.cachedStore = { id: store.id, defaultCurrency: store.defaultCurrency };
    return this.cachedStore;
  }
}
