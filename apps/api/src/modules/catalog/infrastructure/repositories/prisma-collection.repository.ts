import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Collection } from '../../domain/entities/collection.entity';
import type {
  CollectionProductEntry,
  CollectionRepository,
  CreateCollectionData,
} from '../../domain/repositories/collection.repository';
import { CollectionMapper } from '../mappers/collection.mapper';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class PrismaCollectionRepository implements CollectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCollectionData): Promise<Collection> {
    const record = await this.prisma.collection.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        slug: data.slug.toString(),
        description: data.description,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        metaTitle: data.seo.metaTitle,
        metaDescription: data.seo.metaDescription,
      },
    });
    return CollectionMapper.toDomain(record);
  }

  async save(collection: Collection): Promise<void> {
    const props = collection.toProps();
    await this.prisma.collection.update({
      where: { id: props.id },
      data: {
        name: props.name,
        slug: props.slug.toString(),
        description: props.description,
        isActive: props.isActive,
        startsAt: props.startsAt,
        endsAt: props.endsAt,
        metaTitle: props.seo.metaTitle,
        metaDescription: props.seo.metaDescription,
      },
    });
  }

  async findById(storeId: string, id: string): Promise<Collection | null> {
    const record = await this.prisma.collection.findFirst({ where: { id, storeId } });
    return record ? CollectionMapper.toDomain(record) : null;
  }

  async findBySlug(storeId: string, slug: string): Promise<Collection | null> {
    const record = await this.prisma.collection.findUnique({
      where: { storeId_slug: { storeId, slug } },
    });
    return record ? CollectionMapper.toDomain(record) : null;
  }

  async list(storeId: string): Promise<Collection[]> {
    const records = await this.prisma.collection.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
    });
    return records.map(CollectionMapper.toDomain);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.collection.deleteMany({ where: { id, storeId } });
  }

  async replaceProducts(_storeId: string, collectionId: string, orderedProductIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.collectionProduct.deleteMany({ where: { collectionId } }),
      this.prisma.collectionProduct.createMany({
        data: orderedProductIds.map((productId, index) => ({
          collectionId,
          productId,
          sortOrder: index,
        })),
      }),
    ]);
  }

  async listProducts(_storeId: string, collectionId: string): Promise<CollectionProductEntry[]> {
    const records = await this.prisma.collectionProduct.findMany({
      where: { collectionId },
      include: { product: true },
      orderBy: { sortOrder: 'asc' },
    });
    return records.map((record) => ({
      product: ProductMapper.toDomain(record.product),
      sortOrder: record.sortOrder,
    }));
  }
}
