import { UpdateAddressUseCase } from './update-address.use-case';
import type { CustomerAddressRepository } from '../../domain/repositories/customer-address.repository';
import { CustomerAddress } from '../../domain/entities/customer-address.entity';
import { AddressNotFoundError } from '../../domain/errors/customer.errors';

function buildAddress(customerId: string): CustomerAddress {
  return CustomerAddress.reconstitute({
    id: 'address-1',
    customerId,
    fullName: 'Jane Doe',
    phone: '+9647700000000',
    line1: '123 Al-Rasheed Street',
    line2: null,
    city: 'Baghdad',
    governorate: 'Baghdad',
    country: 'Iraq',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('UpdateAddressUseCase', () => {
  let addresses: jest.Mocked<CustomerAddressRepository>;
  let useCase: UpdateAddressUseCase;

  const input = {
    addressId: 'address-1',
    customerId: 'customer-1',
    fullName: 'Jane Doe',
    phone: '+9647700000000',
    line1: '456 New Street',
    city: 'Baghdad',
    governorate: 'Baghdad',
    country: 'Iraq',
  };

  beforeEach(() => {
    addresses = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      listByCustomerId: jest.fn(),
    };
    useCase = new UpdateAddressUseCase(addresses);
  });

  it('updates an address the customer owns', async () => {
    addresses.findById.mockResolvedValue(buildAddress('customer-1'));
    addresses.update.mockResolvedValue(buildAddress('customer-1'));

    await useCase.execute(input);

    expect(addresses.update).toHaveBeenCalledWith('address-1', expect.objectContaining({ line1: '456 New Street' }));
  });

  it("rejects updating another customer's address (404, not a cross-account leak)", async () => {
    addresses.findById.mockResolvedValue(buildAddress('someone-else'));

    await expect(useCase.execute(input)).rejects.toThrow(AddressNotFoundError);
    expect(addresses.update).not.toHaveBeenCalled();
  });

  it('throws AddressNotFoundError for a nonexistent address', async () => {
    addresses.findById.mockResolvedValue(null);
    await expect(useCase.execute(input)).rejects.toThrow(AddressNotFoundError);
  });
});
