import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  ProductMediaInput,
  ProductMediaItem,
  ProductMediaRepository,
} from '../../domain/repositories/product-media.repository';

@Injectable()
export class PrismaProductMediaRepository implements ProductMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async replaceForProduct(
    productId: string,
    media: ProductMediaInput[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.productMedia.deleteMany({ where: { productId } }),
      this.prisma.productMedia.createMany({
        data: media.map((item, index) => ({
          productId,
          type: item.type,
          url: item.url,
          altText: item.altText,
          isCover: item.isCover,
          colorId: item.colorId,
          sortOrder: index,
        })),
      }),
    ]);
  }

  async listByProduct(productId: string): Promise<ProductMediaItem[]> {
    const records = await this.prisma.productMedia.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
    return records.map((record) => ({
      id: record.id,
      productId: record.productId,
      type: record.type,
      url: record.url,
      altText: record.altText,
      sortOrder: record.sortOrder,
      isCover: record.isCover,
      colorId: record.colorId,
    }));
  }
}
