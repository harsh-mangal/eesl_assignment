import { z } from 'zod';

export const reportTypes = [
  'MEMBERS',
  'BOOKINGS',
  'PAYMENTS',
  'ROOM_AVAILABILITY',
  'RESTAURANT_BOOKINGS',
  'EVENT_BOOKINGS',
  'EVENT_ATTENDANCE',
  'FEEDBACK',
  'RFID_STATUS',
] as const;

export const getReportSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ reportType: z.enum(reportTypes) }),
  query: z.object({
    search: z.string().trim().max(120).optional(),
    status: z.string().trim().max(40).optional(),
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).refine(
    (value) => !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
    { message: 'End date must be on or after start date.', path: ['dateTo'] },
  ),
});
