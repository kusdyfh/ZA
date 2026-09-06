import type { CartItem as CartItemRecord } from '@prisma/client';
import { CartItem } from '../../domain/entities/cart-item.entity';

export class CartItemMapper {
  static toDomain(this: void, record: CartItemRecord): CartItem {
    return CartItem.reconstitute({
      id: record.id,
      cartId: record.cartId,
      variantId: record.variantId,
      quantity: record.quantity,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
