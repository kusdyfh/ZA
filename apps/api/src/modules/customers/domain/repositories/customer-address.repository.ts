import type { CustomerAddress } from '../entities/customer-address.entity';

export const CUSTOMER_ADDRESS_REPOSITORY = Symbol('CUSTOMER_ADDRESS_REPOSITORY');

export interface CreateAddressData {
  customerId: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  governorate: string;
  country: string;
  isDefault: boolean;
}

export interface UpdateAddressData {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  governorate: string;
  country: string;
  isDefault: boolean;
}

/**
 * `create`/`update` both take `isDefault` and, when `true`, un-default
 * every other address for the same customer in the same transaction —
 * "exactly one default" is enforced here, not in the domain entity
 * (CustomerPolicy's role is validating the address *fields*, not
 * cross-row invariants — same division of labor as every other
 * repository in this codebase).
 */
export interface CustomerAddressRepository {
  create(data: CreateAddressData): Promise<CustomerAddress>;
  findById(id: string): Promise<CustomerAddress | null>;
  update(id: string, data: UpdateAddressData): Promise<CustomerAddress>;
  delete(id: string): Promise<void>;
  listByCustomerId(customerId: string): Promise<CustomerAddress[]>;
}
