import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_MEDIA_REPOSITORY,
  type ProductMediaItem,
  type ProductMediaRepository,
} from '../../domain/repositories/product-media.repository';

export interface ListProductMediaInput {
  productId: string;
}

@Injectable()
export class ListProductMediaUseCase {
  constructor(@Inject(PRODUCT_MEDIA_REPOSITORY) private readonly media: ProductMediaRepository) {}

  execute(input: ListProductMediaInput): Promise<ProductMediaItem[]> {
    return this.media.listByProduct(input.productId);
  }
}
