import { ActorType } from '@za/types';
import { StockMovement, type StockMovementProps } from './stock-movement.entity';
import { STOCK_MOVEMENT_TYPE } from '../constants/stock-movement-type.constants';

function buildMovement(overrides: Partial<StockMovementProps> = {}): StockMovement {
  const props: StockMovementProps = {
    id: 'mov-1',
    variantId: 'variant-1',
    warehouseId: 'wh-1',
    type: STOCK_MOVEMENT_TYPE.RECEIVE,
    quantity: 25,
    resultingStock: 25,
    reason: null,
    note: 'Initial seed stock.',
    actorId: null,
    actorType: ActorType.SYSTEM,
    createdAt: new Date(),
    ...overrides,
  };
  return StockMovement.reconstitute(props);
}

describe('StockMovement', () => {
  it('exposes every field via getters', () => {
    const movement = buildMovement();
    expect(movement.type).toBe(STOCK_MOVEMENT_TYPE.RECEIVE);
    expect(movement.quantity).toBe(25);
    expect(movement.resultingStock).toBe(25);
    expect(movement.actorType).toBe(ActorType.SYSTEM);
  });

  it('is immutable — no mutator methods exist', () => {
    const movement = buildMovement() as unknown as Record<string, unknown>;
    expect(movement.markConfirmed).toBeUndefined();
    expect(movement.setQuantity).toBeUndefined();
  });
});
