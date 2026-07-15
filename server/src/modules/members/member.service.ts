import {
  AccountStatus,
  AdditionalServiceType,
  MembershipStatus,
  QrStatus,
  QrType,
  RfidStatus,
  Role,
  VerificationResult,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';

const memberDetailInclude = {
  membership: true,
  rfidRecord: true,
  additionalServices: true,
  _count: {
    select: {
      restaurantBookings: true,
      roomBookings: true,
      eventBookings: true,
      invoices: true,
      payments: true,
    },
  },
} as const;

export async function getOwnProfile(memberId: string) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: memberDetailInclude,
  });
  if (!member) throw new ApiError(404, 'Member profile not found.');
  return member;
}

export async function updateOwnProfile(
  memberId: string,
  input: {
    fullName?: string;
    email?: string;
    mobileNumber?: string;
    address?: string;
    profilePhotoUrl?: string | null;
  },
) {
  return prisma.$transaction(async (transaction) => {
    const member = await transaction.member.findUnique({ where: { id: memberId } });
    if (!member) throw new ApiError(404, 'Member profile not found.');

    if (input.email && input.email !== member.email) {
      const existing = await transaction.member.findUnique({ where: { email: input.email } });
      if (existing) throw new ApiError(409, 'This email address is already in use.');
      await transaction.user.update({ where: { memberId }, data: { email: input.email } });
    }

    return transaction.member.update({
      where: { id: memberId },
      data: input,
      include: memberDetailInclude,
    });
  });
}

export async function getMembershipCard(memberId: string) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { membership: true, rfidRecord: true },
  });
  if (!member?.membership) throw new ApiError(404, 'Membership record not found.');

  return {
    logoText: 'Member Services',
    member: {
      fullName: member.fullName,
      memberCode: member.memberCode,
      profilePhotoUrl: member.profilePhotoUrl,
    },
    membership: {
      type: member.membership.membershipType,
      status: member.membership.status,
      validFrom: member.membership.validFrom,
      validUntil: member.membership.validUntil,
      digitalCardActive: member.membership.digitalCardActive,
    },
    rfid: member.rfidRecord
      ? {
          referenceNumber: member.rfidRecord.referenceNumber,
          cardNumber: member.rfidRecord.cardNumber,
          status: member.rfidRecord.status,
          accessAllowed: member.rfidRecord.accessAllowed,
          expiryDate: member.rfidRecord.expiryDate,
        }
      : null,
    qrToken: member.membership.verificationToken,
  };
}

