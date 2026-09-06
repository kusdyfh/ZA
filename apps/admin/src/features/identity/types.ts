export interface Role {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface Permission {
  id: string;
  key: string;
  module: string;
  action: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  isActive: boolean;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserFormValues {
  name: string;
  email: string;
  password: string;
  roleId: string;
}
