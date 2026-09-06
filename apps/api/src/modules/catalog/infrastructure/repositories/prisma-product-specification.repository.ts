import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  ProductSpecificationInput,
  ProductSpecificationItem,
  ProductSpecificationRepository,
} from '../../domain/repositories/product-specification.repository';

@Injectable()
export class PrismaProductSpecificationRepository implements ProductSpecificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async replaceForProduct(productId: string, specs: ProductSpecificationInput[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.productSpecification.deleteMany({ where: { productId } }),
      this.prisma.productSpecification.createMany({
        data: specs.map((spec, index) => ({
          productId,
          label: spec.label,
          value: spec.value,
          sortOrder: index,
        })),
      }),
    ]);
  }

  async listByProduct(productId: string): Promise<ProductSpecificationItem[]> {
    const records = await this.prisma.productSpecification.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
    return records.map((record) => ({
      id: record.id,
      productId: record.productId,
      label: record.label,
      value: record.value,
      sortOrder: record.sortOrder,
    }));
  }
}
