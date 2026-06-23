export type Customer = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
