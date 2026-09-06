import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Cart } from '../../domain/entities/cart.entity';
import type { CartRepository } from '../../domain/repositories/cart.repository';
import { CartItemNotFoundError } from '../../domain/errors/checkout.errors';
import { CartMapper } from '../mappers/cart.mapper';

const CART_INCLUDE = { items: true };

@Injectable()
export class PrismaCartRepository implements CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateByToken(storeId: string, guestToken: string): Promise<Cart> {
    const record = await this.prisma.cart.upsert({
      where: { guestToken },
      update: {},
      create: { storeId, guestToken },
      include: CART_INCLUDE,
    });
    return CartMapper.toDomain(record);
  }

  async findByToken(storeId: string, guestToken: string): Promise<Cart | null> {
    const record = await this.prisma.cart.findFirst({ where: { guestToken, storeId }, include: CART_INCLUDE });
    return record ? CartMapper.toDomain(record) : null;
  }

  /** Upserts — increments quantity if the variant is already in the cart, matching the (cartId, variantId) unique constraint. */
  async addItem(cartId: string, variantId: string, quantity: number): Promise<Cart> {
    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId, variantId } },
      update: { quantity: { increment: quantity } },
      create: { cartId, variantId, quantity },
    });
    return this.reload(cartId);
  }

  /** Sets an absolute quantity — the item must already be in the cart (distinct from addItem's upsert semantics). */
  async setItemQuantity(cartId: string, variantId: string, quantity: number): Promise<Cart> {
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId, variantId } },
    });
    if (!existing) {
      throw new CartItemNotFoundError(variantId);
    }
    await this.prisma.cartItem.update({ where: { id: existing.id }, data: { quantity } });
    return this.reload(cartId);
  }

  /** Idempotent — removing an item not present in the cart is a no-op, not an error. */
  async removeItem(cartId: string, variantId: string): Promise<Cart> {
    await this.prisma.cartItem.deleteMany({ where: { cartId, variantId } });
    return this.reload(cartId);
  }

  async clear(cartId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
  }

  private async reload(cartId: string): Promise<Cart> {
    const record = await this.prisma.cart.findUniqueOrThrow({ where: { id: cartId }, include: CART_INCLUDE });
    return CartMapper.toDomain(record);
  }
}
