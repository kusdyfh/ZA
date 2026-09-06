import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ShippingMethod } from '../../domain/entities/shipping-method.entity';
import {
  SHIPPING_METHOD_REPOSITORY,
  type ShippingMethodRepository,
  type UpdateShippingMethodData,
} from '../../domain/repositories/shipping-method.repository';

export interface UpdateShippingMethodInput extends UpdateShippingMethodData {
  methodId: string;
}

@Injectable()
export class UpdateShippingMethodUseCase {
  constructor(
    @Inject(SHIPPING_METHOD_REPOSITORY) private readonly methods: ShippingMethodRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: UpdateShippingMethodInput): Promise<ShippingMethod> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const { methodId, ...data } = input;
    return this.methods.update(storeId, methodId, data);
  }
}
