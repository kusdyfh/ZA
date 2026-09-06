export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  marketingOptIn: boolean;
  cartToken: string;
  createdAt: string;
  updatedAt: string;
}
