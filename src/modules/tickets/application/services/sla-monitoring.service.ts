import {
  type MonitorTicketSlaResult,
  type MonitorTicketSlaUseCase,
  monitorTicketSlaUseCase,
} from '../use-cases/monitor-ticket-sla.use-case.js';

export class SlaMonitoringService {
  constructor(
    private readonly monitorSlaUseCase: MonitorTicketSlaUseCase = monitorTicketSlaUseCase,
  ) {}

  async checkSlaStatus(): Promise<MonitorTicketSlaResult> {
    const result = await this.monitorSlaUseCase.execute();

    console.log('[SLA Monitoring] Execution completed:', {
      ticketsChecked: result.ticketsChecked,
      warningsCreated: result.warningsCreated,
      expiredNotificationsCreated: result.expiredNotificationsCreated,
      slaBreachedHistoryCreated: result.slaBreachedHistoryCreated,
      timestamp: new Date().toISOString(),
    });

    return result;
  }
}

export const slaMonitoringService = new SlaMonitoringService();
