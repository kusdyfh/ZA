import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ShippingMethod } from '../../domain/entities/shipping-method.entity';
import {
  SHIPPING_METHOD_REPOSITORY,
  type ShippingMethodRepository,
} from '../../domain/repositories/shipping-method.repository';

@Injectable()
export class ListShippingMethodsUseCase {
  constructor(
    @Inject(SHIPPING_METHOD_REPOSITORY) private readonly methods: ShippingMethodRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<ShippingMethod[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.methods.list(storeId);
  }
}
