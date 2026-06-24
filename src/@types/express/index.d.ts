import type { Organization } from '../../shared/tenant/organization.entity.js';
import type { AuthenticatedUser } from '../../types/authenticated-user.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      id?: string | number;
      apiKeyId?: string;
      authMethod?: 'jwt' | 'api_key';
      tenantId?: string;
      organization?: Organization;
    }
  }
}

export {};
