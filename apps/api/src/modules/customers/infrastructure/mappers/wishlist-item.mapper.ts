import type { WishlistItem as WishlistItemRecord } from '@prisma/client';
import { WishlistItem } from '../../domain/entities/wishlist-item.entity';

export class WishlistItemMapper {
  static toDomain(this: void, record: WishlistItemRecord): WishlistItem {
    return WishlistItem.reconstitute({
      id: record.id,
      customerId: record.customerId,
      productId: record.productId,
      createdAt: record.createdAt,
    });
  }
}
