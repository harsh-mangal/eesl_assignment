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
  event: {
    id: string;
    title: string;
    eventDate: string;
    startTime: string;
    venue: string;
    ticketPrice: number;
  };
};

export type MyBookings = {
  restaurant: RestaurantBooking[];
  room: RoomBooking[];
  event: EventBookingSummary[];
};
