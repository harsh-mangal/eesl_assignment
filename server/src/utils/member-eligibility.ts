import { AccountStatus, MembershipStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { ApiError } from './api-error.js';

export async function ensureMemberCanBook(
  transaction: Prisma.TransactionClient,
  memberId: string,
) {
  const member = await transaction.member.findUnique({
    where: { id: memberId },
    include: { membership: true, user: true },
  });

  if (!member?.membership || !member.user) throw new ApiError(404, 'Member account not found.');
  if (member.user.status !== AccountStatus.ACTIVE) {
    throw new ApiError(403, 'This member account is disabled.');
  }
  if (
    member.membership.status !== MembershipStatus.ACTIVE ||
    member.membership.validUntil.getTime() < Date.now()
  ) {
    throw new ApiError(403, 'An active membership is required to create a booking.');
  }
  return member;
}
