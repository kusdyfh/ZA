import { VariantStock, type VariantStockProps } from './variant-stock.entity';

function buildVariantStock(overrides: Partial<VariantStockProps> = {}): VariantStock {
  const props: VariantStockProps = {
    id: 'vs-1',
    variantId: 'variant-1',
    warehouseId: 'wh-1',
    quantity: 25,
    lowStockThreshold: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return VariantStock.reconstitute(props);
}

describe('VariantStock', () => {
  it('exposes its current quantity read-only (no setter exists)', () => {
    const stock = buildVariantStock({ quantity: 25 });
    expect(stock.quantity).toBe(25);
    expect((stock as unknown as Record<string, unknown>).setQuantity).toBeUndefined();
  });

  it('allows setting a low-stock threshold', () => {
    const stock = buildVariantStock({ lowStockThreshold: null });
    stock.setLowStockThreshold(10);
    expect(stock.lowStockThreshold).toBe(10);
  });

  it('allows clearing a low-stock threshold', () => {
    const stock = buildVariantStock({ lowStockThreshold: 10 });
    stock.setLowStockThreshold(null);
    expect(stock.lowStockThreshold).toBeNull();
  });
});
