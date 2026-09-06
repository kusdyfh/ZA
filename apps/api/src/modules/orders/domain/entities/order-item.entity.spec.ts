import { OrderItem, type OrderItemProps } from './order-item.entity';

function buildOrderItem(overrides: Partial<OrderItemProps> = {}): OrderItem {
  const props: OrderItemProps = {
    id: 'item-1',
    variantId: 'variant-1',
    stockReservationId: 'res-1',
    productNameSnapshot: 'Classic V-Neck Scrub Top',
    skuSnapshot: 'ZA-TOP-VNECK-001-NVY-M',
    unitPrice: 39000,
    quantity: 2,
    lineTotal: 78000,
    ...overrides,
  };
  return OrderItem.reconstitute(props);
}

describe('OrderItem', () => {
  it('exposes every field via getters', () => {
    const item = buildOrderItem();
    expect(item.productNameSnapshot).toBe('Classic V-Neck Scrub Top');
    expect(item.skuSnapshot).toBe('ZA-TOP-VNECK-001-NVY-M');
    expect(item.unitPrice).toBe(39000);
    expect(item.quantity).toBe(2);
    expect(item.lineTotal).toBe(78000);
  });

  it('allows a null variantId — display never depends on the live variant', () => {
    const item = buildOrderItem({ variantId: null });
    expect(item.variantId).toBeNull();
  });

  it('is immutable — no mutator methods exist', () => {
    const item = buildOrderItem() as unknown as Record<string, unknown>;
    expect(item.setQuantity).toBeUndefined();
    expect(item.updatePrice).toBeUndefined();
  });
});
