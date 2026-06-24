export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  AGENT: 'AGENT',
  CUSTOMER: 'CUSTOMER',
  OMBUDSMAN: 'OMBUDSMAN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
