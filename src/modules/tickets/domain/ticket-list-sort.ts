export const TICKET_LIST_SORT_FIELDS = [
  'createdAt',
  'slaDueAt',
  'priority',
] as const;

export type TicketListSortField = (typeof TICKET_LIST_SORT_FIELDS)[number];

export const TICKET_LIST_SORT_ORDERS = ['asc', 'desc'] as const;

export type TicketListSortOrder = (typeof TICKET_LIST_SORT_ORDERS)[number];

export const DEFAULT_TICKET_LIST_SORT_BY: TicketListSortField = 'createdAt';
export const DEFAULT_TICKET_LIST_SORT_ORDER: TicketListSortOrder = 'desc';
