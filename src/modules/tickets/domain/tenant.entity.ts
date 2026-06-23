export type Tenant = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  defaultSlaHours: number;
  createdAt: Date;
  updatedAt: Date;
};
