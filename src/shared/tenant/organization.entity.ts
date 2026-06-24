/** Domain view of the Prisma `Tenant` model (organization). */
export type Organization = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  defaultSlaHours: number;
  createdAt: Date;
  updatedAt: Date;
};

export function toOrganization(tenant: {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  defaultSlaHours: number;
  createdAt: Date;
  updatedAt: Date;
}): Organization {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    active: tenant.isActive,
    defaultSlaHours: tenant.defaultSlaHours,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
  };
}
