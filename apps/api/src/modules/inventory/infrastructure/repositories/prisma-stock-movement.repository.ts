import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { StockMovement } from '../../domain/entities/stock-movement.entity';
import type { StockMovementRepository } from '../../domain/repositories/stock-movement.repository';
import { StockMovementMapper } from '../mappers/stock-movement.mapper';

@Injectable()
export class PrismaStockMovementRepository implements StockMovementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByVariant(variantId: string): Promise<StockMovement[]> {
    const records = await this.prisma.stockMovement.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(StockMovementMapper.toDomain);
  }
}
