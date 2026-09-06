import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import type {
  CreateProductVariantData,
  ProductVariantRepository,
} from '../../domain/repositories/product-variant.repository';
import { ProductVariantMapper } from '../mappers/product-variant.mapper';

const withProductCurrency = { include: { product: { select: { currencyCode: true } } } } as const;

@Injectable()
export class PrismaProductVariantRepository implements ProductVariantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProductVariantData): Promise<ProductVariant> {
    const record = await this.prisma.productVariant.create({
      data: {
        storeId: data.storeId,
        productId: data.productId,
        sku: data.sku,
        barcode: data.barcode,
        colorId: data.colorId,
        sizeId: data.sizeId,
        priceOverride: data.priceOverride?.toDecimalString() ?? null,
      },
      ...withProductCurrency,
    });
    return ProductVariantMapper.toDomain(record, record.product.currencyCode);
  }

  async save(variant: ProductVariant): Promise<void> {
    const props = variant.toProps();
    await this.prisma.productVariant.update({
      where: { id: props.id },
      data: {
        sku: props.sku,
        barcode: props.barcode,
        colorId: props.colorId,
        sizeId: props.sizeId,
        priceOverride: props.priceOverride?.toDecimalString() ?? null,
      },
    });
  }

  async findById(storeId: string, id: string): Promise<ProductVariant | null> {
    const record = await this.prisma.productVariant.findFirst({
      where: { id, storeId },
      ...withProductCurrency,
    });
    return record ? ProductVariantMapper.toDomain(record, record.product.currencyCode) : null;
  }

  async findBySku(storeId: string, sku: string): Promise<ProductVariant | null> {
    const record = await this.prisma.productVariant.findUnique({
      where: { storeId_sku: { storeId, sku } },
      ...withProductCurrency,
    });
    return record ? ProductVariantMapper.toDomain(record, record.product.currencyCode) : null;
  }

  async findByBarcode(storeId: string, barcode: string): Promise<ProductVariant | null> {
    const record = await this.prisma.productVariant.findUnique({
      where: { storeId_barcode: { storeId, barcode } },
      ...withProductCurrency,
    });
    return record ? ProductVariantMapper.toDomain(record, record.product.currencyCode) : null;
  }

  async listByProduct(storeId: string, productId: string): Promise<ProductVariant[]> {
    const records = await this.prisma.productVariant.findMany({
      where: { storeId, productId },
      orderBy: { createdAt: 'asc' },
      ...withProductCurrency,
    });
    return records.map((record) => ProductVariantMapper.toDomain(record, record.product.currencyCode));
  }

  async countByProduct(storeId: string, productId: string): Promise<number> {
    return this.prisma.productVariant.count({ where: { storeId, productId } });
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.productVariant.deleteMany({ where: { id, storeId } });
  }
}
