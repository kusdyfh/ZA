import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { WishlistItem } from '../../domain/entities/wishlist-item.entity';
import type { WishlistItemRepository } from '../../domain/repositories/wishlist-item.repository';
import { WishlistItemMapper } from '../mappers/wishlist-item.mapper';

@Injectable()
export class PrismaWishlistItemRepository implements WishlistItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, productId: string): Promise<WishlistItem> {
    const record = await this.prisma.wishlistItem.create({ data: { customerId, productId } });
    return WishlistItemMapper.toDomain(record);
  }

  async findByCustomerAndProduct(customerId: string, productId: string): Promise<WishlistItem | null> {
    const record = await this.prisma.wishlistItem.findUnique({
      where: { customerId_productId: { customerId, productId } },
    });
    return record ? WishlistItemMapper.toDomain(record) : null;
  }

  async delete(customerId: string, productId: string): Promise<void> {
    await this.prisma.wishlistItem.deleteMany({ where: { customerId, productId } });
  }

  async listByCustomerId(customerId: string): Promise<WishlistItem[]> {
    const records = await this.prisma.wishlistItem.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(WishlistItemMapper.toDomain);
  }
}
