import {
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  type Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { dateOnlyKey, parseDateOnly } from '../../utils/dates.js';
import { serializeDecimal } from '../../utils/serializers.js';
import { withSerializableRetry } from '../../utils/transactions.js';

const payableStatuses = [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE];

const invoiceInclude = {
  member: { select: { id: true, memberCode: true, fullName: true, email: true } },
  payment: true,
} as const;

function todayDateOnly() {
  return parseDateOnly(dateOnlyKey(new Date()), 'Today');
}

async function syncOverdueInvoices(memberId?: string) {
  await prisma.invoice.updateMany({
    where: {
      ...(memberId ? { memberId } : {}),
      status: InvoiceStatus.UNPAID,
      dueDate: { lt: todayDateOnly() },
    },
    data: { status: InvoiceStatus.OVERDUE },
  });
}

function serializeInvoice<T extends {
  amount: Prisma.Decimal;
  payment?: ({ amount: Prisma.Decimal } | null);
}>(invoice: T) {
  return {
    ...invoice,
    amount: serializeDecimal(invoice.amount),
    ...(Object.prototype.hasOwnProperty.call(invoice, 'payment')
      ? {
          payment: invoice.payment
            ? { ...invoice.payment, amount: serializeDecimal(invoice.payment.amount) }
            : null,
        }
      : {}),
  };
}

export async function listOwnInvoices(
  memberId: string,
  query: { filter: 'ALL' | 'PAID' | 'UNPAID'; page: number; limit: number },
) {
  await syncOverdueInvoices(memberId);
  const skip = (query.page - 1) * query.limit;
  const where = {
    memberId,
    ...(query.filter === 'PAID' ? { status: InvoiceStatus.PAID } : {}),
    ...(query.filter === 'UNPAID' ? { status: { in: payableStatuses } } : {}),
  };

  const [items, total, outstanding, paidCount, unpaidCount] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { payment: true },
      orderBy: [{ dueDate: 'desc' }, { issueDate: 'desc' }],
      skip,
      take: query.limit,
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({
      where: { memberId, status: { in: payableStatuses } },
      _sum: { amount: true },
    }),
    prisma.invoice.count({ where: { memberId, status: InvoiceStatus.PAID } }),
    prisma.invoice.count({ where: { memberId, status: { in: payableStatuses } } }),
  ]);

  return {
    items: items.map(serializeInvoice),
    summary: {
      outstandingAmount: serializeDecimal(outstanding._sum.amount ?? 0),
      paidCount,
      unpaidCount,
    },
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getOwnInvoice(memberId: string, id: string) {
  await syncOverdueInvoices(memberId);
  const invoice = await prisma.invoice.findFirst({
    where: { id, memberId },
    include: { payment: true },
  });
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  return serializeInvoice(invoice);
}

export async function payOwnInvoice(
  memberId: string,
  id: string,
  input: { paymentMethod: PaymentMethod },
) {
  return withSerializableRetry(async (transaction) => {
    const invoice = await transaction.invoice.findFirst({
      where: { id, memberId },
      include: { member: true, payment: true },
    });
    if (!invoice) throw new ApiError(404, 'Invoice not found.');
    if (invoice.status === InvoiceStatus.PAID || invoice.payment) {
      throw new ApiError(409, 'This invoice has already been paid.');
    }
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new ApiError(409, 'A cancelled invoice cannot be paid.');
    }
    if (!payableStatuses.includes(invoice.status)) {
      throw new ApiError(409, 'This invoice is not payable.');
    }

    const claimed = await transaction.invoice.updateMany({
      where: { id: invoice.id, memberId, status: { in: payableStatuses } },
      data: { status: InvoiceStatus.PAID },
    });
    if (claimed.count !== 1) {
      throw new ApiError(409, 'Invoice payment state changed. Refresh and try again.');
    }

    const payment = await transaction.payment.create({
      data: {
        transactionId: `TXN-INV-${Date.now()}-${randomUUID().split('-')[0].toUpperCase()}`,
        memberId,
        invoiceId: invoice.id,
        amount: invoice.amount,
        paymentMethod: input.paymentMethod,
        paymentType: PaymentType.INVOICE,
        status: PaymentStatus.SUCCESS,
      },
    });

    const updatedInvoice = await transaction.invoice.findUniqueOrThrow({
      where: { id: invoice.id },
      include: { payment: true },
    });

    return {
      invoice: serializeInvoice(updatedInvoice),
      payment: { ...payment, amount: serializeDecimal(payment.amount) },
      receipt: {
        transactionId: payment.transactionId,
        invoiceNumber: invoice.invoiceNumber,
        memberName: invoice.member.fullName,
        description: invoice.description,
        amount: serializeDecimal(invoice.amount),
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt,
      },
    };
  });
}

