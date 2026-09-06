import { randomUUID } from 'node:crypto';
import { ActorType } from '@za/types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaVariantStockRepository } from './prisma-variant-stock.repository';
import { STOCK_MOVEMENT_TYPE } from '../../domain/constants/stock-movement-type.constants';
import { STOCK_ADJUSTMENT_REASON } from '../../domain/constants/stock-adjustment-reason.constants';
import { NegativeStockError } from '../../domain/errors/inventory.errors';

describe('PrismaVariantStockRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaVariantStockRepository(prisma);
  const systemActor = { actorId: null, actorType: ActorType.SYSTEM };
  let storeId: string;
  let categoryId: string;
  let productId: string;
  let variantId: string;
  let warehouseId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Variant Stock Integration Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;

    const category = await prisma.category.create({
      data: { storeId, name: 'Scrubs', slug: `scrubs-${randomUUID()}` },
    });
    categoryId = category.id;

    const product = await prisma.product.create({
      data: {
        storeId,
        name: 'Test Product',
        slug: `test-product-${randomUUID()}`,
        sku: `TEST-SKU-${randomUUID()}`,
        price: '100.00',
        currencyCode: 'IQD',
        categoryId,
      },
    });
    productId = product.id;

    const variant = await prisma.productVariant.create({
      data: { storeId, productId, sku: `TEST-VARIANT-${randomUUID()}` },
    });
    variantId = variant.id;

    const warehouse = await prisma.warehouse.create({
      data: { storeId, name: 'Main Warehouse', code: `MAIN-${randomUUID()}`, isDefault: true },
    });
    warehouseId = warehouse.id;
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

  it('creates the VariantStock row on first movement and writes a matching StockMovement', async () => {
    const result = await repository.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.RECEIVE,
      quantity: 25,
      note: 'Initial receipt',
      actor: systemActor,
    });

    expect(result.variantStock.quantity).toBe(25);
    expect(result.movement.type).toBe(STOCK_MOVEMENT_TYPE.RECEIVE);
    expect(result.movement.resultingStock).toBe(25);
  });

  it('decrements stock on a SALE movement', async () => {
    const result = await repository.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.SALE,
      quantity: 5,
      actor: systemActor,
    });

    expect(result.variantStock.quantity).toBe(20);
    expect(result.movement.resultingStock).toBe(20);
  });

  it('applies a signed ADJUSTMENT movement as-is', async () => {
    const result = await repository.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.ADJUSTMENT,
      quantity: -3,
      reason: STOCK_ADJUSTMENT_REASON.STOCKTAKE_CORRECTION,
      actor: systemActor,
    });

    expect(result.variantStock.quantity).toBe(17);
  });

  it('never lets a DAMAGED movement touch the sellable stock ledger, despite recording the count', async () => {
    const result = await repository.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.DAMAGED,
      quantity: 4,
      actor: systemActor,
    });

    expect(result.variantStock.quantity).toBe(17);
    expect(result.movement.quantity).toBe(4);
    expect(result.movement.resultingStock).toBe(17);
  });

  it('never allows stock to go negative', async () => {
    await expect(
      repository.applyMovement({
        variantId,
        warehouseId,
        type: STOCK_MOVEMENT_TYPE.SALE,
        quantity: 1000,
        actor: systemActor,
      }),
    ).rejects.toThrow(NegativeStockError);

    const stock = await repository.findByVariantAndWarehouse(variantId, warehouseId);
    expect(stock?.quantity).toBe(17);
  });

  it('sets and clears a low-stock threshold', async () => {
    const withThreshold = await repository.setLowStockThreshold(variantId, warehouseId, 5);
    expect(withThreshold.lowStockThreshold).toBe(5);

    const listed = await repository.listWithThreshold(warehouseId);
    expect(listed.map((s) => s.variantId)).toContain(variantId);

    const cleared = await repository.setLowStockThreshold(variantId, warehouseId, null);
    expect(cleared.lowStockThreshold).toBeNull();
  });

  it('ensureExists returns the existing row rather than resetting its quantity', async () => {
    const stock = await repository.ensureExists(variantId, warehouseId);
    expect(stock.quantity).toBe(17);
  });
});
