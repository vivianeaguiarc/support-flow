import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import type { TicketPriority } from '../../../tickets/domain/ticket-enums.js';
import type { SlaPolicy } from '../../domain/sla-policy.entity.js';
import type {
  CreateSlaPolicyDto,
  ListSlaPoliciesQueryDto,
  UpdateSlaPolicyDto,
} from '../../presentation/dtos/sla-policy.dto.js';
import {
  CreateSlaPolicyUseCase,
  createSlaPolicyUseCase,
  DeleteSlaPolicyUseCase,
  deleteSlaPolicyUseCase,
  GetSlaPolicyUseCase,
  getSlaPolicyUseCase,
  ListSlaPoliciesUseCase,
  listSlaPoliciesUseCase,
  UpdateSlaPolicyUseCase,
  updateSlaPolicyUseCase,
} from '../use-cases/sla-policy.use-cases.js';

export class SlaPoliciesService {
  constructor(
    private readonly createPolicy: CreateSlaPolicyUseCase = createSlaPolicyUseCase,
    private readonly updatePolicy: UpdateSlaPolicyUseCase = updateSlaPolicyUseCase,
    private readonly deletePolicy: DeleteSlaPolicyUseCase = deleteSlaPolicyUseCase,
    private readonly listPolicies: ListSlaPoliciesUseCase = listSlaPoliciesUseCase,
    private readonly getPolicy: GetSlaPolicyUseCase = getSlaPolicyUseCase,
  ) {}

  list(
    authUser: AuthenticatedUser,
    query: ListSlaPoliciesQueryDto,
  ): Promise<SlaPolicy[]> {
    return this.listPolicies.execute({
      tenantId: authUser.tenantId,
      isActive: query.isActive,
      priority: query.priority as TicketPriority | undefined,
    });
  }

  getById(authUser: AuthenticatedUser, id: string): Promise<SlaPolicy> {
    return this.getPolicy.execute({ tenantId: authUser.tenantId, id });
  }

  create(
    authUser: AuthenticatedUser,
    input: CreateSlaPolicyDto,
  ): Promise<SlaPolicy> {
    return this.createPolicy.execute({
      tenantId: authUser.tenantId,
      actorId: authUser.id,
      name: input.name,
      description: input.description ?? null,
      priority: (input.priority ?? null) as TicketPriority | null,
      categoryIds: input.categoryIds,
      firstResponseHours: input.firstResponseHours,
      resolutionHours: input.resolutionHours,
      businessHoursOnly: input.businessHoursOnly,
      isActive: input.isActive,
    });
  }

  update(
    authUser: AuthenticatedUser,
    id: string,
    input: UpdateSlaPolicyDto,
  ): Promise<SlaPolicy> {
    return this.updatePolicy.execute({
      tenantId: authUser.tenantId,
      actorId: authUser.id,
      id,
      name: input.name,
      description: input.description,
      priority: input.priority as TicketPriority | null | undefined,
      categoryIds: input.categoryIds,
      firstResponseHours: input.firstResponseHours,
      resolutionHours: input.resolutionHours,
      businessHoursOnly: input.businessHoursOnly,
      isActive: input.isActive,
    });
  }

  delete(authUser: AuthenticatedUser, id: string): Promise<void> {
    return this.deletePolicy.execute({
      tenantId: authUser.tenantId,
      actorId: authUser.id,
      id,
    });
  }
}

export const slaPoliciesService = new SlaPoliciesService();
