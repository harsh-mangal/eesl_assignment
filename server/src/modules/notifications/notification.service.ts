import {
  AccountStatus,
  MembershipStatus,
  NotificationAudience,
  NotificationType,
  type Prisma,
} from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';

const ownInclude = {
  notification: true,
} as const;

function serializeOwnRecipient<T extends {
  id: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  notification: {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    audience: NotificationAudience;
    publishAt: Date;
    createdAt: Date;
  };
}>(recipient: T) {
  return {
    id: recipient.notification.id,
    recipientId: recipient.id,
    title: recipient.notification.title,
    message: recipient.notification.message,
    type: recipient.notification.type,
    audience: recipient.notification.audience,
    publishAt: recipient.notification.publishAt,
    createdAt: recipient.notification.createdAt,
    isRead: recipient.isRead,
    readAt: recipient.readAt,
  };
}

function publishedWhere(memberId: string) {
  return {
    memberId,
    notification: { is: { publishAt: { lte: new Date() } } },
  } satisfies Prisma.NotificationRecipientWhereInput;
}

export async function listOwnNotifications(
  memberId: string,
  query: {
    filter: 'ALL' | 'UNREAD';
    type?: NotificationType;
    page: number;
    limit: number;
  },
) {
  const skip = (query.page - 1) * query.limit;
  const where: Prisma.NotificationRecipientWhereInput = {
    ...publishedWhere(memberId),
    ...(query.filter === 'UNREAD' ? { isRead: false } : {}),
    ...(query.type ? { notification: { is: { publishAt: { lte: new Date() }, type: query.type } } } : {}),
  };

  const [items, total, unreadCount] = await Promise.all([
    prisma.notificationRecipient.findMany({
      where,
      include: ownInclude,
      orderBy: [{ notification: { publishAt: 'desc' } }, { createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    prisma.notificationRecipient.count({ where }),
    prisma.notificationRecipient.count({
      where: { ...publishedWhere(memberId), isRead: false },
    }),
  ]);

  return {
    items: items.map(serializeOwnRecipient),
    unreadCount,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getOwnNotification(memberId: string, notificationId: string) {
  const recipient = await prisma.notificationRecipient.findFirst({
    where: {
      notificationId,
      ...publishedWhere(memberId),
    },
    include: ownInclude,
  });
  if (!recipient) throw new ApiError(404, 'Notification not found.');
  return serializeOwnRecipient(recipient);
}

export async function markOwnNotificationRead(memberId: string, notificationId: string) {
  const recipient = await prisma.notificationRecipient.findFirst({
    where: {
      notificationId,
      ...publishedWhere(memberId),
    },
    include: ownInclude,
  });
  if (!recipient) throw new ApiError(404, 'Notification not found.');

  const updated = recipient.isRead
    ? recipient
    : await prisma.notificationRecipient.update({
        where: { id: recipient.id },
        data: { isRead: true, readAt: new Date() },
        include: ownInclude,
      });

  return serializeOwnRecipient(updated);
}

export async function markAllOwnNotificationsRead(memberId: string) {
  const result = await prisma.notificationRecipient.updateMany({
    where: {
      ...publishedWhere(memberId),
      isRead: false,
    },
    data: { isRead: true, readAt: new Date() },
  });
  return { updatedCount: result.count, unreadCount: 0 };
}

export async function getOwnUnreadCount(memberId: string) {
  const unreadCount = await prisma.notificationRecipient.count({
    where: { ...publishedWhere(memberId), isRead: false },
  });
  return { unreadCount };
}

function recipientWhere(input: {
  audience: NotificationAudience;
  selectedMemberId?: string;
  membershipType?: string;
}): Prisma.MemberWhereInput {
  switch (input.audience) {
    case NotificationAudience.ACTIVE_MEMBERS:
      return {
        membership: { is: { status: MembershipStatus.ACTIVE } },
        user: { is: { status: AccountStatus.ACTIVE } },
      };
    case NotificationAudience.SELECTED_MEMBER:
      return { id: input.selectedMemberId };
    case NotificationAudience.MEMBERSHIP_TYPE:
      return { membership: { is: { membershipType: input.membershipType } } };
    default:
      return {};
  }
}

function adminStatus(publishAt: Date) {
  return publishAt.getTime() <= Date.now() ? 'PUBLISHED' : 'SCHEDULED';
}

function serializeAdminNotification<T extends {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  audience: NotificationAudience;
  membershipType: string | null;
  publishAt: Date;
  createdAt: Date;
  updatedAt: Date;
  recipients: Array<{ isRead: boolean }>;
}>(notification: T) {
  const readCount = notification.recipients.filter((recipient) => recipient.isRead).length;
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    audience: notification.audience,
    membershipType: notification.membershipType,
    publishAt: notification.publishAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
    status: adminStatus(notification.publishAt),
    recipientCount: notification.recipients.length,
    readCount,
    unreadCount: notification.recipients.length - readCount,
  };
}

export async function createNotification(input: {
  title: string;
  message: string;
  type: NotificationType;
  audience: NotificationAudience;
  selectedMemberId?: string;
  membershipType?: string;
  publishAt?: Date;
}) {
  const members = await prisma.member.findMany({
    where: recipientWhere(input),
    select: { id: true },
  });
  if (members.length === 0) {
    throw new ApiError(422, 'No members match the selected notification audience.');
  }

  return prisma.$transaction(async (transaction) => {
    const notification = await transaction.notification.create({
      data: {
        title: input.title,
        message: input.message,
        type: input.type,
        audience: input.audience,
        membershipType:
          input.audience === NotificationAudience.MEMBERSHIP_TYPE
            ? input.membershipType
            : null,
        publishAt: input.publishAt ?? new Date(),
      },
    });

    await transaction.notificationRecipient.createMany({
      data: members.map((member) => ({
        notificationId: notification.id,
        memberId: member.id,
      })),
    });

    const created = await transaction.notification.findUniqueOrThrow({
      where: { id: notification.id },
      include: { recipients: { select: { isRead: true } } },
    });
    return serializeAdminNotification(created);
  });
}

export async function listAdminNotifications(query: {
  search?: string;
  type?: NotificationType;
  audience?: NotificationAudience;
  status?: 'PUBLISHED' | 'SCHEDULED';
  page: number;
  limit: number;
}) {
  const skip = (query.page - 1) * query.limit;
  const now = new Date();
  const where: Prisma.NotificationWhereInput = {
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search } },
            { message: { contains: query.search } },
          ],
        }
      : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.audience ? { audience: query.audience } : {}),
    ...(query.status === 'PUBLISHED' ? { publishAt: { lte: now } } : {}),
    ...(query.status === 'SCHEDULED' ? { publishAt: { gt: now } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: { recipients: { select: { isRead: true } } },
      orderBy: [{ publishAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    items: items.map(serializeAdminNotification),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getAdminNotification(id: string) {
  const notification = await prisma.notification.findUnique({
    where: { id },
    include: {
      recipients: {
        select: {
          isRead: true,
          readAt: true,
          member: {
            select: { id: true, memberCode: true, fullName: true, email: true },
          },
        },
        orderBy: { isRead: 'asc' },
      },
    },
  });
  if (!notification) throw new ApiError(404, 'Notification not found.');

  const summary = serializeAdminNotification(notification);
  return {
    ...summary,
    recipients: notification.recipients,
  };
}
