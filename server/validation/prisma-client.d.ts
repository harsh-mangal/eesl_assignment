// Local validation substitute used only when Prisma engines cannot be downloaded.

export const Role: { readonly ADMIN: 'ADMIN'; readonly MEMBER: 'MEMBER' };
export type Role = (typeof Role)[keyof typeof Role];
export const AccountStatus: { readonly ACTIVE: 'ACTIVE'; readonly DISABLED: 'DISABLED' };
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];
export const MembershipStatus: { readonly ACTIVE: 'ACTIVE'; readonly INACTIVE: 'INACTIVE'; readonly EXPIRED: 'EXPIRED' };
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];
export const RfidStatus: { readonly ACTIVE: 'ACTIVE'; readonly INACTIVE: 'INACTIVE'; readonly BLOCKED: 'BLOCKED'; readonly EXPIRED: 'EXPIRED' };
export type RfidStatus = (typeof RfidStatus)[keyof typeof RfidStatus];
export const VerificationResult: { readonly VALID: 'VALID'; readonly INVALID: 'INVALID' };
export type VerificationResult = (typeof VerificationResult)[keyof typeof VerificationResult];
export const BookingStatus: { readonly PENDING: 'PENDING'; readonly CONFIRMED: 'CONFIRMED'; readonly COMPLETED: 'COMPLETED'; readonly CANCELLED: 'CANCELLED' };
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];
export const RoomStatus: { readonly AVAILABLE: 'AVAILABLE'; readonly UNAVAILABLE: 'UNAVAILABLE'; readonly MAINTENANCE: 'MAINTENANCE' };
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];
export const EventStatus: { readonly DRAFT: 'DRAFT'; readonly PUBLISHED: 'PUBLISHED'; readonly CANCELLED: 'CANCELLED'; readonly COMPLETED: 'COMPLETED' };
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];
export const InvoiceStatus: { readonly UNPAID: 'UNPAID'; readonly PAID: 'PAID'; readonly OVERDUE: 'OVERDUE'; readonly CANCELLED: 'CANCELLED' };
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];
export const PaymentStatus: { readonly PENDING: 'PENDING'; readonly SUCCESS: 'SUCCESS'; readonly FAILED: 'FAILED'; readonly REFUNDED: 'REFUNDED' };
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export const PaymentMethod: { readonly SIMULATED: 'SIMULATED'; readonly CASH: 'CASH'; readonly CARD: 'CARD'; readonly UPI: 'UPI' };
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
export const PaymentType: { readonly INVOICE: 'INVOICE'; readonly ROOM_BOOKING: 'ROOM_BOOKING'; readonly EVENT_BOOKING: 'EVENT_BOOKING' };
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];
export const NotificationType: { readonly GENERAL: 'GENERAL'; readonly EVENT: 'EVENT'; readonly BOOKING_CONFIRMATION: 'BOOKING_CONFIRMATION'; readonly BOOKING_CANCELLATION: 'BOOKING_CANCELLATION'; readonly PAYMENT_REMINDER: 'PAYMENT_REMINDER'; readonly MEMBERSHIP_EXPIRY: 'MEMBERSHIP_EXPIRY' };
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
export const NotificationAudience: { readonly ALL_MEMBERS: 'ALL_MEMBERS'; readonly ACTIVE_MEMBERS: 'ACTIVE_MEMBERS'; readonly SELECTED_MEMBER: 'SELECTED_MEMBER'; readonly MEMBERSHIP_TYPE: 'MEMBERSHIP_TYPE' };
export type NotificationAudience = (typeof NotificationAudience)[keyof typeof NotificationAudience];
export const ServiceType: { readonly RESTAURANT: 'RESTAURANT'; readonly ROOM: 'ROOM'; readonly EVENT: 'EVENT' };
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];
export const QrType: { readonly MEMBERSHIP: 'MEMBERSHIP'; readonly RESTAURANT_BOOKING: 'RESTAURANT_BOOKING'; readonly EVENT_TICKET: 'EVENT_TICKET' };
export type QrType = (typeof QrType)[keyof typeof QrType];
export const QrStatus: { readonly ACTIVE: 'ACTIVE'; readonly USED: 'USED'; readonly CANCELLED: 'CANCELLED'; readonly EXPIRED: 'EXPIRED' };
export type QrStatus = (typeof QrStatus)[keyof typeof QrStatus];
export const AdditionalServiceType: { readonly LIBRARY: 'LIBRARY'; readonly GYM: 'GYM'; readonly WORKSPACE: 'WORKSPACE'; readonly PARKING: 'PARKING' };
export type AdditionalServiceType = (typeof AdditionalServiceType)[keyof typeof AdditionalServiceType];

export namespace Prisma {
  class Decimal {
    constructor(value?: unknown);
    toNumber(): number;
    valueOf(): number;
    toString(): string;
    mul(value: unknown): Decimal;
  }
  type TransactionClient = any;
  type NotificationRecipientWhereInput = any;
  type MemberWhereInput = any;
  type NotificationWhereInput = any;
  type FeedbackWhereInput = any;
  const TransactionIsolationLevel: { readonly Serializable: 'Serializable' };
  class PrismaClientKnownRequestError extends Error {
    code: string;
    meta?: unknown;
  }
}

export class PrismaClient {
  constructor(options?: unknown);
  [key: string]: any;
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $transaction: any;
}
