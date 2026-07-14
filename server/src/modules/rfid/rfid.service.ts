import { RfidStatus, VerificationResult } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';

function isValid(record: { status: RfidStatus; expiryDate: Date }) {
  return record.status === RfidStatus.ACTIVE && record.expiryDate.getTime() >= Date.now();
}

export async function listRfid(query: {
  search?: string;
  status?: RfidStatus;
  page: number;
  limit: number;
}) {
  const skip = (query.page - 1) * query.limit;
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { referenceNumber: { contains: query.search } },
            { cardNumber: { contains: query.search } },
            { member: { is: { fullName: { contains: query.search } } } },
            { member: { is: { memberCode: { contains: query.search } } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.rfidRecord.findMany({
      where,
      include: {
        member: {
          select: { id: true, memberCode: true, fullName: true, email: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.rfidRecord.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function updateRfid(
  id: string,
  input: {
    status?: RfidStatus;
    expiryDate?: Date;
    referenceNumber?: string;
    cardNumber?: string;
  },
) {
  const existing = await prisma.rfidRecord.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'RFID record not found.');

  const nextStatus = input.status ?? existing.status;
  const nextExpiry = input.expiryDate ?? existing.expiryDate;
  const valid = nextStatus === RfidStatus.ACTIVE && nextExpiry.getTime() >= Date.now();

  return prisma.rfidRecord.update({
    where: { id },
    data: {
      ...input,
      accessAllowed: valid,
      activationDate:
        nextStatus === RfidStatus.ACTIVE && !existing.activationDate
          ? new Date()
          : existing.activationDate,
      lastVerificationDate: new Date(),
      lastVerificationResult: valid ? VerificationResult.VALID : VerificationResult.INVALID,
    },
    include: {
      member: { select: { id: true, memberCode: true, fullName: true, email: true } },
    },
  });
}

export async function verifyRfid(referenceNumber: string) {
  const record = await prisma.rfidRecord.findUnique({
    where: { referenceNumber },
    include: {
      member: {
        select: {
          id: true,
          memberCode: true,
          fullName: true,
          membership: { select: { status: true, validUntil: true } },
        },
      },
    },
  });

  if (!record) {
    return {
      valid: false,
      result: VerificationResult.INVALID,
      reason: 'RFID reference was not found.',
    };
  }

  const valid = isValid(record);
  const updated = await prisma.rfidRecord.update({
    where: { id: record.id },
    data: {
      accessAllowed: valid,
      lastVerificationDate: new Date(),
      lastVerificationResult: valid ? VerificationResult.VALID : VerificationResult.INVALID,
      ...(record.expiryDate.getTime() < Date.now() && record.status !== RfidStatus.EXPIRED
        ? { status: RfidStatus.EXPIRED }
        : {}),
    },
  });

  return {
    valid,
    result: valid ? VerificationResult.VALID : VerificationResult.INVALID,
    reason: valid ? 'RFID card is active and valid.' : 'RFID card is blocked, inactive or expired.',
    record: {
      id: updated.id,
      referenceNumber: updated.referenceNumber,
      cardNumber: updated.cardNumber,
      status: updated.status,
      expiryDate: updated.expiryDate,
      accessAllowed: updated.accessAllowed,
    },
    member: record.member,
  };
}
