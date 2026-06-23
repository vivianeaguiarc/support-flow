import { TicketPriority } from '../../domain/ticket-enums.js';
import {
  type TicketCategoriesRepository,
  ticketCategoriesRepository,
} from '../../infrastructure/repositories/ticket-categories.repository.js';

export type CalculateTicketPriorityInput = {
  tenantId: string;
  title: string;
  description: string;
  categoryId?: string;
  currentPriority?: string;
  manuallySet?: boolean;
};

export type CalculateTicketPriorityResult = {
  suggestedPriority: string;
  priorityChanged: boolean;
  reason: string;
};

const CRITICAL_KEYWORDS = [
  'urgente',
  'grave',
  'fraude',
  'cobrança indevida',
  'cobranc,a indevida',
  'cobranca indevida',
  'vazamento de dados',
  'vazamento',
  'cancelamento não realizado',
  'cancelamento nao realizado',
  'crítico',
  'critico',
  'emergência',
  'emergencia',
];

const COMPLAINT_KEYWORDS = ['reclamação', 'reclamacao', 'reclama'];
const OMBUDSMAN_KEYWORDS = ['ouvidoria', 'ouvidor'];

const PRIORITY_LEVELS: Record<string, number> = {
  [TicketPriority.LOW]: 1,
  [TicketPriority.MEDIUM]: 2,
  [TicketPriority.HIGH]: 3,
  [TicketPriority.URGENT]: 4,
};

function priorityLevel(priority: string): number {
  return PRIORITY_LEVELS[priority] ?? 1;
}

export class CalculateTicketPriorityUseCase {
  constructor(
    private readonly categoriesRepo: TicketCategoriesRepository = ticketCategoriesRepository,
  ) {}

  async execute(
    input: CalculateTicketPriorityInput,
  ): Promise<CalculateTicketPriorityResult> {
    const currentLevel = input.currentPriority
      ? priorityLevel(input.currentPriority)
      : 1;

    const textToAnalyze = `${input.title} ${input.description}`.toLowerCase();

    let suggestedPriority = input.currentPriority || TicketPriority.LOW;
    let suggestedLevel = currentLevel;
    const reasons: string[] = [];

    if (this.containsCriticalKeywords(textToAnalyze)) {
      if (priorityLevel(TicketPriority.URGENT) > suggestedLevel) {
        suggestedPriority = TicketPriority.URGENT;
        suggestedLevel = priorityLevel(TicketPriority.URGENT);
        reasons.push('Termos críticos detectados no título/descrição');
      }
    }

    if (this.containsOmbudsmanKeywords(textToAnalyze)) {
      if (priorityLevel(TicketPriority.HIGH) > suggestedLevel) {
        suggestedPriority = TicketPriority.HIGH;
        suggestedLevel = priorityLevel(TicketPriority.HIGH);
        reasons.push('Identificado como Ouvidoria');
      }
    }

    if (this.containsComplaintKeywords(textToAnalyze)) {
      if (priorityLevel(TicketPriority.MEDIUM) > suggestedLevel) {
        suggestedPriority = TicketPriority.MEDIUM;
        suggestedLevel = priorityLevel(TicketPriority.MEDIUM);
        reasons.push('Identificado como reclamação');
      }
    }

    if (input.categoryId) {
      const categoryPriority = await this.getCategoryBasedPriority(
        input.categoryId,
        input.tenantId,
      );
      if (
        categoryPriority &&
        priorityLevel(categoryPriority) > suggestedLevel
      ) {
        suggestedPriority = categoryPriority;
        suggestedLevel = priorityLevel(categoryPriority);
        reasons.push('Prioridade mínima da categoria');
      }
    }

    if (input.manuallySet && input.currentPriority) {
      const manualLevel = priorityLevel(input.currentPriority);
      if (manualLevel > suggestedLevel) {
        suggestedPriority = input.currentPriority;
        reasons.push('Prioridade definida manualmente mantida');
      }
    }

    const priorityChanged = suggestedPriority !== input.currentPriority;

    return {
      suggestedPriority,
      priorityChanged,
      reason: reasons.length > 0 ? reasons.join('; ') : 'Prioridade padrão',
    };
  }

  private containsCriticalKeywords(text: string): boolean {
    return CRITICAL_KEYWORDS.some((keyword) => text.includes(keyword));
  }

  private containsComplaintKeywords(text: string): boolean {
    return COMPLAINT_KEYWORDS.some((keyword) => text.includes(keyword));
  }

  private containsOmbudsmanKeywords(text: string): boolean {
    return OMBUDSMAN_KEYWORDS.some((keyword) => text.includes(keyword));
  }

  private async getCategoryBasedPriority(
    categoryId: string,
    tenantId: string,
  ): Promise<string | null> {
    const category = await this.categoriesRepo.findByIdAndTenant(
      categoryId,
      tenantId,
    );

    if (!category) {
      return null;
    }

    const categoryName = category.name.toLowerCase();

    if (
      this.containsOmbudsmanKeywords(categoryName) ||
      categoryName.includes('urgente')
    ) {
      return TicketPriority.HIGH;
    }

    if (
      this.containsComplaintKeywords(categoryName) ||
      categoryName.includes('problema')
    ) {
      return TicketPriority.MEDIUM;
    }

    return null;
  }
}

export const calculateTicketPriorityUseCase =
  new CalculateTicketPriorityUseCase();
