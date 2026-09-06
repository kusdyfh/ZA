import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_SPECIFICATION_REPOSITORY,
  type ProductSpecificationItem,
  type ProductSpecificationRepository,
} from '../../domain/repositories/product-specification.repository';

export interface ListProductSpecificationsInput {
  productId: string;
}

@Injectable()
export class ListProductSpecificationsUseCase {
  constructor(
    @Inject(PRODUCT_SPECIFICATION_REPOSITORY)
    private readonly specifications: ProductSpecificationRepository,
  ) {}

  execute(input: ListProductSpecificationsInput): Promise<ProductSpecificationItem[]> {
    return this.specifications.listByProduct(input.productId);
  }
}
