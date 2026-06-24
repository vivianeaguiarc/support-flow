import { describe, expect, it } from 'vitest';

import { swaggerSpec } from './swagger.js';

const EXPECTED_PATHS: Record<string, string[]> = {
  '/auth/login': ['post'],
  '/auth/refresh': ['post'],
  '/auth/logout': ['post'],
  '/users': ['post', 'get'],
  '/users/{id}': ['get'],
  '/customers': ['get'],
  '/ticket-categories': ['get'],
  '/tickets': ['post', 'get'],
  '/tickets/my-queue': ['get'],
  '/tickets/unassigned': ['get'],
  '/tickets/summary': ['get'],
  '/tickets/metrics': ['get'],
  '/tickets/sla': ['get'],
  '/tickets/sla/breached': ['get'],
  '/tickets/auto-assign': ['post'],
  '/tickets/{id}': ['get'],
  '/tickets/{id}/status': ['patch'],
  '/tickets/{id}/assign': ['patch'],
  '/tickets/{id}/recalculate-priority': ['patch'],
  '/tickets/{id}/route': ['post'],
  '/tickets/{id}/transitions': ['get'],
  '/tickets/{id}/history': ['get'],
  '/tickets/{ticketId}/history': ['get'],
  '/tickets/{ticketId}/satisfaction': ['post'],
  '/tickets/{id}/comments': ['post', 'get'],
  '/tickets/{ticketId}/internal-comments': ['post', 'get'],
  '/tickets/{id}/attachments': ['post', 'get'],
  '/tickets/{id}/attachments/{attachmentId}': ['delete'],
  '/notifications': ['get'],
  '/notifications/{id}/read': ['patch'],
  '/notifications/read-all': ['patch'],
  '/metrics/agents': ['get'],
  '/knowledge/articles': ['post', 'get'],
  '/knowledge/articles/{slug}': ['get'],
  '/knowledge/articles/{id}': ['patch', 'delete'],
  '/knowledge/articles/{id}/publish': ['patch'],
  '/knowledge/articles/{id}/archive': ['patch'],
  '/admin/notifications/health': ['get'],
  '/admin/jobs': ['get'],
  '/admin/jobs/metrics': ['get'],
  '/analytics/overview': ['get'],
  '/analytics/tickets-by-status': ['get'],
  '/analytics/tickets-by-priority': ['get'],
  '/analytics/sla': ['get'],
  '/analytics/agents-performance': ['get'],
  '/analytics/csat': ['get'],
  '/reports/tickets.csv': ['get'],
  '/reports/agents-performance.csv': ['get'],
  '/reports/sla.csv': ['get'],
  '/automation/rules': ['post', 'get'],
  '/automation/rules/{id}': ['patch', 'delete'],
  '/api-keys': ['post', 'get'],
  '/api-keys/{id}/revoke': ['patch'],
  '/api-keys/{id}': ['delete'],
  '/webhooks': ['post', 'get'],
  '/webhooks/{id}': ['get', 'patch', 'delete'],
  '/webhooks/{id}/test': ['post'],
  '/health': ['get'],
  '/health/ready': ['get'],
};

describe('swaggerSpec', () => {
  it('should expose BearerAuth security scheme', () => {
    expect(swaggerSpec.components?.securitySchemes?.BearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
    expect(swaggerSpec.components?.securitySchemes?.ApiKeyAuth).toMatchObject({
      type: 'apiKey',
      in: 'header',
      name: 'x-api-key',
    });
  });

  it('should document all implemented API paths', () => {
    const documentedPaths = swaggerSpec.paths ?? {};

    for (const [path, methods] of Object.entries(EXPECTED_PATHS)) {
      expect(documentedPaths, `missing path ${path}`).toHaveProperty(path);
      for (const method of methods) {
        expect(
          documentedPaths[path],
          `missing ${method.toUpperCase()} ${path}`,
        ).toHaveProperty(method);
      }
    }
  });

  it('should not document paths without route implementation', () => {
    const documentedPaths = Object.keys(swaggerSpec.paths ?? {});
    const unexpected = documentedPaths.filter(
      (path) => !(path in EXPECTED_PATHS),
    );

    expect(unexpected).toEqual([]);
  });

  it('should reference core enums in components', () => {
    const schemas = swaggerSpec.components?.schemas ?? {};
    expect(schemas.TicketStatus).toBeDefined();
    expect(schemas.TicketPriority).toBeDefined();
    expect(schemas.TicketSlaStatus).toBeDefined();
    expect(schemas.TicketSlaSummary).toBeDefined();
    expect(schemas.UserRole).toBeDefined();
    expect(schemas.NotificationType).toBeDefined();
    expect(schemas.KnowledgeArticleStatus).toBeDefined();
    expect(schemas.KnowledgeArticle).toBeDefined();
    expect(schemas.EmailProviderHealth).toBeDefined();
    expect(schemas.AnalyticsOverview).toBeDefined();
    expect(schemas.AnalyticsSla).toBeDefined();
    expect(schemas.AnalyticsCsat).toBeDefined();
    expect(schemas.TicketSatisfactionSurvey).toBeDefined();
    expect(schemas.ApiKey).toBeDefined();
    expect(schemas.CreateApiKeyInput).toBeDefined();
    expect(schemas.AutomationRule).toBeDefined();
    expect(schemas.CreateAutomationRuleInput).toBeDefined();
    expect(schemas.ApiSuccessResponse).toBeDefined();
    expect(schemas.ApiPaginatedSuccessResponse).toBeDefined();
    expect(schemas.PaginationMeta).toBeDefined();
    expect(schemas.ApiErrorResponse).toBeDefined();
  });
});
