export type Role = 'ADMIN' | 'MEMBER';

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type AdminDashboard = {
  statistics: Record<string, number>;
  charts: {
    bookingsByService: Array<{ label: string; value: number }>;
    memberStatus: Array<{ label: string; value: number }>;
  };
};

export type Member = {
  id: string;
  memberCode: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  address: string;
  profilePhotoUrl?: string | null;
  membership?: {
    membershipType: string;
    status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
    validUntil: string;
  } | null;
  rfidRecord?: {
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'EXPIRED';
    referenceNumber: string;
  } | null;
};

export type RfidRecord = {
  id: string;
  referenceNumber: string;
  cardNumber: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'EXPIRED';
  expiryDate: string;
  accessAllowed: boolean;
  lastVerificationResult?: 'VALID' | 'INVALID' | null;
  member: Pick<Member, 'id' | 'memberCode' | 'fullName' | 'email'>;
};

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type RoomStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE';

export type RestaurantSlot = {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCapacity: number;
  availableCapacity: number;
  isAvailable: boolean;
};

export type Restaurant = {
  id: string;
  name: string;
  description: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  imageUrl?: string | null;
  slots: RestaurantSlot[];
  _count?: { bookings: number };
};

export type RestaurantBooking = {
  id: string;
  bookingNumber: string;
  guestCount: number;
  specialInstructions?: string | null;
  status: BookingStatus;
  qrToken: string;
  createdAt: string;
  restaurant: Restaurant;
  slot: RestaurantSlot;
  member: Pick<Member, 'id' | 'memberCode' | 'fullName' | 'email'>;
};

export type Room = {
  id: string;
  roomNumber: string;
  roomName: string;
  roomType: string;
  pricePerNight: number;
  guestCapacity: number;
  amenities: string[];
  status: RoomStatus;
  imageUrl?: string | null;
  _count?: { bookings: number };
  bookings?: Array<{
    id: string;
    bookingNumber: string;
    checkInDate: string;
    checkOutDate: string;
    status: BookingStatus;
  }>;
};

export type RoomBooking = {
  id: string;
  bookingNumber: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  numberOfNights: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  room: Room;
  member: Pick<Member, 'id' | 'memberCode' | 'fullName' | 'email'>;
};

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'SIMULATED' | 'CASH' | 'CARD' | 'UPI';
export type PaymentType = 'INVOICE' | 'ROOM_BOOKING' | 'EVENT_BOOKING';

export type Event = {
  id: string;
  title: string;
  description: string;
  category: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  ticketPrice: number;
  totalCapacity: number;
  availableSeats: number;
  status: EventStatus;
  bannerUrl?: string | null;
  _count?: { bookings: number };
};

export type Payment = {
  id: string;
  transactionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  status: PaymentStatus;
  paidAt: string;
  member: Pick<Member, 'id' | 'memberCode' | 'fullName' | 'email'>;
  invoice?: { id: string; invoiceNumber: string; description: string } | null;
  roomBooking?: { id: string; bookingNumber: string } | null;
  eventBooking?: { id: string; bookingNumber: string; ticketNumber: string; event: { title: string } } | null;
};

export type EventBooking = {
  id: string;
  bookingNumber: string;
  ticketNumber: string;
  ticketQuantity: number;
  amount: number;
  status: BookingStatus;
  qrToken: string;
  checkedInAt?: string | null;
  createdAt: string;
  event: Event;
  member: Pick<Member, 'id' | 'memberCode' | 'fullName' | 'email'>;
  payments: Payment[];
};

export type QrVerification = {
  valid: boolean;
  checkedIn?: boolean;
  qrType?: 'MEMBERSHIP' | 'RESTAURANT_BOOKING' | 'EVENT_TICKET';
  currentStatus?: 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED';
  reason: string;
  member?: {
    id: string;
    memberCode: string;
    fullName: string;
  };
  booking?: EventBooking | RestaurantBooking;
};


export type InvoiceStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type Invoice = {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  member: Pick<Member, 'id' | 'memberCode' | 'fullName' | 'email'>;
  payment?: Omit<Payment, 'member'> | null;
};

export type NotificationType =
  | 'GENERAL'
  | 'EVENT'
  | 'BOOKING_CONFIRMATION'
  | 'BOOKING_CANCELLATION'
  | 'PAYMENT_REMINDER'
  | 'MEMBERSHIP_EXPIRY';

