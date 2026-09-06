import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Cart } from '../../domain/entities/cart.entity';
import { CART_REPOSITORY, type CartRepository } from '../../domain/repositories/cart.repository';
import { CartNotFoundError } from '../../domain/errors/checkout.errors';

export interface RemoveCartItemInput {
  guestToken: string;
  variantId: string;
}

@Injectable()
export class RemoveCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: RemoveCartItemInput): Promise<Cart> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const cart = await this.carts.findByToken(storeId, input.guestToken);
    if (!cart) {
      throw new CartNotFoundError(input.guestToken);
    }
    return this.carts.removeItem(cart.id, input.variantId);
  }
}
