import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Category } from '../../domain/entities/category.entity';
import type { CategoryRepository, CreateCategoryData } from '../../domain/repositories/category.repository';
import { CategoryMapper } from '../mappers/category.mapper';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCategoryData): Promise<Category> {
    const record = await this.prisma.category.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        slug: data.slug.toString(),
        description: data.description,
        sortOrder: data.sortOrder,
        parentId: data.parentId,
        metaTitle: data.seo.metaTitle,
        metaDescription: data.seo.metaDescription,
      },
    });
    return CategoryMapper.toDomain(record);
  }

  async save(category: Category): Promise<void> {
    const props = category.toProps();
    await this.prisma.category.update({
      where: { id: props.id },
      data: {
        name: props.name,
        slug: props.slug.toString(),
        description: props.description,
        sortOrder: props.sortOrder,
        isActive: props.isActive,
        parentId: props.parentId,
        metaTitle: props.seo.metaTitle,
        metaDescription: props.seo.metaDescription,
      },
    });
  }

  async findById(storeId: string, id: string): Promise<Category | null> {
    const record = await this.prisma.category.findFirst({ where: { id, storeId } });
    return record ? CategoryMapper.toDomain(record) : null;
  }

  async findBySlug(storeId: string, slug: string): Promise<Category | null> {
    const record = await this.prisma.category.findUnique({
      where: { storeId_slug: { storeId, slug } },
    });
    return record ? CategoryMapper.toDomain(record) : null;
  }

  async list(storeId: string): Promise<Category[]> {
    const records = await this.prisma.category.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
    });
    return records.map(CategoryMapper.toDomain);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.category.deleteMany({ where: { id, storeId } });
  }

  async countChildren(storeId: string, categoryId: string): Promise<number> {
    return this.prisma.category.count({ where: { storeId, parentId: categoryId } });
  }

  async countProducts(storeId: string, categoryId: string): Promise<number> {
    return this.prisma.product.count({ where: { storeId, categoryId } });
  }
}
