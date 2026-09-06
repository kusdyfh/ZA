import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Product } from '../../domain/entities/product.entity';
import type {
  CreateProductData,
  ProductListFilters,
  ProductRepository,
} from '../../domain/repositories/product.repository';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProductData): Promise<Product> {
    const record = await this.prisma.product.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        slug: data.slug.toString(),
        sku: data.sku,
        shortDescription: data.shortDescription,
        description: data.description,
        price: data.price.toDecimalString(),
        discountPrice: data.discountPrice?.toDecimalString() ?? null,
        currencyCode: data.price.currency,
        categoryId: data.categoryId,
        brandId: data.brandId,
        isFeatured: data.isFeatured,
        isBestSeller: data.isBestSeller,
        isNewArrival: data.isNewArrival,
        isGiftBox: data.isGiftBox,
        metaTitle: data.seo.metaTitle,
        metaDescription: data.seo.metaDescription,
        ogImageUrl: data.seo.ogImageUrl,
        highlights: data.highlights,
        richContent: data.richContent,
      },
    });
    return ProductMapper.toDomain(record);
  }

  async save(product: Product): Promise<void> {
    const props = product.toProps();
    await this.prisma.product.update({
      where: { id: props.id },
      data: {
        name: props.name,
        slug: props.slug.toString(),
        sku: props.sku,
        shortDescription: props.shortDescription,
        description: props.description,
        status: props.status,
        price: props.price.toDecimalString(),
        discountPrice: props.discountPrice?.toDecimalString() ?? null,
        currencyCode: props.price.currency,
        categoryId: props.categoryId,
        brandId: props.brandId,
        isFeatured: props.isFeatured,
        isBestSeller: props.isBestSeller,
        isNewArrival: props.isNewArrival,
        isGiftBox: props.isGiftBox,
        metaTitle: props.seo.metaTitle,
        metaDescription: props.seo.metaDescription,
        ogImageUrl: props.seo.ogImageUrl,
        highlights: props.highlights,
        richContent: props.richContent,
      },
    });
  }

  async findById(storeId: string, id: string): Promise<Product | null> {
    const record = await this.prisma.product.findFirst({ where: { id, storeId } });
    return record ? ProductMapper.toDomain(record) : null;
  }

  async findBySlug(storeId: string, slug: string): Promise<Product | null> {
    const record = await this.prisma.product.findUnique({ where: { storeId_slug: { storeId, slug } } });
    return record ? ProductMapper.toDomain(record) : null;
  }

  async findBySku(storeId: string, sku: string): Promise<Product | null> {
    const record = await this.prisma.product.findUnique({ where: { storeId_sku: { storeId, sku } } });
    return record ? ProductMapper.toDomain(record) : null;
  }

  async findManyByIds(storeId: string, ids: string[]): Promise<Product[]> {
    const records = await this.prisma.product.findMany({ where: { storeId, id: { in: ids } } });
    return records.map(ProductMapper.toDomain);
  }

  async list(storeId: string, filters?: ProductListFilters): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = { storeId };
    if (filters?.status) where.status = filters.status;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.brandId) where.brandId = filters.brandId;
    if (filters?.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
    if (filters?.isBestSeller !== undefined) where.isBestSeller = filters.isBestSeller;
    if (filters?.isNewArrival !== undefined) where.isNewArrival = filters.isNewArrival;
    if (filters?.priceMin !== undefined || filters?.priceMax !== undefined) {
      where.price = {
        ...(filters.priceMin !== undefined ? { gte: filters.priceMin } : {}),
        ...(filters.priceMax !== undefined ? { lte: filters.priceMax } : {}),
      };
    }
    if (filters?.colorId ?? filters?.sizeId) {
      where.variants = {
        some: {
          ...(filters.colorId ? { colorId: filters.colorId } : {}),
          ...(filters.sizeId ? { sizeId: filters.sizeId } : {}),
        },
      };
    }

    const records = await this.prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } });
    return records.map(ProductMapper.toDomain);
  }

  async replaceTags(_storeId: string, productId: string, tagIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.productTag.deleteMany({ where: { productId } }),
      this.prisma.productTag.createMany({
        data: tagIds.map((tagId) => ({ productId, tagId })),
        skipDuplicates: true,
      }),
    ]);
  }

  async listTagIds(_storeId: string, productId: string): Promise<string[]> {
    const records = await this.prisma.productTag.findMany({
      where: { productId },
      select: { tagId: true },
    });
    return records.map((record) => record.tagId);
  }
}
