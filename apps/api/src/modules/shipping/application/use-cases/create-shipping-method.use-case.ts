import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ShippingMethod } from '../../domain/entities/shipping-method.entity';
import {
  SHIPPING_METHOD_REPOSITORY,
  type ShippingMethodRepository,
} from '../../domain/repositories/shipping-method.repository';

export interface CreateShippingMethodInput {
  name: string;
  minDays: number;
  maxDays: number;
}

@Injectable()
export class CreateShippingMethodUseCase {
  constructor(
    @Inject(SHIPPING_METHOD_REPOSITORY) private readonly methods: ShippingMethodRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: CreateShippingMethodInput): Promise<ShippingMethod> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.methods.create({ storeId, name: input.name, minDays: input.minDays, maxDays: input.maxDays });
  }
}
