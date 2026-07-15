import type { AdditionalServiceType } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';

function serializeAccount(account: {
  id: string;
  serviceType: AdditionalServiceType;
  status: string;
  details: unknown;
  validUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const expired = account.validUntil ? account.validUntil.getTime() < Date.now() : false;
  return {
    ...account,
    effectiveStatus: expired ? 'EXPIRED' : account.status,
  };
}

export async function listOwnAdditionalServices(memberId: string) {
  const accounts = await prisma.additionalServiceAccount.findMany({
    where: { memberId },
    orderBy: { serviceType: 'asc' },
  });
  return accounts.map(serializeAccount);
}

export async function getOwnAdditionalService(memberId: string, serviceType: AdditionalServiceType) {
  const account = await prisma.additionalServiceAccount.findUnique({
    where: { memberId_serviceType: { memberId, serviceType } },
  });
  if (!account) throw new ApiError(404, `${serviceType.toLowerCase()} account not found.`);
  return serializeAccount(account);
}
