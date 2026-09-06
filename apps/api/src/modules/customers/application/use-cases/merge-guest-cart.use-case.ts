import { Inject, Injectable } from '@nestjs/common';
import { CART_REPOSITORY, type CartRepository } from '../../../checkout/domain/repositories/cart.repository';
import { CUSTOMER_REPOSITORY, type CustomerRepository } from '../../domain/repositories/customer.repository';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';

export interface MergeGuestCartInput {
  customerId: string;
  guestToken: string;
}

/**
 * ADR 0018 §3 — a customer's cart is just their own permanent
 * `cartToken`, reused through the exact same guest-cart machinery
 * (`CartRepository.findOrCreateByToken`/`addItem`/`clear`, all
 * unchanged from Epic 5). A no-op when the supplied `guestToken` is
 * already the customer's own token, or when the guest cart is empty.
 */
@Injectable()
export class MergeGuestCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customers: CustomerRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: MergeGuestCartInput): Promise<void> {
    const customer = await this.customers.findById(input.customerId);
    if (!customer || input.guestToken === customer.cartToken) {
      return;
    }

    const storeId = await this.storeContext.getCurrentStoreId();
    const guestCart = await this.carts.findOrCreateByToken(storeId, input.guestToken);
    if (guestCart.isEmpty) {
      return;
    }

    const customerCart = await this.carts.findOrCreateByToken(storeId, customer.cartToken);
    for (const item of guestCart.items) {
      await this.carts.addItem(customerCart.id, item.variantId, item.quantity);
    }
    await this.carts.clear(guestCart.id);
  }
}
