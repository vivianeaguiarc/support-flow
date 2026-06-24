export type TenantScopedWhere<T extends Record<string, unknown>> = T & {
  tenantId: string;
};

export function withTenantScope<T extends Record<string, unknown>>(
  tenantId: string,
  where: T,
): TenantScopedWhere<T> {
  return {
    ...where,
    tenantId,
  };
}

export function tenantIdWhere(tenantId: string): { tenantId: string } {
  return { tenantId };
}
