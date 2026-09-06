import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaProductRepository } from './prisma-product.repository';
import { PrismaTagRepository } from './prisma-tag.repository';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';

describe('PrismaProductRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaProductRepository(prisma);
  const tagRepository = new PrismaTagRepository(prisma);
  let storeId: string;
  let categoryId: string;
  let productId: string;
  let tagAId: string;
  let tagBId: string;
  let colorId: string;
  let sizeId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Integration Test Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;

    const category = await prisma.category.create({
      data: { storeId, name: 'Scrubs', slug: 'scrubs' },
    });
    categoryId = category.id;

    const tagA = await tagRepository.create({ storeId, name: 'New', slug: Slug.fromRaw('new') });
    const tagB = await tagRepository.create({
      storeId,
      name: 'Bestseller',
      slug: Slug.fromRaw('bestseller'),
    });
    tagAId = tagA.id;
    tagBId = tagB.id;
  });

  afterAll(async () => {
    await prisma.productTag.deleteMany({ where: { tag: { storeId } } });
    await prisma.productVariant.deleteMany({ where: { storeId } });
    await prisma.product.deleteMany({ where: { storeId } });
    await prisma.tag.deleteMany({ where: { storeId } });
    await prisma.color.deleteMany({ where: { storeId } });
    await prisma.size.deleteMany({ where: { storeId } });
    await prisma.category.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a product and round-trips Money precisely through Postgres Decimal', async () => {
    const product = await repository.create({
      storeId,
      name: 'Classic V-Neck Scrub Top',
      slug: Slug.fromRaw('classic-v-neck-scrub-top'),
      sku: 'ZA-TOP-001',
      shortDescription: null,
      description: null,
      price: Money.create(45000.5, 'IQD'),
      discountPrice: Money.create(39000.25, 'IQD'),
      categoryId,
      brandId: null,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: false,
      isGiftBox: false,
      seo: SeoMetadata.create({ metaTitle: 'V-Neck Top' }),
      highlights: ['Moisture-wicking', '4-way stretch'],
      richContent: '<p>Our fabric story...</p>',
    });
    productId = product.id;

    expect(product.price.toDecimalString()).toBe('45000.50');
    expect(product.discountPrice?.toDecimalString()).toBe('39000.25');
    expect(product.status).toBe(PRODUCT_STATUS.DRAFT);
    expect(product.highlights).toEqual(['Moisture-wicking', '4-way stretch']);
    expect(product.richContent).toBe('<p>Our fabric story...</p>');
  });

  it('finds by id, slug, and sku', async () => {
    expect((await repository.findById(storeId, productId))?.id).toBe(productId);
    expect((await repository.findBySlug(storeId, 'classic-v-neck-scrub-top'))?.id).toBe(productId);
    expect((await repository.findBySku(storeId, 'ZA-TOP-001'))?.id).toBe(productId);
  });

  it('findManyByIds returns only matching products in this store', async () => {
    const found = await repository.findManyByIds(storeId, [productId, 'missing-id']);
    expect(found.map((p) => p.id)).toEqual([productId]);
  });

  it('persists status changes and pricing updates via save()', async () => {
    const product = await repository.findById(storeId, productId);
    product!.changeStatus(PRODUCT_STATUS.ACTIVE);
    product!.updatePricing(Money.create(50000, 'IQD'), null);
    await repository.save(product!);

    const reloaded = await repository.findById(storeId, productId);
    expect(reloaded?.status).toBe(PRODUCT_STATUS.ACTIVE);
    expect(reloaded?.price.toDecimalString()).toBe('50000.00');
    expect(reloaded?.discountPrice).toBeNull();
  });

  it('filters list() by status', async () => {
    const active = await repository.list(storeId, { status: PRODUCT_STATUS.ACTIVE });
    const draft = await repository.list(storeId, { status: PRODUCT_STATUS.DRAFT });
    expect(active.map((p) => p.id)).toContain(productId);
    expect(draft.map((p) => p.id)).not.toContain(productId);
  });

  it('filters list() by price range (Epic 9.5 / ADR 0021 §4)', async () => {
    const inRange = await repository.list(storeId, { priceMin: 40000, priceMax: 60000 });
    const tooExpensive = await repository.list(storeId, { priceMin: 100000 });
    const tooCheap = await repository.list(storeId, { priceMax: 1000 });
    expect(inRange.map((p) => p.id)).toContain(productId);
    expect(tooExpensive.map((p) => p.id)).not.toContain(productId);
    expect(tooCheap.map((p) => p.id)).not.toContain(productId);
  });

  it('filters list() by variant color/size (Epic 9.5 / ADR 0021 §4)', async () => {
    const color = await prisma.color.create({ data: { storeId, name: 'Navy', hexCode: '#1A2B4C' } });
    const size = await prisma.size.create({ data: { storeId, label: 'M', sortOrder: 0 } });
    colorId = color.id;
    sizeId = size.id;
    await prisma.productVariant.create({
      data: { storeId, productId, sku: 'ZA-TOP-001-NAVY-M', colorId, sizeId },
    });

    const byColor = await repository.list(storeId, { colorId });
    const bySize = await repository.list(storeId, { sizeId });
    const byBoth = await repository.list(storeId, { colorId, sizeId });
    const byOtherColor = await repository.list(storeId, { colorId: 'no-such-color' });

    expect(byColor.map((p) => p.id)).toContain(productId);
    expect(bySize.map((p) => p.id)).toContain(productId);
    expect(byBoth.map((p) => p.id)).toContain(productId);
    expect(byOtherColor.map((p) => p.id)).not.toContain(productId);
  });

  it('replaces and lists tags', async () => {
    await repository.replaceTags(storeId, productId, [tagAId, tagBId]);
    expect((await repository.listTagIds(storeId, productId)).sort()).toEqual([tagAId, tagBId].sort());

    await repository.replaceTags(storeId, productId, [tagAId]);
    expect(await repository.listTagIds(storeId, productId)).toEqual([tagAId]);
  });
});
