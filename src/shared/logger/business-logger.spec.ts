import { describe, expect, it, vi } from 'vitest';

import { BusinessEvent, logBusinessEvent } from './business-logger.js';
import { logger } from './logger.js';
import { requestContext } from './request-context.js';

describe('logBusinessEvent', () => {
  it('logs structured business events with request context', () => {
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => logger);

    requestContext.run(
      {
        requestId: 'req-123',
        method: 'POST',
        path: '/api/v1/tickets',
      },
      () => {
        logBusinessEvent(BusinessEvent.TICKET_CREATED, {
          tenantId: 'tenant-1',
          ticketId: 'ticket-1',
          password: 'must-not-appear',
        });
      },
    );

    expect(infoSpy).toHaveBeenCalledWith(
      {
        event: BusinessEvent.TICKET_CREATED,
        tenantId: 'tenant-1',
        ticketId: 'ticket-1',
        requestId: 'req-123',
        method: 'POST',
        path: '/api/v1/tickets',
      },
      BusinessEvent.TICKET_CREATED,
    );

    infoSpy.mockRestore();
  });
});
