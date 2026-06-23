export const UserRole = {
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  AGENT: 'AGENT',
  CUSTOMER: 'CUSTOMER',
  OMBUDSMAN: 'OMBUDSMAN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
