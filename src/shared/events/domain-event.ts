export type DomainEvent<TPayload = unknown> = {
  eventId: string;
  eventName: string;
  aggregateId: string;
  occurredAt: Date;
  correlationId?: string;
  payload: TPayload;
};

export type DomainEventHandler<TPayload = unknown> = (
  event: DomainEvent<TPayload>,
) => void | Promise<void>;
