import type { PaymentStatus, PaymentType, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { parseDateOnly } from '../../utils/dates.js';
import { serializeDecimal } from '../../utils/serializers.js';

function serializePayment<T extends { amount: Prisma.Decimal }>(payment: T) {
  return { ...payment, amount: serializeDecimal(payment.amount) };
}

const include = {
  member: { select: { id: true, memberCode: true, fullName: true, email: true } },
  invoice: { select: { id: true, invoiceNumber: true, description: true } },
  roomBooking: { select: { id: true, bookingNumber: true } },
  eventBooking: { select: { id: true, bookingNumber: true, ticketNumber: true, event: { select: { title: true } } } },
} as const;

export async function listAdminPayments(query: {
  search?: string;
  status?: PaymentStatus;
  paymentType?: PaymentType;
  memberId?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}) {
  const skip = (query.page - 1) * query.limit;
  const from = query.dateFrom ? parseDateOnly(query.dateFrom, 'Start date') : undefined;
  const to = query.dateTo ? parseDateOnly(query.dateTo, 'End date') : undefined;
  if (to) to.setUTCHours(23, 59, 59, 999);
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.paymentType ? { paymentType: query.paymentType } : {}),
    ...(query.memberId ? { memberId: query.memberId } : {}),
    ...(from || to ? { paidAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(query.search
      ? {
          OR: [
            { transactionId: { contains: query.search } },
            { member: { is: { fullName: { contains: query.search } } } },
            { member: { is: { memberCode: { contains: query.search } } } },
          ],
        }
      : {}),
  };
  const [items, total, aggregate] = await Promise.all([
    prisma.payment.findMany({ where, include, orderBy: { paidAt: 'desc' }, skip, take: query.limit }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ where, _sum: { amount: true } }),
  ]);
  return {
    items: items.map(serializePayment),
    totalAmount: serializeDecimal(aggregate._sum.amount ?? 0),
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) },
  };
}

export async function listOwnPayments(memberId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.payment.findMany({ where: { memberId }, include, orderBy: { paidAt: 'desc' }, skip, take: limit }),
    prisma.payment.count({ where: { memberId } }),
  ]);
  return { items: items.map(serializePayment), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}