export async function listAdminInvoices(query: {
  search?: string;
  status?: InvoiceStatus;
  memberId?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}) {
  await syncOverdueInvoices();
  const skip = (query.page - 1) * query.limit;
  const from = query.dateFrom ? parseDateOnly(query.dateFrom, 'Start date') : undefined;
  const to = query.dateTo ? parseDateOnly(query.dateTo, 'End date') : undefined;
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.memberId ? { memberId: query.memberId } : {}),
    ...(from || to
      ? { issueDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
    ...(query.search
      ? {
          OR: [
            { invoiceNumber: { contains: query.search } },
            { description: { contains: query.search } },
            { member: { is: { fullName: { contains: query.search } } } },
            { member: { is: { memberCode: { contains: query.search } } } },
          ],
        }
      : {}),
  };

  const [items, total, filteredAmount, outstanding] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: invoiceInclude,
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({ where, _sum: { amount: true } }),
    prisma.invoice.aggregate({
      where: { ...where, status: { in: payableStatuses } },
      _sum: { amount: true },
    }),
  ]);

  return {
    items: items.map(serializeInvoice),
    totals: {
      filteredAmount: serializeDecimal(filteredAmount._sum.amount ?? 0),
      outstandingAmount: serializeDecimal(outstanding._sum.amount ?? 0),
    },
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getAdminInvoice(id: string) {
  await syncOverdueInvoices();
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  return serializeInvoice(invoice);
}

export async function createInvoice(input: {
  memberId: string;
  description: string;
  amount: number;
  issueDate: string;
  dueDate: string;
}) {
  const member = await prisma.member.findUnique({ where: { id: input.memberId }, select: { id: true } });
  if (!member) throw new ApiError(404, 'Member not found.');
  const issueDate = parseDateOnly(input.issueDate, 'Issue date');
  const dueDate = parseDateOnly(input.dueDate, 'Due date');
  if (dueDate < issueDate) throw new ApiError(422, 'Due date cannot be before the issue date.');
  const status = dueDate < todayDateOnly() ? InvoiceStatus.OVERDUE : InvoiceStatus.UNPAID;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now()}-${randomUUID().split('-')[0].toUpperCase()}`;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      memberId: input.memberId,
      description: input.description,
      amount: input.amount,
      issueDate,
      dueDate,
      status,
    },
    include: invoiceInclude,
  });
  return serializeInvoice(invoice);
}

export async function updateInvoice(
  id: string,
  input: Partial<{ description: string; amount: number; issueDate: string; dueDate: string }>,
) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  if (!payableStatuses.includes(invoice.status)) {
    throw new ApiError(409, 'Only unpaid or overdue invoices can be edited.');
  }

  const issueDate = input.issueDate ? parseDateOnly(input.issueDate, 'Issue date') : invoice.issueDate;
  const dueDate = input.dueDate ? parseDateOnly(input.dueDate, 'Due date') : invoice.dueDate;
  if (dueDate < issueDate) throw new ApiError(422, 'Due date cannot be before the issue date.');
  const status = dueDate < todayDateOnly() ? InvoiceStatus.OVERDUE : InvoiceStatus.UNPAID;

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.issueDate !== undefined ? { issueDate } : {}),
      ...(input.dueDate !== undefined ? { dueDate } : {}),
      status,
    },
    include: invoiceInclude,
  });
  return serializeInvoice(updated);
}

export async function cancelInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  if (!payableStatuses.includes(invoice.status)) {
    throw new ApiError(409, 'Only unpaid or overdue invoices can be cancelled.');
  }
  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: InvoiceStatus.CANCELLED },
    include: invoiceInclude,
  });
  return serializeInvoice(updated);
}
