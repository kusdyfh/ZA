import { CreateShippingZoneUseCase } from './create-shipping-zone.use-case';
import type { ShippingZoneRepository } from '../../domain/repositories/shipping-zone.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ShippingZone } from '../../domain/entities/shipping-zone.entity';

function buildZone(): ShippingZone {
  return ShippingZone.reconstitute({
    id: 'zone-1',
    storeId: 'store-1',
    name: 'Central Iraq',
    governorates: ['Baghdad', 'Babil'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('CreateShippingZoneUseCase', () => {
  let zones: jest.Mocked<ShippingZoneRepository>;
  let storeContext: StoreContext;
  let useCase: CreateShippingZoneUseCase;

  beforeEach(() => {
    zones = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByGovernorate: jest.fn(),
      list: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    zones.create.mockResolvedValue(buildZone());

    useCase = new CreateShippingZoneUseCase(zones, storeContext);
  });

  it('creates a zone scoped to the current store', async () => {
    const result = await useCase.execute({ name: 'Central Iraq', governorates: ['Baghdad', 'Babil'] });

    expect(zones.create).toHaveBeenCalledWith({
      storeId: 'store-1',
      name: 'Central Iraq',
      governorates: ['Baghdad', 'Babil'],
    });
    expect(result).toBeInstanceOf(ShippingZone);
  });
});
