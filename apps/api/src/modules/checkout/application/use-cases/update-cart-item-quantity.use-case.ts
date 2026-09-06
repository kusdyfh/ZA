import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Cart } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { CART_REPOSITORY, type CartRepository } from '../../domain/repositories/cart.repository';
import { CartNotFoundError } from '../../domain/errors/checkout.errors';

export interface UpdateCartItemQuantityInput {
  guestToken: string;
  variantId: string;
  quantity: number;
}

/** Cart-page quantity edit — sets an absolute value, distinct from AddCartItemUseCase's "add more" semantics. */
@Injectable()
export class UpdateCartItemQuantityUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: UpdateCartItemQuantityInput): Promise<Cart> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const quantity = CartItem.validateQuantity(input.quantity);

    const cart = await this.carts.findByToken(storeId, input.guestToken);
    if (!cart) {
      throw new CartNotFoundError(input.guestToken);
    }

    return this.carts.setItemQuantity(cart.id, input.variantId, quantity);
  }
}
