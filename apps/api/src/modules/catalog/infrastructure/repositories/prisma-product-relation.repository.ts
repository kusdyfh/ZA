import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Product } from '../../domain/entities/product.entity';
import type { ProductRelationRepository } from '../../domain/repositories/product-relation.repository';
import type { ProductRelationTypeValue } from '../../domain/constants/product-relation-type.constants';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class PrismaProductRelationRepository implements ProductRelationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async replace(
    productId: string,
    type: ProductRelationTypeValue,
    relatedProductIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.productRelation.deleteMany({ where: { productId, type } }),
      this.prisma.productRelation.createMany({
        data: relatedProductIds.map((relatedProductId, index) => ({
          productId,
          relatedProductId,
          type,
          sortOrder: index,
        })),
      }),
    ]);
  }

  async listRelatedProducts(productId: string, type: ProductRelationTypeValue): Promise<Product[]> {
    const records = await this.prisma.productRelation.findMany({
      where: { productId, type },
      include: { relatedProduct: true },
      orderBy: { sortOrder: 'asc' },
    });
    return records.map((record) => ProductMapper.toDomain(record.relatedProduct));
  }
}
