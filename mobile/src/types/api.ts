export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type MemberSession = {
  id: string;
  email: string;
  role: 'MEMBER';
  member: {
    id: string;
    memberCode: string;
    fullName: string;
    profilePhotoUrl?: string | null;
    membershipStatus?: string | null;
    rfidStatus?: string | null;
  };
};

export type MemberDashboard = {
  member: {
    fullName: string;
    profilePhotoUrl?: string | null;
    memberCode: string;
  };
  membership?: {
    membershipType: string;
    status: string;
    validFrom: string;
    validUntil: string;
  } | null;
  rfid?: {
    status: string;
    accessAllowed: boolean;
  } | null;
  summary: {
    outstandingInvoiceAmount: number;
    upcomingBookings: number;
    upcomingEvents: number;
    unreadNotifications: number;
  };
};

export type MemberProfile = {
  id: string;
  memberCode: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  address: string;
  profilePhotoUrl?: string | null;
  membership?: {
    membershipType: string;
    status: string;
    validFrom: string;
    validUntil: string;
  } | null;
  rfidRecord?: {
    referenceNumber: string;
    cardNumber: string;
    status: string;
    accessAllowed: boolean;
    expiryDate: string;
  } | null;
};

export type MembershipCard = {
  logoText: string;
  member: {
    fullName: string;
    memberCode: string;
    profilePhotoUrl?: string | null;
  };
  membership: {
    type: string;
    status: string;
    validFrom: string;
    validUntil: string;
    digitalCardActive: boolean;
  };
  rfid: {
    referenceNumber: string;
    cardNumber: string;
    status: string;
    accessAllowed: boolean;
    expiryDate: string;
  } | null;
  qrToken: string;
};

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type ServiceType = 'RESTAURANT' | 'ROOM' | 'EVENT';

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
  feedback?: { id: string; rating: number } | null;
};

export type Room = {
  id: string;
  roomNumber: string;
  roomName: string;
  roomType: string;
  pricePerNight: number;
  guestCapacity: number;
  amenities: string[];
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE';
  imageUrl?: string | null;
  estimatedTotal: number;
};

export type RoomAvailability = {
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  numberOfNights: number;
  items: Room[];
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
  feedback?: { id: string; rating: number } | null;
};

export type EventBookingSummary = {
  id: string;
  bookingNumber: string;
  ticketNumber: string;
  ticketQuantity: number;
  amount: number;
  status: BookingStatus;
  qrToken: string;
  checkedInAt?: string | null;
  payments?: Payment[];
  event: {
    id: string;
    title: string;
    eventDate: string;
    startTime: string;
    venue: string;
    ticketPrice: number;
  };
  feedback?: { id: string; rating: number } | null;
};

export type MyBookings = {
  restaurant: RestaurantBooking[];
  room: RoomBooking[];
  event: EventBookingSummary[];
};

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'SIMULATED' | 'CASH' | 'CARD' | 'UPI';

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
};

export type Payment = {
  id: string;
  transactionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: 'INVOICE' | 'ROOM_BOOKING' | 'EVENT_BOOKING';
  status: PaymentStatus;
  paidAt: string;
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
  payments?: Payment[];
  feedback?: { id: string; rating: number } | null;
};

export type EventBookingResult = {
  booking: EventBooking;
  payment: Payment | null;
  receipt: {
    paid: boolean;
    amount: number;
    description: string;
  };
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
  payment?: Payment | null;
};

export type InvoiceListResult = {
  items: Invoice[];
  summary: { outstandingAmount: number; paidCount: number; unpaidCount: number };
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type InvoicePaymentResult = {
  invoice: Invoice;
  payment: Payment;
  receipt: {
    transactionId: string;
    invoiceNumber: string;
    memberName: string;
    description: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paidAt: string;
  };
};

export type NotificationType =
  | 'GENERAL'
  | 'EVENT'
  | 'BOOKING_CONFIRMATION'
  | 'BOOKING_CANCELLATION'
  | 'PAYMENT_REMINDER'
  | 'MEMBERSHIP_EXPIRY';

export type MemberNotification = {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  audience: 'ALL_MEMBERS' | 'ACTIVE_MEMBERS' | 'SELECTED_MEMBER' | 'MEMBERSHIP_TYPE';
  publishAt: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
};

export type NotificationListResult = {
  items: MemberNotification[];
  unreadCount: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
};


export type Feedback = {
  id: string;
  memberId: string;
  serviceType: ServiceType;
  rating: number;
  comments: string;
  createdAt: string;
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

export type AdditionalServiceType = 'LIBRARY' | 'GYM' | 'WORKSPACE' | 'PARKING';

export type AdditionalServiceAccount = {
  id: string;
  serviceType: AdditionalServiceType;
  status: string;
  effectiveStatus: string;
  details: Record<string, unknown>;
  validUntil?: string | null;
  createdAt: string;
  updatedAt: string;
};
