import { randomUUID } from 'node:crypto';
import { ActorType } from '@za/types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaStockMovementRepository } from './prisma-stock-movement.repository';
import { PrismaVariantStockRepository } from './prisma-variant-stock.repository';
import { STOCK_MOVEMENT_TYPE } from '../../domain/constants/stock-movement-type.constants';

describe('PrismaStockMovementRepository (integration)', () => {
  const prisma = new PrismaService();
  const movements = new PrismaStockMovementRepository(prisma);
  const variantStocks = new PrismaVariantStockRepository(prisma);
  const systemActor = { actorId: null, actorType: ActorType.SYSTEM };
  let storeId: string;
  let variantId: string;
  let warehouseId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Stock Movement Integration Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;

    const category = await prisma.category.create({
      data: { storeId, name: 'Scrubs', slug: `scrubs-${randomUUID()}` },
    });

    const product = await prisma.product.create({
      data: {
        storeId,
        name: 'Test Product',
        slug: `test-product-${randomUUID()}`,
        sku: `TEST-SKU-${randomUUID()}`,
        price: '100.00',
        currencyCode: 'IQD',
        categoryId: category.id,
      },
    });

    const variant = await prisma.productVariant.create({
      data: { storeId, productId: product.id, sku: `TEST-VARIANT-${randomUUID()}` },
    });
    variantId = variant.id;

    const warehouse = await prisma.warehouse.create({
      data: { storeId, name: 'Main Warehouse', code: `MAIN-${randomUUID()}`, isDefault: true },
    });
    warehouseId = warehouse.id;

    await variantStocks.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.RECEIVE,
      quantity: 10,
      actor: systemActor,
    });
    await variantStocks.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.SALE,
      quantity: 2,
      actor: systemActor,
    });
  });

  afterAll(async () => {
    await prisma.stockMovement.deleteMany({ where: { variantId } });
    await prisma.variantStock.deleteMany({ where: { variantId } });
    await prisma.warehouse.deleteMany({ where: { storeId } });
    await prisma.productVariant.deleteMany({ where: { storeId } });
    await prisma.product.deleteMany({ where: { storeId } });
    await prisma.category.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('returns the full, permanent movement history for a variant, newest first', async () => {
    const history = await movements.listByVariant(variantId);

    expect(history).toHaveLength(2);
    expect(history[0]!.type).toBe(STOCK_MOVEMENT_TYPE.SALE);
    expect(history[1]!.type).toBe(STOCK_MOVEMENT_TYPE.RECEIVE);
  });

  it('returns an empty history for a variant with no movements', async () => {
    expect(await movements.listByVariant('nonexistent-variant')).toEqual([]);
  });
});
