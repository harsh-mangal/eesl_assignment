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
