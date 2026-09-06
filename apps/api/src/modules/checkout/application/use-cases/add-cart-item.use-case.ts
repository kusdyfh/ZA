import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Cart } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { CART_REPOSITORY, type CartRepository } from '../../domain/repositories/cart.repository';
import {
  PRODUCT_VARIANT_REPOSITORY,
  type ProductVariantRepository,
} from '../../../catalog/domain/repositories/product-variant.repository';
import { ProductVariantNotFoundError } from '../../domain/errors/checkout.errors';

export interface AddCartItemInput {
  guestToken: string;
  variantId: string;
  quantity: number;
}

/** "Add to cart" — increments quantity if the variant is already present. Never checks stock (per ADR 0001: reservation happens only at checkout submission). */
@Injectable()
export class AddCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly productVariants: ProductVariantRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: AddCartItemInput): Promise<Cart> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const quantity = CartItem.validateQuantity(input.quantity);

    const variant = await this.productVariants.findById(storeId, input.variantId);
    if (!variant) {
      throw new ProductVariantNotFoundError(input.variantId);
    }

    const cart = await this.carts.findOrCreateByToken(storeId, input.guestToken);
    return this.carts.addItem(cart.id, variant.id, quantity);
  }
}
