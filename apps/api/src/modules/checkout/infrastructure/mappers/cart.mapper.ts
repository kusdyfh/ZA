import type { Cart as CartRecord, CartItem as CartItemRecord } from '@prisma/client';
import { Cart } from '../../domain/entities/cart.entity';
import { CartItemMapper } from './cart-item.mapper';

export type CartRecordWithItems = CartRecord & { items: CartItemRecord[] };

export class CartMapper {
  static toDomain(this: void, record: CartRecordWithItems): Cart {
    return Cart.reconstitute({
      id: record.id,
      storeId: record.storeId,
      guestToken: record.guestToken,
      items: record.items.map((item) => CartItemMapper.toDomain(item).toProps()),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
