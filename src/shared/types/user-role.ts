export const UserRole = {
  ADMIN: 'ADMIN',
  AGENT: 'AGENT',
  CUSTOMER: 'CUSTOMER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
