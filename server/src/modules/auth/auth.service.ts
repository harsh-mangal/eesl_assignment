import { AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { signAccessToken } from '../../utils/jwt.js';

export async function login(identifier: string, password: string) {
  const normalized = identifier.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalized },
        { member: { is: { memberCode: identifier.trim().toUpperCase() } } },
      ],
    },
    include: {
      member: {
        include: {
          membership: true,
          rfidRecord: true,
        },
      },
    },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'Invalid email, member ID or password.');
  }

  if (user.status === AccountStatus.DISABLED) {
    throw new ApiError(403, 'This account is disabled. Please contact the administrator.');
  }

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    memberId: user.memberId ?? undefined,
  });

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      member: user.member
        ? {
            id: user.member.id,
            memberCode: user.member.memberCode,
            fullName: user.member.fullName,
            profilePhotoUrl: user.member.profilePhotoUrl,
            membershipStatus: user.member.membership?.status ?? null,
            rfidStatus: user.member.rfidRecord?.status ?? null,
          }
        : null,
    },
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      member: {
        select: {
          id: true,
          memberCode: true,
          fullName: true,
          profilePhotoUrl: true,
          membership: true,
          rfidRecord: true,
        },
      },
    },
  });

  if (!user) throw new ApiError(404, 'User not found.');
  return user;
}