export async function listMembers(query: {
  search?: string;
  membershipStatus?: MembershipStatus;
  page: number;
  limit: number;
}) {
  const skip = (query.page - 1) * query.limit;
  const where = {
    ...(query.search
      ? {
          OR: [
            { fullName: { contains: query.search } },
            { memberCode: { contains: query.search } },
            { email: { contains: query.search } },
            { mobileNumber: { contains: query.search } },
          ],
        }
      : {}),
    ...(query.membershipStatus
      ? { membership: { is: { status: query.membershipStatus } } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.member.findMany({
      where,
      include: memberDetailInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.member.count({ where }),
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

export async function getMember(id: string) {
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      ...memberDetailInclude,
      restaurantBookings: { take: 10, orderBy: { createdAt: 'desc' } },
      roomBookings: { take: 10, orderBy: { createdAt: 'desc' } },
      eventBookings: { take: 10, orderBy: { createdAt: 'desc' } },
      invoices: { take: 10, orderBy: { issueDate: 'desc' } },
      payments: { take: 10, orderBy: { paidAt: 'desc' } },
    },
  });
  if (!member) throw new ApiError(404, 'Member not found.');
  return member;
}

export async function createMember(input: {
  memberCode: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  address: string;
  profilePhotoUrl?: string;
  password: string;
  membershipType: string;
  membershipStatus: MembershipStatus;
  validFrom: Date;
  validUntil: Date;
}) {
  if (input.validUntil <= input.validFrom) {
    throw new ApiError(422, 'Membership validity end date must be after the start date.');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const verificationToken = `MEMBERSHIP-${input.memberCode}-${randomUUID()}`;

  return prisma.$transaction(async (transaction) => {
    const member = await transaction.member.create({
      data: {
        memberCode: input.memberCode,
        fullName: input.fullName,
        email: input.email,
        mobileNumber: input.mobileNumber,
        address: input.address,
        profilePhotoUrl: input.profilePhotoUrl,
        user: {
          create: {
            email: input.email,
            passwordHash,
            role: Role.MEMBER,
            status:
              input.membershipStatus === MembershipStatus.ACTIVE
                ? AccountStatus.ACTIVE
                : AccountStatus.DISABLED,
          },
        },
        membership: {
          create: {
            membershipType: input.membershipType,
            status: input.membershipStatus,
            validFrom: input.validFrom,
            validUntil: input.validUntil,
            digitalCardActive: input.membershipStatus === MembershipStatus.ACTIVE,
            verificationToken,
          },
        },
        rfidRecord: {
          create: {
            referenceNumber: `RFID-REF-${randomUUID()}`,
            cardNumber: `CARD-${Date.now()}`,
            status: RfidStatus.INACTIVE,
            expiryDate: input.validUntil,
            accessAllowed: false,
            lastVerificationResult: VerificationResult.INVALID,
          },
        },
        additionalServices: {
          create: {
            serviceType: AdditionalServiceType.LIBRARY,
            status: 'ACTIVE',
            validUntil: input.validUntil,
            details: {
              booksIssued: 0,
              booksDue: 0,
              outstandingFine: 0,
              borrowingLimit: 5,
            },
          },
        },
      },
      include: memberDetailInclude,
    });

    await transaction.qrToken.create({
      data: {
        token: verificationToken,
        type: QrType.MEMBERSHIP,
        status:
          input.membershipStatus === MembershipStatus.ACTIVE ? QrStatus.ACTIVE : QrStatus.EXPIRED,
        memberId: member.id,
        referenceId: member.membership!.id,
        expiresAt: input.validUntil,
      },
    });

    return member;
  });
}

export async function updateMember(
  id: string,
  input: {
    fullName?: string;
    email?: string;
    mobileNumber?: string;
    address?: string;
    profilePhotoUrl?: string | null;
    membershipType?: string;
    membershipStatus?: MembershipStatus;
    validUntil?: Date;
  },
) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.member.findUnique({
      where: { id },
      include: { membership: true },
    });
    if (!existing?.membership) throw new ApiError(404, 'Member not found.');

    if (input.email && input.email !== existing.email) {
      const duplicate = await transaction.member.findUnique({ where: { email: input.email } });
      if (duplicate) throw new ApiError(409, 'This email address is already in use.');
      await transaction.user.update({ where: { memberId: id }, data: { email: input.email } });
    }

    const memberData = {
      ...(input.fullName !== undefined && { fullName: input.fullName }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.mobileNumber !== undefined && { mobileNumber: input.mobileNumber }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.profilePhotoUrl !== undefined && { profilePhotoUrl: input.profilePhotoUrl }),
    };

    const membershipData = {
      ...(input.membershipType !== undefined && { membershipType: input.membershipType }),
      ...(input.membershipStatus !== undefined && {
        status: input.membershipStatus,
        digitalCardActive: input.membershipStatus === MembershipStatus.ACTIVE,
      }),
      ...(input.validUntil !== undefined && { validUntil: input.validUntil }),
    };

    if (Object.keys(memberData).length > 0) {
      await transaction.member.update({ where: { id }, data: memberData });
    }
    if (Object.keys(membershipData).length > 0) {
      await transaction.membership.update({ where: { memberId: id }, data: membershipData });
    }

    if (input.membershipStatus !== undefined) {
      await transaction.user.update({
        where: { memberId: id },
        data: {
          status:
            input.membershipStatus === MembershipStatus.ACTIVE
              ? AccountStatus.ACTIVE
              : AccountStatus.DISABLED,
        },
      });
      await transaction.qrToken.updateMany({
        where: { memberId: id, type: QrType.MEMBERSHIP },
        data: {
          status:
            input.membershipStatus === MembershipStatus.ACTIVE
              ? QrStatus.ACTIVE
              : QrStatus.EXPIRED,
        },
      });
    }

    return transaction.member.findUniqueOrThrow({
      where: { id },
      include: memberDetailInclude,
    });
  });
}

export async function replaceProfilePhoto(memberId: string, profilePhotoUrl: string) {
  const existing = await prisma.member.findUnique({ where: { id: memberId }, select: { profilePhotoUrl: true } });
  if (!existing) throw new ApiError(404, 'Member profile not found.');
  const data = await prisma.member.update({
    where: { id: memberId },
    data: { profilePhotoUrl },
    include: memberDetailInclude,
  });
  return { data, previousUrl: existing.profilePhotoUrl };
}
