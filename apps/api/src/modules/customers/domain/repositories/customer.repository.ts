import type { Customer } from '../entities/customer.entity';
import type { Email } from '../value-objects/email.vo';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface CreateCustomerData {
  storeId: string;
  email: Email;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  marketingOptIn: boolean;
  cartToken: string;
}

export interface CustomerRepository {
  create(data: CreateCustomerData): Promise<Customer>;
  findById(id: string): Promise<Customer | null>;
  findByEmail(storeId: string, email: Email): Promise<Customer | null>;
  save(customer: Customer): Promise<void>;
}