export type NotificationAudience =
  | 'ALL_MEMBERS'
  | 'ACTIVE_MEMBERS'
  | 'SELECTED_MEMBER'
  | 'MEMBERSHIP_TYPE';

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  audience: NotificationAudience;
  membershipType?: string | null;
  publishAt: string;
  createdAt: string;
  updatedAt: string;
  status: 'PUBLISHED' | 'SCHEDULED';
  recipientCount: number;
  readCount: number;
  unreadCount: number;
};

export type AdminNotificationDetail = AdminNotification & {
  recipients: Array<{
    isRead: boolean;
    readAt?: string | null;
    member: Pick<Member, 'id' | 'memberCode' | 'fullName' | 'email'>;
  }>;
};

export type ServiceType = 'RESTAURANT' | 'ROOM' | 'EVENT';

export type Feedback = {
  id: string;
  memberId: string;
  serviceType: ServiceType;
  rating: number;
  comments: string;
  createdAt: string;
  member: Pick<Member, 'id' | 'memberCode' | 'fullName' | 'email'>;
  relatedBooking: {
    id: string;
    bookingNumber: string;
    ticketNumber?: string;
    status: BookingStatus;
    serviceName: string;
    serviceId: string;
    date: string;
    detail: string;
  } | null;
};

export type FeedbackListResult = {
  items: Feedback[];
  summary: {
    total: number;
    averageRating: number;
    ratingDistribution: Array<{ rating: number; count: number }>;
    byService: Array<{ serviceType: ServiceType; count: number }>;
  };
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type ReportType =
  | 'MEMBERS'
  | 'BOOKINGS'
  | 'PAYMENTS'
  | 'ROOM_AVAILABILITY'
  | 'RESTAURANT_BOOKINGS'
  | 'EVENT_BOOKINGS'
  | 'EVENT_ATTENDANCE'
  | 'FEEDBACK'
  | 'RFID_STATUS';

export type ReportFormat = 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'percent';

export type ReportColumn = {
  key: string;
  label: string;
  format?: ReportFormat;
  align?: 'left' | 'right' | 'center';
};

export type ReportResult = {
  reportType: ReportType;
  title: string;
  description: string;
  generatedAt: string;
  dateRange: { from: string | null; to: string | null };
  summary: Array<{ label: string; value: string | number; format?: ReportFormat }>;
  breakdown: Array<{ label: string; value: number }>;
  columns: ReportColumn[];
  rows: Array<Record<string, string | number | null>>;
};

export type AdminBookingType = 'RESTAURANT' | 'ROOM' | 'EVENT';

export type AdminBooking = {
  id: string;
  type: AdminBookingType;
  bookingNumber: string;
  ticketNumber?: string | null;
  serviceName: string;
  serviceDate: string;
  detail: string;
  amount?: number | null;
  status: BookingStatus;
  createdAt: string;
  member: Pick<Member, 'id' | 'memberCode' | 'fullName' | 'email'>;
  raw: Record<string, unknown>;
};

export type AdminBookingListResult = {
  items: AdminBooking[];
  summary: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type MemberDetail = Member & {
  membership?: (NonNullable<Member['membership']> & {
    validFrom: string;
    digitalCardActive: boolean;
  }) | null;
  rfidRecord?: (NonNullable<Member['rfidRecord']> & {
    id: string;
    cardNumber: string;
    expiryDate: string;
    accessAllowed: boolean;
    lastVerificationDate?: string | null;
    lastVerificationResult?: 'VALID' | 'INVALID' | null;
  }) | null;
  _count?: {
    restaurantBookings: number;
    roomBookings: number;
    eventBookings: number;
    invoices: number;
    payments: number;
  };
  restaurantBookings?: Array<{ id: string; bookingNumber: string; status: BookingStatus; createdAt: string }>;
  roomBookings?: Array<{ id: string; bookingNumber: string; status: BookingStatus; checkInDate: string; checkOutDate: string; totalAmount: number }>;
  eventBookings?: Array<{ id: string; bookingNumber: string; ticketNumber: string; status: BookingStatus; amount: number; createdAt: string }>;
  invoices?: Array<{ id: string; invoiceNumber: string; description: string; amount: number; status: InvoiceStatus; issueDate: string; dueDate: string }>;
  payments?: Array<{ id: string; transactionId: string; amount: number; status: PaymentStatus; paymentType: PaymentType; paidAt: string }>;
  additionalServices?: Array<{ id: string; serviceType: string; status: string; validUntil?: string | null; details: Record<string, unknown> }>;
};
