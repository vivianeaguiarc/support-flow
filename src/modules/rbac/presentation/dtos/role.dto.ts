import { z } from 'zod';

export const createRoleSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(255).optional(),
  })
  .strict();

export const updateRoleSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(255).nullable().optional(),
  })
  .strict();

export const roleIdParamSchema = z.object({
  id: z.uuid('Invalid role ID'),
});

export const assignRolePermissionsSchema = z
  .object({
    permissionKeys: z.array(z.string().min(1)).min(1),
  })
  .strict();

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
export type AssignRolePermissionsDto = z.infer<
  typeof assignRolePermissionsSchema
>;
